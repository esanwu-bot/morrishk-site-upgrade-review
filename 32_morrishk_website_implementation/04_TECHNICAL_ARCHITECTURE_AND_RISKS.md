# 技术架构、迁移与风险

| 项目 | 内容 |
|---|---|
| 文档编号 | 32-04 |
| 版本 | V1.0 |
| 依据 | `morrishk-site@cdb9c04` 静态审计 + 客户商务包 V1.0 |
| 边界 | 目标架构为建议，不代表客户已确认；不含生产变更 |

---

## 1. 现状架构

```text
Browser
  │  HTTPS (nginx, HSTS)
  ▼
Yii2 Basic 单体（PHP-FPM）
  ├─ 前台控制器 8 个（Site/Pro/Mfr/Blog/Page/Search/Cart/Lang）
  ├─ 后台模块 ejadmin（10 控制器，菜单级权限）
  ├─ 模型 18 个（ActiveRecord，snsii_ 前缀）
  ├─ FileCache
  ├─ SwiftMailer/SMTP
  └─ MySQL 5.6（morris，31 表，MyISAM 为主）
        │
        └─ 图片域名 img2.morrishk.net（外链）
```

已知缺口：无迁移、无队列、无操作级 RBAC、无审计、无发布门禁、无自动化测试、无 CI。

---

## 2. 目标架构（建议）

```text
CDN/WAF（客户采购）
  │
  ▼
nginx + PHP-FPM（建议升级到受支持版本）
  ├─ 表现层：现有 Yii2 控制器/视图（渐进改造）
  ├─ 领域层（新增，按需）：Product/SEO/Inquiry/Content 服务
  ├─ 集成层：Session B Business API 客户端（契约冻结后）
  ├─ 数据层：MySQL（字符集/引擎治理）+ 迁移工具
  ├─ 观测：GA4/GTM/Search Console + 询盘事件字典
  └─ 运维：发布/回滚脚本、备份恢复、审计日志
```

原则：

1. **渐进改造**，不一次性重写；先修 P0 风险与 SEO 技术基础。
2. **不把 Ds Bit / Business API 合并进站点代码**；通过契约调用。
3. 所有生产变更必须具备备份、回滚与发布记录。
4. 第一阶段只对 en 输出 head hreflang；不为未发布语种生成互指。

---

## 3. 数据与迁移

| 项 | 现状 | 风险 | 建议 |
|---|---|---|---|
| 表引擎 | 30 MyISAM / 1 InnoDB | 无事务、崩溃恢复弱 | 评估转 InnoDB；需停机/复制方案 |
| 字符集 | utf8mb3 | 生僻字符/emoji 不支持 | 迁移 utf8mb4，需全链路验证 |
| 版本 | MySQL 5.6.50（EOL） | 安全与兼容 | 升级 MySQL 8（需应用回归） |
| 迁移工具 | 无 | 结构漂移 | 引入版本化 DDL/migration |
| 主数据 | MPN/Brand/分类/状态口径不统一 | PDP 与分类页不可信 | P1 主数据规则冻结后再批量 |
| 生产数据 | 未导出、未备份 | 迁移不可回滚 | P0-02 备份 + 恢复演练 |

**迁移原则**：先盘点、后映射、再验证；禁止自动 301；未知 slug 404、永久删除 410；关键 URL 100% 核验。

---

## 4. SEO 技术架构

| 能力 | 现状 | 目标 |
|---|---|---|
| Title/Description | 控制器 `seo()` 注入；部分通用模板 | 页面类型化模板，唯一意图 |
| Canonical | 无 | 自指绝对 URL；分页/筛选按规则 |
| Robots meta | 无 | 搜索/询价/成功页 noindex；其余可索引 |
| Sitemap | 根 404；命令可生成 | sitemap index + 分类型 sitemap；robots 声明 |
| Schema | 无 | Organization/WebSite、CollectionPage、Product/Breadcrumb |
| Hreflang | 仅页脚语言链接 | 第一阶段 head 不输出；真实翻译后再双向互指 |
| 内链 | 分类/品牌/详情链接存在 | 规则化内链与面包屑 |

> 本轮已实现 robots meta 支持与搜索/询价 noindex（分支 `25afffb`），未部署；canonical/schema/sitemap 尚未实现。

---

## 5. 询盘与转化架构

### 5.1 现状链路（代码事实）

```text
PDP/询价页表单
  → JS 拦截提交
  → POST https://wm.zokoko.cn/api/sendEmail
      from_address: 106212887@QQ.COM（硬编码）
      to: sales@morrishk.net
  → 前端提示成功
后端 CartController::actionSend → redirect /order/success（无该控制器）
```

### 5.2 风险

| 风险 | 说明 | 级别 |
|---|---|---|
| 第三方外发 | 客户询盘数据离开自有系统，DPA/隐私与可用性不明 | P0 |
| 身份硬编码 | 发件人固定 QQ 邮箱，易被拒信/伪造 | P0 |
| 成功路由缺失 | `/order/success` 404，用户可能误判失败 | P0 |
| CSRF 关闭 | 表单可被跨站滥用 | P1 |
| 上传无限制 | 类型/大小/恶意文件风险 | P1 |
| 无有效询盘口径 | 无法区分垃圾/重复/测试 | P1 |

### 5.3 目标链路（建议）

```text
表单 → 同源后端（CSRF/速率限制/文件校验）
     → 询盘入库（状态：新询盘→待审核→有效→已分配→已报价→已成交/关闭）
     → 自有 SMTP 通知 + 审计日志
     → 成功页 200（noindex）
     → GA4/GTM 事件：rfq_click / rfq_start / rfq_submit_success
```

需客户确认：是否允许第三方邮件服务、发件域、数据保留期、审核人。

---

## 6. Session B Business API 依赖

| 依赖项 | 站点用途 | 需要的契约 | 当前状态 |
|---|---|---|---|
| 产品/MPN 查询 | PDP、分类、搜索数据 | 查询接口、字段、分页、错误码 | 未冻结 |
| 参数/证据 | PDP 参数与证据展示 | 数据结构、审核状态、公开范围 | 未冻结 |
| 媒体/Datasheet | 图片、PDF | URL/鉴权/缓存策略 | 未冻结 |
| 鉴权 | 服务间调用 | 身份、权限、限流 | 未冻结 |
| 发布状态 | 可索引门禁 | `RELEASE_APPROVED` 语义 | 未冻结 |

**结论**：站点可以在现有 MySQL 上继续 P0/P1 的 SEO 与页面工作；涉及 Ds Bit 数据/API 的任务标记 BLOCKED，等待 Session B 提供经核验的契约，不假设 API 可用。

---

## 7. 部署与回滚

| 项 | 现状 | 目标 |
|---|---|---|
| 代码发布 | 无脚本/无记录 | Git SHA + 发布清单 + 回滚脚本 |
| 配置 | 环境变量模板存在；生产注入未知 | 配置快照与密钥管理 |
| 数据库 | 无备份脚本 | 定时备份 + 恢复演练 |
| 回滚 | 无演练 | 代码/配置/数据三类回滚步骤 |
| 监控 | GA4/GTM/Yandex/Clarity | 增加可用性/错误/索引监测 |

本轮未部署、未修改服务器、未做 DNS/CDN 变更。

---

## 8. 风险登记（合并）

| ID | 风险 | 概率 | 影响 | 级别 | 应对 | 责任 |
|---|---|---|---|---|---|---|
| R-01 | 启动事实已确认，但合同/报价/范围未冻结、启动原件未归档 | 中 | 范围/费用争议 | P0 | P0-05B 跟踪；119 项按“规划建议范围”表述；非生产开发继续 | 项目负责人/商务 |
| R-02 | 询盘第三方外发/身份硬编码 | 高 | 合规/丢单 | P0 | P1-05 改造；客户确认 | 双方 |
| R-03 | `/order/success` 缺失 | 高 | 转化失败 | P0 | 修复路由或改成功页 | 开发 |
| R-04 | 生产版本与 Git 不一致 | 高 | 无法回滚/审计 | P0 | P0-06 部署 SHA | 运维 |
| R-05 | 无测试/CI | 高 | 回归风险 | P0 | P0-04/P0-08 | 开发 |
| R-06 | PHP/MySQL EOL | 中 | 安全/兼容 | P0 | P0-02 升级评估 | 运维 |
| R-07 | sitemap 404 / canonical 缺失 | 高 | 收录差 | P1 | P1-07 | SEO/开发 |
| R-08 | 80 域名与 en 首期冲突 | 中 | 索引/hreflang 混乱 | P1 | P1-06 | SEO |
| R-09 | 数据迁移丢失/URL 断链 | 中 | 流量损失 | P1 | P2-02 盘点/回归 | 迁移 |
| R-10 | Session B API 未冻结 | 高 | P2 阻塞 | P1 | 契约门禁；不假设可用 | 双方技术 |

---

## 9. 架构结论

- 现有 Yii2 单体可支撑 P0/P1 的渐进改造，不需要先重写。
- 上线前必须先解决询盘链路与生产版本可追溯；否则任何 SEO 投入都可能被转化/回滚问题抵消。
- Ds Bit 与 Business API 是 P2 依赖，不是本轮站点代码的前置条件。

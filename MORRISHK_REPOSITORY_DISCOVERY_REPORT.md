# MORRISHK 主项目现状调研报告（Repository Discovery Report）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DISCOVERY-001 |
| 版本 | v1.0.1（按 Reviewer 第一轮复核 C1–C7 最小修订；结论与证据基线不变） |
| 日期 | 2026-11-17 |
| 执行人 | Morrishk 主项目执行 Agent |
| 审核人 | Reviewer（独立审核，本报告不构成验收） |
| 调查性质 | **只读盘点**：未修改任何生产代码、配置、数据库结构或数据；未执行迁移；未切换分支；未升级依赖；未连接或调用生产 Ds Bit / Business API；未执行真实社媒或邮件发送 |
| 结论性质 | 只回答「现在有什么、在哪里、处于什么状态」；**不构成**产品架构决策、开发排期、生产可用性承诺，也不包含 P0–PN 路线图 |
| 主项目目录 | `E:\workspace\独立站\morries` |
| 旧站代码 | `E:\workspace\独立站\morries\newPlan\morrishk.net` |
| 新平台工程 | `E:\workspace\独立站\morries\platform` |
| Ds Bit 引擎 | `E:\workspace\icpdf-extractor` |
| 历史资料仓 | `E:\workspace\独立站\morrishk-site-upgrade-review` |

> 本报告所有「已核实」均为**代码/文件快照级核实**，不等于线上实时验证。凡未能取得运行证据者，一律标注「无法验证」或「未执行」，不推定为通过。

### 0.1 v1.0.1 修订记录（仅文档）

| 编号 | Reviewer 意见 | 修订位置 | 处理 |
|---|---|---|---|
| C1 | 摘要把「关闭 CSRF」与「无登录鉴权」混写 | §0、§10.2 | 拆分为「3 个控制器无登录鉴权」与「7 个控制器关闭 CSRF」两项独立风险 |
| C2 | P1-9 写「两套 API」，正文实为三套 | §7.3、§10.2 | 统一为三套口径，并区分两套候选/本地契约与一套归档原型 |
| C3 | API 冻结阻断项不完整 | §7.1、§7.4 | 补 `MPN-NORM-v1`（`PROPOSED`）、状态枚举协调（B6）、证据公开范围（B8/IQ-08）等 |
| C4 | SQL 拼接直接定性为注入 | §6.2、§8.3 | 补用户输入→SQL 证据链，改称「注入风险待验证」；未构造利用验证 |
| C5 | FE-8 仅凭 `UrlRules` 判 404 | §5.2 | 补「无 `OrderController`、无 `/order/*` 规则、catch-all 只匹配单段」证据 |
| C6 | 「明文凭据入库」易误解为数据库 | §0、§8.3、§10.1 | 改为「代码配置中明文硬编码」，区分 SMTP 与 `cookieValidationKey` |
| C7 | 「可复现」「邮件中继」表述过强 | §5.2、§8.3、§11 | 改为「静态审计」；邮件接口补公开可达与用户可控输入证据，注明未实际发送 |

> 本节仅记录文档修订，不改动任何代码、配置、数据库、契约状态或 Session A/B 决策。

---

## 0. 结论摘要（A–F）

| 类别 | 结论 | 依据摘要 |
|---|---|---|
| **A. 可复用** | 旧站商品/分类/搜索/详情/询盘/内容/多语词条主链路代码完整存在；Ds Bit 解析引擎、证据模型与运行产物可复用；`platform/` 的组件层、i18n 骨架、API 适配层与 Phase 1 组件可复用 | §5、§6、§7 |
| **B. 需修复/重构** | 旧站存在静态审计发现的代码级缺陷与安全隐患（未经 Reviewer 逐项复现）：询盘走第三方外发、3 个后台控制器无登录鉴权（News/Help/Api）、7 个后台控制器关闭 CSRF、日志接口引用不存在的表且将用户可控参数直接拼接进 SQL、`YII_DEBUG=true` 写进入口、代码配置中明文硬编码 SMTP 凭据与 `cookieValidationKey`、价格阶梯解析后未渲染、移动端搜索未接线、`/order/success` 无对应控制器/路由、Help 模块引用不存在模型 | §5、§6、§8 |
| **C. 需新建** | 营销工作台、线索管理与归因、客户账户、订单跟踪、审计闭环、备份恢复、任务队列、RBAC、Business API 服务端实现 | §7、§9（FR 矩阵） |
| **D. 受 Ds Bit 阻断** | 参数证据上线、三层闸门、参数持久化、产品-文档关联、模型辅助抽取、跨页跨表合并 | §7 |
| **E. 本期不纳入** | 按范围确认书原处置：`FR-1-016`、`FR-1-046`、`FR-1-059`、`FR-1-060`；社媒真实发布/视频制作虽为「尚未具备」，原处置均为「待确认」，本报告不代为排除 | §9 |
| **F. 需产品负责人确认** | 新版语种集合冲突（客户决策 `fr` vs 代码 `id`）、品牌/供应商主数据归属、询盘归因口径、缓存策略、客户账户是否本期、Ds Bit 生产授权范围 | §12 |

---

## 1. 基线与时间（R1）

### 1.1 调查时点与代码基线

| 对象 | 基线 | 证据 |
|---|---|---|
| 调查时点 | 2026-11-17 | 本报告 |
| 旧站代码 | 目录快照；**未发现 `.git`**，无法从版本库证明线上部署版本 | 目录枚举 |
| 旧站依赖 | `composer.json` / `composer.lock` 存在；**仓库内未见 `vendor/`** | 目录枚举 |
| 新平台 | `platform/` 为在建工程；前端仅有组件与 mock，无页面 | 附录 A |
| Ds Bit | 分支 `backup/full-local-20261114`，HEAD `600439a`；工作树存在未提交改动 | 附录 F |
| 送审仓 | `main@cf150a3`；仅 1 个未跟踪 docx | 附录 F |

### 1.2 数据库证据

| 项 | 值 | 证据级别 |
|---|---|---|
| 生产数据导出 | `E:\data\morris_2024-11-30_14-01-50_mysql_data_VsRoT.sql\morris_2024-11-30_14-01-50_mysql_data_VsRoT.sql`，47,820,894,346 字节，mtime 2024-11-30 | E1（文件属性实测） |
| 同目录压缩包 | `morris_2024-11-30_14-01-50_mysql_data_VsRoT.zip`，1,716,412,556 字节 | E1 |
| 结构审计 | `mysql_schema_audit/`，源文件同尺寸、SHA-256 `7a59ac15…6717`，MySQL 5.6.50 | E1（审计报告） |
| 历史上下文 | `04_database/` 6 个文件与 `mysql_schema_audit/` **SHA-256 逐一同值** | E1（实测） |
| 本机数据库连接 | `127.0.0.1:3306` 连接超时（TimeoutError），本轮**未取得任何实时库数据** | E1（实测） |

> 说明：47.8 GB 数据文件本轮**未整体解析**；数据规模引用 `mysql_schema_audit/07_extraction_report.md` 的语句计数，该计数**不是行数**（mysqldump 为批量 INSERT）。

### 1.3 运行时记录

| 项 | 值 | 来源与级别 |
|---|---|---|
| 生产 PHP | 7.4.33-FPM（文档记录，本轮未探针） | `08_php84_compatibility/`（E3） |
| 数据库快照版本 | MySQL 5.6.50 | 审计报告（E1） |
| 旧站框架 | Yii2 Basic（`yii\web\Application`） | `web/index.php`、`config/web.php`（E1） |
| 新平台运行时 | Node `>=22 <23`；Next.js 16.4.6 / React 19.3.1 | `platform/web/package.json`（E1） |
| Ds Bit 运行时 | Python 3.13（部署文档）；FastAPI 本地桩 | `deploy/dsb/README.md`、`workbench/b2b/serve_b2b.py`（E1/E3） |

### 1.4 基线结论

1. 旧站**没有版本库**，因此「仓库代码 = 线上代码」**无法证明**；只能证明「仓库代码与 2024-11-30 数据结构可对应」。
2. 旧站**没有 `vendor/`**，无法在本机直接运行；任何「运行验证」都需要先 `composer install`，本轮未执行。
3. 结构审计与 `04_database` 内容一致，可互为佐证；两者都不能证明线上当前状态。

---

## 2. Git 与部署证据

### 2.1 版本控制

| 对象 | 状态 | 影响 |
|---|---|---|
| `E:\workspace\独立站\morries` | 未发现 `.git` | 无法 diff、无法回溯、无法证明部署版本 |
| `newPlan\morrishk.net` | 无 `.git` | 同上 |
| `platform` | 无独立 `.git`（随主目录） | 新工程历史不可追溯 |
| `icpdf-extractor` | 有 `.git`，工作树脏 | 生产部署基线需以提交 + 镜像标签双重确认 |
| `morrishk-site-upgrade-review` | `main@cf150a3`，干净（仅 1 个未跟踪 docx） | 本报告将作为新增文件提交 |

`icpdf-extractor` 未提交项（摘要）：

- 已暂存：`deploy/dsb/*`（Dockerfile、compose、nginx、rollback.sh）、`workbench/_g0/*`、`workbench/b2b/qa_console.html`、`workbench/serve_parser.py` 修改、`workbench/index.html` 修改。
- 未跟踪：`workbench/b2b/serve_b2b.py`、`deploy/dsb/evidence/`、`docs/g0_evidence/`。

### 2.2 部署资产

| 资产 | 旧站仓库 | 新平台 | Ds Bit |
|---|---|---|---|
| Dockerfile / compose | 有 `docker-compose.yml`（`yiisoftware/yii2-php:7.4-apache`，端口 8000，**开发用**） | 无 | 有 `deploy/dsb/Dockerfile`、`docker-compose.yml` |
| Nginx 配置 | **无** | 无 | 有 `deploy/dsb/nginx/*.conf` |
| 发布脚本 | **无** | 无 | 有 `rollback.sh` |
| 备份脚本 | **无** | 无 | 未发现 |
| 环境变量样例 | **无 `.env*`** | 无 `.env*` | 有 compose 环境变量 |
| CI/CD | **无** | 无 | 未发现 |

### 2.3 部署风险事实

| 编号 | 事实 | 证据 |
|---|---|---|
| DEP-1 | 入口脚本硬编码 `YII_DEBUG=true`、`YII_ENV='dev'`，注释写着「部署生产时注释掉」，但当前文件未注释 | `web/index.php:4-5` |
| DEP-2 | 调试/Gii 模块是否加载取决于 `YII_ENV`；入口为 `dev` 时风险面扩大 | `config/web.php` |
| DEP-3 | 旧站无 Nginx/vhost 配置，无法核对 URL 重写、TLS、上传目录权限 | 目录枚举 |
| DEP-4 | 无部署记录、无发布单、无回滚脚本 | 目录枚举 |
| DEP-5 | `codeception.yml` 指向 `tests/`，实际无该目录 | `codeception.yml`、目录枚举 |
| DEP-6 | 生产 PHP 7.4.33 与 `composer.json` 的 `>=5.6` 约束不冲突，但当前依赖树是否可在 PHP 8.4 运行**未验证** | `composer.json`、`08_php84_compatibility/` |

---

## 3. 技术架构（R2）

### 3.1 系统全景

```text
┌──────────────────────────────────────────────────────────────────┐
│ 旧站 Yii2（生产，代码快照；URL 形如 /products/12345678/part.html） │
│  · 8 个前台控制器（32 个 action），另有 2 个 *_bak 备份文件       │
│  · modules/ejadmin：10 个控制器 / 43 个 action                     │
│  · 31 张 snsii_* 表（30 MyISAM + 1 InnoDB，无外键）                │
│  · FileCache（无 Redis）；session 默认文件；Gmail SMTP             │
│  · 询盘：商品页/购物车 → https://wm.zokoko.cn/api/sendEmail（外发）│
└───────────────┬──────────────────────────────────────────────────┘
                │ 不落本站库（商品页询价）
                ▼
┌───────────────────────────┐      ┌──────────────────────────────┐
│ Ds Bit / icpdf-extractor  │      │ 新平台 platform/             │
│ · 本地 FastAPI 工作台      │      │ · Next.js 16 组件层（无页面）│
│ · 确定性解析 + 证据模型    │      │ · 5 语 i18n 骨架（含 id 缺 fr）│
│ · 无 DB、无 LLM            │      │ · API 适配层 mock/real       │
│ · G0 公网冻结（ALLOW_PARSE=0）│   │ · 12 张 morris_v2 迁移表     │
└───────────────────────────┘      └──────────────────────────────┘
```

### 3.2 旧站组件

| 组件 | 配置/实现 | 证据 |
|---|---|---|
| 路由 | `enablePrettyUrl=true`、`showScriptName=false`、`suffix='.html'` | `config/web.php:120-124` |
| 路由规则 | `params['UrlRules']`：商品 `/products/<8位id>/<PartUrl>`、制造商、分类、购物车、博客、信息页、后台入口 | `config/params.php` |
| 缓存 | `yii\caching\FileCache`，`directoryLevel=3` | `config/web.php:24-25` |
| 会话 | 未显式配置 `session` 组件 → Yii 默认文件会话 | `config/web.php` |
| 用户身份 | `app\modules\ejadmin\models\SnSiiManage`（后台账号即前台登录身份） | `config/web.php` |
| 邮件 | Gmail SMTP（ssl:465），用户名/密码明文写在配置 | `config/web.php:55-56`、`config/console.php:34-35` |
| 日志 | FileTarget：`@runtime/logs/app.log`，levels `error/warning/info`，2 MB × 20 | `config/web.php:106-116` |
| i18n | `PhpMessageSource`，`frontend => main.php`；`messages/` 80 个语言目录 | `config/web.php`、`messages/` |
| 资产 | Bootstrap 4、Kartik Grid/Editable、CKEditor、Imagine | `composer.json` |
| 依赖 | `google/apiclient`、`elasticsearch`、`querylist`、`phpexcel` | `composer.json` |

### 3.3 旧站控制器与动作

| 控制器 | action 数 | 说明 |
|---|---|---|
| `SiteController` | 5 | 首页、测试路由、登录、登出、错误 |
| `CartController` | 9 | RFQ 清单、增删改、上传、发信、热卖询价、成功页 |
| `ProController` | 4 | 分类列表、子类、商品详情 |
| `PageController` | 4 | 信息页、联系表单、邮件接口（另含 `_bak`） |
| `BlogController` | 3 | 新闻/博客索引、标签、详情 |
| `LangController` | 4 | 语言词条、域名列表等调试输出 |
| `MfrController` | 2 | 制造商列表/详情 |
| `SearchController` | 1 | 型号搜索 |
| `PageController_bak0609` / `ProController_bak` | 1 / 4 | 备份文件，**不应部署** |

### 3.4 新平台 `platform/`

| 层 | 状态 | 证据 |
|---|---|---|
| 页面 | **不存在**：`src/app/` 仅 `globals.css`，无 `page.tsx` / `layout.tsx` | 目录枚举 |
| 组件 | 9 个：商品/搜索/库存/UI 组件 | `src/components/*` |
| i18n | `LOCALE_CODES = ["en","de","ja","es","id"]`；5 个 `messages/*.json` | `src/i18n/locales.ts:18` |
| API 适配 | `client.ts`：`API_MODE=mock` 默认，`real` 走 `http://127.0.0.1:8080/api/v1` | `src/lib/api/client.ts` |
| Mock | `catalog/home/inquiry/search` 四组 | `src/lib/api/mock/*` |
| 契约 | 本地 OpenAPI `1.0.0-phase1`，9 个路径 | `docs/phase1/03-api-contract.yaml` |
| 迁移 | 12 张表，4 组 up/down，**0 条 ALTER** | `db/migrations/*.up.sql` |
| 测试 | 仅 `locales.test.ts` 1 个；vitest 已配置 | `src/i18n/locales.test.ts` |

### 3.5 Ds Bit 结构

| 层 | 状态 | 证据 |
|---|---|---|
| 解析 | 确定性 PDF 解析 + 候选注册；`Phase 1 complete`；无 LLM | `README.md:1-6` |
| 证据 | 文档 SHA-256 + page + bbox + raw text | `docs/DATA_CONTRACT.md` |
| 工作台 | `workbench/serve_parser.py`；本地 B2B 桩 `workbench/b2b/serve_b2b.py` | 文件 |
| 运行产物 | `runs/` 117 个目录 | 目录计数 |
| 测试 | `tests/` 47 个 `test_*.py`（**本轮未执行**） | 目录计数 |
| 部署 | G0 `dsb.0668xgwl.com`：只绑回环 + Nginx IP 白名单 + `ALLOW_PARSE=0` | `deploy/dsb/README.md` |
| 审计 | `src/icpdf/audit/__init__.py` 仅占位 | 文件 |

---

## 4. 数据库与商品主数据（R3）

### 4.1 旧库结构事实

| 项 | 值 | 证据 |
|---|---|---|
| 表数 | 31（30 MyISAM + 1 InnoDB） | `mysql_schema_audit/01_schema.sql` |
| 字段数 | 210 | `07_extraction_report.md` |
| 索引 / 主键 | 100 / 30 | 同上 |
| 外键 / 视图 / 触发器 / 存储过程 | 0 / 0 / 0 / 0 | 同上 |
| 字符集 | `utf8`（utf8mb3），`utf8_general_ci` | 同上 |
| 源文件 | 47,820,894,346 字节；SHA-256 `7a59ac15…6717` | 同上 |
| 兼容性扫描 | 0 BLOCK；2 TARGET；5 BEHAVIOR；5 NOTE | 同上 |

### 4.2 核心表与数据线索

| 表 | 字段 | 索引 | AUTO_INCREMENT | INSERT 语句数 | 备注 |
|---|---|---|---|---|---|
| `snsii_product` | 20 | 10 | 10,093,686 | 7,889 | 商品主表；`PartNumber(50)`、`Md5(32)` 唯一 |
| `snsii_product_cache` | 2 | 1 | 10,093,685 | 36,881 | `ProId → Json` 整页缓存 |
| `snsii_product_search` | 5 | 5 | 10,093,686 | 387 | 搜索/分类索引表 |
| `snsii_product_category` | 11 | 4 | 1,055 | 1 | `Pid` 树 |
| `snsii_product_hot` | 7 | 3 | 9 | 1 | 热销位 |
| `snsii_product_time*` | 4–6 | 4–6 | 52 / 52,003 / 3,636,429 | 1 / 4 / 27 | 解析/时间相关临时表 |
| `snsii_cart` | 16 | 3 | 2,397 | 1 | 询盘/订单 |
| `snsii_contact` | 9 | 3 | 1,606 | 1 | 联系表单 |
| `snsii_news` | 12 | 5 | 186 | 1 | 新闻/博客 |
| `snsii_info` | 8 | 3 | 6 | 1 | 信息页 |
| `snsii_manage` | 9 | 5 | 195 | 1 | 后台账号（含 `PassWord`/`NavList`/`Role`） |
| `snsii_map` | 3 | 2 | 10,093,674 | 613 | URL 映射 |
| `snsii_attr_name` / `_lang` | 6 / 5 | 3 / 5 | 1,690 / 33,762 | 1 / 3 | 参数名与翻译 |
| `snsii_ad` | 8 | 1 | 4 | 1 | 广告位 |
| `snsii_nav` | 6 | 3 | 94 | 1 | 后台菜单 |
| `snsii_supplier` | — | — | — | — | 供应商/品牌数据 |
| `snsii_language` | 11 | 3 | 203 | 1 | 国家/语言清单 |
| 空表 | `snsii_cf_dns`、`snsii_news_category`、`snsii_product_cache_copy1`、`snsii_product_so`、`snsii_product_stock`、`snsii_track_order` | — | — | 0 | 无数据 |

> 关键限制：`snsii_product` 的 7,889 条 INSERT 是批量语句，**不能**据此得出精确商品行数；`AUTO_INCREMENT=10,093,686` 只说明历史写入规模。

### 4.3 商品参数的三套模型

| 模型 | 载体 | 字段/语义 | 状态 |
|---|---|---|---|
| 旧站参数 | `snsii_product.DataAttr`（JSON 文本） | 名称 + 值；名称用 `Yii::t('attr', md5(Name))` 翻译 | 生产快照在用 |
| 新平台参数 | `pd_param_def` / `pd_model` 等 12 表 | 结构化定义 + 模型 + 文档 + 询盘 + 出站 | 仅迁移，无数据 |
| Ds Bit 候选 | `src/icpdf/domain/parameter.py` + `runs/<run_id>` | 候选 + 证据 + 状态（Formal/Quarantine/Rejected） | 可运行，未入生产库 |

### 4.4 新平台迁移（12 表）

| 迁移 | 表 | 关键点 |
|---|---|---|
| `20261116_0001__pd_dimension_tables` | `pd_brand`、`pd_category`、`pd_param_def` | 品牌/分类/参数定义 |
| `20261116_0002__pd_model_core` | `pd_model`、`pd_model_doc` 等 3 表 | `mpn_norm`/`mpn_norm_loose` 生成列（ascii）；`UNIQUE uk_mpn_norm(mpn_norm)`；`UNIQUE uk_mpn_slug`；`UNIQUE uk_legacy(legacy_id)` |
| `20261116_0003__biz_inquiry` | `biz_inquiry` 等 5 表 | `lead_no`、幂等键、指纹、`ip_hash`、事件、序列 |
| `20261116_0004__sync_outbox` | `sync_outbox` | 出站同步队列表 |

**结构冲突（需评审）**：`pd_model` 仅对 `mpn_norm` 建唯一键，而 `14_/IQ01` 的 `DECIDED` 口径是 **MPN + Brand 复合身份**。迁移尚未反映该决策。

### 4.5 数据层风险

| 编号 | 风险 | 证据 |
|---|---|---|
| DB-1 | 全库 MyISAM、无外键、无事务，写入中断可能留下半条记录 | `01_schema.sql` |
| DB-2 | `utf8mb3` 无法存储 4 字节字符（emoji、部分符号） | 表字符集 |
| DB-3 | `snsii_product_cache` 整页 JSON 与商品表双写，缺少失效机制证据 | `ProController.php:269` |
| DB-4 | 6 张空表存在（含 `snsii_track_order`），但对应功能被列为「部分具备」 | 表清单 |
| DB-5 | 旧库与新库命名空间完全分离（`snsii_*` vs `morris_v2_*`/`pd_*`），无迁移映射表 | 迁移文件 |
| DB-6 | 47.8 GB 数据文件的精确行数、重复商品、脏数据**未统计** | 本轮未解析 |

---

## 5. 前台功能实现（R4）

### 5.1 已核实可用的主链路

| 功能 | 实现 | 证据 |
|---|---|---|
| 首页 | 供应商、新闻、分类、随机商品、热销 | `controllers/SiteController.php:27-129` |
| 分类树 | `Pid=0` 顶级 6 个 + 子类；`params['CatList']` | `commands/SnSiiController.php:29-52` |
| 分类列表/子类 | 缓存分页、面包屑、SEO | `controllers/ProController.php:40-200` |
| 商品详情 | 缓存优先（`snsii_product_cache`），否则查库；参数 JSON 展开 | `controllers/ProController.php:262-330` |
| 型号搜索 | `PartNumber LIKE 'kw%'`，50/页 | `controllers/SearchController.php:47` |
| 零结果 | 跳转 `/cart/index?part=...` 预填 RFQ | `controllers/SearchController.php` |
| RFQ | session `CartList` → `snsii_cart`；附件上传到 `web/uploads` | `controllers/CartController.php` |
| 联系表单 | `contact-us` 写 `snsii_contact` | `controllers/PageController.php:30-40` |
| 新闻/博客 | `snsii_news` + 标签表 | `controllers/BlogController.php` |
| 信息页 | `snsii_info` 按 `Links` 取 | `controllers/PageController.php` |
| 多语种 | Host → `DuoLang` → `Yii::$app->language` | `commands/SnSiiController.php:70-79` |
| SEO | title/keywords/description 元标签 | `commands/SnSiiController.php:seo()` |
| 分析 | GA4 `G-TH2K769D0K`、GTM `GTM-PSPFVS47`、Yandex `96097301`、Clarity `kjywme44gi` | `views/layouts/main.php:21-64` |
| sitemap/robots | 命令生成静态文件 | `commands/MapController.php:145-210` |
| Google URL 提交 | `google/apiclient` Indexing API | `commands/CController.php:115-147` |

### 5.2 代码级缺陷（静态审计，未运行）

| 编号 | 缺陷 | 位置 | 影响 |
|---|---|---|---|
| FE-1 | 商品页询价直接 POST 到第三方 `wm.zokoko.cn`，`from_address`/`to` 硬编码；**不落本站库** | `views/pro/item.php:195-238` | 询盘无法统计、无法归因、依赖第三方可用性 |
| FE-2 | 购物车页同样外发到第三方，并上传图片到第三方 | `views/cart/index.php:164,238` | 同上 |
| FE-3 | `MfrController` 缓存读取键 `MIndexs` 与写入键 `MIndex` 不一致 | `controllers/MfrController.php:33,36` | 缓存永不命中 |
| FE-4 | `MfrController` 查询 `select('id,,Pid,...')` 双逗号 | `controllers/MfrController.php:68` | 该查询会 SQL 语法错误 |
| FE-5 | 移动端搜索框无 `form`、无 `name`、无 `action` | `views/layouts/header.php:73-77` | 移动端搜索不可用 |
| FE-6 | 价格阶梯 `PriceNew` 被 JSON 解码后**从未渲染** | `views/pro/item.php:29-33` | 阶梯价功能实际不可见 |
| FE-7 | 商品图集仅单张 `BigImg`，无多图 | `views/pro/item.php:69-76` | 「图集」名不符实 |
| FE-8 | `actionHotPart` 保存后跳转 `/order/success`；`controllers/` 无 `OrderController`，`UrlRules` 无 `/order/*` 规则，唯一 catch-all `/<Links>` 只匹配单段路径；同文件另有 `actionSuccess`（对应 `/cart/success`），与跳转目标不同 | `controllers/CartController.php:271,274`、`config/params.php:115` | 按 Yii 默认路由解析到不存在的控制器 → 静态推断 404（未运行验证） |
| FE-9 | 公开调试路由 `/test/<Act>` 暴露随机商品、分类、Nginx 片段 | `config/params.php`、`SiteController::actionTest` | 信息泄露 |
| FE-10 | `PageController extends SnSiiController`，基类文件 `commands/SnSiiController.php:24` 直接继承 `yii\web\Controller`，全项目仅 `AdminController` 使用 `AccessControl`，故本控制器无登录鉴权；`actionSendEmail` 读取 POST/JSON 的 `from_address`/`to`/`subject` 并经 `MailService::send` 发送，无鉴权、无限流、无验证码；`/page/send-email` 为两段路径，不被单段 `/<Links>` 规则匹配，按默认控制器/动作解析可达 | `controllers/PageController.php:28,63-166`、`commands/SnSiiController.php:24`、`config/params.php:115` | 具备被当作邮件中继的接口条件（未实际发送验证）；`return`（`:129`）后存在不可达死代码 |
| FE-11 | `robots.txt` 中 `GPTBot`、`Amazonbot` 等重复出现两次且规则相反 | `web/robots.txt` | 规则语义不确定 |
| FE-12 | 后台登录与前台登录共用 `SiteController::actionLogin`，成功即跳后台 | `controllers/SiteController.php:175-200` | 前台无独立客户登录 |

> 复核边界：本节与 §6 的缺陷均为执行 Agent 对源文件的**静态审计结论**；旧站 PHP 源码未随本提交交付 Reviewer，Reviewer 尚未逐项打开源文件复现。本报告不将这些条目表述为 Reviewer 已复现的事实。

### 5.3 前台证据边界

- 以上均为**静态代码级**结论；本轮未启动站点、未发送表单、未调用第三方接口。
- 「已有（运行中）」只表示代码路径存在且与 2024-11-30 结构可对应，**不表示 2026-11-17 线上仍可用**。

---

## 6. 后台功能实现（R5）

### 6.1 模块与动作

| 控制器 | action 数 | 基类 | 关键能力 |
|---|---|---|---|
| `ProductController` | 5 | `AdminController` | 列表、新增、编辑、热销、热销列表 |
| `CategoryController` | 2 | `AdminController` | 分类、属性 |
| `NewsController` | 8 | `SnSiiController` | 新闻 CRUD（**无鉴权**） |
| `InfoController` | 8 | `AdminController` | 信息页 CRUD |
| `HelpController` | 8 | `SnSiiController` | 帮助中心（**模型不存在**） |
| `ManageController` | 4 | `AdminController` | 管理员账号 |
| `AdController` | 4 | `AdminController` | 广告位 |
| `AccountController` | 2 | `AdminController` | 个人资料/改密 |
| `DefaultController` | 1 | `AdminController` | 后台首页 |
| `ApiController` | 1 | `SnSiiController` | 日志写入（**无鉴权 + SQL 拼接**） |

合计 **43 个 action**，与原型「旧后台覆盖矩阵」的 43 一致。

### 6.2 权限与安全事实

| 编号 | 事实 | 位置 | 影响 |
|---|---|---|---|
| AD-1 | 只有 7 个控制器继承 `AdminController` 并受 `AccessControl` 保护 | `commands/AdminController.php` | — |
| AD-2 | `NewsController`、`HelpController`、`ApiController` 继承**前台** `SnSiiController`，无登录校验 | 三个文件 | 未登录即可访问后台新闻/帮助/日志接口 |
| AD-3 | 7 个后台控制器显式 `enableCsrfValidation=false` | 各控制器 | CSRF 风险 |
| AD-4 | `ApiController::actionPutLogs` 将 `request->post()` 取出的 `Date`/`HostName`/`Url`/`Number`/`LogsId` 直接拼接进 SQL 字符串后交给 `createCommand()->execute()`，未做参数绑定：`UPDATE` 的 `Number` 未加引号直接拼接（`:35`），`INSERT` 五个字段均以字符串拼接（`:37`）；`SELECT` 仅以 `md5(...)`（十六进制）拼接（`:33`）。该表**不在 31 表快照中** | `ApiController.php:27-42`、`02_table_inventory.csv` | 用户输入→SQL 字符串证据链成立，**注入风险待验证**（未构造利用）；运行时表不存在 |
| AD-5 | `HelpController` 引用 `app\models\SnSiiHelp`、`SnSiiHelpCategory`，两个模型不存在，31 表中也无对应表 | `HelpController.php:19-22` | 帮助中心后台不可用 |
| AD-6 | 菜单由 `snsii_nav` + `snsii_manage.NavList` 驱动；`UserId==1` 看全部 | `views/layouts/header.php:16-43` | 粗粒度菜单权限，无操作级鉴权 |
| AD-7 | 后台账号表含明文 `PassWord` 字段（列存在；哈希方式未逐一验证） | `03_column_inventory.csv` | 凭据存储需核查 |
| AD-8 | 无审计表、无操作日志、无审批流 | 表清单 + 代码 | 与 FR-2-040/032/033 一致缺失 |

### 6.3 后台能力缺口

- 无商品删除、批量导入导出、商品 SEO 字段。
- 无品牌管理、供应商管理入口（`snsii_supplier` 仅有数据）。
- 无询盘管理、联系表单管理、订单管理、客户管理。
- 无角色权限矩阵、无数据范围权限、无菜单管理页面。
- 无备份恢复、无缓存管理、无定时任务管理。
- 无内容审核/版本。

---

## 7. Ds Bit 与 Business API 集成准备（R6）

### 7.1 契约候选事实

| 项 | 值 | 证据 |
|---|---|---|
| 文件 | `12_/contract/openapi.candidate.v1.json` | OpenAPI 3.1.0 |
| 版本 | `1.0.0-candidate` | 文件头 |
| 状态 | `x-contract-status: CANDIDATE_NOT_FROZEN` | 文件头 |
| 路径 / 操作 | 16 / 16 | 实测 |
| 必需 | 13（12 业务路径 + `POST /oauth/token`） | 实测 |
| 可选 | 3：`/taxonomies/{id}/changes`、`/categories/{id}/ancestors`、`/categories/{id}/products` | `x-endpoint-status: V1_OPTIONAL` |
| 冻结就绪度 | `NOT_READY` | `16_/FREEZE_READINESS_REVIEW.md` |
| 归一化规则 | `MPN-NORM-v1` 为 `PROPOSED`，未评审冻结（B5） | `12_/API_CONTRACT_CANDIDATE_v1.md:104,444` |
| 状态枚举 | `release_state` / `visible_state` / 三层闸门状态为三套命名空间，未协调（B6 `OPEN`） | 同上 `:82,370,445` |
| 证据公开范围 | `OPEN`（B8 / IQ-08）：证据截图可获取性未定 | 同上 `:447` |
| Phase 0 决策 | IQ-01/02/13 `DECIDED`（未签署、未被 Reviewer 验收）；IQ-05/09/15/21 `OPEN` | `14_/DECISION_REGISTER.md` |

### 7.2 Ds Bit 能力与集成缺口

| 能力 | 现状 | 对集成的影响 |
|---|---|---|
| 解析 | 确定性解析，本地可运行；生产 G0 冻结 | 不能作为线上参数来源 |
| 证据 | 文档 SHA-256 + page + bbox + raw text | 可支撑 `evidence` 端点数据模型 |
| 数据持久化 | **无数据库** | `candidates`/`versions`/`taxonomies` 无服务端存储 |
| LLM | **无** | 模型辅助抽取、AI 内容生成无实现 |
| B2B API | 本地桩仅 3 个业务端点（`/v1/health`、`/v1/parts`、`/v1/parts/{model}`）+ OAuth 静态桩 | 与 16 端点契约差距大 |
| 鉴权 | 本地静态 token，标注 `LOCAL_STATIC_STUB_NOT_A_CREDENTIAL` | 不具备生产 OAuth2 |
| 审计 | `src/icpdf/audit/__init__.py` 占位 | 无审计闭环 |
| 三层闸门 | 仅 HTML 原型前端演示 | 无服务端 `PIPELINE_PASS → CONTENT_APPROVED → RELEASE_APPROVED` 持久化 |

### 7.3 三套 API 口径并存

| 口径 | 位置 | 端点 | 用途 |
|---|---|---|---|
| 平台本地契约 | `platform/docs/phase1/03-api-contract.yaml` | 9（`/health`、`/models/{mpn}`、`/home`、`/models`、`/search`、`/suggest`、`/categories/{slug}`、`/inquiries`、`/inquiries/{leadNo}`） | 新前台页面数据 |
| Phase 1 Business API 候选 | `12_/contract/openapi.candidate.v1.json` | 16 | Ds Bit ↔ 平台业务集成 |
| 归档 ThinkPHP 实现 | `platform/_archive/platform_server/route/app.php` | 8（无 `/home`） | 已冻结原型，不是事实源 |

**结论**：三者不是同一契约的不同版本，而是**三套并存口径**；任何实现前必须先裁定唯一事实源。

### 7.4 集成阻断项（与 FR-4/FR-5 对应）

1. 参数证据上线：受 Ds Bit 无持久化阻断。
2. 三层闸门：仅前端演示，无后端。
3. 产品-文档关联：无映射表/无接口。
4. 参数持久化：`pd_*` 表已建，但无写入服务。
5. 模型辅助抽取：无 LLM。
6. 跨页跨表合并：仅设计/切片，未完成。
7. 同步出站：仅有 `sync_outbox` 表，无 worker。
8. OAuth2/限流：仅候选与本地桩。
9. **归一化规则**：`MPN-NORM-v1` 仍为 `PROPOSED`（B5），未评审冻结；冻结前不得作为服务端唯一实现依据。
10. **状态枚举协调**：`release_state`（查询参数）、`visible_state`（派生状态）、三层闸门状态是三套不同命名空间，枚举对齐列为冻结阻断（B6 `OPEN` / `VISIBLE-STATE-RECONCILIATION`），执行方不得自行合并或改名。
11. **证据公开范围**：证据截图的可获取性与公开边界未定（B8 / IQ-08 `OPEN`），影响 `evidence` 端点与验收口径。
12. **非生产凭证**：是否允许非生产 OAuth2 凭证仍 `OPEN`（B4 / IQ-21），影响联调方案与安全审计。

> 完整阻断清单以 `12_/API_CONTRACT_CANDIDATE_v1.md` §11（B1–B8、IQ-03/04/06/12/20）与 `16_/FREEZE_READINESS_REVIEW.md` 为准；上表只列与 Morrishk 集成直接相关项，不替代契约评审。

---

## 8. 工程质量与生产准备（R7）

### 8.1 测试

| 对象 | 测试资产 | 本轮执行 | 结论 |
|---|---|---|---|
| 旧站 | `codeception.yml` 指向 `tests/`，**目录不存在** | **未执行** | 不可运行 |
| 旧站 | 无单元测试、无集成测试 | **未执行** | 不存在 |
| 新平台 | `vitest` + `locales.test.ts` 1 个 | **未执行** | 未验证 |
| 新平台 | `typecheck` 脚本存在 | **未执行** | 未验证 |
| Ds Bit | `tests/` 47 个 `test_*.py` | **未执行**（避免在生产同机跑重依赖） | 未验证 |
| 契约 | 一致性测试（Session B 曾运行，非本轮） | **本轮未执行** | 引用前次记录，不重复声明 |

> 按任务要求：**未执行的测试一律标记「未执行」，不声明通过**。

### 8.2 凭据与密钥

| 位置 | 内容类型 | 处理 |
|---|---|---|
| `config/web.php:18` | `cookieValidationKey` 明文 | 未输出值 |
| `config/web.php:55-56` | Gmail SMTP 用户名/密码明文 | 未输出值 |
| `config/console.php:34-35` | Gmail SMTP 用户名/密码明文（另一组） | 未输出值 |
| `config/web.php:71-72,87-88` | 注释中的其他 SMTP 凭据 | 未输出值 |
| `views/pro/item.php:200-202` | 发件/收件地址硬编码 | 已记录位置 |
| `.env*` | 未发现 | — |

**结论**：凭据以明文形式存在于代码库；仓库无 `.git`，但不排除已被复制/外发。轮换与外部化应作为独立事项评审。

### 8.3 安全清单

| 编号 | 问题 | 位置 | 等级（建议） |
|---|---|---|---|
| SEC-1 | 未鉴权邮件发送接口（具备中继滥用条件，未实际发送验证） | `PageController.php:63-166` | P0 |
| SEC-2 | 未鉴权后台控制器（News/Help/Api） | `modules/ejadmin/controllers/*` | P0 |
| SEC-3 | 用户可控 POST 参数未经参数化直接拼接进 SQL（注入风险待验证） | `ApiController.php:33-37` | P0 |
| SEC-4 | `YII_DEBUG=true` / `YII_ENV=dev` | `web/index.php` | P1 |
| SEC-5 | 公开调试路由 `/test/<Act>` | `config/params.php` | P1 |
| SEC-6 | 上传目录位于 `web/uploads`（可执行风险） | `CartController.php` | P1 |
| SEC-7 | 后台 CSRF 关闭 | 7 个控制器 | P1 |
| SEC-8 | 代码配置中明文硬编码凭据（SMTP、`cookieValidationKey`） | 配置文件 | P1 |
| SEC-9 | 无登录限流/锁定 | `SiteController::actionLogin` | P2 |
| SEC-10 | 无安全响应头证据（CSP/HSTS/X-Frame-Options） | 无 Nginx 配置 | P2 |

### 8.4 可观测性与运维

| 项 | 现状 | 缺口 |
|---|---|---|
| 日志 | 文件日志，info 级，2 MB × 20 | 无集中采集、无告警、无请求 ID |
| 监控 | 无应用监控；仅 GA/Yandex/Clarity 前端分析 | 无可用性/错误率监控 |
| 健康检查 | 旧站无；新平台仅契约 `/health`；Ds Bit G0 有健康检查 | 无统一探针 |
| 缓存 | FileCache；`yii2-redis` 依赖存在但未配置 | 多机部署不可共享缓存 |
| 会话 | 默认文件会话 | 多机部署不可共享会话 |
| 队列 | 无 | 无异步任务 |
| 备份 | 仓库无脚本；服务器侧未知 | 未验证 |
| 回滚 | 无脚本；旧站无版本库 | 无法快速回滚 |
| 依赖安全 | 未执行 `composer audit` / `npm audit` | 未验证 |

---

## 9. FR 功能范围映射矩阵（R8）

### 9.0 使用说明

- **原始功能编号、名称、原现状、原处置均逐字保留**，不改写、不合并、不重排。
- 「本次核查」为新增列，取值：`已核实` / `部分核实` / `未发现` / `仅原型` / `冲突` / `不可用` / `无法验证`。
- 范围确认书正文共 **227 个唯一 FR**；文末另有 4 行重复的汇总行（`FR-1-016`、`FR-1-046`、`FR-1-059`、`FR-1-060`，现状/处置为空），本矩阵不重复列出，特此说明。原始总行数为 231。
- **范围状态**：该确认书封面仍为审核/客户确认待签；其中 104 项为「待确认」、4 项为项目方建议排除（`不纳入本期`），**不构成双方最终批准范围**。本矩阵只做现状映射，不改变任何 FR 的现状或处置。
- 证据代码见 §9.6；所有「已核实」均指**代码/结构快照级**。

### 9.1 领域 1：旧站前台（60 条）

| FR 编号 | 功能 | 原现状 | 原处置 | 本次核查 | 证据 |
|---|---|---|---|---|---|
| FR-1-001 | 站点首页 | 已有（运行中） | 升级 | 已核实 | EV-F03 |
| FR-1-002 | 全局导航与联系入口 | 已有（运行中） | 保留 | 已核实 | EV-F05 |
| FR-1-003 | 分类导航 | 已有（运行中） | 升级 | 已核实 | EV-F16、EV-F02 |
| FR-1-004 | 制造商/品牌页 | 已有（运行中） | 保留 | 部分核实 | EV-F11（缓存键不一致、SQL 双逗号） |
| FR-1-005 | 顶部栏目入口 | 已有（运行中） | 保留 | 已核实 | EV-F05 |
| FR-1-006 | 搜索入口 | 已有（运行中） | 升级 | 已核实（桌面）；移动端见 FR-1-055 | EV-F05 |
| FR-1-007 | 型号搜索匹配 | 已有（运行中） | 升级 | 部分核实（仅前缀匹配） | EV-F04 |
| FR-1-008 | 零结果处理 | 已有（运行中） | 升级 | 已核实 | EV-F04 |
| FR-1-009 | 搜索结果分页 | 已有（运行中） | 升级 | 已核实（50/页） | EV-F04 |
| FR-1-010 | 搜索词资产 | 尚未具备 | 待确认 | 未发现（无搜索日志表/落库） | EV-F04、EV-D01 |
| FR-1-011 | 分类页 | 已有（运行中） | 保留 | 已核实 | EV-F06 |
| FR-1-012 | 分类筛选 | 已有（运行中） | 保留 | 部分核实（仅分类维度） | EV-F06 |
| FR-1-013 | 面包屑 | 已有（运行中） | 保留 | 已核实 | `views/*/` 挂载 |
| FR-1-014 | 品牌筛选 | 已有（运行中） | 保留 | 部分核实（未见组合筛选） | EV-F06、EV-F11 |
| FR-1-015 | 排序与分面 | 尚未具备 | 待确认 | 未发现 | EV-F06 |
| FR-1-016 | 列表缓存 | 已停用 | 不纳入本期 | 冲突（FileCache 列表缓存仍在） | EV-F06 |
| FR-1-017 | 商品详情页 | 已有（运行中） | 升级 | 已核实 | EV-F06 |
| FR-1-018 | 商品访问地址 | 已有（运行中） | 保留 | 已核实 | EV-F01、EV-F02 |
| FR-1-019 | 主图与图集 | 已有（运行中） | 保留 | 部分核实（仅单图） | EV-F07 |
| FR-1-020 | 参数表 | 已有（运行中） | 升级 | 已核实 | EV-F06 |
| FR-1-021 | 参数证据展示 | 尚未具备 | 待确认 | 未发现 | EV-S01 |
| FR-1-022 | Datasheet 获取 | 部分具备 | 待确认 | 部分核实（仅直链/生成 URL） | EV-F15 |
| FR-1-023 | 库存状态 | 部分具备 | 待确认 | 部分核实（字段展示，无实时源） | EV-F07、EV-F15 |
| FR-1-024 | 价格与阶梯价 | 部分具备 | 待确认 | 部分核实（解析后未渲染） | EV-F07 |
| FR-1-025 | 交期 | 尚未具备 | 待确认 | 未发现 | EV-D02 |
| FR-1-026 | 替代料 | 尚未具备 | 待确认 | 未发现 | EV-F06 |
| FR-1-027 | 相关推荐 | 已停用 | 待确认 | 部分核实（同大类随机，非推荐） | EV-F06 |
| FR-1-028 | 生命周期与 RoHS | 部分具备 | 待确认 | 部分核实（有字段/表单，前台未展示） | EV-F15、EV-A03 |
| FR-1-029 | 商品页询价 | 已有（运行中） | 升级 | 部分核实（第三方外发，不落库） | EV-F07 |
| FR-1-030 | RFQ 清单 | 已有（运行中） | 待确认 | 已核实（session） | EV-F08 |
| FR-1-031 | RFQ 提交 | 已有（运行中） | 升级 | 已核实 | EV-F08 |
| FR-1-032 | 联系表单 | 已有（运行中） | 升级 | 已核实 | EV-F09 |
| FR-1-033 | 热卖位询价 | 部分具备 | 升级 | 部分核实（跳转路由缺失） | EV-F08 |
| FR-1-034 | 询盘归因 | 尚未具备 | 新建 | 未发现 | EV-F08 |
| FR-1-035 | 客户注册 | 尚未具备 | 待确认 | 未发现 | EV-F03 |
| FR-1-036 | 客户登录 | 尚未具备 | 待确认 | 未发现（前台登录即管理员入口） | EV-F03 |
| FR-1-037 | 会员价/分级价 | 尚未具备 | 待确认 | 未发现 | EV-D02 |
| FR-1-038 | 订单跟踪 | 部分具备 | 待确认 | 未发现（空表且无代码） | EV-D01 |
| FR-1-039 | 域名对应语种 | 已有（运行中） | 保留 | 已核实（80 域） | EV-F02、EV-F16 |
| FR-1-040 | 语言清单 | 已有（运行中） | 升级 | 部分核实（80 语与目标 5 语不一致） | EV-F17 |
| FR-1-041 | 语言切换 | 部分具备 | 升级 | 部分核实（无前台切换控件） | `LangController.php` |
| FR-1-042 | 界面语言词条 | 已有（运行中） | 升级 | 已核实 | EV-F17 |
| FR-1-043 | 语言域名映射接口 | 部分具备 | 升级 | 部分核实（调试输出，SQL 拼接） | `LangController.php` |
| FR-1-044 | 页面标题 | 已有（运行中） | 升级 | 已核实 | EV-F16 |
| FR-1-045 | 页面描述 | 已有（运行中） | 升级 | 部分核实（仅部分页面传入） | EV-F16 |
| FR-1-046 | 关键词标签 | 已停用 | 不纳入本期 | 已核实（支持但无调用方） | EV-F16 |
| FR-1-047 | 规范化与结构化数据 | 尚未具备 | 新建 | 未发现（无 canonical/JSON-LD） | `views/layouts/main.php` |
| FR-1-048 | 多语言互指 | 部分具备 | 升级 | 未发现（无 hreflang） | `views/layouts/main.php` |
| FR-1-049 | 站点地图与 robots | 已具备（未确认上线） | 升级 | 部分核实（有命令，定时任务不可验证） | EV-F13、EV-F18 |
| FR-1-050 | 搜索引擎 URL 提交 | 已具备（未确认上线） | 保留 | 部分核实（有命令，启用状态不可验证） | EV-F14 |
| FR-1-051 | 统计分析标签 | 已有（运行中） | 保留 | 已核实 | EV-F12 |
| FR-1-052 | 新闻/博客 | 已有（运行中） | 保留 | 已核实 | EV-F10 |
| FR-1-053 | 信息页 | 已有（运行中） | 保留 | 已核实 | EV-F09 |
| FR-1-054 | 品牌介绍页 | 已有（运行中） | 保留 | 部分核实（无独立品牌介绍模板） | EV-F11 |
| FR-1-055 | 移动端搜索 | 部分具备 | 待确认 | 部分核实（输入框未接线） | EV-F05 |
| FR-1-056 | 广告位展示 | 部分具备 | 待确认 | 部分核实（后台有 CRUD；`snsii_ad` AUTO_INCREMENT=4，前台无渲染） | EV-A10、EV-D01 |
| FR-1-057 | 邮件订阅 | 尚未具备 | 待确认 | 未发现 | 全局 grep |
| FR-1-058 | 社媒关注与分享 | 尚未具备 | 待确认 | 未发现（仅 WhatsApp 图标） | `views/layouts/` |
| FR-1-059 | 页面缓存 | 已停用 | 不纳入本期 | 冲突（FileCache + product_cache 在用） | EV-F06、EV-D01 |
| FR-1-060 | Cloudflare 运维集成 | 已具备（未确认上线） | 不纳入本期 | 部分核实（CF 表 + `snsii/Cf.php`） | EV-D01、`snsii/Cf.php` |

### 9.2 领域 2：旧站商城后台（48 条）

| FR 编号 | 功能 | 原现状 | 原处置 | 本次核查 | 证据 |
|---|---|---|---|---|---|
| FR-2-001 | 管理员登录 | 已有（运行中） | 升级 | 已核实（无失败限流） | EV-F03 |
| FR-2-002 | 登出 | 已有（运行中） | 保留 | 已核实 | EV-F03 |
| FR-2-003 | 后台菜单与外壳 | 已有（运行中） | 升级 | 已核实 | EV-A09 |
| FR-2-004 | 后台首页 | 部分具备 | 待确认 | 部分核实（仅 1 个 action） | EV-A01 |
| FR-2-005 | 个人资料 | 已有（运行中） | 保留 | 已核实 | EV-A01 |
| FR-2-006 | 修改密码 | 已有（运行中） | 保留 | 已核实 | EV-A01 |
| FR-2-007 | 商品列表 | 已有（运行中） | 升级 | 已核实 | EV-A02 |
| FR-2-008 | 商品新增 | 已有（运行中） | 升级 | 已核实 | EV-A02 |
| FR-2-009 | 商品编辑 | 已有（运行中） | 升级 | 已核实 | EV-A02 |
| FR-2-010 | 上下架 | 已有（运行中） | 保留 | 已核实 | EV-A02、EV-D02 |
| FR-2-011 | 热销位与库存价 | 已有（运行中） | 升级 | 已核实 | EV-A02 |
| FR-2-012 | 商品删除 | 尚未具备 | 待确认 | 未发现（无 delete action） | EV-A02 |
| FR-2-013 | 参数编辑 | 已有（运行中） | 升级 | 已核实（JSON 文本域） | EV-A03 |
| FR-2-014 | 生命周期与 RoHS | 部分具备 | 保留 | 部分核实（有表单，前台未展示） | EV-A03 |
| FR-2-015 | 批量导入导出 | 尚未具备 | 待确认 | 未发现 | EV-A02 |
| FR-2-016 | 商品 SEO 字段 | 尚未具备 | 待确认 | 未发现 | EV-D02 |
| FR-2-017 | 分类列表 | 已有（运行中） | 升级 | 已核实 | EV-A04 |
| FR-2-018 | 属性模板 | 已有（运行中） | 升级 | 已核实 | EV-A04、EV-D01 |
| FR-2-019 | 分类层级管理 | 部分具备 | 升级 | 部分核实（Pid 树） | EV-A04 |
| FR-2-020 | 品牌管理 | 尚未具备 | 待确认 | 未发现 | EV-D01 |
| FR-2-021 | 供应商管理 | 尚未具备 | 待确认 | 未发现（有表无入口） | EV-D01 |
| FR-2-022 | 属性翻译 | 部分具备 | 待确认 | 部分核实（有 `_lang` 表，无后台） | EV-D01 |
| FR-2-023 | 询盘管理 | 尚未具备 | 新建 | 未发现（有数据无后台） | EV-D01 |
| FR-2-024 | 联系表单管理 | 尚未具备 | 新建 | 未发现 | EV-D01 |
| FR-2-025 | 购物车与订单 | 尚未具备 | 待确认 | 未发现 | EV-F08 |
| FR-2-026 | 客户管理 | 尚未具备 | 待确认 | 未发现 | EV-D01 |
| FR-2-027 | 报价与合同 | 尚未具备 | 待确认 | 未发现 | — |
| FR-2-028 | 订单跟踪维护 | 部分具备 | 待确认 | 未发现 | EV-D01 |
| FR-2-029 | 新闻管理 | 已有（运行中） | 保留 | 已核实（8 actions） | EV-A06 |
| FR-2-030 | 帮助中心 | 部分具备 | 待确认 | 不可用（模型/表缺失） | EV-A07、EV-D01 |
| FR-2-031 | 信息页管理 | 已有（运行中） | 保留 | 已核实 | EV-A06 |
| FR-2-032 | 内容审核 | 尚未具备 | 待确认 | 未发现 | EV-A06 |
| FR-2-033 | 内容版本 | 尚未具备 | 待确认 | 未发现 | EV-A06 |
| FR-2-034 | 广告管理 | 部分具备 | 待确认 | 已核实（CRUD，前台未消费） | EV-A10 |
| FR-2-035 | 导航管理 | 尚未具备 | 待确认 | 部分核实（表 + NavList，无控制器） | EV-D01、EV-A09 |
| FR-2-036 | 站点基础配置 | 尚未具备 | 待确认 | 未发现 | EV-F01 |
| FR-2-037 | 多语言内容 | 部分具备 | 升级 | 部分核实（内容单语，靠词条翻译） | EV-A06、EV-F17 |
| FR-2-038 | 管理员账号 | 已有（运行中） | 升级 | 已核实 | EV-A05 |
| FR-2-039 | 角色与权限 | 部分具备 | 升级 | 部分核实（Role + NavList 粗粒度） | EV-A05、EV-A09 |
| FR-2-040 | 操作审计 | 尚未具备 | 待确认 | 未发现 | EV-A08 |
| FR-2-041 | 日志写入接口 | 已具备（未确认上线） | 待确认 | 不可用（表缺失、无鉴权、SQL 拼接） | EV-A08、EV-D01 |
| FR-2-042 | 经营报表 | 尚未具备 | 待确认 | 未发现 | EV-A01 |
| FR-2-043 | 媒体库 | 部分具备 | 待确认 | 部分核实（上传目录，无 UI） | EV-F08 |
| FR-2-044 | 缓存管理 | 尚未具备 | 待确认 | 未发现 | EV-F01 |
| FR-2-045 | 定时任务管理 | 尚未具备 | 待确认 | 未发现 | EV-F13 |
| FR-2-046 | 备份与恢复 | 尚未具备 | 新建 | 未发现 | 无备份脚本 |
| FR-2-047 | 邮件与通知 | 部分具备 | 升级 | 部分核实（SMTP + 订单邮件，配置硬编码） | EV-F01、EV-F08 |
| FR-2-048 | 双因素与单点登录 | 尚未具备 | 待确认 | 未发现 | EV-F01 |

### 9.3 领域 3：营销与增长（41 条）

| FR 编号 | 功能 | 原现状 | 原处置 | 本次核查 | 证据 |
|---|---|---|---|---|---|
| FR-3-001 | 营销计划 | 尚未具备 | 待确认 | 仅原型 | EV-R01 |
| FR-3-002 | 活动管理 | 尚未具备 | 待确认 | 仅原型 | EV-R01 |
| FR-3-003 | 优惠与促销 | 尚未具备 | 待确认 | 未发现 | EV-R01 |
| FR-3-004 | 广告投放 | 尚未具备 | 待确认 | 仅原型（活动/社媒） | EV-R01 |
| FR-3-005 | 页面标题与描述 | 已有（运行中） | 升级 | 已核实 | EV-F16 |
| FR-3-006 | 站点地图与 robots | 已具备（未确认上线） | 升级 | 部分核实 | EV-F13 |
| FR-3-007 | 搜索引擎验证与提交 | 已具备（未确认上线） | 保留 | 部分核实 | EV-F14、EV-F18 |
| FR-3-008 | 关键词库 | 尚未具备 | 待确认 | 未发现 | EV-F04 |
| FR-3-009 | 零结果词与同义词 | 尚未具备 | 待确认 | 仅原型 | EV-R01 |
| FR-3-010 | 页面 SEO 检查 | 尚未具备 | 待确认 | 未发现 | EV-R01 |
| FR-3-011 | GEO 就绪度 | 尚未具备 | 待确认 | 仅原型 | EV-R01 |
| FR-3-012 | GEO 内容约束 | 尚未具备 | 待确认 | 仅原型 | EV-R01 |
| FR-3-013 | 排名与流量监测 | 尚未具备 | 待确认 | 部分核实（有流量分析，无排名） | EV-F12 |
| FR-3-014 | 选题与内容规划 | 尚未具备 | 待确认 | 仅原型 | EV-R02 |
| FR-3-015 | AI 内容生成 | 尚未具备 | 待确认 | 仅原型（不调真实 LLM） | EV-R02 |
| FR-3-016 | 内容编辑 | 已有（运行中） | 保留 | 已核实（CKEditor） | EV-A06 |
| FR-3-017 | 内容审核 | 尚未具备 | 待确认 | 未发现 | EV-R02 |
| FR-3-018 | 内容资产库 | 尚未具备 | 待确认 | 仅原型 | EV-R01 |
| FR-3-019 | 内容发布 | 部分具备 | 待确认 | 部分核实（直接发布，无闸门） | EV-A06 |
| FR-3-020 | 内容版本 | 尚未具备 | 待确认 | 未发现 | EV-R01 |
| FR-3-021 | 内容与商品关联 | 尚未具备 | 待确认 | 未发现 | EV-R01 |
| FR-3-022 | 社媒账号连接 | 尚未具备 | 待确认 | 仅原型（无 Token） | EV-R01 |
| FR-3-023 | 社媒排期 | 尚未具备 | 待确认 | 仅原型 | EV-R01 |
| FR-3-024 | 社媒发布 | 尚未具备 | 待确认 | 仅原型（不触发真实发布） | EV-R01 |
| FR-3-025 | 发布回读 | 尚未具备 | 待确认 | 未发现 | EV-R01 |
| FR-3-026 | 评论与私信 | 尚未具备 | 待确认 | 未发现 | EV-R01 |
| FR-3-027 | 视频制作 | 尚未具备 | 待确认 | 仅原型 | EV-R01 |
| FR-3-028 | 邮件订阅 | 尚未具备 | 待确认 | 未发现 | EV-F01 |
| FR-3-029 | 邮件活动 | 尚未具备 | 待确认 | 未发现 | EV-F01 |
| FR-3-030 | 线索采集 | 部分具备 | 升级 | 部分核实（表单/购物车/邮件） | EV-F08、EV-F09 |
| FR-3-031 | 线索管理 | 尚未具备 | 新建 | 仅原型 | EV-R01 |
| FR-3-032 | 报价与成交 | 尚未具备 | 待确认 | 未发现 | — |
| FR-3-033 | 营销自动化 | 尚未具备 | 待确认 | 未发现 | EV-R01 |
| FR-3-034 | 线索归因 | 尚未具备 | 新建 | 未发现（无 UTM 入库） | EV-F08 |
| FR-3-035 | 流量分析 | 部分具备 | 升级 | 已核实（GA4/Yandex/Clarity） | EV-F12 |
| FR-3-036 | 转化分析 | 尚未具备 | 新建 | 部分核实（仅页面级，无转化事件） | EV-F12 |
| FR-3-037 | 内容效果 | 尚未具备 | 待确认 | 未发现 | EV-F12 |
| FR-3-038 | 渠道对比 | 尚未具备 | 新建 | 未发现 | EV-F12 |
| FR-3-039 | 协作任务 | 尚未具备 | 待确认 | 仅原型 | EV-R01 |
| FR-3-040 | 外链与公关 | 尚未具备 | 新建 | 未发现 | — |
| FR-3-041 | 品牌监测 | 尚未具备 | 待确认 | 未发现 | — |

### 9.4 领域 4：Ds Bit 文档与参数（34 条）

| FR 编号 | 功能 | 原现状 | 原处置 | 本次核查 | 证据 |
|---|---|---|---|---|---|
| FR-4-001 | 文档上传 | 已具备（未确认上线） | 升级 | 部分核实（本地可，生产冻结） | EV-S02、EV-S04 |
| FR-4-002 | 文档身份 | 已具备（未确认上线） | 升级 | 部分核实（SHA-256 模型） | EV-S01 |
| FR-4-003 | 文档分类 | 已具备（未确认上线） | 升级 | 部分核实（领域模型，未接生产） | EV-S01 |
| FR-4-004 | 解析任务 | 已具备（未确认上线） | 升级 | 部分核实（G0 下 FROZEN） | EV-S02、EV-S04 |
| FR-4-005 | 解析运行产物 | 已具备（未确认上线） | 升级 | 已核实（117 个 run） | EV-S05 |
| FR-4-006 | 运行回放 | 已具备（未确认上线） | 升级 | 已核实（工作台回放） | EV-S02 |
| FR-4-007 | 批量处理 | 已具备（未确认上线） | 升级 | 部分核实（有入口，生产未验证） | EV-S02 |
| FR-4-008 | 表格检测 | 已具备（未确认上线） | 升级 | 已核实（S1 实现+测试） | EV-S06 |
| FR-4-009 | 表格重建 | 已具备（未确认上线） | 升级 | 已核实（LogicalTable） | EV-S06 |
| FR-4-010 | 表头语义 | 已具备（未确认上线） | 升级 | 已核实（header canopy/role） | EV-S06 |
| FR-4-011 | 候选生成 | 已具备（未确认上线） | 升级 | 已核实 | EV-S01 |
| FR-4-012 | 参数抽取 | 已具备（未确认上线） | 升级 | 已核实（确定性解析） | EV-S01 |
| FR-4-013 | 单位处理 | 部分具备 | 升级 | 部分核实 | EV-S01 |
| FR-4-014 | 适用条件 | 部分具备 | 升级 | 部分核实（ConditionContext） | EV-S06 |
| FR-4-015 | 跨页跨表合并 | 尚未具备 | 待确认 | 未发现（仅设计/切片） | EV-S06 |
| FR-4-016 | 型号归一 | 已具备（未确认上线） | 升级 | 已核实 | EV-S01 |
| FR-4-017 | 证据记录 | 已具备（未确认上线） | 升级 | 已核实 | EV-S01 |
| FR-4-018 | 证据一致性校验 | 部分具备 | 升级 | 部分核实 | EV-S06 |
| FR-4-019 | 不变量校验 | 已具备（未确认上线） | 升级 | 已核实（I1/I14） | EV-S06 |
| FR-4-020 | 质量状态 | 已具备（未确认上线） | 升级 | 已核实（Formal/Quarantine/Rejected） | EV-S01 |
| FR-4-021 | 人工审核 | 仅有界面方案 | 新建 | 仅原型 | EV-R01 |
| FR-4-022 | 知识版本 | 仅有界面方案 | 待确认 | 仅原型 | EV-R01 |
| FR-4-023 | 发布授权 | 仅有界面方案 | 新建 | 仅原型 | EV-R01、EV-R02 |
| FR-4-024 | 发布记录 | 仅有界面方案 | 新建 | 仅原型 | EV-R01 |
| FR-4-025 | 三层闸门 | 仅有界面方案 | 新建 | 仅原型（无服务端持久化） | EV-R02 |
| FR-4-026 | 审计留痕 | 仅有界面方案 | 待确认 | 未发现（audit 包占位） | EV-S06 |
| FR-4-027 | 产品与文档关联 | 尚未具备 | 新建 | 未发现 | EV-S01 |
| FR-4-028 | 商城后台对接 | 仅有界面方案 | 新建 | 仅原型（覆盖矩阵页） | EV-R01 |
| FR-4-029 | 参数持久化 | 尚未具备 | 新建 | 未发现（无数据库） | EV-S02 |
| FR-4-030 | 任务队列 | 尚未具备 | 新建 | 未发现 | EV-S02 |
| FR-4-031 | 运行监控 | 已具备（未确认上线） | 保留 | 部分核实（G0 本地） | EV-S04 |
| FR-4-032 | 访问控制 | 已具备（未确认上线） | 保留 | 部分核实（回环+白名单+开关） | EV-S04 |
| FR-4-033 | 模型辅助抽取 | 尚未具备 | 待确认 | 未发现（无 LLM） | EV-S01 |
| FR-4-034 | 前端工作台 | 仅有界面方案 | 新建 | 已核实（workbench + QA 台） | EV-S02 |

### 9.5 领域 5：新平台后台与系统（44 条）

| FR 编号 | 功能 | 原现状 | 原处置 | 本次核查 | 证据 |
|---|---|---|---|---|---|
| FR-5-001 | 管理员登录 | 已有（运行中） | 升级 | 部分核实（仅旧站有；新平台无后台工程） | EV-P01、EV-F03 |
| FR-5-002 | 登出 | 已有（运行中） | 保留 | 部分核实（同上） | EV-F03 |
| FR-5-003 | 登录保护 | 尚未具备 | 待确认 | 未发现 | EV-F03 |
| FR-5-004 | 双因素与单点登录 | 仅有界面方案 | 待确认 | 仅原型 | EV-R01 |
| FR-5-005 | 管理员账号列表 | 已有（运行中） | 保留 | 部分核实（旧站有；新平台仅原型） | EV-A05、EV-R01 |
| FR-5-006 | 账号新增与编辑 | 部分具备 | 升级 | 部分核实 | EV-A05 |
| FR-5-007 | 邀请与找回密码 | 仅有界面方案 | 待确认 | 仅原型 | EV-R01 |
| FR-5-008 | 个人资料与改密 | 已有（运行中） | 保留 | 部分核实（旧站 Account） | EV-A01 |
| FR-5-009 | 角色定义 | 部分具备 | 升级 | 部分核实（Role 字段） | EV-A05 |
| FR-5-010 | 权限矩阵 | 仅有界面方案 | 待确认 | 仅原型 | EV-R01 |
| FR-5-011 | 菜单级授权 | 已有（运行中） | 升级 | 已核实（NavList） | EV-A09 |
| FR-5-012 | 操作级鉴权 | 尚未具备 | 升级 | 未发现（3 个后台控制器无鉴权） | EV-A08、EV-A07、EV-A06 |
| FR-5-013 | 菜单管理 | 尚未具备 | 待确认 | 未发现（有表无页面） | EV-D01 |
| FR-5-014 | 数据范围权限 | 尚未具备 | 待确认 | 未发现 | EV-A01 |
| FR-5-015 | 审批流 | 仅有界面方案 | 待确认 | 仅原型 | EV-R01 |
| FR-5-016 | 操作审计记录 | 仅有界面方案 | 待确认 | 仅原型 | EV-R01 |
| FR-5-017 | 审计查询 | 仅有界面方案 | 待确认 | 仅原型 | EV-R01 |
| FR-5-018 | 审计导出 | 仅有界面方案 | 待确认 | 仅原型 | EV-R01 |
| FR-5-019 | 外部日志接收 | 已具备（未确认上线） | 待确认 | 不可用（表缺失/无鉴权） | EV-A08 |
| FR-5-020 | 日志保留 | 尚未具备 | 待确认 | 部分核实（文件 20×2MB，无策略） | EV-F01 |
| FR-5-021 | 待办任务 | 仅有界面方案 | 待确认 | 仅原型 | EV-R01 |
| FR-5-022 | 系统通知 | 仅有界面方案 | 待确认 | 仅原型 | EV-R01 |
| FR-5-023 | 任务调度配置 | 尚未具备 | 待确认 | 未发现 | — |
| FR-5-024 | 任务运行监控 | 仅有界面方案 | 待确认 | 仅原型 | EV-R01 |
| FR-5-025 | 异步队列 | 部分具备 | 待确认 | 部分核实（仅 `sync_outbox` 表） | EV-D04 |
| FR-5-026 | 站点基础配置 | 仅有界面方案 | 待确认 | 仅原型 | EV-R01 |
| FR-5-027 | 语言与域名配置 | 部分具备 | 升级 | 部分核实（locales.ts + DuoLang） | EV-P02、EV-F02 |
| FR-5-028 | 第三方集成配置 | 部分具备 | 待确认 | 部分核实（env 开关；SMTP 硬编码） | EV-P05、EV-F01 |
| FR-5-029 | 通知模板 | 尚未具备 | 待确认 | 未发现 | `mail/` 模板 |
| FR-5-030 | 系统字典 | 尚未具备 | 待确认 | 未发现 | — |
| FR-5-031 | 文件与媒体库 | 仅有界面方案 | 待确认 | 仅原型 | EV-R01 |
| FR-5-032 | 接口契约 | 已具备（未确认上线） | 保留 | 已核实（9 + 16 两套契约，另有 8 端点归档原型） | EV-P04、EV-C01 |
| FR-5-033 | 接口实现 | 尚未具备 | 新建 | 未发现（归档 ThinkPHP 8 端点不算实现） | EV-P01 |
| FR-5-034 | 后台接口命名空间 | 尚未具备 | 待确认 | 未发现 | EV-P04 |
| FR-5-035 | 接口鉴权与限流 | 尚未具备 | 新建 | 未发现（OAuth2 仅候选/本地桩） | EV-C02、EV-S03 |
| FR-5-036 | 健康检查 | 已具备（未确认上线） | 保留 | 仅契约/本地桩 | EV-P04 |
| FR-5-037 | 接口文档与调试台 | 尚未具备 | 待确认 | 未发现 | — |
| FR-5-038 | 同步出站 | 部分具备 | 待确认 | 部分核实（有表无 worker） | EV-D04 |
| FR-5-039 | 新版语种清单 | 部分具备 | 升级 | 部分核实（5 语含 id 缺 fr） | EV-P02 |
| FR-5-040 | 消息词库 | 已具备（未确认上线） | 升级 | 部分核实（5 个 json，缺 fr） | EV-P03 |
| FR-5-041 | 路由前缀与互指 | 已具备（未确认上线） | 升级 | 部分核实（as-needed + middleware，无页面） | `src/i18n/routing.ts` |
| FR-5-042 | 旧域名映射 | 尚未具备 | 待确认 | 部分核实（有 CSV，无实现） | `docs/phase1/legacy-url-redirects.csv` |
| FR-5-043 | 后台界面语言 | 已有（运行中） | 保留 | 部分核实（文案来自模型标签/数据库菜单，无独立 i18n） | EV-A09 |
| FR-5-044 | 内容多语版本 | 部分具备 | 待确认 | 部分核实（旧站词条；新平台无内容模型） | EV-F17、EV-P03 |

### 9.6 证据代码索引

| 代码 | 来源 |
|---|---|
| EV-F01 | `newPlan/morrishk.net/config/web.php`（路由/缓存/邮件/日志） |
| EV-F02 | `config/params.php`（`UrlRules`、`DuoLang`、状态字典） |
| EV-F03 | `controllers/SiteController.php`（首页/登录/登出/测试） |
| EV-F04 | `controllers/SearchController.php` |
| EV-F05 | `views/layouts/header.php` |
| EV-F06 | `controllers/ProController.php` |
| EV-F07 | `views/pro/item.php` |
| EV-F08 | `controllers/CartController.php`、`views/cart/index.php` |
| EV-F09 | `controllers/PageController.php` |
| EV-F10 | `controllers/BlogController.php` |
| EV-F11 | `controllers/MfrController.php` |
| EV-F12 | `views/layouts/main.php`（GA4/GTM/Yandex/Clarity） |
| EV-F13 | `commands/MapController.php`（sitemap/robots） |
| EV-F14 | `commands/CController.php`（Google Indexing） |
| EV-F15 | `models/SnSiiProduct.php` |
| EV-F16 | `commands/SnSiiController.php`（Host→语言、`seo()`） |
| EV-F17 | `messages/`（80 个语言目录） |
| EV-F18 | `web/robots.txt`、`web/google*.html` |
| EV-A01 | `commands/AdminController.php`、`modules/ejadmin/controllers/AccountController.php`、`DefaultController.php` |
| EV-A02 | `modules/ejadmin/controllers/ProductController.php` |
| EV-A03 | `modules/ejadmin/views/product/form.php` |
| EV-A04 | `modules/ejadmin/controllers/CategoryController.php` |
| EV-A05 | `modules/ejadmin/controllers/ManageController.php` |
| EV-A06 | `modules/ejadmin/controllers/NewsController.php`、`InfoController.php` |
| EV-A07 | `modules/ejadmin/controllers/HelpController.php` |
| EV-A08 | `modules/ejadmin/controllers/ApiController.php` |
| EV-A09 | `modules/ejadmin/views/layouts/header.php` |
| EV-A10 | `modules/ejadmin/controllers/AdController.php` |
| EV-D01 | `mysql_schema_audit/01_schema.sql`、`02_table_inventory.csv` |
| EV-D02 | `mysql_schema_audit/03_column_inventory.csv` |
| EV-D03 | `mysql_schema_audit/07_extraction_report.md` |
| EV-D04 | `platform/db/migrations/*.up.sql` |
| EV-S01 | `icpdf-extractor/README.md`、`docs/DATA_CONTRACT.md` |
| EV-S02 | `icpdf-extractor/workbench/serve_parser.py` |
| EV-S03 | `icpdf-extractor/workbench/b2b/serve_b2b.py` |
| EV-S04 | `icpdf-extractor/deploy/dsb/README.md` |
| EV-S05 | `icpdf-extractor/runs/`（117 个目录） |
| EV-S06 | `icpdf-extractor/tests/`（47 个测试文件，未执行）、S1/S2 代码 |
| EV-C01 | `12_dsbit_business_api_integration_design/contract/openapi.candidate.v1.json` |
| EV-C02 | `12_/API_CONTRACT_CANDIDATE_v1.md` |
| EV-C03 | `16_contract_freeze_readiness/FREEZE_READINESS_REVIEW.md` |
| EV-C04 | `14_phase0_authority_adjudication/DECISION_REGISTER.md` |
| EV-P01 | `platform/web/src/app/`（仅 `globals.css`） |
| EV-P02 | `platform/web/src/i18n/locales.ts` |
| EV-P03 | `platform/web/src/messages/*.json` |
| EV-P04 | `platform/docs/phase1/03-api-contract.yaml` |
| EV-P05 | `platform/web/src/lib/api/client.ts` |
| EV-R01 | `07_prototypes/admin/assets/admin.js`（34 个页面定义） |
| EV-R02 | `07_prototypes/admin/assets/views-knowledge.js`（三层闸门演示） |

---

## 10. 风险与技术债

### 10.1 P0（安全/数据正确性，必须先处置）

| 编号 | 风险 | 位置 |
|---|---|---|
| P0-1 | 未鉴权的邮件发送接口，用户可控收件人/主题，具备中继滥用条件（未实际发送验证） | `PageController::actionSendEmail` |
| P0-2 | 未鉴权后台控制器（新闻/帮助/日志） | `NewsController`、`HelpController`、`ApiController` |
| P0-3 | 用户可控 POST 参数直接拼接进 SQL（注入风险待验证）+ 目标表不存在 | `ApiController::actionPutLogs` |
| P0-4 | 询盘主链路外发第三方，本站无留痕 | `views/pro/item.php`、`views/cart/index.php` |
| P0-5 | 代码配置中明文硬编码凭据（SMTP 用户名/密码、`cookieValidationKey`），非数据库存储 | `config/web.php`、`config/console.php` |

### 10.2 P1（功能不可用/严重偏差）

| 编号 | 风险 | 位置 |
|---|---|---|
| P1-1 | `YII_DEBUG=true` 入口 | `web/index.php` |
| P1-2 | 移动端搜索未接线 | `views/layouts/header.php` |
| P1-3 | 阶梯价不渲染 | `views/pro/item.php` |
| P1-4 | 热卖询价跳 404 | `CartController::actionHotPart` |
| P1-5 | 制造商页缓存失效 + SQL 语法错误 | `MfrController` |
| P1-6 | 帮助中心模型缺失 | `HelpController` |
| P1-7 | 商品删除/批量导入/SEO 字段缺失 | `ProductController` |
| P1-8 | 语种集合与客户决策冲突（`id` vs `fr`） | `locales.ts` |
| P1-9 | 三套 API 口径并存（9 端点本地契约、16 端点 Business 候选、8 端点归档原型），无唯一事实源 | `platform/docs` vs `12_/contract` vs `_archive/platform_server` |
| P1-10 | 新平台无页面工程，前端不可交付 | `platform/web/src/app` |
| P1-11 | 7 个后台控制器显式关闭 CSRF 校验（`Ad`/`Api`/`Category`/`Help`/`Info`/`News`/`Product`）；与 P0-2 的 3 个未鉴权控制器是两组不同问题 | `modules/ejadmin/controllers/*` |

### 10.3 P2（工程化/可维护性）

- 无版本库、无 CI、无部署/回滚脚本、无备份脚本。
- 无可用测试；旧站 `tests/` 缺失。
- 无审计、无监控、无告警。
- MyISAM 无事务；`utf8mb3` 限制。
- 备份表/备份控制器文件（`*_bak`、`_copy1`）混在代码与库中。
- Ds Bit 工作树脏，生产基线需重新冻结。

---

## 11. 未验证事项（明确列出，不推定）

> 复核边界：§5、§6 的代码缺陷条目为执行 Agent 的静态审计结论。旧站 PHP 源码、`platform/` 源码与 Ds Bit 本地工作树均未作为本次提交的代码快照交付 Reviewer，Reviewer 尚未逐项打开源文件复现；不得将其写成 Reviewer 已独立复现的事实。

| 编号 | 事项 | 原因 |
|---|---|---|
| U-1 | 线上旧站当前是否可访问、各功能是否仍运行 | 本轮未做生产 URL 探针 |
| U-2 | 线上 PHP/MySQL/Nginx 实际版本与配置 | 未连接服务器 |
| U-3 | 旧库精确行数、商品去重、脏数据比例 | 47.8 GB 未解析，3306 不可连 |
| U-4 | `snsii_product_cache` 与商品表的实际一致率 | 无实时库 |
| U-5 | 定时任务（sitemap、Google Indexing）是否在运行 | 无 crontab 证据 |
| U-6 | Gmail SMTP 是否仍有效 | 未发信 |
| U-7 | Ds Bit 测试套件是否全绿 | 本轮未执行 |
| U-8 | 新平台 `vitest`/`tsc` 是否通过 | 本轮未执行 |
| U-9 | Business API 契约实现可行性 | 无实现、无冻结 |
| U-10 | 生产备份策略与恢复演练 | 无服务器访问 |
| U-11 | 依赖漏洞（composer/npm audit） | 未执行 |
| U-12 | 旧站上传目录是否可执行 PHP | 无 Nginx 配置 |

---

## 12. 待产品负责人/Reviewer 确认的问题

| 编号 | 问题 | 背景 |
|---|---|---|
| Q-01 | 新版目标语种是否确定为 `en/de/ja/es/fr`，并确认移除 `id`？ | 客户决策为 5 语含 `fr`；当前代码为 `en/de/ja/es/id`；两者冲突 |
| Q-02 | 品牌与供应商是否为独立主数据？ | 旧站无品牌表，`snsii_supplier` 承担制造商展示；新平台已有 `pd_brand` |
| Q-03 | 商品身份是否采用 **MPN + Brand** 复合键？ | `14_/IQ-01` 为 `DECIDED`（未签署）；迁移仍只对 `mpn_norm` 唯一 |
| Q-04 | 询盘归因口径（UTM/来源页/渠道）与最小字段集？ | 旧站无归因；新库 `biz_inquiry` 已有指纹/`ip_hash` |
| Q-05 | `FR-1-016/059` 的缓存策略最终口径？范围书写「已停用/不纳入」，但代码仍在用 FileCache 与整页缓存 | 影响性能与一致性方案 |
| Q-06 | 客户账户（注册/登录/会员价）是否纳入本期？ | 原处置均为「待确认」 |
| Q-07 | 订单跟踪是否本期建设？`snsii_track_order` 为空表且无代码 | 原现状「部分具备」缺少实现证据 |
| Q-08 | 营销工作台是否按原型（34 页）作为目标范围？ | 全部 Demo，无后端 |
| Q-09 | Ds Bit 生产授权范围与上线前置条件？ | G0 冻结、契约 `CANDIDATE_NOT_FROZEN`、冻结就绪度 `NOT_READY` |
| Q-10 | 三套 API 口径以哪一套为唯一事实源？ | 9 端点 / 16 端点 / 归档 8 端点并存 |
| Q-11 | 旧站凭据轮换与配置外部化是否作为独立事项？ | 明文凭据硬编码于代码配置，非数据库存储 |
| Q-12 | 旧站 URL 冻结范围是否包含 80 个一域一语域名？ | `DuoLang` 80 条；新平台仅 5 语 |

---

## 附录 A：目录树（截断）

```text
E:\workspace\独立站\morries
├─ agent.md
├─ newPlan\
│  └─ morrishk.net\
│     ├─ config\        web.php / console.php / params.php / db.php / i18n.php
│     ├─ controllers\   8 个前台控制器（32 action）+ 2 个 _bak
│     ├─ commands\      11 个（含 AdminController / MapController / CController）
│     ├─ models\        18 个
│     ├─ modules\ejadmin\  10 控制器 / 15 个模块模型（含 12 个 *Search）/ 10 views 目录
│     ├─ views\         9 个目录 / 22 个模板
│     ├─ messages\      80 个语言目录
│     ├─ web\           index.php / robots.txt / uploads / google*.html
│     ├─ service\MailService.php
│     ├─ snsii\         13 个助手类
│     ├─ docker-compose.yml
│     └─ codeception.yml（tests/ 缺失）
├─ platform\
│  ├─ docs\phase1\      01–06 + admin\ + evidence\ + legacy-url-redirects.csv
│  ├─ db\migrations\    4 组 up/down（12 表）
│  ├─ web\src\          app\ / components\ / i18n\ / lib\ / messages\ / middleware.ts
│  └─ _archive\platform_server\  ThinkPHP 6.1（8 端点，冻结）
├─ mysql_schema_audit\  01–07（结构/列/索引/兼容性/提取报告）
└─ （未发现 .git / vendor / 部署脚本 / 备份脚本）
```

## 附录 B：核心表（字段摘要）

见 §4.2。补充：

- `snsii_product`：`id, PartNumber, PartUrl, BigCat, SmallCat, Mid, Description, Quantity, InStock, UnitPrice(decimal 10,5), ImgId, PdfId, DataAttr(text), PriceNew(text), Md5, Image, Pdf, IsPut, Lifecycle, RoHS`
- `snsii_cart`：16 列（含 `GoodsList`→`Product`、`Files`、`IP`、`Country`）
- `snsii_manage`：`id, UserName, PassWord, Name, NavList, Role, Status, AddTime, ...`
- `snsii_attr_name_lang`：5 列，33,762 AUTO_INCREMENT

## 附录 C：关键路由

| URL | 目标 |
|---|---|
| `/products/<8位id>/<PartUrl>.html` | 商品详情 |
| `/manufacturer/<Links>.html` | 制造商列表/详情 |
| `/products.html`、子分类/大类 | 商品列表 |
| `/shopping-cart.html` | RFQ |
| `/new-products.html` | 新品 |
| `/blog...` | 新闻/博客 |
| `/<Links>.html` | 信息页（含 `contact-us`） |
| `/ejadmin-index.html` | 后台入口 |
| `/test/<Act>.html` | 公开调试（风险） |

## 附录 D：关键代码文件

| 主题 | 文件 |
|---|---|
| 入口/调试 | `web/index.php` |
| 路由/组件/凭据 | `config/web.php`、`config/console.php`、`config/params.php` |
| 商品详情 | `controllers/ProController.php`、`views/pro/item.php` |
| 搜索 | `controllers/SearchController.php` |
| 询盘 | `controllers/CartController.php`、`views/cart/index.php` |
| 邮件接口 | `controllers/PageController.php`、`service/MailService.php` |
| 后台基类 | `commands/AdminController.php` |
| 后台商品 | `modules/ejadmin/controllers/ProductController.php`、`views/product/form.php` |
| 后台日志接口 | `modules/ejadmin/controllers/ApiController.php` |
| 多语言 | `commands/SnSiiController.php`、`messages/` |
| 分析 | `views/layouts/main.php` |
| 新平台适配 | `platform/web/src/lib/api/client.ts` |
| 新平台语种 | `platform/web/src/i18n/locales.ts` |
| 契约 | `platform/docs/phase1/03-api-contract.yaml`、`12_/contract/openapi.candidate.v1.json` |
| Ds Bit 入口 | `workbench/serve_parser.py`、`workbench/b2b/serve_b2b.py` |

## 附录 E：测试命令与执行记录

| 对象 | 命令 | 本轮结果 |
|---|---|---|
| 旧站 Codeception | `vendor/bin/codecept run` | **未执行**（`tests/` 不存在，`vendor/` 不存在） |
| 新平台测试 | `cd platform/web && npm run test` | **未执行** |
| 新平台类型检查 | `cd platform/web && npm run typecheck` | **未执行** |
| 新平台构建 | `cd platform/web && npm run build` | **未执行** |
| Ds Bit 测试 | `cd icpdf-extractor && python -m pytest` | **未执行** |
| 依赖审计 | `composer audit` / `npm audit` | **未执行** |

> 本表之外不存在任何「通过」记录；不得据此推断测试通过。

## 附录 F：Git 基线与工作树

| 仓库 | 分支/HEAD | 工作树 |
|---|---|---|
| `E:\workspace\独立站\morries` | 无 Git | — |
| `E:\workspace\独立站\morrishk-site-upgrade-review` | `main@cf150a3` | 干净；1 个未跟踪 docx（本轮不提交） |
| `E:\workspace\icpdf-extractor` | `backup/full-local-20261114@600439a` | 脏：已暂存 `deploy/dsb/*`、`workbench/*`；未跟踪 `serve_b2b.py`、`deploy/dsb/evidence/`、`docs/g0_evidence/` |

---

## 交付说明

- 本报告为**新增文件**，仅提交至 `morrishk-site-upgrade-review`；不推送任何代码提交。
- 未修改 `00_`–`16_` 任何既有文件；未修改旧站、`platform/`、`icpdf-extractor`。
- 未执行迁移、未写库、未发信、未调用生产 API。
- 等待 Reviewer 独立审核；本报告不代表验收通过，也不构成开发授权。
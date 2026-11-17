# 12 · Ds Bit ↔ Morrishk Business API Integration Design

| 项 | 值 |
|---|---|
| 交付编号 | MRH-DSBIT-INT-001 |
| 版本 | v1.2.2（修正 §1.1 冻结状态表述；仍未冻结） |
| 日期 | 2026-11-17 |
| 修订 | v1.1 处理 R1–R8 与基线说明（`fc4bcc5`）；v1.2 收口 R3/R4/R5/R6/R8（`3816c10`）；v1.2.1 修正 R5 的 60 秒边界（`60b46ba`）；v1.2.2 修正 §1.1 冻结状态表述 |
| 性质 | 架构与接口契约设计；**不是**生产实现、不是部署、不是凭证签发 |
| 状态 | 送 Reviewer 复核 |

---

## 1. 本目录内容

| 文件 | 说明 |
|---|---|
| `Ds Bit ↔ Morrishk Business API Integration Design v1.md` | 主设计文档（16 章 + 附录 A–D） |
| `API_CONTRACT_EXAMPLES.md` | EX-01 ~ EX-22 请求/响应示例（含 EX-07b/EX-07c 补充；全部为构造样例） |
| `INTEGRATION_OPEN_QUESTIONS.md` | IQ-01 ~ IQ-22 未决问题、证据、选项、建议与裁定记录 |
| `README.md` | 本文件：基线、文件清单、复核方法、未执行操作声明 |
| `SHA256SUMS.txt` | 本目录文件的 SHA-256 校验清单 |

---

## 2. 基线（本次只读检查的对象）

| 对象 | 路径 | 版本 |
|---|---|---|
| Ds Bit 项目仓库（前台 `workbench/` + 解析引擎 `src/icpdf/`） | `E:\workspace\icpdf-extractor` | 分支 `backup/full-local-20261114`，HEAD `600439a5eee69fb3a1cec2715e37080e48ca9840`；工作树不干净 |
| Ds Bit 本地 B2B 静态桩（前台联调） | `workbench/b2b/serve_b2b.py` | **未跟踪**文件；仅作"本地存在"证据 |
| 早期静态 UI 原型（不在 Ds Bit 仓库内） | `E:\workspace\DsBit\prototype.html` | 仅历史参考 |
| Morrishk 旧站（Yii2） | `E:\workspace\独立站\morries\newPlan\morrishk.net` | 非 Git 目录（源码快照）；PHP 7.4.33 / MySQL 5.6.50 |
| Morrishk 新平台工程 | `E:\workspace\独立站\morries\platform` | 非 Git 目录；OpenAPI 3.1 + 迁移 + Next.js |
| 数据库结构审计 | `E:\workspace\独立站\morries\mysql_schema_audit` | 2024-11-30 dump |
| 本送审仓库 | `E:\workspace\独立站\morrishk-site-upgrade-review` | 分支 `main`，基线 `b55825c0162ccc678d01580337d0671fdfffa1c3` |

> 说明（按用户 2026-11-17 更正）：`E:\workspace\icpdf-extractor\workbench` 是 **Ds Bit 前台**，
> `E:\workspace\icpdf-extractor` 是 **Ds Bit 项目仓库**。主设计文档 §1.1、§2.1、§2.2、§3.1 已按此口径修正。
> `E:\workspace\DsBit\prototype.html` 不属于该仓库，只作为早期静态原型记录。

### 2.1 证据基线时效性（Reviewer 复核补充）

Reviewer 指出：Ds Bit 证据取自本地分支 `backup/full-local-20261114` 的 HEAD
`600439a5eee69fb3a1cec2715e37080e48ca9840`，且工作树不干净。因此：

1. 主文档中的 `CONFIRMED` **仅表示在上述特定代码快照下确认的事实**，不等同于
   Ds Bit 当前权威分支（如 `main`/`master`）或未来生产状态的事实。
2. 在该快照下，工作树含未提交改动，`workbench/b2b/serve_b2b.py` 是**未跟踪**文件；
   `CONFIRMED` 不覆盖这些改动在权威分支上是否存在。
3. **Phase 0 冻结前**，须在 Ds Bit 权威分支的**干净提交**上重新核对以下五项，
   并把结果写入冻结记录；任何一项不成立，相关 `CONFIRMED` 降级为 `OPEN`：
   - 产品身份模型（产品如何唯一标识、是否允许同一产品多版本）；
   - 产品全局 ID 唯一性（跨解析批次是否稳定）；
   - 解析器输出与证据模型（`EV-*`、bbox、页码、SHA 是否仍一致）；
   - 静态 B2B 桩状态（`serve_b2b.py` 是否仍为本地 stub、是否已进入版本库）；
   - 数据库、审核、版本、发布四类后端的实际进度（是否仍为 `NOT_IMPLEMENTED`）。
4. 上述复核**不在本次交付范围内**（本次只做设计与只读取证），也不构成对权威分支现状的断言。

---

## 3. 核心结论（与主文档一致）

1. Ds Bit 当前**没有**生产级 Business API、OAuth2 实现、技术分类体系、参数落库、审核/版本/发布后端。
2. Morrishk 当前**没有** Ds Bit 客户端、Token 存储、同步任务或映射表。
3. 本设计把**产品分类 API 作为一等子系统**，并明确区分五类"分类"：
   技术分类体系、器件身份/产品族、文档类型、Morrishk 业务导航分类、SEO 落地页分类。
4. 公开详情页**不实时依赖** Ds Bit；页面只读本地库与缓存。
5. Ds Bit 的 `category_id` **不进入** Morrishk URL；映射变化**不自动**改写 URL 或生成 301。
6. 业务 API 采用项目现有 `{code, message, data, request_id, meta}` 包；OAuth2 Token 端点例外，遵循 RFC 6749。

---

## 4. 复核方法（不启动任何服务）

Reviewer 可按以下顺序复核：

1. **读主文档 §2**：所有 `CONFIRMED` 事实都给出文件路径与行号；按路径打开即可核对。
2. **读主文档 §5.7 / 附录 B**：确认错误包形状与任务书建议的映射关系。
3. **读 §7**：确认分类是独立章节、独立端点、独立状态机、独立映射层。
4. **读 §10**：确认 URL 规则冻结、分类不参与 URL、不自动 301。
5. **读附录 A**：`CONFIRMED` / `PROPOSED` / `OPEN` 三类清单。
6. **读 `API_CONTRACT_EXAMPLES.md`**：示例均为构造样例，不得作为真实响应证据。
7. **读 `INTEGRATION_OPEN_QUESTIONS.md`**：22 个 `OPEN` 项的阻断级别与决策人。
8. **校验文件完整性**：

```bash
cd 12_dsbit_business_api_integration_design
sha256sum -c SHA256SUMS.txt
```

9. **确认未执行操作**：见主文档附录 D 与本文件 §5。

---

## 5. 本次未执行的操作（声明）

本次**没有**：

1. 修改 Ds Bit 或 Morrishk 的任何生产配置；
2. 部署 Ds Bit 或 Morrishk 生产服务；
3. 创建或启用任何生产 OAuth2 凭证；
4. 调用真实生产 Parser API（`/api/parse`、`/api/process` 等）；
5. 启动 `workbench/serve_parser.py` 或 `workbench/b2b/serve_b2b.py`；
6. 访问 `dsb.0668xgwl.com`；
7. 启用 LLM 解析或 Repair；
8. 批量解析或批量发布任何产品；
9. 连接或修改 Morrishk 生产数据库；
10. 修改 Morrishk 的 URL、canonical 或 301 规则；
11. 把 Mock/Stub 描述为真实 API 已接通；
12. 实现任何公开 Business API；
13. 重构现有代码；
14. 自动化分类映射为不可逆的业务分类或 URL 变更。

本次**只做**：只读文件检查、只读 `git` 查询、只读哈希计算、在本目录写设计文档。

---

## 6. 交付物清单（供 Reviewer 勾选）

- [ ] 主设计文档（16 章 + 附录 A–D）
- [ ] API 示例（EX-01 ~ EX-22，含 EX-07b/EX-07c）
- [ ] 未决问题（IQ-01 ~ IQ-22）
- [ ] `CONFIRMED` / `PROPOSED` / `OPEN` 三类清单（主文档附录 A）
- [ ] 当前 vs 拟议差异表（主文档附录 C）
- [ ] 明确声明未执行生产操作（主文档附录 D、本文件 §5）
- [ ] SHA-256 校验清单（`SHA256SUMS.txt`）

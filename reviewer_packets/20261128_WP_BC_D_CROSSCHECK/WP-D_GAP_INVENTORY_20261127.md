# WP-D GAP INVENTORY — CAND-09 与 Business API 实施授权前差距清单

| 项 | 值 |
|---|---|
| 文档 | `WP-D_GAP_INVENTORY_20261127.md` |
| 性质 | 只读盘点与差距清单；**不是**授权、批准、契约冻结或实施许可 |
| 交付物日期 | 2026-11-27（文件名）；核对执行于 2026-11-28 |
| 代码仓库 | `E:\workspace\icpdf-extractor` |
| 当前 HEAD | `f348237`（分支 `docs/p0-2-dc-decision-20261125`） |
| CAND-09 基线 | `5dcecd21a9bf3f7f7046cc8c769fcfbcd2adf1e5` |
| 治理工作树 | `E:\workspace\.scratch\morrishk-owner-decision` |
| 结论摘要 | CAND-09 **仍 BLOCKED**（E-01…E-05 0/5 满足）；TF-01 已定位为 CRLF 环境问题；Business API 实施授权前存在多层阻塞 |

---

## 1. 环境与基线核验

| 项 | 实测 |
|---|---|
| `git rev-parse HEAD` | `f348237` |
| `git rev-parse 5dcecd2` | `5dcecd2` |
| `pipeline.py` 在 HEAD 与 CAND-09 的差异 | `git diff 5dcecd2 f348237 -- '*pipeline.py'` 无输出（**一致**） |
| `pipeline.py` blob SHA-256（HEAD） | `3394bb66e94c000fd726d466cb5c56ab6a0747c9bcfdfee3f44684a11d4bef0a`（LF，CRLF=0） |
| `pipeline.py` blob SHA-256（5dcecd2） | `3394bb66e94c000fd726d466cb5c56ab6a0747c9bcfdfee3f44684a11d4bef0a`（LF，CRLF=0） |
| 工作区 `pipeline.py` 实际字节 | SHA-256 `86c0054969572c17f8bc19d5bd14f332053a5926c0a2300777c79ac6ab1b2fa5`，CRLF=198 |
| `git ls-files --eol` | `i/lf  w/crlf  attr/`（无 `.gitattributes`） |
| `core.autocrlf` | `true` |

> 结论：**代码内容（索引 blob）在 HEAD 与 CAND-09 完全一致**；工作区字节差异仅来自 CRLF 转换。

---

## 2. CAND-09 E-01…E-05 核验

依据：`51_/CAND09_UNBLOCK_EVIDENCE_CONDITIONS.md`、`52_/OD52_B5_WS_DIAGNOSTIC_POSTSCAN_CAND09_SUPPLEMENT.md`。
证明类型：**代码证明**（读取仓库/签名/grep）或 **测试证明**（实跑测试）。本节未运行 CAND-09 测试（其目标文件不存在）。

| # | 要求（51_/52_） | 实测证据 | 结论 | 证明类型 |
|---|---|---|---|---|
| E-01 | 列出 CAND-09 实际调用路径，证明**直接与间接**均不经过 `pipeline.py`/`parse_pdf`；不得靠改名/移动规避 | CAND-09 目标文件 `tests/integration/test_product_identity_flow.py` **不存在**；`parse_pdf` 签名为 `pipeline.py:94 def parse_pdf(pdf_path, requested_mpn, ...)`；无 CAND-09 调用路径可核 | **NOT_SATISFIED** | 代码证明（否定） |
| E-02 | Brand 显式可信输入，含来源与 `brand_trust_status`；不得用 PDF metadata/manufacturer | `git grep -ni "brand" HEAD -- src` **0 命中**；全仓无 `brand_trust_status`；`parse_pdf` 无 Brand 参数 | **NOT_SATISFIED** | 代码证明（否定） |
| E-03 | 缺失/`UNVERIFIED`/`MISSING`/`REJECTED` 时不生成 business key，状态 `PENDING_BRAND` | `git grep -n "PENDING_BRAND" HEAD -- "*.py"` **0 命中**（exit 1） | **NOT_SATISFIED** | 代码证明（否定） |
| E-04 | CAND-09 测试不导入/执行 `parse_pdf`，不依赖 CAND-02/06/pipeline 快照；fixture 合成/脱敏 | 无 CAND-09 测试文件，无法运行或审计其 import/fixture | **NOT_SATISFIED / UNVERIFIABLE** | 测试证明（缺失） |
| E-05 | 未引入新隐含范围：无 DB/DDL、无 OpenAPI/OAuth/Business API、无生产、无新公共契约 | 现状代码未见上述新增（无相关文件/依赖）；但 CAND-09 未实现，其影响不可核验 | **NOT_SATISFIED** | 代码证明（现状，非合规证明） |

**CAND-09 结论：`BLOCKED`（0/5 满足）。** 52_ §4 明确：E 证据提交不等于自动解除；修改 `pipeline.py` 或更新字节快照则继续 `BLOCKED`；解除后仍需 P-06 最终允许与执行授权。

---

## 3. TF-01 — CRLF 导致快照测试失败

**执行命令（仅运行，未修复）**
```text
python -m pytest tests/unit/test_assembly.py -k a1_10 -q
```

**结果**：`1 failed`（exit code 1）
```text
FAILED tests/unit/test_assembly.py::test_a1_10_pipeline_py_is_byte_identical_to_the_authorised_snapshot
AssertionError: assert '86c005496957...79ac6ab1b2fa5' == '3394bb66e94c...684a11d4bef0a'
- 3394bb66e94c000fd726d466cb5c56ab6a0747c9bcfdfee3f44684a11d4bef0a
+ 86c0054969572c17f8bc19d5bd14f332053a5926c0a2300777c79ac6ab1b2fa5
```

**根因证据**
| 对象 | SHA-256 | CRLF |
|---|---|---|
| Git 索引 blob（HEAD 与 5dcecd2） | `3394bb66…bef0a` | 0 |
| 工作区文件（autocrlf 转换后） | `86c00549…b2fa5` | 198 |
| 工作区 CRLF→LF 规范化后 | `3394bb66…bef0a` | 0 |

**TF-01 影响**
- 该测试读取工作区字节；`core.autocrlf=true` 且无 `.gitattributes` → 工作区被写为 CRLF，哈希必然偏离授权快照。
- **不是代码内容漂移**：索引 blob 与规范化后的工作区字节均等于授权快照 `3394bb66…`。
- 影响所有“字节恒等/快照”类门禁：在本 checkout 下会稳定失败，可能被误判为代码变更。
- 不影响 CAND-09 的 E-01…E-05 结论（CAND-09 仍因实现缺失而 BLOCKED）。
- **未修复**：未改 `.gitattributes`、未改 `core.autocrlf`、未重写工作区文件。

---

## 4. Business API 实施授权前差距

### 4.1 P0-2 四项 FAIL（来源：`28_/reverification/06`）

| # | FAIL | 关键证据 | 是否阻塞 Business API 授权 | 关闭所需证据 |
|---|---|---|---|---|
| 1 | 产品身份 | `src/icpdf/domain/product.py:37-54`；`pipeline.py:151-158`；`pdf_loader.py:58-67`；无 Brand/supplier；`product_id=prod-{document_id}` | 是（设计/契约前置） | Brand/supplier 检索、`(mpn_norm, brand_norm)`、多文档合并；代码+测试+契约一致 |
| 2 | 全局 ID | `pipeline.py:152`；`pdf_loader.py:59`；`run_store.py:24-25`；`lake/_build_lake.py:364-400`；同 MPN 两 PDF 不同 ID | 是（设计/DB 前置） | 全局注册表/主键、跨文档稳定 ID、重复导入/重解析/更新语义；迁移+跨文档测试 |
| 3 | 静态 B2B 桩 | 权威提交无 B2B 文件；`workbench/b2b` 仅 cache；桩未跟踪并 stash；仅 V101 | 对设计：否；对 P0-2 关闭/生产：是 | 退役桩或真实 B2B Runtime 状态证据；不得把未跟踪桩当实现 |
| 4 | 后端实现 | 无 Business API/DB/OAuth 代码/依赖/测试；lake 仅 3 表；75 矩阵 0 实现 | 是（生产/Contract Freeze；有限 S2 存在时序矛盾） | API/Repository/DB/OAuth/16 操作/75 矩阵/20 错误码测试与 RUN 记录 |

> 第 3 项“解析输出及证据”为 **PASS（解析范围）**，不属 FAIL。P0-2 判定规则：五项全部 PASS 才可申请关闭；当前 4 FAIL → **P0-2 = BLOCKED**。

### 4.2 五道 Gate（来源：`30_/BUSINESS_API_AUTHORIZATION_CRITICAL_PATH.md` 头部；`29_/OWNER_DECISION_OPEN_ITEMS.md` §4）

| Gate | 当前 | 说明 |
|---|---|---|
| `ARCHITECTURE_APPROVED` | **NO** | 架构未批准 |
| `CONTRACT_FROZEN` | **NO** | G1–G6 未关闭 |
| `P0_2_CLOSED` | **NO** | C1/C2/C3 未完成；4 FAIL |
| `BUSINESS_API_IMPLEMENTATION_AUTHORIZED` | **NO** | 未签发任何实施授权 |
| `PRODUCTION_READY` | **NO** | 未接生产 |

### 4.3 OAuth 与安全计划（来源：`26_/OAUTH2_INTEGRATION_PLAN.md`、`26_/SECURITY_AND_SCOPE_TEST_PLAN.md`）

| 项 | 现状 | 差距 |
|---|---|---|
| T1 机器链（Client Credentials，opaque token，aud `dsbit-business-api`） | 仅设计；TTL/刷新/撤销为 PROPOSED | 无本地 AS 桩、无 token 签发/校验/撤销实现；IQ-12（TTL/配额）未裁 |
| T2 用户链（OIDC + PKCE） | 仅边界声明 | 与 Business API 隔离的负向测试未实现 |
| T3 平台链 | 仅边界声明 | 不得进入 Business API；无测试 |
| RS 六步校验（存在/过期/aud/客户端/scope/放行） | 计划 | W-1 未实现；SEC-01…13 未运行 |
| 撤销传播 ≤60s、时钟偏差 60s | 方案 | 未实现/未测；P1-7 撤销机制未选 |
| 13 组安全场景（SEC-01…13） | 全部 PROPOSED | 0 组实跑；SEC-10 挂 B8；SEC-11 挂 IQ-12；SEC-13 挂 P1-2 |
| 5 Scope × 15 端点 = 75 矩阵 | **全部 `CANDIDATE_AUTHORIZATION`；CONFIRMED 0/75；正式可执行 0/75** | 授权规则未裁定；5 行叠加业务语义阻断（DIFF-CONTRACT-01 / B6 / B8 / P1-3 / DIFF-MOCK-05） |
| 凭证/轮换 | IQ-21（非生产凭证）、IQ-11（注册/轮换责任人）OPEN | 不得签发任何可用凭证；V-1…V-4 未启动 |

### 4.4 D-24…D-34、D-41…D-49（来源：`29_/OWNER_DECISION_REGISTER.md`、`30_` §3）

> 全部为 `PROPOSED_NOT_APPROVED / PENDING_OWNER`；`OWNER_DECIDED = 0/49`。
> **分类口径冲突**：`30_` §3 主分类与 `29_` 注册表“类型”列对多项不一致（见 §4.5 G-14），需统一。

| ID | 决策问题 | 30_ 分类 | 29_ 类型 | 依赖 | 差距 |
|---|---|---|---|---|---|
| D-24 | 全局产品跨租户共享 | B | B | D-05、D-25 | 未裁定；无跨租户共享/隔离实现与负向测试 |
| D-25 | Tenant/Organization/ACL 模型 | A | A | D-29 | 未裁定；Organization 延后；ACL 未实现 |
| D-26 | 私有 PDF/解析/证据边界 | B | B | D-24、D-34 | 未裁定；证据隔离未实现 |
| D-27 | 客户确认与全局治理 | A | **B** | D-24、D-41 | 未裁定；客户确认链路未实现 |
| D-28 | 404/403 存在性泄露策略 | B | **C** | D-24、D-34 | 未裁定；无防枚举测试 |
| D-29 | 单租户假设 | A | **C** | — | 未裁定；首期范围边界未定 |
| D-30 | OAuth Scope 与 Tenant ACL 组合 | B | **C** | D-24、D-32、D-34 | 未裁定；四因子授权未实现 |
| D-31 | Tenant/Site/OAuth Client 首期边界 | A | B | D-29 | 未裁定；三实体模型未实现 |
| D-32 | Site-to-Tenant Binding 与 Client 绑定 | B | B | D-31 | 未裁定；绑定校验未实现 |
| D-33 | Tenant Product Access 模型与级别 | A | B | D-24、D-31 | 未裁定；QUERYABLE/EXECUTABLE 未实现 |
| D-34 | Resource Access Policy allow/deny | B | B | D-24、D-31、D-33 | 未裁定；资源策略未实现 |
| D-41 | Tenant Assertion 模型与首期可提交范围 | A | B | D-15、D-24、D-27 | 未裁定；断言模型未实现 |
| D-42 | Global Identity Adjudication 角色/执行批准分离 | A | B | D-15、D-41 | 未裁定；角色分离未实现 |
| D-43 | Global/Tenant/Site 三类归属与审计归属 | B | B | D-24、D-41、D-42 | 未裁定；CHECK/FK/审计作用域未落 DDL |
| D-44 | Brand/MPN Alias 唯一约束与有效期 | C | B | — | 未裁定；唯一约束/有效期未落 DDL |
| D-45 | OAuth Token 可信上下文与 Client/Site 状态 | B | B | D-30、D-32 | 未裁定；运行期复核未实现 |
| D-46 | 首期 Evidence visibility | A | B | — | 未裁定；与 B8 关联，SEC-10 阻断 |
| D-47 | 稳定主体标识与角色域互斥 | B | B | — | 未裁定；身份域模型未实现 |
| D-48 | 审批状态字段一致性与两阶段事务 | C | B | — | 未裁定；两阶段事务未设计/未测 |
| D-49 | Global Product 唯一写入入口 | B | B | — | 未裁定；唯一写入入口未实现 |

### 4.5 其他横向差距

| 项 | 现状 |
|---|---|
| Contract Freeze G1–G6 | **NOT_READY**（IQ 签署/验收、B5/B6/B7/B8、P1-1…P1-10、独立冻结记录） |
| 75 项授权矩阵 | 候选 75/75；`CONFIRMED 0/75`；正式可执行 0/75 |
| DDL/约束/迁移 | CHECK、唯一索引、复合外键、触发器未生成/执行 |
| 测试向量 | V-71…V-107 全为设计、未执行；83 项历史 Parser 证据不覆盖并发/幂等 |
| 并发/事务 | 隔离级别、重试/退避、连接池、pending 去重未定 |
| 角色资格 | DB 不强制 `tenant.editor/admin`、`identity.admin/approver`；应用层校验未实现 |
| **P0-2 时序矛盾** | `AUTHORIZATION_SEQUENCE_AMBIGUITY`：实现才能关 P0-2，P0-2 关闭才能授权实现；口径未定 |
| 文档一致性 | `29_` 与 `30_` 对 D-27/28/29/30/41/42/44/46/48 等分类不一致 |
| 独立复核 | 授权范围与证据的 Independent Reviewer 复核未完成 |

---

## 5. 差距清单（Gap Register）

| ID | 差距 | 级别 | 关闭证据 |
|---|---|---|---|
| G-01 | P0-2 四项 FAIL 未关闭 | BLOCKING | 产品身份/全局 ID/B2B/后端逐项代码+测试证据 |
| G-02 | 五道 Gate 全 NO | BLOCKING | 各 Gate 正式关闭记录 |
| G-03 | CAND-09 E-01…E-05 未提供（0/5） | BLOCKING（该候选） | 实体测试文件 + 调用路径 + Brand/PENDING_BRAND 证据；或 P-06 排除 CAND-09 |
| G-04 | TF-01：`core.autocrlf=true` 致快照测试失败 | NON_BLOCKING（代码）/ BLOCKING（快照门禁） | `.gitattributes`/EOL 策略；需单独授权修复 |
| G-05 | OAuth T1/T2/T3 仅设计，无实现/凭证 | BLOCKING | 本地 AS 桩、W-1 RS、W-3 Client + RUN |
| G-06 | 13 组安全场景未运行；75 矩阵 0 确认 | BLOCKING | SEC-01…13 RUN + 75 行授权裁定 |
| G-07 | IQ-11/12/21、B8、P1-2、P1-7 未裁 | BLOCKING | Owner 裁定记录 |
| G-08 | D-24…D-34、D-41…D-49 全部未裁 | BLOCKING | Owner 逐项决定 |
| G-09 | Contract Freeze G1–G6 未关闭 | BLOCKING | 冻结记录 |
| G-10 | DDL/约束/迁移未生成/执行 | BLOCKING | DDL + 迁移 + 验证 |
| G-11 | 并发/幂等/事务未设计验证 | BLOCKING | 并发测试 + 重试/隔离证据 |
| G-12 | P0-2 时序口径未定 | BLOCKING（逻辑前置） | Owner 选择 A/B/C 口径 |
| G-13 | 无 Business API/DB/OAuth 代码/依赖/测试 | BLOCKING | 有限 S2 实施授权后的实现与 RUN |
| G-14 | 29_/30_ 决策分类不一致 | NON_BLOCKING（治理） | 统一口径并复核 |
| G-15 | 授权范围独立复核未完成 | BLOCKING | Independent Reviewer 报告 |
| G-16 | 生产准入（监控/回滚/备份）未验证 | BLOCKING（生产） | 生产准入证据 |
| G-17 | 静态 B2B 桩状态未决 | BLOCKING（P0-2/生产） | 退役或真实 Runtime 证据 |
| G-18 | 角色资格与应用层校验未实现 | BLOCKING | 角色域实现 + 负向测试 |

---

## 6. 授权前最低门槛（建议，不是授权）

1. Owner/Reviewer 先裁定 **P0-2 时序口径**（现状核查 / 有限补救 / 后置验收）。
2. 完成 P0-2 C1/C2/C3，并逐项关闭 4 FAIL（G-01）。
3. 关闭 Contract Freeze G1–G6（G-09）。
4. 裁定 Batch 1 及与 S2 相关的 D 项（至少 D-24…D-34、D-41…D-49 中授权前必需项）。
5. 75 项 scope→endpoint 授权规则确认，且矩阵从 `CANDIDATE` 转为 `CONFIRMED`。
6. 安全负向测试（SEC-01…13）与 OAuth 本地桩 RUN 通过。
7. 明确 DDL/约束/迁移与并发/幂等/回滚证据。
8. 由 Independent Reviewer 复核授权范围与证据。
9. 仅在上述完成后，才可签发**有限 S2 实施授权**（本地 Mock/内存 Repository/Client/本地 OAuth/隔离测试）；S3 生产准入另行授权。

---

## 7. 证据引用（SHA-256）

| 文档 | SHA-256 |
|---|---|
| `51_/CAND09_UNBLOCK_EVIDENCE_CONDITIONS.md` | `e3c07ba8335a86d3dd41aa171fcc719073d565a5a1e4f9f2d57621808fa0b9df` |
| `51_/B5_UNICODE_WHITESPACE_AND_SCAN_ORDER_SUPPLEMENT.md` | `46653c041a296f63e36d5bc16943d86777213147eb1d12029413deb5f33ca64c` |
| `52_/OD52_B5_WS_DIAGNOSTIC_POSTSCAN_CAND09_SUPPLEMENT.md` | `a5a2dc8abd2d9ac025e1b98dc4bc99fe4503479ae66a4343d97dab34b3b42d35` |
| `28_/reverification/06_P0_2_FINAL_ASSESSMENT.md` | `8aa7f83240be2d6a607698f70bdef7aa199a3fafa7c24877c53bd531e33ba11a` |
| `30_/BUSINESS_API_AUTHORIZATION_CRITICAL_PATH.md` | `bd860470e00d56cb05a0d7e8600d9271e542fd34d017f3d6eb47e22d414aa8b5` |
| `30_/P0_2_AUTHORIZATION_BLOCKER_MAP.md` | `cd36bca5c6a56d9a9f4e9fb9aac211e7e52fef645815c7119e726711a6dfaa98` |
| `26_/OAUTH2_INTEGRATION_PLAN.md` | `ff827850fd064eddab852646093baadf5e026abc322e3a54add4f0a44e93595a` |
| `26_/SECURITY_AND_SCOPE_TEST_PLAN.md` | `f76a3ac2b2d78ee355da242a2283f93a2ec9e5c31591e51ce374af5d1b9a1131` |
| `29_/OWNER_DECISION_OPEN_ITEMS.md` | `72ac54fb78b7d4a441d7adee44e9730d21180b887f1390ff4c234d8a5838a012` |
| `29_/OWNER_DECISION_REGISTER.md` | `183809ffb9e0af15ae4b3ea565d85c9053c5ae0df122aa23f163e0eb8d2dcd48` |

代码证据：`pipeline.py` blob `3394bb66…bef0a`（HEAD/5dcecd2 相同）；工作区 `86c00549…b2fa5`（198 CRLF）；`git ls-files --eol` = `i/lf w/crlf attr/`；`core.autocrlf=true`。

---

## 8. 非执行声明

- 未修改任何代码、测试、配置、数据库或生产环境；
- 未创建/检出分支或 worktree；
- 未安装依赖；仅运行了指定 pytest 命令（只读测试，未修复）；
- 未生成/导入 DDL，未连接数据库，未调用 API/OAuth，未部署；
- 未修改 P0-2、Gate、契约或任何授权状态；
- 本文件不构成 Business API 实施授权、契约冻结、架构批准或生产准入。

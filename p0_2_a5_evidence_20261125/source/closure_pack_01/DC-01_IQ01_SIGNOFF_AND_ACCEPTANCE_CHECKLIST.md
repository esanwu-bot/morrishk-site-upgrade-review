# DC-01 · IQ-01 签署与独立验收准备

| 项 | 值 |
|---|---|
| 文档编号 | REVIEW-P02-DC01-IQ01-20261125 |
| 版本 | v1.0（准备记录；**不代签、不关闭**） |
| 日期 | 2026-11-25（Asia/Shanghai） |
| 权威基线 | `feat/gate6a-audit@5dcecd21a9bf3f7f7046cc8c769fcfbcd2adf1e5` |
| 评审仓引证 | `morrishk-site-upgrade-review@27e62b1`（`27e62b159394b2a95002e0ffb98c054f164aef7b`） |
| 当前状态 | `OWNER_INTERPRETED`；**签署 `PENDING`**；独立验收 `NOT_TESTED` |

---

## 1. 原文复核（本轮重新读取 @27e62b1）

| 文件 | 行号 | 内容（摘录） |
|---|---|---|
| `14_phase0_authority_adjudication/DECISION_REGISTER.md` | `§2.1:46-59` | 废弃 `doc-id` 跨系统主键；`prod-{document_id}` 仅内部临时凭证；采用 `MPN+Brand`；唯一键 `(mpn_norm,brand_norm)`；保留 raw/norm/version/pbk；缺 Brand/冲突→待确认；**推翻原建议 A（Ds Bit 全局注册表 + ULID）**；`pbk` 编码/归一细节/`identity_scope` 入键**不在裁定内** |
| 同上 | `§2.4:92` | IQ-01「**待签署**」「签署人 未指定」「**独立 Reviewer 验收 未完成**」 |
| `14_phase0_authority_adjudication/IQ01_PRODUCT_IDENTITY_ADJUDICATION.md` | `§9.1:262-264` | Q1-a `MPN+Brand`；Q1-b「不引入 Ds Bit 全局注册表」；Q1-c `identity_scope` 未裁定 |
| 同上 | `§9.3:279` | 选项 A（Ds Bit 注册表 + ULID）不再是方向 |
| 同上 | `§9.4:285` | 仍开放：`MpnNormalizer` 规则/版本、`pbk` 哈希/编码、`identity_scope` 入键、Brand 主数据来源 |

文件 SHA-256（@27e62b1）：
- `DECISION_REGISTER.md` = `68b6b259ac1d61ceab59f4bfa61849dae49097e68711d8c9a23e6af828b8daf0`
- `IQ01_PRODUCT_IDENTITY_ADJUDICATION.md` = `2e19b28944f1ad025920502f737ac1fe954373645133afbf0e73989637fcb491`

---

## 2. 三类事实分层（不得混淆）

| 层 | 内容 | 性质 |
|---|---|---|
| A. 原文事实 | 上表 §2.1/§9 的裁定文本 | 原文，不可改写 |
| B. Owner 解释性裁决 | 禁止**外部跨系统** Ds Bit 全局产品注册服务；**允许内部** Product Identity Table；`product_uid` 仅内部技术主键 | Owner 对原文适用范围的正式解释（**非**原文允许） |
| C. 本轮新增决策 | `MPN+Brand` 为业务身份；`pbk` 确定性生成；内部代理键不得授权未批准跨租户共享；merge/split/alias 可审计且不得改变冻结的业务身份规则 | 本轮新增 |

> **不声称** IQ-01 原文已明确允许内部身份表；该许可是 Owner 解释（层 B）。

---

## 3. 签署待办（留空，未伪造）

| 字段 | 值 |
|---|---|
| 签署人 | ________（待指定） |
| 签署日期 | ________（待填写） |
| 签署方式 | ________（待确认：书面/电子签/任务书转录，需 Owner 指定） |
| 签署状态 | **`PENDING`** |

要求：执行 Agent 不得代填签署人/日期/方式；不得把 `PENDING` 改为 `CLOSED`。

---

## 4. 独立 Reviewer 验收清单（待独立执行）

| # | 检查项 | 预期 |
|---|---|---|
| A-1 | IQ-01 原文与引证行号一致 | 与 §1 一致 |
| A-2 | 原文事实 / Owner 解释 / 新增决策三层分列 | 无混同，未称原文允许内部表 |
| A-3 | 签署人/日期/方式真实性与授权 | 由非执行方核验，非代签 |
| A-4 | 内部 Identity Table 解释不扩展为跨租户共享/访问授权 | 无越权推导 |
| A-5 | `pbk` 编码、归一、`identity_scope` 仍标为未决 | 未被误标为已冻结 |
| A-6 | 状态仍为 `PENDING`（签署）/`NOT_TESTED`（独立验收） | 未被升级 |

独立 Reviewer 验收结论：`NOT_TESTED`（本轮未由独立方执行）。

---

## 5. 结论

- IQ-01 解释：`OWNER_INTERPRETED`（Owner 已作解释性裁决）。
- IQ-01 正式签署：`PENDING`（签署人/日期/方式待 Owner 指定，未代填）。
- IQ-01 独立验收：`NOT_TESTED`。
- **不得**因本轮准备而关闭 P-01 或 P0-3。

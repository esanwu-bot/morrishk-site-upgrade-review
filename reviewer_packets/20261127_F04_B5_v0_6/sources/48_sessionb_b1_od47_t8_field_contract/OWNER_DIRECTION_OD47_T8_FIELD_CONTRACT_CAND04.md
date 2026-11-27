# Owner Direction — OD-47 T8 / 字段契约 / CAND-04 裁定记录

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-B1-OD47-001 |
| 版本 | v1.0-OD47-RECORD |
| 日期 | 2026-11-26 |
| 状态 | **RECORDED — OWNER DIRECTION — B5 NOT FROZEN — P-06 OPEN** |
| 性质 | Owner 十项技术方向记录；不是 B5 冻结、不是 P-06 allowlist 批准、不是 B-1 授权 |
| 来源 | Owner 2026-11-26 对 47_ 三项交付物的审阅意见 |
| 关联 | 47_（B5 T8、字段契约、CAND-04 分析）、46_、45_ |

## 1. T8 Unicode 裁定

| 编号 | 事项 | 裁定 |
|---|---|---|
| OD-47-01 | 全角字母/数字/连字符、全角空格及空白折叠 | **ACCEPT** |
| OD-47-02 | NFKC 兼容字符折叠（圈号 `①②③`、上标 `²`、连字 `ﬁ`） | **FLAG**：不得仅因归一化结果相同即自动视为同一料号 |
| OD-47-03 | casefold 的 `ß → ss` | **FLAG**：要求风险处理；`STRAßE` 与 `STRASSE` 可能误合并 |
| OD-47-03a | `İ → i + 组合点` | **ACCEPT WITH FLAG**：结果不同于普通 `i`，须明确处理 |
| OD-47-04 | 不可见格式字符（ZWSP、软连字符） | **拒绝或 `NEEDS_REVIEW`**；不得静默保留并生成正常身份键 |
| OD-47-05 | Unicode 同形字符（Cyrillic `А` vs Latin `A`） | **不自动转换**；仅可提示人工检查 |
| （补充） | en dash / minus 与连字符 | **ACCEPT**：保留差异，不误合并 |
| （补充） | FLAG 含义 | 风险案例；**不得**作为自动身份匹配的安全依据 |

## 2. 字段契约裁定

| 编号 | 事项 | 裁定 |
|---|---|---|
| OD-47-06 | 字段契约方案 | 采用 **`ProductIdentity` 值对象**；**不**给现有 `Product` 增加必填字段 |
| OD-47-07 | `product_uid` | 内部代理键；当前阶段允许缺省；**不承诺跨运行稳定**（无持久化时不得虚构） |

`ProductIdentity` 建议字段：

| 字段 | 必填 | 说明 |
|---|---|---|
| `product_uid` | 否 | 内部代理键；不由 MPN/Brand 计算 |
| `product_business_key` | 条件必填 | 仅可信 Brand + 有效 MPN 时生成 |
| `brand_raw` | 否 | 原始品牌输入 |
| `brand_norm` | 条件必填 | B5 归一化 Brand |
| `brand_source` | 条件必填 | 输入来源 |
| `brand_trust_status` | 条件必填 | `TRUSTED` / `UNVERIFIED` / `MISSING` / `REJECTED` |
| `mpn_raw` | 是 | 原始 MPN |
| `mpn_norm` | 条件必填 | B5 归一化 MPN |
| `identity_status` | 是 | `RESOLVED` / `PENDING_BRAND` / `NEEDS_REVIEW` / `INVALID_INPUT` |
| `rule_version` | 是 | B5 规则版本 |

约束：

- 只有 `brand_trust_status = TRUSTED` 才允许生成 `product_business_key`；
- Brand 缺失/不可信 → `PENDING_BRAND`；Unicode 风险/冲突 → `NEEDS_REVIEW`；输入不合法 → `INVALID_INPUT`；
- 现有 `Product.normalized_mpn` 保留原语义（文档实际支持的 MPN），**不得**替换为 B5 `mpn_norm`；
- `Document.manufacturer` 不得自动映射为可信 Brand。

## 3. Business Key 公式裁定

| 编号 | 事项 | 裁定 |
|---|---|---|
| OD-47-08 | Business Key 公式 | 规则版本纳入 canonical JSON 哈希输入 |

固定约束：

1. canonical JSON 固定字段顺序/schema；
2. UTF-8 编码；
3. `brand_norm`、`mpn_norm` 必须非空；
4. `rule_version` 纳入哈希输入；
5. 原始输入不参与哈希；
6. 不声称哈希解决持久化、并发注册或全局唯一性。

建议公式：

```json
{"schema":"product-business-key","rule_version":"b5-min-v0.1","brand_norm":"...","mpn_norm":"..."}
```

```text
product_business_key = "pbk1_" + SHA256(canonical_json_utf8)
```

## 4. CAND-04 / CAND-08 裁定

| 编号 | 事项 | 裁定 |
|---|---|---|
| OD-47-09 | CAND-04 Registry | **从当前 allowlist 移除**；不创建 `product_identity_registry.py` |
| OD-47-10 | CAND-08 | 更名 `test_product_business_key.py`，或并入 CAND-07 |

当前仅保留候选模块：`src/icpdf/domain/product_identity.py`。未来如需持久化/merge/split/身份审计，再独立申请 Registry，不得在当前 P0-2 范围顺手引入。

## 5. 当前状态

| 项 | 状态 |
|---|---|
| B5 | `DRAFT`，**未冻结** |
| 47_ | 三项交付物保留 `DRAFT / NOT_APPROVED` |
| P-05 | `OPEN`，不创建 worktree |
| P-06 | `OPEN`，最终 allowlist 未批准 |
| P-07 / P-08 / P-09b / P-19 | `OPEN` |
| P-02 / P-15 / P-11 | `CLOSED`（P-11 仅准备范围） |
| B-1 | `NOT_READY / NOT_GRANTED / NOT_EXECUTED` |
| 五项 Gate | 全部 `NO` |
| 42_ / 45_ / 46_ / 冻结包 | 未修改 |

## 6. 下一步

1. 由 Agent 依本裁定修订 B5 与 P-06 草案（仍 `DRAFT / NOT_APPROVED`）；
2. 不修改代码/测试；不创建 worktree；不运行测试；不关闭 P 项；
3. B5 冻结与 P-06 allowlist 批准须另行 Owner Decision。

## 7. 非声明

- 本记录不是 B5 冻结、不是 P-06 批准、不是 B-1 授权；
- 未签署 Owner Record；未修改代码/DB/API/生产；
- 未 commit/push/merge/deploy。
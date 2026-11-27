# P-06 Allowlist 修订稿（v1.4 / 引用 OD-49）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-B1-P06-REVISION-003 |
| 版本 | **v1.4-DRAFT** |
| 日期 | 2026-11-26 |
| 状态 | **DRAFT — NOT_APPROVED — P-06 REMAINS OPEN** |
| 依据 | OD-49-05…08；49_ B5 v0.2；48_ OD-47 |
| 目标基线 | `5dcecd21a9bf3f7f7046cc8c769fcfbcd2adf1e5` |

## 1. 相对 v1.3 的修订

| 项 | 修订 | 依据 |
|---|---|---|
| CAND-04 | 维持 **REMOVED**；不创建 `product_identity_registry.py` | OD-49-05 |
| CAND-08 | 更名 `test_product_business_key.py` **仅为候选方向**，最终待确认 | OD-49-06 |
| CAND-09 | 标记 **BLOCKED**；解决 CAND-02 依赖后再评估 | OD-49-07 |
| P-06 | 最终 allowlist **暂不批准** | OD-49-08 |
| B5 | 引用 `v0.2-R2-DRAFT`；算法版本 `b5-min-v0.1` | OD-49-01/04 |

## 2. 候选状态

| ID | 路径 | 状态 | P0-2 | 说明 |
|---|---|---|---|---|
| CAND-01 | `src/icpdf/domain/product.py` | **REVISE — FIELD CONTRACT PENDING** | #1 | 不改现有必填字段；`ProductIdentity` 承载新字段 |
| CAND-02 | `src/icpdf/parser/pipeline.py` | **EXCLUDED — SNAPSHOT LOCK** | #1/#2 | 不修改、不更新 SHA 快照 |
| CAND-03 | `src/icpdf/domain/product_identity.py` | **BLOCKED — B5 FREEZE PENDING** | #1/#2 | 实现 `ACCEPT_WITH_FLAG → NEEDS_REVIEW` 与不可见字符清单 |
| CAND-04 | `src/icpdf/domain/product_identity_registry.py` | **REMOVED — NOT NEEDED** | #2 | 无持久化时无职责；未来另行申请 |
| CAND-05 | `tests/unit/test_domain_contract.py` | **INCLUDE — TEST** | #1 | 保留原断言；新增兼容测试（条件） |
| CAND-06 | `tests/integration/test_phase1_pdf.py` | **EXCLUDE — DEPENDS ON CAND-02** | #1/#2 | pipeline 未批准前不改 |
| CAND-07 | `tests/unit/test_product_identity.py` | **INCLUDE — CONDITIONAL** | #1 | 覆盖四种 identity_status 与 T8 风险 |
| CAND-08 | `tests/unit/test_product_business_key.py` | **CONDITIONAL — RENAME CANDIDATE** | #2 | 更名仅为方向；最终待确认 |
| CAND-09 | `tests/integration/test_product_identity_flow.py` | **BLOCKED** | #1/#2 | 依赖 CAND-02；解决后再评估 |

> `INCLUDE` 仅表示后续候选；P-06 获批前不得修改任何文件。

## 3. B5 依赖（v0.2-R2）

CAND-03/07 必须实现/覆盖：

- `ACCEPT_WITH_FLAG` 一律 `NEEDS_REVIEW`，不得生成 business key；
- 不可见字符精确清单：§3.1 `INVALID_INPUT`、§3.2 `NEEDS_REVIEW`；
- 文档版本 `v0.2-R2-DRAFT` 与算法版本 `b5-min-v0.1` 分离；
- business key 仅 `RESOLVED` 生成，canonical JSON 含 `rule_version`。

## 4. 字段/业务键约束（不变）

- `product_uid` 内部代理键，当前可缺省，不承诺跨运行稳定；
- `product_business_key` 仅 `brand_trust_status = TRUSTED` 且 `identity_status = RESOLVED` 生成；
- `Product.normalized_mpn` 原语义保留；新增 `mpn_norm`；
- 不声称持久/跨进程/注册表唯一；
- CAND-04 不引入。

## 5. 明确排除

- CAND-02 与 `pipeline.py` 字节快照；
- CAND-04 Registry；
- CAND-06（依赖 CAND-02）；
- CAND-09（BLOCKED，依赖 CAND-02）；
- `tests/unit/test_assembly.py` 快照断言；
- P0-2 #4/#5、DB/DDL、OpenAPI/OAuth/Business API/75 矩阵/生产；
- 未列入文件。

## 6. 仍待 Owner 决定

1. B5 最终冻结（含不可见字符清单与 `ACCEPT_WITH_FLAG`）；
2. `ProductIdentity` 字段契约与 Brand 输入接口；
3. `product_uid` 缺省/外部输入；
4. CAND-08 更名最终确认；
5. CAND-09 解除 BLOCKED 的条件；
6. P-06 最终 allowlist 批准。

## 7. 结论

- P-06 **不能关闭**：CAND-02 快照锁定、CAND-03 待 B5 冻结、CAND-01 待字段契约、CAND-09 BLOCKED；
- CAND-04 维持移除；CAND-08 仅为更名候选；
- 当前仅保留 `product_identity.py` 候选模块，不创建 Registry。

## 8. 非声明

- 本文件不是 allowlist 批准、不是 P-06 关闭；
- 未修改代码/测试；未运行项目测试；未创建/检出 worktree；未读取/操作 stash；
- 未签署 Owner Record、未授予/执行 B-1；未 commit/push/merge/deploy。
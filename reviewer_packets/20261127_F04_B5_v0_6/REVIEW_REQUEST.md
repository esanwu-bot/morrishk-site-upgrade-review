# 独立 Reviewer 复核请求（2026-11-27）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-REVIEW-REQ-20261127 |
| 状态 | **REVIEW_REQUESTED — 执行方自检完成，非 Reviewer 结论** |
| 提交方 | 执行代理（AWS Quick），Owner 授权提交 |
| 复核方要求 | 非执行方独立 Reviewer |
| 效力 | 本包不构成任何关闭、冻结、批准或授权 |

## 0. 本包内容

| 文件 | 来源 | 说明 |
|---|---|---|
| `OWNER_DECISIONS_F04_BLK_A_D_20261127.md` | `.scratch/morrishk-owner-decision/72_…/`（未跟踪）字节副本 | Owner 对 F-04、BLK-A…D 的裁定转录 |
| `B5_MINIMAL_NORMALIZATION_RULES_v0_6_DRAFT.md` | `.scratch/…/73_…/`（未跟踪）字节副本 | B5 v0.6 草稿 |
| `T8_VECTORS_AND_DISPOSITION_v0_6_DRAFT.md` | `.scratch/…/73_…/`（未跟踪）字节副本 | T8 / 空白向量与参考计算 |
| `REVIEW_REQUEST.md` | 本文件 | 复核项 |
| `sources/47_…/ 48_…/ 50_…/ 51_…/ 52_…/ 59_…/ 60_…/ 61_…/` | `.scratch` 工作树对应目录（均未跟踪）的逐字节副本，共 30 个文件，含各目录原 `SHA256SUMS` | R-2 复核所需基线与依据；复核方可用各目录原 `SHA256SUMS` 自校 |
| `SHA256SUMS` | 本目录 | 本目录各文件 SHA-256 |

原件所在工作树：`E:\workspace\.scratch\morrishk-owner-decision`，分支 `docs/sessionb-owner-decision-register`，HEAD `ac96ccb`；72_ / 73_ 在该工作树中**未跟踪**。本目录为副本，便于复核方经 GitHub 取得。

## R-1. F-04 关闭候选

**对象**：`70_sessionb_b1_blk_a_d01_enum_od/OD_BLK_A_B1_D01_ENUM_01.md` §3 `MODEL=DEFER` 六要素（`REVIEW_STATUS = PENDING_EXACT_TEXT_RECONCILIATION`）。

**Owner 裁定**：以 `batch1_od_drafts/OD_DRAFT_D01_v2.1.md` 为基准；接受 ② 的标识替换。

**取得源文件**：分支 `docs/sessionb-owner-decision-register`，提交 `a94fa34`（70_、batch1_ 均已跟踪）。

**执行方自检结果**：v2.1 / v2.2 / v2.3 / v2.3_DERIVED 六要素逐字一致；正式 OD 与 OD_DERIVED 仅 ② 不同（`D-0x → BLK-A-B1-D-0x`，OD §0.1 第 4 项已披露）。7 个文件的 SHA-256 见 `OWNER_DECISIONS_F04_BLK_A_D_20261127.md` §2。

**请复核**：

1. 独立复算 §2 表中 7 个 SHA-256；
2. 独立提取六要素并逐字比较；
3. 确认 ② 的差异仅为标识替换；
4. 判断“基准由 Owner 指定、非与 Reviewer 原稿比对”这一限制是否可接受为 F-04 关闭依据；
5. 给出 F-04 结论（PASS / PASS_WITH_FINDINGS / FAIL）。

## R-2. B5 v0.6 全文复核（相当于 60_ R4）

**基线**：`59_sessionb_b1_b5_contract_r4/B5_MINIMAL_NORMALIZATION_RULES_v0_5_DRAFT.md`（`.scratch` 工作树，未跟踪）。

**请复核**：

1. §0 变更表是否完整、是否存在未披露的变更；
2. A1（P2 文本）、B1（T8）、C1（内联算法 + TAB/LF/CR）、D1（P1）是否忠实落实 Owner 裁定，未扩大；
3. **重点**：§2.2 最后两行（casefold 展开、NFKC 兼容映射 → `NEEDS_REVIEW`）为执行方起草的判定机制，48_ 仅给方向；是否可接受；
4. §2.2 码点清单与 50_ §3、51_ §3 是否一致，有无遗漏；
5. 独立复算 T8 文件 34 个向量（建议项目 Python / Unicode 版本）；
6. 60_ BLK-A…BLK-D 是否在文本层闭合；
7. 算法版本是否应升为 `b5-min-v0.2`（意见供 Owner 裁定）；
8. 给出 B5 结论（READY_FOR_FREEZE / NOT_READY_FOR_FREEZE）。

## R-3. CAND-09 技术核验与 TF-01

**执行方结论**：CAND-09 = `BLOCKED`（维持）。E-01 / E-02 FAIL，E-03…E-05 NOT_TESTED（相关代码与测试不存在）。

**证据**（`E:\workspace\icpdf-extractor`，HEAD `f348237`）：

- `src/icpdf/parser/pipeline.py:94-96`：`parse_pdf(pdf_path, requested_mpn, runs_root, *, dpi, run_id, config_path)`，无 Brand 参数；
- `src/icpdf/domain/product.py:52`：`manufacturer: str | None`（禁止作为可信 Brand）；
- src / tests 中无 `cand.?09`、`brand_trust`、`requested_brand`、`ProductIdentity`、`build_business_key`。

**TF-01（MEDIUM）**：`tests/unit/test_assembly.py:579-593` 对 `pipeline.py` 原始字节做 SHA-256 断言。Owner 本机输出：`core.autocrlf=true`；`git ls-files --eol` = `i/lf w/crlf attr/`；pytest `-k a1_10` **FAILED**（`86c00549…` ≠ `3394bb66…`）。执行方复算：工作区文件 CRLF→LF 后 SHA-256 = `3394bb66…`。`git diff --stat f348237 5dcecd2 -- src/icpdf/parser/pipeline.py` 无输出。

**请复核**：

1. CAND-09 五项判定是否成立；
2. TF-01 归因（换行转换而非内容变更）是否成立；
3. TF-01 对 B-1 P-07 预期结果的影响。

## 不在本包范围

F-02（`OPEN / HIGH`）、F-03、D-01、P0-2、B-1 授权、Business API。本包不改变其状态。

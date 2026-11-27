# 被审文件 SHA-256 实测清单（R3）

| 项 | 值 |
|---|---|
| 生成方式 | 复核者本机 `sha256sum` 逐文件实测（非引用文档内数值） |
| 基线 | `git log -1` = `bfe5ea7 docs(dsbit): record R2.2.10-F review packet push status` |
| 范围 | 41_/44_（状态行核对）、45_–59_ 全部文件（含各目录 `SHA256SUMS`） |
| 说明 | 本清单不内嵌任何报告自身的 SHA-256；`60_/SHA256SUMS` 由归档方计算 |

---

## 1. 59_（本次复核对象）— 6/6 OK

`sha256sum -c 59_sessionb_b1_b5_contract_r4/SHA256SUMS` 输出 6 行全部 `OK`。

| # | 文件 | 实测 SHA-256 |
|---|---|---|
| 1 | `59_sessionb_b1_b5_contract_r4/B5_MINIMAL_NORMALIZATION_RULES_v0_5_DRAFT.md` | `14c784785a0c2d523fe82da559de2b62fb89c8d08fcc757a1ff912213c063b1c` |
| 2 | `59_sessionb_b1_b5_contract_r4/BRAND_INPUT_INTERFACE_CONTRACT_v0_4_DRAFT.md` | `db6944284012a676763c6f135e94ea8947f9dbd1112a5c3c7035b89c4f5bab0c` |
| 3 | `59_sessionb_b1_b5_contract_r4/OWNER_DECISION_ALIGNMENT_MATRIX.md` | `95c3a3ca4f8dd130406d013e47e594df946ccda097ac979d2930f96713547cd4` |
| 4 | `59_sessionb_b1_b5_contract_r4/PRODUCT_IDENTITY_FIELD_CONTRACT_v0_5_DRAFT.md` | `6a5bdd24a419401f11e7aa4164e5cdcb4797e9277783afb27e948543abb36531` |
| 5 | `59_sessionb_b1_b5_contract_r4/SPECIFICATION_PRECEDENCE_AND_LEGACY_BOUNDARY_v0_2_DRAFT.md` | `2b430b47ece65b4e2fe1df7224859bb1cf96d9620124a8a4f4f717f624b2a5c2` |
| 6 | `59_sessionb_b1_b5_contract_r4/T8_EVIDENCE_AND_DECISION_TRACEABILITY.md` | `3adfd50aed18f8e94fe3944e63db9fbcdda9e0b12059a1a59a31c2c4ebb9ed5a` |
| — | `59_sessionb_b1_b5_contract_r4/SHA256SUMS`（未收录自身，符合惯例） | `718f2054e603e152a5b066645ea6a2d52e0948e86df193694c3bc5149bc458a3` |

---

## 2. 50_–58_ 源文档与复核记录 — 各自 manifest 全部 OK

| 目录 | manifest 校验 | 文件数/条目数 |
|---|---|---|
| 45_sessionb_b1_p05_path_p06_review | 2/2 OK | 2/2 |
| 46_sessionb_b1_b5_p06_revision | 3/3 OK | 3/3 |
| 47_sessionb_b1_field_contract_unicode_registry | 3/3 OK | 3/3 |
| 48_sessionb_b1_od47_t8_field_contract | 1/1 OK | 1/1 |
| 49_sessionb_b1_b5_p06_revision2 | 2/2 OK | 2/2 |
| 50_sessionb_b1_od49_revision | 2/2 OK | 2/2 |
| 51_sessionb_b1_b5_whitespace_cand09 | 2/2 OK | 2/2 |
| 52_sessionb_b1_ws15_diagnostic_postscan | 1/1 OK | 1/1 |
| 53_sessionb_b1_productidentity_brand_contract | 2/2 OK | 2/2 |
| 54_sessionb_b1_b5_consistency_review | 1/1 OK | 1/1 |
| 55_sessionb_b1_b5_contract_r2 | 4/4 OK | 4/4 |
| 56_sessionb_b1_b5_full_consistency_review | 1/1 OK | 1/1 |
| 57_sessionb_b1_b5_contract_r3 | 4/4 OK | 4/4 |
| 58_sessionb_b1_b5_full_review_r2 | 1/1 OK | 1/1 |

明细（实测值）：

| 文件 | 实测 SHA-256 |
|---|---|
| `45_/OWNER_DECISION_P05_PATH_P06_REVIEW.md` | `bc0e03ff1d7e153ac7d9b7d30f426e56f926fc03ccbd9ce895fee1aa4da2eb2b` |
| `45_/P06_CANDIDATE_TECHNICAL_REVIEW.md` | `4a3db254334f7c461fc8248860ca0dd4d805cc30c212ed8824f765528321c802` |
| `45_/SHA256SUMS` | `34bb8a6ce43327aec7bc83fe5cf1734fd210f195c980aa57aa00b0a2121b483f` |
| `46_/B5_MINIMAL_NORMALIZATION_RULES_DRAFT.md` | `ad06352e1ebbc004d988f0159f6204208e6f8b7ffd26b7629d350731e204b763` |
| `46_/OWNER_DECISION_TECH_DIRECTION_ACCEPTANCE.md` | `f201eded381da07cf3d0b44ec5bfaf44ab94b625139ca3ed46db4f0f354a832d` |
| `46_/P06_ALLOWLIST_REVISION_DRAFT.md` | `07a5badf1f181c95f34cc1b176369972b9980f8ccb09f06f8da7d2e717bda10e` |
| `46_/SHA256SUMS` | `74b61d84dac03e96acf81d111a23f4b0c9b95d0e058ac2e669975fcdf42dde21` |
| `47_/B5_T8_UNICODE_VECTORS_DRAFT.md` | `dfd8ca8d7628924399c6f9cfe313bd52b0451788a1dc4f149bff57fd29fa7e39` |
| `47_/CAND04_REGISTRY_NECESSITY_ANALYSIS.md` | `69fffc2a922edcebaf6cce132af235413766da722b8373758b48703e25db8dc3` |
| `47_/PRODUCT_IDENTITY_FIELD_CONTRACT_DRAFT.md` | `eb4d610df1f21ad98b45ef55935f2c18211a1b5012eefe150dfc97b655813573` |
| `47_/SHA256SUMS` | `993990dcceca378c274d0b7c98a52ebc24063dbeaa13266d9b3bd927034e4ed7` |
| `48_/OWNER_DIRECTION_OD47_T8_FIELD_CONTRACT_CAND04.md` | `88d1ca30aea618f1e58a96660457f0c06f99745e661e3906dca58ae23e277253` |
| `48_/SHA256SUMS` | `17eb5eb5c29e498764d6c90cc3d9053fea410c977e94c63259472da97e63567b` |
| `49_/B5_MINIMAL_NORMALIZATION_RULES_v0_2_DRAFT.md` | `5284074b27b986fa1579dca2a1481644ffec4f7afb6762c5a535a6ec8ed588a9` |
| `49_/P06_ALLOWLIST_REVISION_v1_3_DRAFT.md` | `bc990f2f154b14a7a3d9cd2ca4d12990945a1fc33a6ccddcf95d09c8a03cbb01` |
| `49_/SHA256SUMS` | `43d92e4240ca140f14a5159c620dca2d144c0924f99d07341178627bbe4fe3e2` |
| `50_/B5_MINIMAL_NORMALIZATION_RULES_v0_2_R2_DRAFT.md` | `c6aa632b93d225642e4a9b516801eda7e194c6038bc84457b8b6024531167340` |
| `50_/P06_ALLOWLIST_REVISION_v1_4_DRAFT.md` | `5dd365edbca7dac23aa03c07b0ac63a8a8893c6b9c53cbc7a4057f11320547f3` |
| `50_/SHA256SUMS` | `694ec97ecfda22155ea5f76f66f6e9291c312fd4acbab82ef5e89226d2bc8b7a` |
| `51_/B5_UNICODE_WHITESPACE_AND_SCAN_ORDER_SUPPLEMENT.md` | `46653c041a296f63e36d5bc16943d86777213147eb1d12029413deb5f33ca64c` |
| `51_/CAND09_UNBLOCK_EVIDENCE_CONDITIONS.md` | `e3c07ba8335a86d3dd41aa171fcc719073d565a5a1e4f9f2d57621808fa0b9df` |
| `51_/SHA256SUMS` | `b6c175425d8ff78d9b33546a62f186f0d816366feae383691f0f0df7e4219ee8` |
| `52_/OD52_B5_WS_DIAGNOSTIC_POSTSCAN_CAND09_SUPPLEMENT.md` | `a5a2dc8abd2d9ac025e1b98dc4bc99fe4503479ae66a4343d97dab34b3b42d35` |
| `52_/SHA256SUMS` | `6d660b513704e4a3d2f5483c3fb14aea44d450316866477c21a45f5b97108936` |
| `53_/BRAND_INPUT_INTERFACE_CONTRACT_v0_1_DRAFT.md` | `df9c49ca036cdef0b0f3adb8ac48ff0bae00b214cfae22c7115467743e8c7a03` |
| `53_/PRODUCT_IDENTITY_FIELD_CONTRACT_v0_2_DRAFT.md` | `a05fb10ee56def60458710f4b84cc8c3bd3a466785740c6c73d9c7a2acc7ddc7` |
| `53_/SHA256SUMS` | `529487b3afb0da991dd811741065395415b5ce1bb5df2a29d5ed2a44274f6945` |
| `54_/B5_CONSISTENCY_REVIEW.md` | `88cc95f96c89f2947ecef6f3ddeed7e19b2c27a580ec72b6570000ced14ae102` |
| `54_/SHA256SUMS` | `12df3bfe4a195833b3a315a8a9a6ef93c75b1ce7b7b83dad2cae92b4b4b9851b` |
| `55_/B5_MINIMAL_NORMALIZATION_RULES_v0_3_DRAFT.md` | `5915a3af50c0ad9a113beecc5e06f464be1b341180e73e2718e8ff2902249516` |
| `55_/B5_VERSION_LINEAGE_SUPPLEMENT.md` | `7d839e5aa18ca72c3a42a151f39567f90b62b790fbadfbc1a263ce66caa33616` |
| `55_/BRAND_INPUT_INTERFACE_CONTRACT_v0_2_DRAFT.md` | `f2e5fd0ba775f9b1351e1c2534f247244321b81a629a17823740c4573ed128dc` |
| `55_/PRODUCT_IDENTITY_FIELD_CONTRACT_v0_3_DRAFT.md` | `56593b1fe0b45766698029ea7c61aa772acee04d1a08ff442adc6201d0b1e98b` |
| `55_/SHA256SUMS` | `f8d52f552da5015d88e23502b26338694b777c15fbe6a584f64dd6ad1e1f50b5` |
| `56_/B5_FULL_CONSISTENCY_REVIEW.md` | `2a8df1583f183c595d58f779dbd1fe9820d12f33725c2239353428b668a66885` |
| `56_/SHA256SUMS` | `527ffcd626b32827d09c2b0f550f0ae94f49a54a6b03ea3c0c304fd7273df4ae` |
| `57_/B5_MINIMAL_NORMALIZATION_RULES_v0_4_DRAFT.md` | `0251b01344b84ffd9ce033a917fa1b3a4affd3340834e8e949a97a207fef64a7` |
| `57_/BRAND_INPUT_INTERFACE_CONTRACT_v0_3_DRAFT.md` | `01bee72d38b39f710bc2f95687fb6618a92cd58b6412b3fe4a633103376967b9` |
| `57_/PRODUCT_IDENTITY_FIELD_CONTRACT_v0_4_DRAFT.md` | `68bc81b250fa99971f165299867c3c759a21173ca11925953f93df976a9b93f3` |
| `57_/SPECIFICATION_PRECEDENCE_AND_LEGACY_BOUNDARY.md` | `7999828191df5b741ffde07f01bb9bdfd52376defbefa4728db194dc07422aa2` |
| `57_/SHA256SUMS` | `ccc062279e07347c81f05d6dee43f93974244e9e3f4490bc542703e61e229640` |
| `58_/B5_FULL_REVIEW_R2.md` | `fc511baae5008f07912a230f22735125336190d44f9ea01c8b4a02b07cde3e80` |
| `58_/SHA256SUMS` | `32adf0c61958269846583859f4e9605d3bc2b759b2959cb06ef4e0ac814bc865` |

---

## 3. Owner 记录（原文核对对象）

| 文件 | 实测 SHA-256 | 来源核对 |
|---|---|---|
| `41_/OWNER_DECISION_P02_P15_CLOSURE.md` | `7e2c4bcc1d146063b2c622d20fa4c984c865e9a7cced2ced4f112521b645f034` | 41_ manifest OK；状态行 `RECORDED — P-02 / P-15 CLOSED BY OWNER`（41_:7） |
| `41_/P02_P15_CLOSURE_RECORD.md` | `afaeb5fb7a7b6fecff7acc17222c9f8a08e7f62cb81ed7879986a9bc2c32f545` | 41_ manifest OK |
| `44_/OWNER_DECISION_OD-B1-P11-PREPARATION-01.md` | `919005b3cd7f18685fa2cf069c8ae06f4923133a7b4ac150cb679e1a5d0a3abf` | 44_ manifest OK；状态行 `RECORDED — PREPARATION SCOPE/WINDOW DEFINED`（44_:7） |
| `44_/P11_CONTROLLED_AUTHORIZATION_RECORD.md` | `0857aac85fae40205eed6c320de73b5d457851aac3e8dff16c4be2af52a90483` | 44_ manifest OK |

---

## 4. 交叉校验（证明 50_–58_ 自 R2 未变）

| 文档内历史记录 | 记录值 | 本轮实测 | 结论 |
|---|---|---|---|
| 54_ §1（50_/51_/52_/53_×2） | 5 个哈希 | 逐一相同 | 未变 |
| 56_ §1（50_–55_ 共 10 个） | 10 个哈希 | 逐一相同 | 未变 |
| 58_ §3（50_–57_ 共 16 个，含 57_/SHA256SUMS） | 16 个哈希 | 逐一相同 | 未变 |
| 58_/SHA256SUMS → B5_FULL_REVIEW_R2.md | `fc511baa…ee80` | 相同 | 未变 |

---

## 5. 其它只读核验

- **59_ 编码**：六份首字节 `23 20`（`# `）起首，第二字节组合分别为 `23 20 42`/`23 20 42`/`23 20 4f`/`23 20 50`/`23 20 e8`/`23 20 54`，无 UTF-8 BOM。
- **canonical JSON 行字节一致**：50_:106、55_ B5:80、55_ Product:85、57_ B5:70、57_ Product:80、59_ B5:108、59_ Product:90 单行 SHA-256 均为 `7a893667448ad5c8c754747b24f91252208992165d6b76160b56bfd31071dc4f`。
- **51_/52_ 无 T8 内容**：`grep -c "T8"` 在 51_ 两份与 52_ 一份中结果均为 `0`。
- **`identity_norm` 全仓命中**：59_ 内 4 处（B5:88/91、Product:41/126、legacy:42/43/51-53 中的否定或取代表述）；源残留仍为 52_:40、52_:44、53_ Product:63 三处（未修改，受不可变约束）。
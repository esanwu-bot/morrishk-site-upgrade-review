# B5 最小归一化规则修订稿（v0.8.1 / 算法版本升至 b5-min-v0.2）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-B1-B5-MIN-010 |
| **文档版本** | **`v0.8.1-DRAFT`** |
| **算法版本** | **`b5-min-v0.2`**（Owner 2026-11-27 15:14 `OWNER_ACCEPTED`；替代 `b5-min-v0.1`） |
| 日期 | 2026-11-27 |
| 状态 | **DRAFT — NOT_FROZEN — NOT_APPROVED — NOT_EFFECTIVE** |
| 基线 | `75_/B5_MINIMAL_NORMALIZATION_RULES_v0_8_DRAFT.md`（SHA-256 `34fc95c89a45c94e61deae880e5631bd0a04d42f2eddf92baaf675f6dd17c9b3`；已于 commit `486242f` 提交复核，未修改） |
| Owner 裁定 | 2026-11-27 15:14：算法版本升至 `b5-min-v0.2`；同步 B5 规范、T8 向量及所有 `rule_version` 示例与计算；正式测试 Unicode 基准为 Python 3.13.15 / Unicode 15.1.0；P2 继续 `PROPOSED` 并维持 §8.1 四条边界；不因此自动批准冻结、实施或生效 |
| 起草方 | 执行代理；非 Reviewer 结论、非 Owner 冻结 |

> 本版为 v0.8 的**同步修订**，只改算法版本及其引用位置。v0.8 已提交复核，故以新版本号 v0.8.1 另存，不覆盖 v0.8。

## 0. 本版相对 v0.8 的变更

| # | 位置 | v0.8 | v0.8.1 | 依据 |
|---|---|---|---|---|
| 1 | 表头“算法版本” | `b5-min-v0.1`（候选）— 升版待裁定 | `b5-min-v0.2`（Owner 已接受） | Owner 15:14 第 1 项 |
| 2 | §5 canonical JSON 示例 | `"rule_version":"b5-min-v0.1"` | `"rule_version":"b5-min-v0.2"` | Owner 15:14 第 2 项 |
| 3 | §5.1（新） | — | `rule_version` 计算示例与固定哈希 | Owner 15:14 第 2 项 |
| 4 | §2.6 参考验证 | 仅执行方 3.12.16 / 15.0.0 | 增加项目环境复算脚本 `b5_v0_8_1_verify.py` 及运行要求 | Owner 15:14 第 3 项 |
| 5 | §9 | 第 1 项待决；第 4 项基准 | 第 1 项关闭；第 4 项基准确认 | Owner 15:14 |

**未变更**：Stage A–E、§2.1–§2.3、§2.6 三分输出与约束 1–6、§3、§4、§8 / §8.1（含 P2 四条执行边界）。判定规则与 v0.8 完全相同。

## 1. 分阶段状态机

与 v0.8 §1 相同。P2 按 §8.1 处理。

## 2. 算法本体

§2.1–§2.3 与 v0.8 相同。§2.6 与 v0.8 相同，参考验证一段替换为：

> **参考验证**：执行方在 Python 3.12.16 / Unicode 15.0.0 下，对全部已分配码点 `c` 逐一以 `"A" + c + "B"` 检查 `N(N(s)) = N(s)`，反例 0。**正式验证须在 Python 3.13.15 / Unicode 15.1.0 下运行同目录 `b5_v0_8_1_verify.py`**，输出 `EXHAUSTIVE_STRING_IDEMPOTENCY counterexamples 0` 方为通过。

## 3–4

与 v0.8 §3–§4 相同。

## 5. 可信计算与 Business Key

规则与 v0.8 §5 相同，canonical JSON 改为：

```json
{"schema":"product-business-key","rule_version":"b5-min-v0.2","brand_norm":"...","mpn_norm":"..."}
```

`pbk1_` + SHA-256（UTF-8，固定字段顺序，无多余空白）；`rule_version` 入哈希；原始输入不入哈希；不声称持久、并发或跨进程唯一；`product_uid` 不由公式生成。

### 5.1 计算示例（固定值，供实现与测试比对）

输入：`brand_norm = "texas instruments"`，`mpn_norm = "lm358dr"`（示例值，非真实数据裁定）。

canonical JSON（UTF-8 字节即为下行文本）：

```
{"schema":"product-business-key","rule_version":"b5-min-v0.2","brand_norm":"texas instruments","mpn_norm":"lm358dr"}
```

Key：

```
pbk1_e71ca20eeb028ce1450e733f3d162a97fb72adb45061dc5ba642fde0f70affaf
```

说明：Key 只依赖 canonical JSON 字节，与 Python / Unicode 版本无关；`rule_version` 不同即产生不同 Key，因此 `b5-min-v0.1` 下生成的任何 Key 不得与本版 Key 混用或互相比较。

## 6. 测试向量

见同目录 `T8_VECTORS_AND_DISPOSITION_v0_8_1_DRAFT.md`。

## 8. 规范优先级与历史边界

与 v0.8 §8、§8.1 相同（P2 四条执行边界不变）。

## 9. 冻结前待决

1. ~~算法版本是否升为 `b5-min-v0.2`~~：**已裁定**，Owner 2026-11-27 15:14 `OWNER_ACCEPTED`；
2. P2 批准：`OWNER_DECISION_REQUIRED`（本版排除）；
3. P2 排除期间 `TRUSTED` 校验失败输入的处置：`OWNER_DECISION_REQUIRED`；
4. **正式测试 Unicode 基准：Python 3.13.15 / Unicode 15.1.0**（Owner 15:14 确认）。53 项向量与 §2.6 穷举须在该环境运行 `b5_v0_8_1_verify.py` 复算，结果作为测试证据归档；
5. Brand 接口契约 B2 行按 A1 出新版；
6. 独立 Reviewer 复核。

## 10. 非声明

- 本稿不是 B5 冻结、不是 P2 批准、不是 P-06 批准、不是 B-1 授权；算法版本裁定不自动批准冻结、实施或生效；
- 未修改 50_–75_ 任何文件；未修改代码、测试、DB、DDL、API、OAuth；未运行项目测试；未 commit / push。

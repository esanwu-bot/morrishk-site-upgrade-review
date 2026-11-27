# B5 v0.8.2 修订说明（验证脚本门禁 + 变更描述更正 + 首次项目环境运行记录）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-B1-B5-REV-082 |
| 版本 | v0.8.2-DRAFT |
| 日期 | 2026-11-27 |
| 状态 | **DRAFT — NOT_FROZEN — NOT_APPROVED — NOT_EFFECTIVE** |
| 算法版本 | `b5-min-v0.2`（不变） |
| 触发 | Reviewer 对 commit `7ad5941` 的意见（Owner 转达，2026-11-27 15:22）：B5-REV-04、B5-REV-05、B5-REV-06 |
| 基线 | `76_sessionb_b1_b5_contract_r8/`（已于 commit `7ad5941` 提交；未修改） |
| 起草方 | 执行代理；非 Reviewer 结论 |

## 1. 范围

本修订**只**涉及：

1. 新验证脚本 `b5_v0_8_2_verify.py`（替代 `b5_v0_8_1_verify.py` 作为验收脚本；旧脚本保留不改）；
2. 更正 v0.8.1 §0 的变更描述（B5-REV-05）；
3. 记录 Owner 在项目环境运行 v0.8.1 旧脚本的输出（转录，非 Reviewer 复算）。

**不变**：B5 v0.8.1 规范正文的全部判定规则；53 项向量的输入与期望（状态、`diagnostic_norm`）；P2 `PROPOSED` 及 §8.1 四条执行边界；算法版本 `b5-min-v0.2`；KEY-01 期望值。

## 2. B5-REV-04：验证脚本门禁

| 缺口 | v0.8.1 脚本 | v0.8.2 脚本 |
|---|---|---|
| 环境校验 | 只打印 | **G1**：不是 Python 3.13.15 / Unicode 15.1.0 → `G1_ENV FAIL`，**立即退出码 1**；`--allow-env-mismatch` 仅用于调试，结果仍为退出码 1，不得作为正式证据 |
| KEY-01 | 只打印 | **G4**：与固定期望 `pbk1_e71ca20eeb028ce1450e733f3d162a97fb72adb45061dc5ba642fde0f70affaf` 比对，不符 → FAIL |
| 退出码 | 恒为 0 | 任一 G1–G4 失败 → **退出码 1**；全部通过 → `RESULT PASS (exit 0)` |
| `review_triggers` | 未断言 | **G2 断言触发集合**：每项向量的 {(规则, 码点)} 必须与期望一致；IDEM 原记录同 |

**覆盖声明**：

- G2 断言触发的**规则与码点**；**不断言触发位置**（位置格式随实现可不同，规范 §2.6 只要求记录）。
- 脚本只覆盖 Unicode 阶段（Stage C 与 `diagnostic_norm`）；Stage A / B / D / E（结构、Brand、MPN 格式、RESOLVED）不在脚本范围。
- 新增的触发期望值由执行方按规范 §2.2 计算并写入脚本 `VECTORS` / `IDEM`；Reviewer 应核对其与规范一致。

**执行方自检**（Python 3.12.16 / Unicode 15.0.0，非项目环境；为检验门禁，临时把环境要求改成本地版本）：

| 场景 | 结果 |
|---|---|
| A 默认运行（环境不符） | `G1_ENV FAIL`，退出码 1，未继续 |
| B `--allow-env-mismatch` | G2 53/53、G3 0、G4 PASS，但 `RESULT FAIL G1`，退出码 1 |
| C 环境要求临时改为本地版本 | G1–G4 全 PASS，退出码 0 |
| D 篡改 T8-04 期望状态 | `G2 52/53 FAIL`，退出码 1 |
| E 篡改 M2-08 期望触发规则 | `G2 52/53 FAIL`，退出码 1 |
| F 篡改 KEY-01 期望值 | `G4 FAIL`，退出码 1 |

## 3. B5-REV-05：v0.8.1 变更描述更正

v0.8.1 表头“本版为 v0.8 的同步修订，只改算法版本及其引用位置”**不准确**。准确描述为：

1. **规范判定规则相对 v0.8 未变**；
2. **算法版本及相关引用统一为 `b5-min-v0.2`**（表头、§5 canonical JSON、§9 第 1 项）；
3. **新增计算示例与验证材料**：§5.1 KEY-01 计算示例；§2.6 项目环境验证要求；§9 第 4 项基准确认；验证脚本；向量文件 §7 结果栏与 §8 KEY-01。

v0.8.1 文件已提交复核，不就地修改；以本节为准。

## 4. Owner 项目环境运行记录（v0.8.1 旧脚本）

**性质：执行方转录 Owner 本机运行输出；不是 Reviewer 在该环境的独立复算；旧脚本无失败门禁，不作为最终证据（Reviewer 15:22 意见）。**

| 项 | 转录值 |
|---|---|
| 命令 | `python reviewer_packets\20261127_B5_v0_8_1\b5_v0_8_1_verify.py` |
| 运行人 / 时间 | Owner，2026-11-27（约 15:22 Asia/Shanghai，据消息时间） |
| `ENV` | `3.13.15 Unicode 15.1.0 RULE_VERSION b5-min-v0.2` |
| 逐项 | 53 项全部 `PASS`（输出原样见对话记录） |
| `VECTORS` | `53 / 53` |
| `EXHAUSTIVE_STRING_IDEMPOTENCY counterexamples` | `0` |
| `KEY_EXAMPLE` | `pbk1_e71ca20eeb028ce1450e733f3d162a97fb72adb45061dc5ba642fde0f70affaf`（与 §5.1 期望一致，经人工比对，非脚本断言） |
| 退出码 | 未记录 |

## 5. 正式证据所需

在 Python 3.13.15 / Unicode 15.1.0 运行：

```
python b5_v0_8_2_verify.py
echo %ERRORLEVEL%
```

须输出 `G1_ENV PASS`、`G2_VECTORS 53 / 53 PASS`、`G3 … counterexamples 0 PASS`、`G4_KEY01 … PASS`、`RESULT PASS (exit 0)`，且 `%ERRORLEVEL%` 为 `0`。

## 6. 非声明

- 本修订不是 B5 冻结、不是 P2 批准、不是 P-06 批准、不是 B-1 授权；
- 未修改 50_–76_ 任何文件；未修改项目代码、测试、DB、DDL、API、OAuth；未 commit / push。

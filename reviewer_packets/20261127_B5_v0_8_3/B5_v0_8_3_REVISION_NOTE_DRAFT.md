# B5 v0.8.3 修订说明（G2 重复触发计数补强）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-B1-B5-REV-083 |
| 版本 | v0.8.3-DRAFT |
| 日期 | 2026-11-27 |
| 状态 | **DRAFT — NOT_FROZEN — NOT_APPROVED — NOT_EFFECTIVE** |
| 算法版本 | `b5-min-v0.2`（不变） |
| 触发 | Reviewer 对 `7ad5941` / `5896f75` 的复核意见（Owner 转达，2026-11-27 15:32）：G2 `trigset()` 以集合合并同一 (规则, 码点) 的多次触发 |
| 规范正文基线 | `7ad5941`：`reviewer_packets/20261127_B5_v0_8_1/B5_MINIMAL_NORMALIZATION_RULES_v0_8_1_DRAFT.md`（不变） |
| 验证材料基线 | `5896f75`：`reviewer_packets/20261127_B5_v0_8_2/b5_v0_8_2_verify.py`（不变，保留） |
| 起草方 | 执行代理；非 Reviewer 结论 |

## 1. 变更（仅限验证脚本）

| # | v0.8.2 | v0.8.3 |
|---|---|---|
| 1 | `trigset()` 返回 `sorted({(规则, 码点)})`，同规则同码点的多次触发合并为一项 | 返回 `sorted((规则, 码点) for …)`，**按出现次数计数**，不合并 |
| 2 | — | 新增 **G5**：DUP-01（`'A\xadB\xadC'`，两次 LIST U+00AD）、DUP-02（`'ßß'`，两次 M1 U+00DF）、DUP-03（`'①①'`，两次 M2 U+2460） |

**不变**：B5 v0.8.1 全部判定规则；53 项向量的输入、期望状态与 `diagnostic_norm`；53 项的触发期望（均无重复码点，计数与集合结果相同）；G1、G3、G4；KEY-01；P2 `PROPOSED` 及 §8.1 四条边界；`b5-min-v0.2`。

覆盖声明：仍**不断言触发位置**；断言 (规则, 码点, 出现次数)。

## 2. 执行方自检（Python 3.12.16 / Unicode 15.0.0，非项目环境）

| 场景 | 结果 |
|---|---|
| 环境要求临时改为本地版本 | G1–G5 全 PASS；`RESULT PASS (exit 0)` |
| 默认（环境不符） | `G1_ENV FAIL`，退出码 1 |
| 把 `trigset()` 改回集合（v0.8.2 写法） | DUP-01/02/03 全部 FAIL；`G5 FAIL`；退出码 1 —— 证明 G5 能检出合并 |

## 3. 正式证据所需

1. Python 3.13.15 / Unicode 15.1.0 运行 `python b5_v0_8_3_verify.py`，`RESULT PASS (exit 0)`，`%ERRORLEVEL%` = 0；
2. Reviewer 独立运行（规定环境）；
3. 对 `7ad5941` 的 v0.8.1 目录、`5896f75` 的 v0.8.2 目录及本目录分别 `sha256sum -c SHA256SUMS`。

## 4. 非声明

不是 B5 冻结、P2 批准、P-06 批准或 B-1 授权；未修改 50_–77_ 任何文件；未修改项目代码、测试、DB、DDL、API、OAuth；未 commit / push。

# P0-2 五项独立复验总判定

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-P02-REVERIFY-006 |
| 版本 | v1.0 |
| 日期 | 2026-11-23 |
| 权威基线 | `feat/gate6a-audit` / `600439a5eee69fb3a1cec2715e37080e48ca9840`（干净工作区） |
| 报告分支 | `docs/sessionb-p0-2-independent-reverification`（基于 `4d8adb5`） |
| 结论 | **P0-2 = BLOCKED**；五项 1 PASS / 4 FAIL；不提交 P0-2 关闭申请 |

## 1. 五项汇总矩阵

| # | 检查项 | 结果 | 关键证据 |
|---|---|---|---|
| 1 | 产品身份 | **FAIL** | `src/icpdf/domain/product.py:37-54`；`pipeline.py:151-158`；`pdf_loader.py:58-67`；无 brand/supplier 检索；`01_PRODUCT_IDENTITY_REVIEW.md` |
| 2 | 全局 ID | **FAIL** | `pipeline.py:152`；`pdf_loader.py:59`；`run_store.py:24-25`；`lake/_build_lake.py:364-400`；同一 MPN 两 PDF 得到不同 product_id；`02_GLOBAL_ID_REVIEW.md` |
| 3 | 解析输出及证据 | **PASS（解析/证据范围）** | `domain/evidence.py:20-50`；83/83 测试；样例 tables/candidates 含 page/bbox/table/row/cell ID；`03_PARSER_OUTPUT_EVIDENCE_REVIEW.md` |
| 4 | 静态 B2B 桩 | **FAIL（B2B 能力）** | 权威提交无 B2B 文件；`workbench/b2b` 仅 cache；静态桩未跟踪并已 stash；`04_STATIC_B2B_STUB_REVIEW.md` |
| 5 | 后端实现进度 | **FAIL** | 无 Business API/DB/OAuth 代码/依赖/测试；lake 仅 3 表；75 矩阵 0 实现；`05_BACKEND_IMPLEMENTATION_REVIEW.md` |

**判定规则：** 五项必须全部 PASS 才可提交 P0-2 关闭申请；当前 4 项 FAIL，故 **P0-2 保持 BLOCKED，不提交关闭申请**。

## 2. 权威决策与干净环境：已完成

| 项 | 结果 |
|---|---|
| 项目负责人书面指定分支/SHA/工作树口径 | 已完成（转录见 `00_AUTHORITY_DECISION.md`） |
| 本地/远程/指定 SHA 一致 | 是：`feat/gate6a-audit` = `origin/feat/gate6a-audit` = `600439a5…840` |
| 原 20 项工作树内容隔离 | 是：`stash@{0}` / `3a7364b09299b8c7a3f83137bb6fbb17a2019748`；33 个文件；未 drop/未 apply |
| 工作区干净 | 是（`git status --short` 为空） |
| 未修改权威代码/远端/历史 | 是 |
| stash 恢复 | 本轮不恢复；后续获授权可用 `git stash apply 3a7364b…` 并复核哈希 |

> 因此，上一轮报告中的 C1“权威分支未定”阻塞已经解除；当前阻塞来自五项复验结果，不是基线不确定。

## 3. 最终汇报 10 问

1. **权威分支和 SHA 是否完全一致？**
   是。本地 `feat/gate6a-audit`、`origin/feat/gate6a-audit`、`backup/full-local-20261114` 与指定 SHA 均为 `600439a5eee69fb3a1cec2715e37080e48ca9840`；`git ls-remote` 已核验。

2. **原 20 项修改是否全部安全隔离？**
   是。20 项（33 个实际文件）全部进入 `stash@{0}`（commit `3a7364b09299b8c7a3f83137bb6fbb17a2019748`）；含未跟踪目录/文件；未使用 reset/clean/drop。

3. **当前工作区是否干净？**
   是。最终 `git status --short` 为空；HEAD/branch 为 `feat/gate6a-audit` / `600439a5`（`evidence/09_final_clean_status.txt`）。

4. **五项检查分别是 PASS 还是 FAIL？**
   产品身份 **FAIL**；全局 ID **FAIL**；解析输出/证据 **PASS（解析范围）**；静态 B2B 桩 **FAIL（B2B 能力）**；后端实现 **FAIL**。

5. **每项是否具备文件行号和实际执行证据？**
   是。见 §1 矩阵、五份检查报告、`evidence/` 日志（83/83 测试、两次解析、ID 复核、lake/路由检索、stash/干净状态）。

6. **是否发现静态桩冒充真实业务实现？**
   权威基线中 **没有**：B2B 文件不在提交中；唯一静态桩 `workbench/b2b/serve_b2b.py` 未跟踪、已排除，且自身标注 `x_local_static_stub: true`、仅 V101、不签可用凭证。风险是该桩若被引用为“已联通”会误判；本报告已排除。

7. **是否存在需要修复的代码或架构问题？**
   是，至少：
   - 产品身份缺 Brand/supplier，`product_id` 绑定文档；
   - 无跨文档全局 ID/产品主表；
   - B2B 服务不存在；
   - 无 Business API/Repository/DB/OAuth/授权/审计；
   - Parser 输出未映射到 16 操作 DTO；
   - 75 矩阵 0 实现。

8. **P0-2 是否满足关闭申请条件？**
   **不满足。** 4 项 FAIL；不提交 P0-2 关闭申请。

9. **新报告分支和提交 SHA 是什么？**
   分支 `docs/sessionb-p0-2-independent-reverification`；报告提交 SHA 见最终汇报（本文件提交后生成），基于 `4d8adb5a89252fbd8964c62fe1efe1b334cc2654`。

10. **stash ID 是什么，原修改如何安全保留？**
    `stash@{0}` / `3a7364b09299b8c7a3f83137bb6fbb17a2019748`；原 20 项/33 文件在 stash commit 中，未 drop；后续获授权可 apply 并复核 `00_pre_stash_hashes.txt`。

## 4. 为什么不是 PARTIAL PASS

- “权威基线确定 + 干净环境”这一前置已完成，但 P0-2 的验收规则要求五项全部 PASS。
- 五项中 4 项 FAIL，且失败属于代码/架构缺口，不是文档措辞；因此不能把“环境已干净”当作 P0-2 通过。
- 结论：**P0-2 BLOCKED**，阻塞点已从“权威分支未定”转为“产品身份/全局 ID/B2B/后端未实现”。

## 5. 最小修复路径（需另行授权）

| 顺序 | 修复 | 责任方 | 证据门槛 |
|---|---|---|---|
| 1 | 产品身份：Brand/supplier + `(mpn_norm, brand_norm)` + 多文档合并规则 | Ds Bit 维护人/架构 | 代码 + 测试 + 与契约一致 |
| 2 | 全局 ID：注册表/主键 + 重复导入/重解析/更新语义 | Ds Bit 维护人 | 表结构/迁移 + 跨文档测试 |
| 3 | 注册表/主表：产品、分类、证据、状态 | Ds Bit/后端 | DDL/接口 + 数据校验 |
| 4 | B2B Runtime/API/Repository/Yii2/OAuth | 后端/集成 | 16 操作/75 矩阵/20 错误码测试 |
| 5 | 认证/授权/审计/日志/回滚 | 安全/运维 | 安全测试 + 生产准入证据 |

完成后再在**同一权威基线或新指定基线**上重跑五项；全部 PASS 后才可提交 P0-2 关闭申请，由 Reviewer 独立复核。

## 6. 边界

- 未修改 Ds Bit 权威代码、未提交 Ds Bit 代码、未修改分支/远端。
- 未恢复 20 项 stash、未合并、未 drop。
- 未开始 Business API 实现；未执行真实 OAuth/生产 DB/第三方生产接入；未 Contract Freeze/部署。
- 本文件不宣布 P0-2 关闭，也不宣布 Production API 获批。
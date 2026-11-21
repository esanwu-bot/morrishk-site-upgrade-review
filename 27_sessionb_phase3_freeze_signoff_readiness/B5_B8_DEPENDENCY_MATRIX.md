# B5_B8_DEPENDENCY_MATRIX · 设计内部阻断依赖矩阵

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PHASE3-B5B8-001 |
| 版本 | v1.0-draft（登记；状态引自 `12_/API_CONTRACT_CANDIDATE_v1.md` §11.2 与 `25_/RULE_STATUS_REGISTER.md`，原样保持） |
| 口径 | B5–B8 任一未关闭 → Contract Freeze = NOT_READY；本矩阵只描述依赖与影响，不执行关闭 |

## 1. 总览

| ID | 定义（一句话） | 当前状态 | 上游依赖 | 关闭条件 | 对 Freeze |
|---|---|---|---|---|---|
| **B5** | MPN-NORM-v1 规则集与 `pbk1_` 编码评审冻结 | PROPOSED | IQ-01（方向已登记，待签署）；R-ID-07（identity_scope 入键与否）；冲突判定算法（F-11 占位） | 书面冻结 + 向量化测试证据（固定输入→期望输出跨版本可复算）+ 碰撞分析（完整 SHA-256） | **阻断（P0-4）** |
| **B6** | 闸门 / `visible_state` / `release_state` 三命名空间统一 | OPEN | 无上游 IQ（可独立裁） | 维护人书面统一命名或映射，写入契约 | **阻断（P0-5）** |
| **B7** | 技术参数字典正式种子与命名标准 | 待 PM 提交 | IQ-02（已裁开放）；字典结构已固定 | PM 提交种子 + 冻结记录登记来源与版本 | **阻断（P0-6）** |
| **B8** | 证据公开范围 + 文档口径统一 | OPEN（IQ-08） | 口径统一先行（候选 §11.2 vs 主文档附录 A.3） | 口径统一 → 裁定范围或书面豁免 | **阻断（P0-7）** |

## 2. B5 详细依赖

| 维度 | 内容 |
|---|---|
| 影响的 API 操作 | 全部身份字段与路由（OP-02/03/05/06/07 的 `product_business_key`；`ProductBusinessKey` 模式 `^pbk1_[0-9a-f]{64}$`） |
| 影响的错误码 | 42202 `MPN_NORMALIZATION_CONFLICT`（**仅当 B5 裁定确认归一化冲突条件后按裁定范围使用**——F-10 来源冲突不在其触发范围）；42201 语义随 R-ID-08 |
| 影响的 Scope/测试矩阵 | Scope 矩阵不含 B5；但身份相关断言（OP-02 精确查找、增量同步键稳定性）依赖冻结 |
| 影响的测试 | `26_/TEST_AND_ACCEPTANCE_CRITERIA.md` §B-2 向量化测试表；`FIXTURE_DATA_SPEC.md` 业务键现算不变式 |
| 尚缺证据 | 生产重复率与碰撞分析；冲突判定算法定义（F-11 占位，不得伪造已验证向量或规范化输出）；`identity_scope` 入键裁定（R-ID-07） |
| 特别边界 | ①F-10 为**来源身份冲突**候选（同源文档互斥候选），**不是**归一化冲突；②F-11 为归一化冲突**待裁定占位**，全部输出 PROPOSED；③`R-ID-04` 仅作状态枚举来源，不扩展为已裁定冲突算法；④冻结后规则变化 = 不兼容变更 |

## 3. B6 详细依赖

| 维度 | 内容 |
|---|---|
| 影响的 API 操作 | OP-02（release_state 过滤）、OP-04（gates + visible_state 派生）、`/status` 全链路 |
| 影响的错误码 | 无直接错误码；影响状态值语义（间接影响 40302/41001 的前置判定） |
| 影响的 Scope/测试矩阵 | 75 行 Scope 矩阵行 63（getProductStatus 允许行）业务断言挂 B6；OP-04 派生矩阵 4 行挂 B6 |
| 影响的测试 | `26_` FIXTURE gates 双存结构（裁定后收敛）；派生规则 §9.2 断言 |
| 尚缺证据 | 维护人书面决定（A 原样冻结 / B 重命名 / C 映射表） |
| 特别边界 | `PIPELINE_PASS` ≠ `CONTENT_APPROVED` ≠ `RELEASE_APPROVED`；Mock 的 RELEASED/PENDING/REVOKED 为演示简化（DIFF-MOCK-06），不得据此改契约 |

## 4. B7 详细依赖

| 维度 | 内容 |
|---|---|
| 影响的 API 操作 | 16 操作中**无**字典端点（字典内容不直接出现在线形）；影响 `TechnicalParameter` 字段语义（name/category 取值来自字典） |
| 影响的错误码 | 无 |
| 影响的 Scope/测试矩阵 | 无直接；字典内容断言在 B7 关闭前保持空位 |
| 影响的测试 | FIXTURE D-FIX 与正式种子的隔离边界保持；`DEMO_FIXTURE` 纪律不变 |
| 尚缺证据 | PM 首个真实种子（正式 code/定义/单位/数据类型/适用范围/别名）与命名标准 |
| 特别边界 | Fixture 不得冒充种子；Fixture 测试 ≠ 真实数据验证（IQ-02 裁定 CONFIRMED） |

## 5. B8 详细依赖

| 维度 | 内容 |
|---|---|
| 影响的 API 操作 | OP-06 `/evidence`（暴露字段白名单）；间接影响 OP-03（technical.parameters.evidence_ids 关联展示） |
| 影响的错误码 | 40301（scope 缺失路径可先测）；暴露不足/超范围的行为断言待裁定 |
| 影响的 Scope/测试矩阵 | 75 行矩阵行 35（listProductEvidence 允许行）业务断言挂 B8；SEC-10 未批准证据访问 |
| 影响的测试 | `26_` FIXTURE E-FIX `pending_disclosure` 证据；W-2 EvidenceRepository 过滤层 |
| 尚缺证据 | 口径统一（候选 §11.2 vs 主文档附录 A.3 `:2433`）；客户法务/业务对公开白名单的裁定；截图获取通道决定 |
| 特别边界 | `RELEASE_APPROVED` ≠ 证据无限制公开；Ds Bit 产品事实发布批准 ≠ Morrishk 营销内容批准（R-EV-03 CONFIRMED 边界） |

## 6. 与 Contract Freeze 的阻断关系（汇总）

```text
Contract Freeze
 ├─ 被 B5 阻断（P0-4）：身份路由主键未冻结
 ├─ 被 B6 阻断（P0-5）：三状态命名空间未统一
 ├─ 被 B7 阻断（P0-6）：字典种子未提交
 ├─ 被 B8 阻断（P0-7）：证据公开范围未裁 + 口径未统一
 └─ 任一未关闭 → x-contract-status 保持 CANDIDATE_NOT_FROZEN
```

当前四项**全部未关闭**；关闭动作分别归属：评审冻结方（B5）、设计文档维护人（B6）、PM（B7）、口径统一方+客户法务/业务（B8）。执行 Agent 不代行。

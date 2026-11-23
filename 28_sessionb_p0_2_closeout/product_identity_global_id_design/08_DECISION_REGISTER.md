# 产品身份与全局 ID 决策清单

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-008 |
| 状态 | **PROPOSED_NOT_APPROVED** |
| 说明 | 以下均为 Agent 推荐与待决事项；**不是**负责人已批准的架构决策 |
| 签署栏 | 决策人/日期/结论均留白；未签署前不得用于实现、冻结或生产 |

## 1. 决策总表

| 编号 | 决策问题 | 可选方案 | 推荐 | 推荐理由 | 主要风险 | 影响范围 | 需签署 | 当前状态 |
|---|---|---|---|---|---|---|---|---|
| D-01 | Brand 权威来源与注册表 | A 自由文本；B 注册表+别名+证据；C 直接用 PDF metadata | **B** | 可追溯、可合并、可审计 | 需要治理与人工维护 | Brand/产品/API | 是 | PROPOSED_NOT_APPROVED |
| D-02 | Brand 规范化/别名/合并/更名 | A 简单大写去空格；B 注册表别名+mer.gov/更名映射；C 全人工 | **B** | 解决 TI/Texas Instruments 等；保留历史 | 别名冲突/治理成本 | Brand 键、产品合并 | 是 | PROPOSED_NOT_APPROVED |
| D-03 | MPN 归一化规则 | A 单一全局规则；B 通用+按 Brand/厂商 profile+版本；C 全人工 | **B** | 厂商差异大；可测试/可复算 | profile 维护；规则版本迁移 | MPN 键、身份、API | 是 | PROPOSED_NOT_APPROVED |
| D-04 | 变体/封装/版本是否进入身份键 | A 仅 MPN+Brand；B +variant_key；C 全部独立产品 | **B（待业务确认 variant 定义）** | 避免变体误合并/误拆分 | 变体定义不清导致边界争议 | 自然键/产品数/API | 是 | PROPOSED_NOT_APPROVED |
| D-05 | 全局 ID 方案 | A 自然键直接作主键；B 内容哈希；C 注册表 surrogate+自然键；D 旧自增 ID | **C** | 稳定、可合并/拆分/审计 | 需要注册表/迁移 | 全局 ID/DB/API | 是 | PROPOSED_NOT_APPROVED |
| D-06 | 合并/拆分/冲突裁决 | A 自动合并；B 人工裁决+谱系+审计；C 不合并 | **B** | 避免静默错并；可回滚 | 裁决人力/时效 | 产品身份/审计 | 是 | PROPOSED_NOT_APPROVED |
| D-07 | 旧 `product_id=prod-doc` 兼容 | A 破坏性替换；B 保留旧 ID+新增 product_uid+映射；C 仅视图层 | **B** | 兼容旧产物/客户端、可回滚 | 双读/迁移复杂度 | Parser/Repository/API | 是 | PROPOSED_NOT_APPROVED |
| D-08 | API 暴露 `pbk1_`/`product_uid` | A 仅 pbk1；B 仅 uid；C 双字段（uid 主、pbk 兼容） | **C** | 稳定主键+自然键兼容 | DTO/路径变更；不兼容风险 | 16 操作/75 矩阵 | 是 | PROPOSED_NOT_APPROVED |
| D-09 | 16 操作/75 矩阵修订范围 | A 不改路径；B 改路径参数；C 新增身份管理操作 | **B/C 组合，待契约评审** | 身份语义需显式 | 契约线形变更/版本化 | OpenAPI/75 矩阵 | 是 | PROPOSED_NOT_APPROVED |
| D-10 | 迁移/幂等/并发/回滚 | A 一次性迁移；B 分阶段+双读+回滚开关；C 不迁移 | **B** | 降低生产风险 | 迁移窗口/一致性 | DB/API/运维 | 是 | PROPOSED_NOT_APPROVED |
| D-11 | 多文档/多版本关系 | A 一产品一文档；B 产品多文档+版本关系；C 每版本独立产品 | **B** | 同产品多 datasheet 是常态 | 版本语义/排序 | 产品/文档/API | 是 | PROPOSED_NOT_APPROVED |
| D-12 | 未知/缺失 Brand | A 拒绝；B PENDING_BRAND；C 归入 UNKNOWN 产品 | **B** | 不丢数据、不误合并 | 待确认队列积压 | 身份状态/API | 是 | PROPOSED_NOT_APPROVED |
| D-13 | Brand 别名冲突 | A 后写覆盖；B 冲突挂起+人工裁决；C 取最高频 | **B** | 避免静默错并 | 裁决时效 | Brand/产品 | 是 | PROPOSED_NOT_APPROVED |
| D-14 | 身份数据来源优先级 | A 解析优先；B 客户主数据优先+解析证据；C 人工优先 | **B** | 客户权威+可追溯 | 源冲突 | Brand/MPN/产品 | 是 | PROPOSED_NOT_APPROVED |
| D-15 | 审计与审批角色 | A 执行者自审；B 执行/批准分离+审计；C 无审批 | **B** | 合并/拆分需问责 | 流程成本 | 治理/审计 | 是 | PROPOSED_NOT_APPROVED |

> `(mpn_norm, brand_norm)` 仅在 D-04/D-05 签署后作为候选自然键；不是永久唯一键。

## 2. 签署栏（由负责人填写，Agent 不代填）

| 决策 | 决策人 | 结论（采纳/修改/驳回） | 日期 | 备注 |
|---|---|---|---|---|
| D-01 |  |  |  |  |
| D-02 |  |  |  |  |
| D-03 |  |  |  |  |
| D-04 |  |  |  |  |
| D-05 |  |  |  |  |
| D-06 |  |  |  |  |
| D-07 |  |  |  |  |
| D-08 |  |  |  |  |
| D-09 |  |  |  |  |
| D-10 |  |  |  |  |
| D-11 |  |  |  |  |
| D-12 |  |  |  |  |
| D-13 |  |  |  |  |
| D-14 |  |  |  |  |
| D-15 |  |  |  |  |

## 3. 决策依赖顺序（建议）

```text
D-14 来源优先级
  -> D-01 Brand 注册表
  -> D-02 Brand 规范化/别名
  -> D-03 MPN 规范化
  -> D-04 变体/版本边界
  -> D-05 全局 ID
  -> D-06 合并/拆分/冲突
  -> D-07 兼容
  -> D-08/D-09 API/矩阵
  -> D-10 迁移/幂等/回滚
  -> D-11/D-12/D-13/D-15 支撑决策
```

## 4. 当前状态声明

- 全部决策：`PROPOSED_NOT_APPROVED`。
- 未签署前：
  - 不得开始 Business API 实现；
  - 不得修改 OpenAPI/75 正式状态；
  - 不得执行 Contract Freeze/生产迁移；
  - 不得把推荐写成负责人已批准。
- 本文件不改变 P0-2 BLOCKED 结论。
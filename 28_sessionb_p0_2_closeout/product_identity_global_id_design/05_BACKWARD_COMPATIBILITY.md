# 向后兼容设计

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-005 |
| 版本 | v2.0-R2 |
| 状态 | **PROPOSED_NOT_APPROVED** |
| 事实基线 | `product_id=prod-{document_id}`、`document_id=doc-{sha[:12]}`、`run_id` 执行级、`pbk1_` 候选 |
| 相关决策 | D-07、D-10、D-24、D-26、D-31（见 `08_DECISION_REGISTER.md`） |

## 1. 现有字段的实际语义

| 字段/对象 | 当前实际含义 | 不是 |
|---|---|---|
| `product_id` | `prod-{document_id}`，文档内产品实例 | 不是跨文档产品主键 |
| `document_id` | `doc-{pdf_sha256[:12]}`，PDF 内容身份 | 不是产品身份 |
| `run_id` | UTC 时间戳 + 随机 hex，解析执行身份 | 不是产品/文档身份 |
| `requested_mpn` | 调用方输入 | 不是文档识别结果 |
| `normalized_mpn` | 当前恒等于 requested | 不是真正归一化结果 |
| `manufacturer` | PDF metadata author，可空 | 不是 Brand |
| `pbk1_` | 候选业务键编码，未实现 | 不是已批准/已实现主键 |
| `tenant_id` / `site_id` | 当前不存在 | 不是可选装饰字段；迁移后必须显式回填 |
| Repository | 当前无 Business API Repository | — |
| DB | lake 仅 raw_docs/parse_runs/eval_results | 无产品/分类/映射表 |

## 2. 目标语义

```text
product_uid          全局稳定产品 ID（surrogate，候选）
brand_id             品牌注册表主键（候选）
mpn_norm             归一化 MPN（profile/version）
variant_state        UNKNOWN / NOT_APPLICABLE / KNOWN（见 03 §3.1）
document_id          保持不变（PDF 内容身份）
run_id               保持不变（执行身份）
legacy_product_id    保留旧 product_id=prod-doc 作为文档实例/兼容标识
tenant_id / site_id  首期 = Morrishk / Morrishk 官网；旧产物迁移时回填
pbk1_                候选自然键编码，仅 CONFIRMED 生成
```

## 3. 兼容原则

1. **不删除旧 ID**；不把 `product_id=prod-doc` 直接替换为 `product_uid`。
2. 新增 `product_uid` 与映射/关联表；旧字段保留。
3. `document_id`/`run_id` 语义不变。
4. `pbk1_` 若规则变化，旧值进入 alias，不静默失效。
5. 旧解析产物/旧客户端可继续读取旧字段；新客户端使用新字段。
6. 迁移可回滚；不做破坏性替换。
7. **租户维度必须显式化**：旧产物在写入新表前必须带 `tenant_id`/`site_id`；首期统一回填为 Morrishk/官网，不得留空。
8. `PENDING_*` 身份不得生成 `product_uid`/`pbk1_`；旧 `product_id` 只能映射到 `legacy_map`，不能伪装成全局身份。

## 4. 兼容方案比较

| 方案 | 做法 | 优点 | 风险 | 推荐 |
|---|---|---|---|---|
| A. 直接把 `product_id` 改成全局 ID | 破坏性替换 | 字段少 | 旧产物/旧客户端断裂；无法回滚 | 不推荐 |
| B. 保留 `product_id`，新增 `product_uid` + 映射（推荐） | 双字段/映射表 | 兼容、可迁移、可回滚 | 需要双读/迁移治理 | 推荐 |
| C. 用 `pbk1_` 替代 `product_id` | 自然键替换 | 可复算 | 规则变化即失效；变体/合并无法表达 | 不推荐 |
| D. 仅提供视图/兼容层 | 逻辑映射 | 不动旧表 | 复杂查询/性能/一致性 | 可选补充 |

## 5. 建议的兼容层

```text
legacy_map
  legacy_product_id    prod-{document_id}
  product_uid          nullable until resolved
  document_id
  tenant_id            迁移必填；首期固定 Morrishk
  site_id              迁移必填；首期固定官网
  reason               DOCUMENT_INSTANCE / UNRESOLVED / PENDING / CONFLICT
  created_at
  resolved_by / resolved_at

API 兼容：
  - 旧字段 product_id 继续返回（标记为 document-scoped）
  - 新字段 product_uid / brand / mpn_norm / variant_state / normalizer_version 新增
  - 若客户端使用 pbk1_，通过 alias/自然键解析到 product_uid
  - 旧字段查询不得绕过 tenant ACL（见 06 §8）
```

## 6. 历史数据迁移（未来，需授权）

| 步骤 | 内容 | 风险/处理 |
|---|---|---|
| M1 | 从现有 runs 导出 `product_id/document_id/requested_mpn` | 运行产物可能不入库；需快照 |
| M2 | 回填 `tenant_id`/`site_id` | 缺失即阻断该条，不得默认归入全局 |
| M3 | 补 Brand/MPN 归一化 | 缺少 Brand → `PENDING_BRAND`；不生成 uid |
| M4 | 变体状态判定 | 未定 → `PENDING_VARIANT`；不得留 NULL |
| M5 | 同 MPN 多文档冲突识别 | 人工裁决；不自动合并 |
| M6 | 分配 `product_uid`（仅 CONFIRMED）+ 写 `legacy_map` | 保留旧 product_id；PENDING 只写 legacy_map |
| M7 | 双读验证（旧/新字段 + tenant ACL） | 差异清单；跨租户泄露即阻断 |
| M8 | 切换读路径（可选） | 保留回滚开关 |
| M9 | 旧字段长期保留/只读 | 不删除历史 |

- 当前没有业务 DB；迁移只在设计层面，本轮不执行。
- 不得在未授权情况下写生产库或修改历史产物。

## 7. 双读/双写

- **双读**：新 API 同时能按旧 `product_id` 解析到 `product_uid`，但必须先校验 `tenant_id`/`site_id` 与 tenant ACL；
- **双写**：仅在新旧系统并存期写入映射/新字段；旧字段保持只读或同步；
- 写入失败策略：新字段写失败不得破坏旧字段；以事务/补偿保证一致；
- 旧 `product_id` 写入时若无 `tenant_id`/`site_id`，必须拒绝而非默认全局；
- 双写是否必要由迁移窗口决定（D-10）。

## 8. 回滚策略

- 新表/新字段为 additive；旧字段不删；
- 功能开关控制新读路径；
- 回滚 = 关闭新读路径 + 保留映射表；不回滚旧数据；
- 合并/拆分操作保留谱系，可按审计回退映射（不物理删除）；
- 若租户绑定配置错误，回滚开关必须同时关闭新读路径，避免跨租户读取旧映射。

## 9. 决策点

- D-07：是否采用“保留旧 product_id + 新增 product_uid + 映射”方案；
- D-10：迁移窗口、双读/双写、回滚与责任人；
- D-24：全局产品与租户访问分层（决定旧数据回填后的可见性）；
- D-26：旧 PDF/解析/证据归属与私有边界；
- D-31：首期 Tenant/Site 取值与回填规则。
- 当前 `PROPOSED_NOT_APPROVED`；不得直接提出/执行破坏性 ID 替换。
# TEST AND ACCEPTANCE CRITERIA · Phase 2 IMPLEMENTATION 验收标准（计划稿）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PHASE2-ACC-001 |
| 版本 | v0.1-draft（标准；适用于**获批后**的实施工作流验收） |
| 证据分级 | RUN（真实执行）/ STATIC（结构/哈希比对）/ CLAIM（设计声明，不计入通过项） |

---

## A. W-1 隔离 Mock Runtime 验收门槛

| # | 标准 | 证据 |
|---|---|---|
| A-1 | 16/16 操作可路由（含 3 可选端点），13 必需操作全部有 RUN 记录 | 逐操作 RUN 日志 |
| A-2 | 错误码矩阵 20/20：19 个可达码各 ≥1 条 RUN；40901 负向断言（v1 无操作触发） | RUN + 断言输出 |
| A-3 | scope 门禁：5 scope × 15 业务端点越权矩阵全部执行 | 参数化 RUN 矩阵 |
| A-4 | 分页：游标循环终止性、limit 钳制（50/200）、伪造游标拒绝 | RUN |
| A-5 | 304/ETag：至少 4 个端点（OP-03/09/10/11）真 304 流 | RUN |
| A-6 | 状态派生：fixture F-01..F-05 五条 gates→visible_state 方向断言（枚举命名挂 B6 登记为 BLOCKED_BY_DECISION） | RUN + 登记注记 |
| A-7 | 挂起断言零混入：所有 `BLOCKED_BY_DECISION` 场景不出现在"通过"统计中，单独列"挂起清单" | 报告结构检查 |
| A-8 | 零外联：Runtime 运行期无任何非回环网络连接（进程级网络断言） | RUN（连接审计） |

## B. W-2 Repository 验收门槛

| # | 标准 | 证据 |
|---|---|---|
| B-1 | 接口契约测试全绿：身份三不变式（(mpn_norm,brand_norm) 唯一键；document_id 非身份；prod-{document_id} 仅流转 token） | RUN |
| B-2 | 归一化向量表：固定输入→期望输出全对（同版本复算一致） | RUN + 向量文件 |
| B-3 | 零 SQL/零驱动/零 DDL：依赖清单审计（无 db driver 依赖） | STATIC |
| B-4 | Fixture 装载：JSON→In-Memory Adapter 全量装载 + `DEMO_FIXTURE` 标记完整性 | RUN |

## C. W-3 Yii2 Client 验收门槛

| # | 标准 | 证据 |
|---|---|---|
| C-1 | 对 W-1 全链路：token→search→detail→分页→304→429 退避→410 终止 | RUN |
| C-2 | 19 个可达错误码的异常映射逐码断言 + 40901 负向 | RUN |
| C-3 | Token 生命周期：过期自动刷新重放一次；并发单飞 | RUN |
| C-4 | 日志脱敏：运行日志快照 grep 零 token/secret 命中 | RUN（脱敏审计） |
| C-5 | 三 Token 分离负向断言（T2/T3 调 Business API 必败） | RUN |

## D. W-4 OAuth2 验收门槛（IQ-21 裁定后启用 V-1..V-4）

| # | 标准 | 证据 |
|---|---|---|
| D-1 | 本地 AS 桩六步校验全路径 RUN（SEC-01..08） | RUN |
| D-2 | 撤销传播 ≤60s：撤销注入 → 60s 内下一次请求必拒 | RUN（时间戳） |
| D-3 | 凭证零真实：全部 client/token 为本地桩值并登记 | STATIC + 登记表 |

## E. 全局否决项（任一出现即 FAIL，无论 A–D 结果）

1. 任何生产资源连接（DB/Redis/S3/外网域名）；
2. 修改 `12_`/`13_`/`14_`/`15_`/`16_` 或阶段一提交历史（amend/rebase）；
3. 任何 OPEN/PENDING/BLOCKED 项被表述为已关闭/已裁定；
4. 任何"Contract Freeze 完成 / 生产 API 可用 / 真实数据已验证"表述；
5. 出现真实凭证（生产 secret/token/客户账号）；
6. Fixture 缺失 `DEMO_FIXTURE` 标记或复用正式 ID 空间语义。

## F. 验收流程

1. 执行 Agent 完成工作流 → 提交 RUN/STATIC 证据包（逐条对应 A–D）；
2. Independent Reviewer 独立复跑（以 Reviewer 自身环境结果为准）；
3. Reviewer 填写验收结论；执行 Agent 不得自授 PASS；
4. 全部工作流验收 ≠ Contract Freeze、≠ 生产授权（两者维持 NOT_READY / NOT_APPROVED）。

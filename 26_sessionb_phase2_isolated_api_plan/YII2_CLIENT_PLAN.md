# YII2 CLIENT PLAN · Morrishk Yii2 Client 原型计划

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PHASE2-CLIENT-001 |
| 版本 | v0.1-draft（计划；不接生产 API；联调对象仅 W-1 隔离 Mock Runtime） |
| 目标栈 | Morrishk 新平台方向（Yii2，参考 `morrishk-site` 应用基线；旧站不作目标——IQ-13 CONFIRMED） |
| 形态 | Yii2 Application Component（`components[]` 配置式），命名空间如 `morrishk\dsbit\*` |

---

## 1. 配置结构（计划示例）

```php
'components' => [
    'dsbitApi' => [
        'class' => \morrishk\dsbit\DsBitApiClient::class,
        'baseUrl' => 'http://127.0.0.1:PORT/api/v1',   // 隔离 Mock Runtime；生产域名 OPEN（IQ-10）
        'clientId' => $params['dsbit.clientId'],        // 非生产形态待 IQ-21
        'clientSecret' => $params['dsbit.clientSecret'],// secret 经 params/env 注入，永不入库、永不入日志
        'scopes' => ['product.read', 'product.category.read', 'product.evidence.read', 'product.version.read'],
        'timeout' => 10, 'connectTimeout' => 3,
        'maxRetries' => 2, 'backoffBaseMs' => 300,
        'tokenRefreshLeeway' => 120,                    // 剩余 TTL ≤120s 刷新（R-OA-02 PROPOSED）
    ],
],
```

## 2. 请求与 Token 处理

1. **Bearer 注入**：所有业务请求带 `Authorization: Bearer <token>`；`POST /oauth/token` 自身用 Basic（`client_secret_basic`）。
2. **Token 生命周期**：内存缓存 + 过期前 120s 主动刷新；40101/40102 → 强制刷新重放**一次**（retryable 语义，候选 §7.2）；再失败向上抛。
3. **单飞刷新**：并发请求共享刷新 promise/锁，避免 token 风暴。
4. **不缓存 secret**；不落盘 token；进程级内存即可（原型）。

## 3. 超时与重试策略

| 条件 | 动作 |
|---|---|
| 连接超时/读超时 | 重试（同请求幂等，GET 天然幂等），指数退避 300/600ms，最多 2 次 |
| 429 | 按 `Retry-After` 头等待后重试（`retryable=true`） |
| 5xx（50001/50301/50302） | `retryable=true` → 重试；`degraded_allowed` 语义仅记录 |
| 400/403/404/410/413/422 | **不重试**；映射为异常 |
| **41001** | 终止态：立即停止该产品全部后续调用与本地展示（候选 §9.4 硬性行为），不进入重试通道 |
| 40901 | v1 不应出现；出现即视为协议违规，告警并终止（负向断言） |

## 4. 错误映射（计划）

```text
ErrorEnvelope → DsBitApiException 子类：
  InvalidArgumentException(40001/40002)
  AuthException(40101/40102 → 内部触发刷新重试)
  InsufficientScopeException(40301)
  ProductNotReleasedException(40302)      # 调用方：保留本地已发布版本，等待
  CategoryNotPublishedException(40303)
  NotFoundException(40401/40402/40403)    # 调用方：标记资源不存在
  ReleaseRevokedException(41001)          # 调用方：立即停止公开展示（终态）
  CategoryRetiredException(41002)         # 停新同步、留旧页（窗口挂 IQ-05）
  TreeTooLargeException(41301)            # 自动回退 flat + 增量
  IdentityIncompleteException(42201)
  NormalizationConflictException(42202)
  RateLimitedException(42901)
  ServerException(50001/50301/50302)
```

## 5. 分页处理

- 游标循环：`meta.next_cursor` 为 null 终止；`has_more` 仅作参考（P2-7 时序未定，以 `next_cursor===null` 为准并在 Client 注释登记）；
- 游标不解析不构造（契约）；limit ≤200 钳制；
- 增量同步：`updated_since` + `release_state=REVOKED` 双流（撤回发现为 V1_REQUIRED 语义）；条目形态随 DIFF-CONTRACT-01 裁定对齐。

## 6. 缓存策略

- 键：pbk（产品）/ category_id；值 + `data_version`/`etag`；
- 请求带 `If-None-Match`；304 → 沿用缓存（视为成功）；
- 40302 → 保留旧缓存等待；41001 → **删除**公开展示缓存（终态）；
- taxonomy_version 变更 → 分类缓存全量失效（同步前置检查 OP-10）。

## 7. 日志脱敏（硬性纪律）

- 永不记录：`Authorization` 头、client secret、access_token、完整错误体中的敏感字段；
- 记录：method/path/状态码/`request_id`/耗时/error_key；
- `request_id` 回显：客户端生成 8–64 `[A-Za-z0-9_-]` 并发送；服务端回显规则**挂 P1-2**（Client 按"回显优先、不一致告警"双策略登记）。

## 8. 测试计划（获批实施后）

1. 对 W-1 Mock Runtime 跑通：token 获取→搜索→详情→分页→304→429 退避→410 终止；
2. 错误映射逐码断言（20 码中业务可达 19 + 40901 负向）;
3. 三 Token 分离负向断言（T2/T3 调 Business API 必败）；
4. 脱敏断言：日志快照 grep 无 token/secret。

## 9. 边界

- 不接生产 API（baseUrl 仅隔离环境）；生产域名/拓扑挂 IQ-10/IQ-22（Phase 4）；
- 不在本 Client 实现服务端逻辑；不缓存越 scope 数据；
- 全部异常路径为**计划**，非已验证行为。

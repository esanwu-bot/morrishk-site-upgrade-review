# 测试计划与验收标准

| 项目 | 内容 |
|---|---|
| 文档编号 | 33-06 |
| 版本 | V1.0 |
| 环境 | 本机 PHP 8.0.2 / Composer 2.5.8；无 `vendor/`；MySQL 服务未启动 |
| 原则 | 未运行的测试一律记 BLOCKED，不写成 PASS |

## 1. 测试层级

| 层级 | 方式 | 状态 |
|---|---|---|
| L0 语法/补丁 | `php -l`、`git diff --check` | 可执行 |
| L1 单元 | Codeception（tests/ 缺失） | 不可用 |
| L2 集成 | 测试 MySQL + Yii | BLOCKED |
| L3 E2E | 浏览器/HTTP | BLOCKED |
| L4 SEO | 抓取/JSON-LD/sitemap | BLOCKED |
| L5 性能 | Lighthouse | BLOCKED |
| L6 视觉 | 截图/移动端 | BLOCKED |

## 2. 用例

| 编号 | 用例 | 预期 | 当前 |
|---|---|---|---|
| T-01 | 首页 200 | 200，1 个 H1 | BLOCKED |
| T-02 | 分类页 200 | 列表/分页/canonical | BLOCKED |
| T-03 | PDP 200 | 参数字段/canonical/JSON-LD | BLOCKED |
| T-04 | 搜索页 noindex | `noindex,follow` | BLOCKED |
| T-05 | 询价页 noindex | `noindex,follow` | BLOCKED |
| T-06 | 成功页 noindex | `noindex,nofollow`，200 | BLOCKED |
| T-07 | 询盘正常提交 | 落库/通知/成功页 | BLOCKED（第三方/Mock） |
| T-08 | 缺失必填 | 校验错误，不成功 | BLOCKED |
| T-09 | 非法邮箱/超长 | 校验错误 | BLOCKED |
| T-10 | 重复提交 | 去重/标记 | NOT IMPLEMENTED |
| T-11 | 第三方失败/超时 | 明确失败，不伪装成功 | BLOCKED |
| T-12 | 未授权访问成功页 | 合理处理 | BLOCKED |
| T-13 | 旧错误路由 `/order/success` | 不再产生 | 代码已消除；运行未验 |
| T-14 | CSRF | 拒绝无 token 提交 | NOT IMPLEMENTED |
| T-15 | sitemap 200 且不含 noindex | 校验通过 | BLOCKED |
| T-16 | robots.txt 格式 | 可解析、分组清晰 | 部分（仅格式） |

## 3. 验收标准

### DEMO_READY

- 独立环境可启动，首页/分类/PDP/搜索/询价可访问。
- 询盘提交有明确成功/失败反馈（Mock 必须标注）。
- SEO 元素可在 HTML 中验证。
- 有页面截图与 HTTP 结果。

### FUNCTION_ACCEPTED

- 上述用例 PASS 并留证据。
- Reviewer 复核通过。
- 询盘链路（含安全）验收。

### PRODUCTION_READY

- 部署/回滚/备份/监控/安全评估完成。
- 生产版本映射确认。

### RELEASE_APPROVED

- 客户书面上线授权（P0-05C）。

## 4. 证据格式

每条记录：环境、命令、时间、实际结果、退出码、证据路径、PASS/FAIL/BLOCKED、是否 Mock。

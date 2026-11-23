# 发布就绪判定

| 项目 | 内容 |
|---|---|
| 文档编号 | 33-09 |
| 版本 | V1.0 |
| 日期 | 2026-11-23 |

## 1. 四态判定

| 状态 | 判定 | 依据 |
|---|---|---|
| **DEMO_READY** | **NO** | 无运行环境（无 vendor、MySQL 未启动），页面不可访问 |
| **FUNCTION_ACCEPTED** | **NO** | 无功能/集成/E2E 测试；询盘链路未验收 |
| **PRODUCTION_READY** | **NO** | 部署/备份/回滚/安全/版本映射未完成 |
| **RELEASE_APPROVED** | **NO** | 未取得 P0-05C 上线授权 |

## 2. 已达成的部分

| 项 | 状态 |
|---|---|
| 代码提交与分支 | DONE（`25afffb`、`0891ce6`、`d80491b`） |
| PHP 语法/补丁检查 | PASS |
| 首页唯一 H1（代码） | DONE |
| 搜索/询价 noindex（代码） | DONE |
| canonical/OG/JSON-LD（代码） | DONE（未运行验证） |
| 询盘成功路由（后端） | DONE（未运行验证） |
| robots.txt 格式 | DONE |

## 3. 进入 DEMO_READY 所需

1. 提供/启动测试环境（PHP + Composer + MySQL 测试库）。
2. `composer install` 并注入非生产环境变量。
3. 生成测试库结构/最小样例数据（不使用生产数据）。
4. 启动应用，跑 T-01…T-16。
5. 截图/HTTP/JSON-LD/sitemap 证据。
6. 询盘 Mock 或经授权接口。

## 4. 进入 FUNCTION_ACCEPTED 所需

- 上述证据 PASS；
- 询盘安全（CSRF/校验/上传）方案落地；
- Reviewer 复核通过。

## 5. 边界声明

- 未生产部署、未改生产数据库、未合并 main、未获上线授权。
- 本轮不是生产上线，也不代表 227 项功能完成。

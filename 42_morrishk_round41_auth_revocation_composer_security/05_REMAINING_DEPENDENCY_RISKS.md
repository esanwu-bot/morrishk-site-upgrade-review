# 05 剩余依赖风险

统计口径保持 Round 39.2：14 包 / 70 条（runtime 9 包 61 条，dev 5 包 9 条）。本轮未改变依赖版本。

| 包 | 版本 | 本轮状态 | 理由 / 措施 |
|---|---|---|---|
| `yiisoft/yii2` | 2.0.53 | **未修复（BLOCKED）** | 2.0.55 在当前 Composer 镜像不存在；上游 packagist 不可达。措施：禁止用户可控视图名；跟踪镜像同步 |
| `yiisoft/yii2-redis` | 2.0.17 | **未修复（BLOCKED）** | 2.0.20 镜像不存在；组件未启用 |
| `phpoffice/phpspreadsheet` | 1.19.0 | **隔离** | 无解析调用；已删除 xls/xlsx 上传白名单；启用解析前必须升级 ≥1.30.7 |
| `guzzlehttp/guzzle` | 7.4.1 | 未修复（待联动升级） | 经 google/apiclient；出站域名限制与监控待补 |
| `phpseclib/phpseclib` | 3.0.37 | 未修复（待联动升级） | 随 google 链路；不使用 SSH/SFTP |
| `firebase/php-jwt` | 5.5.1 | 未修复（无调用） | 禁止自定义 JWT 校验 |
| `guzzlehttp/psr7` | 2.8.0 | 未修复（随 guzzle） | 同上 |
| `league/flysystem` | 1.1.9 | 未启用 | 无调用 |
| `symfony/polyfill-intl-idn` | 1.32.0 | 待验证 | 随邮件/IDN 链路 |
| dev-only（yaml/phpunit/psysh/dom-crawler/gii） | — | 不影响生产 | 工具链单独升级 |

## 状态定义

- **已修复**：本轮无。
- **隔离 / 未启用**：phpspreadsheet、flysystem、yii2-redis。
- **未修复**：yii2、guzzle、phpseclib、php-jwt、psr7。
- **未验证/待验证**：polyfill-intl-idn、dev-only 包。
- **BLOCKED**：yii2 / yii2-redis（镜像缺失补丁版本）。

## 结论

本轮没有以“未调用”宣称漏洞关闭；每个包均保留风险状态与升级门槛。

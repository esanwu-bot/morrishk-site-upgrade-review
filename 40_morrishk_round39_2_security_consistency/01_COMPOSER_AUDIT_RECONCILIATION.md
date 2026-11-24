# 01 Composer 审计口径对齐

## 1. 冲突与结论

Round 39/39.1 文档中存在三处不一致：01/07 仍写“26 条 / 4 包”，08 写“runtime 11 / dev 3”，逐包明细暗示 9/5。本轮以 `composer audit --format=json` + `composer.lock` 重新计算，结论如下（唯一口径）：

| 指标 | 数值 |
|---|---|
| 受影响包 | **14** |
| 通告总数 | **70** |
| runtime 包 / 通告 | **9 / 61** |
| dev 包 / 通告 | **5 / 9** |
| 严重度 | critical **3**、high **28**、medium **29**、low **8**、unknown **2** |
| `--no-dev` 视图 | 9 包 / 61 条 |

校验命令与输出：`evidence/audit_authoritative.txt`；原始 JSON：`evidence/composer_audit_all.json`、`composer_audit_nodev.json`。

## 2. 分类方法

- runtime/dev：按 `composer.lock` 中 `packages` 与 `packages-dev` 分属判定（不在两个列表间推测）。
- direct/transitive：按 `composer.json` 的 `require` / `require-dev` 判定。
- 通告数与包数分开统计；一个包可含多条 advisory。
- `--no-dev` 仅用于交叉校验，不作为主口径。

## 3. 逐包口径

| 包 | 版本 | 分类 | 依赖 | 通告 | 严重度分布 |
|---|---|---|---|---|---|
| phpoffice/phpspreadsheet | 1.19.0 | runtime | transitive | 31 | critical 2 / high 17 / medium 12 |
| guzzlehttp/guzzle | 7.4.1 | runtime | transitive | 14 | high 6 / medium 8 |
| phpseclib/phpseclib | 3.0.37 | runtime | transitive | 6 | high 2 / medium 2 / low 1 / unknown 1 |
| symfony/yaml | v7.4.1 | dev | transitive | 5 | high 1 / low 3 / unknown 1 |
| guzzlehttp/psr7 | 2.8.0 | runtime | transitive | 4 | medium 4 |
| firebase/php-jwt | v5.5.1 | runtime | transitive | 2 | critical 1 / low 1 |
| league/flysystem | 1.1.9 | runtime | transitive | 1 | low 1 |
| phpunit/phpunit | 11.2.6 | dev | transitive | 1 | high 1 |
| psy/psysh | v0.12.15 | dev | transitive | 1 | medium 1 |
| symfony/dom-crawler | v7.4.1 | dev | transitive | 1 | low 1 |
| symfony/polyfill-intl-idn | v1.32.0 | runtime | transitive | 1 | low 1 |
| yiisoft/yii2 | 2.0.53 | runtime | **direct** | 1 | high 1 |
| yiisoft/yii2-gii | 2.2.4 | dev | **direct** | 1 | medium 1 |
| yiisoft/yii2-redis | 2.0.17 | runtime | **direct** | 1 | medium 1 |

## 4. 重点包风险处置矩阵

| 包 | 直接依赖 | 实际调用路径 | 受用户输入影响 | 当前启用 | 修复版本 | 处置建议 |
|---|---|---|---|---|---|---|
| phpoffice/phpspreadsheet | 否（经 moonlandsoft/yii2-phpexcel） | 未发现 `PHPExcel/IOFactory` 调用 | **上传白名单含 xls/xlsx**，但仅存储、未解析 | 否（无导入/导出调用） | ≥1.30.7 可用 | 若新增表格导入，必须先升级并限制文件大小/类型；现阶段不启用解析 |
| guzzlehttp/guzzle | 否（经 google/apiclient） | 是（`GuzzleHttp\`） | 间接：外部 URL 由 Google 客户端构造 | 是 | ≥7.15.2 可用 | 与 google/apiclient 一并升级评估 |
| phpseclib/phpseclib | 否 | 未发现 | 否 | 间接（google 认证库引用） | 需按公告逐条确认 | 随 google/apiclient 升级 |
| firebase/php-jwt | 否 | 未发现 | 否 | 否 | ≥7.0.0 可用 | 无调用路径，低优先 |
| yiisoft/yii2 | **是** | 框架本体 | 视图名由代码固定，未接收用户 view 参数 | 是 | 2.0.55 **未发布**（最新 2.0.53） | 无可用补丁；保持版本并监控发布 |
| yiisoft/yii2-redis | **是** | 未发现 | 否 | **未启用**（无 Redis 组件配置） | 2.0.20 **未发布**（最新 2.0.19） | 不启用即可规避；发布后升级 |

## 5. xls/xlsx 上传链路

- 上传校验：`SnSiiCart` 规则允许 `xls,xlsx,csv,doc,docx,pdf,txt`，`maxSize=5MB`，`checkExtensionByMimeType=true`。
- 存储：随机 24 字符文件名，写入 `runtime/uploads`（Web 根之外），仅登记在 `snsii_cart.Files`。
- 解析：代码中**未发现** `PHPExcel` / `PhpSpreadsheet` / `IOFactory` 的读取或导入调用；下载仅按二进制流返回。
- 结论：当前不会进入表格解析流程，但**上传面已存在**。若后续增加“后台导入/预览”，phpspreadsheet 的 SSRF/RCE/DoS 通告将直接可触达，必须在启用前升级。

## 6. 本轮处置

- 未删除依赖、未忽略 advisory、未只展示 `--no-dev`；
- 未修改 `composer.json` / `composer.lock`；
- 已同步修订 `39_.../01`、`07`、`08`、`README` 中的数字。

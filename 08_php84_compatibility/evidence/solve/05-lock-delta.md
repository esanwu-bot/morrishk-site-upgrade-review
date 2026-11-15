# 05 · 协调升级后的 lock 差异（试验副本，未落地）

- 来源：`04-p0-coordinated-dryrun.txt` 对应的真实 `composer update --no-install` 结果
- 包数：131 → 122；版本变化 **126** 个
- 升级 89 个 / 新增 14 个 / 移除 23 个

## 需重点关注的变化

| 包 | 原 | 新 | 说明 |
|---|---|---|---|
| `yiisoft/yii2` | 2.0.44 | 2.0.55 | P0 目标版本 |
| `phpunit/phpunit` | 8.5.23 | 12.5.44 | 跨 4 个大版本（8 → 12）：断言、注解、测试生命周期 API 有破坏性变更 |
| `symfony/console` | v5.4.3 | v8.0.15 | 仅测试链使用；Symfony 8 要求 PHP ≥8.4 |
| `symfony/browser-kit` | v4.2.4 | v8.0.14 | 移除根约束后仍由 lib-innerbrowser 传递引入，自动到 8.x |
| `symfony/service-contracts` | v1.1.2 | v3.8.1 | 锁文件滞后项，重新求解后自动到 3.x |
| `codeception/codeception` | 4.1.29 | 5.3.7 | 4 → 5，模块与助手 API 有变更 |
| `codeception/module-yii2` | 1.1.5 | 1.1.12 | 注意：不存在 1.3.x（1.1.x 之后直接 v2.0） |
| `phpoffice/phpspreadsheet` | 1.19.0 | 5.11.0 | 1.19 → 5.11：因 moonlandsoft 约束为 `*`，属**被动大跨版本**，导出功能必须回归 |
| `monolog/monolog` | 2.9.3 | 3.12.1 | 2 → 3，破坏性变更（影响 yii2-debug 与日志） |
| `google/apiclient` | v2.12.1 | v2.20.1 | 2.12 → 2.20，连带 apiclient-services / jwt 升级 |
| `google/apiclient-services` | v0.355.0 | v0.466.0 |  |
| `firebase/php-jwt` | v5.5.1 | v7.2.1 | 5 → 7，破坏性变更 |
| `guzzlehttp/guzzle` | 7.4.1 | 7.16.1 | 7.4 → 7.16，同主版本 |
| `jaeger/querylist` | V4.2.8 | V4.4.7 | 4.2.8 → 4.4.7（`^4.2` 约束内自动升），与 §3.3 判断一致 |
| `kartik-v/yii2-editable` | v1.7.9 | v1.8.0 | 1.7.9 → 1.8.0 |
| `doctrine/lexer` | 1.2.2 | 2.1.1 | 1 → 2 |
| `maennchen/zipstream-php` | 2.1.0 | 3.2.2 | 2.1 → 3.2 |
| `psr/log` | 1.1.4 | 3.0.2 | 1 → 3 |
| `psr/http-message` | 1.0.1 | 2.0 | 1.0 → 2.0 |
| `phpseclib/phpseclib` | 3.0.37 | （移除） | 被移除（不再需要） |
| `symfony/dom-crawler` | v4.4.37 | v8.0.12 | 4.4 → 8.0 |
| `fakerphp/faker` | v1.19.0 | v1.24.1 | 1.19 → 1.24 |
| `ezyang/htmlpurifier` | v4.14.0 | v4.19.1 | 4.14 → 4.19 |

## 全量变化

| 包 | 原 | 新 |
|---|---|---|
| `behat/gherkin` | v4.9.0 | v4.18.0 |
| `bower-asset/inputmask` | 3.3.11 | 5.0.10 |
| `bower-asset/jquery` | 3.6.0 | 3.7.1 |
| `bower-asset/punycode` | v1.3.2 | v2.3.1 |
| `bower-asset/yii2-pjax` | 2.0.7.1 | 2.0.9 |
| `cache/adapter-common` | 1.2.0 | （移除） |
| `cache/filesystem-adapter` | 1.1.0 | （移除） |
| `cache/tag-interop` | 1.1.0 | （移除） |
| `codeception/codeception` | 4.1.29 | 5.3.7 |
| `codeception/lib-asserts` | 1.13.2 | 3.2.0 |
| `codeception/lib-innerbrowser` | 1.5.1 | 4.1.1 |
| `codeception/lib-web` | （新增） | 2.1.1 |
| `codeception/module-asserts` | 1.3.1 | 3.3.0 |
| `codeception/module-filesystem` | 1.0.3 | 3.0.2 |
| `codeception/module-yii2` | 1.1.5 | 1.1.12 |
| `codeception/phpunit-wrapper` | 8.1.4 | （移除） |
| `codeception/stub` | 3.7.0 | 4.3.0 |
| `composer/pcre` | （新增） | 3.4.0 |
| `doctrine/deprecations` | （新增） | 1.2.0 |
| `doctrine/instantiator` | 1.4.0 | （移除） |
| `doctrine/lexer` | 1.2.2 | 2.1.1 |
| `egulias/email-validator` | 3.1.2 | 3.2.6 |
| `ezyang/htmlpurifier` | v4.14.0 | v4.19.1 |
| `fakerphp/faker` | v1.19.0 | v1.24.1 |
| `firebase/php-jwt` | v5.5.1 | v7.2.1 |
| `google/apiclient` | v2.12.1 | v2.20.1 |
| `google/apiclient-services` | v0.355.0 | v0.466.0 |
| `google/auth` | v1.26.0 | v1.55.3 |
| `guzzlehttp/guzzle` | 7.4.1 | 7.16.1 |
| `guzzlehttp/promises` | 1.5.1 | 2.6.0 |
| `guzzlehttp/psr7` | 2.1.0 | 2.13.3 |
| `imagine/imagine` | 1.2.4 | 1.5.4 |
| `jaeger/g-http` | V1.7.2 | V2.0.1 |
| `jaeger/phpquery-single` | 1.0.1 | 1.1.1 |
| `jaeger/querylist` | V4.2.8 | V4.4.7 |
| `kartik-v/bootstrap-popover-x` | v1.5.1 | v1.5.4 |
| `kartik-v/yii2-editable` | v1.7.9 | v1.8.0 |
| `kartik-v/yii2-krajee-base` | v3.0.2 | v3.0.5 |
| `kartik-v/yii2-widget-activeform` | v1.6.0 | v1.6.4 |
| `league/flysystem` | 1.1.9 | （移除） |
| `league/mime-type-detection` | 1.9.0 | （移除） |
| `maennchen/zipstream-php` | 2.1.0 | 3.2.2 |
| `markbaker/complex` | 3.0.1 | 3.0.2 |
| `markbaker/matrix` | 3.0.0 | 3.0.1 |
| `monolog/monolog` | 2.9.3 | 3.12.1 |
| `myclabs/deep-copy` | 1.10.2 | 1.14.0 |
| `myclabs/php-enum` | 1.7.7 | （移除） |
| `nikic/php-parser` | （新增） | v5.9.0 |
| `npm-asset/bootstrap` | 4.6.0 | 4.6.2 |
| `opis/closure` | 3.6.3 | （移除） |
| `paragonie/constant_time_encoding` | v2.7.0 | （移除） |
| `paragonie/random_compat` | v9.99.100 | （移除） |
| `phar-io/manifest` | 2.0.3 | 2.0.4 |
| `phar-io/version` | 3.1.1 | 3.2.1 |
| `phpdocumentor/reflection-common` | 2.2.0 | （移除） |
| `phpdocumentor/reflection-docblock` | 5.3.0 | （移除） |
| `phpdocumentor/type-resolver` | 1.6.0 | （移除） |
| `phpoffice/phpspreadsheet` | 1.19.0 | 5.11.0 |
| `phpoffice/wmf` | （新增） | 0.2.1 |
| `phpseclib/phpseclib` | 3.0.37 | （移除） |
| `phpspec/prophecy` | v1.15.0 | （移除） |
| `phpunit/php-code-coverage` | 7.0.15 | 12.5.8 |
| `phpunit/php-file-iterator` | 2.0.5 | 6.0.2 |
| `phpunit/php-invoker` | （新增） | 6.0.0 |
| `phpunit/php-text-template` | 1.2.1 | 5.0.1 |
| `phpunit/php-timer` | 2.1.3 | 8.0.0 |
| `phpunit/php-token-stream` | 3.1.3 | （移除） |
| `phpunit/phpunit` | 8.5.23 | 12.5.44 |
| `psr/cache` | 1.0.1 | 3.0.0 |
| `psr/container` | 2.0.1 | 2.0.2 |
| `psr/http-client` | 1.0.1 | 1.0.3 |
| `psr/http-factory` | 1.0.1 | 1.1.0 |
| `psr/http-message` | 1.0.1 | 2.0 |
| `psr/log` | 1.1.4 | 3.0.2 |
| `psr/simple-cache` | 1.0.1 | 3.0.0 |
| `psy/psysh` | （新增） | v0.12.24 |
| `sebastian/cli-parser` | （新增） | 4.2.1 |
| `sebastian/code-unit-reverse-lookup` | 1.0.2 | （移除） |
| `sebastian/comparator` | 3.0.3 | 7.1.8 |
| `sebastian/complexity` | （新增） | 5.0.0 |
| `sebastian/diff` | 3.0.3 | 7.0.1 |
| `sebastian/environment` | 4.2.4 | 8.1.2 |
| `sebastian/exporter` | 3.1.4 | 7.0.3 |
| `sebastian/global-state` | 3.0.2 | 8.0.3 |
| `sebastian/lines-of-code` | （新增） | 4.0.1 |
| `sebastian/object-enumerator` | 3.0.4 | 7.0.0 |
| `sebastian/object-reflector` | 1.1.2 | 5.0.0 |
| `sebastian/recursion-context` | 3.0.1 | 7.0.1 |
| `sebastian/resource-operations` | 2.0.2 | （移除） |
| `sebastian/type` | 1.1.4 | 6.0.4 |
| `sebastian/version` | 2.0.1 | 6.0.2 |
| `staabm/side-effects-detector` | （新增） | 1.0.5 |
| `symfony/browser-kit` | v4.2.4 | v8.0.14 |
| `symfony/cache` | （新增） | v7.4.23 |
| `symfony/cache-contracts` | （新增） | v3.8.1 |
| `symfony/console` | v5.4.3 | v8.0.15 |
| `symfony/css-selector` | v5.4.3 | v8.0.9 |
| `symfony/deprecation-contracts` | v2.5.0 | v3.8.1 |
| `symfony/dom-crawler` | v4.4.37 | v8.0.12 |
| `symfony/event-dispatcher` | v5.4.3 | v8.0.15 |
| `symfony/event-dispatcher-contracts` | v2.5.0 | v3.8.1 |
| `symfony/finder` | v5.4.3 | v8.0.14 |
| `symfony/polyfill-ctype` | v1.24.0 | v1.37.0 |
| `symfony/polyfill-iconv` | v1.24.0 | v1.43.0 |
| `symfony/polyfill-intl-grapheme` | v1.24.0 | v1.43.3 |
| `symfony/polyfill-intl-idn` | v1.24.0 | v1.43.0 |
| `symfony/polyfill-intl-normalizer` | v1.24.0 | v1.43.0 |
| `symfony/polyfill-mbstring` | v1.24.0 | v1.43.3 |
| `symfony/polyfill-php72` | v1.24.0 | （移除） |
| `symfony/polyfill-php73` | v1.24.0 | （移除） |
| `symfony/polyfill-php80` | v1.24.0 | v1.43.0 |
| `symfony/service-contracts` | v1.1.2 | v3.8.1 |
| `symfony/string` | v5.4.3 | v8.0.15 |
| `symfony/var-dumper` | v5.4.3 | v8.0.15 |
| `symfony/var-exporter` | （新增） | v8.0.16 |
| `symfony/yaml` | v5.4.3 | v8.0.15 |
| `theseer/tokenizer` | 1.2.1 | 2.0.1 |
| `tightenco/collect` | 8.78.0 | （移除） |
| `webmozart/assert` | 1.10.0 | （移除） |
| `yiisoft/yii2` | 2.0.44 | 2.0.55 |
| `yiisoft/yii2-bootstrap4` | 2.0.10 | 2.0.12 |
| `yiisoft/yii2-composer` | 2.0.10 | 2.0.11 |
| `yiisoft/yii2-debug` | 2.1.18 | 2.1.28 |
| `yiisoft/yii2-gii` | 2.2.4 | 2.2.7 |
| `yiisoft/yii2-imagine` | 2.3.0 | 2.3.1 |
| `yiisoft/yii2-redis` | 2.0.17 | 2.0.20 |

> 该 lock 未回写仓库。若采纳需作为独立 PR，并附 `composer validate` 与 `composer audit` 留档。
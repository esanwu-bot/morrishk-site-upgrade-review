# 07 剩余缺陷与风险

## 1. 未关闭项

| 编号 | 风险 | 影响 | 建议 |
|---|---|---|---|
| R-01 | PHP 版本为 7.4.3，生产为 7.4.33 | 同 7.4 次版本、patch 不同；不能宣称逐补丁一致 | 在 7.4.33 环境复跑 20 项矩阵 |
| R-02 | 标准 `composer install` 仍未在本机跑通（`google/apiclient-services` 2.6 万文件解压超时） | 依赖内容已完整（25,375 文件），但安装方式为缓存 + 手工解压 | 在 CI 或 Linux 环境跑一次标准 `composer install` 留证 |
| R-03 | PDP 前端 JS 仍直连 `https://wm.zokoko.cn/api/sendEmail` | 浏览器真实提交会调用第三方；本轮未 Mock、未验证 | 改为服务端适配器或可配置端点，再接 Mock/正式服务 |
| R-04 | 上传文件仍存放在 `web/uploads/` | `.htaccess` 仅对 Apache 生效；Nginx 无等效配置时存在脚本执行/直链下载风险 | 迁移至 Web 根之外 + 下载控制器；或补 Nginx `location` 拒绝脚本 |
| R-05 | 后台 7 个控制器 `enableCsrfValidation=false` | 后台写操作可被跨站提交 | 单独安全任务修复并测试 |
| R-06 | 尾斜杠 URL（如 `/products.html/`）返回 404 | 外部错误链接无法自动纠正 | Web 服务器层做 301 归一（去尾斜杠/统一小写） |
| R-07 | sitemap 无 `lastmod/priority` | 不影响抓取，但更新时机不可见 | 后续按 `product_time` 补充 |
| R-08 | 购物车 AJAX 动作（add/del/clear/hot-part）豁免 CSRF | 可被跨站修改会话购物车（不落库） | 前端补 token 后取消豁免 |
| R-09 | `ProController_bak.php`、`PageController_bak0609.php` 仍含旧写法 | 维护误导；不参与路由 | 后续清理 |
| R-10 | 搜索/询价/成功页无 H1 | 均为 noindex 页，SEO 影响低 | 如需要可补语义标题 |

## 2. 有意未改

- `snsii_cart.Files` 的 `NOT NULL` 约束：保留，改为写入空串，不降低数据模型约束。
- PDP JSON-LD 不输出 `offers`：维持既定设计，未虚构价格/库存。
- `canonical` 只做生成侧归一，不改写请求 URL。

## 3. 本轮状态汇总

| 维度 | 结果 |
|---|---|
| P0-1 子分类 500 | 已修复，200 |
| P0-2 无附件/ PDP 询价 500 | 已修复，200 / 302 |
| P0-3 JSON-LD brand/image | 已修复，Brand 对象 + 绝对 image |
| P0-4 CSRF + 上传 | 询价 CSRF 与上传限额/类型 PASS；存储迁移与后台 CSRF 未做 |
| P0-5 404/路由 | 无效产品与不存在页面 404；`/search.html` 不再被劫持 |
| P1 robots/H1/canonical/sitemap | 全部落地并通过运行时验证 |
| 环境 | PHP 7.4.3（非 7.4.33）、依赖内容完整、Mock 邮件 |

## 4. 判定

**DEMO_READY：NO｜FUNCTION_ACCEPTED：NO｜PRODUCTION_READY：NO｜RELEASE_APPROVED：NO**

P0 五组缺陷的运行时表现已全部改变并通过 20 项矩阵；但 R-01/R-02/R-03/R-04 属剩余风险，需 Reviewer 判定是否阻断后续阶段。

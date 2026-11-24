# 03 前端依赖兼容性（F-22，Punycode / 浏览器）

## 1. 结论

| 项 | 结果 |
|---|---|
| 项目是否加载 `punycode.js` | **否**（当前页面没有该请求） |
| Yii2 是否发布该资产 | 仅在 `EmailValidator`/`UrlValidator` 的 `enableIDN=true` 时注册 `PunycodeAsset` |
| 项目自有 JS 是否调用旧 API | 未发现 |
| 真实浏览器页面 | 首页 / 产品列表 / PDP / 后台菜单 **PASS**，无 JS 错误 |
| 移动端 390×844 | 页面可渲染，但存在视觉问题（见第 5 节），**PARTIAL** |
| Punycode 2.3.1 浏览器加载 | 功能可用但控制台报 `ReferenceError: module is not defined`（潜在风险） |

## 2. 引用路径

- `vendor/yiisoft/yii2/validators/PunycodeAsset.php`：`sourcePath = '@bower/punycode'`，发布 `punycode.js`。
- `vendor/yiisoft/yii2/validators/EmailValidator.php` L164–L169：

```php
public function clientValidateAttribute($model, $attribute, $view)
{
    ValidationAsset::register($view);
    if ($this->enableIDN) {
        PunycodeAsset::register($view);
    }
    ...
}
```

- `UrlValidator` 同样在 `enableIDN` 时注册。
- 项目源码中 **没有** `enableIDN` 配置（已扫描 models/controllers/modules），因此当前业务表单不会发布或加载 `punycode.js`。
- `views/layouts/main.php` 只注册 `AppAsset`（本地 jQuery/Bootstrap），未直接引用 punycode。

## 3. 真实浏览器测试（HTTP staging）

浏览器：TraeCN 内置 Chromium 142（真实渲染，非 HTTP 状态码模拟）。

| 页面 | 结果 | 证据 |
|---|---|---|
| 首页 `/` | PASS：导航、Hero、推荐商品、分类、品牌、Blog 区块可见 | `evidence/browser_home.jpg` |
| 产品列表 `/products.html` | PASS：面包屑、分类标题、商品卡片可见 | `evidence/browser_products.jpg` |
| PDP `/products/39000001/r39-test-part.html` | PASS：标题、属性、库存、询价表单可见 | `evidence/browser_pdp.jpg` |
| 后台 `/ejadmin-index.html` | PASS：Products / Accounts 菜单可见，控制台无错误 | 见 06 回归；截图未单独保存 |
| 首页控制台 | 仅 3 条 “No slides found” warning，无 error | — |

- 真实页面加载了 `yii.activeForm.js`、`yii.validation.js`、`yii.js`，但 **没有** `punycode.js` 请求。
  证据：`evidence/access_log_resources.txt`（`PUNYCODE REQUESTS FROM REAL PAGES: count=0`）。
- 询价表单在浏览器中可见；提交行为由 staging 回归验证（POST 302）。

## 4. Punycode 2.3.1 的直接浏览器探测

测试页：`/__punycode_test.html`，加载 `punycode.js` 后读取全局 `punycode`。

结果（浏览器控制台）：

- 正文：`PUNYCODE_OK`（`punycode.toASCII` 可用）。
- 控制台：`Uncaught ReferenceError: module is not defined at .../punycode.js:443`。

原因：`punycode@2.3.1` 的 `punycode.js` 末尾为 `module.exports = punycode;`，没有 UMD 的 `root.punycode = ...` 分支。
顶层 `const` 仍形成全局词法绑定，所以 `yii.validation.js` 里裸写 `punycode.toASCII` 能工作；但：

- 控制台一定有未捕获错误；
- 依赖 `window.punycode` 的代码会失败；
- 若浏览器/打包器按模块处理，行为可能不同。

当前项目未启用 `enableIDN`，所以这是**潜在**问题，不是当前线上故障。不得为了消除它回退 Yii2 2.0.55；可选缓解：

1. 保持 `enableIDN=false`（现状）；
2. 若未来需要 IDN，单独引入浏览器可用的 punycode 构建或本地 shim，并做浏览器回归；
3. 不直接把 `punycode@2.x` 的 CommonJS 文件当普通 script 发布。

## 5. 移动端（390×844）

使用 Edge headless（`--window-size=390,844`）截图：`evidence/mobile_home_390x844.png`。

观察到：

- 响应式结构生效：顶部工具条、汉堡菜单、Hero、功能徽章、商品区块按单列排列。
- **Hero 文案重叠/裁切**（“Committed to provid…” 与下一行叠在一起）。
- 页面引用 `/images/site/logo-180.png`、`/images/site/cards.png`、`/images/site/no-pic.jpg` 返回 404：
  这些文件在仓库工作区中**不存在**（不是 staging 拷贝遗漏）。生产可能依赖未纳入 Git 的静态文件。

因此移动端不能记为 PASS；记为 **PARTIAL / 观察项**。这些视觉问题与 Punycode 无关，不作为 Round 42 升级的回退理由。

## 6. 结论与边界

- Yii2 2.0.55 + htmlpurifier 4.19.1 + punycode 2.3.1 在当前实际使用路径（无 IDN 客户端校验）下，真实浏览器页面正常、无 Punycode 请求、无 JS error。
- 若未来开启 `enableIDN`，必须先处理 punycode 2.3.1 的 CommonJS 加载问题并重跑浏览器测试。
- 未测试：Safari/Firefox、真实移动设备、CDN 缓存下的静态资源、生产域名下的混合内容策略。

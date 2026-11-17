# 补充核验证据（Reviewer 第 1 轮）

- 基线提交：`24b65a7223f9a688fb740c4a5c1c22eaf4ac4181`
- 本轮性质：仅在原目录增加证据文件；保留基线提交历史，不重写、不重复全量采集、不修改站点。
- 复核对象：`11_seo_google_indexed_urls` 清单中的第 5、6 页痕迹、时间字段、canonical/robots 抽查。

## 1. 第 5、6 页无结果证据

### 1.1 原始采集证据：`NOT_AVAILABLE`

原始 `captures/page_5.json`、`captures/page_6.json` 只保存了 `page / url / next / count / items`，
没有保存渲染后的正文、结果统计文本或截图，因此**原始时刻（2026-11-17 10:04:46 / 10:07:32）的页面内容证据为 `NOT_AVAILABLE`**。
本轮不把重新访问的页面冒充为原始证据。

### 1.2 重新访问证据（明确标注为 10:25 重新访问）

| 项 | 第 5 页 | 第 6 页 |
|---|---|---|
| 请求 URL | `https://www.google.com.hk/search?q=site%3Ahttps%3A%2F%2Fwww.morrishk.net%2F&newwindow=1&start=40` | 同上，`start=50` |
| 最终页面 URL | 与请求 URL 相同 | 与请求 URL 相同 |
| 重新访问时间（GMT+8） | `2026-11-17T10:25:10.978+08:00` | `2026-11-17T10:25:39.587+08:00` |
| 页面标题 | `site:https://www.morrishk.net/ - Google 搜索` | 同左 |
| 结果统计文本 | `获得约 38 条结果，以下是第 5 页 （0.16 秒）` | `获得约 38 条结果，以下是第 6 页 （0.17 秒）` |
| 结果项 `h3` 数 | 0 | 0 |
| 无结果提示原文 | `找不到和您查询的“site:https://www.morrishk.net/”相符的内容或信息。` | 同左 |
| 分页可见数字 | 1、2、3、4、5 | 1、2、3、4、5、6 |
| 页面快照（可访问性树） | `supplemental/page_5_reverify_snapshot_2026-11-17T102510+0800.txt` | `supplemental/page_6_reverify_snapshot_2026-11-17T102539+0800.txt` |
| 截图 | `NOT_AVAILABLE`：in-app browser 视口为 0×0（`visible=false`），`take_screenshot` 失败 | 同左 |

完整的正文文本、时间、User-Agent、快照 SHA-256 见 `supplemental/reverify_pages_5_6.json`。
页面快照中的 Google 易变会话参数（`gsessionid`、`sxsrf`、`sca_esv`、`ei`、`ved`）已替换为 `REDACTED`；
无结果文案、分页数字与 HTTP 结果未做任何改动。

### 1.3 关于「共 6 页」的解释

第 6 页快照显示：Google 分页栏确实渲染了 `1…6` 的数字导航，但同一页面同时显示
`获得约 38 条结果，以下是第 6 页`，且正文为「找不到…相符的内容或信息」。第 5 页同样如此。
因此 **6 个分页数字是 Google 的导航 UI，不等于当时存在 6 页结果**；按约 38 条、每页 10 条计算，
实际有内容的只有 4 页（10 + 10 + 10 + 8 = 38）。本次清单以实际抓到的 4 页为准，未补造第 5、6 页数据。

> 注意：上述 10:25 证据只能证明「重新访问时」页面仍为无结果页，不能证明 10:04/10:07 原始抓取时的页面像素级内容。

## 2. 时间字段口径

| 字段 | 含义 | 取值 / 来源 |
|---|---|---|
| `browser_captured_at` | 逐页浏览器采集完成时间 | 取自原始 capture 文件的文件系统 mtime（秒级），见下表 |
| `processed_at` | 脚本解析 6 个 capture 并写出 JSON/CSV 的时间窗 | `2026-11-17T10:13:41+08:00 – 2026-11-17T10:17:25+08:00`（JSON `started_at` / `finished_at`） |
| `http_checked_at` | 28 个 URL 的只读 GET 检查时间窗 | 与处理同一次运行，`10:13:41 – 10:17:25`；**逐 URL 时间戳 `NOT_RECORDED`** |
| `repo_packaged_at` | 仓库副本的重序列化时间（`gsessionid` 脱敏、LF 归一化、README 写入） | `2026-11-17T10:18:53 – 10:19:31` |
| `reverified_at` | 第 5、6 页的补充重新访问时间 | `2026-11-17T10:25:10 – 10:25:39` |

逐页采集时间（`browser_captured_at`，来源为 `morries/reports/seo/google-indexed-urls/_capture_page_N.json` 的 mtime）：

| 页 | 采集时间（GMT+8） | 可见结果数 | 备注 |
|---|---|---|---|
| 1 | 2026-11-17T09:57:30 | 10 | capture 含 1 条 Google Search Console 推广链接，过滤后 10 条 |
| 2 | 2026-11-17T10:00:32 | 10 | — |
| 3 | 2026-11-17T10:01:44 | 10 | — |
| 4 | 2026-11-17T10:03:09 | 8 | — |
| 5 | 2026-11-17T10:04:46 | 0 | Google 无结果页 |
| 6 | 2026-11-17T10:07:32 | 0 | Google 无结果页 |

时间差的解释：

- `10:07:32 → 10:13:41`：采集结束后先核对 6 个 capture 的条数与页面内容、准备 README，随后才启动处理脚本。
- `10:17:25 → 10:18:53 / 10:19:31`：导出 Excel（10:17:38）、写 README、将 capture/JSON 重序列化进仓库（脱敏与 LF 归一化）。
- `10:19:31 → 10:25:10`：提交并推送基线 `24b65a7` 后，按 Reviewer 要求进行补充重新访问。

`browser_captured_at` 的方法限制：浏览器会话未单独记录导航开始时间，文件 mtime 是当前可用的最近似值；
导航开始时间与逐 URL 检查时间均为 `NOT_RECORDED`。上述口径同时写入 `capture_manifest.json`。

## 3. Canonical / Robots 抽查

抽查 4 个不同类型的页面（占 28 个 URL 的 4 个；其余 24 个未抽查）：

| 页面类型 | 请求 URL | HTTP | Final URL | canonical | meta robots | meta googlebot | X-Robots-Tag |
|---|---|---|---|---|---|---|---|
| 产品详情 | `https://www.morrishk.net/products/10047931/JA3102A-36-J2PC-R.html` | 200 | 同左 | `not_present` | `not_present` | `not_present` | `not_present` |
| 分类列表（带 `?page=22`） | `https://www.morrishk.net/sub-categories/c-636-730/pmic-gate-drivers-integrated-circuits.html?page=22` | 200 | 同左 | `not_present` | `not_present` | `not_present` | `not_present` |
| 博客文章 | `https://www.morrishk.net/blog/details/The-Bourns-3224W-1-504E-A-Comprehensive-Overview-of-Trimmer-Resistors.html` | 200 | 同左 | `not_present` | `not_present` | `not_present` | `not_present` |
| 分类列表（`http://`） | `http://www.morrishk.net/sub-categories/c-962-96/display-modules-led-dot-matrix-and-cluster-optoelectronics.html` | 200 | `https://www.morrishk.net/...`（301） | `not_present` | `not_present` | `not_present` | `not_present` |

- 方法：每个 URL 一次只读 GET，跟随重定向；用独立的 `html.parser` 解析 `link[rel~=canonical]`、
  `meta[name=robots]`、`meta[name=googlebot]`，并用 `HTTPMessage.get_all` 读取全部 `X-Robots-Tag`。
- `not_present` = 成功取回并解析，标签/响应头确实不存在；`not_verified` = 取回或解析失败。空数组绝不解释为「允许抓取」。
- 独立复核：对产品页原始 HTML 做大小写不敏感检索，`canonical` / `robots` / `googlebot` 出现次数均为 0；
  响应头中也没有 `X-Robots-Tag`。
- 与清单 JSON 对照：清单中这 4 个 URL 的 `canonical_url`、`robots_meta`、`x_robots_tag` 均存为空字符串。
  空字符串本身是存储形式，不能单独证明「没有限制」；本次抽查才把这 4 个 URL 的结论明确为 `not_present`。
  其余 24 个 URL 的对应字段仍为 `not_verified`（未抽查）。
- **HTTP 200 不等于可索引**：本次结论仅说明页面可访问且未发现上述声明，索引状态与 canonical 归并需 Search Console。

完整证据（含正文 SHA-256、HTML 标题、`checked_at`、JSON 对照）见 `canonical_robots_spotcheck.json`；
复跑命令：

```bash
python tools/spotcheck_canonical_robots.py \
  "https://www.morrishk.net/products/10047931/JA3102A-36-J2PC-R.html" \
  "https://www.morrishk.net/sub-categories/c-636-730/pmic-gate-drivers-integrated-circuits.html?page=22" \
  "https://www.morrishk.net/blog/details/The-Bourns-3224W-1-504E-A-Comprehensive-Overview-of-Trimmer-Resistors.html" \
  "http://www.morrishk.net/sub-categories/c-962-96/display-modules-led-dot-matrix-and-cluster-optoelectronics.html" \
  --output canonical_robots_spotcheck.json
```

## 4. 补充文件与 SHA-256

| 文件 | SHA-256 |
|---|---|
| `SUPPLEMENTAL_EVIDENCE.md` | 见 `SHA256SUMS.txt`（文件自身哈希不写入自身） |
| `capture_manifest.json` | `50388b1fc8314c73357fb4994ede4ff623c69fcece718a330193280a6f526b11` |
| `canonical_robots_spotcheck.json` | `6d6bef560c449ceab4f524b85f273dda6753fac0be0915f0c550a6984e6564dc` |
| `supplemental/reverify_pages_5_6.json` | `2a5f4ce674926483ec7464c35ab53d00d671cf1d0f01eb24b52df08d013f3f3d` |
| `supplemental/page_5_reverify_snapshot_2026-11-17T102510+0800.txt` | `55dc584891145a51bba0498df3930a2c7a7648b88313d8e44836eb48d2155af2` |
| `supplemental/page_6_reverify_snapshot_2026-11-17T102539+0800.txt` | `0458188f5feec8ace729adbe4527411999866c10034218f7d4d949c39cfa7b53` |
| `tools/spotcheck_canonical_robots.py` | `dae12adbf14ce76a498b110739901cd3a5b13e874b0587467f7feec33cca0419` |

`SHA256SUMS.txt` 已重新生成，覆盖本目录当前全部文件（含基线文件；因 README 增加补充说明，其哈希随新提交更新）。

## 5. 仍然无法验证的项目

- 原始 10:04:46 / 10:07:32 的第 5、6 页渲染正文与截图：`NOT_AVAILABLE`（当时未持久化）。
- 浏览器导航开始时间、28 个 URL 的逐条 HTTP 检查时间：`NOT_RECORDED`。
- 采集时刻 Google 展示的精确总条数：未记录；多次复核在约 38 / 23 / 21 / 10 条之间波动，只能视为抽样可见值。
- 其余 24 个 URL 的 canonical / robots 状态：`not_verified`（本轮只抽查 4 个）。
- 页面是否被 Google 索引、canonical 是否被 Google 采纳、覆盖率与抓取错误：必须使用 Google Search Console，本清单无法给出。

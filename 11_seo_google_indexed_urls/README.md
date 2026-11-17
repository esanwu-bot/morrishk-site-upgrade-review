# Google site 搜索可见 URL 清单

| 项 | 内容 |
|---|---|
| 采集时间（GMT+8） | 2026-11-17 09:57 – 10:17（逐页抓取 09:57–10:07，HTTP 检查 10:13–10:17） |
| 查询词 | `site:https://www.morrishk.net/` |
| 查询 URL | `https://www.google.com.hk/search?q=site%3Ahttps%3A%2F%2Fwww.morrishk.net%2F&newwindow=1` |
| 结果页 | 按要求逐页请求第 1–6 页（`start=0,10,20,30,40,50`）；实际可见结果 10 / 10 / 10 / 8 / 0 / 0 条 |
| 原始条数 / 去重后 | 38 / 28 |
| HTTP 检查 | 28/28 返回 200；其中 4 个 `http://` 均 301 到 HTTPS |
| 采集方式 | 浏览器渲染后提取结果链接；`/goto` 跳转解析为真实 URL；每个 URL 一次只读 GET |

**关于第 5、6 页**：两页均返回 Google 的「找不到和您查询的内容或信息」
（英文界面为 `did not match any documents`），并非脚本中断或漏抓。
复核时同一查询的 Google 可见条数在多次访问间明显波动（约 38 / 23 / 21 / 10 条，
随界面语言、地域与会话抽样变化），因此另一浏览器会话截图中的「共 6 页」在本次会话无法复现。
本清单以实际抓取到的 4 页可见结果为准，未补造第 5、6 页数据。

**时间字段口径**：`browser_captured_at`（逐页浏览器采集）、`processed_at`（脚本处理 capture）、
`http_checked_at`（URL 只读检查）三者含义与取值见 `supplemental/` 下的补充核验材料；
逐页时间见 `capture_manifest.json`。

**补充核验（Reviewer 第 1 轮）**：第 5、6 页无结果证据、时间字段说明与 canonical/robots 抽查
见 `SUPPLEMENTAL_EVIDENCE.md`、`capture_manifest.json`、`canonical_robots_spotcheck.json`
和 `supplemental/` 目录。

**命名口径**：本清单是「Google site 搜索可见 URL」，不是 Google 全量索引，也不是站点真实页面总数。
`site:` 的展示条数受 Google 展示上限、抽样、地域与时间影响，只能作为当前可见样本。

## 文件

| 文件 | 说明 |
|---|---|
| `google_indexed_urls.xlsx` | 人工阅读版：序号、标题、URL 超链接、首次/全部出现页、HTTP 状态、最终 URL、canonical、robots、内容类型、检查状态、摘要；附「采集说明」工作表 |
| `google_indexed_urls.csv` | 固定列：`url,title,snippet,page_number,http_status,final_url,canonical_url,robots_meta,content_type,check_status`；每个去重 URL 一行，`page_number` 为首次出现页 |
| `google_indexed_urls.json` | 完整证据：查询词与 URL、起止时间、逐页条数、原始/去重计数、逐 URL 的页面出现记录与 HTTP 结果、失败项 |
| `captures/page_1.json` … `captures/page_6.json` | 浏览器渲染后逐页提取的原始结果（标题、链接、摘要、页码、下一页指针）；第 5、6 页为空结果，保留作为「已请求且 Google 返回无结果」的证据 |
| `tools/google_indexed_urls.py` | 采集与检查脚本（Python 标准库） |
| `tools/export_excel.py` | 由 JSON 生成 Excel（依赖 `openpyxl`） |
| `tools/tests/test_google_indexed_urls.py` | 18 项单元测试（本地 Mock HTML / Mock HTTP，不依赖真实 Google） |
| `SHA256SUMS.txt` | 本目录全部文件的 SHA-256 |

`captures/` 与 JSON 中原始链接的 `gsessionid` 已替换为 `REDACTED`；该值只是 Google 的短期会话参数，
不参与 URL 判定，真实目标 URL 不受影响。

## 复核方式

```bash
cd 11_seo_google_indexed_urls
sha256sum -c SHA256SUMS.txt

python tools/tests/test_google_indexed_urls.py       # 18 项，应全部 OK

# 由 JSON 重新生成 Excel，结果应与仓库内文件一致
python tools/export_excel.py --input google_indexed_urls.json --output /tmp/rebuilt.xlsx
```

CSV 与 Excel 中 `check_status` 的含义：`ok`（2xx）、`http_error`（4xx/5xx）、`timeout`、`connection_error`、
`ssl_error`、`too_many_redirects`、`skipped`。超时/连接失败/5xx 会自动重试一次。

## 方法说明

1. 本机直接请求 Google 搜索结果时，Google 返回 enable-JavaScript 壳而非结果 HTML；脚本以退出码 5 明确失败，
   **不做任何绕过**。因此改用浏览器正常渲染搜索页，再把结果链接、标题、摘要与页码导出为 capture JSON。
2. 本次结果链接被 Google 包在 `/goto?url=<opaque>` 中，脚本对其执行一次 GET 并读取 302 的 `Location`，
   得到真实 URL；未解析成功或落到非 morrishk 域名的结果会被记录为失败并剔除。
3. 只保留 `www.morrishk.net` 与 `morrishk.net` 两个精确主机名；Google 自身链接、广告位、外部站点、子域名均剔除。
4. 采集期间出现过一次 Google `/sorry` 限流页：流程随即停止，未尝试验证码绕过；等待恢复后重新抓取第 1 页。
5. HTTP 检查为只读 GET；`http://` 页面若 301 到 HTTPS，`final_url` 与 `redirect_chain` 会记录该跳转。
   当前不可达的 URL 不会被删除，只标注状态。

## 不能由本清单得出的结论

- 不能据此判断「哪些页面被 Google 索引」或「索引了多少页」；
- 不能据此判断页面是否被 `noindex`、是否被 canonical 归并、是否存在抓取错误；
- 不能据此评价 SEO 表现（排名、流量、收录趋势）；
- HTTP 200 仅代表采集当时可访问，不代表索引状态。

上述判断需要 Google Search Console 的「网页索引编制 / 覆盖率 / 抓取统计 / 规范化」数据，
或站点服务器日志与 sitemap 对照。

## 边界

本目录只做只读采集与记录：未修改站点、未新建或执行 301、未删除页面、未修改 sitemap、未向 Google 提交索引、
未对生产环境做任何写入。

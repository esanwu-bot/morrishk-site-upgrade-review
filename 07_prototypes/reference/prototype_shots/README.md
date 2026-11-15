# 原型截图与差分证据

本目录是 `VISUAL_DIFF.md` 的**证据层**：两版同视口截图、逐像素差异图、以及两个脚本生成的报告。

## 采集条件

| 项 | 值 |
|---|---|
| 浏览器 | Microsoft Edge（Chromium）`--headless=new --disable-gpu --hide-scrollbars` |
| 视口 | 1440 × 2600，`--force-device-scale-factor=1` |
| 等待 | `--virtual-time-budget=4000` |
| 加载 | 本地 `python -m http.server` + `http://127.0.0.1` |
| 旧版来源 | `git archive v1.4-review` 导出的完整仓库树 |
| 新版来源 | `07_prototypes/`（本轮 v1.5.1） |
| 采集日期 | 2026-11-16 |

## 文件

| 目录 / 文件 | 内容 |
|---|---|
| `v1.4/` | 旧版 5 页截图（index / home / detail / search / inquiry） |
| `v1.5.1/` | 新版 5 页截图，同视口同高度 |
| `diff/diff_*.png` | 差异图：灰度打底，红 = 可见差异，浅红 = 严格差异但视觉不可辨 |
| `PIXEL_DIFF.md` | 页面集合/尺寸/完成度前置校验、逐页差异像素数、差异行段定位、位移补偿明细（含分子分母与校验式）（脚本生成） |
| `CSS_VALUE_DIFF.md` | 两版 `proto.css` 逐条取值比对，652 条等价 / 51 条真实变更，含分类合计自校验（脚本生成） |

## 重跑方式

```bash
# 1) 导出旧版
git archive v1.4-review | tar -x -C /tmp/_v14_snapshot

# 2) 两版各起一个静态服务（端口自定），按同一视口截图
#    见 VISUAL_DIFF.md 第二节的完整命令

# 3) 像素差分（页面集合不一致会直接失败，不会静默跳过）
python tools/pixel_diff.py --a <v1.4 截图> --b <v1.5.1 截图> --out .

# 4) CSS 取值比对
python tools/css_value_diff.py \
  --old <v1.4>/assets/proto.css --new <v1.5.1>/assets/proto.css \
  --tokens <v1.5.1>/assets/tokens.css --out CSS_VALUE_DIFF.md
```

两个脚本都带**非零退出码**语义，可直接接 CI：
`pixel_diff.py` 缺页/仅多页/两者兼有均退出 3、尺寸不一致或差分失败退出 4、完成页数不足退出 5；
`css_value_diff.py` 分类合计与真实变更数不一致退出 3。

失败时差异图只存在于本次运行的暂存目录并被清除，`--out` 下已存在的证据文件不会被改动。
回归用例见 `python tools/selftest.py`（43 项断言）。

## 文件哈希（SHA-256）

| 文件 | 字节 | SHA-256 |
|---|---|---|
| `CSS_VALUE_DIFF.md` | 6,624 | `a97f7e20c611693ee9442bd3718b5e4923f1acceed3788adcdb4d6435f2d79dc` |
| `PIXEL_DIFF.md` | 5,092 | `f447510ebdbc108ccdfc0eb849bf669359d4265d6213e42c066f4733298d6051` |
| `diff/diff_detail.png` | 143,925 | `4e1973925c037adc6add33253ec6482c1864e00cd069f9fdab6b4b5658516d59` |
| `diff/diff_home.png` | 152,906 | `d887afe4682def5c290e2acc8ff77f7bd921625afb8aa8def50034fe36c71a61` |
| `diff/diff_index.png` | 110,563 | `5f911d48a5227090db6e76c8862e470bb76c3848fee15df4c2a7b79c8bdefd72` |
| `diff/diff_inquiry.png` | 125,684 | `3933ac4a6307a918e5a266c88a2839b784d8711c52bae6c1e0398b7a1cce3586` |
| `diff/diff_search.png` | 129,019 | `381e8a2a703f8642aba7172c7cde3db79241d7c65dfcdeffafda603deacd54db` |
| `v1.4/detail.png` | 247,236 | `5ef511bc437a40559dd94849fb31e28ff69fb7e154ab80f0062787ca6499a721` |
| `v1.4/home.png` | 194,563 | `80ca85b3ba5fe8e43116b156a98d9e33971ebf29fabcef338be8aae4c7c6ecc3` |
| `v1.4/index.png` | 188,723 | `0c0f8cfb698102ed271fad581461e4320354323e7988e1cd8f3800aa0e82b90f` |
| `v1.4/inquiry.png` | 170,555 | `b9c5410d69076eba4570cecf637bea7fb81b619a7b9eb5058e8f0998cd761c82` |
| `v1.4/search.png` | 182,755 | `c89a54de436fa0bf8dae5195f279a04d59b4ee3f353076351c1f58de7c108241` |
| `v1.5.1/detail.png` | 249,274 | `4a65f71b15f7be4b21459b6035163093b4acace1e81ebb26a80f4ec41c605059` |
| `v1.5.1/home.png` | 197,758 | `fcbc9f8cac8f140002574d5fee293cdb9668ea5d9711de84c29fe868abd0dc11` |
| `v1.5.1/index.png` | 216,790 | `e0944896ccd4b4a8bcd1d62c0a312a5c0b09f57bf13a526d5b5260a914222f1c` |
| `v1.5.1/inquiry.png` | 170,064 | `64bee168b24a18776bb699dcaed7370391f79c80b1010a35dd29facbd6e63a79` |
| `v1.5.1/search.png` | 185,246 | `0e665086d8bc3b4b1955ba991976655bf3c02296c9d777591578f8c202732757` |

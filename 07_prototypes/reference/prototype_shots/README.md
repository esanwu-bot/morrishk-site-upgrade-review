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
| `pixel_diff/` | **一个目录 = 一个原子发布单元**：内含 `PIXEL_DIFF.md` 与 `diff/`，整组以一次 `rename` 就位 |
| `pixel_diff/diff/diff_*.png` | 差异图：灰度打底，红 = 可见差异，浅红 = 严格差异但视觉不可辨 |
| `pixel_diff/PIXEL_DIFF.md` | 页面集合/尺寸/完成度前置校验、逐页差异像素数、差异行段定位、位移补偿明细（含分子分母与校验式）（脚本生成） |
| `CSS_VALUE_DIFF.md` | 两版 `proto.css` 逐条取值比对，652 条等价 / 51 条真实变更，含分类合计自校验（脚本生成） |

## 重跑方式

```bash
# 1) 导出旧版
git archive v1.4-review | tar -x -C /tmp/_v14_snapshot

# 2) 两版各起一个静态服务（端口自定），按同一视口截图
#    见 VISUAL_DIFF.md 第二节的完整命令

# 3) 像素差分（页面集合不一致会直接失败，不会静默跳过）
#    --out 是本次 run 独占的结果目录，发布后内含 PIXEL_DIFF.md 与 diff/
python tools/pixel_diff.py --a <v1.4 截图> --b <v1.5.1 截图> --out pixel_diff

# 4) CSS 取值比对
python tools/css_value_diff.py \
  --old <v1.4>/assets/proto.css --new <v1.5.1>/assets/proto.css \
  --tokens <v1.5.1>/assets/tokens.css --out CSS_VALUE_DIFF.md
```

两个脚本都带**非零退出码**语义，可直接接 CI：
`pixel_diff.py` 缺页/仅多页/两者兼有均退出 3、尺寸不一致或差分失败退出 4、完成页数不足 5、
发布前置条件不满足（目标已存在且未加 `--replace-dir`、目标不是完整有效结果包、既有 `<out>.prev` 或 `<out>.prev/bundle` 未人工处理（含并发抢占）、发布瞬间被抢占、替换中目标或保留目录被调换）退出 6；产物校验失败 / 发布失败已回滚 / 回滚本身失败退出 7；
`css_value_diff.py` 分类合计与真实变更数不一致退出 3。

**发布模型（一个目录 = 一个原子单元）**：`--out` 指向的结果目录内含 `PIXEL_DIFF.md` 与 `diff/`，
二者同属一个目录，**整组以一次 `rename` 就位**，因此没有「图已发布、报告仍是旧版」的中间态，
也不存在报告被单独 `os.replace` 覆盖的情况。运行先在同级目录建
`.<out>.staging.<时间戳>-<pid>/`，差分、写报告、校验（每张图存在/非空/**格式确为 PNG** + 报告非空）
全部通过后才发布。目标不存在时，这一次 `rename` 同时充当存在性检查（不依赖先 check 后 rename），
并发抢占只会让 `rename` 失败、本次结果不发布，不会静默覆盖。
目标已存在时默认拒绝（退出 6），加 `--replace-dir` 才替换：先用 **`os.mkdir(<out>.prev)` 独占占位**
（POSIX 与 Windows 上都是原子的「不存在才创建」，失败即被占用——这里刻意不用「先 `lexists` 再
`rename`」，因为 POSIX 下 `rename(dir, 已存在的空目录)` 会成功，等于覆盖对方刚建的空目录），
再把旧包整组 rename 到容器内的 **`<out>.prev/bundle`**，然后新包就位。

容器内层**同样是 no-replace**，但两个平台的原语相反：Windows 的 `os.rename` 对已存在目标
（含空目录）一律失败，因此直接 rename、**不占位**；POSIX 的 `rename` 会覆盖空目录，因此先
`os.mkdir(<out>.prev/bundle)` 占位，被覆盖的只是本进程刚建的空目录。两条分支对外语义一致：
`prev/bundle` 已存在（无论空非空）→ 拒绝。移动旧包后还会**三重校验**容器身份（设备号 + inode）、
目录身份与包完整性，不符则原样退回（详见根 README 8.14）。

**严格 no-replace 并不成立，这里如实说明**（详见根 README 8.15）：占位目录在 `mkdir` 与
`rename` 之间若被第三方改名替换，那次 `rename` 仍会覆盖对方新建的空目录；`_rmdir_own()`
的身份比较与 `os.rmdir` 之间也有窗口。这两条**未消除**，本工具改为两条**限定表述**的不变量：

- **I1**（普通目录竞争模型内）：目标路径上是普通目录（非符号链接）且非空时，本工具的
  `rename` 与 `os.rmdir` 都会失败，因此删不掉也覆盖不了对方**已有内容**的目录。
  目标为符号链接时 `rename` 会替换链接本身，不在 I1 范围内。
- **I2**（工具自身操作的数据保护）：本工具自身的发布、回滚与清理动作不会因覆盖或删除
  非空旧包目录而丢失旧包内容；**不覆盖**其他进程直接修改、删除或移动旧包内容的行为。

**旧包不会被自动删除**：`<out>.prev/bundle` 原样保留，由人确认后清理——验证与删除之间无法排除第三方
替换 `prev` 路径的对象，本工具因此放弃删除权（详见根 README 8.12 / 8.13）。`<out>.prev` 已存在时
再次替换会被拒绝（退出 6），消息给出 `mv … .discard` 的处理方式。**任何失败都不改动历史证据。**

覆盖上一次结果（`pixel_diff/` 已存在）需显式加参数，且**事后要人工清理旧包**：

```bash
python tools/pixel_diff.py \
  --a v1.4 --b v1.5.1 --out pixel_diff --replace-dir
# 输出会提示 NOTICE: 旧结果包已原样保留在 .../pixel_diff.prev/bundle
mv pixel_diff.prev/bundle /tmp/pixel_diff.prev.$(date +%Y%m%d%H%M%S)   # 确认无误后移出仓库
rmdir pixel_diff.prev                                                  # 容器已空，可删
```

回归用例见 `python tools/selftest.py`（**137 项断言**，覆盖：目标已存在拒绝发布、残缺包 7 种（含
JPEG 冒充 `.png`）在 `--replace-dir` 下仍被拒且字节不变、既有 `.prev` 不被覆盖/删除、
发布成功后旧包原样保留在 `.prev/bundle` 且本进程从不 `rmtree` 它、`.prev` 未清理时再次替换被拒、
发布后第三方替换 `.prev` 时冒名目录逐字节完好、发布瞬间被并发抢占不覆盖对方、
空 `.prev` 被并发抢占时对方目录仍在且仍为空（占位不靠 rename）且源码不含 `lexists(prev)`、
容器内 `bundle` 被抢占（空与非空两种）时第三方内容不被覆盖、非空容器不被 `rmdir` 误删、
POSIX 分支下拒绝发生在 rename 之前（rename 调用记录为空）、容器被改名调换时旧包原样退回
且第三方容器不被删除、占位被换成非空目录时对方数据逐字节未被覆盖、身份检查通过后 rmdir
之前被换入的目录删不掉（不变量 I1）、
替换过程中目标被调换时不删除未验证目录（逐字节比对）、第二次 rename 失败后回滚字节不变、
回滚本身失败时保留 prev 并给出恢复命令、回滚时目标被抢占、目标只发生一次 rename、
两次独立运行报告字节一致）。

## 文件哈希（SHA-256）

| 文件 | 字节 | SHA-256 |
|---|---|---|
| `CSS_VALUE_DIFF.md` | 6,624 | `a97f7e20c611693ee9442bd3718b5e4923f1acceed3788adcdb4d6435f2d79dc` |
| `pixel_diff/PIXEL_DIFF.md` | 7,085 | `812db0cf9811e7bb33abd2885587fdb5f69053b19a7039e204c5496228395ae0` |
| `pixel_diff/diff/diff_detail.png` | 143,925 | `4e1973925c037adc6add33253ec6482c1864e00cd069f9fdab6b4b5658516d59` |
| `pixel_diff/diff/diff_home.png` | 152,906 | `d887afe4682def5c290e2acc8ff77f7bd921625afb8aa8def50034fe36c71a61` |
| `pixel_diff/diff/diff_index.png` | 110,563 | `5f911d48a5227090db6e76c8862e470bb76c3848fee15df4c2a7b79c8bdefd72` |
| `pixel_diff/diff/diff_inquiry.png` | 125,684 | `3933ac4a6307a918e5a266c88a2839b784d8711c52bae6c1e0398b7a1cce3586` |
| `pixel_diff/diff/diff_search.png` | 129,019 | `381e8a2a703f8642aba7172c7cde3db79241d7c65dfcdeffafda603deacd54db` |
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

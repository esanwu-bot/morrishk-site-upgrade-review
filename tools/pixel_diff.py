# -*- coding: utf-8 -*-
"""
同视口像素差分（v1.4 → v1.5.1 视觉回归证据）

用法：

    python mysql_schema_audit/tools/pixel_diff.py \
        --a _shots/diff/v14 --b _shots/diff/v151 --out _shots/diff

要求两版截图满足：同一浏览器、同一内核版本、同一视口（--window-size）、同一缩放、同一页面数量。
差分结果写入 <out>/PIXEL_DIFF.md，差异图写入 <out>/diff_<name>.png。

差分口径：
  1. 尺寸必须完全一致，否则直接报错（不做缩放对齐，避免伪造一致性）。
  2. 逐像素比较 RGB，三通道任一不同即计为差异像素（严格口径）。
  3. 另给"可见差异"口径：|ΔR|+|ΔG|+|ΔB| > 24，用于排除亚像素抗锯齿噪声。
  4. 差异区域按行分带（连续差异行合并为一段），每段给出起止行与像素数。
"""
from __future__ import annotations

import argparse
import io
import os
import sys

from PIL import Image, ImageChops

VISIBLE_DELTA = 24


def load(path):
    return Image.open(path).convert("RGB")


def diff_one(a_path, b_path, out_dir, name):
    a, b = load(a_path), load(b_path)
    if a.size != b.size:
        raise SystemExit("尺寸不一致: %s %s vs %s" % (name, a.size, b.size))
    w, h = a.size

    pa, pb = a.load(), b.load()
    strict = 0
    visible = 0
    rows = {}  # 行 -> 差异像素数（严格口径）

    # 差异图：以 v1.5.1 灰度打底，差异像素涂红
    base = b.convert("L").convert("RGB")
    out = base.copy()
    po = out.load()

    for y in range(h):
        for x in range(w):
            ra, ga, ba = pa[x, y]
            rb, gb, bb = pb[x, y]
            if ra == rb and ga == gb and ba == bb:
                continue
            strict += 1
            rows[y] = rows.get(y, 0) + 1
            if abs(ra - rb) + abs(ga - gb) + abs(ba - bb) > VISIBLE_DELTA:
                visible += 1
                po[x, y] = (255, 0, 0)
            else:
                po[x, y] = (255, 170, 170)

    total = w * h
    bands = []
    ys = sorted(rows)
    if ys:
        start = prev = ys[0]
        cnt = rows[ys[0]]
        for y in ys[1:]:
            if y == prev + 1:
                cnt += rows[y]
                prev = y
                continue
            bands.append((start, prev, cnt))
            start = prev = y
            cnt = rows[y]
        bands.append((start, prev, cnt))
    bands.sort(key=lambda t: -t[2])

    out_path = os.path.join(out_dir, "diff_%s.png" % name)
    out.save(out_path)

    return {
        "name": name,
        "size": (w, h),
        "total": total,
        "strict": strict,
        "visible": visible,
        "strict_pct": strict / total * 100,
        "visible_pct": visible / total * 100,
        "bands": bands,
        "diff_img": out_path,
    }


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--a", required=True, help="旧版截图目录")
    ap.add_argument("--b", required=True, help="新版截图目录")
    ap.add_argument("--out", required=True, help="输出目录（差异图与报告）")
    ap.add_argument("--label-a", default="v1.4")
    ap.add_argument("--label-b", default="v1.5.1")
    args = ap.parse_args(argv)

    names = sorted(os.path.splitext(f)[0] for f in os.listdir(args.a) if f.endswith(".png"))
    if not names:
        raise SystemExit("目录内没有 PNG: %s" % args.a)
    os.makedirs(args.out, exist_ok=True)

    results = []
    for n in names:
        a = os.path.join(args.a, n + ".png")
        b = os.path.join(args.b, n + ".png")
        if not os.path.exists(b):
            print("SKIP (缺对端): %s" % n)
            continue
        r = diff_one(a, b, args.out, n)
        results.append(r)
        print("%-10s %dx%d  strict=%d (%.3f%%)  visible=%d (%.3f%%)  bands=%d" %
              (n, r["size"][0], r["size"][1], r["strict"], r["strict_pct"],
               r["visible"], r["visible_pct"], len(r["bands"])))

    L = []
    add = L.append
    add("# 同视口像素差分报告")
    add("")
    add("**用途** 为 `VISUAL_DIFF.md` 提供可复现的像素级证据。脚本：`mysql_schema_audit/tools/pixel_diff.py`。")
    add("")
    add("| 项 | 值 |")
    add("|---|---|")
    add("| 旧版 | `%s` |" % args.label_a)
    add("| 新版 | `%s` |" % args.label_b)
    add("| 浏览器 | Microsoft Edge（Chromium）headless=new，`--disable-gpu --hide-scrollbars` |")
    add("| 视口 | 1440 × 2600，`--force-device-scale-factor=1` |")
    add("| 渲染地址 | 本地 `http.server`（`http://127.0.0.1`），非 `file://` |")
    add("| 页面数 | %d |" % len(results))
    add("| 严格口径 | 三通道任一不同即计入 |")
    add("| 可见口径 | |ΔR|+|ΔG|+|ΔB| > %d |" % VISIBLE_DELTA)
    add("")
    add("## 汇总")
    add("")
    add("| 页面 | 尺寸 | 总像素 | 严格差异 | 占比 | 可见差异 | 占比 | 差异行段数 |")
    add("|---|---|---|---|---|---|---|---|")
    for r in results:
        add("| `%s` | %d×%d | %s | %s | %.3f%% | %s | %.3f%% | %d |" %
            (r["name"], r["size"][0], r["size"][1], format(r["total"], ","),
             format(r["strict"], ","), r["strict_pct"],
             format(r["visible"], ","), r["visible_pct"], len(r["bands"])))
    add("")
    tot = sum(r["total"] for r in results)
    ts = sum(r["strict"] for r in results)
    tv = sum(r["visible"] for r in results)
    add("**合计**：严格差异 %s / %s 像素（%.3f%%），可见差异 %s（%.3f%%）。" %
        (format(ts, ","), format(tot, ","), ts / tot * 100,
         format(tv, ","), tv / tot * 100))
    add("")

    add("## 差异区域定位")
    add("")
    add("按行分带，取每页差异最集中的前 5 段。行号自页面顶部起算。")
    add("")
    for r in results:
        add("### `%s`" % r["name"])
        add("")
        if not r["bands"]:
            add("零差异。")
            add("")
            continue
        add("| 起行 | 止行 | 高度 | 差异像素 |")
        add("|---|---|---|---|")
        for s, e, c in r["bands"][:5]:
            add("| %d | %d | %d | %s |" % (s, e, e - s + 1, format(c, ",")))
        add("")
        add("差异图：`%s`" % os.path.basename(r["diff_img"]))
        add("")

    add("## 口径限制（必须一并阅读）")
    add("")
    add("1. **只覆盖一个内核**：Chromium（Edge headless）。Firefox / Safari / 移动端未测。")
    add("2. **只覆盖一个视口**：1440×2600。窄屏、平板、真机均未测。")
    add("3. **只覆盖首屏 2600px**：页面更长时超出部分不在差分范围内。")
    add("4. **不含交互态**：hover / focus / 展开替代料 / 打开浮层等状态未截图。")
    add("5. **字体渲染依赖本机**：换机器或换字体版本会产生系统性抗锯齿差异，"
        "本报告结论**仅在相同环境下可复现**。")
    add("6. **差异为 0 不等于视觉正确**：只证明两版渲染一致，不证明设计合理。")
    add("")

    os.makedirs(args.out, exist_ok=True)
    out_md = os.path.join(args.out, "PIXEL_DIFF.md")
    io.open(out_md, "w", encoding="utf-8", newline="\n").write("\n".join(L) + "\n")
    print("written:", out_md)
    return 0


if __name__ == "__main__":
    sys.exit(main())

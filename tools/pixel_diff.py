# -*- coding: utf-8 -*-
"""
同视口像素差分（v1.4 → v1.5.1 视觉回归证据）

用法：

    python tools/pixel_diff.py \
        --a 07_prototypes/reference/prototype_shots/v1.4 \
        --b 07_prototypes/reference/prototype_shots/v1.5.1 \
        --out 07_prototypes/reference/prototype_shots

要求两版截图满足：同一浏览器、同一内核版本、同一视口（--window-size）、同一缩放、
**同一页面集合**。

差分口径：
  1. **页面集合必须完全相等**：任一方向缺页立即非零退出，不写报告，不允许静默跳过。
  2. 每页尺寸必须完全一致，否则非零退出（不做缩放对齐，避免伪造一致性）。
  3. 逐像素比较 RGB，三通道任一不同即计为差异像素（严格口径）。
  4. 另给"可见差异"口径：|ΔR|+|ΔG|+|ΔB| > 24，用于排除亚像素抗锯齿噪声。
  5. 差异区域按行分带（连续差异行合并为一段），每段给出起止行与像素数。
  6. **位移补偿口径**：在 ±N 像素纵向偏移内搜索最小差异率，用来区分
     "同样的内容整体错位" 与 "内容本身真的变了"。两种口径并列给出，不互相替代。

发布模型（整组一次性发布，不覆盖已有证据）：
  1. 每次运行在 `<out>/.runs/<时间戳>-<pid>/` 创建独立结果目录，内含 `diff/` 与 `PIXEL_DIFF.md`。
  2. 全部页面差分完成、报告写毕、产物校验通过后，才把整组结果发布到 `<out>/`。
  3. 发布用**同一文件系统内的目录级原子重命名**：目标 `diff/` 必须预先不存在。
     若已存在，默认拒绝发布并退出 6；确认要替换时加 `--replace-dir`，
     此时旧目录先被移开（可回滚），新目录发布成功后才删除旧目录。
  4. 报告中转（PIXEL_DIFF.md）是提交点：它替换成功才算发布完成；
     若它失败，新目录与旧目录一并回滚，不留部分更新。
  5. 任何失败只删除本次结果目录，历史证据不被触碰。

退出码：
  0 = 集合一致、尺寸一致、全部页面完成差分、发布成功
  2 = 目录缺失或目录内没有 PNG
  3 = 两版页面集合不一致（缺页 / 多页）
  4 = 尺寸不一致或单页差分失败（此时不发布）
  5 = 完成页数少于页面集合（此时不发布）
  6 = 发布目标已存在且未指定 --replace-dir（此时不发布）
  7 = 产物校验或发布失败（已回滚，旧证据完好）
"""
from __future__ import annotations

import argparse
import io
import os
import shutil
import sys
import time

from PIL import Image, ImageChops

VISIBLE_DELTA = 24


class PublishError(Exception):
    """发布阶段的预期失败（目标已存在、校验不通过等）。"""


def load(path):
    return Image.open(path).convert("RGB")


def png_stems(directory):
    """目录内 PNG 的文件名集合（不含扩展名）。"""
    return {os.path.splitext(f)[0] for f in os.listdir(directory) if f.lower().endswith(".png")}


def count_strict_diff(img_a, img_b):
    """同尺寸两图的严格差异像素数（三通道任一不同即计入）。C 级实现，供位移搜索复用。"""
    d = ImageChops.difference(img_a, img_b)
    rc, gc, bc = d.split()
    mx = ImageChops.lighter(ImageChops.lighter(rc, gc), bc)
    hist = mx.histogram()
    return sum(hist[1:])


def shifted_rate(img_a, img_b, dy):
    """把新版纵向平移 dy 像素后，在重叠区计算差异率。

    dy > 0 表示新版内容比旧版靠上（旧版 y=dy 与新版 y=0 对齐）。
    """
    w, h = img_a.size
    if dy > 0:
        sub_a = img_a.crop((0, dy, w, h))
        sub_b = img_b.crop((0, 0, w, h - dy))
    elif dy < 0:
        sub_a = img_a.crop((0, 0, w, h + dy))
        sub_b = img_b.crop((0, -dy, w, h))
    else:
        sub_a, sub_b = img_a, img_b
    n = count_strict_diff(sub_a, sub_b)
    area = sub_a.size[0] * sub_a.size[1]
    return n / area * 100.0, n, area


def best_shift(img_a, img_b, search):
    """在 [-search, +search] 内搜索使差异率最小的纵向偏移。返回 (dy, rate, pixels, area)。"""
    rate0, n0, area0 = shifted_rate(img_a, img_b, 0)
    best = (0, rate0, n0, area0)
    for dy in range(1, search + 1):
        for cand in (dy, -dy):
            rate, n, area = shifted_rate(img_a, img_b, cand)
            if rate < best[1]:
                best = (cand, rate, n, area)
    return best


def diff_one(a_path, b_path, save_dir, name, shift_search):
    a, b = load(a_path), load(b_path)
    if a.size != b.size:
        raise ValueError("尺寸不一致: %s %s vs %s" % (name, a.size, b.size))
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

    out_path = os.path.join(save_dir, "diff_%s.png" % name)
    out.save(out_path)

    r = {
        "name": name,
        "size": (w, h),
        "total": total,
        "strict": strict,
        "visible": visible,
        "strict_pct": strict / total * 100,
        "visible_pct": visible / total * 100,
        "bands": bands,
        "diff_img": out_path,
        "shift_dy": None,
        "shift_pct": None,
    }
    if shift_search > 0:
        dy, rate, n, area = best_shift(a, b, shift_search)
        r.update({"shift_dy": dy, "shift_pct": rate, "shift_pixels": n, "shift_area": area})
    return r


# --------------------------------------------------------------------------
# 发布：整组一次性，不覆盖已有证据
# --------------------------------------------------------------------------

def verify_run(run_dir, names):
    """发布前校验产物完整性：每张差异图存在、非空、可解码。"""
    diff_dir = os.path.join(run_dir, "diff")
    problems = []
    for n in names:
        p = os.path.join(diff_dir, "diff_%s.png" % n)
        if not os.path.exists(p):
            problems.append("缺少 %s" % p)
            continue
        if os.path.getsize(p) == 0:
            problems.append("空文件 %s" % p)
            continue
        try:
            Image.open(p).verify()
        except Exception as exc:
            problems.append("无法解码 %s: %s" % (p, exc))
    md = os.path.join(run_dir, "PIXEL_DIFF.md")
    if not os.path.exists(md) or os.path.getsize(md) == 0:
        problems.append("报告缺失或为空: %s" % md)
    if problems:
        raise PublishError("产物校验失败：" + "；".join(problems))


def publish_run(out_dir, run_dir, replace_dir):
    """把 run_dir 整组发布到 out_dir。

    - `diff/` 用目录级 rename 发布；目标已存在时默认拒绝，需 replace_dir=True。
    - `PIXEL_DIFF.md` 最后替换，作为提交点；失败则连同 diff 目录一起回滚。

    返回 (diff_dir, md_path)。
    """
    src_diff = os.path.join(run_dir, "diff")
    src_md = os.path.join(run_dir, "PIXEL_DIFF.md")
    dst_diff = os.path.join(out_dir, "diff")
    dst_md = os.path.join(out_dir, "PIXEL_DIFF.md")

    prev = None
    if os.path.exists(dst_diff):
        if not replace_dir:
            raise PublishError(
                "发布目标已存在：%s\n"
                "  为避免覆盖已有证据，默认拒绝发布。确认要替换请加 --replace-dir。" % dst_diff)
        prev = dst_diff + ".prev.%d" % os.getpid()
        if os.path.exists(prev):
            shutil.rmtree(prev, ignore_errors=True)
        os.rename(dst_diff, prev)  # 旧证据移开，保留到发布成功为止

    try:
        os.rename(src_diff, dst_diff)  # 目录级原子发布
    except Exception:
        if prev:
            os.rename(prev, dst_diff)  # 回滚
        raise

    try:
        os.replace(src_md, dst_md)  # 单文件原子，作为提交点
    except Exception:
        shutil.rmtree(dst_diff, ignore_errors=True)
        if prev:
            os.rename(prev, dst_diff)  # 连图一起回滚
        raise

    if prev:
        shutil.rmtree(prev, ignore_errors=True)
    return dst_diff, dst_md


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--a", required=True, help="旧版截图目录")
    ap.add_argument("--b", required=True, help="新版截图目录")
    ap.add_argument("--out", required=True, help="输出目录（差异图与报告）")
    ap.add_argument("--label-a", default="v1.4")
    ap.add_argument("--label-b", default="v1.5.1")
    ap.add_argument("--shift-search", type=int, default=40,
                    help="纵向位移补偿搜索半径（像素），0 表示关闭该口径。默认 40")
    ap.add_argument("--replace-dir", action="store_true",
                    help="允许替换 --out 下已存在的 diff/ 目录。默认拒绝，以免覆盖历史证据")
    args = ap.parse_args(argv)

    for d in (args.a, args.b):
        if not os.path.isdir(d):
            sys.stderr.write("ERROR: 目录不存在: %s\n" % d)
            return 2

    names_a = png_stems(args.a)
    names_b = png_stems(args.b)
    if not names_a and not names_b:
        sys.stderr.write("ERROR: 两个目录内都没有 PNG\n")
        return 2
    if not names_a:
        sys.stderr.write("ERROR: 旧版目录内没有 PNG: %s\n" % args.a)
        return 2
    if not names_b:
        sys.stderr.write("ERROR: 新版目录内没有 PNG: %s\n" % args.b)
        return 2

    # 硬性条件：两版页面集合必须完全相等。缺页不跳过、多页不忽略。
    if names_a != names_b:
        sys.stderr.write("ERROR: 两版页面集合不一致，拒绝生成差异报告\n")
        sys.stderr.write("  旧版 %d 页，新版 %d 页\n" % (len(names_a), len(names_b)))
        for n in sorted(names_a - names_b):
            sys.stderr.write("  仅旧版存在（新版缺页）: %s.png\n" % n)
        for n in sorted(names_b - names_a):
            sys.stderr.write("  仅新版存在（旧版无对应）: %s.png\n" % n)
        return 3

    os.makedirs(args.out, exist_ok=True)

    # 每次运行独立且唯一的结果目录（与 --out 同文件系统，保证 rename 原子）
    run_id = "%s-%d" % (time.strftime("%Y%m%d-%H%M%S"), os.getpid())
    run_root = os.path.join(args.out, ".runs")
    run_dir = os.path.join(run_root, run_id)
    run_diff = os.path.join(run_dir, "diff")
    os.makedirs(run_diff)

    try:
        results = []
        failed = []
        for n in sorted(names_a):
            a = os.path.join(args.a, n + ".png")
            b = os.path.join(args.b, n + ".png")
            try:
                r = diff_one(a, b, run_diff, n, args.shift_search)
            except Exception as exc:  # 尺寸不一致、文件损坏等
                failed.append((n, str(exc)))
                continue
            results.append(r)
            extra = ""
            if r["shift_dy"] is not None:
                extra = "  shift dy=%+d -> %.3f%%" % (r["shift_dy"], r["shift_pct"])
            print("%-10s %dx%d  strict=%d (%.3f%%)  visible=%d (%.3f%%)  bands=%d%s" %
                  (n, r["size"][0], r["size"][1], r["strict"], r["strict_pct"],
                   r["visible"], r["visible_pct"], len(r["bands"]), extra))

        if failed:
            for n, msg in failed:
                sys.stderr.write("FAILED: %s —— %s\n" % (n, msg))
            sys.stderr.write("ERROR: %d 页差分失败，未发布（--out 下已有证据未改动）\n" % len(failed))
            return 4
        if len(results) != len(names_a):
            sys.stderr.write("ERROR: 完成 %d 页 != 页面集合 %d 页，未发布\n" %
                             (len(results), len(names_a)))
            return 5

        L = []
        add = L.append
        add("# 同视口像素差分报告")
        add("")
        add("**用途** 为 `VISUAL_DIFF.md` 提供可复现的像素级证据。脚本：`tools/pixel_diff.py`。")
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
        add("| 可见口径 | \\|ΔR\\|+\\|ΔG\\|+\\|ΔB\\| > %d |" % VISIBLE_DELTA)
        add("| 位移补偿搜索半径 | ±%d px（`--shift-search`） |" % args.shift_search)
        add("| 发布方式 | 独立结果目录 `%s` → 目录级 rename 整组发布 |" % run_id)
        add("")

        # ---------------- 0. 前置校验 ----------------
        add("## 0. 前置校验（硬性条件）")
        add("")
        add("脚本在生成任何数字之前先做三项校验，任一不通过即非零退出且**不写报告**，"
            "不存在「少比一页仍然 PASS」的情况。")
        add("")
        add("| 校验项 | 规则 | 结果 |")
        add("|---|---|---|")
        add("| 页面集合一致 | 两目录 PNG 文件名集合必须完全相等 | **PASS**（%d = %d） |" %
            (len(names_a), len(names_b)))
        sizes = {r["size"] for r in results}
        size_desc = ("全部 %d×%d" % next(iter(sizes))) if len(sizes) == 1 else "逐页见第 1 节"
        add("| 尺寸一致 | 每页两图尺寸必须完全相同，不做缩放对齐 | **PASS**（%s） |" % size_desc)
        add("| 差分完成度 | 完成页数必须等于页面集合页数 | **PASS**（%d / %d） |" %
            (len(results), len(names_a)))
        add("")
        add("**失败与发布语义**：全部页面差分完成、报告写毕、产物校验通过后才整组发布。"
            "发布用同一文件系统内的**目录级原子重命名**，目标 `diff/` 必须预先不存在；"
            "已存在时默认拒绝（退出 6），加 `--replace-dir` 才替换，且旧目录在发布成功后才删除。"
            "报告中转是提交点：报告替换失败则连同新目录一起回滚。**任何失败都不触碰历史证据。**")
        add("")
        add("页面集合（两版逐一对应）：")
        add("")
        add("| 页面 | 旧版 | 新版 |")
        add("|---|---|---|")
        for r in results:
            add("| `%s` | `%s/%s.png` | `%s/%s.png` |" %
                (r["name"], args.label_a, r["name"], args.label_b, r["name"]))
        add("")

        # ---------------- 1. 汇总 ----------------
        add("## 1. 汇总")
        add("")
        add("| 页面 | 尺寸 | 总像素 | 严格差异 | 占比 | 可见差异 | 占比 | 差异行段数 | 补偿后占比 | 最佳 dy |")
        add("|---|---|---|---|---|---|---|---|---|---|")
        for r in results:
            if r["shift_dy"] is None:
                sh, dy = "—", "—"
            else:
                sh, dy = "%.3f%%" % r["shift_pct"], "%+d px" % r["shift_dy"]
            add("| `%s` | %d×%d | %s | %s | %.3f%% | %s | %.3f%% | %d | %s | %s |" %
                (r["name"], r["size"][0], r["size"][1], format(r["total"], ","),
                 format(r["strict"], ","), r["strict_pct"],
                 format(r["visible"], ","), r["visible_pct"], len(r["bands"]), sh, dy))
        add("")
        tot = sum(r["total"] for r in results)
        ts = sum(r["strict"] for r in results)
        tv = sum(r["visible"] for r in results)
        add("**合计（严格口径）**：%s / %s 像素（%.3f%%），可见差异 %s（%.3f%%）。" %
            (format(ts, ","), format(tot, ","), ts / tot * 100,
             format(tv, ","), tv / tot * 100))
        add("")
        if args.shift_search > 0:
            sc = sum(r.get("shift_pixels", 0) for r in results)
            sa = sum(r.get("shift_area", 0) for r in results)
            add("**合计（位移补偿口径）**：按每页各自的最佳 dy 平移后，差异 %s / %s 像素（%.3f%%）。" %
                (format(sc, ","), format(sa, ","), sc / sa * 100))
            add("")
            add("### 1.1 位移补偿明细（可逐页核对分子分母）")
            add("")
            add("| 页面 | 最佳 dy | 平移后差异像素 | 重叠面积 | 残余差异率 |")
            add("|---|---|---|---|---|")
            for r in results:
                add("| `%s` | %+d px | %s | %s | %.3f%% |" %
                    (r["name"], r["shift_dy"], format(r["shift_pixels"], ","),
                     format(r["shift_area"], ","), r["shift_pct"]))
            add("| **合计** | — | **%s** | **%s** | **%.3f%%** |" %
                (format(sc, ","), format(sa, ","), sc / sa * 100))
            add("")
            add("**校验式**：%s / %s = %.5f = %.3f%%，与上表合计一致。" %
                (format(sc, ","), format(sa, ","), sc / sa, sc / sa * 100))
            add("")
            add("**分母为何与严格口径不同**：严格口径分母是原图总面积（%s），"
                "补偿口径分母是各页**平移后的重叠面积**之和（%s）。"
                "dy≠0 的页面上下各裁掉 |dy| 行，重叠面积随之减少，两个分母不可混用、也不互相替代。"
                % (format(tot, ","), format(sa, ",")))
            add("")
            add("**这个数字能说明什么、不能说明什么**：在当前测试的**整页单一纵向位移模型**下，"
                "差异率由 %.3f%% 降至约 %.3f%%——说明全局纵向平移不足以解释大部分像素差异。"
                "但剩余差异同时包含「内容变化」与「未被本模型解释的布局差异」"
                "（分段位移、横向位移、局部重排都未建模），**不能直接等同于纯内容差异**。"
                % (ts / tot * 100, sc / sa * 100))
            add("")

        # ---------------- 2. 差异区域 ----------------
        add("## 2. 差异区域定位")
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
            add("差异图：`diff/%s`" % os.path.basename(r["diff_img"]))
            add("")

        # ---------------- 3. 限制 ----------------
        add("## 3. 口径限制（必须一并阅读）")
        add("")
        add("1. **只覆盖一个内核**：Chromium（Edge headless）。Firefox / Safari / 移动端未测。")
        add("2. **只覆盖一个视口**：1440×2600。窄屏、平板、真机均未测。")
        add("3. **只覆盖首屏 2600px**：页面更长时超出部分不在差分范围内。")
        add("4. **不含交互态**：hover / focus / 展开替代料 / 打开浮层等状态未截图。")
        add("5. **字体渲染依赖本机**：换机器或换字体版本会产生系统性抗锯齿差异，"
            "本报告结论**仅在相同环境下可复现**。")
        add("6. **差异为 0 不等于视觉正确**：只证明两版渲染一致，不证明设计合理。")
        add("7. **位移补偿只搜纵向、只搜全局单一偏移**：不做横向偏移、不做分段位移。"
            "页面不同区段位移量不同时（累计位移的典型表现），单一 dy 只能部分抵消，"
            "补偿后残余仍偏大属于预期。")
        add("8. **补偿口径不做内容语义判断**：它只回答「在这个受限的对齐模型下残余多少」，"
            "不判断剩下的差异是否可接受，也不能把残余率直接当作纯内容差异。")
        add("")

        # 报告写进本次结果目录，与差异图同属一个发布单元
        io.open(os.path.join(run_dir, "PIXEL_DIFF.md"), "w",
                encoding="utf-8", newline="\n").write("\n".join(L) + "\n")

        # 校验 → 发布（整组）
        verify_run(run_dir, [r["name"] for r in results])
        diff_dir, md_path = publish_run(args.out, run_dir, args.replace_dir)

        print("written: %s" % md_path)
        print("images:  %s" % diff_dir)
        print("pages=%d  strict=%s  set_check=PASS  size_check=PASS  publish=PASS" %
              (len(results), format(ts, ",")))
        return 0
    except PublishError as exc:
        sys.stderr.write("ERROR: %s\n" % exc)
        return 6
    except Exception as exc:
        sys.stderr.write("ERROR: 发布失败，已回滚：%s\n" % exc)
        return 7
    finally:
        # 无论成败都清掉本次结果目录；历史证据不在这个目录里
        shutil.rmtree(run_dir, ignore_errors=True)
        try:
            os.rmdir(run_root)  # 只在空目录时成功，避免留下空的 .runs
        except OSError:
            pass


if __name__ == "__main__":
    sys.exit(main())

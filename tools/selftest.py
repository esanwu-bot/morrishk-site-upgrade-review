# -*- coding: utf-8 -*-
"""
审计工具回归自测（R1 / R2 / R3）

用法（仓库根目录）：

    python tools/selftest.py

覆盖范围：

  R1  css_value_diff.category()：圆角属性族是否全部归入「圆角」、一般 border 是否仍归「颜色」、
      真实数据分类合计是否等于 51（互斥性的可验证形式）
  R2  check_tokens 的 style 属性扫描：双引号 / 单引号 / 跨行是否检出；
      HTML 注释与 <style> 块内的同名文本是否被遮蔽；<script> 内是否仍计入
  R3  pixel_diff 的集合校验：缺页、仅多页、缺页+多页、尺寸不符、正常；
      失败时是否改动 --out 下运行前已存在的文件；报告是否字节级可复现

退出码：0 = 全部通过；1 = 有失败项。
"""
from __future__ import annotations

import contextlib
import importlib.util
import io
import os
import shutil
import subprocess
import sys
import tempfile

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


def load(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, name + ".py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


ct = load("check_tokens")
cvd = load("css_value_diff")

RESULTS = []


def check(group, name, ok, detail=""):
    RESULTS.append((group, name, bool(ok), detail))
    print("[%s] %-6s %-46s %s" % ("PASS" if ok else "FAIL", group, name, detail))


# --------------------------------------------------------------------------
# R1 分类顺序与覆盖
# --------------------------------------------------------------------------

def test_r1():
    radius = [
        "border-radius",
        "border-top-left-radius",
        "border-bottom-right-radius",
        "border-start-start-radius",
        "border-end-end-radius",
        "-webkit-border-radius",
    ]
    for p in radius:
        got = cvd.category(p)
        check("R1", "圆角族 %s" % p, got == "圆角", "-> %s" % got)

    colors = ["border", "border-color", "border-top", "border-left-color",
              "background", "background-color", "color", "outline"]
    for p in colors:
        got = cvd.category(p)
        check("R1", "一般 border/颜色 %s" % p, got == "颜色", "-> %s" % got)

    check("R1", "box-shadow 归入阴影", cvd.category("box-shadow") == "阴影")
    check("R1", "z-index 归入层级", cvd.category("z-index") == "层级")
    check("R1", "padding 归入间距", cvd.category("padding") == "间距")
    check("R1", "font-size 归入排版", cvd.category("font-size") == "排版")

    # 互斥性：category 是单值函数，每条记录只会落进一个桶。
    # 可验证的形式是「分类合计 == 真实变更数」，这里用真实 CSS 重算一遍。
    old_css = os.path.join(os.path.dirname(ROOT), "_v14_snapshot", "07_prototypes", "assets", "proto.css")
    new_css = os.path.join(ROOT, "07_prototypes", "assets", "proto.css")
    tok_css = os.path.join(ROOT, "07_prototypes", "assets", "tokens.css")
    if not os.path.exists(old_css):
        check("R1", "真实数据分类合计（需 v1.4 快照）", True, "跳过：未找到 %s" % old_css)
        return
    buf = io.StringIO()
    tmp_out = os.path.join(tempfile.mkdtemp(prefix="selftest_r1_"), "CSS_VALUE_DIFF.md")
    with contextlib.redirect_stdout(buf):
        rc = cvd.main(["--old", old_css, "--new", new_css, "--tokens", tok_css, "--out", tmp_out])
    text = buf.getvalue()
    changed = None
    tally = 0
    for line in text.splitlines():
        if line.startswith("decls="):
            changed = int(line.split("changed=")[1].split()[0])
        if line.startswith("分类:"):
            tally = sum(int(x.split("=")[1]) for x in line[3:].split(" / "))
    check("R1", "真实数据 51 条不变", changed == 51, "changed=%s" % changed)
    check("R1", "分类合计 == 真实变更数", tally == changed, "合计=%s / changed=%s" % (tally, changed))
    check("R1", "自校验退出码 0", rc == 0, "rc=%s" % rc)
    shutil.rmtree(os.path.dirname(tmp_out), ignore_errors=True)


# --------------------------------------------------------------------------
# R2 style 属性扫描
# --------------------------------------------------------------------------

def test_r2():
    cases = [
        ("双引号", '<div style="color: #ffffff">x</div>', 1),
        ("单引号", "<div style='color: #000000'>x</div>", 1),
        ("跨行", '<div style="\n  color: #abcdef;\n">x</div>', 1),
        ("HTML 注释内", '<!-- <div style="color: #ffffff"> -->', 0),
        ("属性单引号跨行", "<div style='\n color:#123456;\n'>x</div>", 1),
    ]
    for label, html, expect in cases:
        hits = ct.find_css_color_literals(html, "x.html")
        check("R2", "style 属性 %s" % label, len(hits) == expect,
              "期望 %d 实际 %d" % (expect, len(hits)))

    # <style> 块内的字面色值属于 CSS，应当检出（与 style 属性遮蔽互不影响）
    style_block = '<style>.a{color:#fff}</style>'
    hits = ct.find_css_color_literals(style_block, "x.html")
    check("R2", "<style> 块内色值仍检出", len(hits) == 1, "实际 %d" % len(hits))

    # <script> 故意不遮蔽：模板字符串可能生成真实样式
    script = '<script>el.style = "color: #fff"</script>'
    hits = ct.find_css_color_literals(script, "x.html")
    check("R2", "<script> 内 style 仍计入", len(hits) == 1, "实际 %d" % len(hits))
    check("R2", "<script> 统计函数一致", ct.count_script_style_attrs(script, "x.html") == 1)

    # 注释遮蔽不应影响行号
    html = '<!-- 注释 -->\n<div style="color:#fff">x</div>'
    hits = ct.find_css_color_literals(html, "x.html")
    check("R2", "遮蔽后行号不变", bool(hits) and hits[0][0] == 2,
          "行号=%s" % (hits[0][0] if hits else None))


# --------------------------------------------------------------------------
# R3 集合校验与失败清理
# --------------------------------------------------------------------------

def _img(path, size, color="white"):
    Image.new("RGB", size, color).save(path)


def _run_pd(a, b, out, shift=0, replace=False):
    cmd = [sys.executable, os.path.join(HERE, "pixel_diff.py"),
           "--a", a, "--b", b, "--out", out, "--shift-search", str(shift)]
    if replace:
        cmd.append("--replace-dir")
    p = subprocess.run(cmd, capture_output=True, text=True,
                       encoding="utf-8", errors="replace")
    return p.returncode, (p.stdout or "") + (p.stderr or "")


def _snapshot(directory):
    """目录内所有文件的 {相对路径: 字节}，用于比对整组证据是否被改动。"""
    out = {}
    if not os.path.isdir(directory):
        return out
    for dp, _, fns in os.walk(directory):
        for fn in fns:
            full = os.path.join(dp, fn)
            out[os.path.relpath(full, directory)] = open(full, "rb").read()
    return out


def test_r3():
    base = tempfile.mkdtemp(prefix="selftest_r3_")
    try:
        sq = (100, 100)
        full = os.path.join(base, "full")      # detail + home
        only_detail = os.path.join(base, "d")  # 只有 detail
        short = os.path.join(base, "short")    # detail + home(尺寸不同)
        extra = os.path.join(base, "extra")    # detail + index
        for d in (full, only_detail, short, extra):
            os.makedirs(d)
        _img(os.path.join(full, "detail.png"), sq)
        _img(os.path.join(full, "home.png"), sq)
        _img(os.path.join(only_detail, "detail.png"), sq)
        _img(os.path.join(short, "detail.png"), sq)
        _img(os.path.join(short, "home.png"), (100, 80))
        _img(os.path.join(extra, "detail.png"), sq)
        _img(os.path.join(extra, "index.png"), sq)

        out = os.path.join(base, "out")
        os.makedirs(out)

        rc, log = _run_pd(full, only_detail, out)
        check("R3", "缺页 -> 退出 3", rc == 3, "rc=%d" % rc)
        check("R3", "缺页时报出页面名", "home.png" in log, "日志含 home.png")

        rc, log = _run_pd(only_detail, full, out)
        check("R3", "仅多页 -> 退出 3", rc == 3, "rc=%d" % rc)
        check("R3", "仅多页时报出页面名", "home.png" in log and "仅新版存在" in log, "日志含 home.png")

        rc, log = _run_pd(full, extra, out)
        check("R3", "缺页+多页 -> 退出 3", rc == 3, "rc=%d" % rc)

        # 预置一整套「运行前已存在」的证据（多文件），验证失败时整组不被改动
        diff_dir = os.path.join(out, "diff")
        os.makedirs(diff_dir, exist_ok=True)
        _img(os.path.join(diff_dir, "diff_detail.png"), (10, 10), "red")
        _img(os.path.join(diff_dir, "diff_home.png"), (10, 10), "blue")
        _img(os.path.join(diff_dir, "diff_old.png"), (10, 10), "green")
        before = _snapshot(diff_dir)

        rc, log = _run_pd(full, short, out)
        after = _snapshot(diff_dir)
        check("R3", "尺寸不符 -> 退出 4", rc == 4, "rc=%d" % rc)
        check("R3", "失败时整组旧证据未变（含文件数）",
              set(before) == set(after) and all(before[k] == after[k] for k in before),
              "%d 个文件" % len(before))
        check("R3", "失败时未写报告", not os.path.exists(os.path.join(out, "PIXEL_DIFF.md")))
        check("R3", "失败时无运行目录残留",
              not os.path.exists(os.path.join(out, ".runs")) or
              not os.listdir(os.path.join(out, ".runs")),
              str(os.listdir(out)))

        # 目标已存在时默认拒绝发布（不覆盖历史证据）
        rc, log = _run_pd(full, full, out)
        keeps = _snapshot(diff_dir)
        check("R3", "目标已存在 -> 默认退出 6", rc == 6, "rc=%d" % rc)
        check("R3", "默认拒绝时旧证据仍未被改动",
              all(keeps[k] == before[k] for k in before), "%d 个文件" % len(before))

        # 显式 --replace-dir 才替换，且旧目录在成功后才消失
        rc, log = _run_pd(full, full, out, replace=True)
        check("R3", "显式 --replace-dir -> 退出 0", rc == 0, "rc=%d" % rc)
        check("R3", "成功时才写出报告", os.path.exists(os.path.join(out, "PIXEL_DIFF.md")))
        after_ok = _snapshot(diff_dir)
        check("R3", "成功时替换为本次结果", after_ok != before,
              "%d 个文件" % len(after_ok))
        check("R3", "成功后无 .runs 残留",
              not os.path.exists(os.path.join(out, ".runs")),
              str(os.listdir(out)))
        check("R3", "成功后无 .prev 残留",
              not any(n.startswith("diff.prev") for n in os.listdir(out)),
              str(os.listdir(out)))

        # 报告必须字节级可复现：两次独立运行（进程不同 -> 运行 ID 不同）产出应完全相同。
        # 这条用来防「报告里写入运行 ID / 时间戳，导致每次重跑都留下工作区脏改动」。
        out2 = os.path.join(base, "out2")
        os.makedirs(out2)
        rc2, _ = _run_pd(full, full, out2)
        p1 = os.path.join(out, "PIXEL_DIFF.md")
        p2 = os.path.join(out2, "PIXEL_DIFF.md")
        same = False
        if os.path.exists(p1) and os.path.exists(p2):
            with io.open(p1, "rb") as f1, io.open(p2, "rb") as f2:
                same = f1.read() == f2.read()
        check("R3", "两次独立运行报告字节一致", rc2 == 0 and same, "rc=%d same=%s" % (rc2, same))
    finally:
        shutil.rmtree(base, ignore_errors=True)


def main():
    print("=" * 78)
    print("审计工具回归自测")
    print("=" * 78)
    test_r1()
    test_r2()
    test_r3()
    print("=" * 78)
    failed = [r for r in RESULTS if not r[2]]
    print("合计 %d 项，通过 %d，失败 %d" % (len(RESULTS), len(RESULTS) - len(failed), len(failed)))
    if failed:
        for g, n, _, d in failed:
            print("  FAIL [%s] %s %s" % (g, n, d))
        return 1
    print("全部通过")
    return 0


if __name__ == "__main__":
    sys.exit(main())

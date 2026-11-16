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


def _make_staging(parent, name, pages=2):
    """造一个合法的待发布结果目录（PIXEL_DIFF.md + diff/），模拟发布前状态。"""
    st = os.path.join(parent, name)
    os.makedirs(os.path.join(st, "diff"))
    for i in range(pages):
        _img(os.path.join(st, "diff", "diff_p%d.png" % i), (8, 8), "red")
    with io.open(os.path.join(st, "PIXEL_DIFF.md"), "w", encoding="utf-8", newline="\n") as f:
        f.write("# stub report\n")
    return st


def _mk(root, spec):
    """按 {相对路径: 内容} 造目录树；内容为 None 时写一张 8x8 PNG。"""
    os.makedirs(root, exist_ok=True)
    for rel, data in spec.items():
        full = os.path.join(root, rel.replace("/", os.sep))
        parent = os.path.dirname(full)
        if parent:
            os.makedirs(parent, exist_ok=True)
        if data is None:
            _img(full, (8, 8), "red")
        else:
            with open(full, "wb") as f:
                f.write(data)


@contextlib.contextmanager
def patched_rename(fn):
    """替换 os.rename，用于注入并发/失败，退出时恢复。"""
    real = os.rename
    os.rename = fn
    try:
        yield real
    finally:
        os.rename = real


def _staging_leftovers(directory):
    """同级目录内是否留下 .<name>.staging.* 暂存目录。"""
    return [n for n in os.listdir(directory) if ".staging." in n]


def test_r3():
    base = tempfile.mkdtemp(prefix="selftest_r3_")
    try:
        sq = (100, 100)
        full = os.path.join(base, "full")      # detail + home
        only_detail = os.path.join(base, "d")  # 只有 detail
        short = os.path.join(base, "short")    # detail + home(尺寸不同)
        extra = os.path.join(base, "extra")    # detail + home + index
        for d in (full, only_detail, short, extra):
            os.makedirs(d)
        _img(os.path.join(full, "detail.png"), sq)
        _img(os.path.join(full, "home.png"), sq)
        _img(os.path.join(only_detail, "detail.png"), sq)
        _img(os.path.join(short, "detail.png"), sq)
        _img(os.path.join(short, "home.png"), (100, 80))
        _img(os.path.join(extra, "detail.png"), sq)
        _img(os.path.join(extra, "home.png"), sq)
        _img(os.path.join(extra, "index.png"), sq)

        out = os.path.join(base, "out")  # 结果目录本身即原子发布单元，运行前不存在

        rc, log = _run_pd(full, only_detail, out)
        check("R3", "缺页 -> 退出 3", rc == 3, "rc=%d" % rc)
        check("R3", "缺页时报出页面名", "home.png" in log, "日志含 home.png")

        rc, log = _run_pd(only_detail, full, out)
        check("R3", "仅多页 -> 退出 3", rc == 3, "rc=%d" % rc)
        check("R3", "仅多页时报出页面名", "home.png" in log and "仅新版存在" in log, "日志含 home.png")

        rc, log = _run_pd(full, extra, out)
        check("R3", "缺页+多页 -> 退出 3", rc == 3, "rc=%d" % rc)

        # 失败路径绝不创建目标，也不留暂存目录
        check("R3", "集合不一致时目标未被创建", not os.path.exists(out),
              str(os.listdir(base)))

        rc, log = _run_pd(full, short, out)
        check("R3", "尺寸不符 -> 退出 4", rc == 4, "rc=%d" % rc)
        check("R3", "失败时未创建目标目录", not os.path.exists(out), str(os.listdir(base)))
        check("R3", "失败时无 .staging 残留", _staging_leftovers(base) == [],
              str(_staging_leftovers(base)))

        # 目标是「完整 bundle」且未加 --replace-dir -> 退出 6，整组不变
        diff_dir = os.path.join(out, "diff")
        os.makedirs(diff_dir, exist_ok=True)
        _img(os.path.join(diff_dir, "diff_detail.png"), (10, 10), "red")
        _img(os.path.join(diff_dir, "diff_home.png"), (10, 10), "blue")
        _img(os.path.join(diff_dir, "diff_old.png"), (10, 10), "green")
        with io.open(os.path.join(out, "PIXEL_DIFF.md"), "w", encoding="utf-8") as f:
            f.write("old report\n")
        before = _snapshot(out)

        rc, log = _run_pd(full, full, out)
        keeps = _snapshot(out)
        check("R3", "目标已存在 -> 默认退出 6", rc == 6, "rc=%d" % rc)
        check("R3", "默认拒绝时旧证据整组未被改动",
              set(keeps) == set(before) and all(keeps[k] == before[k] for k in before),
              "%d 个文件" % len(before))

        # R3-2：目录里只有报告、没有 diff/（报告目标已存在）—— 报告同样不得被覆盖
        rep_only = os.path.join(base, "rep_only")
        os.makedirs(rep_only)
        with io.open(os.path.join(rep_only, "PIXEL_DIFF.md"), "w", encoding="utf-8") as f:
            f.write("report without diff\n")
        rc, log = _run_pd(full, full, rep_only)
        with io.open(os.path.join(rep_only, "PIXEL_DIFF.md"), encoding="utf-8") as f:
            kept = f.read()
        check("R3", "R3-2 已有报告而缺 diff/ -> 退出 6", rc == 6, "rc=%d" % rc)
        check("R3", "R3-2 已有报告未被覆盖", kept == "report without diff\n", repr(kept))
        check("R3", "R3-2 报告目录内未混入差异图", sorted(os.listdir(rep_only)) == ["PIXEL_DIFF.md"],
              str(sorted(os.listdir(rep_only))))

        # 护栏：目标目录含非本工具内容时，即使 --replace-dir 也拒绝（防止整目录被搬走）
        foreign = os.path.join(base, "foreign")
        os.makedirs(foreign)
        _img(os.path.join(foreign, "v1.4.png"), (5, 5), "blue")
        with io.open(os.path.join(foreign, "CSS_VALUE_DIFF.md"), "w", encoding="utf-8") as f:
            f.write("不是本工具产物\n")
        fbefore = _snapshot(foreign)
        rc, log = _run_pd(full, full, foreign, replace=True)
        fafter = _snapshot(foreign)
        check("R3", "目标含额外内容 -> 即使 --replace-dir 也退出 6", rc == 6, "rc=%d" % rc)
        check("R3", "额外内容未被搬走", set(fbefore) == set(fafter) and fbefore == fafter,
              "%d 个文件" % len(fafter))

        # 显式 --replace-dir 才替换；成功后无 .prev 残留
        rc, log = _run_pd(full, full, out, replace=True)
        check("R3", "显式 --replace-dir -> 退出 0", rc == 0, "rc=%d" % rc)
        after_ok = _snapshot(out)
        check("R3", "成功时报告与图同批替换", after_ok != before and
              "PIXEL_DIFF.md" in after_ok and
              all(k.startswith("diff") for k in after_ok if k != "PIXEL_DIFF.md"),
              "%d 个文件" % len(after_ok))
        check("R3", "成功后无 .prev 残留",
              not any(".prev." in n for n in os.listdir(base)), str(os.listdir(base)))
        check("R3", "成功后无 .staging 残留", _staging_leftovers(base) == [],
              str(_staging_leftovers(base)))

        # 报告字节级可复现：两次独立运行（进程不同 -> 运行 ID 不同）产出完全相同
        out2 = os.path.join(base, "out2")
        rc2, _ = _run_pd(full, full, out2)
        p1 = os.path.join(out, "PIXEL_DIFF.md")
        p2 = os.path.join(out2, "PIXEL_DIFF.md")
        same = False
        if os.path.exists(p1) and os.path.exists(p2):
            with io.open(p1, "rb") as f1, io.open(p2, "rb") as f2:
                same = f1.read() == f2.read()
        check("R3", "两次独立运行报告字节一致", rc2 == 0 and same, "rc=%d same=%s" % (rc2, same))

        # ---------------- 进程内故障注入（评审列出的四类边界） ----------------
        pd = load("pixel_diff")

        # R3-1：目标在「发布那一次 rename」的瞬间被另一进程创建 -> 不得覆盖
        race_out = os.path.join(base, "race_out")
        race_st = _make_staging(base, "race_staging")
        race_err = [None]

        def race(src, dst):
            if os.path.abspath(dst) == os.path.abspath(race_out):
                os.makedirs(race_out, exist_ok=True)
                with io.open(os.path.join(race_out, "foreign.txt"), "w") as f:
                    f.write("other process")
            return real_rename(src, dst)

        with patched_rename(race) as real_rename:
            try:
                pd.publish_bundle(race_out, race_st, False)
            except pd.PublishError as exc:
                race_err[0] = exc
        check("R3", "R3-1 目标被并发抢占 -> PublishError（退出 6）",
              isinstance(race_err[0], pd.PublishError), "%r" % race_err[0])
        check("R3", "R3-1 抢占者内容未被覆盖",
              os.path.exists(os.path.join(race_out, "foreign.txt")), str(os.listdir(race_out)))
        check("R3", "R3-1 本次结果未丢（仍在 staging）",
              os.path.exists(os.path.join(race_st, "PIXEL_DIFF.md")))

        # R3-3：replace 路径第二次 rename 失败 -> 回滚，旧整组字节不变
        ok_out = os.path.join(base, "ok_out")
        ok_st = _make_staging(base, "ok_seed")
        os.rename(ok_st, ok_out)
        obefore = _snapshot(ok_out)
        st2 = _make_staging(base, "st2")
        seq = {"n": 0}

        def fail_second(src, dst):
            seq["n"] += 1
            if seq["n"] == 2:  # 1: out->prev   2: staging->out
                raise OSError("injected: publish rename failed")
            return real_rename(src, dst)

        err3 = [None]
        with patched_rename(fail_second) as real_rename:
            try:
                pd.publish_bundle(ok_out, st2, True)
            except pd.RollbackError as exc:
                err3[0] = exc
            except OSError as exc:
                err3[0] = exc
        oafter = _snapshot(ok_out)
        check("R3", "R3-3 第二次 rename 失败 -> 抛错且不返回成功",
              isinstance(err3[0], OSError) and not isinstance(err3[0], pd.RollbackError),
              "%r" % err3[0])
        check("R3", "R3-3 回滚后旧整组字节不变",
              set(obefore) == set(oafter) and all(obefore[k] == oafter[k] for k in obefore),
              "%d 个文件" % len(oafter))
        check("R3", "R3-3 回滚后无 .prev 残留",
              not os.path.exists(ok_out + ".prev.%d" % os.getpid()))
        check("R3", "R3-3 本次 staging 仍在（由调用方清理）",
              os.path.exists(os.path.join(st2, "PIXEL_DIFF.md")))

        # R3-4：回滚本身失败 -> RollbackError，旧证据保留在 prev，且消息给出恢复路径
        st3 = _make_staging(base, "st3")
        seq2 = {"n": 0}

        def fail_both(src, dst):
            seq2["n"] += 1
            if seq2["n"] >= 2:  # 2: staging->out   3: prev->out
                raise OSError("injected: fail #%d" % seq2["n"])
            return real_rename(src, dst)

        err4 = [None]
        with patched_rename(fail_both) as real_rename:
            try:
                pd.publish_bundle(ok_out, st3, True)
            except pd.RollbackError as exc:
                err4[0] = exc
        prev = ok_out + ".prev.%d" % os.getpid()
        check("R3", "R3-4 回滚失败 -> RollbackError", isinstance(err4[0], pd.RollbackError),
              "%r" % err4[0])
        check("R3", "R3-4 旧整组完好保留在 prev",
              _snapshot(prev) == obefore, "%d 个文件" % len(_snapshot(prev)))
        check("R3", "R3-4 错误消息给出 prev 路径",
              bool(err4[0]) and prev in str(err4[0]),
              (str(err4[0])[:50] if err4[0] else "无"))
        check("R3", "R3-4 回滚失败时目标未被误建", not os.path.exists(ok_out))
        os.rename(prev, ok_out)  # 手工恢复，避免影响后续用例

        # R3-5：整组一次 rename —— 目标只被 rename 一次，且不存在单文件提交点
        solo = os.path.join(base, "solo")
        st4 = _make_staging(base, "st4")
        cnt = {"n": 0}

        def count_ren(src, dst):
            cnt["n"] += 1
            return real_rename(src, dst)

        with patched_rename(count_ren) as real_rename:
            pd.publish_bundle(solo, st4, False)
        check("R3", "R3-5 目标只发生 1 次 rename", cnt["n"] == 1, "n=%d" % cnt["n"])
        check("R3", "R3-5 发布后报告与图同时就位",
              os.path.exists(os.path.join(solo, "PIXEL_DIFF.md")) and
              os.path.isdir(os.path.join(solo, "diff")), str(os.listdir(solo)))
        src_txt = io.open(os.path.join(HERE, "pixel_diff.py"), encoding="utf-8").read()
        check("R3", "R3-5 源码中已无单文件 os.replace 提交点", "os.replace(" not in src_txt,
              "仍存在 os.replace(" if "os.replace(" in src_txt else "未出现")

        # ---------------- 第二轮补测（评审要求四项） ----------------

        # R3-6：残缺包 + --replace-dir 必须仍被识别为非法旧包（不能只靠默认拒绝兜住）
        incomplete = [
            ("空目录", lambda d: os.makedirs(d)),
            ("只有报告、没有 diff/", lambda d: _mk(d, {"PIXEL_DIFF.md": b"# stub\n"})),
            ("只有 diff/、没有报告", lambda d: _mk(d, {"diff/diff_p0.png": None})),
            ("diff 是普通文件", lambda d: _mk(d, {"PIXEL_DIFF.md": b"# stub\n", "diff": b"x"})),
            ("报告是空文件", lambda d: _mk(d, {"PIXEL_DIFF.md": b"", "diff/diff_p0.png": None})),
            ("diff 内含非 png 条目", lambda d: _mk(d, {"PIXEL_DIFF.md": b"# stub\n",
                                                       "diff/other.txt": b"x"})),
        ]
        for idx, (label, build) in enumerate(incomplete):
            d = os.path.join(base, "bad_%d" % idx)
            build(d)
            snapshot = _snapshot(d)
            rc, log = _run_pd(full, full, d, replace=True)
            after = _snapshot(d)
            check("R3", "R3-6 残缺包(%s) + --replace-dir -> 退出 6" % label, rc == 6, "rc=%d" % rc)
            check("R3", "R3-6 残缺包(%s) 未被删除/改动" % label,
                  set(snapshot) == set(after) and snapshot == after,
                  "%d 个文件" % len(after))

        # R3-7：既有 .prev.<pid> 不得被自动删除（它可能是唯一的旧证据）
        pre_out = os.path.join(base, "pre_out")
        os.rename(_make_staging(base, "pre_seed"), pre_out)
        prev_dir = pre_out + ".prev.%d" % os.getpid()
        _mk(prev_dir, {"OLD_EVIDENCE.txt": b"only copy\n"})
        pre_before = _snapshot(pre_out)
        prev_before = _snapshot(prev_dir)
        st_pre = _make_staging(base, "pre_new")
        # 进程内调用：`.prev.<pid>` 用的是当前进程 PID，CLI 子进程 PID 不同
        err7 = [None]
        try:
            pd.publish_bundle(pre_out, st_pre, True)
        except pd.PublishError as exc:
            err7[0] = exc
        rc, log = (6 if isinstance(err7[0], pd.PublishError) else 0), str(err7[0])
        check("R3", "R3-7 既有 .prev -> 退出 6", rc == 6, "rc=%d" % rc)
        check("R3", "R3-7 既有 .prev 未被删除", _snapshot(prev_dir) == prev_before,
              "%d 个文件" % len(_snapshot(prev_dir)))
        check("R3", "R3-7 旧包未被改动", _snapshot(pre_out) == pre_before)
        check("R3", "R3-7 提示里给出 .prev 路径", prev_dir in log, "日志含 prev 路径")
        shutil.rmtree(prev_dir, ignore_errors=True)

        # R3-8：--replace-dir 过程中目标被其他进程调换 —— 不得删除未验证的目录
        swap_out = os.path.join(base, "swap_out")
        os.rename(_make_staging(base, "swap_seed"), swap_out)
        st_swap = _make_staging(base, "swap_new")
        hijacked = os.path.join(base, "hijacked_away")

        def swap_target(src, dst):
            if dst.endswith(".prev.%d" % os.getpid()):
                # 「检查之后、rename 之前」把 out_dir 换成另一个目录
                os.rename(swap_out, hijacked)
                _mk(swap_out, {"IMPOSTOR.txt": b"not ours\n"})
            return real_rename(src, dst)

        err8 = [None]
        with patched_rename(swap_target) as real_rename:
            try:
                pd.publish_bundle(swap_out, st_swap, True)
            except pd.PublishError as exc:
                err8[0] = exc
        check("R3", "R3-8 替换时目标被调换 -> PublishError（退出 6）",
              isinstance(err8[0], pd.PublishError), "%r" % err8[0])
        check("R3", "R3-8 冒名目录已放回原位，未被删除",
              os.path.exists(os.path.join(swap_out, "IMPOSTOR.txt")), str(os.listdir(swap_out)))
        check("R3", "R3-8 原旧包未被删除（仍在被调换处）", os.path.isdir(hijacked))
        check("R3", "R3-8 未留下 .prev", not os.path.exists(swap_out + ".prev.%d" % os.getpid()))

        # R3-9：回滚时目标又被其他进程抢占 -> RollbackError，旧证据留在 prev
        rb_out = os.path.join(base, "rb_out")
        os.rename(_make_staging(base, "rb_seed"), rb_out)
        rb_before = _snapshot(rb_out)
        st_rb = _make_staging(base, "rb_new")
        seq3 = {"n": 0}

        def fail_then_occupy(src, dst):
            seq3["n"] += 1
            if seq3["n"] == 2:  # staging -> out 失败
                raise OSError("injected: install failed")
            if seq3["n"] == 3:  # 回滚 prev -> out 之前，目标被占
                _mk(rb_out, {"OTHER.txt": b"taken\n"})
            return real_rename(src, dst)

        err9 = [None]
        with patched_rename(fail_then_occupy) as real_rename:
            try:
                pd.publish_bundle(rb_out, st_rb, True)
            except pd.RollbackError as exc:
                err9[0] = exc
        rb_prev = rb_out + ".prev.%d" % os.getpid()
        check("R3", "R3-9 回滚时目标被抢占 -> RollbackError",
              isinstance(err9[0], pd.RollbackError), "%r" % err9[0])
        check("R3", "R3-9 旧包完好保留在 prev", _snapshot(rb_prev) == rb_before,
              "%d 个文件" % len(_snapshot(rb_prev)))
        check("R3", "R3-9 抢占者内容未被删除",
              os.path.exists(os.path.join(rb_out, "OTHER.txt")), str(os.listdir(rb_out)))
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

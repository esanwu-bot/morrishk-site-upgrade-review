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


def _jpeg_bytes(size=(8, 8)):
    """一张真实 JPEG 的字节（用于「扩展名是 .png、内容其实是 JPEG」的负向用例）。"""
    buf = io.BytesIO()
    Image.new("RGB", size, "red").save(buf, format="JPEG")
    return buf.getvalue()


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


@contextlib.contextmanager
def patched_mkdir(fn):
    """替换 os.mkdir，用于在「目录刚建好」这个瞬间注入第三方动作。"""
    real = os.mkdir
    os.mkdir = fn
    try:
        yield real
    finally:
        os.mkdir = real


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

        # 显式 --replace-dir 才替换；成功后旧包**保留**在 .prev/bundle（本工具不删证据）
        rc, log = _run_pd(full, full, out, replace=True)
        check("R3", "显式 --replace-dir -> 退出 0", rc == 0, "rc=%d" % rc)
        after_ok = _snapshot(out)
        check("R3", "成功时报告与图同批替换", after_ok != before and
              "PIXEL_DIFF.md" in after_ok and
              all(k.startswith("diff") for k in after_ok if k != "PIXEL_DIFF.md"),
              "%d 个文件" % len(after_ok))
        out_box = out + ".prev"           # 容器（本工具用 os.mkdir 独占创建）
        out_prev = os.path.join(out_box, "bundle")  # 旧包本体
        check("R3", "成功后旧包保留在 .prev/bundle", os.path.isdir(out_prev),
              str(os.listdir(base)))
        check("R3", "保留的旧包即原旧包（字节一致）", _snapshot(out_prev) == before,
              "%d 个文件" % len(_snapshot(out_prev)))
        check("R3", "NOTICE 把旧包路径指到 .prev/bundle（不是容器）",
              out_prev in log, (log.strip().splitlines()[-1][:70] if log.strip() else "无输出"))
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
              not os.path.exists(ok_out + ".prev"))
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
        prev = os.path.join(ok_out + ".prev", "bundle")
        check("R3", "R3-4 回滚失败 -> RollbackError", isinstance(err4[0], pd.RollbackError),
              "%r" % err4[0])
        check("R3", "R3-4 旧整组完好保留在 prev/bundle",
              _snapshot(prev) == obefore, "%d 个文件" % len(_snapshot(prev)))
        check("R3", "R3-4 错误消息给出 prev 路径",
              bool(err4[0]) and prev in str(err4[0]),
              (str(err4[0])[:60] if err4[0] else "无"))
        check("R3", "R3-4 回滚失败时目标未被误建", not os.path.exists(ok_out))
        os.rename(prev, ok_out)  # 手工恢复，避免影响后续用例
        os.rmdir(ok_out + ".prev")  # 容器已空

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
            ("JPEG 冒充 .png", lambda d: _mk(d, {"PIXEL_DIFF.md": b"# stub\n",
                                                "diff/diff_p0.png": _jpeg_bytes()})),
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

        # R3-7：既有 .prev 不得被覆盖/删除（它可能是唯一的旧证据）
        pre_out = os.path.join(base, "pre_out")
        os.rename(_make_staging(base, "pre_seed"), pre_out)
        prev_dir = pre_out + ".prev"
        _mk(prev_dir, {"OLD_EVIDENCE.txt": b"only copy\n"})
        pre_before = _snapshot(pre_out)
        prev_before = _snapshot(prev_dir)
        st_pre = _make_staging(base, "pre_new")
        # 进程内调用：直接验证 publish_bundle 的前置检查
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
        swap_before = _snapshot(swap_out)
        st_swap = _make_staging(base, "swap_new")
        hijacked = os.path.join(base, "hijacked_away")

        def swap_target(src, dst):
            if os.path.basename(dst) == "bundle":
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
        check("R3", "R3-8 冒名目录已放回原位，内容逐字节未变",
              _snapshot(swap_out) == {"IMPOSTOR.txt": b"not ours\n"},
              "%d 个文件" % len(_snapshot(swap_out)))
        check("R3", "R3-8 原旧包字节未变（仍在被调换处）",
              _snapshot(hijacked) == swap_before, "%d 个文件" % len(_snapshot(hijacked)))
        check("R3", "R3-8 未留下 .prev", not os.path.exists(swap_out + ".prev"))

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
        rb_prev = os.path.join(rb_out + ".prev", "bundle")
        check("R3", "R3-9 回滚时目标被抢占 -> RollbackError",
              isinstance(err9[0], pd.RollbackError), "%r" % err9[0])
        check("R3", "R3-9 旧包完好保留在 prev/bundle", _snapshot(rb_prev) == rb_before,
              "%d 个文件" % len(_snapshot(rb_prev)))
        check("R3", "R3-9 抢占者内容未被删除",
              os.path.exists(os.path.join(rb_out, "OTHER.txt")), str(os.listdir(rb_out)))

        # R3-10：旧包不再被自动删除 —— 成功后原样保留，且本进程从不 rmtree(prev)
        keep_out = os.path.join(base, "keep_out")
        os.rename(_make_staging(base, "keep_seed"), keep_out)
        keep_before = _snapshot(keep_out)
        st_keep = _make_staging(base, "keep_new")
        removed = []
        real_rmtree = shutil.rmtree

        def spy_rmtree(path, *a, **kw):
            removed.append(os.path.abspath(path))
            return real_rmtree(path, *a, **kw)

        shutil.rmtree = spy_rmtree
        try:
            ret = pd.publish_bundle(keep_out, st_keep, True)
        finally:
            shutil.rmtree = real_rmtree
        keep_box = keep_out + ".prev"
        keep_prev = os.path.join(keep_box, "bundle")
        check("R3", "R3-10 返回值指向旧包本体 .prev/bundle",
              isinstance(ret, tuple) and ret[1] == keep_prev, "%r" % (ret,))
        check("R3", "R3-10 成功后旧包原样保留在 .prev/bundle",
              _snapshot(keep_prev) == keep_before, "%d 个文件" % len(_snapshot(keep_prev)))
        check("R3", "R3-10 本进程从未 rmtree(容器/.prev/bundle)",
              os.path.abspath(keep_box) not in removed and
              os.path.abspath(keep_prev) not in removed, str(removed))
        check("R3", "R3-10 新包已就位且通过完整校验",
              pd.bundle_problem(keep_out) is None, str(pd.bundle_problem(keep_out)))

        # R3-11：.prev 未清理时再次替换 -> 拒绝，目标与 .prev 都不变
        target_before = _snapshot(keep_out)
        st_keep2 = _make_staging(base, "keep_new2")
        err11 = [None]
        try:
            pd.publish_bundle(keep_out, st_keep2, True)
        except pd.PublishError as exc:
            err11[0] = exc
        check("R3", "R3-11 .prev 未清理 -> PublishError（退出 6）",
              isinstance(err11[0], pd.PublishError), "%r" % err11[0])
        check("R3", "R3-11 .prev 未被覆盖/删除", _snapshot(keep_prev) == keep_before)
        check("R3", "R3-11 当前结果包未被改动", _snapshot(keep_out) == target_before)

        # R3-12：新包就位后、第三方把 .prev 换成冒名目录 —— 本工具不删除也不改动它
        swamp = os.path.join(base, "swamp")
        os.rename(_make_staging(base, "swamp_seed"), swamp)
        swamp_seed_before = _snapshot(swamp)
        st_swamp = _make_staging(base, "swamp_new")
        swamp_prev = swamp + ".prev"

        def swap_after_install(src, dst):
            r = real_rename(src, dst)
            if os.path.abspath(dst) == os.path.abspath(swamp):
                os.rename(swamp_prev, swamp_prev + ".hijacked")
                _mk(swamp_prev, {"IMPOSTOR2.txt": b"impostor\n"})
            return r

        with patched_rename(swap_after_install) as real_rename:
            pd.publish_bundle(swamp, st_swamp, True)
        check("R3", "R3-12 第三方替换 .prev 后，冒名目录未被删除",
              _snapshot(swamp_prev) == {"IMPOSTOR2.txt": b"impostor\n"},
              "%d 个文件" % len(_snapshot(swamp_prev)))
        check("R3", "R3-12 原旧包仍在第三方改名处且字节未变",
              _snapshot(os.path.join(swamp_prev + ".hijacked", "bundle")) == swamp_seed_before,
              "%d 个文件" % len(_snapshot(os.path.join(swamp_prev + ".hijacked", "bundle"))))
        check("R3", "R3-12 新包已就位",
              pd.bundle_problem(swamp) is None, str(pd.bundle_problem(swamp)))

        # ---------------- 第五轮定向故障注入：out -> prev 的独占占位 ----------------

        # R3-13：`<out>.prev` 被并发抢占成**空目录**。
        # 旧实现是「lexists(prev) 预检查 → rename(out, prev)」，两步之间不原子；
        # POSIX 下 rename(dir, 已存在的空目录) 会成功，等于覆盖对方刚建的空目录。
        # 现在的实现靠 os.mkdir(prev) 独占占位，对方先建成空目录同样被拒绝。
        occ_out = os.path.join(base, "occ_out")
        os.rename(_make_staging(base, "occ_seed"), occ_out)
        occ_before = _snapshot(occ_out)
        occ_box = occ_out + ".prev"
        os.makedirs(occ_box)  # 第三方抢先建成**空**目录
        st_occ = _make_staging(base, "occ_new")
        renamed_to = []

        def watch_rename(src, dst):
            renamed_to.append(os.path.abspath(dst))
            return real_rename(src, dst)

        err13 = [None]
        with patched_rename(watch_rename) as real_rename:
            try:
                pd.publish_bundle(occ_out, st_occ, True)
            except pd.PublishError as exc:
                err13[0] = exc
        check("R3", "R3-13 空 .prev 被并发抢占 -> PublishError（退出 6）",
              isinstance(err13[0], pd.PublishError), "%r" % err13[0])
        check("R3", "R3-13 对方空 .prev 仍在且仍为空（未被覆盖、未被删除）",
              os.path.isdir(occ_box) and os.listdir(occ_box) == [],
              str(os.listdir(occ_box)) if os.path.isdir(occ_box) else "目录已消失")
        check("R3", "R3-13 未对 .prev 发起任何 rename（占位不靠 rename 完成）",
              os.path.abspath(occ_box) not in renamed_to, str(renamed_to))
        check("R3", "R3-13 旧包未被改动", _snapshot(occ_out) == occ_before,
              "%d 个文件" % len(_snapshot(occ_out)))
        check("R3", "R3-13 本次 staging 未丢（仍可由调用方清理）",
              os.path.exists(os.path.join(st_occ, "PIXEL_DIFF.md")))

        # 源码级锁定：占位必须是 os.mkdir，不得退回「先 lexists 再 rename」
        src_pub = io.open(os.path.join(HERE, "pixel_diff.py"), encoding="utf-8").read()
        pub_start = src_pub.index("def publish_bundle(")
        pub_end = src_pub.index("\ndef main(", pub_start)
        pub_body = src_pub[pub_start:pub_end]
        check("R3", "R3-13 源码用 os.mkdir(prev) 独占占位",
              "os.mkdir(prev)" in pub_body,
              "出现 %d 次" % pub_body.count("os.mkdir(prev)"))
        check("R3", "R3-13 源码已无 lexists(prev) 预检查",
              "lexists(prev)" not in pub_body,
              "出现 %d 次" % pub_body.count("lexists(prev)"))

        # R3-14：mkdir 独占占位之后、旧包 rename 之前，容器内被塞入**非空** bundle。
        # 目标已存在且非空 -> POSIX ENOTEMPTY / Windows OSError，两平台一致失败，
        # 因此不会被「rename 到空目录也成功」这条边界掩盖。
        sat_out = os.path.join(base, "sat_out")
        os.rename(_make_staging(base, "sat_seed"), sat_out)
        sat_before = _snapshot(sat_out)
        sat_box = sat_out + ".prev"
        sat_intruder = os.path.join(sat_box, "bundle")
        st_sat = _make_staging(base, "sat_new")
        injected = {"done": False}

        def inject_intruder(src, dst):
            if not injected["done"] and os.path.basename(dst) == "bundle":
                injected["done"] = True
                _mk(sat_intruder, {"INTRUDER.txt": b"someone else\n"})
            return real_rename(src, dst)

        err14 = [None]
        with patched_rename(inject_intruder) as real_rename:
            try:
                pd.publish_bundle(sat_out, st_sat, True)
            except pd.PublishError as exc:
                err14[0] = exc
        check("R3", "R3-14 容器内 bundle 被抢占 -> PublishError（退出 6）",
              isinstance(err14[0], pd.PublishError), "%r" % err14[0])
        check("R3", "R3-14 第三方 bundle 内容未被覆盖",
              _snapshot(sat_intruder) == {"INTRUDER.txt": b"someone else\n"},
              "%d 个文件" % len(_snapshot(sat_intruder)))
        check("R3", "R3-14 旧包未被改动（仍在 out）", _snapshot(sat_out) == sat_before,
              "%d 个文件" % len(_snapshot(sat_out)))
        check("R3", "R3-14 非空容器未被 rmdir 误删",
              os.path.isdir(sat_box), "容器已消失" if not os.path.isdir(sat_box) else "仍在")

        # R3-15（评审要求）：容器建好之后、旧包移动之前，第三方在容器内抢先建一个
        # **空** bundle。这是顶层 .prev 竞态的下沉版本，两条平台分支都要拒绝：
        #   POSIX  → 随后的 os.mkdir(prev_bundle) 得到 FileExistsError；
        #   Windows→ 随后的 os.rename 对已存在目标（含空目录）一律失败。
        # 判据不是「走了哪条分支」，而是「对方那个空目录既没被覆盖、也没被删除」。
        eb_out = os.path.join(base, "eb_out")
        os.rename(_make_staging(base, "eb_seed"), eb_out)
        eb_before = _snapshot(eb_out)
        eb_box = eb_out + ".prev"
        eb_intruder = os.path.join(eb_box, "bundle")
        st_eb = _make_staging(base, "eb_new")
        box_seen = {"done": False}

        def inject_empty_bundle(path, *a, **kw):
            r = real_mkdir(path, *a, **kw)
            if (not box_seen["done"]
                    and os.path.abspath(str(path)) == os.path.abspath(eb_box)):
                box_seen["done"] = True
                real_mkdir(eb_intruder)  # 第三方在建好的容器内抢建**空**目录
            return r

        err15 = [None]
        with patched_mkdir(inject_empty_bundle) as real_mkdir:
            try:
                pd.publish_bundle(eb_out, st_eb, True)
            except pd.PublishError as exc:
                err15[0] = exc
        check("R3", "R3-15 空的 prev/bundle 被并发抢占 -> PublishError（退出 6）",
              isinstance(err15[0], pd.PublishError), "%r" % err15[0])
        check("R3", "R3-15 对方空 bundle 仍在且仍为空（未被覆盖、未被删除）",
              os.path.isdir(eb_intruder) and os.listdir(eb_intruder) == [],
              str(os.listdir(eb_intruder)) if os.path.isdir(eb_intruder) else "目录已消失")
        check("R3", "R3-15 旧包未被改动（仍在 out）", _snapshot(eb_out) == eb_before,
              "%d 个文件" % len(_snapshot(eb_out)))
        check("R3", "R3-15 本次 staging 未丢", os.path.exists(os.path.join(st_eb, "PIXEL_DIFF.md")))
        check("R3", "R3-15 注入确实触发了（用例不是空转）", box_seen["done"] is True,
              "box_seen=%r" % (box_seen,))

        # R3-16：强制走 **POSIX 分支**（mkdir 占位），证明「对方已有空 bundle -> 拒绝」
        # 的判据发生在 rename **之前**，因此不依赖 POSIX rename 的内核语义。
        # 诚实边界：本机是 Windows，无法实测「POSIX rename 覆盖空目录」这一内核行为；
        # 本用例证明的是控制流——被拒绝的理由来自 os.mkdir 的原子性（FileExistsError），
        # 而不是 rename 是否覆盖。断言里显式检查「没有对 prev/bundle 发起 rename」。
        px_out = os.path.join(base, "px_out")
        os.rename(_make_staging(base, "px_seed"), px_out)
        px_before = _snapshot(px_out)
        px_box = px_out + ".prev"
        px_intruder = os.path.join(px_box, "bundle")
        st_px = _make_staging(base, "px_new")
        px_seen = {"done": False}
        px_renames = []
        orig_need = pd._needs_mkdir_placeholder

        def px_inject(path, *a, **kw):
            r = real_mkdir(path, *a, **kw)
            if (not px_seen["done"]
                    and os.path.abspath(str(path)) == os.path.abspath(px_box)):
                px_seen["done"] = True
                real_mkdir(px_intruder)
            return r

        def px_watch_rename(src, dst):
            px_renames.append(os.path.abspath(str(dst)))
            return real_px_rename(src, dst)

        pd._needs_mkdir_placeholder = lambda: True   # 强制 POSIX 分支
        err16 = [None]
        try:
            with patched_mkdir(px_inject) as real_mkdir:
                with patched_rename(px_watch_rename) as real_px_rename:
                    try:
                        pd.publish_bundle(px_out, st_px, True)
                    except pd.PublishError as exc:
                        err16[0] = exc
        finally:
            pd._needs_mkdir_placeholder = orig_need
        check("R3", "R3-16 POSIX 分支：空 bundle 抢占 -> PublishError",
              isinstance(err16[0], pd.PublishError), "%r" % err16[0])
        check("R3", "R3-16 拒绝发生在 rename 之前（未对 prev/bundle 发起 rename）",
              os.path.abspath(px_intruder) not in px_renames, str(px_renames))
        check("R3", "R3-16 对方空 bundle 仍在且仍为空",
              os.path.isdir(px_intruder) and os.listdir(px_intruder) == [],
              str(os.listdir(px_intruder)) if os.path.isdir(px_intruder) else "目录已消失")
        check("R3", "R3-16 旧包未被改动", _snapshot(px_out) == px_before,
              "%d 个文件" % len(_snapshot(px_out)))
        check("R3", "R3-16 注入确实触发了", px_seen["done"] is True, "px_seen=%r" % (px_seen,))

        # R3-17：容器在 mkdir 之后被第三方**改名调换**——此时 `prev/bundle` 内部路径
        # 会解析到另一个容器。这是「容器本身没有在移动旧包前验证身份」那条威胁面。
        # 处置不是「rename 前再 lstat 一次」（同一个 TOCTOU），而是**移走后三重复核**：
        # 容器身份不符 -> 把旧包改回原位并拒绝，且**不删除**那个不是自己建的容器。
        hj_out = os.path.join(base, "hj_out")
        os.rename(_make_staging(base, "hj_seed"), hj_out)
        hj_before = _snapshot(hj_out)
        hj_box = hj_out + ".prev"
        hj_moved = hj_box + ".hijacked"
        hj_seen = {"done": False}
        orig_ident = pd._ident

        def ident_hook(path):
            """在「容器身份被读走之后」立刻调换容器——这才是可被复核抓住的窗口。

            注入放在 mkdir 返回处是不对的：那时 `box_ident` 还没被读取，本进程会
            直接读到第三方新容器的身份，之后无从判断，也不该判为缺陷（无从知晓）。
            """
            r = orig_ident(path)
            if (not hj_seen["done"]
                    and os.path.abspath(str(path)) == os.path.abspath(hj_box)):
                hj_seen["done"] = True
                os.rename(hj_box, hj_moved)   # 第三方把本进程的容器整体移走
                os.mkdir(hj_box)              # 并在同路径建一个自己的
            return r

        st_hj = _make_staging(base, "hj_new")
        err17 = [None]
        pd._ident = ident_hook
        try:
            pd.publish_bundle(hj_out, st_hj, True)
        except pd.PublishError as exc:
            err17[0] = exc
        finally:
            pd._ident = orig_ident
        check("R3", "R3-17 容器被改名调换 -> PublishError（退出 6）",
              isinstance(err17[0], pd.PublishError), "%r" % err17[0])
        check("R3", "R3-17 错误消息指明是保留目录被调换",
              bool(err17[0]) and "旧包保留目录" in str(err17[0]),
              (str(err17[0])[:60] if err17[0] else "无"))
        check("R3", "R3-17 旧包已放回原位且逐字节未变", _snapshot(hj_out) == hj_before,
              "%d 个文件" % len(_snapshot(hj_out)))
        check("R3", "R3-17 第三方容器未被删除（身份不符则不删）",
              os.path.isdir(hj_box), "容器已消失" if not os.path.isdir(hj_box) else "仍在")
        check("R3", "R3-17 本进程被移走的容器仍在第三方改名处",
              os.path.isdir(hj_moved), "已消失" if not os.path.isdir(hj_moved) else "仍在")
        check("R3", "R3-17 注入确实触发了", hj_seen["done"] is True, "hj_seen=%r" % (hj_seen,))
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

# -*- coding: utf-8 -*-
"""
同视口像素差分（v1.4 → v1.5.1 视觉回归证据）

用法：

    python tools/pixel_diff.py \
        --a 07_prototypes/reference/prototype_shots/v1.4 \
        --b 07_prototypes/reference/prototype_shots/v1.5.1 \
        --out 07_prototypes/reference/prototype_shots/pixel_diff

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

发布模型（**一个目录 = 一个原子发布单元**）：
  1. `--out` 是本次 run 独占的结果目录，内含 `PIXEL_DIFF.md` 与 `diff/`。
     二者同属一个目录，因此**不存在**「图已发布、报告还是旧的」这种中间态。
  2. 每次运行先在同级目录建 `.out.staging.<时间戳>-<pid>/`，差分、写报告、
     校验（每张图存在/非空/可解码 + 报告非空）全部做完，才进入发布。
  3. 发布 = **对目标目录做一次 rename**。目标不存在时这一次 rename 既完成
     发布、又充当存在性检查，没有「先 check 再 rename」的竞态窗口：
     目标若被其他进程抢先建成**非空目录**，rename 直接失败（POSIX ENOTEMPTY /
     Windows OSError），本次结果不发布、退出 6，不覆盖对方内容。
     **已知边界**：若对方抢先建成的是**空目录**，POSIX 允许 rename 覆盖空目录，
     此时该空目录会被替换（里面没有任何内容，不构成证据丢失）；Windows 上
     rename 到已存在目录一律失败。要做到「连空目录也不替换」需要
     `renameat2(RENAME_NOREPLACE)`，仅 Linux 可用，本项目在 Windows 上开发与
     复现，不引入平台分支，故保留此已披露边界。
  4. 目标已存在时，先做**完整性校验**（`bundle_problem()`）：必须是「PIXEL_DIFF.md
     为普通文件且非空 + diff/ 为真实目录且非空 + diff/ 下全是**真 PNG**（解码格式
     必须是 PNG，不能只凭扩展名）的 diff_*.png + 无第三条目」。空目录、只有报告、
     只有图、`diff` 是普通文件、报告为空、JPEG 冒充 .png、diff 里有杂项，
     一律拒绝（退出 6）——校验不通过就不该被任何后续动作「处理」。
  5. 校验通过后默认仍拒绝并退出 6；加 `--replace-dir` 才替换。替换路径：
       a. **用 `os.mkdir(<out>.prev)` 独占占位**（POSIX 与 Windows 上都是原子的
          「不存在才创建」），失败即说明该路径已被占用 → 拒绝，不覆盖、不删除。
          这一步刻意不用「先 `lexists` 再 `rename`」：那种写法在 POSIX 下
          `rename(dir, 已存在的空目录)` 会成功，等于覆盖对方刚建的空目录；
       b. 旧包整组 rename 到容器内的 `<out>.prev/bundle`（该子路径刚随容器一起
          被本进程占用，因此不存在覆盖对象）；
       c. 移走后**复核身份**：设备号 + inode 必须与校验时一致，且要再过一次
          `bundle_problem()`。若在「校验」与「rename」之间被其他进程调换，
          就把它改名回原位并拒绝；
       d. 新目录 rename 就位；
       e. **本工具不删除旧包**：成功后 `<out>.prev/bundle` 原样保留，
          由人确认后自行清理。理由见下。
  6. **为什么旧包不做自动删除**：`bundle_problem()` 与删除之间，`prev` 路径对应的
     对象可以被其他进程改名、替换，甚至目录内文件被改写；`st_dev + st_ino` 只能
     证明目录身份，证明不了内容在验证后未变，也防不住「检查之后、删除之前」的调换。
     在删除前再加一次 lstat / 校验，仍然是同一个 TOCTOU 结构。
     因此本工具**放弃删除权**：它只把旧包停在 `<out>.prev/bundle`，是否丢弃由人决定。
     这样「删除只作用于被验证过的目录」不再是承诺，而是**没有删除旧包的动作**。
  7. 本工具仍会删除两类目录，均不承载历史证据：
       (a) 本次运行的 staging 目录（名字唯一、本次自建）；
       (b) 失败回滚后**自己刚建、且已空**的 `<out>.prev` 容器（用 `os.rmdir`，
           非空则失败，不会误删）。成功路径不删除任何目录。
  8. 两条 rename 路径的并发边界不同，不要混用：
       - 发布到 `<out>`：靠「目标不存在时 rename 即检查」，目标被并发建成**空目录**
         时 POSIX 允许覆盖（无内容可丢），Windows 上失败；
       - 停放到 `<out>.prev`：靠 `os.mkdir` 独占占位，**空目录也不会被覆盖**。

退出码：
  0 = 集合一致、尺寸一致、全部页面完成差分、发布成功
  2 = 目录缺失或目录内没有 PNG，或 --out 无父目录
  3 = 两版页面集合不一致（缺页 / 多页）
  4 = 尺寸不一致或单页差分失败（此时不发布）
  5 = 完成页数少于页面集合（此时不发布）
  6 = 发布前置条件不满足：目标已存在且未加 --replace-dir / 目标不是完整有效的本工具结果包 /
      `<out>.prev` 已被占用（含并发抢占）/ 发布瞬间被其他进程抢占 / 替换过程中目标被调换
  7 = 产物校验失败、发布失败已回滚、或回滚本身失败（消息会给出 prev 目录路径）
"""
from __future__ import annotations

import argparse
import io
import os
import shutil
import stat
import sys
import time

from PIL import Image, ImageChops

VISIBLE_DELTA = 24

# 结果目录（bundle）允许出现的条目：本工具只拥有这两项。
BUNDLE_ENTRIES = {"diff", "PIXEL_DIFF.md"}


class PublishError(Exception):
    """发布阶段的预期失败（目标已存在、目标不是本工具产物、校验不通过等）。退出码 6。"""


class RollbackError(Exception):
    """发布失败且回滚也失败：旧整组证据仍完整保留在 prev 目录，需人工改名恢复。退出码 7。"""



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
# 发布：一个目录 = 一个原子单元，整组一次 rename
# --------------------------------------------------------------------------

def verify_bundle(staging_dir, names):
    """发布前校验整组产物：每张差异图存在、非空、可解码；报告非空。"""
    diff_dir = os.path.join(staging_dir, "diff")
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
            with Image.open(p) as im:
                if im.format != "PNG":
                    problems.append("%s 实际格式是 %s，不是 PNG" % (p, im.format))
                    continue
                im.verify()
        except Exception as exc:
            problems.append("无法解码 %s: %s" % (p, exc))
    md = os.path.join(staging_dir, "PIXEL_DIFF.md")
    if not os.path.exists(md) or os.path.getsize(md) == 0:
        problems.append("报告缺失或为空: %s" % md)
    if problems:
        raise PublishError("产物校验失败：" + "；".join(problems))


def bundle_problem(path):
    """判断 path 是否是一个**完整、类型正确**的本工具结果包。

    返回问题描述字符串；返回 None 表示通过。这里刻意不是「条目名在白名单内」，
    而是逐项验证存在性、类型（真实目录/普通文件，不跟随符号链接）、非空、
    **真实图像格式**（`Image.format == "PNG"`，扩展名不算证据）：

      <bundle>/PIXEL_DIFF.md   必须是普通文件且非空
      <bundle>/diff/           必须是真实目录（非符号链接）且非空
      <bundle>/diff/*.png      必须全部是普通文件、命名 diff_*.png、非空、解码格式确为 PNG
      <bundle>/                除上述两项外不得有第三条目

    为什么必须这么严：加上 `--replace-dir` 后，校验结论会被当作「处理该目录的依据」。
    若只检查「没有多余条目」，那么空目录、只有报告没有图、只有图没有报告、
    `diff` 是个普通文件、以及 JPEG 改名成 .png 的伪装文件，都会被当成合法旧包。
    """
    try:
        st = os.lstat(path)
    except OSError as exc:
        return "无法读取目标：%s" % exc
    if stat.S_ISLNK(st.st_mode):
        return "目标是符号链接，拒绝（不跟随链接）"
    if not stat.S_ISDIR(st.st_mode):
        return "目标不是目录"

    entries = set(os.listdir(path))
    missing = BUNDLE_ENTRIES - entries
    extra = entries - BUNDLE_ENTRIES
    if missing:
        return "缺少必需条目：%s" % "、".join(sorted(missing))
    if extra:
        return "含本工具产物以外的条目：%s" % "、".join(sorted(extra))

    md = os.path.join(path, "PIXEL_DIFF.md")
    try:
        mst = os.lstat(md)
    except OSError as exc:
        return "无法读取 PIXEL_DIFF.md：%s" % exc
    if not stat.S_ISREG(mst.st_mode):
        return "PIXEL_DIFF.md 不是普通文件"
    if mst.st_size == 0:
        return "PIXEL_DIFF.md 为空"

    diff_dir = os.path.join(path, "diff")
    try:
        dst = os.lstat(diff_dir)
    except OSError as exc:
        return "无法读取 diff/：%s" % exc
    if stat.S_ISLNK(dst.st_mode) or not stat.S_ISDIR(dst.st_mode):
        return "diff 不是真实目录"
    names = sorted(os.listdir(diff_dir))
    if not names:
        return "diff/ 为空"
    for n in names:
        p = os.path.join(diff_dir, n)
        try:
            est = os.lstat(p)
        except OSError as exc:
            return "无法读取 diff/%s：%s" % (n, exc)
        if stat.S_ISLNK(est.st_mode) or not stat.S_ISREG(est.st_mode):
            return "diff/%s 不是普通文件" % n
        if not n.startswith("diff_") or not n.lower().endswith(".png"):
            return "diff/%s 命名不符合 diff_*.png" % n
        if est.st_size == 0:
            return "diff/%s 为空" % n
        try:
            with Image.open(p) as im:
                if im.format != "PNG":
                    return "diff/%s 实际格式是 %s，不是 PNG" % (n, im.format)
                im.verify()
        except Exception as exc:
            return "diff/%s 无法解码：%s" % (n, exc)
    return None


def _ident(path):
    """目录身份（设备号 + inode / 文件索引），用于判断「移走的确实是刚验证过的那个」。"""
    st = os.lstat(path)
    return (st.st_dev, st.st_ino)


def _rmtree(path):
    shutil.rmtree(path, ignore_errors=True)


def _rmdir_quiet(path):
    """只删「空目录」。非空时 OSError 被吞掉——用于清理本进程刚建、尚未放入内容的容器，
    因此不存在误删证据的可能（非空则删不掉）。"""
    try:
        os.rmdir(path)
    except OSError:
        pass


def _restore(prev, out_dir):
    """把移开的旧目录改回原位；自身失败时抛 RollbackError 并保留 prev。"""
    try:
        os.rename(prev, out_dir)
    except OSError as exc:
        raise RollbackError(
            "发布失败，且把旧目录改回原位也失败。\n"
            "  旧整组证据仍完整保留在：%s\n"
            "  恢复命令：mv \"%s\" \"%s\"\n"
            "  （本次新结果已丢弃，不会覆盖该目录）" % (prev, prev, out_dir)) from exc


def publish_bundle(out_dir, staging_dir, replace_dir):
    """把整个 staging 目录作为一个原子单元发布到 out_dir。

    原子单元是**目录**而不是目录里的文件：`PIXEL_DIFF.md` 与 `diff/` 在同一个
    目录里，一次 rename 同时就位，因此没有「图已发布、报告仍是旧版」的中间态，
    也不存在「报告单独 os.replace 覆盖旧报告」的问题。

    目标不存在时，这次 rename 本身就是存在性检查（不依赖先 check 后 rename），
    因此并发抢占只会让 rename 失败，不会静默覆盖。

    替换路径（replace_dir=True）的约定：
      1. 旧目录必须通过 `bundle_problem()` 的完整校验（残缺包一律拒绝）；
      2. 既有 `<out>.prev` 不覆盖、不删除：存在即拒绝并给出处理方式；
      3. 移走旧目录后**复核身份**（设备号 + inode + 再验一次包），
         若在「检查」与「rename」之间被其他进程调换，则把它改回原位并拒绝；
      4. **本函数不删除旧包**：成功后 `<out>.prev` 原样保留，清理权交给人。
         原因：验证与删除之间，`prev` 路径的对象可被改名/替换/改写，
         `st_dev + st_ino` 只证明目录身份、不证明内容未变；在删除前再查一次
         仍是同一个 TOCTOU 结构。放弃删除权后，「删除只作用于被验证过的目录」
         不再是承诺问题——本函数没有删除旧包的动作。

    返回 `(out_dir, kept_prev_or_None)`；`kept_prev_or_None` 是保留下来的**旧包本体**
    路径（形如 `<out>.prev/bundle`，而不是容器 `<out>.prev`），供调用方提示人工清理。
    """
    prev = None
    prev_bundle = None
    if os.path.lexists(out_dir):
        problem = bundle_problem(out_dir)
        if problem:
            raise PublishError(
                "发布目标不是完整有效的本工具结果包，拒绝发布：%s\n"
                "  问题：%s\n"
                "  合法结果包应为 <out>/PIXEL_DIFF.md + <out>/diff/diff_*.png。\n"
                "  请改 --out 指向新目录，或人工确认后处理该目录。" % (out_dir, problem))
        if not replace_dir:
            raise PublishError(
                "发布目标已存在且是完整结果包：%s\n"
                "  整组发布不覆盖已有证据，默认拒绝。确认要替换请加 --replace-dir。" % out_dir)

        # 独占占位：os.mkdir 在 POSIX 与 Windows 上都是原子的「不存在才创建」，
        # 因此「.prev 已存在」由 mkdir 失败来判定，不再依赖 lexists 预检查
        # （lexists → rename 之间存在窗口，POSIX 下 rename 会覆盖空目录）。
        prev = out_dir + ".prev"
        try:
            os.mkdir(prev)
        except FileExistsError:
            raise PublishError(
                "上一次替换保留的旧包仍占着这个路径，拒绝覆盖或删除：%s\n"
                "  本工具不删除旧证据，也不覆盖它。请先确认该目录内容，再自行处理：\n"
                "    mv \"%s\" \"%s.discard.$(date +%%Y%%m%%d%%H%%M%%S)\"\n"
                "  或确认可丢弃后删除它，然后重新运行。" % (prev, prev, prev))
        except OSError as exc:
            raise PublishError(
                "无法创建旧包保留目录：%s\n  原因：%s" % (prev, exc))

        prev_bundle = os.path.join(prev, "bundle")
        ident_before = _ident(out_dir)
        try:
            os.rename(out_dir, prev_bundle)  # 移进刚独占创建的容器
        except OSError as exc:
            _rmdir_quiet(prev)  # 只删本进程刚建的空容器，非空时失败
            raise PublishError(
                "旧结果包移动到 %s 失败：%s\n  发布未进行，%s 未被改动。"
                % (prev_bundle, exc, out_dir))

        swapped = _ident(prev_bundle) != ident_before or bundle_problem(prev_bundle) is not None
        if swapped:
            # 移走的不是刚验证过的那个目录：把它放回去，拒绝发布，不删除任何内容
            try:
                os.rename(prev_bundle, out_dir)
            except OSError as exc:
                raise RollbackError(
                    "替换过程中目标目录被其他进程调换，且把当前内容放回原位也失败。\n"
                    "  内容仍完整保留在：%s\n"
                    "  恢复命令：mv \"%s\" \"%s\"" % (prev_bundle, prev_bundle, out_dir)) from exc
            _rmdir_quiet(prev)
            raise PublishError(
                "替换过程中目标目录被其他进程调换：%s\n"
                "  已将当时移走的目录放回原位并拒绝发布，未删除任何内容。\n"
                "  请确认无并发写入后重试。" % out_dir)

    try:
        os.rename(staging_dir, out_dir)  # 对目标的唯一一次 rename
    except OSError:
        if prev:
            _restore(prev_bundle, out_dir)  # 回滚：旧包改回原位
            _rmdir_quiet(prev)              # 容器此时应为空，删掉不留残骸
            raise
        if os.path.lexists(out_dir):
            raise PublishError(
                "发布目标在发布瞬间被其他进程创建：%s\n"
                "  本次结果未发布（暂存目录会被删除），未覆盖对方内容。" % out_dir)
        raise

    # 注意：此处**不做** _rmtree(prev)。旧包原样保留，由人决定何时清理。
    # 返回旧包本体（<out>.prev/bundle）而不是容器，便于人工 mv/删除时路径直达。
    return out_dir, prev_bundle



def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--a", required=True, help="旧版截图目录")
    ap.add_argument("--b", required=True, help="新版截图目录")
    ap.add_argument("--out", required=True,
                    help="本次 run 独占的结果目录，发布后内含 PIXEL_DIFF.md 与 diff/。"
                         "整组以一次 rename 发布，目标已存在时默认拒绝")
    ap.add_argument("--label-a", default="v1.4")
    ap.add_argument("--label-b", default="v1.5.1")
    ap.add_argument("--shift-search", type=int, default=40,
                    help="纵向位移补偿搜索半径（像素），0 表示关闭该口径。默认 40")
    ap.add_argument("--replace-dir", action="store_true",
                    help="允许替换 --out 已存在的结果目录。默认拒绝，以免覆盖历史证据")
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

    # --out 是本工具独占的结果目录：一个目录 = 一个原子发布单元。
    # staging 建在 --out 的同级目录（同一文件系统，rename 才具备原子性）。
    out_abs = os.path.abspath(args.out)
    parent = os.path.dirname(out_abs)
    if not parent or parent == out_abs:
        sys.stderr.write("ERROR: --out 不能是文件系统根目录: %s\n" % args.out)
        return 2
    os.makedirs(parent, exist_ok=True)

    run_id = "%s-%d" % (time.strftime("%Y%m%d-%H%M%S"), os.getpid())
    staging = os.path.join(parent, ".%s.staging.%s" % (os.path.basename(out_abs), run_id))
    run_diff = os.path.join(staging, "diff")
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
        add("| 发布单元 | **一个目录**（本报告 + `diff/`），对目标目录做**一次 rename** 整组发布 |")
        add("| 运行 ID | 只打印到 stdout，不写进报告，保证本报告字节级可复现 |")
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
        add("**失败与发布语义**：本报告与 `diff/` 同属一个目录，**该目录整体就是一个原子发布单元**——"
            "全部页面差分完成、报告写毕、产物校验通过后，对目录做**一次 rename** 让它整组就位。"
            "因此不存在「图已发布、报告仍是旧版」的中间态，也不存在报告被单独覆盖的情况："
            "目标目录已存在时默认拒绝发布（退出 6），加 `--replace-dir` 才整组替换。"
            "目标不存在时，这一次 rename 同时充当存在性检查，不依赖「先 check 后 rename」，"
            "并发抢占只会让 rename 失败而不会静默覆盖。**任何失败都不触碰历史证据。**")
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

        # 报告写进本次 staging 目录，与差异图同属**同一个**原子发布单元
        io.open(os.path.join(staging, "PIXEL_DIFF.md"), "w",
                encoding="utf-8", newline="\n").write("\n".join(L) + "\n")

        # 校验 → 一次 rename 发布整个目录
        verify_bundle(staging, [r["name"] for r in results])
        bundle, kept_prev = publish_bundle(out_abs, staging, args.replace_dir)

        print("written: %s" % os.path.join(bundle, "PIXEL_DIFF.md"))
        print("images:  %s" % os.path.join(bundle, "diff"))
        print("pages=%d  strict=%s  set_check=PASS  size_check=PASS  publish=PASS" %
              (len(results), format(ts, ",")))
        if kept_prev:
            keep_box = os.path.dirname(kept_prev)
            print("NOTICE: 旧结果包已原样保留在 %s" % kept_prev)
            print("        本工具不删除旧证据（验证与删除之间无法排除第三方替换）。")
            print("        确认后可自行处理：mv \"%s\" \"%s.discard\"" % (kept_prev, kept_prev))
            print("        移走后容器 %s 变空，可 rmdir 删除；"
                  "容器非空时下一次替换会被拒绝（不会覆盖）。" % keep_box)
        return 0
    except RollbackError as exc:
        sys.stderr.write("ERROR: %s\n" % exc)
        return 7
    except PublishError as exc:
        sys.stderr.write("ERROR: %s\n" % exc)
        return 6
    except Exception as exc:
        sys.stderr.write("ERROR: 发布失败：%s\n" % exc)
        return 7
    finally:
        # 只清本次 staging 目录；历史证据不在这个目录里。
        # 发布成功后 staging 已被 rename 成 --out，这里对不存在的路径是空操作。
        shutil.rmtree(staging, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""B5 v0.8.1 reference verification (read-only; prints results, writes nothing).

Run in the project environment:  python b5_v0_8_1_verify.py
Expected baseline: Python 3.13.15 / Unicode 15.1.0 (B5 v0.8.1 §9 item 4).
This is a reference check of the specification text, not the project test suite.
"""
import hashlib
import json
import sys
import unicodedata as u

RULE_VERSION = "b5-min-v0.2"

WS = set(map(chr, [0x9, 0xA, 0xD, 0x20, 0xA0, 0x1680, *range(0x2000, 0x200B),
                   0x2028, 0x2029, 0x202F, 0x205F, 0x3000]))
LIST = set([0xAD, 0x3164, 0xFFA0, 0x115F, 0x1160, *range(0xFE00, 0xFE10),
            *range(0xE0100, 0xE01F0), *range(0xFFF9, 0xFFFC), *range(0x1D173, 0x1D17B)])
E2 = set(range(0xFF01, 0xFF5F)) | {ord(c) for c in WS}


def hard(c):
    o = ord(c)
    if c in WS:
        return False
    if u.category(c) == "Cc":
        return True
    return (o in (0x180E, 0x034F, 0xFEFF) or 0x200B <= o <= 0x200F or 0x202A <= o <= 0x202E
            or 0x2060 <= o <= 0x2064 or 0x2066 <= o <= 0x2069 or 0xE0000 <= o <= 0xE007F)


def listed(c):
    return ord(c) in LIST or (u.category(c) == "Cf" and not hard(c))


def m2(c):
    return u.normalize("NFKC", c) != u.normalize("NFC", c) and ord(c) not in E2


def m1(c):
    return len(c.casefold()) != 1


def N(x):
    """diagnostic_norm: NFKC -> whitespace fold -> casefold (B5 §2.6)."""
    out, sp = [], False
    for c in u.normalize("NFKC", x):
        if c in WS:
            sp = True
            continue
        if sp and out:
            out.append(" ")
        sp = False
        out.append(c)
    return "".join(out).casefold()


def b5(x):
    """Returns (status, diagnostic_norm, triggers) for the Unicode stage only."""
    if not isinstance(x, str):
        return "INVALID_INPUT", None, []
    if any(hard(c) for c in x):
        return "INVALID_INPUT", None, ["P5a"]
    t = []
    for i, c in enumerate(x):
        if listed(c):
            t.append(("LIST", i, "U+%04X" % ord(c)))
        if m2(c):
            t.append(("M2", i, "U+%04X" % ord(c)))
    n = u.normalize("NFKC", x)
    if any(hard(c) for c in n):
        return "INVALID_INPUT", None, ["P5a-post"]
    for i, c in enumerate(n):
        if c not in x and listed(c):
            t.append(("LIST", "nfkc:%d" % i, "U+%04X" % ord(c)))
        if m1(c):
            t.append(("M1", "nfkc:%d" % i, "U+%04X" % ord(c)))
    s = N(x)
    if not s:
        return "INVALID_INPUT", None, ["EMPTY"]
    return ("NEEDS_REVIEW" if t else "OK"), s, t


def business_key(brand_norm, mpn_norm):
    payload = json.dumps({"schema": "product-business-key", "rule_version": RULE_VERSION,
                          "brand_norm": brand_norm, "mpn_norm": mpn_norm},
                         ensure_ascii=False, separators=(",", ":"))
    return "pbk1_" + hashlib.sha256(payload.encode("utf-8")).hexdigest(), payload


R, O, I = "NEEDS_REVIEW", "OK", "INVALID_INPUT"
VECTORS = [
    ("T8-01", "\uff21\uff22\uff23\uff0d\uff11\uff12\uff13", O, "abc-123"),
    ("T8-02", "\uff21\uff22\uff23\u3000\uff11\uff12\uff13", O, "abc 123"),
    ("T8-03", "\u2460\u2461\u2462", R, "123"),
    ("T8-04", "ABC\xb2", R, "abc2"),
    ("T8-05", "\ufb01le", R, "file"),
    ("T8-06", "\u212a", O, "k"),
    ("T8-07", "\u0130", R, "i\u0307"),
    ("T8-08", "STRA\xdfE", R, "strasse"),
    ("T8-09", "\u039f\u03a3", O, "\u03bf\u03c3"),
    ("T8-10", "A\xa0B", O, "a b"),
    ("T8-11", "A\u200bB", I, None),
    ("T8-12", "A\xadB", R, "a\xadb"),
    ("T8-13", "A\u2013B", O, "a\u2013b"),
    ("T8-14", "A\u2212B", O, "a\u2212b"),
    ("T8-15", "e\u0301", O, "\xe9"),
    ("T8-16", "\u0410BC", O, "\u0430bc"),
    ("WS-01", "\tABC\n", O, "abc"),
    ("WS-02", "A\t \r\n B", O, "a b"),
    ("WS-03", "A\xa0B", O, "a b"),
    ("WS-04", "A\u3000B", O, "a b"),
    ("WS-05", "A\u2028B", O, "a b"),
    ("WS-06", "A\u205fB", O, "a b"),
    ("WS-07", "   ", I, None),
    ("WS-08", "A\u200bB", I, None),
    ("WS-09", "A\x0bB", I, None),
    ("WS-10", "A\x85B", I, None),
    ("WS-11", "A\xadB", R, "a\xadb"),
    ("WS-12", "\uff21\u3000\uff22", O, "a b"),
    ("WS-13", "A     B", O, "a b"),
    ("WS-14", "  A B  ", O, "a b"),
    ("WS-15", "A\u2000B", O, "a b"),
    ("WS-15A", "\t\n\r\xa0\u3000", I, None),
    ("WS-15B", "\u2000\u2028\u3000", I, None),
    ("WS-15C", "\u200b", I, None),
    ("M1-01", "\u1e9e", R, "ss"),
    ("M1-02", "\u1fb3", R, "\u03b1\u03b9"),
    ("M1-03", "\u03c2", O, "\u03c3"),
    ("M1-04", "STRASSE", O, "strasse"),
    ("M1-05", "\u0149", R, "\u02bcn"),
    ("M2-01", "\ufb00", R, "ff"),
    ("M2-02", "\uff71", R, "\u30a2"),
    ("M2-03", "\u210c", R, "h"),
    ("M2-04", "\u2126", O, "\u03c9"),
    ("M2-05", "\u00c5", O, "\xe5"),
    ("M2-06", "\u212b", O, "\xe5"),
    ("M2-07", "A\u2028B", O, "a b"),
    ("M2-08", "\u00bd", R, "1\u20442"),
    ("M2-09", "\uff5e", O, "~"),
]
IDEM = [("IDEM-01", "\xdf", O), ("IDEM-02", "\u2460", O), ("IDEM-03", "\u0130", O),
        ("IDEM-04", "\ufb01", O), ("IDEM-05", "A\xadB", R)]


def main():
    print("ENV", sys.version.split()[0], "Unicode", u.unidata_version, "RULE_VERSION", RULE_VERSION)
    ok = 0
    for vid, x, es, en in VECTORS:
        s, n, t = b5(x)
        idem = (N(n) == n) if n is not None else True
        good = s == es and n == en and idem
        ok += good
        print("%-7s %-13s %-22r %s" % (vid, s, n, "PASS" if good else "FAIL expected %s %r" % (es, en)))
    for vid, x, new_expect in IDEM:
        s, n, t = b5(x)
        s2, n2, t2 = b5(n)
        good = s == R and bool(t) and s2 == new_expect and N(n) == n
        ok += good
        print("%-7s orig=%s trig=%s diag=%r | new_record=%s | %s"
              % (vid, s, t, n, s2, "PASS" if good else "FAIL"))
    total = len(VECTORS) + len(IDEM)
    print("VECTORS", ok, "/", total)

    bad = 0
    for cp in range(0x110000):
        if 0xD800 <= cp <= 0xDFFF:
            continue
        c = chr(cp)
        if u.category(c) in ("Cn", "Cs", "Co"):
            continue
        s = N("A" + c + "B")
        if N(s) != s:
            bad += 1
    print("EXHAUSTIVE_STRING_IDEMPOTENCY counterexamples", bad)

    key, payload = business_key("texas instruments", "lm358dr")
    print("KEY_EXAMPLE payload", payload)
    print("KEY_EXAMPLE", key)


if __name__ == "__main__":
    main()

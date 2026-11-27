#!/usr/bin/env python3
"""B5 v0.8.2 verification script (read-only; prints results, writes nothing).

Run:  python b5_v0_8_2_verify.py
Exit code 0 only if ALL gates pass; any failure -> exit code 1.

Gates (fixes Reviewer B5-REV-04):
  G1 environment must be Python 3.13.15 / Unicode 15.1.0 (override only with --allow-env-mismatch,
     which still exits 1 and is never acceptable as formal evidence)
  G2 53 vectors: status, diagnostic_norm, review_triggers (rule + code point set) and N(N(x)) == N(x)
  G3 exhaustive string idempotency over all assigned code points: 0 counterexamples
  G4 KEY-01 must equal the fixed expected value

Not covered: trigger *positions* (only rule + code point are asserted); Stage A/B/D/E
(Brand / structure / MPN format) are outside this Unicode-stage script.
Rules, expected values and P2 boundaries are unchanged from B5 v0.8.1 (b5-min-v0.2).
"""
import hashlib
import json
import sys
import unicodedata as u

RULE_VERSION = "b5-min-v0.2"
REQUIRED_PY = "3.13.15"
REQUIRED_UCD = "15.1.0"
KEY01_EXPECTED = "pbk1_e71ca20eeb028ce1450e733f3d162a97fb72adb45061dc5ba642fde0f70affaf"

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
    if not isinstance(x, str):
        return "INVALID_INPUT", None, []
    if any(hard(c) for c in x):
        return "INVALID_INPUT", None, []
    t = []
    for i, c in enumerate(x):
        if listed(c):
            t.append(("LIST", i, "U+%04X" % ord(c)))
        if m2(c):
            t.append(("M2", i, "U+%04X" % ord(c)))
    n = u.normalize("NFKC", x)
    if any(hard(c) for c in n):
        return "INVALID_INPUT", None, []
    for i, c in enumerate(n):
        if c not in x and listed(c):
            t.append(("LIST", "nfkc:%d" % i, "U+%04X" % ord(c)))
        if m1(c):
            t.append(("M1", "nfkc:%d" % i, "U+%04X" % ord(c)))
    s = N(x)
    if not s:
        return "INVALID_INPUT", None, []
    return ("NEEDS_REVIEW" if t else "OK"), s, t


def trigset(t):
    return sorted({(r[0], r[2]) for r in t})


def business_key(brand_norm, mpn_norm):
    payload = json.dumps({"schema": "product-business-key", "rule_version": RULE_VERSION,
                          "brand_norm": brand_norm, "mpn_norm": mpn_norm},
                         ensure_ascii=False, separators=(",", ":"))
    return "pbk1_" + hashlib.sha256(payload.encode("utf-8")).hexdigest(), payload


R, O, I = "NEEDS_REVIEW", "OK", "INVALID_INPUT"
# (id, input, expected status, expected diagnostic_norm, expected triggers {(rule, code point)})
VECTORS = [
    ("T8-01", "\uff21\uff22\uff23\uff0d\uff11\uff12\uff13", O, "abc-123", []),
    ("T8-02", "\uff21\uff22\uff23\u3000\uff11\uff12\uff13", O, "abc 123", []),
    ("T8-03", "\u2460\u2461\u2462", R, "123", [("M2", "U+2460"), ("M2", "U+2461"), ("M2", "U+2462")]),
    ("T8-04", "ABC\xb2", R, "abc2", [("M2", "U+00B2")]),
    ("T8-05", "\ufb01le", R, "file", [("M2", "U+FB01")]),
    ("T8-06", "\u212a", O, "k", []),
    ("T8-07", "\u0130", R, "i\u0307", [("M1", "U+0130")]),
    ("T8-08", "STRA\xdfE", R, "strasse", [("M1", "U+00DF")]),
    ("T8-09", "\u039f\u03a3", O, "\u03bf\u03c3", []),
    ("T8-10", "A\xa0B", O, "a b", []),
    ("T8-11", "A\u200bB", I, None, []),
    ("T8-12", "A\xadB", R, "a\xadb", [("LIST", "U+00AD")]),
    ("T8-13", "A\u2013B", O, "a\u2013b", []),
    ("T8-14", "A\u2212B", O, "a\u2212b", []),
    ("T8-15", "e\u0301", O, "\xe9", []),
    ("T8-16", "\u0410BC", O, "\u0430bc", []),
    ("WS-01", "\tABC\n", O, "abc", []),
    ("WS-02", "A\t \r\n B", O, "a b", []),
    ("WS-03", "A\xa0B", O, "a b", []),
    ("WS-04", "A\u3000B", O, "a b", []),
    ("WS-05", "A\u2028B", O, "a b", []),
    ("WS-06", "A\u205fB", O, "a b", []),
    ("WS-07", "   ", I, None, []),
    ("WS-08", "A\u200bB", I, None, []),
    ("WS-09", "A\x0bB", I, None, []),
    ("WS-10", "A\x85B", I, None, []),
    ("WS-11", "A\xadB", R, "a\xadb", [("LIST", "U+00AD")]),
    ("WS-12", "\uff21\u3000\uff22", O, "a b", []),
    ("WS-13", "A     B", O, "a b", []),
    ("WS-14", "  A B  ", O, "a b", []),
    ("WS-15", "A\u2000B", O, "a b", []),
    ("WS-15A", "\t\n\r\xa0\u3000", I, None, []),
    ("WS-15B", "\u2000\u2028\u3000", I, None, []),
    ("WS-15C", "\u200b", I, None, []),
    ("M1-01", "\u1e9e", R, "ss", [("M1", "U+1E9E")]),
    ("M1-02", "\u1fb3", R, "\u03b1\u03b9", [("M1", "U+1FB3")]),
    ("M1-03", "\u03c2", O, "\u03c3", []),
    ("M1-04", "STRASSE", O, "strasse", []),
    ("M1-05", "\u0149", R, "\u02bcn", [("M2", "U+0149")]),
    ("M2-01", "\ufb00", R, "ff", [("M2", "U+FB00")]),
    ("M2-02", "\uff71", R, "\u30a2", [("M2", "U+FF71")]),
    ("M2-03", "\u210c", R, "h", [("M2", "U+210C")]),
    ("M2-04", "\u2126", O, "\u03c9", []),
    ("M2-05", "\u00c5", O, "\xe5", []),
    ("M2-06", "\u212b", O, "\xe5", []),
    ("M2-07", "A\u2028B", O, "a b", []),
    ("M2-08", "\u00bd", R, "1\u20442", [("M2", "U+00BD")]),
    ("M2-09", "\uff5e", O, "~", []),
]
# (id, input, expected original triggers, expected new-record status when diagnostic_norm is re-entered)
IDEM = [
    ("IDEM-01", "\xdf", [("M1", "U+00DF")], O),
    ("IDEM-02", "\u2460", [("M2", "U+2460")], O),
    ("IDEM-03", "\u0130", [("M1", "U+0130")], O),
    ("IDEM-04", "\ufb01", [("M2", "U+FB01")], O),
    ("IDEM-05", "A\xadB", [("LIST", "U+00AD")], R),
]


def main():
    allow = "--allow-env-mismatch" in sys.argv
    fails = []
    py = sys.version.split()[0]
    print("ENV", py, "Unicode", u.unidata_version, "RULE_VERSION", RULE_VERSION)
    env_ok = py == REQUIRED_PY and u.unidata_version == REQUIRED_UCD
    print("G1_ENV", "PASS" if env_ok else
          "FAIL required Python %s / Unicode %s" % (REQUIRED_PY, REQUIRED_UCD))
    if not env_ok:
        fails.append("G1")
        if not allow:
            print("RESULT FAIL (environment mismatch; run in the required environment)")
            sys.exit(1)

    ok = 0
    for vid, x, es, en, et in VECTORS:
        s, n, t = b5(x)
        ts = trigset(t)
        idem = (N(n) == n) if n is not None else True
        good = s == es and n == en and ts == sorted(et) and idem
        ok += good
        print("%-7s %-13s %-20r %-34s %s" % (vid, s, n, ts,
              "PASS" if good else "FAIL expected %s %r %s" % (es, en, sorted(et))))
    for vid, x, et, new_expect in IDEM:
        s, n, t = b5(x)
        s2, n2, t2 = b5(n)
        good = s == R and trigset(t) == sorted(et) and s2 == new_expect and N(n) == n
        ok += good
        print("%-7s orig=%s trig=%s diag=%r | new_record=%s | %s"
              % (vid, s, trigset(t), n, s2, "PASS" if good else "FAIL"))
    total = len(VECTORS) + len(IDEM)
    print("G2_VECTORS", ok, "/", total, "PASS" if ok == total else "FAIL")
    if ok != total:
        fails.append("G2")

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
    print("G3_EXHAUSTIVE_STRING_IDEMPOTENCY counterexamples", bad, "PASS" if bad == 0 else "FAIL")
    if bad:
        fails.append("G3")

    key, payload = business_key("texas instruments", "lm358dr")
    print("KEY_EXAMPLE payload", payload)
    print("G4_KEY01", key, "PASS" if key == KEY01_EXPECTED else "FAIL expected " + KEY01_EXPECTED)
    if key != KEY01_EXPECTED:
        fails.append("G4")

    if fails:
        print("RESULT FAIL", ",".join(fails))
        sys.exit(1)
    print("RESULT PASS (exit 0)")
    sys.exit(0)


if __name__ == "__main__":
    main()

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

const N = require("../assets/mpn-normalizer.js");

test("sha256Hex matches FIPS 180-4 test vectors", () => {
  assert.equal(
    N.sha256Hex("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
  );
  assert.equal(
    N.sha256Hex(""),
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  );
  assert.equal(
    N.sha256Hex("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"),
    "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1"
  );
});

test("sha256Hex matches node:crypto for unicode and long inputs", () => {
  const samples = ["LM358DR", "Example Semiconductor", "芯片-测试", "é", "a".repeat(1000)];
  for (const s of samples) {
    const expected = crypto.createHash("sha256").update(Buffer.from(s, "utf8")).digest("hex");
    assert.equal(N.sha256Hex(s), expected, "mismatch for " + JSON.stringify(s));
  }
});

test("utf8Length counts bytes, not code units", () => {
  assert.equal(N.utf8Length("ABC"), 3);
  assert.equal(N.utf8Length("é"), 2);
  assert.equal(N.utf8Length("芯"), 3);
  assert.equal(N.utf8Length("😀"), 4);
});

test("normalizeValue trims and uppercases", () => {
  assert.deepEqual(N.normalizeValue("  lm358dr  "), { ok: true, reason: null, value: "LM358DR" });
});

test("normalizeValue collapses internal whitespace to a single ASCII space", () => {
  assert.equal(N.normalizeValue("Example  Semiconductor").value, "EXAMPLE SEMICONDUCTOR");
  assert.equal(N.normalizeValue("Example\u3000Semiconductor").value, "EXAMPLE SEMICONDUCTOR");
  assert.equal(N.normalizeValue("Example\u00A0\tSemiconductor").value, "EXAMPLE SEMICONDUCTOR");
  // internal spaces are preserved (collapsed), never deleted
  assert.equal(N.normalizeValue("A B").value, "A B");
});

test("normalizeValue applies NFKC, removes zero-width, normalizes dashes", () => {
  assert.equal(N.normalizeValue("ＬＭ３５８ＤＲ").value, "LM358DR");
  assert.equal(N.normalizeValue("LM\u200B358DR\uFEFF").value, "LM358DR");
  assert.equal(N.normalizeValue("LM\u2013358DR").value, "LM-358DR");
  assert.equal(N.normalizeValue("LM\u2212358DR").value, "LM-358DR");
  assert.equal(N.normalizeValue("LM\uFF0D358DR").value, "LM-358DR");
});

test("normalizeValue keeps connector characters and does not strip brand suffixes", () => {
  assert.equal(N.normalizeValue("LM358DR/TR").value, "LM358DR/TR");
  assert.equal(N.normalizeValue("lm358dr_ti").value, "LM358DR_TI");
  assert.equal(N.normalizeValue("LM358DR-TI").value, "LM358DR-TI");
  assert.equal(N.normalizeValue("LM.358").value, "LM.358");
});

test("normalizeValue rejects non-strings, control chars and lone surrogates", () => {
  assert.equal(N.normalizeValue(123).reason, "NOT_STRING");
  assert.equal(N.normalizeValue(null).reason, "NOT_STRING");
  assert.equal(N.normalizeValue("A\u0000B").reason, "ILLEGAL_CHAR");
  assert.equal(N.normalizeValue("A\u0007B").reason, "ILLEGAL_CHAR");
  assert.equal(N.normalizeValue("A\uD800B").reason, "ILLEGAL_CHAR");
});

test("productBusinessKey matches all contract example keys", () => {
  const cases = [
    ["LM358DR", "EXAMPLE SEMICONDUCTOR", "pbk1_e65e545a387d11dfccf729da568de66a33b78c892d6b6809347ceeb499eba88b"],
    ["LM358DR", "TEXAS INSTRUMENTS", "pbk1_ec7e3c0335daa3724e9a24b475e2a40bc6552babb93f2b97571bc053b3e9d40d"],
    ["NE555P", "EXAMPLE SEMICONDUCTOR", "pbk1_f3be4832aee387479a44c81cf4f0be4e1ad52964fd2029c96b81bc94b3298d40"],
    ["EXAMPLE-999", "EXAMPLE SEMICONDUCTOR", "pbk1_7de19c6b2d36dd692514dc2580af496a126795f386c351950789a9ef3ae83ec1"],
    ["AFE7950", "EXAMPLE SEMICONDUCTOR", "pbk1_8dfd5509816d929d81f29aa840eae76304e45584a58d81216cda1e509e780cc6"],
    ["AFE7950EVM", "EXAMPLE SEMICONDUCTOR", "pbk1_d83d0b126f3999ba7a5c4356050f6cbc7f87cb751417da24715af219e968b85f"]
  ];
  for (const [mpn, brand, key] of cases) {
    assert.equal(N.productBusinessKey(mpn, brand), key, mpn + " / " + brand);
  }
});

test("productBusinessKey is 69 chars, full sha256, no truncation", () => {
  const key = N.productBusinessKey("LM358DR", "EXAMPLE SEMICONDUCTOR");
  assert.equal(key.length, 69);
  assert.match(key, /^pbk1_[0-9a-f]{64}$/);
  assert.equal(key.slice(5).length, 64);
});

test("productBusinessKey is deterministic, byte-length framed, and brand-sensitive", () => {
  assert.equal(
    N.productBusinessKey("LM358DR", "EXAMPLE SEMICONDUCTOR"),
    N.productBusinessKey("LM358DR", "EXAMPLE SEMICONDUCTOR")
  );
  assert.notEqual(
    N.productBusinessKey("LM358DR", "EXAMPLE SEMICONDUCTOR"),
    N.productBusinessKey("LM358DR", "TEXAS INSTRUMENTS")
  );
  // length prefix uses UTF-8 bytes: a 2-byte brand must not collide with a 1-char framing
  assert.notEqual(N.productBusinessKey("A", "é"), N.productBusinessKey("A", "éA"));
  const canonical = "PBK1\n1:A\n2:é";
  assert.equal(
    N.productBusinessKey("A", "é"),
    "pbk1_" + crypto.createHash("sha256").update(Buffer.from(canonical, "utf8")).digest("hex")
  );
});

test("normalizeIdentity confirms a complete pair and keeps raw values", () => {
  const out = N.normalizeIdentity({ mpn_raw: " lm358dr ", brand_raw: "Example  Semiconductor" });
  assert.equal(out.identity_state, "CONFIRMED");
  assert.equal(out.mpn_raw, " lm358dr ");
  assert.equal(out.mpn_norm, "LM358DR");
  assert.equal(out.brand_raw, "Example  Semiconductor");
  assert.equal(out.brand_norm, "EXAMPLE SEMICONDUCTOR");
  assert.equal(out.normalizer_version, "MPN-NORM-v1");
  assert.equal(out.product_business_key, N.productBusinessKey("LM358DR", "EXAMPLE SEMICONDUCTOR"));
});

test("normalizeIdentity marks missing or empty brand as PENDING_BRAND", () => {
  for (const brand of [null, undefined, "", "   "]) {
    const out = N.normalizeIdentity({ mpn_raw: "XYZ123", brand_raw: brand });
    assert.equal(out.identity_state, "PENDING_BRAND", "brand=" + JSON.stringify(brand));
    assert.equal(out.reason, "MISSING_BRAND");
    assert.equal(out.product_business_key, null);
    assert.equal(out.mpn_norm, "XYZ123");
  }
});

test("normalizeIdentity marks empty or illegal MPN as INVALID", () => {
  assert.equal(N.normalizeIdentity({ mpn_raw: "", brand_raw: "X" }).reason, "EMPTY_MPN");
  assert.equal(N.normalizeIdentity({ mpn_raw: "   ", brand_raw: "X" }).reason, "EMPTY_MPN");
  assert.equal(N.normalizeIdentity({ mpn_raw: "A\u0000", brand_raw: "X" }).reason, "INVALID_MPN");
  assert.equal(N.normalizeIdentity({ mpn_raw: "", brand_raw: "X" }).product_business_key, null);
});

test("equivalent raw spellings collapse to one identity", () => {
  const a = N.normalizeIdentity({ mpn_raw: "LM358DR", brand_raw: "Example Semiconductor" });
  const b = N.normalizeIdentity({ mpn_raw: " lm358dr\u200B ", brand_raw: "example\u3000semiconductor" });
  assert.equal(a.product_business_key, b.product_business_key);
});

test("same MPN with a different brand yields a different identity", () => {
  const a = N.normalizeIdentity({ mpn_raw: "LM358DR", brand_raw: "Example Semiconductor" });
  const b = N.normalizeIdentity({ mpn_raw: "LM358DR", brand_raw: "Texas Instruments" });
  assert.notEqual(a.product_business_key, b.product_business_key);
});

test("normalizeCandidates groups duplicate documents into one identity", () => {
  const out = N.normalizeCandidates([
    { mpn_raw: "LM358DR", brand_raw: "Example Semiconductor" },
    { mpn_raw: "lm358dr", brand_raw: "example semiconductor" }
  ]);
  assert.equal(out.identity_state, "CONFIRMED");
  assert.equal(out.keys.length, 1);
});

test("normalizeCandidates flags conflicting MPNs as PENDING_CONFLICT", () => {
  const out = N.normalizeCandidates([
    { mpn_raw: "LM358DR", brand_raw: "Example Semiconductor" },
    { mpn_raw: "LM358D", brand_raw: "Example Semiconductor" }
  ]);
  assert.equal(out.identity_state, "PENDING_CONFLICT");
  assert.equal(out.reason, "CONFLICTING_IDENTITY");
  assert.equal(out.keys.length, 2);
});

test("normalizeCandidates propagates PENDING_BRAND and INVALID", () => {
  assert.equal(
    N.normalizeCandidates([{ mpn_raw: "XYZ123", brand_raw: null }]).identity_state,
    "PENDING_BRAND"
  );
  assert.equal(
    N.normalizeCandidates([{ mpn_raw: "", brand_raw: "X" }]).identity_state,
    "INVALID"
  );
});

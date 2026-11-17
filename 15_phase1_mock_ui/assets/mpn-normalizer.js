/*
 * MPN-NORM-v1 reference implementation (DEMO ONLY).
 *
 * Mirrors the candidate rules frozen in 12_ ... §6.2.1. This file is a
 * demonstration/reference module for the Phase 1 mock UI. It is NOT a
 * production service, NOT wired to Ds Bit, and NOT the authority for the
 * final frozen rules. Any rule change must bump `VERSION` and be reviewed.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.MpnNormalizer = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var VERSION = "MPN-NORM-v1";

  // U+200B..U+200D, U+FEFF
  var ZERO_WIDTH = /[\u200B-\u200D\uFEFF]/g;
  // U+2010..U+2015, U+2212, U+FF0D
  var UNICODE_DASHES = /[\u2010-\u2015\u2212\uFF0D]/g;
  // Whitespace incl. NBSP / en-space ranges / ideographic space
  var WHITESPACE = /[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]+/g;
  // C0 controls except TAB(09), LF(0A), CR(0D), plus DEL
  var ILLEGAL_CONTROLS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
  var LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/;

  var SHA256_K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  function utf8Bytes(str) {
    if (typeof TextEncoder !== "undefined") {
      return new TextEncoder().encode(str);
    }
    // Minimal fallback (should not be needed in supported environments)
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) {
        var c2 = str.charCodeAt(++i);
        var cp = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
        out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
      } else out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return new Uint8Array(out);
  }

  function utf8Length(str) {
    return utf8Bytes(str).length;
  }

  function rotr(x, n) {
    return (x >>> n) | (x << (32 - n));
  }

  function sha256Hex(input) {
    var bytes = utf8Bytes(input);
    var len = bytes.length;

    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];

    var padded = new Uint8Array((((len + 8) >>> 6) + 1) * 64);
    padded.set(bytes);
    padded[len] = 0x80;

    var bitHi = Math.floor(len / 0x20000000); // len*8 / 2^32
    var bitLo = (len << 3) >>> 0;
    var end = padded.length;
    padded[end - 8] = (bitHi >>> 24) & 0xff;
    padded[end - 7] = (bitHi >>> 16) & 0xff;
    padded[end - 6] = (bitHi >>> 8) & 0xff;
    padded[end - 5] = bitHi & 0xff;
    padded[end - 4] = (bitLo >>> 24) & 0xff;
    padded[end - 3] = (bitLo >>> 16) & 0xff;
    padded[end - 2] = (bitLo >>> 8) & 0xff;
    padded[end - 1] = bitLo & 0xff;

    var w = new Int32Array(64);
    for (var off = 0; off < padded.length; off += 64) {
      for (var t = 0; t < 16; t++) {
        var j = off + t * 4;
        w[t] = (padded[j] << 24) | (padded[j + 1] << 16) | (padded[j + 2] << 8) | padded[j + 3];
      }
      for (t = 16; t < 64; t++) {
        var s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
        var s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
      }

      var a = H[0], b = H[1], c = H[2], d = H[3];
      var e = H[4], f = H[5], g = H[6], h = H[7];

      for (t = 0; t < 64; t++) {
        var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        var ch = (e & f) ^ (~e & g);
        var temp1 = (h + S1 + ch + SHA256_K[t] + w[t]) | 0;
        var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var temp2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + temp1) | 0;
        d = c; c = b; b = a; a = (temp1 + temp2) | 0;
      }

      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }

    var hex = "";
    for (var k = 0; k < 8; k++) {
      hex += ((H[k] >>> 0).toString(16).padStart(8, "0"));
    }
    return hex;
  }

  function hasLoneSurrogate(str) {
    if (typeof str.isWellFormed === "function" && !str.isWellFormed()) return true;
    return LONE_SURROGATE.test(str);
  }

  function normalizeValue(raw) {
    if (typeof raw !== "string") return { ok: false, reason: "NOT_STRING", value: null };
    if (ILLEGAL_CONTROLS.test(raw) || hasLoneSurrogate(raw)) {
      return { ok: false, reason: "ILLEGAL_CHAR", value: null };
    }
    var out = raw.normalize("NFKC");
    out = out.replace(ZERO_WIDTH, "");
    out = out.replace(WHITESPACE, " ").trim();
    out = out.toUpperCase();
    out = out.replace(UNICODE_DASHES, "-");
    return { ok: true, reason: null, value: out };
  }

  function productBusinessKey(mpnNorm, brandNorm) {
    var canonical = "PBK1\n" +
      utf8Length(mpnNorm) + ":" + mpnNorm + "\n" +
      utf8Length(brandNorm) + ":" + brandNorm;
    return "pbk1_" + sha256Hex(canonical);
  }

  function normalizeIdentity(input) {
    input = input || {};
    var mpnRaw = input.mpn_raw === undefined ? input.mpn : input.mpn_raw;
    var brandRaw = input.brand_raw === undefined ? input.brand : input.brand_raw;

    var base = {
      mpn_raw: typeof mpnRaw === "string" ? mpnRaw : (mpnRaw == null ? null : String(mpnRaw)),
      mpn_norm: null,
      brand_raw: typeof brandRaw === "string" ? brandRaw : (brandRaw == null ? null : String(brandRaw)),
      brand_norm: null,
      normalizer_version: VERSION,
      product_business_key: null,
      identity_state: "INVALID",
      reason: null
    };

    var mpn = normalizeValue(mpnRaw);
    if (!mpn.ok || mpn.value === "") {
      base.reason = mpn.ok ? "EMPTY_MPN" : "INVALID_MPN";
      return base;
    }
    base.mpn_norm = mpn.value;

    if (brandRaw == null) {
      base.identity_state = "PENDING_BRAND";
      base.reason = "MISSING_BRAND";
      return base;
    }

    var brand = normalizeValue(brandRaw);
    if (!brand.ok) {
      base.reason = "INVALID_BRAND";
      return base;
    }
    base.brand_norm = brand.value;

    if (brand.value === "") {
      base.identity_state = "PENDING_BRAND";
      base.brand_norm = null;
      base.reason = "MISSING_BRAND";
      return base;
    }

    base.identity_state = "CONFIRMED";
    base.product_business_key = productBusinessKey(base.mpn_norm, base.brand_norm);
    return base;
  }

  function normalizeCandidates(candidates) {
    var normalized = (candidates || []).map(function (c) { return normalizeIdentity(c); });
    var distinctMpn = {};
    var distinctBrand = {};
    var distinctKeys = {};
    normalized.forEach(function (n) {
      if (n.mpn_norm) distinctMpn[n.mpn_norm] = true;
      if (n.brand_norm) distinctBrand[n.brand_norm] = true;
      if (n.product_business_key) distinctKeys[n.product_business_key] = true;
    });

    var state = "CONFIRMED";
    var reason = null;
    if (!normalized.length) {
      // No candidate carries an identity; never report CONFIRMED.
      state = "INVALID";
      reason = "NO_CANDIDATES";
    } else if (normalized.some(function (n) { return n.identity_state === "INVALID"; })) {
      state = "INVALID";
      reason = "INVALID_INPUT";
    } else if (Object.keys(distinctMpn).length > 1 ||
               Object.keys(distinctBrand).length > 1 ||
               Object.keys(distinctKeys).length > 1) {
      // Compare every usable MPN and Brand, including candidates still
      // missing a Brand: a mixed PENDING_BRAND candidate must not hide an
      // MPN conflict.
      state = "PENDING_CONFLICT";
      reason = "CONFLICTING_IDENTITY";
    } else if (normalized.some(function (n) { return n.identity_state === "PENDING_BRAND"; })) {
      state = "PENDING_BRAND";
      reason = "MISSING_BRAND";
    }

    return {
      identity_state: state,
      reason: reason,
      candidates: normalized,
      mpn_norms: Object.keys(distinctMpn),
      brand_norms: Object.keys(distinctBrand),
      keys: Object.keys(distinctKeys)
    };
  }

  return {
    VERSION: VERSION,
    normalizeValue: normalizeValue,
    normalizeIdentity: normalizeIdentity,
    normalizeCandidates: normalizeCandidates,
    productBusinessKey: productBusinessKey,
    sha256Hex: sha256Hex,
    utf8Length: utf8Length
  };
});

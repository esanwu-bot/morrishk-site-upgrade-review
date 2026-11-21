/*
 * Independent contract tests for the Session B Phase 1 contract-closure draft.
 *
 * Verifies, WITHOUT modifying any baseline artifact:
 *   1. baseline candidate file is byte-identical to the reviewed hash;
 *   2. the draft differs from baseline ONLY by added x-* keys (zero wire change);
 *   3. endpoint inventory unchanged (16 paths / 16 ops / 13 required / 3 optional);
 *   4. rule registry integrity (status vocabulary, blocker refs, CONFIRMED gating);
 *   5. every operation carries x-rule-status with resolvable ids;
 *   6. error catalog and critical patterns unchanged;
 *   7. B5-B8 and IQ-01/02/13 are represented in the registry.
 *
 * Run:  node --test tests/contract-rule-annotations.test.js   (from 25_ dir)
 */
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PKG = path.resolve(__dirname, "..");
const REVIEW_REPO = path.resolve(PKG, "..");
const BASELINE_PATH = path.join(REVIEW_REPO, "12_dsbit_business_api_integration_design", "contract", "openapi.candidate.v1.json");
const DRAFT_PATH = path.join(PKG, "contract", "openapi.candidate.v1.1-draft.json");
const REGISTRY_PATH = path.join(PKG, "rules", "rule_registry.json");

const BASELINE_SHA256 = "fdeec48ecf44439776e61245ca7b98fc94f7ce0d481a7c9aea639900f1e71023";
const STATUSES = ["CONFIRMED", "PROPOSED", "PENDING", "BLOCKED"];

const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
const draft = JSON.parse(fs.readFileSync(DRAFT_PATH, "utf8"));
const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));

function sha256File(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

// Recursively strip keys whose name starts with "x-" (case-insensitive).
function stripX(value) {
  if (Array.isArray(value)) return value.map(stripX);
  if (value && typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value)) {
      if (/^x-/i.test(k)) continue;
      out[k] = stripX(value[k]);
    }
    return out;
  }
  return value;
}

function opList(doc) {
  const ops = [];
  for (const p of Object.keys(doc.paths)) {
    for (const m of Object.keys(doc.paths[p])) {
      if (/^x-/i.test(m)) continue;
      ops.push({ path: p, method: m.toUpperCase(), op: doc.paths[p][m] });
    }
  }
  return ops;
}

test("T01 baseline candidate is byte-identical to reviewed hash (12_ untouched)", () => {
  assert.equal(sha256File(BASELINE_PATH), BASELINE_SHA256);
});

test("T02 draft keeps x-contract-status = CANDIDATE_NOT_FROZEN and OpenAPI 3.1.0", () => {
  assert.equal(draft["x-contract-status"], "CANDIDATE_NOT_FROZEN");
  assert.equal(draft.openapi, "3.1.0");
  assert.ok(draft["x-rule-registry"]);
});

test("T03 zero wire-shape change: stripping all x-* keys from draft deep-equals baseline", () => {
  assert.deepEqual(stripX(draft), stripX(baseline));
  // and the baseline has no x-rule-registry (i.e. we only ADDED x-*)
  assert.equal(baseline["x-rule-registry"], undefined);
});

test("T04 endpoint inventory unchanged: 16 paths / 16 ops / 13 required / 3 optional", () => {
  const paths = Object.keys(draft.paths);
  assert.equal(paths.length, 16);
  const ops = opList(draft);
  assert.equal(ops.length, 16);
  const required = ops.filter((o) => (o.op["x-endpoint-status"] || "V1_REQUIRED") === "V1_REQUIRED");
  const optional = ops.filter((o) => o.op["x-endpoint-status"] === "V1_OPTIONAL");
  assert.equal(required.length, 13);
  assert.equal(optional.length, 3);
  assert.equal(draft["x-contract-status"], baseline["x-contract-status"]);
});

test("T05 registry statuses use the fixed vocabulary only", () => {
  assert.ok(registry.rules.length >= 50, "registry should cover the full rule set");
  for (const r of registry.rules) {
    assert.ok(STATUSES.includes(r.status), `rule ${r.id} status ${r.status} not in vocabulary`);
    assert.equal(typeof r.title, "string");
    assert.ok(Array.isArray(r.source) && r.source.length > 0, `rule ${r.id} must cite source`);
  }
});

test("T06 BLOCKED rules must cite at least one known blocker; PENDING must cite blockers too", () => {
  const known = new Set(registry.blocker_refs_known);
  for (const r of registry.rules) {
    if (r.status === "BLOCKED" || r.status === "PENDING") {
      assert.ok(r.blockers.length > 0, `rule ${r.id} (${r.status}) must cite blockers`);
      for (const b of r.blockers) {
        assert.ok(known.has(b), `rule ${r.id} cites unknown blocker ${b}`);
      }
    }
  }
});

test("T07 CONFIRMED rules must cite a registered ruling / verified fact, never only design prose", () => {
  const confirmed = registry.rules.filter((r) => r.status === "CONFIRMED");
  assert.ok(confirmed.length >= 8, "expected the IQ-01/02/13 + fixture + boundary rules to be CONFIRMED");
  for (const r of confirmed) {
    const src = r.source.join(" ");
    const rulingEvidence = /DECISION_REGISTER|IQ-0[1239] ruling|handover mandate|recovery report|ACCEPTANCE_PACKAGE|FREEZE_READINESS|absent|DEMO/i;
    assert.ok(rulingEvidence.test(src), `rule ${r.id} CONFIRMED but source lacks ruling/fact citation: ${src}`);
  }
  // A CONFIRMED rule must also carry a "verified fact / registered ruling" note.
  for (const r of confirmed) {
    assert.ok(
      /unsigned|UNSIGNED|Verified fact|registered ruling|Registered ruling|not a target|never shared|Mock-only|DEMO/i.test(r.notes || ""),
      `rule ${r.id} CONFIRMED but notes lack verification caveat`
    );
  }
});

test("T08 every operation carries x-rule-status with resolvable rule ids", () => {
  const ids = new Set(registry.rules.map((r) => r.id).concat(registry.blocker_refs_known));
  const ops = opList(draft);
  assert.equal(ops.length, 16);
  for (const { path: p, method, op } of ops) {
    const ann = op["x-rule-status"];
    assert.ok(ann && Array.isArray(ann.rule_ids) && ann.rule_ids.length > 0, `missing x-rule-status on ${method} ${p}`);
    for (const id of ann.rule_ids) {
      assert.ok(ids.has(id), `${method} ${p} references unknown rule ${id}`);
    }
  }
});

test("T09 error catalog unchanged: 20 error_keys in ErrorMeta enum", () => {
  const keys = draft.components.schemas.ErrorMeta.properties.error_key.enum;
  assert.equal(keys.length, 20);
  assert.equal(keys.length, baseline.components.schemas.ErrorMeta.properties.error_key.enum.length);
  assert.deepEqual(keys, baseline.components.schemas.ErrorMeta.properties.error_key.enum);
});

test("T10 x-open-blockers preserved exactly from baseline (6 entries)", () => {
  assert.deepEqual(draft["x-open-blockers"], baseline["x-open-blockers"]);
  const ids = draft["x-open-blockers"].map((b) => b.id);
  assert.deepEqual(ids, ["IQ-05", "IQ-09", "IQ-15", "IQ-21", "MPN-NORM-v1", "VISIBLE-STATE-RECONCILIATION"]);
});

test("T11 critical patterns unchanged: pbk1 / req_ / tax_ / cat_ / ev_", () => {
  const s = draft.components.schemas;
  assert.equal(s.ProductBusinessKey.pattern, "^pbk1_[0-9a-f]{64}$");
  assert.equal(s.RequestId.pattern, "^req_[0-9A-HJKMNP-TV-Z]{26}$");
  assert.equal(s.TaxonomyId.pattern, "^tax_[0-9A-HJKMNP-TV-Z]{26}$");
  assert.equal(s.CategoryId.pattern, "^cat_[0-9A-HJKMNP-TV-Z]{26}$");
  assert.equal(s.EvidenceItem.properties.evidence_id.pattern, "^ev_[0-9A-HJKMNP-TV-Z]{26}$");
});

test("T12 B5-B8 are represented as blocked/proposed rules", () => {
  for (const b of ["B5", "B6", "B7", "B8"]) {
    const hits = registry.rules.filter((r) => r.blockers.includes(b));
    assert.ok(hits.length > 0, `blocker ${b} not referenced by any rule`);
    assert.ok(hits.some((r) => r.status === "BLOCKED" || r.status === "PROPOSED"), `${b} must gate a BLOCKED/PROPOSED rule`);
  }
  // B5 -> PROPOSED (freeze-pending), B6/B7/B8 -> BLOCKED somewhere
  assert.ok(registry.rules.some((r) => r.id === "R-ID-05" && r.blockers.includes("B5")));
  assert.ok(registry.rules.some((r) => r.id === "R-ST-02" && r.status === "BLOCKED" && r.blockers.includes("B6")));
  assert.ok(registry.rules.some((r) => r.id === "R-DIC-02" && r.status === "BLOCKED" && r.blockers.includes("B7")));
  assert.ok(registry.rules.some((r) => r.id === "R-EV-02" && r.status === "BLOCKED" && r.blockers.includes("B8")));
});

test("T13 IQ-01/02/13 ruling directions are present as CONFIRMED rules with unsigned caveat", () => {
  for (const id of ["R-ID-01", "R-TAX-01", "R-GLOB-03"]) {
    const r = registry.rules.find((x) => x.id === id);
    assert.ok(r, `missing ${id}`);
    assert.equal(r.status, "CONFIRMED");
    assert.match(r.notes, /unsigned|Registered ruling|UNSIGNED/i);
  }
});

test("T14 no rule is simultaneously CONFIRMED and blocked", () => {
  for (const r of registry.rules) {
    if (r.status === "CONFIRMED") {
      assert.equal(r.blockers.length, 0, `rule ${r.id} is CONFIRMED but cites blockers ${r.blockers}`);
    }
  }
});

test("T15 draft does not claim freeze: no FROZEN status anywhere in x-* governance fields", () => {
  assert.equal(draft["x-contract-status"], "CANDIDATE_NOT_FROZEN");
  const reg = JSON.stringify(draft["x-rule-registry-note"]);
  assert.match(reg, /CANDIDATE_NOT_FROZEN/);
  assert.doesNotMatch(reg, /contract is frozen|Contract Freeze approved/i);
});

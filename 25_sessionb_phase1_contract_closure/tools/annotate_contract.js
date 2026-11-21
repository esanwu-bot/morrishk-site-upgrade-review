#!/usr/bin/env node
/*
 * annotate_contract.js — Session B Phase 1 contract-closure generator.
 *
 * Reads the BASELINE candidate (12_/contract/openapi.candidate.v1.json, read-only)
 * and the rule registry (rules/rule_registry.json), and emits
 * contract/openapi.candidate.v1.1-draft.json which differs from the baseline
 * ONLY by added keys whose name starts with "x-" (top-level registry plus
 * per-operation x-rule-status). Stripping every "x-" key recursively from the
 * draft must yield a deep-equal of the baseline — tests enforce this.
 *
 * Boundary: does NOT modify any 12_/14_/15_/16_ file. Output lives only in 25_.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const PKG = path.resolve(__dirname, "..");
const REVIEW_REPO = path.resolve(PKG, "..");
const BASELINE_PATH = path.join(
  REVIEW_REPO,
  "12_dsbit_business_api_integration_design",
  "contract",
  "openapi.candidate.v1.json"
);
const REGISTRY_PATH = path.join(PKG, "rules", "rule_registry.json");
const OUT_PATH = path.join(PKG, "contract", "openapi.candidate.v1.1-draft.json");

// Per-operation rule references. Values are registry rule ids.
const OP_RULES = {
  "POST /oauth/token": ["R-OA-01", "R-OA-02", "R-OA-03", "R-OA-04", "R-OA-06", "R-ENV-03"],
  "GET /products/search": [
    "R-ID-01", "R-ID-02", "R-ID-03", "R-ID-04", "R-ID-05", "R-ID-06", "R-ID-07", "R-ID-08", "R-ID-09",
    "R-ST-03", "R-ST-04", "R-ST-05", "R-ST-06",
    "R-PRD-01", "R-PRD-02", "R-ENV-01", "R-ENV-02", "R-ENV-03", "R-ENV-04", "R-ENV-05",
    "R-PTG-01", "R-PTG-02", "R-VER-02", "R-TRC-01", "R-OA-05"
  ],
  "GET /products/{product_business_key}": [
    "R-ID-01", "R-ID-06", "R-ST-06", "R-PRD-01", "R-PRD-03", "R-ENV-01", "R-ENV-04", "R-ENV-05",
    "R-VER-01", "R-VER-02", "R-TRC-01", "R-OA-05"
  ],
  "GET /products/{product_business_key}/status": [
    "R-ST-01", "R-ST-02", "R-ST-03", "R-ST-06", "R-PRD-01", "R-OA-05", "R-ENV-01", "R-TRC-01"
  ],
  "GET /products/{product_business_key}/versions": [
    "R-VER-01", "R-PTG-01", "R-OA-05", "R-ENV-01", "R-TRC-01"
  ],
  "GET /products/{product_business_key}/evidence": [
    "R-EV-01", "R-EV-02", "R-EV-03", "R-PTG-02", "R-OA-05", "R-ENV-01", "R-TRC-01"
  ],
  "GET /products/{product_business_key}/categories": [
    "R-TAX-01", "R-TAX-03", "R-ST-05", "R-ST-06", "R-OA-05", "R-ENV-01", "R-TRC-01"
  ],
  "GET /taxonomies": ["R-TAX-01", "R-TAX-03", "R-TAX-04", "R-PTG-01", "R-OA-05", "R-ENV-01"],
  "GET /taxonomies/{taxonomy_id}": ["R-TAX-03", "R-TAX-04", "R-OA-05", "R-ENV-01", "R-VER-02"],
  "GET /taxonomies/{taxonomy_id}/version": ["R-VER-01", "R-TAX-04", "R-OA-05", "R-ENV-01", "R-VER-02"],
  "GET /taxonomies/{taxonomy_id}/categories": [
    "R-TAX-01", "R-TAX-03", "R-TAX-04", "R-TAX-05", "R-TAX-07", "R-SRT-01", "R-PTG-01", "R-OA-05", "R-ENV-01"
  ],
  "GET /taxonomies/{taxonomy_id}/changes": ["R-TAX-08", "R-VER-01", "R-PTG-01", "R-OA-05", "R-ENV-01"],
  "GET /categories/{category_id}": [
    "R-TAX-04", "R-TAX-05", "R-TAX-06", "R-ENV-01", "R-VER-02", "R-OA-05", "R-TRC-01"
  ],
  "GET /categories/{category_id}/children": ["R-TAX-04", "R-TAX-07", "R-PTG-01", "R-OA-05", "R-ENV-01"],
  "GET /categories/{category_id}/ancestors": ["R-TAX-04", "R-TAX-07", "R-OA-05", "R-ENV-01"],
  "GET /categories/{category_id}/products": ["R-TAX-06", "R-ST-05", "R-PTG-01", "R-OA-05", "R-ENV-01"]
};

// Per-schema rule references (core schemas only; components-level annotation).
const SCHEMA_RULES = {
  ProductBusinessKey: ["R-ID-06"],
  Identity: ["R-ID-01", "R-ID-03", "R-ID-04", "R-ID-07"],
  IdentityState: ["R-ID-04"],
  VisibleState: ["R-ST-03"],
  EnvelopeBase: ["R-ENV-01"],
  ErrorEnvelope: ["R-ENV-02"],
  ErrorMeta: ["R-ENV-03"],
  Product: ["R-PRD-01", "R-PRD-02", "R-PRD-03"],
  ProductStatus: ["R-ST-01", "R-ST-02", "R-ST-03"],
  Gate: ["R-ST-02"],
  Release: ["R-ST-06"],
  TechnicalParameter: ["R-DIC-01", "R-DIC-04"],
  EvidenceItem: ["R-EV-01", "R-EV-02"],
  Taxonomy: ["R-TAX-03", "R-TAX-04"],
  CategoryNode: ["R-TAX-04", "R-TAX-05"],
  CategoryDetail: ["R-TAX-06", "P1-3"],
  CategoryEdges: ["R-TAX-03"],
  TokenResponse: ["R-OA-02", "P1-8"],
  OAuthError: ["R-OA-04", "P1-6"],
  PageMeta: ["R-PTG-01", "R-PTG-02"]
};

// Parameter-level references.
const PARAM_RULES = {
  MpnMatch: ["R-ID-09"],
  ReleaseStateFilter: ["R-ST-04"],
  IdentityStateFilter: ["R-ID-04", "R-OA-05"],
  InternalOnly: ["R-OA-05"],
  IncludeUnreleased: ["R-OA-05"],
  Limit: ["R-PTG-01"],
  Cursor: ["R-PTG-01"],
  StatusFilter: ["R-TAX-04"]
};

function fail(msg) {
  console.error("ERROR: " + msg);
  process.exit(1);
}

function opKey(method, p) {
  return method.toUpperCase() + " " + p;
}

function main() {
  const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));

  const ruleIds = new Set(registry.rules.map(function (r) { return r.id; }));
  const draft = JSON.parse(JSON.stringify(baseline)); // deep copy

  // ---- sanity: referenced rule ids must exist (allow explicit DIFF refs too)
  const allowed = new Set(Array.from(ruleIds).concat(registry.blocker_refs_known));
  const unknown = [];
  Object.keys(OP_RULES).forEach(function (k) {
    OP_RULES[k].forEach(function (id) { if (!allowed.has(id)) unknown.push(k + "->" + id); });
  });
  if (unknown.length) fail("unknown rule refs: " + unknown.join(", "));

  // ---- 1) top-level machine-readable registry (x-* only)
  draft["x-rule-registry"] = {
    registry_id: registry.registry_id,
    registry_version: registry.registry_version,
    generated_by: "25_sessionb_phase1_contract_closure/tools/annotate_contract.js",
    baseline_sha256_note: "Baseline: 12_/contract/openapi.candidate.v1.json sha256 fdeec48ecf44439776e61245ca7b98fc94f7ce0d481a7c9aea639900f1e71023 (unmodified)",
    status_vocabulary: registry.status_vocabulary,
    rule_count: registry.rules.length,
    rules: registry.rules.map(function (r) {
      return {
        id: r.id, area: r.area, title: r.title, status: r.status,
        blockers: r.blockers, source: r.source, notes: r.notes
      };
    })
  };
  draft["x-rule-registry-note"] =
    "NON-WIRE metadata. Statuses: CONFIRMED=registered ruling/verified fact (R-ID/R-TAX/R-DIC-03/R-EV-03/R-GLOB: IQ-01/02/13 rulings are REGISTERED but UNSIGNED; independent acceptance NOT done). " +
    "PROPOSED=candidate-level design pending review-freeze. PENDING=awaiting maintainer/adjudication. BLOCKED=blocked by open IQ/B5-B8/P0 items. " +
    "This file is NOT a frozen contract and MUST keep x-contract-status=CANDIDATE_NOT_FROZEN.";

  // ---- 2) per-operation x-rule-status
  let annotatedOps = 0;
  Object.keys(draft.paths || {}).forEach(function (p) {
    Object.keys(draft.paths[p]).forEach(function (m) {
      if (m.startsWith("x-")) return;
      const op = draft.paths[p][m];
      if (!op || typeof op !== "object") return;
      const key = opKey(m, p);
      const rules = OP_RULES[key];
      if (!rules) fail("no OP_RULES entry for operation: " + key);
      op["x-rule-status"] = {
        rule_ids: rules,
        registry: "#/x-rule-registry",
        note: "NON-WIRE annotation; see x-rule-registry for status/blockers/source."
      };
      annotatedOps += 1;
    });
  });

  // ---- 3) per-schema / per-parameter annotations
  let annotatedSchemas = 0;
  Object.keys(SCHEMA_RULES).forEach(function (name) {
    const s = (draft.components && draft.components.schemas && draft.components.schemas[name]) || null;
    if (!s) fail("SCHEMA_RULES references missing schema: " + name);
    s["x-rule-status"] = { rule_ids: SCHEMA_RULES[name], registry: "#/x-rule-registry" };
    annotatedSchemas += 1;
  });
  let annotatedParams = 0;
  Object.keys(PARAM_RULES).forEach(function (name) {
    const prm = (draft.components && draft.components.parameters && draft.components.parameters[name]) || null;
    if (!prm) fail("PARAM_RULES references missing parameter: " + name);
    prm["x-rule-status"] = { rule_ids: PARAM_RULES[name], registry: "#/x-rule-registry" };
    annotatedParams += 1;
  });

  // ---- 4) guard: x-contract-status untouched
  if (draft["x-contract-status"] !== "CANDIDATE_NOT_FROZEN") {
    fail("x-contract-status must remain CANDIDATE_NOT_FROZEN");
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(draft, null, 2) + "\n", "utf8");
  console.log("written: " + OUT_PATH);
  console.log("ops annotated: " + annotatedOps + " (expect 16)");
  console.log("schemas annotated: " + annotatedSchemas);
  console.log("parameters annotated: " + annotatedParams);
  console.log("registry rules: " + registry.rules.length);
}

main();

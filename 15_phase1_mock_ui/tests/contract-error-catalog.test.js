"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..");
const CONTRACT_JSON = path.join(
  ROOT,
  "12_dsbit_business_api_integration_design",
  "contract",
  "openapi.candidate.v1.json"
);
const CONTRACT_MD = path.join(
  ROOT,
  "12_dsbit_business_api_integration_design",
  "API_CONTRACT_CANDIDATE_v1.md"
);
const MOCK_API_JS = path.join(__dirname, "..", "assets", "mock-api.js");

const doc = JSON.parse(fs.readFileSync(CONTRACT_JSON, "utf8"));

// HTTP status -> response component name used by the candidate.
const COMPONENT_BY_HTTP = {
  "400": "BadRequest",
  "401": "Unauthorized",
  "403": "Forbidden",
  "404": "NotFound",
  "409": "Conflict",
  "410": "Gone",
  "413": "PayloadTooLarge",
  "422": "Unprocessable",
  "429": "RateLimited",
  "500": "InternalError",
  "503": "Unavailable"
};

function markdownSection(source, heading) {
  const start = source.indexOf(heading);
  assert.notEqual(start, -1, "missing markdown section: " + heading);
  const rest = source.slice(start + heading.length);
  const end = rest.indexOf("\n### ");
  return end === -1 ? rest : rest.slice(0, end);
}

function parseCatalogTable() {
  const section = markdownSection(fs.readFileSync(CONTRACT_MD, "utf8"), "### 7.2");
  const rows = [];
  for (const line of section.split(/\r?\n/)) {
    const m = line.match(
      /^\|\s*(\d{3})\s*\|\s*(\d+)\s*\|\s*`([A-Z][A-Z0-9_]*)`\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/
    );
    if (!m) continue;
    rows.push({
      http: m[1],
      code: Number(m[2]),
      key: m[3],
      retryable: m[4],
      degradedAllowed: m[5]
    });
  }
  return rows;
}

function parseComponentKeys(description) {
  const keys = new Set();
  for (const m of description.matchAll(/\b([A-Z][A-Z0-9_]{3,})\b/g)) keys.add(m[1]);
  return keys;
}

function parseMockTriples(source) {
  const triples = [];
  const simple =
    /errorEnvelope\(\s*(\d{3})\s*,\s*(\d+)\s*,\s*"[^"]*"\s*,\s*"([A-Z][A-Z0-9_]*)"/g;
  for (const m of source.matchAll(simple)) {
    triples.push({ http: m[1], code: Number(m[2]), key: m[3] });
  }
  const block =
    /envelope\(\s*(\d{3})\s*,\s*\{\s*code:\s*(\d+),[\s\S]{0,1500}?error_key:\s*"([A-Z][A-Z0-9_]*)"/g;
  for (const m of source.matchAll(block)) {
    triples.push({ http: m[1], code: Number(m[2]), key: m[3] });
  }
  const seen = new Set();
  return triples.filter((t) => {
    const id = t.http + "/" + t.code + "/" + t.key;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

const catalogRows = parseCatalogTable();
const errorRows = catalogRows.filter((r) => r.code !== 0);
const successRows = catalogRows.filter((r) => r.code === 0);
const errorMetaEnum = doc.components.schemas.ErrorMeta.properties.error_key.enum;

function pathsDeclaring(status) {
  const hits = [];
  for (const p of Object.keys(doc.paths)) {
    for (const m of Object.keys(doc.paths[p])) {
      const responses = doc.paths[p][m].responses || {};
      if (Object.prototype.hasOwnProperty.call(responses, status)) hits.push(m + " " + p);
    }
  }
  return hits;
}

test("markdown catalog table parses to 20 error rows plus 2 success rows", () => {
  assert.equal(errorRows.length, 20);
  assert.deepEqual(
    successRows.map((r) => r.key).sort(),
    ["NOT_MODIFIED", "OK"]
  );
  assert.ok(errorRows.every((r) => Object.hasOwn(COMPONENT_BY_HTTP, r.http)));
});

test("catalog error codes and keys are unique", () => {
  assert.equal(new Set(errorRows.map((r) => r.code)).size, errorRows.length);
  assert.equal(new Set(errorRows.map((r) => r.key)).size, errorRows.length);
});

test("integer code encodes its HTTP status (http * 100 + sequence)", () => {
  for (const row of errorRows) {
    assert.equal(Math.floor(row.code / 100), Number(row.http), row.key);
    assert.match(String(row.code), new RegExp("^" + row.http + "\\d{2}$"), row.key);
  }
});

test("markdown error_key set equals the OpenAPI ErrorMeta enum", () => {
  assert.deepEqual(
    errorRows.map((r) => r.key).sort(),
    [...errorMetaEnum].sort()
  );
});

test("each HTTP status maps to one response component carrying ErrorEnvelope", () => {
  const statuses = [...new Set(errorRows.map((r) => r.http))].sort();
  assert.deepEqual(statuses, Object.keys(COMPONENT_BY_HTTP).sort());
  for (const status of statuses) {
    const name = COMPONENT_BY_HTTP[status];
    const component = doc.components.responses[name];
    assert.ok(component, "missing response component " + name);
    const schema = component.content["application/json"].schema;
    assert.equal(schema.$ref, "#/components/schemas/ErrorEnvelope", name);
  }
});

test("response component descriptions list exactly the catalog keys for their status", () => {
  for (const status of Object.keys(COMPONENT_BY_HTTP)) {
    const expected = errorRows.filter((r) => r.http === status).map((r) => r.key).sort();
    const described = [...parseComponentKeys(doc.components.responses[COMPONENT_BY_HTTP[status]].description)].sort();
    assert.deepEqual(described, expected, "status " + status);
  }
});

// 409 is reserved for future write endpoints (section 6.3 / 7.8); it is the only
// catalog status v1 read operations do not declare, and that must stay explicit.
const RESERVED_STATUSES = new Set(["409"]);

test("every catalog error is wired into at least one operation response", () => {
  const unwired = [];
  for (const row of errorRows) {
    if (RESERVED_STATUSES.has(row.http)) continue;
    const hits = pathsDeclaring(row.http);
    if (hits.length === 0) {
      unwired.push(row.http + " " + row.key);
      continue;
    }
    const declared = doc.components.responses[COMPONENT_BY_HTTP[row.http]];
    assert.ok(
      parseComponentKeys(declared.description).has(row.key),
      row.key + " not declared by component " + COMPONENT_BY_HTTP[row.http]
    );
  }
  assert.deepEqual(unwired, []);
});

test("unwired statuses are exactly the documented reserved set", () => {
  const unwiredStatuses = Object.keys(COMPONENT_BY_HTTP).filter((s) => pathsDeclaring(s).length === 0);
  assert.deepEqual(unwiredStatuses, [...RESERVED_STATUSES]);
  const md = fs.readFileSync(CONTRACT_MD, "utf8");
  assert.match(md, /`409 \/ 40901 VERSION_CONFLICT`[^\n]*不会触发/);
});

test("revocation is declared non-retryable and cache display is forbidden", () => {
  const revoked = errorRows.find((r) => r.key === "PRODUCT_RELEASE_REVOKED");
  assert.ok(revoked);
  assert.equal(revoked.code, 41001);
  assert.equal(revoked.http, "410");
  assert.match(revoked.retryable, /否/);
  assert.match(revoked.degradedAllowed, /否/);
  assert.match(doc.components.responses.Gone.description, /forbids cache/i);
});

test("each business operation references the catalog component for its status", () => {
  const mismatches = [];
  let checked = 0;
  for (const p of Object.keys(doc.paths)) {
    for (const m of Object.keys(doc.paths[p])) {
      if (m === "post" && p === "/oauth/token") continue;
      const responses = doc.paths[p][m].responses;
      for (const status of Object.keys(responses)) {
        if (!Object.hasOwn(COMPONENT_BY_HTTP, status)) continue; // 200 / 304 are not errors
        checked += 1;
        const expected = "#/components/responses/" + COMPONENT_BY_HTTP[status];
        const actual = responses[status].$ref;
        if (actual !== expected) {
          mismatches.push(m.toUpperCase() + " " + p + " " + status + ": " + actual + " != " + expected);
        }
      }
    }
  }
  assert.deepEqual(mismatches, []);
  assert.ok(checked >= 50, "expected at least 50 operation/status refs, saw " + checked);
});

test("OAuth token endpoint keeps RFC 6749 errors out of the business envelope", () => {
  const token = doc.paths["/oauth/token"].post.responses;
  for (const status of ["400", "401"]) {
    assert.equal(token[status].$ref, undefined, status);
    assert.equal(
      token[status].content["application/json"].schema.$ref,
      "#/components/schemas/OAuthError",
      status
    );
  }
  assert.equal(token["429"].$ref, "#/components/responses/RateLimited");
  assert.equal(token["500"].$ref, "#/components/responses/InternalError");
  for (const status of ["403", "404", "409", "410", "413", "422", "503"]) {
    assert.equal(Object.hasOwn(token, status), false, "token must not reuse business status " + status);
  }
});

test("mock API error triples match the catalog exactly", () => {
  const triples = parseMockTriples(fs.readFileSync(MOCK_API_JS, "utf8"));
  assert.ok(triples.length >= 10, "expected at least 10 distinct mock error triples");
  const index = new Map(errorRows.map((r) => [r.http + "/" + r.code + "/" + r.key, r]));
  for (const t of triples) {
    const id = t.http + "/" + t.code + "/" + t.key;
    assert.ok(index.has(id), "mock triple not in catalog: " + id);
  }
  // Each catalog key the mock implements must use the same HTTP status and integer code.
  const mockKeys = new Set(triples.map((t) => t.key));
  for (const key of mockKeys) {
    const catalogRowsForKey = errorRows.filter((r) => r.key === key);
    assert.equal(catalogRowsForKey.length, 1, key);
    const mockCodes = new Set(triples.filter((t) => t.key === key).map((t) => t.http + "/" + t.code));
    assert.deepEqual([...mockCodes], [catalogRowsForKey[0].http + "/" + catalogRowsForKey[0].code], key);
  }
});
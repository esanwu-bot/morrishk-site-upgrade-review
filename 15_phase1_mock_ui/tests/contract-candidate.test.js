"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "12_dsbit_business_api_integration_design",
  "contract",
  "openapi.candidate.v1.json"
);

const doc = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8"));

const REQUIRED_OPERATIONS = [
  "post /oauth/token",
  "get /products/search",
  "get /products/{product_business_key}",
  "get /products/{product_business_key}/status",
  "get /products/{product_business_key}/versions",
  "get /products/{product_business_key}/evidence",
  "get /products/{product_business_key}/categories",
  "get /taxonomies",
  "get /taxonomies/{taxonomy_id}",
  "get /taxonomies/{taxonomy_id}/version",
  "get /taxonomies/{taxonomy_id}/categories",
  "get /categories/{category_id}",
  "get /categories/{category_id}/children"
];

const OPTIONAL_OPERATIONS = [
  "get /taxonomies/{taxonomy_id}/changes",
  "get /categories/{category_id}/ancestors",
  "get /categories/{category_id}/products"
];

function operations() {
  const out = [];
  for (const p of Object.keys(doc.paths)) {
    for (const m of Object.keys(doc.paths[p])) {
      out.push(m + " " + p);
    }
  }
  return out;
}

test("contract candidate is OpenAPI 3.1 and explicitly not frozen", () => {
  assert.equal(doc.openapi, "3.1.0");
  assert.equal(doc["x-contract-status"], "CANDIDATE_NOT_FROZEN");
  assert.equal(doc.info.version, "1.0.0-candidate");
  assert.match(doc.info.description, /NOT frozen/i);
});

test("required endpoint inventory is exactly the reviewed set", () => {
  const all = operations();
  const required = all.filter((op) => {
    const [m, p] = op.split(" ");
    return (doc.paths[p][m]["x-endpoint-status"] || "V1_REQUIRED") === "V1_REQUIRED";
  });
  const optional = all.filter((op) => {
    const [m, p] = op.split(" ");
    return doc.paths[p][m]["x-endpoint-status"] === "V1_OPTIONAL";
  });

  assert.equal(required.length, 13);
  assert.equal(optional.length, 3);
  assert.deepEqual(required.sort(), REQUIRED_OPERATIONS.slice().sort());
  assert.deepEqual(optional.sort(), OPTIONAL_OPERATIONS.slice().sort());
});

test("every required operation is a GET except the token endpoint", () => {
  for (const op of REQUIRED_OPERATIONS) {
    if (op === "post /oauth/token") continue;
    assert.ok(op.startsWith("get "), op + " must be a read-only GET");
  }
});

test("operationIds are unique and every operation documents responses", () => {
  const seen = new Set();
  for (const op of operations()) {
    const [m, p] = op.split(" ");
    const operation = doc.paths[p][m];
    assert.ok(operation.operationId, op + " missing operationId");
    assert.ok(!seen.has(operation.operationId), "duplicate operationId " + operation.operationId);
    seen.add(operation.operationId);
    assert.ok(operation.responses && Object.keys(operation.responses).length > 0, op + " has no responses");
  }
});

test("all non-token operations declare the oauth2 security scheme", () => {
  for (const op of operations()) {
    if (op === "post /oauth/token") continue;
    const [m, p] = op.split(" ");
    const operation = doc.paths[p][m];
    assert.ok(Array.isArray(operation.security), op + " missing security");
    assert.equal(operation.security[0].oauth2[0].split(".")[0], "product", op + " wrong scheme");
  }
  assert.deepEqual(doc.paths["/oauth/token"].post.security, []);
});

test("oauth2 clientCredentials defines exactly the five documented scopes", () => {
  const scheme = doc.components.securitySchemes.oauth2;
  assert.equal(scheme.type, "oauth2");
  const scopes = Object.keys(scheme.flows.clientCredentials.scopes);
  assert.deepEqual(
    scopes.sort(),
    [
      "product.category.read",
      "product.evidence.read",
      "product.publish.read",
      "product.read",
      "product.version.read"
    ]
  );
});

test("business responses use the code/message/data/request_id/meta envelope", () => {
  const base = doc.components.schemas.EnvelopeBase;
  assert.deepEqual(base.required, ["code", "message", "data", "request_id", "meta"]);
  const error = doc.components.schemas.ErrorEnvelope;
  assert.ok(Array.isArray(error.allOf) && error.allOf.length === 2);
});

test("error meta requires error_key, retryable and degraded_allowed", () => {
  const meta = doc.components.schemas.ErrorMeta;
  assert.deepEqual(meta.required, ["error_key", "retryable", "degraded_allowed"]);
});

test("error catalog exposes all 20 stable error keys", () => {
  const keys = doc.components.schemas.ErrorMeta.properties.error_key.enum;
  assert.equal(keys.length, 20);
  for (const k of [
    "PRODUCT_NOT_RELEASED",
    "PRODUCT_RELEASE_REVOKED",
    "CATEGORY_RETIRED",
    "PRODUCT_IDENTITY_INCOMPLETE",
    "MPN_NORMALIZATION_CONFLICT",
    "TREE_TOO_LARGE",
    "RATE_LIMITED"
  ]) {
    assert.ok(keys.includes(k), "missing error key " + k);
  }
  const codeLists = doc.components.schemas.ErrorMeta.properties.error_key.enum;
  assert.equal(new Set(codeLists).size, codeLists.length, "duplicate error key");
});

test("product_business_key is pbk1 + full sha256 and cannot be a document id", () => {
  const key = doc.components.schemas.ProductBusinessKey;
  assert.equal(key.pattern, "^pbk1_[0-9a-f]{64}$");
  const re = new RegExp(key.pattern);
  assert.ok(re.test("pbk1_" + "a".repeat(64)));
  assert.ok(!re.test("doc_01J8N000000000000000000000"));
  assert.ok(!re.test("pbk1_" + "a".repeat(63)));
  assert.ok(!re.test("prd_" + "a".repeat(64)));
});

test("no product identity path or identity schema field uses document_id", () => {
  for (const p of Object.keys(doc.paths)) {
    if (p.startsWith("/products")) {
      assert.ok(!p.includes("document_id"), "document_id must not appear in product routes");
    }
  }
  const identity = doc.components.schemas.Identity;
  assert.ok(!Object.prototype.hasOwnProperty.call(identity.properties, "document_id"));
  assert.ok(Object.prototype.hasOwnProperty.call(identity.properties, "mpn_norm"));
  assert.ok(Object.prototype.hasOwnProperty.call(identity.properties, "brand_norm"));
  assert.ok(Object.prototype.hasOwnProperty.call(identity.properties, "normalizer_version"));
});

test("product DTO keeps identity, technical, categories and release layers separate", () => {
  const required = doc.components.schemas.Product.required;
  for (const field of ["identity", "technical", "categories", "documents", "release", "data_version"]) {
    assert.ok(required.includes(field), "Product.required missing " + field);
  }
  assert.ok(!required.includes("parameters"), "parameters must stay under technical");
});

test("release gates expose pipeline/content/release separately", () => {
  const gates = doc.components.schemas.ProductStatus.properties.gates;
  assert.deepEqual(gates.required, ["pipeline", "content", "release"]);
  assert.ok(doc.components.schemas.VisibleState.enum.includes("WITHDRAWN"));
  assert.ok(doc.components.schemas.VisibleState.enum.includes("RELEASED"));
});

test("open blockers are recorded and include the four Phase 0 items", () => {
  const ids = doc["x-open-blockers"].map((b) => b.id);
  for (const id of ["IQ-05", "IQ-09", "IQ-15", "IQ-21", "MPN-NORM-v1", "VISIBLE-STATE-RECONCILIATION"]) {
    assert.ok(ids.includes(id), "missing open blocker " + id);
  }
});

test("every open blocker is marked OPEN or PROPOSED, never decided", () => {
  for (const blocker of doc["x-open-blockers"]) {
    assert.ok(
      blocker.status === "OPEN" || blocker.status === "PROPOSED",
      blocker.id + " must not be represented as decided"
    );
  }
});

test("server placeholders cannot be mistaken for production endpoints", () => {
  const urls = doc.servers.map((s) => s.url);
  assert.ok(urls.some((u) => u.includes(".invalid")));
  for (const u of urls) {
    assert.ok(u.includes(".invalid") || u.startsWith("http://127.0.0.1"), "unexpected server " + u);
  }
});

test("token endpoint returns RFC 6749 fields, not the business envelope", () => {
  const token = doc.components.schemas.TokenResponse;
  assert.deepEqual(token.required, ["access_token", "token_type", "expires_in", "scope"]);
  assert.equal(token.properties.token_type.const, "Bearer");
  assert.equal(token.properties.expires_in.const, 900);
  assert.ok(!token.required.includes("code"));
});

test("products/search documents exact lookup and revoked sync stream", () => {
  const operation = doc.paths["/products/search"].get;
  const params = operation.parameters.map((p) => p.$ref || p.name);
  assert.ok(params.includes("#/components/parameters/Mpn"));
  assert.ok(params.includes("#/components/parameters/Brand"));
  assert.ok(params.includes("#/components/parameters/MpnMatch"));
  assert.ok(params.includes("#/components/parameters/ReleaseStateFilter"));
  const release = doc.components.parameters.ReleaseStateFilter.schema.enum;
  assert.deepEqual(release, ["RELEASED", "REVOKED", "PENDING"]);
});

test("product-category edges document the internal_only double-scope gate", () => {
  const operation = doc.paths["/products/{product_business_key}/categories"].get;
  const params = operation.parameters.map((p) => p.$ref || p.name);
  assert.ok(params.includes("#/components/parameters/InternalOnly"));
  assert.match(operation["x-special-gate"], /INSUFFICIENT_SCOPE/);
  const internal = doc.components.parameters.InternalOnly;
  assert.match(internal.description, /BOTH product\.category\.read and product\.publish\.read/);
});
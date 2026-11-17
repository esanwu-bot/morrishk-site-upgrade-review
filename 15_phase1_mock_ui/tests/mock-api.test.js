"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const MockApi = require("../assets/mock-api.js");
const products = require("../data/mock-products.json");
const dictionary = require("../data/mock-dictionary.json");
const taxonomies = require("../data/mock-taxonomies.json");

const KEY_RELEASED = "pbk1_e65e545a387d11dfccf729da568de66a33b78c892d6b6809347ceeb499eba88b";
const KEY_PENDING = "pbk1_f3be4832aee387479a44c81cf4f0be4e1ad52964fd2029c96b81bc94b3298d40";
const KEY_REVOKED = "pbk1_7de19c6b2d36dd692514dc2580af496a126795f386c351950789a9ef3ae83ec1";

function makeApi() {
  return MockApi.createApi({ products: products.products });
}

test("released product returns 200 with DEMO_FIXTURE identity", () => {
  const res = makeApi().getProduct(KEY_RELEASED);
  assert.equal(res.http_status, 200);
  assert.equal(res.body.code, 0);
  assert.equal(res.body.data.fixture, "DEMO_FIXTURE");
  assert.equal(res.body.data.product_business_key, KEY_RELEASED);
  assert.equal(res.body.data.identity.mpn_norm, "LM358DR");
  assert.equal(res.body.data.identity.brand_norm, "EXAMPLE SEMICONDUCTOR");
  assert.equal(res.body.meta.fixture, "DEMO_FIXTURE");
  assert.match(res.body.request_id, /^req_demo_\d{6}$/);
});

test("pending product returns 403 PRODUCT_NOT_RELEASED", () => {
  const res = makeApi().getProduct(KEY_PENDING);
  assert.equal(res.http_status, 403);
  assert.equal(res.body.code, 40302);
  assert.equal(res.body.meta.error_key, "PRODUCT_NOT_RELEASED");
  assert.equal(res.body.data.visible_state, "PENDING");
});

test("revoked product returns 410 PRODUCT_RELEASE_REVOKED", () => {
  const res = makeApi().getProduct(KEY_REVOKED);
  assert.equal(res.http_status, 410);
  assert.equal(res.body.code, 41001);
  assert.equal(res.body.meta.error_key, "PRODUCT_RELEASE_REVOKED");
  assert.equal(res.body.data.reason_code, "CONTENT_WITHDRAWN");
});

test("unknown product returns 404 PRODUCT_NOT_FOUND", () => {
  const res = makeApi().getProduct("pbk1_" + "0".repeat(64));
  assert.equal(res.http_status, 404);
  assert.equal(res.body.code, 40401);
  assert.equal(res.body.meta.error_key, "PRODUCT_NOT_FOUND");
});

test("missing brand preview returns 422 PRODUCT_IDENTITY_INCOMPLETE", () => {
  const res = makeApi().scenario("identity_missing_brand");
  assert.equal(res.http_status, 422);
  assert.equal(res.body.code, 42201);
  assert.equal(res.body.meta.error_key, "PRODUCT_IDENTITY_INCOMPLETE");
  assert.equal(res.body.data.identity_state, "PENDING_BRAND");
  assert.equal(res.body.data.product_business_key, null);
  assert.deepEqual(res.body.meta.missing, ["brand"]);
});

test("conflicting candidates return 422 MPN_NORMALIZATION_CONFLICT", () => {
  const res = makeApi().scenario("identity_conflict");
  assert.equal(res.http_status, 422);
  assert.equal(res.body.code, 42202);
  assert.equal(res.body.meta.error_key, "MPN_NORMALIZATION_CONFLICT");
  assert.equal(res.body.data.identity_state, "PENDING_CONFLICT");
});

test("generic error scenarios carry expected status and error_key", () => {
  const cases = [
    ["unauthorized", 401, "INVALID_TOKEN"],
    ["version_conflict", 409, "VERSION_CONFLICT"],
    ["rate_limited", 429, "RATE_LIMITED"],
    ["service_unavailable", 503, "SERVICE_UNAVAILABLE"]
  ];
  const api = makeApi();
  for (const [name, status, key] of cases) {
    const res = api.scenario(name);
    assert.equal(res.http_status, status, name);
    assert.equal(res.body.meta.error_key, key, name);
    assert.equal(res.body.data, null, name);
  }
});

test("search requires mpn", () => {
  const res = makeApi().searchProducts({ brand: "Example Semiconductor" });
  assert.equal(res.http_status, 400);
  assert.equal(res.body.meta.error_key, "INVALID_ARGUMENT");
  assert.equal(res.body.meta.field, "mpn");
});

test("search requires brand before matching", () => {
  const res = makeApi().searchProducts({ mpn: "LM358DR" });
  assert.equal(res.http_status, 422);
  assert.equal(res.body.code, 42201);
  assert.equal(res.body.meta.error_key, "PRODUCT_IDENTITY_INCOMPLETE");
});

test("search normalizes input and returns exact identity only", () => {
  const res = makeApi().searchProducts({
    mpn: "  lm358dr  ",
    brand: "example\u3000semiconductor",
    limit: 10
  });
  assert.equal(res.http_status, 200);
  assert.equal(res.body.meta.total, 1);
  assert.equal(res.body.data.items.length, 1);
  assert.equal(res.body.data.items[0].product_business_key, KEY_RELEASED);
  assert.equal(res.body.meta.next_cursor, null);
  assert.equal(res.body.meta.has_more, false);
});

test("search pagination cursor is offset-based and not a contract promise", () => {
  const res = makeApi().searchProducts({
    mpn: "LM358DR",
    brand: "Example Semiconductor",
    limit: 1,
    cursor: "demo_1"
  });
  assert.equal(res.http_status, 200);
  assert.equal(res.body.meta.total, 1);
  assert.equal(res.body.data.items.length, 0);
  assert.equal(res.body.meta.next_cursor, null);
});

test("dictionary and taxonomy getters are flagged as non-formal", () => {
  const api = makeApi();
  const dict = api.getDictionary(dictionary);
  assert.equal(dict.http_status, 200);
  assert.equal(dict.body.meta.fixture, "DEMO_FIXTURE");
  assert.equal(dict.body.meta.formal_dictionary, false);

  const tax = api.getTaxonomy(taxonomies.technical);
  assert.equal(tax.http_status, 200);
  assert.equal(tax.body.meta.fixture, "DEMO_FIXTURE");
  assert.equal(tax.body.meta.formal_taxonomy, false);
});

test("sync retries the same page and then succeeds", async () => {
  const events = [];
  const result = await makeApi().simulateSync({
    pageSize: 2,
    failAtPage: 2,
    maxRetries: 2,
    delayMs: 1,
    releaseState: "RELEASED",
    onEvent: (e) => events.push(e)
  });

  const shape = events.map((e) => [e.page, e.attempt, e.status]);
  assert.deepEqual(shape, [
    [1, 1, "OK"],
    [2, 1, "ERROR"],
    [2, 2, "ERROR"],
    [2, 3, "OK"],
    [2, 3, "DONE"]
  ]);
  assert.equal(events[0].count, 2);
  assert.equal(events[3].count, 2);
  assert.equal(events[1].error_key, "SERVICE_UNAVAILABLE");
  assert.equal(events[1].backoff_ms, 1);
  assert.match(events[4].note, /no production write/);
  assert.equal(result.release_state, "RELEASED");
  assert.equal(events.length, result.events.length);
});

test("sync discovers revoked releases when asked", async () => {
  const events = [];
  await makeApi().simulateSync({
    pageSize: 2,
    failAtPage: 0,
    maxRetries: 0,
    delayMs: 1,
    releaseState: "REVOKED",
    onEvent: (e) => events.push(e)
  });
  const ok = events.filter((e) => e.status === "OK");
  assert.equal(ok.length, 1);
  assert.equal(ok[0].count, 1);
  assert.deepEqual(ok[0].keys, [KEY_REVOKED]);
  assert.equal(events[events.length - 1].status, "DONE");
});

test("sync without injected failure still paginates and finishes", async () => {
  const events = [];
  await makeApi().simulateSync({
    pageSize: 2,
    failAtPage: 0,
    maxRetries: 0,
    delayMs: 1,
    releaseState: "RELEASED",
    onEvent: (e) => events.push(e)
  });
  const ok = events.filter((e) => e.status === "OK");
  assert.equal(ok.length, 2);
  assert.equal(ok[0].count, 2);
  assert.equal(ok[1].count, 2);
  assert.equal(ok[0].next_cursor, "demo_2");
  assert.equal(ok[1].next_cursor, null);
  assert.equal(events[events.length - 1].status, "DONE");
});

test("request ids are sequential and never reused", () => {
  const api = makeApi();
  const a = api.getProduct(KEY_RELEASED).body.request_id;
  const b = api.getProduct(KEY_RELEASED).body.request_id;
  assert.notEqual(a, b);
  const na = Number(a.replace("req_demo_", ""));
  const nb = Number(b.replace("req_demo_", ""));
  assert.equal(nb, na + 1);
});

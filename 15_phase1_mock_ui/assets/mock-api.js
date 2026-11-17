/*
 * Mock Business API simulator (DEMO ONLY).
 *
 * Shapes follow the future contract direction in 12_ (envelope, error_key,
 * product_business_key, cursor pagination), but this is a client-side
 * simulation over DEMO_FIXTURE data. It does not call any production API,
 * does not implement OAuth2, and must never be described as "connected".
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./mpn-normalizer.js"));
  } else {
    root.MockApi = factory(root.MpnNormalizer);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (Normalizer) {
  "use strict";

  var seq = 0;
  function nextRequestId() {
    seq += 1;
    return "req_demo_" + String(seq).padStart(6, "0");
  }

  function envelope(httpStatus, body) {
    return {
      http_status: httpStatus,
      body: Object.assign({
        code: 0,
        message: "ok",
        data: null,
        request_id: nextRequestId(),
        meta: {}
      }, body)
    };
  }

  function errorEnvelope(httpStatus, code, message, errorKey, meta) {
    return envelope(httpStatus, {
      code: code,
      message: message,
      data: null,
      meta: Object.assign({
        error_key: errorKey,
        retryable: false,
        degraded_allowed: false
      }, meta || {})
    });
  }

  function publicProduct(p) {
    return {
      product_business_key: p.product_business_key,
      identity_state: p.identity_state,
      identity: p.identity,
      visible_state: p.visible_state,
      release: p.release,
      technical: p.technical,
      categories: p.categories,
      documents: p.documents,
      platform: p.platform,
      updated_at: p.updated_at,
      fixture: "DEMO_FIXTURE"
    };
  }

  function createApi(dataset) {
    var products = dataset.products || [];

    function findByKey(key) {
      return products.filter(function (p) { return p.product_business_key === key; })[0] || null;
    }

    function getProduct(key) {
      var p = findByKey(key);
      if (!p) {
        return errorEnvelope(404, 40401, "Product not found", "PRODUCT_NOT_FOUND", {
          degraded_allowed: true,
          fixture: "DEMO_FIXTURE"
        });
      }
      if (p.identity_state === "PENDING_BRAND") {
        return envelope(422, {
          code: 42201,
          message: "Product identity is incomplete: brand cannot be resolved",
          data: {
            product_business_key: null,
            identity_state: p.identity_state,
            mpn_raw: p.identity.mpn_raw,
            mpn_norm: p.identity.mpn_norm,
            brand_raw: null,
            brand_norm: null,
            normalizer_version: p.identity.normalizer_version
          },
          meta: {
            error_key: "PRODUCT_IDENTITY_INCOMPLETE",
            retryable: false,
            degraded_allowed: false,
            missing: ["brand"],
            fixture: "DEMO_FIXTURE"
          }
        });
      }
      if (p.identity_state === "PENDING_CONFLICT") {
        return envelope(422, {
          code: 42202,
          message: "MPN normalization conflict",
          data: {
            product_business_key: null,
            identity_state: p.identity_state,
            mpn_raw: p.identity.mpn_raw,
            mpn_norm: p.identity.mpn_norm,
            conflicting_with: p.conflicting_with,
            brand_raw: p.identity.brand_raw,
            brand_norm: p.identity.brand_norm,
            normalizer_version: p.identity.normalizer_version
          },
          meta: {
            error_key: "MPN_NORMALIZATION_CONFLICT",
            retryable: false,
            degraded_allowed: false,
            conflict_source: ["document_sha256"],
            fixture: "DEMO_FIXTURE"
          }
        });
      }
      if (p.visible_state === "PENDING") {
        return envelope(403, {
          code: 40302,
          message: "Product data is not released",
          data: {
            product_business_key: p.product_business_key,
            identity_state: p.identity_state,
            visible_state: "PENDING"
          },
          meta: {
            error_key: "PRODUCT_NOT_RELEASED",
            retryable: false,
            degraded_allowed: true,
            fixture: "DEMO_FIXTURE"
          }
        });
      }
      if (p.visible_state === "REVOKED") {
        return envelope(410, {
          code: 41001,
          message: "Product release revoked",
          data: {
            product_business_key: p.product_business_key,
            release_id: p.release && p.release.release_id,
            release_version: p.release && p.release.release_version,
            revoked_at: p.release && p.release.revoked_at,
            reason_code: p.release && p.release.reason_code
          },
          meta: {
            error_key: "PRODUCT_RELEASE_REVOKED",
            retryable: false,
            degraded_allowed: false,
            fixture: "DEMO_FIXTURE"
          }
        });
      }
      return envelope(200, {
        data: publicProduct(p),
        meta: {
          data_version: p.release ? p.release.content_version : null,
          fixture: "DEMO_FIXTURE"
        }
      });
    }

    function incompleteIdentity(mpnRaw, mpnNorm, brandRaw) {
      return envelope(422, {
        code: 42201,
        message: "Product identity is incomplete: exact search requires brand",
        data: {
          product_business_key: null,
          identity_state: "PENDING_BRAND",
          mpn_raw: mpnRaw,
          mpn_norm: mpnNorm,
          brand_raw: brandRaw,
          brand_norm: null,
          normalizer_version: Normalizer.VERSION
        },
        meta: {
          error_key: "PRODUCT_IDENTITY_INCOMPLETE",
          retryable: false,
          degraded_allowed: false,
          missing: ["brand"],
          fixture: "DEMO_FIXTURE"
        }
      });
    }

    function searchProducts(query) {
      query = query || {};
      var mpn = query.mpn;
      var brand = query.brand;
      var limit = Math.min(Number(query.limit) || 10, 200);
      var offset = query.cursor ? Number(String(query.cursor).replace("demo_", "")) || 0 : 0;

      if (!mpn) {
        return errorEnvelope(400, 40001, "mpn is required", "INVALID_ARGUMENT", {
          field: "mpn",
          fixture: "DEMO_FIXTURE"
        });
      }

      var wantedMpn = Normalizer.normalizeValue(mpn);
      if (!wantedMpn.ok || wantedMpn.value === "") {
        return errorEnvelope(400, 40001, "mpn is not a valid normalized value", "INVALID_ARGUMENT", {
          field: "mpn",
          reason: wantedMpn.ok ? "EMPTY_MPN" : wantedMpn.reason,
          fixture: "DEMO_FIXTURE"
        });
      }

      if (!brand) {
        return incompleteIdentity(mpn, wantedMpn.value, null);
      }

      var wantedBrand = Normalizer.normalizeValue(brand);
      if (!wantedBrand.ok) {
        return errorEnvelope(400, 40001, "brand is not a valid normalized value", "INVALID_ARGUMENT", {
          field: "brand",
          reason: wantedBrand.reason,
          fixture: "DEMO_FIXTURE"
        });
      }
      if (wantedBrand.value === "") {
        return incompleteIdentity(mpn, wantedMpn.value, brand);
      }

      var matches = products.filter(function (p) {
        return p.identity_state === "CONFIRMED" &&
          p.identity.mpn_norm === wantedMpn.value &&
          p.identity.brand_norm === wantedBrand.value &&
          (!query.identity_state || p.identity_state === query.identity_state) &&
          (!query.release_state || p.visible_state === query.release_state);
      });

      var page = matches.slice(offset, offset + limit);
      var nextOffset = offset + page.length;
      var next = nextOffset < matches.length ? "demo_" + nextOffset : null;

      return envelope(200, {
        data: {
          items: page.map(function (p) {
            return {
              product_business_key: p.product_business_key,
              identity_state: p.identity_state,
              mpn_raw: p.identity.mpn_raw,
              mpn_norm: p.identity.mpn_norm,
              brand_raw: p.identity.brand_raw,
              brand_norm: p.identity.brand_norm,
              normalizer_version: p.identity.normalizer_version,
              package: p.identity.package,
              visible_state: p.visible_state,
              content_version: p.release ? p.release.content_version : null,
              updated_at: p.updated_at,
              fixture: "DEMO_FIXTURE"
            };
          })
        },
        meta: {
          limit: limit,
          next_cursor: next,
          has_more: next !== null,
          total: matches.length,
          fixture: "DEMO_FIXTURE"
        }
      });
    }

    function getDictionary(dictionary) {
      return envelope(200, {
        data: dictionary,
        meta: { fixture: "DEMO_FIXTURE", formal_dictionary: false }
      });
    }

    function getTaxonomy(taxonomies) {
      return envelope(200, {
        data: taxonomies,
        meta: { fixture: "DEMO_FIXTURE", formal_taxonomy: false }
      });
    }

    function previewIdentity(input) {
      var result = Normalizer.normalizeIdentity(input);
      return envelope(200, {
        data: result,
        meta: { fixture: "DEMO_FIXTURE", normalizer_version: Normalizer.VERSION }
      });
    }

    function previewCandidates(candidates) {
      var result = Normalizer.normalizeCandidates(candidates);
      return envelope(result.identity_state === "PENDING_CONFLICT" ? 422 : 200, {
        code: result.identity_state === "PENDING_CONFLICT" ? 42202 : 0,
        message: result.identity_state === "PENDING_CONFLICT" ? "MPN normalization conflict" : "ok",
        data: result,
        meta: {
          error_key: result.identity_state === "PENDING_CONFLICT" ? "MPN_NORMALIZATION_CONFLICT" : "OK",
          retryable: false,
          degraded_allowed: false,
          fixture: "DEMO_FIXTURE"
        }
      });
    }

    function scenario(name) {
      switch (name) {
        case "product_released":
          return getProduct("pbk1_e65e545a387d11dfccf729da568de66a33b78c892d6b6809347ceeb499eba88b");
        case "product_pending":
          return getProduct("pbk1_f3be4832aee387479a44c81cf4f0be4e1ad52964fd2029c96b81bc94b3298d40");
        case "product_revoked":
          return getProduct("pbk1_7de19c6b2d36dd692514dc2580af496a126795f386c351950789a9ef3ae83ec1");
        case "identity_missing_brand": {
          var pending = Normalizer.normalizeIdentity({ mpn_raw: "XYZ123", brand_raw: null });
          return envelope(422, {
            code: 42201,
            message: "Product identity is incomplete: brand cannot be resolved",
            data: pending,
            meta: {
              error_key: "PRODUCT_IDENTITY_INCOMPLETE",
              retryable: false,
              degraded_allowed: false,
              missing: ["brand"],
              fixture: "DEMO_FIXTURE"
            }
          });
        }
        case "identity_conflict":
          return previewCandidates([
            { mpn_raw: "LM358DR", brand_raw: "Example Semiconductor" },
            { mpn_raw: "LM358D", brand_raw: "Example Semiconductor" }
          ]);
        case "unauthorized":
          return errorEnvelope(401, 40101, "Invalid access token", "INVALID_TOKEN", {
            degraded_allowed: true,
            fixture: "DEMO_FIXTURE"
          });
        case "version_conflict":
          return errorEnvelope(409, 40901, "Version conflict", "VERSION_CONFLICT", {
            retryable: true,
            degraded_allowed: true,
            fixture: "DEMO_FIXTURE"
          });
        case "rate_limited":
          return errorEnvelope(429, 42901, "Rate limit exceeded", "RATE_LIMITED", {
            retryable: true,
            degraded_allowed: true,
            retry_after_seconds: 12,
            fixture: "DEMO_FIXTURE"
          });
        case "service_unavailable":
          return errorEnvelope(503, 50301, "Service unavailable", "SERVICE_UNAVAILABLE", {
            retryable: true,
            degraded_allowed: true,
            fixture: "DEMO_FIXTURE"
          });
        default:
          return errorEnvelope(400, 40002, "Unknown demo scenario: " + name, "UNKNOWN_FILTER", {
            fixture: "DEMO_FIXTURE"
          });
      }
    }

    function syncPage(offset, pageSize, releaseState) {
      var rows = products.filter(function (p) {
        return p.identity_state === "CONFIRMED" && p.visible_state === releaseState;
      });
      var page = rows.slice(offset, offset + pageSize);
      return {
        items: page.map(function (p) { return p.product_business_key; }),
        next_cursor: offset + page.length < rows.length ? "demo_" + (offset + page.length) : null
      };
    }

    function simulateSync(options) {
      options = options || {};
      var pageSize = options.pageSize || 2;
      var failAtPage = options.failAtPage === undefined ? 2 : options.failAtPage;
      var maxRetries = options.maxRetries === undefined ? 2 : options.maxRetries;
      var delayMs = options.delayMs === undefined ? 250 : options.delayMs;
      var releaseState = options.releaseState || "RELEASED";

      var events = [];
      var cursor = null;
      var pageNo = 0;
      var pageAttempt = 0;

      function wait(ms) {
        return new Promise(function (resolve) { setTimeout(resolve, ms); });
      }

      function push(event) {
        events.push(event);
        if (typeof options.onEvent === "function") options.onEvent(event);
      }

      function fetchPage() {
        pageNo += 1;
        pageAttempt = 0;
        return attemptPage();
      }

      function attemptPage() {
        pageAttempt += 1;
        if (pageNo === failAtPage && pageAttempt <= maxRetries) {
          push({
            at: new Date().toISOString(),
            page: pageNo,
            attempt: pageAttempt,
            status: "ERROR",
            http_status: 503,
            error_key: "SERVICE_UNAVAILABLE",
            action: "retry_after_backoff",
            backoff_ms: delayMs * pageAttempt
          });
          return wait(delayMs * pageAttempt).then(attemptPage);
        }
        var offset = cursor ? Number(String(cursor).replace("demo_", "")) : 0;
        var page = syncPage(offset, pageSize, releaseState);
        push({
          at: new Date().toISOString(),
          page: pageNo,
          attempt: pageAttempt,
          status: "OK",
          http_status: 200,
          count: page.items.length,
          keys: page.items,
          next_cursor: page.next_cursor
        });
        cursor = page.next_cursor;
        if (cursor) return wait(delayMs).then(fetchPage);
        push({
          at: new Date().toISOString(),
          page: pageNo,
          attempt: pageAttempt,
          status: "DONE",
          http_status: 200,
          note: "demo sync finished; no production write performed"
        });
        return Promise.resolve({ events: events, release_state: releaseState });
      }

      return fetchPage();
    }

    return {
      getProduct: getProduct,
      searchProducts: searchProducts,
      getDictionary: getDictionary,
      getTaxonomy: getTaxonomy,
      previewIdentity: previewIdentity,
      previewCandidates: previewCandidates,
      scenario: scenario,
      simulateSync: simulateSync,
      _nextRequestId: nextRequestId
    };
  }

  return {
    createApi: createApi,
    envelope: envelope,
    errorEnvelope: errorEnvelope
  };
});

/*
 * Phase 1 Mock UI controller.
 *
 * Everything here runs against local DEMO_FIXTURE JSON and the in-browser
 * MockApi simulator. No network calls to Ds Bit or Morrishk are made.
 */
(function () {
  "use strict";

  var Normalizer = window.MpnNormalizer;
  var MockApi = window.MockApi;
  if (!Normalizer || !MockApi) {
    throw new Error("MpnNormalizer / MockApi failed to load");
  }

  var state = {
    products: [],
    dictionary: null,
    taxonomies: null,
    api: null,
    selectedProductKey: null,
    selectedParamCode: null
  };

  function $(id) {
    return document.getElementById(id);
  }

  function esc(value) {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function rowState(value) {
    return '<span class="state state-' + esc(value) + '">' + esc(value) + "</span>";
  }

  // ---------------------------------------------------------------- tabs
  function initTabs() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.classList.remove("active"); });
        tab.classList.add("active");
        var target = "view-" + tab.getAttribute("data-view");
        Array.prototype.forEach.call(document.querySelectorAll(".view"), function (v) {
          v.classList.toggle("active", v.id === target);
        });
      });
    });
  }

  // ------------------------------------------------------------ products
  function filteredProducts() {
    var identity = $("filter-identity").value;
    var release = $("filter-release").value;
    var text = $("filter-text").value.trim().toLowerCase();
    return state.products.filter(function (p) {
      if (identity && p.identity_state !== identity) return false;
      if (release && p.visible_state !== release) return false;
      if (text) {
        var hay = [
          p.product_business_key || "",
          p.identity.mpn_raw || "",
          p.identity.brand_raw || ""
        ].join(" ").toLowerCase();
        if (hay.indexOf(text) === -1) return false;
      }
      return true;
    });
  }

  function renderProducts() {
    var tbody = $("products-table").querySelector("tbody");
    var rows = filteredProducts();
    $("products-count").textContent = rows.length + " / " + state.products.length + " 条";
    tbody.innerHTML = rows.map(function (p) {
      var key = p.product_business_key;
      var rowId = key || p.record_id;
      return "<tr data-id=\"" + esc(rowId) + "\">" +
        "<td>" + esc(p.identity.mpn_raw) + "</td>" +
        "<td>" + esc(p.identity.brand_raw || "（缺失）") + "</td>" +
        "<td>" + rowState(p.identity_state) + "</td>" +
        "<td>" + rowState(p.visible_state) + "</td>" +
        "<td class=\"key\">" + esc(key || "—（待确认，无业务键）") + "</td>" +
        "</tr>";
    }).join("");

    Array.prototype.forEach.call(tbody.querySelectorAll("tr"), function (tr) {
      tr.addEventListener("click", function () {
        Array.prototype.forEach.call(tbody.querySelectorAll("tr"), function (r) {
          r.classList.remove("selected");
        });
        tr.classList.add("selected");
        showDetail(tr.getAttribute("data-id"));
      });
    });
  }

  function findRecord(id) {
    return state.products.filter(function (p) {
      return p.product_business_key === id || p.record_id === id;
    })[0] || null;
  }

  function showDetail(id) {
    var p = findRecord(id);
    if (!p) return;
    state.selectedProductKey = id;
    var panel = $("product-detail");
    var ident = p.identity;
    var html = [];

    html.push('<div class="panel-head"><h2>' + esc(ident.mpn_raw) + "</h2>" +
      '<span class="tag warn">DEMO_FIXTURE</span></div>');

    html.push('<dl class="kv">' +
      "<dt>身份状态</dt><dd>" + rowState(p.identity_state) + "</dd>" +
      "<dt>发布状态</dt><dd>" + rowState(p.visible_state) + "</dd>" +
      "<dt>product_business_key</dt><dd class=\"key\">" + esc(p.product_business_key || "—（待确认）") + "</dd>" +
      "<dt>mpn_raw → mpn_norm</dt><dd>" + esc(ident.mpn_raw) + " → <code>" + esc(ident.mpn_norm) + "</code></dd>" +
      "<dt>brand_raw → brand_norm</dt><dd>" + esc(ident.brand_raw || "（缺失）") + " → <code>" + esc(ident.brand_norm || "—") + "</code></dd>" +
      "<dt>normalizer_version</dt><dd><code>" + esc(ident.normalizer_version) + "</code></dd>" +
      "<dt>package</dt><dd>" + esc(ident.package || "—") + "</dd>" +
      "<dt>identity_scope</dt><dd>" + esc(ident.identity_scope || "—") + "</dd>" +
      "</dl>");

    if (p.reason) {
      html.push('<p class="muted">待确认原因：<code>' + esc(p.reason) + "</code>" +
        (p.conflicting_with ? "；冲突对象：<code>" + esc(p.conflicting_with) + "</code>" : "") + "</p>");
    }

    if (p.release) {
      html.push('<div class="section-label">发布</div><dl class="kv">' +
        "<dt>release_id</dt><dd><code>" + esc(p.release.release_id) + "</code></dd>" +
        "<dt>content_version</dt><dd>" + esc(p.release.content_version) + "</dd>" +
        "<dt>released_at</dt><dd>" + esc(p.release.released_at) + "</dd>" +
        (p.release.revoked_at ? "<dt>revoked_at</dt><dd>" + esc(p.release.revoked_at) + "</dd>" : "") +
        (p.release.reason_code ? "<dt>reason_code</dt><dd><code>" + esc(p.release.reason_code) + "</code></dd>" : "") +
        "</dl>");
    } else {
      html.push('<p class="muted">尚无发布记录：内容未发布时公开接口返回 403 PRODUCT_NOT_RELEASED。</p>');
    }

    html.push('<div class="section-label">技术参数（技术分类 · Ds Bit 侧）</div>');
    var params = (p.technical && p.technical.parameters) || [];
    if (!params.length) {
      html.push('<p class="muted">无参数记录。</p>');
    } else {
      html.push('<table class="data-table"><thead><tr><th>parameter_code</th><th>名称</th><th>值</th><th>单位</th><th>核验</th><th>证据</th></tr></thead><tbody>');
      params.forEach(function (par) {
        var val = par.value !== undefined && par.value !== null
          ? par.value
          : [par.min || "", par.typ || "", par.max || ""].filter(Boolean).join(" / ");
        html.push("<tr><td><code>" + esc(par.parameter_code) + "</code></td>" +
          "<td>" + esc(par.name) + "</td>" +
          "<td>" + esc(val) + "</td>" +
          "<td>" + esc(par.unit || "—") + "</td>" +
          "<td>" + esc(par.verification_status) + "</td>" +
          "<td class=\"key\">" + esc((par.evidence_ids || []).join(", ") || "—") + "</td></tr>");
      });
      html.push("</tbody></table>");
    }

    html.push('<div class="section-label">来源文档（仅作证据，不构成产品身份）</div>');
    var docs = p.documents || [];
    if (!docs.length) {
      html.push('<p class="muted">无文档记录。</p>');
    } else {
      html.push('<table class="data-table"><thead><tr><th>document_id</th><th>类型</th><th>页数</th><th>role</th></tr></thead><tbody>');
      docs.forEach(function (d) {
        html.push("<tr><td class=\"key\">" + esc(d.document_id) + "</td>" +
          "<td>" + esc(d.document_type) + "</td>" +
          "<td>" + esc(d.page_count) + "</td>" +
          "<td>" + esc(d.role) + "</td></tr>");
      });
      html.push("</tbody></table>");
    }

    html.push('<div class="section-label">平台映射（内部主键，不是跨系统身份）</div>');
    if (p.platform) {
      html.push('<dl class="kv">' +
        "<dt>platform_model_id</dt><dd class=\"key\">" + esc(p.platform.platform_model_id === null ? "—" : p.platform.platform_model_id) + "</dd>" +
        "<dt>mapping_status</dt><dd>" + esc(p.platform.mapping_status) + "</dd>" +
        "<dt>mapping_source</dt><dd>" + esc(p.platform.mapping_source) + "</dd>" +
        "</dl>");
    } else {
      html.push('<p class="muted">未进入平台映射。</p>');
    }

    panel.innerHTML = html.join("");
  }

  // ---------------------------------------------------------- normalizer
  function renderNormalizer() {
    var input = {
      mpn_raw: $("norm-mpn").value,
      brand_raw: $("norm-brand").value === "" ? null : $("norm-brand").value
    };
    var result = Normalizer.normalizeIdentity(input);
    var box = $("norm-result");
    box.className = "result-box " + (result.identity_state === "CONFIRMED" ? "ok"
      : result.identity_state === "INVALID" ? "bad" : "warn");
    box.textContent = JSON.stringify(result, null, 2);
  }

  var candidateSample = [
    { mpn_raw: "LM358DR", brand_raw: "Example Semiconductor" },
    { mpn_raw: " lm358dr ", brand_raw: "example   semiconductor" },
    { mpn_raw: "LM358D", brand_raw: "Example Semiconductor" }
  ];

  function renderCandidates() {
    var normalized = candidateSample.map(function (c) { return Normalizer.normalizeIdentity(c); });
    var aggregate = Normalizer.normalizeCandidates(candidateSample);
    var tbody = $("candidate-table").querySelector("tbody");
    tbody.innerHTML = normalized.map(function (n, i) {
      return "<tr><td>" + esc(candidateSample[i].mpn_raw) + " / " + esc(candidateSample[i].brand_raw) + "</td>" +
        "<td><code>" + esc(n.mpn_norm || "—") + "</code></td>" +
        "<td><code>" + esc(n.brand_norm || "—") + "</code></td>" +
        "<td>" + rowState(n.identity_state) + "</td></tr>";
    }).join("");
    var box = $("candidate-result");
    box.className = "result-box " + (aggregate.identity_state === "PENDING_CONFLICT" ? "warn" : "ok");
    box.textContent = JSON.stringify({
      identity_state: aggregate.identity_state,
      reason: aggregate.reason,
      mpn_norms: aggregate.mpn_norms,
      keys: aggregate.keys
    }, null, 2);
  }

  // ----------------------------------------------------------- conflicts
  function renderConflicts() {
    var rows = state.products.filter(function (p) {
      return p.identity_state === "PENDING_BRAND" || p.identity_state === "PENDING_CONFLICT";
    });
    var tbody = $("conflict-table").querySelector("tbody");
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="muted">当前演示数据无待确认记录。</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(function (p) {
      return "<tr>" +
        "<td>" + esc(p.identity.mpn_raw) + "</td>" +
        "<td>" + esc(p.identity.brand_raw || "（缺失）") + "</td>" +
        "<td>" + rowState(p.identity_state) + "</td>" +
        "<td><code>" + esc(p.reason) + "</code>" + (p.conflicting_with ? " / " + esc(p.conflicting_with) : "") + "</td>" +
        "<td class=\"key\">" + esc((p.documents || []).map(function (d) { return d.document_id; }).join(", ")) + "</td>" +
        '<td><button type="button" disabled>待 Phase 2 人工确认</button></td>' +
        "</tr>";
    }).join("");
  }

  // ---------------------------------------------------------- dictionary
  function renderDictionary() {
    var entries = state.dictionary.entries;
    var tbody = $("dictionary-table").querySelector("tbody");
    tbody.innerHTML = entries.map(function (e) {
      return "<tr data-code=\"" + esc(e.parameter_code) + "\"" +
        (e.parameter_code === state.selectedParamCode ? ' class="selected"' : "") + ">" +
        "<td><code>" + esc(e.parameter_code) + "</code></td>" +
        "<td>" + esc(e.canonical_name) + "</td>" +
        "<td>" + esc(e.data_type) + "</td>" +
        "<td>" + esc(e.canonical_unit || "—") + "</td>" +
        "<td>" + esc(e.source) + "</td>" +
        "<td>" + esc(e.status) + "</td>" +
        "<td>" + esc(e.dictionary_version) + "</td>" +
        "</tr>";
    }).join("");

    Array.prototype.forEach.call(tbody.querySelectorAll("tr"), function (tr) {
      tr.addEventListener("click", function () {
        state.selectedParamCode = tr.getAttribute("data-code");
        var entry = entries.filter(function (e) { return e.parameter_code === state.selectedParamCode; })[0];
        if (entry) {
          $("dict-display").value = entry.display_name;
          $("dict-status").value = entry.status;
        }
        renderDictionary();
      });
    });
  }

  function initDictionary() {
    $("dict-save").addEventListener("click", function () {
      var code = state.selectedParamCode;
      var note = $("dict-save-note");
      if (!code) {
        note.textContent = "请先在上表选择一行。";
        return;
      }
      var entry = state.dictionary.entries.filter(function (e) { return e.parameter_code === code; })[0];
      entry.display_name = $("dict-display").value;
      entry.status = $("dict-status").value;
      note.textContent = "已在内存中更新 " + code + "（未写入任何数据库；正式字典需 PM 种子 + 审核流程）。";
      renderDictionary();
    });
  }

  // ------------------------------------------------------------ taxonomy
  function renderTree(container, nodes, isTechnical) {
    container.innerHTML = nodes.map(function (n) {
      var line = '<div class="tree-node" data-level="' + esc(n.level) + '">' +
        "<strong>" + esc(n.name) + "</strong>" +
        '<span class="node-id">' + esc(isTechnical ? n.category_id : n.category_id) + "</span>";
      if (isTechnical && n.parameter_codes && n.parameter_codes.length) {
        line += '<span class="node-params">参数：' + esc(n.parameter_codes.join(", ")) + "</span>";
      }
      if (!isTechnical && n.url_path) {
        line += '<span class="node-params">' + esc(n.url_path) + "</span>";
      }
      return line + "</div>";
    }).join("");
  }

  function renderTaxonomies() {
    var tech = state.taxonomies.technical;
    var nav = state.taxonomies.navigation;
    renderTree($("technical-tree"), tech.nodes, true);
    renderTree($("navigation-tree"), nav.nodes, false);

    var techName = {};
    tech.nodes.forEach(function (n) { techName[n.category_id] = n.name; });

    var tbody = $("mapping-table").querySelector("tbody");
    tbody.innerHTML = state.taxonomies.mapping.map(function (m) {
      var navLabel = m.navigation_category_id
        ? (m.navigation_slug || "") + " (#" + m.navigation_category_id + ")"
        : "—（未映射）";
      return "<tr>" +
        "<td>" + esc(techName[m.technical_category_id] || m.technical_category_id) +
        ' <span class="node-id">' + esc(m.technical_category_code) + "</span></td>" +
        "<td>" + esc(navLabel) + "</td>" +
        "<td><code>" + esc(m.morrishk_target) + "</code></td>" +
        "<td>" + esc(m.mapping_type) + "</td>" +
        "<td>" + rowState(m.mapping_status) + "</td>" +
        "<td>" + esc(m.mapping_source) + "</td>" +
        "</tr>";
    }).join("");
  }

  // ------------------------------------------------------------- mapping
  function renderPlatformMapping() {
    var rows = state.products.filter(function (p) { return p.identity_state === "CONFIRMED"; });
    var tbody = $("platform-table").querySelector("tbody");
    tbody.innerHTML = rows.map(function (p) {
      var plat = p.platform || {};
      return "<tr>" +
        "<td class=\"key\">" + esc(p.product_business_key) + "</td>" +
        "<td>" + esc(p.identity.mpn_raw) + "</td>" +
        "<td>" + esc(p.identity.brand_raw) + "</td>" +
        "<td class=\"key\">" + esc(plat.platform_model_id === null || plat.platform_model_id === undefined ? "—" : plat.platform_model_id) + "</td>" +
        "<td>" + esc(plat.mapping_status || "—") + "</td>" +
        "<td>" + esc(plat.mapping_source || "—") + "</td>" +
        "</tr>";
    }).join("");
  }

  // ----------------------------------------------------------------- api
  var PRODUCT_KEYS = {
    product_released: "pbk1_e65e545a387d11dfccf729da568de66a33b78c892d6b6809347ceeb499eba88b",
    product_pending: "pbk1_f3be4832aee387479a44c81cf4f0be4e1ad52964fd2029c96b81bc94b3298d40",
    product_revoked: "pbk1_7de19c6b2d36dd692514dc2580af496a126795f386c351950789a9ef3ae83ec1"
  };

  function buildRequest(scenario) {
    var mpn = $("api-mpn").value;
    var brand = $("api-brand").value;
    var limit = $("api-limit").value;
    var lines = ["# MOCK ONLY — 未发起任何网络请求", ""];

    if (PRODUCT_KEYS[scenario]) {
      lines.push("GET /api/v1/products/" + PRODUCT_KEYS[scenario] + " HTTP/1.1");
    } else if (scenario === "search") {
      lines.push("GET /api/v1/products/search?mpn=" + encodeURIComponent(mpn) +
        "&brand=" + encodeURIComponent(brand) + "&mpn_match=exact&limit=" + encodeURIComponent(limit) + " HTTP/1.1");
    } else if (scenario === "dictionary") {
      lines.push("GET /api/v1/dictionary/parameters?scope=IC HTTP/1.1");
    } else if (scenario === "taxonomy") {
      lines.push("GET /api/v1/taxonomies/tax_demo_analog_rf/tree HTTP/1.1");
    } else if (scenario === "identity_missing_brand") {
      lines.push("POST /api/v1/identity/preview HTTP/1.1");
    } else if (scenario === "identity_conflict") {
      lines.push("POST /api/v1/identity/preview-batch HTTP/1.1");
    } else {
      lines.push("GET /api/v1/products/" + PRODUCT_KEYS.product_released + " HTTP/1.1");
    }
    lines.push("Host: dsbit.mock.local");
    lines.push("Accept: application/json");
    lines.push("Authorization: Bearer <REDACTED_DEMO_TOKEN>");

    if (scenario === "identity_missing_brand") {
      lines.push("Content-Type: application/json");
      lines.push("");
      lines.push(JSON.stringify({ mpn_raw: "XYZ123", brand_raw: null }, null, 2));
    } else if (scenario === "identity_conflict") {
      lines.push("Content-Type: application/json");
      lines.push("");
      lines.push(JSON.stringify({
        candidates: [
          { mpn_raw: "LM358DR", brand_raw: "Example Semiconductor" },
          { mpn_raw: "LM358D", brand_raw: "Example Semiconductor" }
        ]
      }, null, 2));
    }
    return lines.join("\n");
  }

  function callScenario(scenario) {
    var api = state.api;
    if (scenario === "search") {
      return api.searchProducts({
        mpn: $("api-mpn").value,
        brand: $("api-brand").value,
        limit: Number($("api-limit").value)
      });
    }
    if (scenario === "dictionary") {
      return api.getDictionary(state.dictionary);
    }
    if (scenario === "taxonomy") {
      return api.getTaxonomy(state.taxonomies.technical);
    }
    return api.scenario(scenario);
  }

  function initApiConsole() {
    $("api-send").addEventListener("click", function () {
      var scenario = $("api-scenario").value;
      var result = callScenario(scenario);
      $("api-request").textContent = buildRequest(scenario);
      $("api-response").textContent =
        "HTTP/1.1 " + result.http_status + "\nContent-Type: application/json\n\n" +
        JSON.stringify(result.body, null, 2);
    });
    $("api-scenario").addEventListener("change", function () {
      $("api-request").textContent = buildRequest(this.value);
      $("api-response").textContent = "（尚未发送）";
    });
    $("api-request").textContent = buildRequest($("api-scenario").value);
  }

  // ---------------------------------------------------------------- sync
  function appendSyncRow(event) {
    var tbody = $("sync-table").querySelector("tbody");
    var tr = document.createElement("tr");
    var note = "";
    if (event.status === "ERROR") {
      note = event.error_key + " · " + event.action + " · backoff " + event.backoff_ms + "ms";
    } else if (event.status === "OK") {
      note = event.keys && event.keys.length ? event.keys.join(", ") : "（本页为空）";
    } else {
      note = event.note || "";
    }
    tr.innerHTML = "<td>" + esc(event.page) + "</td>" +
      "<td>" + esc(event.attempt) + "</td>" +
      "<td>" + rowState(event.status) + "</td>" +
      "<td>" + esc(event.http_status) + "</td>" +
      "<td>" + esc(event.count === undefined ? "—" : event.count) + "</td>" +
      "<td class=\"key\">" + esc(event.next_cursor || "—") + "</td>" +
      "<td>" + esc(note) + "</td>";
    tbody.appendChild(tr);
  }

  function initSync() {
    $("sync-run").addEventListener("click", function () {
      var button = this;
      var tbody = $("sync-table").querySelector("tbody");
      tbody.innerHTML = "";
      button.disabled = true;
      state.api.simulateSync({
        pageSize: Number($("sync-page").value) || 2,
        failAtPage: Number($("sync-fail").value) || 0,
        maxRetries: Number($("sync-retries").value) || 0,
        releaseState: $("sync-state").value,
        delayMs: 300,
        onEvent: appendSyncRow
      }).then(function () {
        button.disabled = false;
      }, function (err) {
        appendSyncRow({ page: "-", attempt: "-", status: "ERROR", http_status: 500, note: String(err) });
        button.disabled = false;
      });
    });
  }

  // ---------------------------------------------------------------- boot
  function loadJson(path) {
    return fetch(path, { cache: "no-store" }).then(function (res) {
      if (!res.ok) throw new Error("failed to load " + path + ": HTTP " + res.status);
      return res.json();
    });
  }

  function boot() {
    initTabs();

    Promise.all([
      loadJson("data/mock-products.json"),
      loadJson("data/mock-dictionary.json"),
      loadJson("data/mock-taxonomies.json")
    ]).then(function (files) {
      state.products = files[0].products;
      state.dictionary = files[1];
      state.taxonomies = files[2];
      state.api = MockApi.createApi({ products: state.products });

      renderProducts();
      renderCandidates();
      renderConflicts();
      renderDictionary();
      initDictionary();
      renderTaxonomies();
      renderPlatformMapping();
      initApiConsole();
      initSync();

      ["filter-identity", "filter-release"].forEach(function (id) {
        $(id).addEventListener("change", renderProducts);
      });
      $("filter-text").addEventListener("input", renderProducts);

      $("norm-run").addEventListener("click", renderNormalizer);
      $("norm-variant").addEventListener("click", function () {
        $("norm-mpn").value = "LM\u2013358DR\u200B";
        $("norm-brand").value = "Example\u3000Semiconductor";
        renderNormalizer();
      });
      ["norm-mpn", "norm-brand"].forEach(function (id) {
        $(id).addEventListener("input", renderNormalizer);
      });
      renderNormalizer();
    }).catch(function (err) {
      var banner = document.querySelector(".demo-banner span");
      if (banner) {
        banner.textContent = "演示数据加载失败（需通过 HTTP 访问，不能直接双击 file://）：" + err.message;
      }
      console.error(err);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

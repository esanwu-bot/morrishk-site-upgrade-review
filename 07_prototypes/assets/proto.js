/* ============================================================================
   Morris Precision Industrial — Prototype Interaction Layer
   版本：v1.0-prototype（2026-11-15）

   设计原则：
   1. 每个交互独立初始化，元素不存在时静默跳过（同一份 JS 供 4 个页面共用）。
   2. 所有数据均为前端 mock，不发起任何网络请求。
   3. 提交类动作只做**前端状态演示**，不写库；这一点由标注系统明示。
   ========================================================================= */

(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------------- 标注系统 */
  function initAnnotations() {
    var fab = $('.proto-fab');
    var legend = $('.annot-legend');
    if (!fab) return;

    function setCount() {
      var n = $$('[data-mock]').length;
      var b = $('.proto-fab .n');
      if (b) b.textContent = n;
    }

    function toggle() {
      var on = document.body.classList.toggle('annot');
      if (legend) legend.classList.toggle('open', on);
      fab.setAttribute('aria-pressed', on ? 'true' : 'false');
      fab.firstChild.textContent = on ? '关闭标注 ' : '原型标注 ';
    }

    fab.addEventListener('click', toggle);
    document.addEventListener('keydown', function (e) {
      if (e.key === '?' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
        e.preventDefault(); toggle();
      }
      if (e.key === 'Escape') {
        $$('.pop.open').forEach(function (p) { p.classList.remove('open'); });
        $$('.modal.open').forEach(function (m) { m.classList.remove('open'); });
        $$('.scrim.open').forEach(function (s) { s.classList.remove('open'); });
        var d = $('.facet-drawer'); if (d) d.classList.remove('open');
      }
    });
    setCount();
  }

  /* ------------------------------------------------------------ 搜索中枢 */
  function initSearchHub() {
    var hub = $('.hub');
    if (!hub) return;
    var input = $('input', hub);

    // Ctrl/Cmd + K 聚焦
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        input.focus(); input.select();
      }
    });

    // BOM 粘贴识别：多行或含制表符时提示
    var tip = $('#bomTip');
    input.addEventListener('paste', function () {
      setTimeout(function () {
        var v = input.value;
        var lines = v.split(/\r?\n/).filter(function (x) { return x.trim(); });
        if (tip) {
          if (lines.length >= 3 || v.indexOf('\t') > -1) {
            tip.style.display = 'flex';
            var c = $('#bomCount'); if (c) c.textContent = lines.length;
          } else { tip.style.display = 'none'; }
        }
      }, 0);
    });

    // 回车跳搜索页（原型内跳转）
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var q = encodeURIComponent(input.value || 'MCF8315');
        var base = hub.getAttribute('data-search-url') || '../search/index.html';
        window.location.href = base + '?q=' + q;
      }
    });
    var go = $('.go', hub);
    if (go) go.addEventListener('click', function () {
      var q = encodeURIComponent(input.value || 'MCF8315');
      var base = hub.getAttribute('data-search-url') || '../search/index.html';
      window.location.href = base + '?q=' + q;
    });

    // AI 替代料胶囊：原型中只做提示
    var ai = $('.ai', hub);
    if (ai) ai.addEventListener('click', function () {
      alert('AI 找替代料：Phase 4 能力。\n\n本期（Phase 1）仅提供规则版替代：同系列 + 同封装 + 在售，\n见技术方案 4.6「替代型号（规则版）」。');
    });
  }

  /* ------------------------------------------------------------ 筛选器 */
  function initFacets() {
    // 折叠
    $$('.facet-hd').forEach(function (h) {
      h.addEventListener('click', function () {
        h.parentElement.classList.toggle('closed');
        var c = $('.caret', h);
        if (c) c.textContent = h.parentElement.classList.contains('closed') ? '+' : '−';
      });
    });

    // 勾选 → 已选条件 chip
    var bar = $('#activeFilters');
    function syncChips() {
      if (!bar) return;
      bar.innerHTML = '';
      var chosen = $$('.facet input[type=checkbox]:checked');
      chosen.forEach(function (cb) {
        var label = cb.getAttribute('data-label') || cb.value;
        var chip = document.createElement('span');
        chip.className = 'chip on';
        chip.innerHTML = '<span></span><span class="x">×</span>';
        chip.firstChild.textContent = label;
        chip.addEventListener('click', function () {
          cb.checked = false; syncChips(); applyMockCount();
        });
        bar.appendChild(chip);
      });
      var clear = $('#clearFilters');
      if (clear) clear.style.display = chosen.length ? 'inline-flex' : 'none';
    }

    $$('.facet input[type=checkbox]').forEach(function (cb) {
      cb.addEventListener('change', function () { syncChips(); applyMockCount(); });
    });

    var clear = $('#clearFilters');
    if (clear) clear.addEventListener('click', function () {
      $$('.facet input[type=checkbox]').forEach(function (cb) { cb.checked = false; });
      syncChips(); applyMockCount();
    });

    // 模拟"命中数随筛选变化"——仅演示，非真实检索
    function applyMockCount() {
      var n = $$('.facet input[type=checkbox]:checked').length;
      var el = $('#resultCount');
      if (!el) return;
      var base = 12438;
      var shown = Math.max(0, base - n * 1873);
      el.textContent = shown.toLocaleString('en-US');
    }
    syncChips();

    // Tablet/Mobile 抽屉
    var openBtn = $('#openFacets'), drawer = $('.facet-drawer'), scrim = $('#facetScrim');
    if (openBtn && drawer) openBtn.addEventListener('click', function () {
      drawer.classList.add('open'); if (scrim) scrim.classList.add('open');
    });
    if (scrim) scrim.addEventListener('click', function () {
      drawer.classList.remove('open'); scrim.classList.remove('open');
    });
  }

  /* ------------------------------------------------------- 表格行选择 / 批量条 */
  function initRowSelect() {
    var bar = $('#bulkbar');
    function sync() {
      var n = $$('table.grid tbody input.rowchk:checked').length;
      $$('table.grid tbody tr').forEach(function (tr) {
        var cb = $('input.rowchk', tr);
        if (cb) tr.classList.toggle('sel', cb.checked);
      });
      if (bar) {
        bar.classList.toggle('open', n > 0);
        var c = $('#bulkCount'); if (c) c.textContent = n;
      }
      var all = $('#chkAll');
      if (all) {
        var total = $$('table.grid tbody input.rowchk').length;
        all.checked = n > 0 && n === total;
        all.indeterminate = n > 0 && n < total;
      }
    }
    $$('table.grid tbody input.rowchk').forEach(function (cb) {
      cb.addEventListener('change', sync);
    });
    var all = $('#chkAll');
    if (all) all.addEventListener('change', function () {
      $$('table.grid tbody input.rowchk').forEach(function (cb) { cb.checked = all.checked; });
      sync();
    });
    sync();
  }

  /* ---------------------------------------------------------- 阶梯价浮层 */
  function initTierPop() {
    $$('[data-tier]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var pop = $('#' + btn.getAttribute('data-tier'));
        if (!pop) return;
        var was = pop.classList.contains('open');
        $$('.pop.open').forEach(function (p) { p.classList.remove('open'); });
        if (!was) pop.classList.add('open');
      });
    });
    document.addEventListener('click', function () {
      $$('.pop.open').forEach(function (p) { p.classList.remove('open'); });
    });
    $$('.pop').forEach(function (p) { p.addEventListener('click', function (e) { e.stopPropagation(); }); });
  }

  /* ------------------------------------------------------- 替代料展开子行 */
  function initAltRows() {
    $$('[data-toggle-alt]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var row = $('#' + btn.getAttribute('data-toggle-alt'));
        if (!row) return;
        var open = row.hasAttribute('hidden') === false;
        if (open) { row.setAttribute('hidden', ''); btn.textContent = '✨ 找替代料'; }
        else { row.removeAttribute('hidden'); btn.textContent = '收起替代料'; }
      });
    });
  }

  /* --------------------------------------------------------- 数量步进器 */
  function initSteppers() {
    $$('[data-step]').forEach(function (box) {
      var input = $('input', box);
      $$('button', box).forEach(function (b) {
        b.addEventListener('click', function () {
          var d = b.getAttribute('data-d') === 'up' ? 1 : -1;
          var v = parseInt(input.value || '0', 10) + d;
          if (isNaN(v) || v < 1) v = 1;
          if (v > 1e9) v = 1e9;
          input.value = v;
        });
      });
    });
  }

  /* ------------------------------------------------------ 加入询价篮计数 */
  function initCart() {
    $$('[data-add-rfq]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var n = $('.headact .badge');
        if (n) n.textContent = String(parseInt(n.textContent || '0', 10) + 1);
        btn.textContent = '已加入';
        btn.classList.add('is-disabled');
        setTimeout(function () { btn.textContent = '加入询价篮'; btn.classList.remove('is-disabled'); }, 1200);
      });
    });
  }

  /* ------------------------------------------------------------ 询盘表单 */
  function initInquiryForm() {
    var form = $('#rfqForm');
    if (!form) return;

    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var state = { submitting: false, requestId: null, submitted: false };

    function uuid() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    function setErr(id, msg) {
      var el = $('#' + id), e = $('#err-' + id);
      if (el) el.classList.toggle('is-error', !!msg);
      if (e) { e.textContent = msg || ''; e.style.display = msg ? 'block' : 'none'; }
      return !msg;
    }

    // BOM 型号行：增删
    var rows = $('#bomRows');
    function renumber() {
      $$('.bom-row', rows).forEach(function (r, i) {
        var n = $('.idx', r); if (n) n.textContent = String(i + 1);
      });
      var cnt = $('#bomRowCount'); if (cnt) cnt.textContent = $$('.bom-row', rows).length;
    }
    if (rows) {
      rows.addEventListener('click', function (e) {
        if (e.target.classList.contains('rm')) {
          if ($$('.bom-row', rows).length <= 1) return;
          e.target.closest('.bom-row').remove(); renumber();
        }
      });
      var add = $('#addRow');
      if (add) add.addEventListener('click', function () {
        if ($$('.bom-row', rows).length >= 50) {
          alert('单次最多 50 行（技术方案 5.4 表单规则）。');
          return;
        }
        var last = $$('.bom-row', rows).pop();
        var clone = last.cloneNode(true);
        $$('input', clone).forEach(function (i) { i.value = ''; });
        rows.appendChild(clone); renumber();
      });
      renumber();
    }

    // 批量粘贴型号
    var pasteBox = $('#pasteBox');
    if (pasteBox) pasteBox.addEventListener('change', function () {
      var text = pasteBox.value || '';
      var parts = text.split(/[\r\n,;\t]+/).map(function (s) { return s.trim(); }).filter(Boolean);
      if (!parts.length) return;
      if (parts.length > 50) { alert('粘贴 ' + parts.length + ' 行，超过 50 行上限，将截取前 50 行。'); parts = parts.slice(0, 50); }
      $$('.bom-row', rows).forEach(function (r) { r.remove(); });
      parts.forEach(function (p) {
        var row = document.createElement('div');
        row.className = 'bom-row row';
        row.style.cssText = 'gap:6px;margin-bottom:6px';
        row.innerHTML =
          '<span class="idx label" style="width:18px;flex:0 0 18px;text-align:right"></span>' +
          '<input class="input grow" value="" placeholder="Part number">' +
          '<input class="input num" style="width:88px;flex:0 0 88px" value="" placeholder="Qty">' +
          '<button type="button" class="btn btn-ghost btn-xs rm" title="删除">×</button>';
        row.querySelector('input').value = p;
        rows.appendChild(row);
      });
      renumber();
    });

    // 附件
    var fileInput = $('#attachments');
    var fileList = $('#fileList');
    if (fileInput) fileInput.addEventListener('change', function () {
      var files = Array.prototype.slice.call(fileInput.files || []);
      if (files.length > 3) { alert('附件最多 3 个（技术方案 5.4）。'); }
      fileList.innerHTML = '';
      files.slice(0, 3).forEach(function (f) {
        var s = document.createElement('span');
        s.className = 'chip';
        s.innerHTML = '<span></span><span class="x">×</span>';
        s.firstChild.textContent = f.name + ' · ' + (f.size / 1024 / 1024).toFixed(2) + ' MB';
        if (f.size > 10 * 1024 * 1024) { s.classList.add('on'); s.firstChild.textContent += ' 超过 10MB'; }
        s.lastChild.addEventListener('click', function () { s.remove(); });
        fileList.appendChild(s);
      });
    });

    // 提交
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // 重复提交保护（前端侧；服务端靠 RequestId 唯一键）
      if (state.submitting) return;

      var ok = true;
      ok = setErr('email', emailRe.test($('#email').value.trim()) ? '' : '请输入有效邮箱地址') && ok;
      ok = setErr('company', $('#company').value.trim() ? '' : '请填写公司名称') && ok;
      var anyPart = $$('.bom-row input:first-of-type', rows).some(function (i) { return i.value.trim(); });
      ok = setErr('bom', anyPart ? '' : '请至少填写一个型号，或上传 BOM 附件') && ok;

      // 蜜罐
      var hp = $('#hp_field');
      if (hp && hp.value) { ok = false; }

      if (!ok) {
        var first = $('.is-error');
        if (first) first.focus();
        return;
      }

      // 生成 RequestId（幂等键，服务端以此判重）
      if (!state.requestId) state.requestId = uuid();

      state.submitting = true;
      var btn = $('#submitBtn');
      btn.classList.add('is-disabled');
      btn.textContent = '提交中…';

      // 模拟网络往返
      setTimeout(function () {
        state.submitting = false;
        state.submitted = true;
        btn.classList.remove('is-disabled');
        btn.textContent = '提交询盘';

        var leadNo = 'MR' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
        var okPanel = $('#submitOk');
        if (okPanel) {
          okPanel.style.display = 'block';
          var ln = $('#leadNo'); if (ln) ln.textContent = leadNo;
          var rid = $('#reqId'); if (rid) rid.textContent = state.requestId;
          okPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        // 再次提交 → 提示已提交（模拟幂等：返回同一 LeadNo）
        btn.setAttribute('data-done', '1');
        btn.addEventListener('click', function again(ev) {
          ev.preventDefault();
          alert('该询盘已提交（RequestId: ' + state.requestId + '）。\n\n重复提交将由服务端幂等键拦截，返回同一 LeadNo，不新建记录。\n见技术方案 5.5「反垃圾与幂等」。');
        }, { once: true });
      }, 900);
    });

    // 失败演示：保留表单内容
    var failBtn = $('#simulateFail');
    if (failBtn) failBtn.addEventListener('click', function () {
      var p = $('#submitFail');
      if (p) { p.style.display = 'flex'; p.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    });
  }

  /* --------------------------------------------------------- 规格分组折叠 */
  function initSpecGroups() {
    $$('[data-spec-group]').forEach(function (h) {
      h.addEventListener('click', function () {
        var body = $('#' + h.getAttribute('data-spec-group'));
        if (!body) return;
        var hidden = body.hasAttribute('hidden');
        if (hidden) { body.removeAttribute('hidden'); h.classList.remove('closed'); }
        else { body.setAttribute('hidden', ''); h.classList.add('closed'); }
        var c = $('.caret', h);
        if (c) c.textContent = hidden ? '−' : '+';
      });
    });
  }

  /* ------------------------------------------------------------ 选项卡 */
  function initTabs() {
    $$('[data-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var grp = btn.getAttribute('data-tab');
        $$('[data-tab="' + grp + '"]').forEach(function (b) { b.classList.remove('on'); });
        btn.classList.add('on');
        $$('[data-tabpanel^="' + grp + '-"]').forEach(function (p) { p.style.display = 'none'; });
        var target = $('#tabpanel-' + grp + '-' + btn.getAttribute('data-tabid'));
        if (target) target.style.display = 'block';
      });
    });
  }

  /* ------------------------------------------------------ 复制分享链接 */
  function initShare() {
    $$('[data-copy]').forEach(function (b) {
      b.addEventListener('click', function () {
        var url = window.location.origin + window.location.pathname + window.location.search;
        if (navigator.clipboard) navigator.clipboard.writeText(url);
        var t = b.textContent;
        b.textContent = '已复制链接';
        setTimeout(function () { b.textContent = t; }, 1400);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initAnnotations();
    initSearchHub();
    initFacets();
    initRowSelect();
    initTierPop();
    initAltRows();
    initSteppers();
    initCart();
    initInquiryForm();
    initSpecGroups();
    initTabs();
    initShare();
  });
})();

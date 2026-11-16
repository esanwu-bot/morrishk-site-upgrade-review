/* ============================================================================
   Morrishk Intelligence — Admin Prototype UI Kit
   依赖：../assets/tokens.css + ../assets/proto.css + 本目录 admin.css
   约束：不发起网络请求；不写库；所有图表为内联 SVG；不出现字面色值。
   ========================================================================= */
(function () {
  'use strict';

  /* -------------------------------------------------------------- 图标 */
  var ICONS = {
    grid: '<rect x="2.2" y="2.2" width="4.6" height="4.6" rx="1"/><rect x="9.2" y="2.2" width="4.6" height="4.6" rx="1"/><rect x="2.2" y="9.2" width="4.6" height="4.6" rx="1"/><rect x="9.2" y="9.2" width="4.6" height="4.6" rx="1"/>',
    'check-square': '<rect x="2.4" y="2.4" width="11.2" height="11.2" rx="1.4"/><polyline points="5,8.2 7.2,10.4 11,6.2"/>',
    bell: '<path d="M8 2.2a3.6 3.6 0 0 0-3.6 3.6c0 2.9-1.2 4.1-1.2 4.1h9.6s-1.2-1.2-1.2-4.1A3.6 3.6 0 0 0 8 2.2Z"/><path d="M6.7 12.7a1.4 1.4 0 0 0 2.6 0"/>',
    trend: '<polyline points="2,11.6 5.4,8.1 8.4,10.1 14,4.2"/><polyline points="10.4,4.2 14,4.2 14,7.8"/>',
    box: '<path d="M2.4 5 8 2.2 13.6 5v6L8 13.8 2.4 11Z"/><polyline points="2.4,5 8,7.8 13.6,5"/><line x1="8" y1="7.8" x2="8" y2="13.8"/>',
    tag: '<path d="M2.4 8.2V3.3a.8.8 0 0 1 .8-.8h4.9l6 6-5.7 5.7-6-6Z"/><circle cx="5.4" cy="5.4" r=".9"/>',
    layers: '<path d="M8 2.2 14 5.4 8 8.6 2 5.4Z"/><polyline points="2,8.2 8,11.4 14,8.2"/><polyline points="2,10.9 8,14.1 14,10.9"/>',
    warehouse: '<path d="M2.2 6.3 8 2.6l5.8 3.7v7.1H2.2Z"/><path d="M5.3 13.4V9h5.4v4.4"/>',
    'file-text': '<path d="M3.5 2.2h5.6L12.5 5.6v8.2h-9Z"/><polyline points="9,2.2 9,5.8 12.5,5.8"/><line x1="5.6" y1="8.6" x2="10.4" y2="8.6"/><line x1="5.6" y1="11" x2="9.4" y2="11"/>',
    search: '<circle cx="7" cy="7" r="4.2"/><line x1="10.2" y1="10.2" x2="13.8" y2="13.8"/>',
    inbox: '<path d="M2.2 9.2h3l1 2h3.6l1-2h3v4.6H2.2Z"/><path d="M2.6 9.2 4.4 3h7.2l1.8 6.2"/>',
    settings: '<circle cx="8" cy="8" r="2.1"/><path d="M8 1.8v2M8 12.2v2M1.8 8h2M12.2 8h2M3.6 3.6l1.4 1.4M11 11l1.4 1.4M12.4 3.6 11 5M5 11l-1.4 1.4"/>',
    megaphone: '<path d="M3 6.4 11.6 3v10L3 9.5Z"/><path d="M3 6.4H2.2A1.2 1.2 0 0 0 1 7.6v.6a1.2 1.2 0 0 0 1.2 1.2H3"/><path d="m5.6 10.3.8 3.2h2"/>',
    globe: '<circle cx="8" cy="8" r="5.6"/><path d="M2.4 8h11.2"/><path d="M8 2.4c1.9 1.6 2.9 3.5 2.9 5.6S9.9 12 8 13.6C6.1 12 5.1 10.1 5.1 8S6.1 4 8 2.4Z"/>',
    folder: '<path d="M2.2 4.4h4l1.3 1.7h6.3v7.5H2.2Z"/>',
    share: '<circle cx="12" cy="4" r="1.9"/><circle cx="4" cy="8" r="1.9"/><circle cx="12" cy="12" r="1.9"/><line x1="5.7" y1="7.1" x2="10.3" y2="4.9"/><line x1="5.7" y1="8.9" x2="10.3" y2="11.1"/>',
    calendar: '<rect x="2.4" y="3.4" width="11.2" height="10.2" rx="1"/><line x1="2.4" y1="6.6" x2="13.6" y2="6.6"/><line x1="5.4" y1="2" x2="5.4" y2="4.4"/><line x1="10.6" y1="2" x2="10.6" y2="4.4"/>',
    video: '<rect x="2.2" y="4.2" width="8.2" height="7.6" rx="1"/><path d="m10.4 7.2 3.4-2v5.6l-3.4-2Z"/>',
    target: '<circle cx="8" cy="8" r="5.6"/><circle cx="8" cy="8" r="3.2"/><circle cx="8" cy="8" r=".9"/>',
    chart: '<line x1="2.5" y1="13.5" x2="2.5" y2="9"/><line x1="6.2" y1="13.5" x2="6.2" y2="5.5"/><line x1="9.9" y1="13.5" x2="9.9" y2="7.5"/><line x1="13.6" y1="13.5" x2="13.6" y2="3.5"/>',
    chip: '<rect x="4.2" y="4.2" width="7.6" height="7.6" rx="1.2"/><path d="M6 2v2.2M10 2v2.2M6 11.8V14M10 11.8V14M2 6h2.2M2 10h2.2M11.8 6H14M11.8 10H14"/>',
    file: '<path d="M4 2.2h5.2L12.8 6v7.8H4Z"/><polyline points="9,2.2 9,6.2 12.8,6.2"/>',
    'shield-check': '<path d="M8 2 13 4v4.1c0 3.1-2.2 5.3-5 6-2.8-.7-5-2.9-5-6V4Z"/><polyline points="5.8,8 7.4,9.6 10.4,6.4"/>',
    database: '<ellipse cx="8" cy="4" rx="5.2" ry="1.9"/><path d="M2.8 4v8c0 1 2.3 1.9 5.2 1.9s5.2-.9 5.2-1.9V4"/><path d="M2.8 8c0 1 2.3 1.9 5.2 1.9s5.2-.9 5.2-1.9"/>',
    history: '<path d="M3 8a5 5 0 1 0 1.6-3.7"/><polyline points="3,2.6 3,5.4 5.8,5.4"/><polyline points="8,5.2 8,8 10.2,9.4"/>',
    sparkles: '<path d="M8 2.4 9.2 5.7 12.5 7 9.2 8.3 8 11.6 6.8 8.3 3.5 7 6.8 5.7Z"/><path d="m12.4 10.2.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6Z"/>',
    users: '<circle cx="6" cy="5.4" r="2.2"/><path d="M1.8 13.4c0-2.3 1.9-3.7 4.2-3.7s4.2 1.4 4.2 3.7"/><circle cx="12" cy="5.9" r="1.7"/><path d="M11.3 9.9c1.8.3 3.1 1.5 3.1 3.2"/>',
    key: '<circle cx="5.2" cy="8" r="2.7"/><line x1="7.9" y1="8" x2="14" y2="8"/><line x1="12" y1="8" x2="12" y2="10.2"/><line x1="10.2" y1="8" x2="10.2" y2="9.5"/>',
    clipboard: '<rect x="3.4" y="3.2" width="9.2" height="10.6" rx="1"/><path d="M6 3.2V2h4v1.2"/><line x1="5.7" y1="6.4" x2="10.3" y2="6.4"/><line x1="5.7" y1="9" x2="10.3" y2="9"/>',
    list: '<line x1="5.6" y1="4" x2="13.4" y2="4"/><line x1="5.6" y1="8" x2="13.4" y2="8"/><line x1="5.6" y1="12" x2="13.4" y2="12"/><circle cx="2.7" cy="4" r=".6"/><circle cx="2.7" cy="8" r=".6"/><circle cx="2.7" cy="12" r=".6"/>',
    sliders: '<line x1="2.5" y1="4.5" x2="13.5" y2="4.5"/><line x1="2.5" y1="8" x2="13.5" y2="8"/><line x1="2.5" y1="11.5" x2="13.5" y2="11.5"/><circle cx="5.5" cy="4.5" r="1.3"/><circle cx="10" cy="8" r="1.3"/><circle cx="7" cy="11.5" r="1.3"/>',
    menu: '<line x1="2.5" y1="4.5" x2="13.5" y2="4.5"/><line x1="2.5" y1="8" x2="13.5" y2="8"/><line x1="2.5" y1="11.5" x2="13.5" y2="11.5"/>',
    help: '<circle cx="8" cy="8" r="5.6"/><path d="M6.2 6.2a1.8 1.8 0 1 1 2.7 1.6c-.6.4-.9.8-.9 1.5"/><circle cx="8" cy="11.7" r=".5" fill="currentColor" stroke="none"/>',
    'chevron-down': '<polyline points="4.2,6.2 8,10 11.8,6.2"/>',
    user: '<circle cx="8" cy="5.4" r="2.6"/><path d="M2.8 13.6c0-2.6 2.3-4.2 5.2-4.2s5.2 1.6 5.2 4.2"/>',
    logout: '<path d="M9.5 2.5H4.4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h5.1"/><line x1="9.4" y1="8" x2="14" y2="8"/><polyline points="11.6,5.6 14,8 11.6,10.4"/>',
    x: '<line x1="3.6" y1="3.6" x2="12.4" y2="12.4"/><line x1="12.4" y1="3.6" x2="3.6" y2="12.4"/>',
    check: '<polyline points="3,8.4 6.4,11.8 13,4.6"/>',
    clock: '<circle cx="8" cy="8" r="5.6"/><polyline points="8,4.6 8,8 10.6,9.6"/>',
    alert: '<path d="M8 2.4 14.4 13.4H1.6Z"/><line x1="8" y1="6.3" x2="8" y2="9.5"/><circle cx="8" cy="11.6" r=".5" fill="currentColor" stroke="none"/>',
    'arrow-right': '<line x1="2.5" y1="8" x2="13.2" y2="8"/><polyline points="9.6,4.4 13.2,8 9.6,11.6"/>',
    'arrow-left': '<line x1="13.5" y1="8" x2="2.8" y2="8"/><polyline points="6.4,4.4 2.8,8 6.4,11.6"/>',
    plus: '<line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/>',
    download: '<line x1="8" y1="2.6" x2="8" y2="10.2"/><polyline points="4.8,7 8,10.2 11.2,7"/><path d="M3 11.6v2h10v-2"/>',
    upload: '<line x1="8" y1="13.4" x2="8" y2="5.6"/><polyline points="4.8,8.8 8,5.6 11.2,8.8"/><path d="M3 3h10"/>',
    refresh: '<path d="M13 8a5 5 0 1 1-1.6-3.7"/><polyline points="13.2,2.6 13.2,5.6 10.2,5.6"/>',
    eye: '<path d="M1.6 8S3.9 3.8 8 3.8 14.4 8 14.4 8 12.1 12.2 8 12.2 1.6 8 1.6 8Z"/><circle cx="8" cy="8" r="1.9"/>',
    external: '<path d="M6 3h7v7"/><polyline points="13,3 7.4,8.6"/><path d="M11 11v2.2H2.8V5H5"/>',
    more: '<circle cx="3.6" cy="8" r=".8" fill="currentColor" stroke="none"/><circle cx="8" cy="8" r=".8" fill="currentColor" stroke="none"/><circle cx="12.4" cy="8" r=".8" fill="currentColor" stroke="none"/>',
    filter: '<path d="M2.5 3.4h11L9.4 8.5v4.4l-2.8 1.2V8.5Z"/>',
    play: '<path d="M4.8 2.8 13 8l-8.2 5.2Z"/>',
    edit: '<path d="M3 13h2.6L13.4 5.2 10.8 2.6 3 10.4Z"/><line x1="9.4" y1="4" x2="12" y2="6.6"/>',
    trash: '<line x1="3.5" y1="4.5" x2="12.5" y2="4.5"/><path d="M5.5 4.5V3h5v1.5"/><path d="m4.6 4.5.7 9h5.4l.7-9"/>',
    lock: '<rect x="3.5" y="7.2" width="9" height="6.2" rx="1"/><path d="M5.4 7.2V5.4a2.6 2.6 0 0 1 5.2 0v1.8"/>',
    link: '<path d="m6.8 9.2 2.4-2.4"/><path d="M7.4 4.8 8.8 3.4a2.5 2.5 0 0 1 3.6 3.6L11 8.4"/><path d="m8.6 11.2-1.4 1.4a2.5 2.5 0 0 1-3.6-3.6L5 7.6"/>',
    mail: '<rect x="2" y="3.6" width="12" height="8.8" rx="1"/><path d="m2.4 4.4 5.6 4.3 5.6-4.3"/>',
    gauge: '<path d="M2.4 11.4a6 6 0 1 1 11.2 0"/><line x1="8" y1="8" x2="10.6" y2="6"/><circle cx="8" cy="8" r=".7" fill="currentColor" stroke="none"/>',
    code: '<polyline points="5.2,4.6 2,8 5.2,11.4"/><polyline points="10.8,4.6 14,8 10.8,11.4"/>',
    split: '<line x1="8" y1="2" x2="8" y2="14"/><path d="M2.5 5h3.4l2.1 3-2.1 3H2.5"/><path d="M13.5 5H10.1L8 8l2.1 3h3.4"/>',
    building: '<rect x="3" y="2.4" width="10" height="11.2" rx=".8"/><path d="M5.6 5h1M9.4 5h1M5.6 7.6h1M9.4 7.6h1M5.6 10.2h1M9.4 10.2h1"/><line x1="8" y1="13.6" x2="8" y2="11.4"/>',
    copy: '<rect x="5.4" y="5.4" width="8" height="8" rx="1"/><path d="M3.4 10V3h7"/>',
    star: '<path d="M8 2.2 9.8 5.9 13.8 6.5 10.9 9.3 11.6 13.3 8 11.4 4.4 13.3 5.1 9.3 2.2 6.5 6.2 5.9Z"/>',
    flag: '<line x1="3.5" y1="2.5" x2="3.5" y2="14"/><path d="M3.5 3h8.8l-1.6 2.9 1.6 2.9H3.5"/>',
    book: '<path d="M8 4.2C6.4 3 4.3 2.8 2.4 3.4v9.2c1.9-.6 4-.4 5.6.8 1.6-1.2 3.7-1.4 5.6-.8V3.4C11.7 2.8 9.6 3 8 4.2Z"/><line x1="8" y1="4.2" x2="8" y2="13.4"/>',
    dot: '<circle cx="8" cy="8" r="2.4" fill="currentColor" stroke="none"/>'
  };

  function icon(name, cls) {
    return '<svg class="i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 16 16" fill="none" stroke="currentColor" ' +
      'stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      (ICONS[name] || ICONS.dot) + '</svg>';
  }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function num(v) {
    if (typeof v === 'number') return new Intl.NumberFormat('en-US').format(v);
    return v == null ? '—' : String(v);
  }

  function compact(v) {
    if (v >= 1000000) return (v / 1000000).toFixed(v >= 10000000 ? 1 : 2).replace(/\.0$/, '') + 'M';
    if (v >= 1000) return (v / 1000).toFixed(v >= 10000 ? 1 : 2).replace(/\.0$/, '') + 'K';
    return String(v);
  }

  /* -------------------------------------------------------------- 状态 */
  function kind(s) {
    s = String(s == null ? '' : s);
    if (/^(Demo Connected|Demo|Design|Not Connected|Disconnected|Draft|Scheduled|Planned|Paused|Archived|—|-|MFA|API Key|Invited)$/.test(s)) return 'muted';
    if (/^(Failed|Spam|Rejected|Lost|Out of Stock|End of Life|Deprecated|Missing Meta|Denied|Error|Critical)/.test(s)) return 'bad';
    if (/^(Pending|Pending Review|Needs Review|Needs Revision|Low Stock|Review|Parsing|Returned|Uploaded|Needs Content|Opportunity)/.test(s)) return 'warn';
    if (/^(Published|Active|Verified|Approved|Won|Success|Optimized|Enabled|Parsed|Good|In Stock|Completed|Connected|Enabled)/.test(s)) return 'ok';
    if (/^(New|Assigned|Quoted|Open|Normal|Review)/.test(s)) return '';
    return '';
  }

  function pill(s, label) {
    var k = kind(s);
    var ic = k === 'ok' ? 'check' : k === 'warn' ? 'clock' : k === 'bad' ? 'alert' : 'dot';
    return '<span class="st' + (k ? ' st-' + k : '') + '">' + icon(ic) + esc(label || s) + '</span>';
  }

  function stock(s, qty) {
    var cls = { 'In Stock': 'stock-ok', 'Low Stock': 'stock-low', 'Out of Stock': 'stock-out', 'End of Life': 'stock-eol' }[s] || 'stock-ok';
    var ico = { 'stock-ok': '✓', 'stock-low': '!', 'stock-out': '×', 'stock-eol': '—' }[cls];
    return '<span class="stock ' + cls + '"><i class="stock-ico">' + ico + '</i><span class="stock-txt">' + esc(s) + '</span>' +
      (qty != null ? '<span class="stock-qty num">' + num(qty) + '</span>' : '') + '</span>';
  }

  /* -------------------------------------------------------------- 组件 */
  function pageHead(title, sub, actions) {
    return '<div class="adm-head"><div><h1>' + title + '</h1>' + (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div>' +
      (actions ? '<div class="adm-head-actions">' + actions + '</div>' : '') + '</div>';
  }

  function demoChip(label) {
    return '<span class="demo-chip" data-mock="' + esc(label || 'Demo 数据') + '"><span class="dot warn"></span>Demo</span>';
  }

  function toolbar(left, right) {
    return '<div class="adm-toolbar">' + (left || '') + '<div class="grow"></div>' + (right || '') + '</div>';
  }

  function stat(o) {
    return '<div class="stat' + (o.warn ? ' is-warn' : '') + (o.accent ? ' is-accent' : '') + '"' + (o.mock ? ' data-mock="' + esc(o.mock) + '"' : '') + '>' +
      '<div class="stat-top"><span class="stat-label">' + o.k + '</span><span class="stat-ico">' + icon(o.icon || 'dot') + '</span></div>' +
      '<div class="stat-value">' + o.v + (o.unit ? ' <small>' + o.unit + '</small>' : '') + '</div>' +
      '<div class="stat-foot">' + (o.delta ? '<span class="stat-delta' + (o.down ? ' down' : '') + (o.warnDelta ? ' warn' : '') + '">' + o.delta + '</span>' : '') +
      '<span>' + (o.note || '') + '</span></div></div>';
  }

  function card(o) {
    var pad = o.pad === false ? ' class="card-bd tight"' : ' class="card-bd ' + (o.padSm ? 'pad-sm' : 'pad') + '"';
    return '<section class="card' + (o.cls ? ' ' + o.cls : '') + '">' +
      '<div class="card-hd"><div><h2>' + o.title + '</h2>' + (o.sub ? '<div class="sub">' + o.sub + '</div>' : '') + '</div>' +
      (o.actions ? '<div class="row" style="gap:var(--sp-2)">' + o.actions + '</div>' : '') + '</div>' +
      '<div' + pad + '>' + o.body + '</div></section>';
  }

  function tbl(head, body, cls, attrs) {
    return '<div class="table-wrap"><table class="grid' + (cls ? ' ' + cls : '') + '"' + (attrs ? ' ' + attrs : '') + '><thead><tr>' +
      head.map(function (h) {
        if (typeof h === 'string') return '<th>' + h + '</th>';
        return '<th' + (h.cls ? ' class="' + h.cls + '"' : '') + '>' + h.h + (h.sub ? '<span class="th-sub">' + h.sub + '</span>' : '') + '</th>';
      }).join('') + '</tr></thead><tbody>' + body + '</tbody></table></div>';
  }

  function foot(count, note) {
    return '<div class="table-foot"><span>' + count + '</span><span class="muted">' + (note || 'Demo 抽样数据 · 不分页') + '</span></div>';
  }

  function empty(msg) {
    return '<div class="empty">' + (msg || '没有符合条件的记录') + '</div>';
  }

  function tabs(items, active, group) {
    return '<div class="tabs" data-tabs="' + group + '">' + items.map(function (t) {
      return '<button class="tab' + (t.id === active ? ' active' : '') + '" type="button" data-tab="' + t.id + '"' +
        (t.statusFilter != null ? ' data-status-filter="' + esc(t.statusFilter) + '"' : '') + '>' + t.t +
        (t.count != null ? '<span class="cnt">' + t.count + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  }

  function panels(group, panels, active) {
    return '<div data-panels="' + group + '">' + panels.map(function (p) {
      return '<div data-panel="' + p.id + '"' + (p.id === active ? '' : ' hidden') + '>' + p.body + '</div>';
    }).join('') + '</div>';
  }

  /* -------------------------------------------------------------- 图表 */
  function chart(cfg) {
    var w = 720, h = cfg.h || 190, pl = 44, pr = 16, pt = 14, pb = 26;
    var series = cfg.series || [];
    var n = Math.max.apply(null, series.map(function (s) { return s.v.length; }));
    var all = series.reduce(function (a, s) { return a.concat(s.v); }, []);
    var max = cfg.max || Math.max.apply(null, all) * 1.16 || 1;
    var iw = w - pl - pr, ih = h - pt - pb;
    function X(i) { return pl + (n <= 1 ? 0 : i * iw / (n - 1)); }
    function Y(v) { return pt + ih * (1 - v / max); }
    var out = '<svg class="viz" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(cfg.label || '趋势图') + '">';
    [0, 0.25, 0.5, 0.75, 1].forEach(function (r) {
      var y = pt + ih * r;
      out += '<line class="viz-grid" x1="' + pl + '" y1="' + y + '" x2="' + (w - pr) + '" y2="' + y + '"/>';
      out += '<text class="viz-label" x="' + (pl - 7) + '" y="' + (y + 3) + '" text-anchor="end">' + compact(Math.round(max * (1 - r))) + '</text>';
    });
    series.forEach(function (s) {
      var d = s.v.map(function (v, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); }).join(' ');
      if (s.area) {
        out += '<path class="' + (s.areaCls || 'viz-area-1') + '" d="' + d + ' L' + X(s.v.length - 1) + ' ' + (pt + ih) + ' L' + pl + ' ' + (pt + ih) + ' Z"/>';
      }
      out += '<path class="' + (s.cls || 'viz-line-1') + '" d="' + d + '"/>';
      var li = s.v.length - 1;
      out += '<circle class="viz-point" cx="' + X(li) + '" cy="' + Y(s.v[li]) + '" r="3"><title>' + esc(s.name || '') + '：' + num(s.v[li]) + '</title></circle>';
    });
    var labels = cfg.labels || [];
    if (labels.length) {
      [0, Math.floor((labels.length - 1) / 2), labels.length - 1].forEach(function (i, k) {
        if (i == null || labels[i] == null) return;
        out += '<text class="viz-label" x="' + X(i) + '" y="' + (h - 8) + '" text-anchor="' + (k === 0 ? 'start' : k === 2 ? 'end' : 'middle') + '">' + esc(labels[i]) + '</text>';
      });
    }
    out += '</svg>';
    return out;
  }

  function bars(values, labels, h) {
    h = h || 150;
    var w = 720, pl = 30, pr = 10, pt = 10, pb = 24, iw = w - pl - pr, ih = h - pt - pb;
    var max = Math.max.apply(null, values) * 1.15 || 1;
    var bw = iw / values.length * 0.54;
    var out = '<svg class="viz" viewBox="0 0 ' + w + ' ' + h + '" role="img">';
    out += '<line class="viz-axis" x1="' + pl + '" y1="' + (pt + ih) + '" x2="' + (w - pr) + '" y2="' + (pt + ih) + '"/>';
    values.forEach(function (v, i) {
      var x = pl + iw * i / values.length + (iw / values.length - bw) / 2;
      var bh = ih * v / max;
      out += '<rect class="viz-bar" x="' + x.toFixed(1) + '" y="' + (pt + ih - bh).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="1"><title>' + esc((labels || [])[i] || '') + '：' + num(v) + '</title></rect>';
      if (labels && labels[i] && (values.length <= 8 || i % 2 === 0)) {
        out += '<text class="viz-label" x="' + (x + bw / 2) + '" y="' + (h - 7) + '" text-anchor="middle">' + esc(labels[i]) + '</text>';
      }
    });
    out += '</svg>';
    return out;
  }

  function donut(segments, centerTop, centerSub) {
    var r = 54, c = 2 * Math.PI * r, off = 0;
    var out = '<svg class="viz" viewBox="0 0 160 160" style="max-width:180px;margin:0 auto" role="img" aria-label="渠道占比">';
    out += '<circle class="viz-donut" cx="80" cy="80" r="' + r + '" stroke="var(--color-surface-sunken)" stroke-width="14" fill="none"/>';
    segments.forEach(function (s) {
      var len = c * s.v / 100;
      out += '<circle class="viz-donut ' + (s.cls || '') + '" cx="80" cy="80" r="' + r + '" stroke-dasharray="' + len.toFixed(2) + ' ' + (c - len).toFixed(2) +
        '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 80 80)"><title>' + esc(s.k) + '：' + s.v + '%</title></circle>';
      off += len;
    });
    out += '<text x="80" y="78" text-anchor="middle" style="font-size:20px;font-weight:600;fill:var(--color-text)">' + esc(centerTop || '') + '</text>';
    out += '<text x="80" y="96" text-anchor="middle" style="font-size:9px;letter-spacing:.08em;fill:var(--color-text-muted)">' + esc(centerSub || '') + '</text>';
    out += '</svg>';
    return out;
  }

  function spark(values, cls) {
    var w = 88, h = 24, max = Math.max.apply(null, values) || 1, min = Math.min.apply(null, values);
    var span = max - min || 1;
    var d = values.map(function (v, i) {
      return (i ? 'L' : 'M') + (i * w / (values.length - 1)).toFixed(1) + ' ' + (h - 2 - (v - min) / span * (h - 6)).toFixed(1);
    }).join(' ');
    return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><path class="' + (cls || '') + '" d="' + d + '"/></svg>';
  }

  function funnel(items) {
    var first = items[0].v || 1;
    return '<div class="funnel">' + items.map(function (f, i) {
      var pct = Math.max(4, f.v / first * 100);
      var cls = i === items.length - 1 ? ' acc' : i % 2 ? ' alt' : '';
      return '<div class="funnel-row"><div class="funnel-label">' + esc(f.k) + '</div>' +
        '<div class="funnel-track"><div class="funnel-fill' + cls + '" style="width:' + pct.toFixed(1) + '%"></div></div>' +
        '<div class="funnel-val num">' + num(f.v) + ' <span class="funnel-rate">' + (f.rate || '') + '</span></div></div>';
    }).join('') + '</div>';
  }

  function flow(steps, activeIndex) {
    return '<div class="flow">' + steps.map(function (s, i) {
      var cls = i < activeIndex ? ' done' : i === activeIndex ? ' active' : '';
      return '<div class="flow-step' + cls + '"><span class="n">' + String(i + 1).padStart(2, '0') + '</span><span class="t">' + esc(s) + '</span></div>' +
        (i < steps.length - 1 ? '<span class="flow-arrow">' + icon('arrow-right') + '</span>' : '');
    }).join('') + '</div>';
  }

  function kv(items) {
    return '<div class="kv">' + items.map(function (it) {
      return '<div><span class="k">' + esc(it.k) + '</span><span class="v' + (it.mono ? ' mono' : '') + '">' + (it.v == null ? '—' : it.v) + '</span></div>';
    }).join('') + '</div>';
  }

  function evidence(p) {
    var items = [
      ['DocumentId', p.doc || '—'],
      ['ParseRunId', p.run || '—'],
      ['DocumentVersion', p.docVersion || '—'],
      ['DocumentType', p.docType || '—'],
      ['DocumentSubject', p.docSubject || '—'],
      ['Product MPN', p.mpn || '—'],
      ['RawLabel', p.rawLabel || '—'],
      ['RawValue', p.rawValue || '—'],
      ['NormalizedValue', p.value == null ? '—' : p.value + (p.unit && p.unit !== '—' ? ' ' + p.unit : '')],
      ['ValueKind', p.kind || '—'],
      ['Conditions', p.conditions || '—'],
      ['PageNo', p.page == null ? '—' : 'p.' + p.page],
      ['TableId / RowId', (p.table || '—') + ' / ' + (p.row || '—')],
      ['CellBBox', p.bbox || '—'],
      ['ReviewStatus', p.status || '—'],
      ['Confidence（补充）', p.confidence == null ? '—' : Math.round(p.confidence * 100) + '%']
    ];
    return '<div class="evidence"><h4>证据链 · Ds Bit（Demo 快照）</h4>' +
      '<blockquote>' + esc(p.snippet) + '</blockquote>' +
      '<div class="kv ev-kv">' + items.map(function (it) {
        return '<div><span class="k">' + esc(it[0]) + '</span><span class="v mono">' + esc(it[1]) + '</span></div>';
      }).join('') + '</div>' +
      '<div class="meta-row"><span>来源文件：' + esc(p.file || '—') + '</span><span>文档 SHA-256 前缀（20 hex，Demo）：' + esc(p.hash) + '…</span>' +
      '<span>适用性：' + esc(p.applicability || '未判定') + '</span></div>' +
      '<div class="meta-row">CellBBox 只证明文本在页面中的位置，不证明参数适用于该产品；适用性由 MPN 匹配、文档主体与测试条件共同判断。</div>' +
      '<div class="meta-row">ReviewStatus 是参数级状态，不等于 PIPELINE_PASS / CONTENT_APPROVED / RELEASE_APPROVED。</div></div>';
  }

  function note(text, kind, title) {
    return '<div class="note' + (kind ? ' ' + kind : '') + '">' + (title ? '<strong>' + title + '</strong> ' : '') + text + '</div>';
  }

  function progress(pct, warn) {
    return '<div class="progress' + (warn ? ' warn' : '') + '"><span style="width:' + Math.min(100, pct) + '%"></span></div>';
  }

  function meter(label, value, max, warn) {
    return '<div class="meter-row"><span class="k">' + esc(label) + '</span>' + progress(Math.round(value / max * 100), warn) + '<span class="v">' + value + '</span></div>';
  }

  /* -------------------------------------------------------------- 浮层 */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var scrim, drawer, drawerBody, drawerFoot, modal, modalBody, modalFoot, toasts;
  var lastFocus = null;

  function initOverlays() {
    scrim = $('#scrim'); drawer = $('#drawer'); modal = $('#modal'); toasts = $('#toasts');
    drawerBody = $('#drawerBody'); drawerFoot = $('#drawerFoot');
    modalBody = $('#modalBody'); modalFoot = $('#modalFoot');
    scrim.addEventListener('click', closeAll);
    $('#drawerClose').addEventListener('click', closeDrawer);
    $('#modalClose').addEventListener('click', closeModal);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAll();
    });
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    if (!modal.classList.contains('open')) scrim.classList.remove('open');
    if (lastFocus) { try { lastFocus.focus(); } catch (e) {} }
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    if (!drawer.classList.contains('open')) scrim.classList.remove('open');
  }

  function closeAll() {
    closeDrawer();
    closeModal();
    var app = $('.app'); if (app) app.classList.remove('nav-open');
  }

  function openDrawer(o) {
    lastFocus = document.activeElement;
    $('#drawerKicker').textContent = o.kicker || '详情';
    $('#drawerTitle').textContent = o.title || '—';
    $('#drawerSub').innerHTML = o.sub || '';
    drawerBody.innerHTML = o.body || '';
    drawerFoot.innerHTML = o.foot || '';
    scrim.classList.add('open');
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    $('#drawerClose').focus();
  }

  function openModal(o) {
    lastFocus = document.activeElement;
    $('#modalTitle').textContent = o.title || '—';
    modalBody.innerHTML = o.body || '';
    modalFoot.innerHTML = o.foot || '';
    modal.classList.toggle('modal--wide', !!o.wide);
    scrim.classList.add('open');
    modal.classList.add('open');
    if (o.onMount) o.onMount(modalBody, modalFoot);
    var f = modalBody.querySelector('input,select,textarea,button');
    if (f) f.focus();
  }

  function confirm(o) {
    openModal({
      title: o.title || '确认操作',
      body: '<div class="stack-sm">' + (o.body || '') + '<div class="note warn">Demo 操作：仅改变当前页面状态，不写库、不调用真实接口。</div></div>',
      foot: '<button class="btn btn-secondary" type="button" data-cancel>取消</button><button class="btn btn-primary" type="button" data-ok>' + (o.ok || '确认') + '</button>',
      onMount: function (b, f) {
        f.querySelector('[data-cancel]').addEventListener('click', closeModal);
        f.querySelector('[data-ok]').addEventListener('click', function () {
          closeModal();
          if (o.onOk) o.onOk();
        });
      }
    });
  }

  function toast(msg, kind) {
    if (!toasts) return;
    var t = document.createElement('div');
    t.className = 'toast' + (kind ? ' ' + kind : '');
    t.innerHTML = '<span class="ic">' + icon(kind === 'err' ? 'alert' : kind === 'warn' ? 'clock' : 'check') + '</span><span>' + msg + '</span>';
    toasts.appendChild(t);
    setTimeout(function () {
      t.style.opacity = '0';
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 240);
    }, 3200);
  }

  function copy(text, msg) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      }
    } catch (e) {}
    toast(msg || '已复制到剪贴板');
  }

  function mountIcons(root) {
    $$('[data-icon]', root || document).forEach(function (el) {
      var name = el.getAttribute('data-icon');
      el.removeAttribute('data-icon');
      el.insertAdjacentHTML('afterbegin', icon(name));
    });
  }

  window.UI = {
    icon: icon, esc: esc, num: num, compact: compact,
    pill: pill, stock: stock, kind: kind,
    pageHead: pageHead, demoChip: demoChip, toolbar: toolbar, stat: stat, card: card,
    tbl: tbl, foot: foot, empty: empty, tabs: tabs, panels: panels,
    chart: chart, bars: bars, donut: donut, spark: spark, funnel: funnel, flow: flow,
    kv: kv, evidence: evidence, note: note, progress: progress, meter: meter,
    initOverlays: initOverlays, openDrawer: openDrawer, closeDrawer: closeDrawer,
    openModal: openModal, closeModal: closeModal, closeAll: closeAll, confirm: confirm,
    toast: toast, copy: copy, mountIcons: mountIcons
  };
})();

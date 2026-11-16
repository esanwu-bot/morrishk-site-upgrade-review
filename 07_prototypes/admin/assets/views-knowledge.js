/* ============================================================================
   Views — 产品知识（Ds Bit 数据入口）
   ========================================================================= */
(function () {
  'use strict';
  var D = window.ADMIN_DATA, UI = window.UI;
  var V = window.VIEWS = window.VIEWS || {};
  var esc = UI.esc;

  var VERSIONS = [
    { id: 'KV-2026.11.16-03', scope: 'MCF8315A · 6 参数', change: 'RDS(on) 降级为待审核', author: '周倩', time: '2026-11-16 09:05', status: 'Draft', note: '人工审核触发状态变化，尚未发布到知识库。' },
    { id: 'KV-2026.11.15-02', scope: 'MCF8315A · 6 参数', change: '初始解析入库', author: 'svc-dsbit', time: '2026-11-15 10:44', status: 'Active', note: 'DS-1042 解析完成，5 项已验证、1 项待审核。' },
    { id: 'KV-2026.11.14-01', scope: 'LM317T · 3 参数', change: 'Dropout 参数标记待审核', author: '周倩', time: '2026-11-14 09:53', status: 'Active', note: '置信度 0.68 低于阈值。' },
    { id: 'KV-2026.11.13-02', scope: 'IRF540NPBF · 3 参数', change: 'RDS(on) 待审核', author: '周倩', time: '2026-11-13 14:33', status: 'Active', note: '证据页码与表格区域已对齐。' },
    { id: 'KV-2026.11.12-01', scope: 'TLP185(GB) · 2 参数', change: 'Datasheet v1.2 复核', author: 'svc-dsbit', time: '2026-11-12 11:20', status: 'Archived', note: '已归档旧版本，保留证据链。' }
  ];
  window.ADMIN_VERSIONS = VERSIONS;

  function withDoc(p) {
    var d = D.documents.filter(function (x) { return x.id === p.doc; })[0] || {};
    var o = {};
    for (var k in p) { if (Object.prototype.hasOwnProperty.call(p, k)) o[k] = p[k]; }
    o.file = d.file;
    o.docVersion = d.version;
    o.docType = d.type;
    o.docSubject = d.subject;
    return o;
  }

  /* ================================================================ Ds Bit 数据资产 */
  V.dsbit = function (S) {
    var stats = [
      { k: 'Datasheet 文档', v: '1,284', note: 'Demo 快照', icon: 'file' },
      { k: '已解析文档', v: '1,240', note: '96.6%（Demo）', icon: 'check' },
      { k: '结构化参数', v: '186,420', note: '跨 3,120 个 MPN', icon: 'database' },
      { k: '参数级 Verified', v: '172,930', note: '92.7% ReviewStatus', icon: 'shield-check' },
      { k: '待审核', v: '1,268', note: '含低置信度', icon: 'clock', warn: true }
    ].map(function (x) { return UI.stat(x); }).join('');

    var runtimeRows = [
      ['Ds Bit 解析引擎', '未连接 · Demo 快照', '只读对接 dsbit.internal:8080'],
      ['内容发布队列', '未接入 · Demo 状态', '异步发布队列 + 失败重试'],
      ['GA4', '未连接', '网站行为数据接入'],
      ['Search Console', '未连接', '搜索表现数据接入'],
      ['社媒 API', '未连接', 'OAuth 授权与平台发布接口']
    ].map(function (r) {
      return '<tr><td><span class="cell-main">' + r[0] + '</span></td>' +
        '<td>' + UI.pill('Not Connected', r[1]) + '</td><td class="muted">' + r[2] + '</td></tr>';
    }).join('');

    var gates = [
      { k: 'PIPELINE_PASS', t: '文档可解析、证据字段完整（页码 / 表格 / 行 / bbox / 原文）', fail: '不进入参数候选', now: '未运行（Demo 快照）' },
      { k: 'CONTENT_APPROVED', t: '参数审核与内容审核通过，可被商品详情与内容引用', fail: '保持只读或退回修改', now: '部分参数 Verified（Demo）' },
      { k: 'RELEASE_APPROVED', t: '指定发布批次获批，可写入生产站点或渠道', fail: '保持草稿，不可发布', now: '未申请（Demo）' }
    ].map(function (g) {
      return '<tr><td><span class="mono-sm">' + g.k + '</span></td><td>' + g.t + '</td><td class="muted">' + g.fail + '</td>' +
        '<td>' + UI.pill('Demo', g.now) + '</td></tr>';
    }).join('');

    var modelFields = [
      ['DocumentId', '文档唯一编号', 'DS-1042'],
      ['ParseRunId', '一次解析运行编号', 'PR-20261115-1042-01'],
      ['DocumentVersion', '文档版本', 'v2.1'],
      ['DocumentType', '文档类型', 'Datasheet / Selection Guide'],
      ['DocumentSubject', '文档主体（系列或型号）', 'MCF8315A three-phase … driver'],
      ['RawLabel', '文档原始参数名', 'VVM'],
      ['RawValue', '文档原始值', '4.5 V to 35 V'],
      ['NormalizedValue', '标准化值 + 单位', '4.5–35 V'],
      ['ValueKind', '值类型', 'range / typ / max / enum'],
      ['Conditions', '测试或适用条件', 'TA = 25°C'],
      ['PageNo', '页码', 'p.8'],
      ['TableId', '表格编号', 'T-08-02'],
      ['RowId', '行编号', 'R-04'],
      ['CellBBox', '单元格坐标', '[312, 486, 528, 502]'],
      ['ReviewStatus', '参数审核状态', 'Verified / Needs Review / Rejected']
    ].map(function (f) {
      return '<tr><td><span class="mono-sm">' + f[0] + '</span></td><td>' + f[1] + '</td><td class="muted mono-sm">' + esc(f[2]) + '</td></tr>';
    }).join('');

    var appRows = D.documents.map(function (d) {
      return '<tr><td><span class="mono-sm">' + esc(d.id) + '</span></td><td><span class="cell-main">' + esc(d.mpn) + '</span></td>' +
        '<td>' + esc(d.type) + '</td><td class="muted">' + esc(d.subject) + '</td><td>' + esc(d.version) + '</td>' +
        '<td>' + UI.pill(d.applicability === 'Direct' ? 'Approved' : d.applicability === 'Family match' ? 'Demo' : 'Needs Review',
          d.applicability === 'Direct' ? 'Direct · MPN 匹配' : d.applicability === 'Family match' ? 'Family match（仅背景）' : '待判定') + '</td>' +
        '<td class="muted">' + esc(d.applicabilityNote || (d.applicability === 'Direct' ? '参数可绑定到该 MPN' : '不绑定参数')) + '</td></tr>';
    }).join('');

    var nodes = [
      { k: '01 PDF', v: '入库', d: '文件哈希与版本' },
      { k: '02 Parser', v: '解析', d: '页 / 表格 / 文本' },
      { k: '03 Tables', v: '抽取', d: '行列结构还原' },
      { k: '04 Registry', v: '候选', d: '参数候选注册' },
      { k: '05 LLM', v: '归并', d: '同义与单位统一' },
      { k: '06 Evidence', v: '对齐', d: '页码 + bbox + 原文', gate: true },
      { k: '07 Audit', v: '定级', d: 'ReviewStatus 分流' }
    ];

    var pipeline = '<div class="pipeline">' + nodes.map(function (n) {
      return '<div class="pipe-node' + (n.gate ? ' gate' : '') + '"><div class="k">' + n.k + '</div><div class="v">' + n.v + '</div><div class="d">' + n.d + '</div></div>';
    }).join('') + '</div>';

    var statusRows = [
      { s: 'Verified', t: '证据可定位、置信度达标、人工确认', down: '参数可进入商品详情、知识库与营销内容', cls: 'Verified' },
      { s: 'Needs Review', t: '证据存在但置信度低或存在歧义', down: '不进入前台；进入审核队列', cls: 'Needs Review' },
      { s: 'Rejected', t: '证据缺失、冲突或无法对齐', down: '禁止引用；保留失败记录', cls: 'Rejected' }
    ].map(function (r) {
      return '<tr><td>' + UI.pill(r.s, r.s) + '</td><td>' + r.t + '</td><td class="muted">' + r.down + '</td></tr>';
    }).join('');

    var principles = D.stability.map(function (s) {
      return '<tr><td><span class="cell-main">' + esc(s.k) + '</span></td><td class="muted">' + esc(s.v) + '</td>' +
        '<td>' + UI.pill(s.status === 'Demo' ? 'Demo' : 'Design', s.status === 'Demo' ? 'Demo' : '设计约束') + '</td></tr>';
    }).join('');

    var sample = S.params.filter(function (p) { return p.mpn === 'MCF8315A' && p.status !== 'Verified'; })[0] || S.params[0];

    return '<div class="adm-page">' +
      UI.pageHead('Ds Bit 数据资产', 'Ds Bit 是独立运行的文档解析与证据校验引擎；本后台只设计数据管理与使用入口，当前原型不连接引擎、不执行解析。',
        UI.demoChip('Ds Bit 数据为 Demo 快照') +
        '<a class="btn btn-secondary btn-sm" href="#/coverage">覆盖矩阵</a>' +
        '<a class="btn btn-primary btn-sm" href="#/param-review">去审核</a>') +
      '<div class="grid-7-5">' +
      UI.card({ title: '当前原型状态', sub: '与目标架构分开标注，不把 Demo 快照写成运行状态', pad: false,
        body: UI.tbl(['系统', '当前原型', '目标架构'], runtimeRows) +
          '<div class="table-foot"><span>当前原型</span><span class="muted">无真实连接、无 Token、无队列</span></div>' }) +
      UI.card({ title: '三层质量状态', sub: '三个状态独立判定，不可合并为 Verified', pad: false,
        body: UI.tbl(['层级', '通过含义', '不通过', '当前'], gates) +
          '<div class="table-foot"><span>ReviewStatus 为参数级</span><span class="muted">不等于三个发布闸门</span></div>' }) +
      '</div>' +
      '<div class="stat-grid">' + stats + '</div>' +
      UI.card({ title: '处理流水线（目标架构）', sub: '每一级都可追溯；证据对齐是进入知识库前的硬门槛；当前原型只展示流程与字段', actions: UI.pill('Target', '目标架构'),
        body: pipeline, padSm: true }) +
      UI.card({ title: '参数数据模型（15 字段）', sub: '来源、原始值、标准化值、位置证据与审核状态一一对应', pad: false,
        body: UI.tbl(['字段', '说明', 'Demo 示例'], modelFields) }) +
      UI.card({ title: '产品 ↔ Datasheet 适用关系', sub: '同一份文档不一定适用于所有商品', pad: false,
        body: UI.tbl(['DocumentId', 'MPN', '类型', 'DocumentSubject', '版本', '适用性', '说明'], appRows) +
          '<div class="table-foot"><span>Family match 仅作选型背景</span><span class="muted">不绑定参数证据</span></div>' }) +
      '<div class="grid-8-4">' +
      UI.card({ title: '参数级 ReviewStatus', sub: '决定参数能否被商品与内容引用', pad: false,
        body: UI.tbl(['状态', '判定条件', '下游行为'], statusRows) }) +
      UI.card({ title: '证据样例', padSm: true, sub: '完整证据链字段，不以 bbox 代替适用性',
        body: UI.evidence(withDoc(sample)) + '<div class="row mt-3" style="gap:var(--sp-2)"><a class="btn btn-secondary btn-sm" href="#/param-review">审核该参数</a>' +
          '<button class="btn btn-ghost btn-sm" type="button" data-act="toast" data-msg="Demo：源文档预览未接入真实文件">查看源文档</button></div>' }) +
      '</div>' +
      '<div class="grid-7-5">' +
      UI.card({ title: '业务链路', sub: '知识只从已审核数据流出', body: '<div>' + D.flows.map(function (f) {
        return '<div class="list-row"><div class="side"><span class="st st-solid">' + f.id + '</span></div>' +
          '<div class="grow"><div class="ttl">' + esc(f.name) + '</div><div class="meta">' + f.steps.join(' → ') + '</div>' +
          '<div class="chart-note">' + esc(f.boundary) + '</div></div></div>';
      }).join('') + '</div>' }) +
      UI.card({ title: '稳定性原则', sub: '8 条设计约束', pad: false, body: UI.tbl(['原则', '说明', '类型'], principles) }) +
      '</div>' +
      '<div class="note"><strong>系统边界：</strong>Ds Bit 与商城后台是两个系统。原型中的解析状态、参数与证据均为 Demo 快照；不包含解析器实现、模型调用与真实队列。PIPELINE_PASS 不等于 CONTENT_APPROVED，CONTENT_APPROVED 也不等于 RELEASE_APPROVED。</div>' +
      '</div>';
  };

  /* ================================================================ Datasheet 文档管理 */
  V.datasheets = function (S) {
    var parsed = S.docs.filter(function (d) { return d.status === 'Parsed'; }).length;
    var parsing = S.docs.filter(function (d) { return d.status === 'Parsing'; }).length;
    var failed = S.docs.filter(function (d) { return d.status === 'Failed'; }).length;
    var stats = [
      { k: '文档总数', v: '1,284', note: 'Demo 抽样 ' + S.docs.length + ' 份', icon: 'file' },
      { k: '已解析', v: String(parsed), note: '本地抽样', icon: 'check' },
      { k: '解析中', v: String(parsing), note: 'ESP32-WROOM-32E', icon: 'clock', warn: true },
      { k: '失败待重试', v: String(failed), note: 'MAX232ECP', icon: 'alert', warn: true }
    ].map(function (x) { return UI.stat(x); }).join('');

    var rows = S.docs.map(function (d) {
      return '<tr data-search="' + esc((d.file + ' ' + d.mpn + ' ' + d.id + ' ' + d.subject).toLowerCase()) + '" data-fstatus="' + esc(d.status) + '">' +
        '<td><button class="link-btn" type="button" data-act="doc-view" data-id="' + esc(d.id) + '">' + esc(d.file) + '</button>' +
        '<span class="cell-sub">' + esc(d.id) + ' · ' + esc(d.version) + ' · ' + esc(d.size) + '</span></td>' +
        '<td><span class="cell-main">' + esc(d.mpn) + '</span><span class="cell-sub mono-sm">' + esc(d.run) + ' · SHA ' + esc(d.hash) + '…</span></td>' +
        '<td><span class="cell-main">' + esc(d.type) + '</span><span class="cell-sub">' + esc(d.subject) + '</span></td>' +
        '<td class="num">' + d.pages + '</td><td class="num">' + (d.params || '—') + '</td>' +
        '<td>' + UI.pill(d.applicability === 'Direct' ? 'Approved' : d.applicability === 'Family match' ? 'Demo' : 'Needs Review',
          d.applicability === 'Direct' ? 'Direct' : d.applicability === 'Family match' ? 'Family match' : '待判定') + '</td>' +
        '<td>' + UI.pill(d.status, { Parsed: '已解析（Demo）', Parsing: '解析中（Demo）', Failed: '失败' }[d.status] || d.status) + '</td>' +
        '<td class="num">' + (d.issues ? '<span class="st st-warn">' + UI.icon('alert') + d.issues + '</span>' : '<span class="muted">0</span>') + '</td>' +
        '<td class="nowrap"><span class="cell-sub">' + esc(d.uploaded) + '</span></td>' +
        '<td class="actions"><div class="row-actions">' +
        (d.status === 'Failed' ? '<button class="link-btn" type="button" data-act="doc-retry" data-id="' + esc(d.id) + '">重试</button>' :
          d.status === 'Parsing' ? '<button class="link-btn" type="button" data-act="toast" data-msg="Demo：解析状态为快照，未连接 Ds Bit 引擎">查看进度</button>' :
            '<button class="link-btn" type="button" data-act="doc-view" data-id="' + esc(d.id) + '">详情</button>') +
        '</div></td></tr>';
    }).join('');

    return '<div class="adm-page" data-filter-scope>' +
      UI.pageHead('Datasheet 文档管理', '上传、版本与解析状态集中管理；解析失败保留原始文件与失败原因。',
        UI.demoChip('文档为 Demo 元数据') +
        '<button class="btn btn-secondary btn-sm" type="button" data-act="export-demo" data-name="Datasheet 列表">导出</button>' +
        '<button class="btn btn-primary btn-sm" type="button" data-act="doc-upload"><span data-icon="upload"></span>上传 Datasheet</button>') +
      '<div class="stat-grid" style="grid-template-columns:repeat(4,minmax(0,1fr))">' + stats + '</div>' +
      UI.toolbar('<input class="input" type="search" style="width:300px" placeholder="搜索文件名 / MPN / 文档编号" data-filter-input aria-label="搜索文档">' +
        '<select class="select" style="width:150px" data-filter-status aria-label="解析状态"><option value="">全部状态</option><option>Parsed</option><option>Parsing</option><option>Failed</option></select>',
        '<span class="toolbar-label" data-filter-count>共 ' + S.docs.length + ' 份</span>') +
      '<section class="card">' + UI.tbl(['DocumentId / 文件', 'MPN / ParseRunId', '类型 / 主体', { h: '页数', cls: 'num' }, { h: '参数', cls: 'num' }, '适用性', '解析状态', { h: '问题', cls: 'num' }, '上传时间', ''], rows) +
      UI.foot('共 ' + S.docs.length + ' 份（Demo 抽样）', 'DocumentId + ParseRunId + SHA-256 共同定位证据') + '</section>' +
      '<div class="note">上传新版本不会覆盖旧证据；旧版本归档后可回滚。解析在 Ds Bit 侧执行，本后台只轮询状态。Family match 文档只作选型背景，不绑定参数证据。</div>' +
      '</div>';
  };

  /* ================================================================ 产品参数审核 */
  V['param-review'] = function (S) {
    var pending = S.params.filter(function (p) { return p.status === 'Needs Review'; });
    var verified = S.params.filter(function (p) { return p.status === 'Verified'; });
    var rejected = S.params.filter(function (p) { return p.status === 'Rejected'; });
    var tab = S.paramTab || 'pending';
    var filterMpn = S.paramMpn || '';
    var list = tab === 'pending' ? pending : tab === 'verified' ? verified : rejected;
    if (filterMpn) list = list.filter(function (p) { return p.mpn === filterMpn; });

    var rows = list.map(function (p) {
      return '<tr data-search="' + esc((p.mpn + ' ' + p.name + ' ' + (p.rawLabel || '')).toLowerCase()) + '">' +
        '<td><input class="chk rowpchk" type="checkbox" value="' + esc(p.mpn + '|' + p.name) + '" aria-label="选择 ' + esc(p.name) + '"></td>' +
        '<td><button class="link-btn pn" type="button" data-act="param-view" data-id="' + esc(p.mpn + '|' + p.name) + '">' + esc(p.mpn) + '</button>' +
        '<span class="cell-sub">' + esc(p.name) + '</span></td>' +
        '<td><span class="cell-sub mono-sm">' + esc(p.rawLabel) + ' = ' + esc(p.rawValue) + '</span>' +
        '<span class="cell-main">' + esc(p.value) + ' <span class="muted">' + esc(p.unit) + '</span></span></td>' +
        '<td><span class="cell-sub">' + esc(p.kind) + '</span><span class="cell-sub">' + esc(p.conditions) + '</span></td>' +
        '<td class="num"><span class="cell-sub">p.' + p.page + '</span><span class="cell-sub">' + esc(p.table) + ' / ' + esc(p.row) + '</span></td>' +
        '<td style="min-width:110px">' + UI.progress(Math.round(p.confidence * 100), p.confidence < 0.8) + '<span class="cell-sub">' + Math.round(p.confidence * 100) + '%</span></td>' +
        '<td>' + UI.pill(p.status, p.status === 'Verified' ? '已验证' : p.status === 'Rejected' ? '已拒绝' : '待审核') + '</td>' +
        '<td><span class="cell-sub">' + esc(p.applicability) + '</span></td>' +
        '<td class="actions"><div class="row-actions">' + (p.status === 'Needs Review' ?
          '<button class="link-btn" type="button" data-act="param-approve" data-id="' + esc(p.mpn + '|' + p.name) + '">通过</button>' +
          '<button class="link-btn" type="button" data-act="param-reject" data-id="' + esc(p.mpn + '|' + p.name) + '">拒绝</button>' :
          '<button class="link-btn" type="button" data-act="param-view" data-id="' + esc(p.mpn + '|' + p.name) + '">证据</button>') + '</div></td></tr>';
    }).join('') || '<tr><td colspan="9">' + UI.empty('该筛选下没有参数') + '</td></tr>';

    var mpns = ['']; S.params.forEach(function (p) { if (mpns.indexOf(p.mpn) < 0) mpns.push(p.mpn); });

    return '<div class="adm-page" data-filter-scope>' +
      UI.pageHead('产品参数审核', '本页只处理参数级 ReviewStatus；PIPELINE_PASS、CONTENT_APPROVED、RELEASE_APPROVED 是三个独立闸门。',
        UI.demoChip('审核为 Demo，不写库') +
        '<button class="btn btn-secondary btn-sm" type="button" data-act="param-batch">批量通过</button>') +
      '<div class="grid-3">' +
      UI.stat({ k: '待审核参数', v: '1,268', note: '本地抽样 ' + pending.length + ' 项', icon: 'clock', warn: true, mock: '总量为 Demo 快照' }) +
      UI.stat({ k: '已验证', v: '172,930', note: '92.7% 覆盖率', icon: 'shield-check' }) +
      UI.stat({ k: '已拒绝', v: '3,412', note: '保留失败证据', icon: 'alert' }) +
      '</div>' +
      UI.tabs([
        { id: 'pending', t: '待审核', count: pending.length },
        { id: 'verified', t: '已验证', count: verified.length },
        { id: 'rejected', t: '已拒绝', count: rejected.length }
      ], tab, 'paramtabs') +
      UI.toolbar('<select class="select" style="width:220px" data-act="param-filter"><option value="">全部商品</option>' +
        mpns.slice(1).map(function (m) { return '<option' + (filterMpn === m ? ' selected' : '') + '>' + esc(m) + '</option>'; }).join('') + '</select>' +
        '<span class="toolbar-label">共显示 ' + list.length + ' 条</span>',
        '<span class="toolbar-label">抽样 ' + (pending.length + verified.length + rejected.length) + ' / 1,268</span>') +
      '<section class="card">' +
      UI.tbl(['', '商品 / 参数', '原始值 → 标准化', 'ValueKind / Conditions', { h: '位置', cls: 'num' }, '置信度', 'ReviewStatus', '适用性', ''], rows) +
      UI.foot('当前视图 ' + list.length + ' 条', '未审核参数不会进入前台') + '</section>' +
      '<div class="note warn"><strong>三层状态：</strong>参数“通过”只表示 CONTENT_APPROVED 的前置条件；是否获准写入生产站点仍需 RELEASE_APPROVED。真实环境需记录审核人、时间、证据哈希，并同步到知识库版本。</div>' +
      '</div>';
  };

  /* ================================================================ 产品知识库 */
  V.knowledge = function (S) {
    var byMpn = {};
    S.params.forEach(function (p) {
      byMpn[p.mpn] = byMpn[p.mpn] || { ver: 0, total: 0 };
      byMpn[p.mpn].total++;
      if (p.status === 'Verified') byMpn[p.mpn].ver++;
    });
    var mpns = Object.keys(byMpn);
    var rows = mpns.map(function (m) {
      var c = byMpn[m], pct = Math.round(c.ver / c.total * 100);
      var p = S.products.filter(function (x) { return x.mpn === m; })[0] || { brand: '—' };
      return '<tr data-search="' + esc((m + ' ' + p.brand).toLowerCase()) + '"><td><span class="cell-main">' + esc(m) + '</span><span class="cell-sub">' + esc(p.brand) + '</span></td>' +
        '<td class="num">' + c.ver + ' / ' + c.total + '</td><td style="min-width:140px">' + UI.progress(pct, pct < 80) + '<span class="cell-sub">' + pct + '%</span></td>' +
        '<td>' + UI.pill(pct === 100 ? 'Verified' : 'Needs Review', pct === 100 ? '可全量引用' : '部分可引用') + '</td>' +
        '<td class="actions"><a class="link-btn" href="#/param-review">查看参数</a></td></tr>';
    }).join('');

    var verifiedRows = S.params.filter(function (p) { return p.status === 'Verified'; }).slice(0, 10).map(function (p) {
      return '<tr><td><span class="cell-main">' + esc(p.mpn) + '</span></td><td>' + esc(p.name) + '</td>' +
        '<td class="num">' + esc(p.value) + ' ' + esc(p.unit) + '</td><td class="num">p.' + p.page + '</td>' +
        '<td>' + UI.pill('Verified', '已验证') + '</td><td class="nowrap"><span class="cell-sub">' + esc(p.updated) + '</span></td></tr>';
    }).join('');

    return '<div class="adm-page" data-filter-scope>' +
      UI.pageHead('产品知识库', '仅汇总 Verified 参数；知识库是商品详情、SEO / GEO、社媒与视频的统一事实来源。',
        UI.demoChip('知识快照为 Demo') +
        '<button class="btn btn-secondary btn-sm" type="button" data-act="export-demo" data-name="知识库">导出</button>' +
        '<a class="btn btn-primary btn-sm" href="#/tech-content">生成内容</a>') +
      '<div class="stat-grid" style="grid-template-columns:repeat(4,minmax(0,1fr))">' +
      UI.stat({ k: '覆盖商品', v: String(mpns.length), note: '有参数记录的商品', icon: 'box' }) +
      UI.stat({ k: '已验证参数', v: String(S.params.filter(function (p) { return p.status === 'Verified'; }).length), note: '可被内容引用', icon: 'shield-check' }) +
      UI.stat({ k: '待审核', v: String(S.params.filter(function (p) { return p.status === 'Needs Review'; }).length), note: '不进入内容', icon: 'clock', warn: true }) +
      UI.stat({ k: '知识版本', v: String(VERSIONS.length), note: '支持回滚', icon: 'history' }) +
      '</div>' +
      '<div class="grid-8-4">' +
      UI.card({ title: '商品知识覆盖', sub: '按商品统计已验证比例', pad: false,
        body: UI.tbl(['商品', { h: '已验证 / 全部', cls: 'num' }, '覆盖率', '可引用状态', ''], rows) +
          '<div class="table-foot"><span>Demo 抽样 ' + mpns.length + ' 个商品</span><span class="muted">全部参数来自 Ds Bit</span></div>' }) +
      UI.card({ title: '引用规则', body: '<div class="stack-sm">' +
        '<div class="kpi-mini"><span class="k">商品详情</span><span class="v">Verified</span></div>' +
        '<div class="kpi-mini"><span class="k">SEO / GEO</span><span class="v">Verified</span></div>' +
        '<div class="kpi-mini"><span class="k">社媒 / 视频</span><span class="v">Verified</span></div>' +
        '<div class="kpi-mini"><span class="k">待审核参数</span><span class="v">禁止引用</span></div>' +
        '<div class="note warn mt-3">知识库不存储“营销话术”，只存储可追溯事实；文案由内容资产库管理。</div></div>' }) +
      '</div>' +
      UI.card({ title: '最近验证的参数', sub: '抽样 10 条', pad: false,
        body: UI.tbl(['商品', '参数', { h: '值', cls: 'num' }, { h: '页码', cls: 'num' }, '状态', '更新时间'], verifiedRows) }) +
      '</div>';
  };

  /* ================================================================ 知识版本管理 */
  V['knowledge-versions'] = function (S) {
    var rows = VERSIONS.map(function (v) {
      return '<tr><td><span class="cell-main mono-sm">' + esc(v.id) + '</span></td><td>' + esc(v.scope) + '</td>' +
        '<td>' + esc(v.change) + '</td><td>' + esc(v.author) + '</td><td class="nowrap"><span class="cell-sub">' + esc(v.time) + '</span></td>' +
        '<td>' + UI.pill(v.status === 'Active' ? 'Active' : v.status === 'Draft' ? 'Draft' : 'Archived', { Active: '生效中', Draft: '草稿', Archived: '已归档' }[v.status]) + '</td>' +
        '<td class="actions"><div class="row-actions"><button class="link-btn" type="button" data-act="version-view" data-id="' + esc(v.id) + '">差异</button>' +
        (v.status === 'Archived' ? '<button class="link-btn" type="button" data-act="version-rollback" data-id="' + esc(v.id) + '">回滚</button>' : '') + '</div></td></tr>';
    }).join('');

    return '<div class="adm-page">' +
      UI.pageHead('知识版本管理', '每次参数状态变化都产生版本；回滚生成新草稿，不删除历史证据。',
        UI.demoChip('版本记录为 Demo') +
        '<button class="btn btn-secondary btn-sm" type="button" data-act="version-compare">版本对比</button>') +
      '<section class="card">' + UI.tbl(['版本', '范围', '变更', '操作人', '时间', '状态', ''], rows) +
      UI.foot('Demo 抽样 ' + VERSIONS.length + ' 个版本', '旧版本保留，不物理删除') + '</section>' +
      '<div class="grid-2">' +
      UI.card({ title: '版本策略', body: '<div class="stack-sm">' +
        '<div class="kpi-mini"><span class="k">创建时机</span><span class="v">参数状态变化</span></div>' +
        '<div class="kpi-mini"><span class="k">生效方式</span><span class="v">审核后发布</span></div>' +
        '<div class="kpi-mini"><span class="k">回滚方式</span><span class="v">复制为新草稿</span></div>' +
        '<div class="kpi-mini"><span class="k">证据保留</span><span class="v">永久</span></div></div>' }) +
      UI.card({ title: '最近变更', body: '<div class="timeline">' + VERSIONS.slice(0, 3).map(function (v, i) {
        return '<div class="tl-item ' + (i === 0 ? 'active' : 'done') + '"><span class="tl-dot"></span><div><div class="tl-title">' + esc(v.id) + '</div>' +
          '<div class="tl-meta">' + esc(v.time) + ' · ' + esc(v.author) + '</div><div class="tl-body">' + esc(v.change) + '</div></div></div>';
      }).join('') + '</div>' }) +
      '</div></div>';
  };

  /* ================================================================ 技术内容生成 */
  V['tech-content'] = function (S) {
    var g = S.gen || {};
    var p = S.products.filter(function (x) { return x.mpn === (g.mpn || S.selectedProduct); })[0] || S.products[0];
    var params = D.params.filter(function (x) { return x.mpn === p.mpn && x.status === 'Verified'; });

    var progressHtml = '';
    if (g.status === 'running' || g.status === 'done') {
      var steps = ['排队', '检索已审核参数', '生成草稿', '事实校验'];
      progressHtml = '<div class="stack-sm">' + steps.map(function (s, i) {
        var state = g.status === 'done' || i < (g.step || 0) ? 'done' : i === (g.step || 0) ? 'active' : '';
        return '<div class="list-row" style="padding:var(--sp-2) 0"><div class="side">' +
          (state === 'done' ? '<span class="st st-ok">' + UI.icon('check') + '</span>' : state === 'active' ? '<span class="st st-warn">' + UI.icon('clock') + '</span>' : '<span class="st st-muted">' + UI.icon('dot') + '</span>') +
          '</div><div class="grow"><div class="ttl">' + s + '</div></div></div>';
      }).join('') + '</div>';
    }

    var resultCard = '';
    if (g.status === 'done' && g.result) {
      resultCard = UI.card({ title: '生成结果（草稿）', sub: '事实引用仅来自 Verified 参数',
        actions: UI.pill('Needs Review', 'CONTENT_APPROVED 待审核'),
        body: '<div class="stack-sm">' +
          '<h3 class="h-sm">' + esc(g.result.title) + '</h3>' +
          '<p class="body-sm muted">' + esc(g.result.excerpt) + '</p>' +
          '<div class="evidence verified"><h4>引用证据</h4>' + params.slice(0, 2).map(function (x) {
            return '<div class="meta-row"><span>' + esc(x.name) + '：' + esc(x.value) + ' ' + esc(x.unit) + '</span><span>p.' + x.page + '</span><span>' + esc(x.mpn) + '</span></div>';
          }).join('') + '</div>' +
          '<div class="label">发布闸门</div>' +
          '<div class="stack-sm">' +
          '<div class="kpi-mini"><span class="k">PIPELINE_PASS</span><span class="v">Demo 快照 · 未运行</span>' + UI.pill('Demo', '未验证') + '</div>' +
          '<div class="kpi-mini"><span class="k">CONTENT_APPROVED</span><span class="v">待人工审核</span>' + UI.pill('Needs Review', '待审核') + '</div>' +
          '<div class="kpi-mini"><span class="k">RELEASE_APPROVED</span><span class="v">未申请</span>' + UI.pill('Draft', '不可发布') + '</div></div>' +
          '<div class="row" style="gap:var(--sp-2)"><button class="btn btn-primary btn-sm" type="button" data-act="gen-save">保存到内容资产库</button>' +
          '<button class="btn btn-secondary btn-sm" type="button" data-act="gen-run">重新生成</button>' +
          '<a class="btn btn-ghost btn-sm" href="#/content">打开内容库</a></div>' +
          '</div>' });
    }

    return '<div class="adm-page">' +
      UI.pageHead('技术内容生成', '以已审核参数为事实源生成技术内容草稿；生成后必须人工审核，不能直接发布。',
        UI.demoChip('未接入真实 LLM 接口') +
        '<a class="btn btn-secondary btn-sm" href="#/content">内容资产库</a>') +
      '<div class="grid-4-8">' +
      UI.card({ title: '生成参数', padSm: true, body:
        '<div class="stack-sm">' +
        '<div class="field"><label>商品</label><select class="select" id="genMpn" data-act="gen-select">' +
        S.products.map(function (x) { return '<option value="' + esc(x.mpn) + '"' + (x.mpn === p.mpn ? ' selected' : '') + '>' + esc(x.mpn) + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label>内容类型</label><select class="select" id="genType"><option>技术文章</option><option>产品对比</option><option>选型指南</option><option>技术问答</option><option>应用方案</option></select></div>' +
        '<div class="field"><label>目标渠道</label><select class="select" id="genChannel"><option>SEO / GEO</option><option>LinkedIn</option><option>Facebook</option><option>YouTube 脚本</option></select></div>' +
        '<div class="field"><label>参数范围</label><select class="select" id="genScope"><option>仅 Verified 参数</option><option disabled>包含 Needs Review 参数（不可用）</option></select></div>' +
        '<div class="field"><label>语气</label><select class="select" id="genTone"><option>工程严谨</option><option>选型顾问</option><option>简短问答</option></select></div>' +
        '<button class="btn btn-primary" type="button" data-act="gen-run" id="genBtn"' + (g.status === 'running' ? ' disabled' : '') + '>' +
        (g.status === 'running' ? '生成中…' : '生成草稿') + '</button>' +
        '<div class="hint">当前商品有 ' + params.length + ' 项已验证参数可引用。</div>' +
        '</div>' +
        (progressHtml ? '<div class="mt-3">' + progressHtml + '</div>' : '') }) +
      '<div class="stack">' +
      (resultCard || UI.card({ title: '输出预览', padSm: true, body: '<div class="preview-frame"><div class="preview-bar"><span class="dot warn"></span><span class="preview-url">draft · 未生成</span></div>' +
        '<div class="preview-body"><div class="preview-h1">' + esc(p.mpn) + ' · 技术内容草稿</div>' +
        '<div class="preview-p muted">选择参数并点击“生成草稿”，结果会显示在这里。生成过程为 Demo 模拟，不调用真实模型。</div>' +
        '<div class="preview-spec">' + (params.length ? params.slice(0, 3).map(function (x) {
          return '<div><span class="k">' + esc(x.name) + '</span><span>' + esc(x.value) + ' ' + esc(x.unit) + ' · p.' + x.page + '</span></div>';
        }).join('') : '<div><span class="k">已审核参数</span><span>暂无</span></div>') + '</div></div></div>' })) +
      UI.card({ title: '生成边界', body: '<div class="stack-sm">' +
        '<div class="kpi-mini"><span class="k">事实源</span><span class="v">Ds Bit Verified</span></div>' +
        '<div class="kpi-mini"><span class="k">发布</span><span class="v">必须人工审核</span></div>' +
        '<div class="kpi-mini"><span class="k">执行方式</span><span class="v">异步队列</span></div>' +
        '<div class="note warn mt-3">生成任务失败不影响商品浏览与询盘；草稿不会自动发布。</div></div>' }) +
      '</div></div></div>';
  };

  /* ================================================================ 旧后台覆盖矩阵 */
  V.coverage = function (S) {
    var covered = D.legacyCoverage.filter(function (x) { return x.status === '已覆盖'; }).length;
    var partial = D.legacyCoverage.filter(function (x) { return x.status === '部分覆盖'; }).length;

    var rows = D.legacyCoverage.map(function (x) {
      return '<tr data-search="' + esc((x.ctrl + ' ' + x.action + ' ' + x.fn + ' ' + x.module).toLowerCase()) + '" data-fstatus="' + esc(x.status) + '">' +
        '<td><span class="cell-main">' + esc(x.ctrl) + '</span></td><td><span class="mono-sm">' + esc(x.action) + '</span></td>' +
        '<td>' + esc(x.fn) + '</td><td>' + esc(x.module) + '</td>' +
        '<td>' + UI.pill(x.status === '已覆盖' ? 'Approved' : 'Needs Review', x.status) + '</td>' +
        '<td class="muted">' + esc(x.note) + '</td></tr>';
    }).join('');

    return '<div class="adm-page" data-filter-scope>' +
      UI.pageHead('旧后台覆盖矩阵', '旧后台 ejadmin 共 43 个 action；逐一映射到新模块。未覆盖项不代表废弃，需业务确认。',
        UI.demoChip('覆盖结论待业务确认')) +
      '<div class="grid-3">' +
      UI.stat({ k: '旧后台 Action', v: String(D.legacyCoverage.length), note: 'Yii2 ejadmin', icon: 'list' }) +
      UI.stat({ k: '已覆盖', v: String(covered), note: '新模块有对应入口', icon: 'check' }) +
      UI.stat({ k: '部分覆盖', v: String(partial), note: '动作形态待确认', icon: 'clock', warn: true }) +
      '</div>' +
      UI.toolbar('<input class="input" type="search" style="width:300px" placeholder="搜索 controller / action / 功能" data-filter-input aria-label="搜索旧后台功能">' +
        '<select class="select" style="width:150px" data-filter-status aria-label="覆盖状态"><option value="">全部状态</option><option>已覆盖</option><option>部分覆盖</option></select>',
        '<span class="toolbar-label" data-filter-count>共 ' + D.legacyCoverage.length + ' 个 action</span>') +
      '<div class="matrix-wrap"><table class="matrix" data-table="coverage"><thead><tr><th>Controller</th><th>Action</th><th>旧功能</th><th>新模块</th><th>覆盖状态</th><th>备注</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div>' +
      '<div class="note warn"><strong>结论口径：</strong>“部分覆盖”表示新原型已有相近入口，但操作对象、权限或字段范围仍需业务确认；“未列出”不等于旧功能废弃。</div>' +
      '<div class="mt-4" data-filter-exempt>' + UI.card({ title: '旧后台 Commands（11 个文件）', sub: '命令文件独立列示，不计入上方 43 个 action', pad: false,
        body: UI.tbl(['文件', '命令 / Action', '用途', '映射模块', '状态', '备注'], D.legacyCommands.map(function (x) {
          return '<tr><td><span class="cell-main mono-sm">' + esc(x.file) + '</span></td>' +
            '<td><span class="body-sm" style="white-space:normal;word-break:break-word">' + esc(x.actions) + '</span></td>' +
            '<td style="white-space:normal;word-break:break-word">' + esc(x.purpose) + '</td><td style="white-space:normal;word-break:break-word">' + esc(x.module) + '</td>' +
            '<td>' + UI.pill(x.status === '已覆盖' ? 'Approved' : x.status === '不适用' ? 'Draft' : 'Needs Review', x.status) + '</td>' +
            '<td class="muted body-sm" style="white-space:normal;word-break:break-word">' + esc(x.note) + '</td></tr>';
        }).join('')) + UI.foot('11 个命令文件', '待确认项不视为已覆盖') + '</div>' }) +
      '</div>';
  };
})();

/* ============================================================================
   Views — 工作台 / 商城运营 / 营销运营（上）
   ========================================================================= */
(function () {
  'use strict';
  var D = window.ADMIN_DATA, UI = window.UI;
  var V = window.VIEWS = window.VIEWS || {};
  var esc = UI.esc;

  function dayLabels(n) {
    var out = [], end = new Date(2026, 10, 16);
    for (var i = n - 1; i >= 0; i--) {
      var d = new Date(end.getTime() - i * 86400000);
      out.push((d.getMonth() + 1) + '-' + String(d.getDate()).padStart(2, '0'));
    }
    return out;
  }

  function seoOf(p) {
    return p.seo === 'Optimized' ? '已优化' : p.seo === 'Needs Review' ? '待优化' : p.seo === 'Missing Meta' ? '缺 Meta' : '已下线';
  }

  /* ================================================================ 经营概览 */
  V.dashboard = function (S) {
    var O = D.overview;
    var metric = S.dashMetric || 'traffic';
    var isTraffic = metric === 'traffic';
    var series = isTraffic ? O.traffic : O.inquiries;
    var labels = dayLabels(30);
    var openTasks = S.tasks.filter(function (t) { return !t.done; });

    var stats = O.kpis.map(function (k) {
      return UI.stat({
        k: k.k, v: k.v, note: k.note, delta: k.delta, icon: k.icon,
        warn: k.warn, warnDelta: k.warn, mock: 'KPI 为 Demo 数据'
      });
    }).join('');

    var chartCard = UI.card({
      title: isTraffic ? '全站访客趋势（30 天）' : '询盘提交趋势（30 天）',
      sub: isTraffic ? 'UV 口径 · 每日汇总' : '提交量口径 · 未剔除 Spam / 重复',
      actions: '<div class="seg" data-act="dash-metric">' +
        '<button type="button" class="' + (isTraffic ? 'on' : '') + '" data-metric="traffic">访客</button>' +
        '<button type="button" class="' + (!isTraffic ? 'on' : '') + '" data-metric="inquiry">询盘</button></div>' +
        UI.demoChip('30 天趋势为 Demo 序列'),
      body: UI.chart({
        h: 210,
        series: [{ v: series, cls: isTraffic ? 'viz-line-1' : 'viz-line-accent', area: true, areaCls: isTraffic ? 'viz-area-1' : 'viz-area-accent', name: isTraffic ? '访客' : '询盘' }],
        labels: labels, max: isTraffic ? 100 : 40, label: isTraffic ? '访客趋势' : '询盘趋势'
      }) + '<div class="viz-legend mt-3"><span><i class="viz-key"></i>' + (isTraffic ? '每日访客（UV）' : '每日询盘') + '</span><span class="dim">最近 30 天 · 峰值 ' + Math.max.apply(null, series) + '</span></div>',
      padSm: true
    });

    var taskCard = UI.card({
      title: '待办与异常',
      sub: '共 ' + S.taskTotal + ' 项，P1 ' + openTasks.filter(function (t) { return t.priority === 'P1'; }).length + ' 项',
      actions: '<a class="link-btn" href="#/tasks">全部任务</a>',
      body: '<div>' + openTasks.slice(0, 5).map(function (t) {
        return '<div class="list-row"><div class="grow"><div class="ttl">' + esc(t.title) + '</div>' +
          '<div class="meta"><span>' + esc(t.module) + '</span><span>' + esc(t.owner) + '</span><span>' + esc(t.due) + '</span></div></div>' +
          '<div class="side">' + UI.pill(t.priority === 'P1' ? 'Needs Review' : 'New', t.priority) + '</div></div>';
      }).join('') + '</div><div class="note mt-3">P1 任务直接影响发布与询盘响应；Ds Bit 异常不阻塞商品浏览。</div>'
    });

    var funnelCard = UI.card({
      title: '从曝光到有效询盘',
      sub: '本月累计 · 归因口径待 GA4 接入后校准',
      actions: UI.demoChip('漏斗为 Demo 估算'),
      body: UI.funnel(O.funnel) + '<div class="chart-note">曝光 → 点击 → 详情页 → 询盘 → 有效询盘。有效询盘剔除 Spam 与重复提交。</div>'
    });

    var shareCard = UI.card({
      title: '流量来源',
      sub: '自然搜索为主，社媒与视频为增量',
      body: UI.donut(O.channelShare, '67.4%', '自然搜索占比') +
        '<div class="viz-legend mt-3" style="justify-content:center">' + O.channelShare.map(function (s, i) {
          return '<span><i class="viz-key ' + (i === 1 ? 'k2' : i === 2 ? 'k3' : i === 3 ? '' : '') + '"></i>' + esc(s.k) + ' ' + s.v + '%</span>';
        }).join('') + '</div>'
    });

    var channelRows = O.channels.map(function (c) {
      return '<tr data-search="' + esc(c.k) + '">' +
        '<td><span class="cell-main">' + esc(c.k) + '</span></td>' +
        '<td class="num">' + c.impressions + '</td><td class="num">' + c.clicks + '</td><td class="num">' + c.ctr + '</td>' +
        '<td class="num">' + UI.num(c.leads) + '</td><td class="num">' + c.valid + '%</td>' +
        '<td>' + UI.spark(c.trend) + '</td>' +
        '<td class="actions"><a class="link-btn" href="#/analytics">分析</a></td></tr>';
    }).join('');

    var channelCard = UI.card({
      title: '渠道表现',
      sub: '曝光 / 点击 / 询盘 / 有效率',
      actions: '<a class="btn btn-secondary btn-sm" href="#/analytics">渠道分析</a>',
      pad: false,
      body: UI.tbl([
        '渠道', { h: '曝光', cls: 'num' }, { h: '点击', cls: 'num' }, { h: 'CTR', cls: 'num' },
        { h: '询盘', cls: 'num' }, { h: '有效询盘', cls: 'num' }, '趋势', ''
      ], channelRows)
    });

    var flowRows = D.flows.map(function (f) {
      var route = { A: '#/product-detail', B: '#/seo', C: '#/social', D: '#/inquiries' }[f.id];
      return '<div class="list-row"><div class="side"><span class="st st-solid">' + f.id + '</span></div>' +
        '<div class="grow"><div class="ttl">' + esc(f.name) + '</div>' +
        '<div class="meta"><span>' + f.steps.join(' → ') + '</span></div>' +
        '<div class="chart-note">' + esc(f.boundary) + '</div></div>' +
        '<div class="side"><a class="link-btn" href="' + route + '">查看</a></div></div>';
    }).join('');

    return '<div class="adm-page">' +
      UI.pageHead('经营概览', '商城运营与营销运营的统一入口：商品、内容、社媒、询盘与产品知识在同一个工作台收敛。', 
        UI.demoChip('整页为 Demo 环境') +
        '<button class="btn btn-secondary btn-sm" type="button" data-act="refresh-demo"><span data-icon="refresh"></span>刷新</button>' +
        '<button class="btn btn-secondary btn-sm" type="button" data-act="export-demo" data-name="经营概览">导出概览</button>') +
      '<div class="stat-grid">' + stats + '</div>' +
      '<div class="grid-8-4">' + chartCard + taskCard + '</div>' +
      '<div class="grid-8-4">' + funnelCard + shareCard + '</div>' +
      channelCard +
      UI.card({ title: '四大业务链路', sub: '产品知识 → 商城 / 营销 → 数据回流', body: flowRows }) +
      '</div>';
  };

  /* ================================================================ 商品管理 */
  V.products = function (S) {
    var tab = S.productTab || 'all';
    var rows = S.products.map(function (p) {
      var fstatus = p.content + (p.seo === 'Optimized' ? ' Optimized' : ' Needs Review');
      return '<tr data-search="' + esc((p.mpn + ' ' + p.brand + ' ' + p.name + ' ' + p.category).toLowerCase()) + '"' +
        ' data-stock="' + esc(p.stock) + '" data-fstatus="' + esc(fstatus) + '">' +
        '<td><input class="chk rowchk" type="checkbox" aria-label="选择 ' + esc(p.mpn) + '"></td>' +
        '<td><button class="link-btn pn" type="button" data-act="product-view" data-id="' + esc(p.mpn) + '">' + esc(p.mpn) + '</button>' +
        '<span class="cell-sub">' + esc(p.name) + '</span></td>' +
        '<td>' + esc(p.brand) + '</td><td>' + esc(p.category) + '</td>' +
        '<td>' + UI.stock(p.stock, p.qty) + '</td>' +
        '<td><span class="mono-sm">' + esc(p.datasheet) + '</span></td>' +
        '<td>' + UI.pill(p.seo === 'Optimized' ? 'Approved' : p.seo === 'Deprecated' ? 'Rejected' : 'Needs Review', seoOf(p)) + '</td>' +
        '<td>' + UI.pill(p.content, p.content === 'Published' ? '已发布' : '草稿') + '</td>' +
        '<td class="nowrap"><span class="cell-sub">' + esc(p.updated) + '</span></td>' +
        '<td class="actions"><div class="row-actions">' +
        '<button class="link-btn" type="button" data-act="product-edit" data-id="' + esc(p.mpn) + '">编辑</button>' +
        '<button class="link-btn" type="button" data-act="product-view" data-id="' + esc(p.mpn) + '">查看</button>' +
        '</div></td></tr>';
    }).join('');

    var body = UI.tbl([
      '<input class="chk" type="checkbox" id="allProducts" aria-label="全选">',
      '商品', '品牌', '分类', '库存', 'Datasheet', 'SEO', '详情页', '更新时间', ''
    ], rows + '<tr data-empty-row hidden><td colspan="10">' + UI.empty('没有匹配的商品，请调整搜索或筛选条件') + '</td></tr>', 'responsive', 'data-table="products"');

    var tabsHtml = UI.tabs([
      { id: 'all', t: '全部', count: S.products.length },
      { id: 'pub', t: '已发布', count: S.products.filter(function (p) { return p.content === 'Published'; }).length, statusFilter: 'Published' },
      { id: 'draft', t: '草稿', count: S.products.filter(function (p) { return p.content === 'Draft'; }).length, statusFilter: 'Draft' },
      { id: 'review', t: '待优化', count: S.products.filter(function (p) { return p.seo !== 'Optimized'; }).length, statusFilter: 'Needs Review' }
    ], tab, 'prodtab');
    var page = '<div class="adm-page" data-filter-scope>' +
      UI.pageHead('商品管理', '统一维护 MPN、品牌、分类、库存与详情页状态；价格统一为 Request Quote，不展示虚构价格。',
        UI.demoChip('商品与库存为 Demo 抽样') +
        '<button class="btn btn-secondary btn-sm" type="button" data-act="export-demo" data-name="商品列表">导出</button>' +
        '<button class="btn btn-primary btn-sm" type="button" data-act="product-new"><span data-icon="plus"></span>新增商品</button>') +
      tabsHtml +
      UI.toolbar(
        '<div class="row" style="gap:var(--sp-3);flex-wrap:wrap">' +
        '<input class="input" type="search" style="width:260px" placeholder="搜索 MPN / 品牌 / 名称" data-filter-input aria-label="搜索商品">' +
        '<select class="select" style="width:150px" data-filter-stock aria-label="库存筛选">' +
        '<option value="">全部库存</option><option>In Stock</option><option>Low Stock</option><option>Out of Stock</option><option>End of Life</option></select>' +
        '</div>',
        '<span class="toolbar-label" data-filter-count>共 ' + S.products.length + ' 条</span>' +
        '<button class="btn btn-secondary btn-sm" type="button" data-act="products-refresh"><span data-icon="refresh"></span>刷新</button>') +
      '<section class="card">' + body + UI.foot('共 ' + S.products.length + ' 条（Demo 抽样）', '详情页状态与 SEO 状态来自不同字段') + '</section>' +
      '<div class="note">价格策略：所有商品显示 <strong>Request Quote</strong>，不展示虚构价格。库存状态同时使用颜色、图标与文字三种通道，避免仅靠颜色判断。</div>' +
      '</div>';

    return page;
  };

  /* ================================================================ 商品详情页管理 */
  V['product-detail'] = function (S) {
    var p = S.products.filter(function (x) { return x.mpn === S.selectedProduct; })[0] || S.products[0];
    var params = D.params.filter(function (x) { return x.mpn === p.mpn; });
    var verified = params.filter(function (x) { return x.status === 'Verified'; });
    var pending = params.filter(function (x) { return x.status !== 'Verified'; });
    var tab = S.pdTab || 'base';
    var seoTitle = p.mpn + ' ' + p.name + ' | Morris Electronic HK';
    var seoDesc = 'Request a quote for ' + p.mpn + ' (' + p.brand + '). ' + p.name + '. Datasheet-backed specifications and global shipping.';

    var selector = '<select class="select" style="width:280px" data-act="pd-select" aria-label="选择商品">' +
      S.products.map(function (x) {
        return '<option value="' + esc(x.mpn) + '"' + (x.mpn === p.mpn ? ' selected' : '') + '>' + esc(x.mpn) + '</option>';
      }).join('') + '</select>';

    var base = '<div class="form-grid">' +
      '<div class="field"><label>MPN</label><input class="input" value="' + esc(p.mpn) + '" readonly></div>' +
      '<div class="field"><label>品牌</label><input class="input" value="' + esc(p.brand) + '" readonly></div>' +
      '<div class="field full"><label>商品标题（详情页 H1）</label><input class="input" value="' + esc(p.mpn + ' ' + p.name) + '" data-demo-edit></div>' +
      '<div class="field"><label>分类</label><input class="input" value="' + esc(p.category) + '"></div>' +
      '<div class="field"><label>库存状态</label><input class="input" value="' + esc(p.stock + ' / ' + UI.num(p.qty) + ' pcs · ' + p.warehouse) + '" readonly></div>' +
      '<div class="field"><label>交期</label><input class="input" value="' + esc(p.lead) + '"></div>' +
      '<div class="field"><label>价格</label><input class="input" value="Request Quote" readonly><span class="hint">价格字段只读，商城不展示虚构价格。</span></div>' +
      '<div class="field full"><label>卖点摘要（仅使用已审核参数）</label><textarea class="textarea">' +
      esc(p.name + '。' + (verified.length ? '已通过 Ds Bit 校验的关键参数可直接引用；' : '该商品暂无可引用的已审核参数；') + '支持按数量询价与全球发货。') +
      '</textarea><span class="hint">参数引用仅限 Verified；Needs Review 不得写入卖点。</span></div>' +
      '</div>';

    var paramsTable = params.length ? UI.tbl(['参数', '值', '单位', { h: '页码', cls: 'num' }, '状态', '适用性', '更新时间'], params.map(function (x) {
      return '<tr><td><span class="cell-main">' + esc(x.name) + '</span></td><td class="num">' + esc(x.value) + '</td><td>' + esc(x.unit) + '</td>' +
        '<td class="num">p.' + x.page + '</td><td>' + UI.pill(x.status, x.status === 'Verified' ? '已验证' : '待审核') + '</td>' +
        '<td><span class="body-sm">' + esc(x.applicability || '未判定') + '</span></td>' +
        '<td class="nowrap"><span class="cell-sub">' + esc(x.updated) + '</span></td></tr>';
    }).join('')) + '<div class="note warn mt-3">待审核参数 ' + pending.length + ' 项不会出现在前台详情页；需在「产品参数审核」完成后才能引用。</div>' :
      UI.empty('该商品暂未解析 Datasheet 参数');

    var seoPanel = '<div class="grid-2">' +
      '<div class="stack-sm">' +
      '<div class="field"><label>SEO Title</label><input class="input" value="' + esc(seoTitle) + '"></div>' +
      '<div class="field"><label>Meta Description</label><textarea class="textarea">' + esc(seoDesc) + '</textarea></div>' +
      '<div class="field"><label>Canonical / 语言</label><input class="input" value="' + esc('/products/' + p.mpn.toLowerCase() + ' · en') + '" readonly></div>' +
      '<div class="note">新站语言仅 en / de / ja / es / fr，默认 en；不生成中文或印尼语页面。</div>' +
      '</div>' +
      '<div class="stack-sm"><div class="label">搜索结果预览</div><div class="serp">' +
      '<div class="serp-url">morrishk.net › products › ' + esc(p.mpn.toLowerCase()) + '</div>' +
      '<div class="serp-title">' + esc(seoTitle) + '</div>' +
      '<div class="serp-desc">' + esc(seoDesc) + '</div></div>' +
      '<div class="serp"><div class="serp-url">站内搜索预览</div><div class="serp-title">' + esc(p.mpn) + ' — ' + esc(p.brand) + '</div>' +
      '<div class="serp-desc">' + esc(p.name) + ' · ' + esc(p.stock) + ' · Request Quote</div></div></div>' +
      '</div>';

    var versions = '<div class="timeline">' +
      '<div class="tl-item done"><span class="tl-dot"></span><div><div class="tl-title">v3 · 当前草稿</div><div class="tl-meta">2026-11-16 09:42 · 王敏</div>' +
      '<div class="tl-body">更新交期与库存数量；SEO 标题调整。未提交发布。</div></div></div>' +
      '<div class="tl-item done"><span class="tl-dot"></span><div><div class="tl-title">v2 · 已发布</div><div class="tl-meta">2026-11-15 17:26 · 王敏</div>' +
      '<div class="tl-body">详情页上线，引用 ' + verified.length + ' 项已验证参数。</div></div></div>' +
      '<div class="tl-item"><span class="tl-dot"></span><div><div class="tl-title">v1 · 初始导入</div><div class="tl-meta">2026-11-12 10:03 · system</div>' +
      '<div class="tl-body">从旧后台迁移基础字段。</div></div></div></div>';

    var panel = base;
    if (tab === 'params') panel = paramsTable;
    if (tab === 'seo') panel = seoPanel;
    if (tab === 'versions') panel = versions;

    var preview = '<div class="preview-frame"><div class="preview-bar"><span class="dot ok"></span><span class="preview-url">morrishk.net/products/' + esc(p.mpn.toLowerCase()) + '</span>' + UI.demoChip('前台预览') + '</div>' +
      '<div class="preview-body"><div class="preview-h1">' + esc(p.mpn) + ' · ' + esc(p.brand) + '</div>' +
      '<div class="preview-meta">' + esc(p.name) + '</div>' +
      '<div class="preview-p">' + esc(p.stock) + ' · MOQ 1 · Lead time ' + esc(p.lead) + '</div>' +
      '<div class="hero-num mt-3">Request Quote <small>按数量与交期报价</small></div>' +
      '<div class="preview-spec">' + (verified.length ? verified.slice(0, 4).map(function (x) {
        return '<div><span class="k">' + esc(x.name) + '</span><span>' + esc(x.value) + ' ' + esc(x.unit) + '</span></div>';
      }).join('') : '<div><span class="k">参数</span><span class="muted">暂无已审核参数</span></div>') + '</div>' +
      '<button class="btn btn-primary mt-3" type="button" data-act="demo-rfq">Request a Quote</button>' +
      '<div class="chart-note">前台只展示 Verified 参数；未审核参数不出现。</div></div></div>';

    var snap = p.verifySnapshot || null;
    var pipeOk = !!snap && snap.pipeline === 'PASS';
    var contentOk = pipeOk && snap.contentApproved === true;
    var releaseOk = contentOk && snap.releaseApproved === true;

    var checklist = '<div class="stack-sm">' +
      '<div class="kpi-mini"><span class="k">基础字段</span><span class="v">完整</span>' + UI.pill('Approved', '通过') + '</div>' +
      '<div class="kpi-mini"><span class="k">已验证参数</span><span class="v">' + verified.length + ' 项</span>' + UI.pill(verified.length ? 'Verified' : 'Needs Review', verified.length ? '内容候选' : '待补') + '</div>' +
      '<div class="kpi-mini"><span class="k">SEO</span><span class="v">' + seoOf(p) + '</span>' + UI.pill(p.seo === 'Optimized' ? 'Approved' : 'Needs Review', p.seo === 'Optimized' ? '通过' : '待优化') + '</div>' +
      '<div class="kpi-mini"><span class="k">Datasheet</span><span class="v">' + esc(p.datasheet) + '</span>' + UI.pill('Parsed', '已关联') + '</div>' +
      '</div>' +
      '<div class="label">发布闸门（三层独立，依赖上游通过）</div>' +
      '<div class="stack-sm">' +
      '<div class="kpi-mini gate"><span class="k">PIPELINE_PASS</span><span class="v">' + (pipeOk ? '历史快照 ' + esc(snap.id) + ' · 已通过' : '未运行 · 无验证快照') + '</span>' +
      UI.pill(pipeOk ? 'Approved' : 'Demo', pipeOk ? '已通过' : '未验证') + '</div>' +
      '<div class="kpi-mini gate"><span class="k">CONTENT_APPROVED</span><span class="v">' + (contentOk ? '内容版本 ' + esc(snap.contentVersion) + ' 已通过' : (pipeOk ? '待人工审核' : '上游未通过 · 不可审核')) + '</span>' +
      UI.pill(contentOk ? 'Approved' : 'Draft', contentOk ? '已通过' : '不可批准') + '</div>' +
      '<div class="kpi-mini gate"><span class="k">RELEASE_APPROVED</span><span class="v">' + (releaseOk ? '批次 ' + esc(snap.batch) + ' 已授权' : (contentOk ? '未申请' : '上游未通过 · 不可申请')) + '</span>' +
      UI.pill(releaseOk ? 'Approved' : 'Draft', releaseOk ? '已授权' : '不可发布') + '</div>' +
      '</div>' +
      '<div class="note ' + (releaseOk ? '' : 'warn') + '">' + (releaseOk ? '历史验证快照：该版本在发布时通过三层闸门；当前 Demo 会话不重新运行解析。' : '依赖顺序：PIPELINE_PASS → CONTENT_APPROVED → RELEASE_APPROVED；上游未通过时，下游不得标记为已批准。') + '</div>' +
      '<div class="note">三层状态分开记录，但依赖必须成立；不得合并为 Verified。</div>';

    var tabsHtml = UI.tabs([
      { id: 'base', t: '基础信息' },
      { id: 'params', t: '参数表', count: params.length },
      { id: 'seo', t: 'SEO / 语言' },
      { id: 'versions', t: '版本记录' }
    ], tab, 'pdtabs');

    return '<div class="adm-page">' +
      UI.pageHead('商品详情页管理', '一个商品一页：基础字段、已审核参数、SEO 与版本记录在同一处维护。',
        selector + UI.demoChip('表单为 Demo，保存不写库') +
        '<button class="btn btn-secondary btn-sm" type="button" data-act="pd-save">保存草稿</button>' +
        '<button class="btn btn-primary btn-sm" type="button" data-act="pd-publish">提交内容审核</button>') +
      '<div class="grid-side">' +
      '<section class="card"><div class="card-hd"><div><h2>' + esc(p.mpn) + ' <span class="muted body-sm">' + esc(p.brand) + '</span></h2>' +
      '<div class="sub">最后更新 ' + esc(p.updated) + ' · 详情页状态 ' + esc(p.content) + '</div></div>' +
      '<div class="row" style="gap:var(--sp-2)">' + UI.pill(p.content, p.content === 'Published' ? '已发布' : '草稿') + UI.pill(p.seo === 'Optimized' ? 'Approved' : 'Needs Review', seoOf(p)) + '</div></div>' +
      '<div class="card-bd">' + tabsHtml + '<div class="mt-3">' + panel + '</div></div></section>' +
      '<div class="stack">' + preview + UI.card({ title: '发布检查', padSm: true, body: checklist }) +
      UI.card({ title: '参数证据', padSm: true, body: '<p class="body-sm muted">详情页参数只能来自 Ds Bit 已验证记录，点击查看完整证据页。</p>' +
        '<a class="btn btn-secondary btn-sm mt-3" href="#/param-review">前往参数审核</a>' }) +
      '</div></div></div>';
  };

  /* ================================================================ 营销总览 */
  V.marketing = function (S) {
    var published = S.contents.filter(function (c) { return c.publish === 'Published'; }).length;
    var pending = S.contents.filter(function (c) { return c.review !== 'Approved'; }).length;
    var upcoming = S.calendar.filter(function (e) { return e.status !== 'Published'; }).sort(function (a, b) {
      return (a.date + a.time).localeCompare(b.date + b.time);
    });
    var activeCampaigns = S.campaigns.filter(function (c) { return c.status === 'Active'; });

    var cards = [
      { k: '本月内容总数', v: String(S.contents.length), note: '文章 / 对比 / 问答 / 公告', icon: 'file-text', delta: '+4' },
      { k: '已发布内容', v: String(published), note: '占内容库 ' + Math.round(published / S.contents.length * 100) + '%', icon: 'check' },
      { k: '待审核内容', v: String(pending), note: '含 AI 生成草稿', icon: 'clock', warn: true },
      { k: '社媒累计引流', v: '6,120', note: 'LinkedIn / Facebook', icon: 'share', delta: '+4.2%', mock: 'Demo 渠道数据' },
      { k: '本月有效询盘', v: '714', note: '已剔除 Spam / 重复', icon: 'inbox', delta: '+9.4%', mock: 'Demo 归因数据' }
    ].map(function (x) { return UI.stat(x); }).join('');

    var channelRows = D.overview.channels.map(function (c) {
      return '<tr><td>' + esc(c.k) + '</td><td class="num">' + c.impressions + '</td><td class="num">' + c.clicks + '</td>' +
        '<td class="num">' + UI.num(c.leads) + '</td><td class="num">' + c.valid + '%</td><td>' + UI.spark(c.trend) + '</td></tr>';
    }).join('');

    var campaignRows = S.campaigns.slice(0, 5).map(function (c) {
      return '<tr><td><button class="link-btn" type="button" data-act="campaign-view" data-id="' + esc(c.id) + '">' + esc(c.name) + '</button>' +
        '<span class="cell-sub">' + esc(c.channels) + '</span></td>' +
        '<td class="nowrap">' + esc(c.period) + '</td><td>' + UI.pill(c.status, { Active: '进行中', Planned: '计划中', Completed: '已完成', Draft: '草稿', Paused: '已暂停' }[c.status] || c.status) + '</td>' +
        '<td class="num">' + c.leads + '</td><td class="num">' + c.valid + '</td></tr>';
    }).join('');

    var pipeline = [
      { k: '草稿', v: S.contents.filter(function (c) { return c.publish === 'Draft'; }).length },
      { k: '待审核', v: S.contents.filter(function (c) { return c.review === 'Pending Review'; }).length },
      { k: '待修改', v: S.contents.filter(function (c) { return c.review === 'Needs Revision'; }).length },
      { k: '已通过', v: S.contents.filter(function (c) { return c.review === 'Approved' && c.publish !== 'Published'; }).length },
      { k: '已发布', v: published }
    ];
    var maxPipe = Math.max.apply(null, pipeline.map(function (x) { return x.v; })) || 1;

    var nextList = upcoming.slice(0, 5).map(function (e) {
      return '<div class="list-row"><div class="grow"><div class="ttl">' + esc(e.title) + '</div>' +
        '<div class="meta"><span>' + esc(e.platform) + '</span><span>' + esc(e.date) + ' ' + esc(e.time) + '</span><span>' + esc(e.owner) + '</span></div></div>' +
        '<div class="side">' + UI.pill(e.status, { 'Pending Review': '待审核', Approved: '已通过', Scheduled: '已排期', Draft: '草稿', Published: '已发布', Failed: '失败' }[e.status] || e.status) + '</div></div>';
    }).join('');

    return '<div class="adm-page">' +
      UI.pageHead('营销总览', '内容、SEO / GEO、社媒、视频与活动在同一增长视角下管理；营销失败不影响交易链路。',
        UI.demoChip('营销数据为 Demo 估算') +
        '<button class="btn btn-secondary btn-sm" type="button" data-act="export-demo" data-name="营销总览">导出</button>' +
        '<a class="btn btn-primary btn-sm" href="#/tech-content"><span data-icon="sparkles"></span>生成内容</a>') +
      '<div class="stat-grid" style="grid-template-columns:repeat(5,minmax(0,1fr))">' + cards + '</div>' +
      UI.card({
        title: '渠道引流趋势（最近 30 天）', sub: '自然搜索 / 社媒 / 视频合并口径',
        actions: UI.demoChip('未接入 GA4'),
        body: UI.chart({ h: 200, series: [{ v: D.overview.traffic, cls: 'viz-line-1', area: true, name: '访客' }], labels: dayLabels(30), max: 100 }) +
          '<div class="viz-legend mt-3"><span><i class="viz-key"></i>全站访客</span><span class="dim">归因明细待 GA4 与 UTM 校验</span></div>',
        padSm: true
      }) +
      '<div class="grid-8-4">' +
      UI.card({ title: '进行中活动', sub: activeCampaigns.length + ' 个活动运行中', pad: false,
        actions: '<a class="link-btn" href="#/campaigns">全部活动</a>',
        body: UI.tbl(['活动', '周期', '状态', { h: '询盘', cls: 'num' }, { h: '有效', cls: 'num' }], campaignRows) +
          '<div class="table-foot"><span>Demo 活动数据</span><a class="link-btn" href="#/campaigns">管理活动</a></div>' }) +
      UI.card({ title: '内容流水', sub: '从草稿到发布', body: '<div class="stack-sm">' + pipeline.map(function (p) {
        return '<div class="meter-row"><span class="k">' + p.k + '</span>' + UI.progress(Math.round(p.v / maxPipe * 100)) + '<span class="v">' + p.v + '</span></div>';
      }).join('') + '</div><a class="btn btn-secondary btn-sm mt-3" href="#/content">内容资产库</a>' }) +
      '</div>' +
      '<div class="grid-8-4">' +
      UI.card({ title: '渠道表现', sub: '曝光 / 点击 / 询盘 / 有效率', pad: false,
        body: UI.tbl(['渠道', { h: '曝光', cls: 'num' }, { h: '点击', cls: 'num' }, { h: '询盘', cls: 'num' }, { h: '有效%', cls: 'num' }, '趋势'], channelRows) }) +
      UI.card({ title: '未来排期', sub: '按时间升序', actions: '<a class="link-btn" href="#/calendar">日历</a>',
        body: '<div>' + nextList + '</div>' }) +
      '</div>' +
      '<div class="note warn"><strong>归因边界：</strong>GA4 与 Search Console 尚未连接，本页渠道与询盘数据为 Demo 估算；社媒发布失败不影响商品详情与询盘提交。</div>' +
      '</div>';
  };

  /* ================================================================ SEO 管理 */
  V.seo = function (S) {
    var tab = S.seoTab || 'keywords';
    var stats = [
      { k: '已优化商品', v: '68%', note: '2,406 / 3,540', icon: 'check' },
      { k: '待优化页面', v: '412', note: '含缺 Meta 96', icon: 'clock', warn: true },
      { k: '零结果搜索词', v: '4', note: '本周新增 1', icon: 'search' },
      { k: '平均排名', v: '4.3', note: 'Demo 抽样', icon: 'trend', mock: 'Demo 排名数据' }
    ].map(function (x) { return UI.stat(x); }).join('');

    var kwRows = D.searchTerms.map(function (t) {
      return '<tr data-search="' + esc(t.term.toLowerCase()) + '"><td><span class="cell-main">' + esc(t.term) + '</span></td><td>' + esc(t.type) + '</td>' +
        '<td class="num">' + UI.num(t.impressions) + '</td><td class="num">' + t.ctr + '</td><td class="num">' + t.position + '</td>' +
        '<td>' + UI.pill(t.result === 'Good' ? 'Approved' : 'Needs Review', { Good: '表现良好', Opportunity: '有机会', 'Needs Content': '缺内容' }[t.result] || t.result) + '</td>' +
        '<td class="actions"><button class="link-btn" type="button" data-act="seo-term" data-term="' + esc(t.term) + '">优化</button></td></tr>';
    }).join('');

    var zeroRows = D.zeroTerms.map(function (t, i) {
      return '<tr><td><span class="cell-main">' + esc(t.term) + '</span></td><td class="num">' + t.hits + '</td><td>' + esc(t.intent) + '</td>' +
        '<td class="muted">' + esc(t.action) + '</td>' +
        '<td class="actions"><button class="link-btn" type="button" data-act="zero-content" data-term="' + esc(t.term) + '">创建内容</button></td></tr>';
    }).join('');

    var synRows = D.synonyms.map(function (t) {
      return '<tr><td><span class="cell-main">' + esc(t.term) + '</span></td><td>' + esc(t.mapped) + '</td><td>' + esc(t.type) + '</td>' +
        '<td class="actions"><button class="link-btn" type="button" data-act="toast" data-msg="Demo：同义词编辑未连接后端">编辑</button></td></tr>';
    }).join('');

    var p = S.products.filter(function (x) { return x.mpn === S.seoMpn; })[0] || S.products[0];
    var seoTitle = S.seoTitle || (p.mpn + ' ' + p.name + ' | Morris Electronic HK');
    var seoDesc = S.seoDesc || ('Request a quote for ' + p.mpn + ' from ' + p.brand + '. ' + p.name + '. Datasheet-backed data, global shipping.');
    var suggestions = S.seoSuggestions || [];

    var gov = D.seoGovernance;
    var govUrlRows = gov.urlRows.map(function (r) {
      return '<tr><td><span class="mono-sm">' + esc(r.url) + '</span></td><td><span class="mono-sm">' + esc(r.canonical) + '</span></td>' +
        '<td>' + UI.pill(r.index === 'Index' ? 'Approved' : 'Draft', r.index) + '</td><td class="num">' + esc(r.hreflang) + '</td>' +
        '<td>' + (r.status === '正常' ? UI.pill('Approved', '正常') : UI.pill('Needs Review', r.status)) + '</td></tr>';
    }).join('');
    var govHreflangRows = gov.hreflang.map(function (r) {
      return '<tr><td><span class="mono-sm">' + esc(r.lang) + '</span></td><td class="num">' + esc(r.urls) + '</td><td class="num">' + UI.num(r.missing) + '</td>' +
        '<td>' + (r.status === '正常' ? UI.pill('Approved', '正常') : UI.pill('Needs Review', r.status)) + '</td></tr>';
    }).join('');
    var govSitemapRows = gov.sitemaps.map(function (r) {
      return '<tr><td><span class="mono-sm">' + esc(r.shard) + '</span></td><td class="num">' + esc(r.urls) + '</td><td class="nowrap">' + esc(r.updated) + '</td>' +
        '<td>' + (r.status === '正常' ? UI.pill('Approved', '正常') : UI.pill('Needs Review', r.status)) + '</td></tr>';
    }).join('');
    var govQualityRows = gov.quality.map(function (r) {
      return '<tr><td><span class="cell-main">' + esc(r.issue) + '</span><span class="cell-sub">' + esc(r.detail) + '</span></td>' +
        '<td class="num">' + esc(r.count) + '</td><td><span class="body-sm">' + esc(r.action) + '</span></td></tr>';
    }).join('');

    var governance = UI.card({ title: 'URL / Canonical / Index', sub: '抽样 URL 的抓取与索引口径', pad: false,
        body: UI.tbl(['URL', 'Canonical', 'Index', { h: 'hreflang', cls: 'num' }, '状态'], govUrlRows) +
          UI.foot('5 条抽样', 'Noindex 用于搜索页与低质量页面') }) +
      '<div class="grid-2">' +
      UI.card({ title: '多语言 hreflang', sub: 'en / de / ja / es / fr（默认 en）', pad: false,
        body: UI.tbl(['语言', { h: 'URL 数', cls: 'num' }, { h: '缺 hreflang', cls: 'num' }, '状态'], govHreflangRows) +
          UI.foot('缺口为 Demo 统计', '不新增中文 / 印尼语') }) +
      UI.card({ title: 'Sitemap 分片状态', sub: '按分片生成与提交，失败分片可单独重试', pad: false,
        body: UI.tbl(['分片', { h: 'URL 数', cls: 'num' }, '最后生成', '状态'], govSitemapRows) +
          UI.foot('6 个分片', 'Search Console 未连接，提交状态为 Demo') }) +
      '</div>' +
      UI.card({ title: '内容质量与抓取异常', sub: '重复内容 / 结构化数据 / 低质量页 / 404 / 重定向链', pad: false,
        body: UI.tbl(['问题', { h: '数量', cls: 'num' }, '建议动作'], govQualityRows) +
          UI.foot('Demo 抽样统计', '低质量页面优先转 Noindex 或补内容') }) +
      UI.card({ title: '发布与回滚', sub: '目标架构：分批灰度，不提供一键全量发布', body:
        UI.kv([
          { k: '单批上限', v: esc(gov.release.batch) },
          { k: '灰度策略', v: esc(gov.release.canary) },
          { k: '回滚', v: esc(gov.release.rollback) },
          { k: '审批', v: esc(gov.release.approval) }
        ]) +
        '<div class="note warn mt-3"><strong>' + esc(gov.release.note) + '</strong></div>' +
        '<div class="row mt-3" style="gap:var(--sp-2)"><button class="btn btn-secondary btn-sm" type="button" data-act="toast" data-msg="Demo：仅生成单批发布计划，不执行">生成单批发布计划</button>' +
        '<button class="btn btn-secondary btn-sm" type="button" data-act="toast" data-msg="Demo：未连接 Search Console">重新提交 sitemap</button></div>' }) +
      '<div class="note">SEO 技术治理与内容审核分离：Meta 通过审核不代表允许全量索引；URL 规则、sitemap 与灰度发布需独立审批。</div>';

    var optimize = '<div class="grid-2">' +
      '<div class="stack-sm">' +
      '<div class="field"><label>选择商品</label><select class="select" data-act="seo-select">' + S.products.map(function (x) {
        return '<option value="' + esc(x.mpn) + '"' + (x.mpn === p.mpn ? ' selected' : '') + '>' + esc(x.mpn) + ' · ' + esc(x.brand) + '</option>';
      }).join('') + '</select></div>' +
      '<div class="field"><label>SEO Title <span class="dim" id="seoTitleCount">' + seoTitle.length + '/60</span></label>' +
      '<input class="input" id="seoTitleInput" value="' + esc(seoTitle) + '" data-count-target="seoTitleCount" maxlength="80"></div>' +
      '<div class="field"><label>Meta Description <span class="dim" id="seoDescCount">' + seoDesc.length + '/155</span></label>' +
      '<textarea class="textarea" id="seoDescInput" data-count-target="seoDescCount" maxlength="200">' + esc(seoDesc) + '</textarea></div>' +
      '<div class="row" style="gap:var(--sp-3)"><button class="btn btn-primary btn-sm" type="button" data-act="seo-suggest">生成优化建议</button>' +
      '<button class="btn btn-secondary btn-sm" type="button" data-act="seo-save">保存</button></div>' +
      '<div id="seoSuggestions">' + (suggestions.length ? '<div class="stack-sm">' + suggestions.map(function (s) {
        return '<div class="note">' + s + '</div>';
      }).join('') + '</div>' : '') + '</div>' +
      '</div>' +
      '<div class="stack-sm"><div class="label">SERP 预览</div><div class="serp">' +
      '<div class="serp-url">morrishk.net › products › ' + esc(p.mpn.toLowerCase()) + '</div>' +
      '<div class="serp-title">' + esc(seoTitle) + '</div><div class="serp-desc">' + esc(seoDesc) + '</div></div>' +
      '<div class="note">标题建议 60 字符内，描述 155 字符内；参数事实必须来自已审核数据。</div></div>' +
      '</div>';

    var panels = [
      { id: 'keywords', body: '<section class="card">' + UI.tbl(['搜索词', '类型', { h: '曝光', cls: 'num' }, { h: 'CTR', cls: 'num' }, { h: '平均排名', cls: 'num' }, '状态', ''], kwRows) + UI.foot('6 个抽样词', 'Search Console 未连接，数据为 Demo') + '</section>' },
      { id: 'zero', body: '<section class="card">' + UI.tbl(['零结果词', { h: '搜索次数', cls: 'num' }, '意图', '建议动作', ''], zeroRows) + UI.foot('4 个零结果词', '来自站内搜索 Demo 日志') + '</section>' },
      { id: 'synonyms', body: '<section class="card"><div class="card-hd"><div><h2>同义词与术语</h2><div class="sub">中英术语映射，保证搜索与 GEO 一致</div></div><button class="btn btn-secondary btn-sm" type="button" data-act="syn-new">新增同义词</button></div>' +
        UI.tbl(['术语', '映射', '类型', ''], synRows) + UI.foot('4 条映射', 'Demo 配置') + '</section>' },
      { id: 'optimize', body: '<section class="card"><div class="card-bd">' + optimize + '</div></section>' },
      { id: 'governance', body: governance }
    ];

    return '<div class="adm-page" data-filter-scope>' +
      UI.pageHead('SEO 管理', '关键词、零结果词、同义词、页面级 Meta 与技术治理；URL 规则变更必须分批灰度并可回滚。',
        UI.demoChip('搜索数据为 Demo') +
        '<button class="btn btn-secondary btn-sm" type="button" data-act="export-demo" data-name="SEO 报告">导出报告</button>') +
      '<div class="stat-grid" style="grid-template-columns:repeat(4,minmax(0,1fr))">' + stats + '</div>' +
      UI.tabs([
        { id: 'keywords', t: '关键词表现', count: D.searchTerms.length },
        { id: 'zero', t: '零结果词', count: D.zeroTerms.length },
        { id: 'synonyms', t: '同义词', count: D.synonyms.length },
        { id: 'optimize', t: '页面优化' },
        { id: 'governance', t: '技术治理' }
      ], tab, 'seotabs') +
      '<div class="mt-3">' + UI.panels('seotabs', panels, tab) + '</div>' +
      '<div class="note">生成 SEO 内容是异步任务，不阻塞商品浏览与询盘；事实字段只允许引用 Verified 参数。</div>' +
      '</div>';
  };

  /* ================================================================ GEO 内容管理 */
  V.geo = function (S) {
    var rows = S.products.slice(0, 8).map(function (p) {
      var params = D.params.filter(function (x) { return x.mpn === p.mpn; });
      var ver = params.filter(function (x) { return x.status === 'Verified'; }).length;
      var total = params.length;
      var pct = total ? Math.round(ver / total * 100) : 0;
      return '<tr><td><span class="cell-main">' + esc(p.mpn) + '</span><span class="cell-sub">' + esc(p.brand) + '</span></td>' +
        '<td>' + (total ? ver + ' / ' + total : '<span class="muted">待解析</span>') + '</td>' +
        '<td style="min-width:140px">' + UI.progress(pct, pct < 80) + '<span class="cell-sub">' + pct + '% 已验证</span></td>' +
        '<td>' + UI.pill(pct === 100 ? 'Verified' : pct ? 'Needs Review' : 'Draft', pct === 100 ? '可生成' : pct ? '部分可生成' : '不可生成') + '</td>' +
        '<td class="actions"><button class="link-btn" type="button" data-act="geo-gen" data-id="' + esc(p.mpn) + '">生成 GEO 草稿</button></td></tr>';
    }).join('');

    var geoContents = S.contents.filter(function (c) { return /GEO/.test(c.channel); });

    return '<div class="adm-page">' +
      UI.pageHead('GEO 内容管理', '为生成式搜索准备可引用的结构化答案；AI Referral、内容覆盖与引用抽样分开统计，不并入自然流量。',
        UI.demoChip('未接入真实 AI 搜索平台') +
        '<a class="btn btn-primary btn-sm" href="#/tech-content"><span data-icon="sparkles"></span>生成 GEO 内容</a>') +
      '<div class="grid-4-8">' +
      UI.card({ title: 'GEO 就绪度', sub: '按商品统计可引用的已审核参数', padSm: true,
        body: '<div class="hero-num">' + geoContents.length + ' <small>篇 GEO 内容</small></div>' +
          '<div class="chart-note">GEO 内容必须具备：结构化参数、来源证据、适用边界、常见问题。未审核参数不会被引用。</div>' +
          '<div class="stack-sm mt-3">' +
          '<div class="kpi-mini"><span class="k">已审核参数</span><span class="v">172,930</span></div>' +
          '<div class="kpi-mini"><span class="k">待审核</span><span class="v">1,268</span></div>' +
          '<div class="kpi-mini"><span class="k">覆盖率</span><span class="v">92.7%</span></div></div>' }) +
      UI.card({ title: 'AI 答案预览（Demo）', sub: '展示内容在生成式搜索中的理想形态', padSm: true,
        body: '<div class="qbox"><div class="q">MCF8315A 的供电电压范围是多少？</div>' +
          '<div class="a">根据 Ds Bit 已审核参数，MCF8315A 的工作电压 VVM 为 4.5 V 至 35 V（datasheet v2.1，第 8 页）。该范围适用于工作条件，峰值输出电流等参数请结合散热条件确认。</div>' +
          '<div class="src">' + UI.pill('Verified', '证据 9f2c7a1b') + '<span>页码 p.8</span><span>参数更新时间 2026-11-15</span></div></div>' +
          '<div class="qbox mt-3"><div class="q">LM317T 的输出电流是多少？</div>' +
          '<div class="a">LM317T 保证 1.5 A 输出电流（datasheet v6.0，第 2 页）。实际可用电流取决于封装散热与输入输出压差。</div>' +
          '<div class="src">' + UI.pill('Verified', '证据 c7e4b2a9') + '<span>页码 p.2</span></div></div>' }) +
      '</div>' +
      (function () {
        var g = D.analytics.geo;
        var gRows = [
          { k: 'AI Referral 会话', v: UI.num(g.aiReferral.sessions), d: g.aiReferral.note },
          { k: 'GEO 内容覆盖', v: g.coverage.pieces + ' / ' + g.coverage.total, d: g.coverage.note },
          { k: 'AI 引用抽样', v: g.citations.cited + ' / ' + g.citations.samples, d: g.citations.note }
        ].map(function (r) {
          return '<tr><td><span class="cell-main">' + esc(r.k) + '</span></td><td class="num">' + r.v + '</td><td><span class="body-sm">' + esc(r.d) + '</span></td></tr>';
        }).join('');
        return UI.card({ title: 'GEO 效果监测（三项分开）', sub: 'AI Referral / 内容覆盖 / 引用抽样', pad: false,
          body: UI.tbl(['指标', { h: '当前 Demo', cls: 'num' }, '口径说明'], gRows) +
            UI.foot('AI 搜索不可全量测量', '不把 GEO 当作完整可测流量渠道') +
            '<div class="card-bd" style="padding-top:0"><div class="note warn">AI Referral 只是 GA4 中的少量 referral 会话；引用抽样为人工观察，不能推断平台整体引用份额。三者不得合并成“GEO 流量”单一指标。</div></div>' });
      })() +
      UI.card({ title: '内容资产（GEO 渠道）', sub: '只展示已绑定 GEO 渠道的内容', pad: false,
        body: UI.tbl(['标题', '类型', '审核', '发布', '更新'], geoContents.map(function (c) {
          return '<tr><td><button class="link-btn" type="button" data-act="content-view" data-id="' + esc(c.id) + '">' + esc(c.title) + '</button></td>' +
            '<td>' + esc(c.type) + '</td><td>' + UI.pill(c.review, c.review === 'Approved' ? '已通过' : c.review === 'Needs Revision' ? '待修改' : '待审核') + '</td>' +
            '<td>' + UI.pill(c.publish, c.publish === 'Published' ? '已发布' : '草稿') + '</td><td class="nowrap"><span class="cell-sub">' + esc(c.updated) + '</span></td></tr>';
        }).join('')) + UI.foot('Demo 抽样 ' + geoContents.length + ' 条', 'GEO 渠道内容') }) +
      UI.card({ title: 'GEO 就绪度检查', sub: '按商品逐项核对', pad: false,
        body: UI.tbl(['商品', '已审核 / 全部参数', '覆盖率', '可生成状态', ''], rows) +
          '<div class="table-foot"><span>仅统计 Ds Bit 已审核参数</span><a class="link-btn" href="#/param-review">去审核</a></div>' }) +
      UI.card({ title: 'GEO 写作约束', padSm: true, body:
        '<div class="grid-2"><div class="stack-sm">' +
        '<div class="list-row"><span class="st st-ok">' + UI.icon('check') + '允许</span><div class="grow"><div class="ttl">结构化事实 + 证据引用</div><div class="meta">参数值、单位、页码、文档哈希</div></div></div>' +
        '<div class="list-row"><span class="st st-ok">' + UI.icon('check') + '允许</span><div class="grow"><div class="ttl">适用边界与替代方案</div><div class="meta">EOL / 缺货商品给出替代方向</div></div></div>' +
        '</div><div class="stack-sm">' +
        '<div class="list-row"><span class="st st-danger">' + UI.icon('x') + '禁止</span><div class="grow"><div class="ttl">引用待审核参数</div><div class="meta">Needs Review 不得写成确定事实</div></div></div>' +
        '<div class="list-row"><span class="st st-danger">' + UI.icon('x') + '禁止</span><div class="grow"><div class="ttl">虚构价格与库存承诺</div><div class="meta">统一 Request Quote</div></div></div>' +
        '</div></div>' }) +
      '</div>';
  };

  /* ================================================================ 内容资产库 */
  V.content = function (S) {
    var tab = S.contentTab || 'all';
    var rows = S.contents.map(function (c) {
      return '<tr data-search="' + esc((c.title + ' ' + c.mpn + ' ' + c.type).toLowerCase()) + '" data-fstatus="' + esc(c.review + ' ' + c.publish + (c.review !== 'Approved' ? ' NotApproved' : '')) + '" data-ftype="' + esc(c.type) + '">' +
        '<td><button class="link-btn" type="button" data-act="content-view" data-id="' + esc(c.id) + '">' + esc(c.title) + '</button>' +
        '<span class="cell-sub">' + esc(c.id) + ' · ' + esc(c.type) + ' · ' + esc(c.mpn) + '</span></td>' +
        '<td>' + esc(c.channel) + '</td><td>' + UI.pill(c.review, { Approved: '已通过', 'Pending Review': '待审核', 'Needs Revision': '待修改' }[c.review] || c.review) + '</td>' +
        '<td>' + UI.pill(c.publish, c.publish === 'Published' ? '已发布' : '草稿') + '</td>' +
        '<td>' + (c.ai === 'AI Generated' ? '<span class="st st-muted">' + UI.icon('sparkles') + 'AI</span>' : '<span class="st">' + UI.icon('user') + '人工</span>') + '</td>' +
        '<td class="nowrap"><span class="cell-sub">' + esc(c.updated) + '</span></td>' +
        '<td class="actions"><div class="row-actions"><button class="link-btn" type="button" data-act="content-view" data-id="' + esc(c.id) + '">审阅</button>' +
        '<button class="link-btn" type="button" data-act="content-publish" data-id="' + esc(c.id) + '">发布</button></div></td></tr>';
    }).join('');

    var types = ['技术文章', '产品对比', '选型指南', '技术问答', '新闻公告', '应用方案'];

    return '<div class="adm-page" data-filter-scope>' +
      UI.pageHead('内容资产库', '技术文章、对比、选型指南与公告的唯一内容源；发布前必须经过人工审核。',
        UI.demoChip('内容为 Demo 草稿') +
        '<button class="btn btn-secondary btn-sm" type="button" data-act="export-demo" data-name="内容资产">导出</button>' +
        '<button class="btn btn-primary btn-sm" type="button" data-act="content-new"><span data-icon="plus"></span>新建内容</button>') +
      UI.tabs([
        { id: 'all', t: '全部', count: S.contents.length },
        { id: 'review', t: '待审核', count: S.contents.filter(function (c) { return c.review !== 'Approved'; }).length, statusFilter: 'NotApproved' },
        { id: 'approved', t: '已通过', count: S.contents.filter(function (c) { return c.review === 'Approved'; }).length, statusFilter: 'Approved' },
        { id: 'published', t: '已发布', count: S.contents.filter(function (c) { return c.publish === 'Published'; }).length, statusFilter: 'Published' }
      ], tab, 'cnttabs') +
      UI.toolbar('<input class="input" type="search" style="width:300px" placeholder="搜索标题 / MPN / 类型" data-filter-input aria-label="搜索内容">' +
        '<select class="select" style="width:150px" data-filter-type aria-label="内容类型"><option value="">全部类型</option>' +
        types.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select>',
        '<span class="toolbar-label" data-filter-count>共 ' + S.contents.length + ' 条</span>') +
      '<section class="card">' +
      UI.tbl(['标题', '渠道', '审核', '发布', '来源', '更新时间', ''], rows +
        '<tr data-empty-row hidden><td colspan="7">' + UI.empty() + '</td></tr>', 'responsive', 'data-table="contents"') +
      UI.foot('共 ' + S.contents.length + ' 条（Demo 抽样）', 'AI 生成内容必须人工审核') + '</section>' +
      '<div class="note warn">内容审核与发布为两个独立状态：审核通过不等于已发布；Needs Revision 不可绕过审核直接发布。</div>' +
      '</div>';
  };
})();

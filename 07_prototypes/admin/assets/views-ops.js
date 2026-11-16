/* ============================================================================
   Views — 营销运营（下）/ 商城运营（下）
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

  var STATUS_CN = {
    'Pending Review': '待审核', Approved: '已通过', Scheduled: '已排期', Draft: '草稿', Published: '已发布', Failed: '失败',
    Active: '进行中', Completed: '已完成', Planned: '计划中', Paused: '已暂停', New: '新询盘', Assigned: '已分配',
    Quoted: '已报价', Won: '已成交', Lost: '已丢单', Spam: '垃圾', Parsing: '解析中', Parsed: '已解析'
  };

  /* ================================================================ 社媒账号管理 */
  V.social = function (S) {
    var cards = S.social.map(function (p) {
      var on = p.connected !== 'Disconnected (Demo)';
      return '<div class="plat">' +
        '<div class="plat-hd"><span class="plat-mark">' + esc(p.name.slice(0, 2)) + '</span><div class="grow"><div class="plat-name">' + esc(p.name) + '</div><div class="plat-sub">' + esc(p.handle) + '</div></div>' +
        UI.pill('Not Connected', on ? '未连接 · Demo 状态' : '已停用 · Demo') + '</div>' +
        '<div class="plat-stats">' +
        '<div class="plat-stat"><div class="k">粉丝</div><div class="v">' + UI.num(p.followers) + '</div></div>' +
        '<div class="plat-stat"><div class="k">本期发布</div><div class="v">' + p.posts + '</div></div>' +
        '<div class="plat-stat"><div class="k">互动率</div><div class="v">' + p.engagement + '</div></div>' +
        '<div class="plat-stat"><div class="k">引流询盘</div><div class="v">' + p.inquiries + '</div></div></div>' +
        '<div class="plat-foot"><span class="body-sm muted">内容基调：' + esc(p.tone) + '</span>' +
        '<div class="row" style="gap:var(--sp-2)">' +
        '<button class="btn btn-secondary btn-xs" type="button" data-act="social-toggle" data-id="' + esc(p.id) + '">' + (on ? '停用模拟' : '启用模拟') + '</button>' +
        '<button class="btn btn-primary btn-xs" type="button" data-act="social-test" data-id="' + esc(p.id) + '"' + (on ? '' : ' disabled') + '>发布测试</button>' +
        '</div></div></div>';
    }).join('');

    var published = S.calendar.filter(function (e) { return e.status === 'Published'; });
    var postRows = published.map(function (e) {
      return '<tr><td><span class="cell-main">' + esc(e.title) + '</span><span class="cell-sub">' + esc(e.mpn) + '</span></td>' +
        '<td>' + esc(e.platform) + '</td><td class="nowrap">' + esc(e.date) + ' ' + esc(e.time) + '</td>' +
        '<td>' + esc(e.owner) + '</td><td>' + UI.pill('Published', '已发布') + '</td></tr>';
    }).join('') || '<tr><td colspan="5">' + UI.empty('暂无已发布记录') + '</td></tr>';

    return '<div class="adm-page">' +
      UI.pageHead('社媒账号管理', '社媒发布为独立任务队列：账号、内容、排期与结果都在这里管理，失败可重试。',
        UI.demoChip('未连接真实社媒账号')) +
      '<div class="grid-3">' + cards + '</div>' +
      '<div class="grid-8-4">' +
      UI.card({ title: '已发布记录', sub: '来自发布日历', pad: false,
        body: UI.tbl(['内容', '平台', '时间', '负责人', '状态'], postRows) +
          '<div class="table-foot"><span>Demo 记录</span><a class="link-btn" href="#/calendar">查看日历</a></div>' }) +
      UI.card({ title: '发布规则', body: '<div class="stack-sm">' +
        '<div class="kpi-mini"><span class="k">内容来源</span><span class="v">仅已审核知识</span></div>' +
        '<div class="kpi-mini"><span class="k">发布权限</span><span class="v">营销运营</span></div>' +
        '<div class="kpi-mini"><span class="k">失败处理</span><span class="v">重试队列</span></div>' +
        '<div class="kpi-mini"><span class="k">频控</span><span class="v">每平台每日 ≤ 2</span></div>' +
        '<div class="note mt-3">社媒失败不会回滚商品数据，也不会影响询盘提交。</div>' +
        '<a class="btn btn-secondary btn-sm" href="#/roles">查看权限矩阵</a></div>' }) +
      '</div>' +
      '<div class="note warn"><strong>连接说明：</strong>“已连接（Demo）”仅表示原型中的状态演示；未接入任何真实平台 API、Token 或发布接口。</div>' +
      '</div>';
  };

  /* ================================================================ 社媒发布日历 */
  function calEvents(S, y, m) {
    var prefix = y + '-' + String(m + 1).padStart(2, '0');
    return S.calendar.filter(function (e) { return e.date.indexOf(prefix) === 0 && (!S.calPlatform || e.platform === S.calPlatform); });
  }
  function evClass(st) {
    if (st === 'Failed') return ' st-danger-bd';
    if (st === 'Pending Review') return ' st-warn-bd';
    if (st === 'Published') return ' st-solid-bd';
    return '';
  }
  function evChip(e) {
    return '<button class="cal-ev' + evClass(e.status) + '" type="button" data-act="event-view" data-id="' + esc(e.id) + '" title="' + esc(e.title + ' · ' + e.platform + ' · ' + (STATUS_CN[e.status] || e.status)) + '">' +
      '<span class="t">' + esc(e.title) + '</span><span class="p">' + esc(e.platform.slice(0, 2).toUpperCase()) + '</span></button>';
  }

  V.calendar = function (S) {
    var y = S.calY, m = S.calM, view = S.calView || 'month';
    var events = calEvents(S, y, m);
    var dows = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    var grid = '', title = y + ' 年 ' + (m + 1) + ' 月';

    if (view === 'month') {
      var first = new Date(y, m, 1);
      var offset = (first.getDay() + 6) % 7;
      var dim = new Date(y, m + 1, 0).getDate();
      var prevDim = new Date(y, m, 0).getDate();
      var cells = [];
      for (var i = 0; i < 42; i++) {
        var dnum = i - offset + 1, out = false, cy = y, cm = m;
        if (dnum < 1) { dnum += prevDim; out = true; cm = m - 1; if (cm < 0) { cm = 11; cy = y - 1; } }
        if (dnum > dim) { dnum -= dim; out = true; cm = m + 1; if (cm > 11) { cm = 0; cy = y + 1; } }
        var ds = cy + '-' + String(cm + 1).padStart(2, '0') + '-' + String(dnum).padStart(2, '0');
        var today = ds === '2026-11-16';
        var dayEvents = S.calendar.filter(function (e) { return e.date === ds && (!S.calPlatform || e.platform === S.calPlatform); });
        cells.push('<div class="cal-cell' + (out ? ' out' : '') + (today ? ' today' : '') + '"><div class="cal-date' + (today ? ' today' : '') + '">' + dnum + '</div>' +
          '<div class="cal-events">' + dayEvents.map(evChip).join('') + '</div></div>');
      }
      grid = '<div class="cal-grid">' + dows.map(function (d) { return '<div class="cal-dow">' + d + '</div>'; }).join('') + cells.join('') + '</div>';
    } else {
      var base = new Date(2026, 10, 16);
      var start = new Date(base.getTime() - ((base.getDay() + 6) % 7) * 86400000);
      var weekCells = dows.map(function (d, i) {
        var dt = new Date(start.getTime() + i * 86400000);
        var ds = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
        var today = ds === '2026-11-16';
        var list = S.calendar.filter(function (e) { return e.date === ds && (!S.calPlatform || e.platform === S.calPlatform); });
        return '<div class="cal-cell' + (today ? ' today' : '') + '"><div class="cal-date' + (today ? ' today' : '') + '">' + (dt.getMonth() + 1) + '/' + dt.getDate() + '</div>' +
          '<div class="cal-events">' + (list.length ? list.map(evChip).join('') : '<span class="body-sm dim">—</span>') + '</div></div>';
      }).join('');
      grid = '<div class="cal-week">' + weekCells + '</div>';
      title = '11 月 16 日 — 11 月 22 日（本周）';
    }

    var countAll = calEvents(S, y, m).length;

    var footerLegend = '<div class="viz-legend mt-3">' +
      '<span><i class="viz-key"></i>已发布</span><span><i class="viz-key k2"></i>已排期 / 已通过</span>' +
      '<span><i class="viz-key k3"></i>草稿</span><span class="ui-pend">' + UI.pill('Pending Review', '待审核') + UI.pill('Failed', '失败') + '</span></div>';

    return '<div class="adm-page">' +
      UI.pageHead('社媒发布日历', '内容先审核再排期；发布失败留在日历里可重试，不反向影响商品与询盘。',
        UI.demoChip('排期为 Demo，不触发真实发布') +
        '<button class="btn btn-primary btn-sm" type="button" data-act="event-new"><span data-icon="plus"></span>新建排期</button>') +
      '<section class="card"><div class="card-hd" style="flex-wrap:wrap;gap:var(--sp-3)">' +
      '<div class="cal-toolbar">' +
      '<div class="seg"><button type="button" class="' + (view === 'month' ? 'on' : '') + '" data-act="cal-view" data-view="month">月</button>' +
      '<button type="button" class="' + (view === 'week' ? 'on' : '') + '" data-act="cal-view" data-view="week">周</button></div>' +
      '<select class="select" style="width:140px" data-act="cal-platform"><option value="">全部平台</option>' +
      ['LinkedIn', 'Facebook', 'YouTube'].map(function (p) { return '<option' + (S.calPlatform === p ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select>' +
      '</div>' +
      '<div class="cal-month"><button class="icon-btn" type="button" data-act="cal-prev" aria-label="上个月"' + (view === 'week' ? ' disabled' : '') + ' data-icon="arrow-left"></button>' +
      '<span class="cal-title">' + title + '</span>' +
      '<button class="icon-btn" type="button" data-act="cal-next" aria-label="下个月"' + (view === 'week' ? ' disabled' : '') + ' data-icon="arrow-right"></button></div>' +
      '</div><div class="card-bd tight">' + grid + '</div><div class="card-bd" style="padding-top:0">' + footerLegend +
      '<div class="chart-note">本月共 ' + countAll + ' 条排期（Demo）。点击任一排期查看内容、审核状态与发布动作。</div></div></section>' +
      '<div class="note">发布链路：内容审核通过 → 排期 → 到点发布 → 回写结果。失败任务进入重试队列，不影响其他链路。</div>' +
      '</div>';
  };

  /* ================================================================ 视频营销 */
  V.video = function (S) {
    var stages = ['Idea', 'Script', 'Editing', 'Review', 'Published'];
    var stageCn = { Idea: '选题', Script: '脚本', Editing: '剪辑', Review: '审核', Published: '已发布' };
    var totalViews = S.videos.reduce(function (a, v) { return a + v.views; }, 0);
    var totalLeads = S.videos.reduce(function (a, v) { return a + v.inquiries; }, 0);
    var stats = [
      { k: '已发布视频', v: String(S.videos.filter(function (v) { return v.status === 'Published'; }).length), note: 'YouTube', icon: 'video' },
      { k: '制作中', v: String(S.videos.filter(function (v) { return v.status !== 'Published'; }).length), note: '剪辑 / 审核 / 脚本', icon: 'clock', warn: true },
      { k: '累计播放', v: UI.num(totalViews), note: 'Demo 平台数据', icon: 'trend', mock: 'Demo 播放数据' },
      { k: '视频引流询盘', v: String(totalLeads), note: '含已归因', icon: 'inbox' }
    ].map(function (x) { return UI.stat(x); }).join('');

    var board = '<div class="kanban">' + stages.map(function (st) {
      var list = S.videos.filter(function (v) { return v.status === st; });
      return '<div class="kanban-col"><div class="kanban-hd"><span class="k">' + stageCn[st] + '</span><span class="n">' + list.length + '</span></div>' +
        list.map(function (v) {
          return '<div class="kanban-card"><div class="t">' + esc(v.title) + '</div>' +
            '<div class="m">' + esc(v.mpn) + ' · ' + esc(v.id) + '</div>' +
            '<div class="m mono-sm">→ ' + esc(v.landing || '未设置落地页') + '</div>' +
            '<div class="a"><span class="muted" style="font-size:var(--fs-caption)">' + esc(v.updated) + '</span>' +
            (st !== 'Published' ? '<button class="link-btn" type="button" data-act="video-advance" data-id="' + esc(v.id) + '">推进</button>' :
              '<button class="link-btn" type="button" data-act="video-view" data-id="' + esc(v.id) + '">数据</button>') + '</div></div>';
        }).join('') + '</div>';
    }).join('') + '</div>';

    var pubRows = S.videos.filter(function (v) { return v.status === 'Published'; }).map(function (v) {
      return '<tr><td><span class="cell-main">' + esc(v.title) + '</span><span class="cell-sub">' + esc(v.mpn + ' · ' + v.id) + '</span></td>' +
        '<td><span class="mono-sm">' + esc(v.landing || '—') + '</span><span class="cell-sub">' + esc(v.utm || '—') + '</span></td>' +
        '<td class="num">' + UI.num(v.views) + '</td><td class="num">' + v.avg + '</td>' +
        '<td class="num">' + UI.num(v.clicks) + ' → ' + v.inquiries + '</td><td>' + UI.pill('Published', '已发布') + '</td></tr>';
    }).join('') || '<tr><td colspan="6">' + UI.empty() + '</td></tr>';

    return '<div class="adm-page">' +
      UI.pageHead('视频营销', '从选题到发布的独立流水线；视频处理使用独立媒体任务，不与内容发布耦合。',
        UI.demoChip('平台数据为 Demo') +
        '<button class="btn btn-primary btn-sm" type="button" data-act="video-new"><span data-icon="plus"></span>新建视频</button>') +
      '<div class="stat-grid" style="grid-template-columns:repeat(4,minmax(0,1fr))">' + stats + '</div>' +
      UI.card({ title: '制作看板', sub: '点击“推进”移动到下一阶段（Demo 前端状态）', body: board }) +
      UI.card({ title: '已发布视频表现', sub: '播放 / 观看时长 / 点击 → 询盘转化', pad: false,
        body: UI.tbl(['视频 / 关联商品', '落地页 / UTM', { h: '播放', cls: 'num' }, { h: '平均观看', cls: 'num' }, { h: '点击 → 询盘', cls: 'num' }, '状态'], pubRows) +
          '<div class="table-foot"><span>Demo 抽样</span><span class="muted">YouTube 与落地页归因未接入</span></div>' }) +
      '<div class="note">视频转码与封面处理属于独立媒体任务；营销任务失败不影响商品详情、库存展示与询盘提交。</div>' +
      '</div>';
  };

  /* ================================================================ 营销活动 */
  V.campaigns = function (S) {
    var active = S.campaigns.filter(function (c) { return c.status === 'Active'; }).length;
    var leads = S.campaigns.reduce(function (a, c) { return a + c.leads; }, 0);
    var valid = S.campaigns.reduce(function (a, c) { return a + c.valid; }, 0);
    var stats = [
      { k: '进行中活动', v: String(active), note: '共 ' + S.campaigns.length + ' 个', icon: 'target' },
      { k: '累计询盘', v: String(leads), note: 'Demo 归因', icon: 'inbox', mock: 'Demo 归因数据' },
      { k: '有效询盘', v: String(valid), note: '有效率 ' + Math.round(valid / leads * 100) + '%', icon: 'check' },
      { k: '计划中活动', v: String(S.campaigns.filter(function (c) { return c.status === 'Planned' || c.status === 'Draft'; }).length), note: 'Q4 主题月', icon: 'calendar' }
    ].map(function (x) { return UI.stat(x); }).join('');

    var rows = S.campaigns.map(function (c) {
      return '<tr data-search="' + esc((c.name + ' ' + c.channels + ' ' + c.id).toLowerCase()) + '">' +
        '<td><button class="link-btn" type="button" data-act="campaign-view" data-id="' + esc(c.id) + '">' + esc(c.name) + '</button>' +
        '<span class="cell-sub">' + esc(c.id) + ' · ' + esc(c.channels) + '</span></td>' +
        '<td class="nowrap">' + esc(c.period) + '</td><td class="num">' + c.contents + '</td>' +
        '<td class="num">' + c.leads + '</td><td class="num">' + c.valid + '</td>' +
        '<td>' + UI.pill(c.status, STATUS_CN[c.status] || c.status) + '</td><td>' + esc(c.owner) + '</td>' +
        '<td class="actions"><div class="row-actions"><button class="link-btn" type="button" data-act="campaign-view" data-id="' + esc(c.id) + '">详情</button>' +
        (c.status === 'Active' ? '<button class="link-btn" type="button" data-act="campaign-toggle" data-id="' + esc(c.id) + '">暂停</button>' :
          c.status === 'Paused' ? '<button class="link-btn" type="button" data-act="campaign-toggle" data-id="' + esc(c.id) + '">恢复</button>' : '') +
        '</div></td></tr>';
    }).join('');

    return '<div class="adm-page" data-filter-scope>' +
      UI.pageHead('营销活动', '把内容、渠道、周期与询盘结果绑定到同一个活动；暂停活动不影响已发布内容。',
        UI.demoChip('活动数据为 Demo') +
        '<button class="btn btn-primary btn-sm" type="button" data-act="campaign-new"><span data-icon="plus"></span>新建活动</button>') +
      '<div class="stat-grid" style="grid-template-columns:repeat(4,minmax(0,1fr))">' + stats + '</div>' +
      UI.toolbar('<input class="input" type="search" style="width:300px" placeholder="搜索活动 / 渠道" data-filter-input aria-label="搜索活动">',
        '<span class="toolbar-label" data-filter-count>共 ' + S.campaigns.length + ' 个</span>') +
      '<section class="card">' + UI.tbl(['活动', '周期', { h: '内容', cls: 'num' }, { h: '询盘', cls: 'num' }, { h: '有效', cls: 'num' }, '状态', '负责人', ''], rows) +
      UI.foot('共 ' + S.campaigns.length + ' 个活动') + '</section>' +
      '<div class="note warn"><strong>归因边界：</strong>活动询盘依赖 UTM 与 GA4 事件；GA4 未连接时数据仅供原型演示。</div>' +
      '</div>';
  };

  /* ================================================================ 数据分析 */
  V.analytics = function (S) {
    var range = S.analyticsRange || 30;
    var traffic = D.overview.traffic;
    var inq = D.overview.inquiries;

    function synthetic(base, n, offset) {
      var out = [];
      for (var i = 0; i < n; i++) {
        var b = base[i % base.length];
        var swing = ((i * 7 + offset) % 13) - 6;
        out.push(Math.max(1, Math.round(b * (1 + swing / 100) + i * 0.35)));
      }
      return out;
    }

    var tSeries, iSeries, trendNote;
    if (range === 7) {
      tSeries = traffic.slice(-7); iSeries = inq.slice(-7);
      trendNote = '最近 7 天（Demo 快照）';
    } else if (range === 90) {
      tSeries = synthetic(traffic, 90, 3); iSeries = synthetic(inq, 90, 9);
      trendNote = '90 天为合成 Demo 数据，不是真实历史回填';
    } else {
      tSeries = traffic; iSeries = inq;
      trendNote = '最近 30 天（Demo 快照）';
    }
    var labels = dayLabels(range);

    var layerRows = D.analytics.sourceLayers.map(function (l) {
      return '<tr><td><span class="cell-main">' + esc(l.layer) + '</span><span class="cell-sub">' + esc(l.source) + '</span></td>' +
        '<td><span class="body-sm">' + esc(l.measures) + '</span></td>' +
        '<td>' + UI.pill(l.status === '未连接' ? 'Not Connected' : 'Demo', l.status) + '</td>' +
        '<td><span class="body-sm muted">' + esc(l.note) + '</span></td></tr>';
    }).join('');

    var bridge = D.analytics.leadBridge;
    var bridgeFunnel = bridge.map(function (b, i) {
      return { k: b.event, v: b.v, rate: (b.v / bridge[0].v * 100).toFixed(1) + '%' };
    });

    var utmRows = D.inquiries.filter(function (i) { return i.channel !== 'Direct'; }).map(function (i) {
      var valid = i.spam > 0.5 ? ['Invalid', '无效'] : i.duplicate !== '—' ? ['Needs Review', '待人工确认'] : ['Valid', '有效'];
      return '<tr><td><button class="link-btn mono-sm" type="button" data-act="inquiry-view" data-id="' + esc(i.lead) + '">' + esc(i.lead) + '</button>' +
        '<span class="cell-sub">' + esc(i.request) + '</span></td>' +
        '<td><span class="mono-sm">' + esc(i.session || '—') + '</span></td>' +
        '<td><span class="mono-sm">' + esc(i.utm) + '</span><span class="cell-sub">' + esc(i.landing || '—') + '</span></td>' +
        '<td>' + esc(i.channel) + '</td><td>' + UI.pill(valid[0], valid[1]) + '</td></tr>';
    }).join('');

    var channelRows = D.overview.channels.map(function (c) {
      return '<tr><td>' + esc(c.k) + '</td><td class="num">' + c.impressions + '</td><td class="num">' + c.clicks + '</td>' +
        '<td class="num">' + c.ctr + '</td><td class="num">' + UI.num(c.leads) + '</td><td class="num">' + c.valid + '%</td><td>' + UI.spark(c.trend) + '</td></tr>';
    }).join('');

    return '<div class="adm-page">' +
      UI.pageHead('数据分析', '平台原生数据、GA4 网站行为与后台业务数据分层展示；询盘有效性只以后台 LeadNo 判定为准。',
        UI.demoChip('GA4 / Search Console 未连接') +
        '<div class="seg"><button type="button" class="' + (range === 7 ? 'on' : '') + '" data-act="an-range" data-range="7">7 天</button>' +
        '<button type="button" class="' + (range === 30 ? 'on' : '') + '" data-act="an-range" data-range="30">30 天</button>' +
        '<button type="button" class="' + (range === 90 ? 'on' : '') + '" data-act="an-range" data-range="90">90 天</button></div>' +
        '<button class="btn btn-secondary btn-sm" type="button" data-act="export-demo" data-name="分析报告">导出</button>') +

      UI.card({ title: '数据来源分层', sub: '三类数据不可混用同一口径', pad: false,
        body: UI.tbl(['层级 / 来源', '可衡量指标', '状态', '边界说明'], layerRows) +
          UI.foot('平台 ≠ GA4 ≠ 后台业务数据', '口径说明见各层边界') }) +

      '<div class="grid-7-5">' +
      UI.card({ title: '访客与询盘', sub: trendNote, padSm: true,
        body: UI.chart({ h: 210, series: [
          { v: tSeries, cls: 'viz-line-1', area: true, name: '访客' },
          { v: iSeries, cls: 'viz-line-2', name: '询盘' }
        ], labels: labels, label: '访客与询盘趋势' }) +
          '<div class="viz-legend mt-3"><span><i class="viz-key"></i>访客（UV · GA4 Demo）</span><span><i class="viz-key k2"></i>询盘（提交量 · 后台 Demo）</span></div>' +
          '<div class="chart-note">' + esc(trendNote) + '；GA4 未连接，序列不可作为真实历史。</div>' }) +
      UI.card({ title: '询盘转化桥接', sub: 'generate_lead → 入库 → 有效', padSm: true,
        body: UI.funnel(bridgeFunnel) +
          '<div class="chart-note">generate_lead 是前端事件，包含 Spam、重复与测试提交；只有后台 LeadNo 判定后才算有效询盘。</div>' +
          '<div class="note warn mt-3">1860 → 1724 → 714 均为 Demo 数字，不代表当前真实转化率。</div>' }) +
      '</div>' +

      UI.card({ title: '渠道指标', sub: '搜索 / 社媒 / 视频 / GEO / AI Referral（抽样）', pad: false,
        body: UI.tbl(['渠道', { h: '曝光', cls: 'num' }, { h: '点击', cls: 'num' }, { h: 'CTR', cls: 'num' }, { h: '询盘', cls: 'num' }, { h: '有效%', cls: 'num' }, '趋势'], channelRows) +
          UI.foot('平台数据未连接', 'GEO / AI 来源为抽样，不作为完整可测流量渠道') }) +

      '<div class="grid-8-4">' +
      UI.card({ title: '询盘归因明细', sub: 'LeadNo ↔ 渠道 ↔ UTM ↔ GA4 Session', pad: false,
        body: UI.tbl(['LeadNo', 'GA4 Session', 'UTM / 落地页', '渠道', '有效判定'], utmRows) +
          '<div class="table-foot"><span>Demo 抽样</span><span class="muted">有效性由后台判定</span></div>' }) +
      UI.card({ title: '数据质量', body: '<div class="stack-sm">' +
        '<div class="kpi-mini"><span class="k">Spam 询盘</span><span class="v">' + S.inquiries.filter(function (i) { return i.status === 'Spam'; }).length + '</span></div>' +
        '<div class="kpi-mini"><span class="k">疑似重复</span><span class="v">' + S.inquiries.filter(function (i) { return i.duplicate !== '—'; }).length + '</span></div>' +
        '<div class="kpi-mini"><span class="k">GA4</span><span class="v">未连接</span></div>' +
        '<div class="kpi-mini"><span class="k">Search Console</span><span class="v">未连接</span></div>' +
        '<div class="note warn mt-3">接入 GA4 后需要重新校准渠道归因与有效询盘率；Search Console 与社媒原生数据需分别对账。</div>' +
        '<a class="btn btn-secondary btn-sm" href="#/settings">查看集成设置</a></div>' }) +
      '</div></div>';
  };

  /* ================================================================ 询盘管理 */
  V.inquiries = function (S) {
    var tab = S.inquiryTab || 'all';
    var counts = {};
    ['New', 'Assigned', 'Quoted', 'Won', 'Lost', 'Spam'].forEach(function (k) {
      counts[k] = S.inquiries.filter(function (i) { return i.status === k; }).length;
    });

    var rows = S.inquiries.map(function (i) {
      return '<tr data-search="' + esc((i.lead + ' ' + i.mpn + ' ' + i.country + ' ' + i.channel).toLowerCase()) + '" data-fstatus="' + esc(i.status) + '">' +
        '<td><button class="link-btn" type="button" data-act="inquiry-view" data-id="' + esc(i.lead) + '">' + esc(i.lead) + '</button>' +
        '<span class="cell-sub">' + esc(i.request) + '</span></td>' +
        '<td><span class="cell-main">' + esc(i.mpn) + '</span><span class="cell-sub">' + UI.num(i.qty) + ' pcs</span></td>' +
        '<td>' + esc(i.channel) + '</td>' +
        '<td><span class="mono-sm">' + esc(i.session || '—') + '</span><span class="cell-sub">' + esc(i.landing || '—') + '</span></td>' +
        '<td>' + esc(i.country) + '</td>' +
        '<td>' + UI.pill(i.status, STATUS_CN[i.status] || i.status) + '</td>' +
        '<td style="min-width:110px">' + UI.progress(Math.round((1 - i.spam) * 100), i.spam > 0.5) + '<span class="cell-sub">Spam ' + Math.round(i.spam * 100) + '%</span></td>' +
        '<td>' + (i.duplicate !== '—' ? '<span class="st st-warn">' + UI.icon('copy') + '疑似重复</span>' : '<span class="muted">—</span>') + '</td>' +
        '<td>' + esc(i.owner) + '</td>' +
        '<td class="actions"><div class="row-actions"><button class="link-btn" type="button" data-act="inquiry-view" data-id="' + esc(i.lead) + '">处理</button></div></td></tr>';
    }).join('');

    return '<div class="adm-page" data-filter-scope>' +
      UI.pageHead('询盘管理', '从渠道、UTM 到有效询盘的完整链路；Spam 与重复单独标记，不计入有效询盘。',
        UI.demoChip('询盘为 Demo 数据') +
        '<button class="btn btn-secondary btn-sm" type="button" data-act="export-demo" data-name="询盘列表">导出</button>') +
      UI.tabs([
        { id: 'all', t: '全部', count: S.inquiries.length },
        { id: 'new', t: '新询盘', count: counts.New, statusFilter: 'New' },
        { id: 'assigned', t: '已分配', count: counts.Assigned, statusFilter: 'Assigned' },
        { id: 'quoted', t: '已报价', count: counts.Quoted, statusFilter: 'Quoted' },
        { id: 'won', t: '已成交', count: counts.Won, statusFilter: 'Won' },
        { id: 'lost', t: '已丢单', count: counts.Lost, statusFilter: 'Lost' },
        { id: 'spam', t: '垃圾', count: counts.Spam, statusFilter: 'Spam' }
      ], tab, 'inqtabs') +
      UI.toolbar('<input class="input" type="search" style="width:300px" placeholder="搜索 LeadNo / MPN / 国家 / 渠道" data-filter-input aria-label="搜索询盘">',
        '<span class="toolbar-label" data-filter-count>共 ' + S.inquiries.length + ' 条</span>') +
      '<section class="card">' + UI.tbl(['LeadNo', '商品 / 数量', '渠道', 'GA4 Session / 落地页', '国家', '状态', '垃圾评分', '重复', '负责人', ''],
        rows + '<tr data-empty-row hidden><td colspan="10">' + UI.empty() + '</td></tr>', 'responsive', 'data-table="inquiries"') +
      UI.foot('共 ' + S.inquiries.length + ' 条（Demo 抽样）', '有效询盘 = 全部 − Spam − 重复；Session 仅用于归因，不代表有效性') + '</section>' +
      '<div class="note">询盘响应与营销发布解耦：社媒或内容任务失败不会影响询盘入库与通知。GA4 的 generate_lead 事件不等于有效询盘。</div>' +
      '</div>';
  };

  /* ================================================================ 搜索管理 */
  V['search-mgmt'] = function (S) {
    var tab = S.searchTab || 'hot';
    var hot = S.hot || [];

    var hotRows = hot.map(function (mpn, i) {
      var p = S.products.filter(function (x) { return x.mpn === mpn; })[0];
      if (!p) return '';
      return '<tr><td class="num">' + (i + 1) + '</td><td><span class="cell-main">' + esc(p.mpn) + '</span><span class="cell-sub">' + esc(p.name) + '</span></td>' +
        '<td>' + esc(p.brand) + '</td><td>' + UI.stock(p.stock, p.qty) + '</td>' +
        '<td class="actions"><div class="row-actions">' +
        '<button class="link-btn" type="button" data-act="hot-up" data-id="' + esc(p.mpn) + '"' + (i === 0 ? ' disabled' : '') + '>上移</button>' +
        '<button class="link-btn" type="button" data-act="hot-down" data-id="' + esc(p.mpn) + '"' + (i === hot.length - 1 ? ' disabled' : '') + '>下移</button>' +
        '<button class="link-btn" type="button" data-act="hot-remove" data-id="' + esc(p.mpn) + '">移除</button></div></td></tr>';
    }).join('') || '<tr><td colspan="5">' + UI.empty('热门推荐为空') + '</td></tr>';

    var termRows = D.searchTerms.map(function (t) {
      return '<tr><td>' + esc(t.term) + '</td><td>' + esc(t.type) + '</td><td class="num">' + UI.num(t.impressions) + '</td>' +
        '<td class="num">' + t.ctr + '</td><td class="num">' + t.position + '</td></tr>';
    }).join('');

    var zeroRows = D.zeroTerms.map(function (t) {
      return '<tr><td>' + esc(t.term) + '</td><td class="num">' + t.hits + '</td><td>' + esc(t.intent) + '</td><td class="muted">' + esc(t.action) + '</td></tr>';
    }).join('');

    var synRows = D.synonyms.map(function (t) {
      return '<tr><td>' + esc(t.term) + '</td><td>' + esc(t.mapped) + '</td><td>' + esc(t.type) + '</td></tr>';
    }).join('');

    var panels = [
      { id: 'hot', body: '<section class="card"><div class="card-hd"><div><h2>热门与推荐</h2><div class="sub">影响站内搜索结果排序</div></div>' +
        '<button class="btn btn-primary btn-sm" type="button" data-act="hot-add">加入推荐</button></div>' +
        UI.tbl([{ h: '#', cls: 'num' }, '商品', '品牌', '库存', ''], hotRows) + UI.foot(hot.length + ' 个推荐位', '顺序即展示顺序') + '</section>' },
      { id: 'terms', body: '<section class="card">' + UI.tbl(['搜索词', '类型', { h: '曝光', cls: 'num' }, { h: 'CTR', cls: 'num' }, { h: '排名', cls: 'num' }], termRows) +
        UI.foot('6 个抽样词', '搜索日志为 Demo') + '</section>' },
      { id: 'zero', body: '<section class="card">' + UI.tbl(['零结果词', { h: '次数', cls: 'num' }, '意图', '建议'], zeroRows) +
        UI.foot('4 个零结果词', '可创建内容或补充分类') + '</section>' },
      { id: 'synonyms', body: '<section class="card">' + UI.tbl(['术语', '映射', '类型'], synRows) +
        UI.foot('4 条映射', 'Demo 配置') + '</section>' }
    ];

    return '<div class="adm-page">' +
      UI.pageHead('搜索管理', '站内搜索的热门推荐、搜索词表现、零结果词与同义词映射。',
        UI.demoChip('搜索日志为 Demo')) +
      UI.tabs([
        { id: 'hot', t: '热门推荐', count: hot.length },
        { id: 'terms', t: '搜索词表现', count: D.searchTerms.length },
        { id: 'zero', t: '零结果词', count: D.zeroTerms.length },
        { id: 'synonyms', t: '同义词', count: D.synonyms.length }
      ], tab, 'searchtabs') +
      '<div class="mt-3">' + UI.panels('searchtabs', panels, tab) + '</div>' +
      '</div>';
  };

  /* ================================================================ 网站基础管理 */
  V['site-basics'] = function (S) {
    var tab = S.siteTab || 'help';
    var langName = { EN: 'English', DE: 'Deutsch', JA: '日本語', ES: 'Español', FR: 'Français', ZH: '中文' };

    function pageTable(list, kind) {
      var rows = list.map(function (p, i) {
        return '<tr data-search="' + esc((p.title + ' ' + p.category).toLowerCase()) + '"><td><span class="cell-main">' + esc(p.title) + '</span></td>' +
          '<td>' + esc(p.category) + '</td><td>' + (langName[p.lang] || p.lang) + '</td>' +
          '<td>' + UI.pill(p.status, p.status === 'Published' ? '已发布' : p.status === 'Scheduled' ? '已排期' : '草稿') + '</td>' +
          '<td class="nowrap"><span class="cell-sub">' + esc(p.updated) + '</span></td>' +
          '<td class="actions"><div class="row-actions"><button class="link-btn" type="button" data-act="page-edit" data-kind="' + kind + '" data-index="' + i + '">编辑</button>' +
          '<button class="link-btn" type="button" data-act="page-delete" data-kind="' + kind + '" data-index="' + i + '">删除</button></div></td></tr>';
      }).join('');
      return '<section class="card"><div class="card-hd"><div><h2>' + { help: '帮助中心', info: '信息页', news: '新闻公告' }[kind] + '</h2>' +
        '<div class="sub">共 ' + list.length + ' 条 · 前台语言 en / de / ja / es / fr</div></div>' +
        '<button class="btn btn-primary btn-sm" type="button" data-act="page-new" data-kind="' + kind + '">新建页面</button></div>' +
        UI.tbl(['标题', '分类', '语言', '状态', '更新时间', ''], rows + '<tr data-empty-row hidden><td colspan="6">' + UI.empty() + '</td></tr>', 'responsive') +
        UI.foot('共 ' + list.length + ' 条', 'Demo 页面数据') + '</section>';
    }

    var panels = [
      { id: 'help', body: pageTable(S.sitePages.help, 'help') },
      { id: 'info', body: pageTable(S.sitePages.info, 'info') },
      { id: 'news', body: pageTable(S.sitePages.news, 'news') }
    ];

    return '<div class="adm-page" data-filter-scope>' +
      UI.pageHead('网站基础管理', '帮助中心、信息页与新闻公告；与内容资产库共享审核结果，但独立维护站点结构。',
        UI.demoChip('页面数据为 Demo') +
        '<button class="btn btn-secondary btn-sm" type="button" data-act="export-demo" data-name="站点页面">导出</button>') +
      UI.tabs([
        { id: 'help', t: '帮助中心', count: S.sitePages.help.length },
        { id: 'info', t: '信息页', count: S.sitePages.info.length },
        { id: 'news', t: '新闻公告', count: S.sitePages.news.length }
      ], tab, 'sitetabs') +
      '<div class="mt-3">' + UI.panels('sitetabs', panels, tab) + '</div>' +
      '<div class="note">语言约束：新站仅 en / de / ja / es / fr，默认 en；不新增中文或印尼语页面。旧站 messages 保留不动。</div>' +
      '</div>';
  };

  /* ================================================================ 库存与价格 */
  V.inventory = function (S) {
    var counts = { 'In Stock': 0, 'Low Stock': 0, 'Out of Stock': 0, 'End of Life': 0 };
    S.products.forEach(function (p) { if (counts[p.stock] != null) counts[p.stock]++; });
    var stats = [
      { k: '有货 SKU', v: String(counts['In Stock']), note: '可正常询价', icon: 'check' },
      { k: '低库存', v: String(counts['Low Stock']), note: '需补货确认', icon: 'clock', warn: true },
      { k: '缺货', v: String(counts['Out of Stock']), note: '询盘需标注交期', icon: 'alert', warn: true },
      { k: '停产 / EOL', v: String(counts['End of Life']), note: '仅保留替代说明', icon: 'box' }
    ].map(function (x) { return UI.stat(x); }).join('');

    var rows = S.products.map(function (p) {
      return '<tr data-search="' + esc((p.mpn + ' ' + p.brand + ' ' + p.warehouse).toLowerCase()) + '" data-stock="' + esc(p.stock) + '">' +
        '<td><span class="cell-main">' + esc(p.mpn) + '</span><span class="cell-sub">' + esc(p.brand) + '</span></td>' +
        '<td>' + esc(p.warehouse) + '</td>' +
        '<td class="actions"><div class="row" style="gap:var(--sp-2)">' +
        '<input class="input" style="width:110px;height:28px;font-size:var(--fs-label)" value="' + p.qty + '" data-qty="' + esc(p.mpn) + '" aria-label="' + esc(p.mpn) + ' 数量">' +
        '<button class="link-btn" type="button" data-act="inventory-save" data-id="' + esc(p.mpn) + '">保存</button></div></td>' +
        '<td>' + UI.stock(p.stock, p.qty) + '</td><td>' + esc(p.lead) + '</td>' +
        '<td><span class="mono-sm">Request Quote</span><span class="cell-sub">价格不在后台维护</span></td>' +
        '<td class="nowrap"><span class="cell-sub">' + esc(p.updated) + '</span></td></tr>';
    }).join('');

    return '<div class="adm-page" data-filter-scope>' +
      UI.pageHead('库存与价格', '库存数量与交期可维护；价格统一 Request Quote，后台不保存虚构报价。',
        UI.demoChip('库存为 Demo') +
        '<button class="btn btn-secondary btn-sm" type="button" data-act="export-demo" data-name="库存清单">导出</button>') +
      '<div class="stat-grid" style="grid-template-columns:repeat(4,minmax(0,1fr))">' + stats + '</div>' +
      UI.toolbar('<input class="input" type="search" style="width:280px" placeholder="搜索 MPN / 品牌 / 仓库" data-filter-input aria-label="搜索库存">' +
        '<select class="select" style="width:150px" data-filter-stock aria-label="库存筛选"><option value="">全部库存</option><option>In Stock</option><option>Low Stock</option><option>Out of Stock</option><option>End of Life</option></select>',
        '<span class="toolbar-label" data-filter-count>共 ' + S.products.length + ' 条</span>') +
      '<section class="card">' + UI.tbl(['商品', '仓库', '数量', '库存状态', '交期', '价格', '更新时间'],
        rows + '<tr data-empty-row hidden><td colspan="7">' + UI.empty() + '</td></tr>', 'responsive', 'data-table="inventory"') +
      UI.foot('共 ' + S.products.length + ' 条（Demo 抽样）', '修改数量不会自动改变库存状态') + '</section>' +
      '<div class="note warn"><strong>价格边界：</strong>商城前台统一显示 Request Quote；本页不提供价格编辑，避免虚构价格进入商品数据。</div>' +
      '</div>';
  };

  /* ================================================================ 品牌管理 */
  V.brands = function (S) {
    var rows = S.brands.map(function (b) {
      var top = S.products.filter(function (p) { return p.brand === b.name; });
      return '<tr data-search="' + esc((b.name + ' ' + b.category).toLowerCase()) + '">' +
        '<td><button class="link-btn" type="button" data-act="brand-view" data-id="' + esc(b.name) + '">' + esc(b.name) + '</button>' +
        '<span class="cell-sub">' + top.length + ' 个 Demo 商品</span></td>' +
        '<td>' + esc(b.category) + '</td><td class="num">' + UI.num(b.products) + '</td>' +
        '<td>' + UI.pill(b.status, b.status === 'Active' ? '启用' : '待审核') + '</td><td class="nowrap"><span class="cell-sub">' + esc(b.updated) + '</span></td>' +
        '<td class="actions"><div class="row-actions"><button class="link-btn" type="button" data-act="brand-view" data-id="' + esc(b.name) + '">详情</button>' +
        '<button class="link-btn" type="button" data-act="toast" data-msg="Demo：品牌编辑未连接后端">编辑</button></div></td></tr>';
    }).join('');

    return '<div class="adm-page" data-filter-scope>' +
      UI.pageHead('品牌管理', '品牌是商品与内容的共同维度；品牌页可映射到 SEO / GEO 内容。',
        UI.demoChip('品牌数据为 Demo') +
        '<button class="btn btn-primary btn-sm" type="button" data-act="brand-new"><span data-icon="plus"></span>新增品牌</button>') +
      UI.toolbar('<input class="input" type="search" style="width:280px" placeholder="搜索品牌 / 品类" data-filter-input aria-label="搜索品牌">',
        '<span class="toolbar-label" data-filter-count>共 ' + S.brands.length + ' 个品牌</span>') +
      '<section class="card">' + UI.tbl(['品牌', '主营品类', { h: '商品数', cls: 'num' }, '状态', '更新时间', ''], rows) +
      UI.foot('共 ' + S.brands.length + ' 个品牌', '商品数为 Demo 汇总') + '</section>' +
      '</div>';
  };

  /* ================================================================ 分类管理 */
  V.categories = function (S) {
    var rows = S.categories.map(function (c, i) {
      return '<tr data-search="' + esc((c.name + ' ' + c.parent).toLowerCase()) + '"><td><span class="cell-main">' + esc(c.name) + '</span>' +
        '<span class="cell-sub">' + esc(c.parent === '—' ? '一级分类' : '上级：' + c.parent) + '</span></td>' +
        '<td class="num">' + UI.num(c.products) + '</td><td class="num">' + c.attrs + '</td>' +
        '<td>' + UI.pill(c.status, '启用') + '</td>' +
        '<td class="actions"><div class="row-actions"><button class="link-btn" type="button" data-act="category-attrs" data-id="' + esc(c.name) + '">属性</button>' +
        '<button class="link-btn" type="button" data-act="toast" data-msg="Demo：分类编辑未连接后端">编辑</button></div></td></tr>';
    }).join('');

    return '<div class="adm-page" data-filter-scope>' +
      UI.pageHead('分类管理', '分类属性决定参数标准化口径；属性来源区分 Ds Bit 与人工维护。',
        UI.demoChip('分类数据为 Demo') +
        '<button class="btn btn-primary btn-sm" type="button" data-act="toast" data-msg="Demo：新增分类未连接后端"><span data-icon="plus"></span>新增分类</button>') +
      '<div class="grid-side">' +
      '<section class="card">' +
      UI.tbl(['分类', { h: '商品数', cls: 'num' }, { h: '属性数', cls: 'num' }, '状态', ''], rows) +
      UI.foot('共 ' + S.categories.length + ' 个分类', 'Demo 抽样') + '</section>' +
      UI.card({ title: '通用属性模板', sub: '分类参数标准化', actions: '<button class="link-btn" type="button" data-act="attr-new">新增属性</button>', body:
        '<div class="stack-sm">' + S.categoryAttrs.map(function (a) {
          return '<div class="list-row" style="padding:var(--sp-2) 0"><div class="grow"><div class="ttl">' + esc(a.name) + ' <span class="muted body-sm">' + esc(a.unit) + '</span></div>' +
            '<div class="meta"><span>' + esc(a.type) + '</span><span>' + (a.required ? '必填' : '选填') + '</span><span>来源 ' + esc(a.source) + '</span></div></div></div>';
        }).join('') + '</div><div class="note mt-3">Ds Bit 来源的属性由参数审核链路维护，分类管理不直接改写证据。</div>' }) +
      '</div></div>';
  };
})();

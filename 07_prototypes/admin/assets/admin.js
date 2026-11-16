/* ============================================================================
   Morrishk Intelligence — Admin Prototype Controller
   依赖：../assets/proto.js（标注层）+ ui.js + data.js + views-*.js
   约束：无网络请求；不写库；所有业务数据为前端 Demo 状态。
   ========================================================================= */
(function () {
  'use strict';

  var D = window.ADMIN_DATA;
  var UI = window.UI;
  var V = window.VIEWS || {};
  var esc = UI.esc;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clone = function (v) { return JSON.parse(JSON.stringify(v)); };

  /* ================================================================ 页面元信息 */
  function pg(g, t, plan, done, mock, todo, chg) {
    return { g: g, t: t, plan: plan, done: done, mock: mock, todo: todo, chg: chg };
  }

  var PAGES = {
    dashboard: pg('工作台', '经营概览', '统一管理运营中心 · 总览', 'KPI、趋势、漏斗、渠道、四大链路与待办聚合', '全部 KPI 与趋势为 Demo 估算', 'GA4 / Search Console 真实接入', '新增业务链路与原型状态条'),
    tasks: pg('工作台', '待办任务', '工作台 · 任务视图', '跨模块待办、优先级筛选与完成状态', '任务为 Demo 快照，完成仅改变前端状态', '与真实审批 / 审计联动', '新增 P1–P3 筛选与完成任务交互'),
    notices: pg('工作台', '系统通知', '工作台 · 通知中心', '通知列表、未读筛选与标记已读', '通知为 Demo 数据', '站内信与邮件通道', '新增未读状态与批量已读'),
    kpis: pg('工作台', '关键业务指标', '工作台 · 指标口径', '10 项指标定义、来源与责任人', '指标值为 Demo；GA4 未连接', '指标取数与校准', '新增指标定义表'),
    products: pg('商城运营', '商品管理', '商城运营 · 商品域', '商品列表、搜索、库存筛选、批量选择与详情入口', '商品与库存为 Demo 抽样；价格固定 Request Quote', '真实商品库与权限审批', '新增筛选、状态 Tab 与导出'),
    brands: pg('商城运营', '品牌管理', '商城运营 · 品牌域', '品牌列表、品牌详情抽屉与新增品牌', '品牌数据为 Demo', '品牌页与 SEO 页面绑定', '新增品牌抽屉与新增表单'),
    categories: pg('商城运营', '分类管理', '商城运营 · 分类域', '分类列表、属性模板与来源标注', '分类数据为 Demo', '分类树与属性校验', '新增属性模板抽屉'),
    inventory: pg('商城运营', '库存与价格', '商城运营 · 库存域', '库存数量编辑、状态展示与交期', '库存为 Demo；价格不提供编辑', 'WMS / ERP 库存同步', '新增行内数量保存与库存筛选'),
    'product-detail': pg('商城运营', '商品详情页管理', '商城运营 · 详情页', '基础信息、参数表、SEO、版本记录与前台预览', '表单保存与发布为前端演示', '详情页真实写库与审批', '新增发布检查与预览'),
    'search-mgmt': pg('商城运营', '搜索管理', '商城运营 · 站内搜索', '热门推荐排序、搜索词、零结果词与同义词', '搜索日志为 Demo', '搜索服务与推荐算法', '新增热门位上下移与加入推荐'),
    inquiries: pg('商城运营', '询盘管理', '商城运营 · 询盘域', '询盘列表、状态流转、Spam / 重复标记与 UTM', '询盘为 Demo 数据', '询盘通知与分配规则', '新增状态处理与筛选'),
    'site-basics': pg('商城运营', '网站基础管理', '商城运营 · 站点内容', '帮助中心、信息页、新闻公告的增删改', '页面数据为 Demo', '与内容审核、站点发布联动', '新增页面编辑与语言约束'),
    marketing: pg('营销运营', '营销总览', '营销运营 · 总览', '内容、渠道、活动、排期与流向聚合', '渠道与归因为 Demo 估算', 'GA4 接入与归因校准', '新增内容流水与未来排期'),
    seo: pg('营销运营', 'SEO 管理', '营销运营 · SEO', '关键词、零结果词、同义词与页面 Meta 优化', '排名与搜索量为 Demo', 'Search Console 接入', '新增 SERP 预览与生成建议'),
    geo: pg('营销运营', 'GEO 内容管理', '营销运营 · GEO', 'GEO 就绪度、答案预览、写作约束与渠道内容', '未接入真实 AI 搜索平台', 'GEO 效果监测', '新增写作约束与就绪度检查'),
    content: pg('营销运营', '内容资产库', '营销运营 · 内容域', '内容列表、审核 / 发布双状态与来源标注', '内容为 Demo 草稿', '真实审核流与发布队列', '新增审核 / 发布分离与筛选'),
    social: pg('营销运营', '社媒账号管理', '营销运营 · 社媒', '平台卡片、连接状态、发布记录与规则', '未连接真实平台，无 Token', '平台 API 与令牌管理', '新增连接切换与发布测试'),
    calendar: pg('营销运营', '社媒发布日历', '营销运营 · 排期', '月 / 周视图、平台筛选与排期详情', '排期为 Demo，不触发真实发布', '定时任务与失败重试', '新增日历交互与状态流转'),
    video: pg('营销运营', '视频营销', '营销运营 · 视频', '制作看板、阶段推进与发布表现', '平台播放数据为 Demo', '视频转码与 YouTube 接口', '新增看板推进与新建视频'),
    campaigns: pg('营销运营', '营销活动', '营销运营 · 活动', '活动列表、暂停 / 恢复与归因指标', '活动与归因为 Demo', 'UTM 与 GA4 事件核验', '新增活动详情与暂停恢复'),
    analytics: pg('营销运营', '数据分析', '营销运营 · 分析', '7 / 30 / 90 天趋势、渠道、UTM 与数据质量', 'GA4 未连接，图表为 Demo', '真实埋点与归因', '新增时间范围切换'),
    dsbit: pg('产品知识', 'Ds Bit 数据资产', '产品知识 · 独立引擎入口', '流水线、状态语义、证据样例与稳定性原则', '数据为 Demo 快照；不含解析核心', '与 Ds Bit 服务只读对接', '新增覆盖矩阵入口与证据样例'),
    datasheets: pg('产品知识', 'Datasheet 文档管理', '产品知识 · 文档', '上传、解析状态、失败重试与版本元数据', '文档为 Demo 元数据', '真实上传与解析队列', '新增上传模拟与重试'),
    'param-review': pg('产品知识', '产品参数审核', '产品知识 · 参数审核', '待审核 / 已验证 / 已拒绝、证据抽屉与批量通过', '审核动作不写库', '审核人与知识版本联动', '新增筛选与逐条证据审核'),
    knowledge: pg('产品知识', '产品知识库', '产品知识 · 知识库', '按商品统计覆盖率与已验证参数清单', '知识快照为 Demo', '知识查询 API', '新增覆盖统计与引用规则'),
    'knowledge-versions': pg('产品知识', '知识版本管理', '产品知识 · 版本', '版本列表、差异查看与回滚演示', '版本记录为 Demo', '版本快照与回滚', '新增差异对比与回滚确认'),
    'tech-content': pg('产品知识', '技术内容生成', '产品知识 · 内容生成', '参数选择、异步生成步骤与草稿结果', '不调用真实 LLM', '生成队列与事实校验', '新增分步生成与保存草稿'),
    coverage: pg('产品知识', '旧后台覆盖矩阵', '产品知识 · 迁移核对', '43 个旧 action 的模块映射与覆盖状态', '覆盖结论为原型判断', '业务确认未覆盖项', '新增覆盖矩阵页面'),
    users: pg('系统管理', '用户管理', '系统管理 · 账号', '账号列表、MFA 状态、启停与邀请', '用户为 Demo 数据', '真实账号与 SSO', '新增邀请与状态切换'),
    roles: pg('系统管理', '角色与权限', '系统管理 · RBAC', '四类角色、权限矩阵与单元格切换', '权限变更为 Demo', '后端 RBAC 与审批', '新增可切换权限矩阵'),
    approvals: pg('系统管理', '审批流程', '系统管理 · 审批', '待审批 / 已退回 / 已通过与审批动作', '审批为 Demo 流程', '真实审批流引擎', '新增审批抽屉与通过 / 退回'),
    audit: pg('系统管理', '操作审计', '系统管理 · 审计', '只读日志、动作筛选与导出', '审计为 Demo 日志', '追加式审计存储', '新增演示动作写入审计'),
    settings: pg('系统管理', '系统设置', '系统管理 · 配置', '站点、语言、集成、通知与安全展示', '不写配置，不改服务器', '真实配置下发', '新增加固语言与集成边界'),
    account: pg('个人账号', '个人账号', '工作台 · 账号', '资料、密码、MFA 与权限摘要', '账号为 Demo 数据', '真实认证与 MFA', '新增账号页面')
  };

  /* ================================================================ 状态 */
  var STATE = {
    products: clone(D.products),
    brands: clone(D.brands),
    categories: clone(D.categories),
    categoryAttrs: clone(D.categoryAttrs),
    docs: clone(D.documents),
    params: clone(D.params),
    contents: clone(D.contents),
    social: clone(D.social),
    calendar: clone(D.calendar),
    videos: clone(D.videos),
    inquiries: clone(D.inquiries),
    users: clone(D.users),
    roles: clone(D.roles),
    permissions: clone(D.permissions),
    approvals: clone(D.approvals),
    audit: clone(D.audit),
    campaigns: clone(D.campaigns),
    searchTerms: clone(D.searchTerms),
    zeroTerms: clone(D.zeroTerms),
    synonyms: clone(D.synonyms),
    tasks: clone(D.tasks),
    notices: clone(D.notices),
    sitePages: clone(D.sitePages),
    hot: [],

    selectedProduct: 'MCF8315A',
    pdTab: 'base',
    productTab: 'all',
    contentTab: 'all',
    inquiryTab: 'all',
    seoTab: 'keywords',
    seoMpn: 'MCF8315A',
    seoTitle: '',
    seoDesc: '',
    seoSuggestions: [],
    dashMetric: 'traffic',
    analyticsRange: 30,
    calY: 2026,
    calM: 10,
    calView: 'month',
    calPlatform: '',
    searchTab: 'hot',
    siteTab: 'help',
    paramTab: 'pending',
    paramMpn: '',
    approvalTab: 'pending',
    taskTab: 'all',
    noticeTab: 'all',
    settingsTab: 'site',
    gen: { status: 'idle', step: 0, mpn: '', type: '技术文章', channel: 'SEO / GEO', tone: '工程严谨', result: null }
  };

  STATE.hot = STATE.products.slice(0, 5).map(function (p) { return p.mpn; });
  STATE.taskTotal = STATE.tasks.filter(function (t) { return !t.done; }).length;

  var TAB_STATE = {
    prodtab: 'productTab', cnttabs: 'contentTab', inqtabs: 'inquiryTab',
    seotabs: 'seoTab', searchtabs: 'searchTab', sitetabs: 'siteTab',
    paramtabs: 'paramTab', apprtabs: 'approvalTab', tasktabs: 'taskTab',
    setttabs: 'settingsTab', noticetabs: 'noticeTab', pdtabs: 'pdTab'
  };
  var TAB_FILTER_TABLE = { prodtab: true, cnttabs: true, inqtabs: true };
  var TAB_FILTER = {};
  var currentRoute = 'dashboard';
  var lastRoute = null;

  /* ================================================================ 工具 */
  function nowStr() {
    var d = new Date();
    function z(n) { return String(n).padStart(2, '0'); }
    return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + ' ' + z(d.getHours()) + ':' + z(d.getMinutes());
  }
  function token() {
    var s = '', hex = '0123456789abcdef';
    for (var i = 0; i < 20; i++) s += hex[Math.floor(Math.random() * 16)];
    return s;
  }
  function find(arr, key, val) {
    return arr.filter(function (x) { return x[key] === val; })[0];
  }
  function byMpn(mpn) { return find(STATE.products, 'mpn', mpn); }
  function splitId(id) { var p = String(id).split('|'); return { mpn: p[0], name: p[1] }; }
  function audit(action, object, result) {
    STATE.audit.unshift({
      time: nowStr(), actor: '陈立', action: action, object: object,
      result: result || 'Success', ip: '10.20.4.9'
    });
  }
  function go(route) { location.hash = '#/' + route; }
  function safe(route) { return V[route] ? route : 'dashboard'; }

  /* ================================================================ 渲染 */
  function parseHash() {
    var h = location.hash.replace(/^#\/?/, '').split('?')[0];
    return h || 'dashboard';
  }

  function statusBlock(route) {
    var p = PAGES[route] || PAGES.dashboard;
    function row(k, v) { return '<tr><td>' + k + '</td><td>' + v + '</td></tr>'; }
    return '<div class="protostatus"><div class="wrap"><table>' +
      row('对应方案', esc(p.g + ' · ' + p.plan)) +
      row('实施阶段', 'HTML 原型验证（不进入开发，不改动 Yii2 / 数据库 / 生产配置）') +
      row('已实现', esc(p.done)) +
      row('模拟', esc(p.mock)) +
      row('待开发', esc(p.todo)) +
      row('本轮修改', esc(p.chg)) +
      '</table></div></div>';
  }

  function render(route, keepScroll) {
    route = safe(route);
    var page = PAGES[route] || PAGES.dashboard;
    currentRoute = route;

    $('#view').innerHTML = V[route](STATE) + statusBlock(route);
    document.title = page.t + ' · Morrishk Intelligence';
    $('#crumbText').textContent = page.t;

    $$('#nav .nav-item').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-route') === route);
    });

    UI.mountIcons($('#view'));
    applyFilters();
    refreshAnnot();
    updateNavCounts();

    if (!keepScroll || lastRoute !== route) {
      window.scrollTo(0, 0);
      $('.app').classList.remove('nav-open');
    }
    lastRoute = route;
  }

  function rerender() { render(currentRoute, true); }

  /* ================================================================ 筛选 */
  function applyFilters() {
    var scope = $('#view [data-filter-scope]');
    if (!scope) return;
    var input = $('[data-filter-input]', scope);
    var fstock = $('[data-filter-stock]', scope);
    var fstatus = $('[data-filter-status]', scope);
    var ftype = $('[data-filter-type]', scope);
    var q = input ? input.value.trim().toLowerCase() : '';
    var stock = fstock ? fstock.value : '';
    var status = fstatus && fstatus.value ? fstatus.value : (TAB_FILTER[currentRoute] || '');
    var type = ftype ? ftype.value : '';
    var rows = $$('tbody tr', scope).filter(function (r) { return !r.hasAttribute('data-empty-row'); });

    var shown = 0;
    rows.forEach(function (r) {
      var ok = true;
      if (q && (r.getAttribute('data-search') || '').indexOf(q) < 0) ok = false;
      if (ok && stock && r.getAttribute('data-stock') !== stock) ok = false;
      if (ok && status) {
        var fs = ' ' + (r.getAttribute('data-fstatus') || '') + ' ';
        if (fs.indexOf(' ' + status + ' ') < 0) ok = false;
      }
      if (ok && type && r.getAttribute('data-ftype') !== type) ok = false;
      r.hidden = !ok;
      if (ok) shown++;
    });

    var emptyRow = $('[data-empty-row]', scope);
    if (emptyRow) emptyRow.hidden = shown !== 0;

    var counter = $('[data-filter-count]', scope);
    if (counter) {
      if (!counter.dataset.unit) {
        var m = counter.textContent.match(/[\d,]+\s*(.+)$/);
        counter.dataset.unit = m && m[1] ? m[1].trim() : '条';
      }
      counter.textContent = shown === rows.length
        ? '共 ' + rows.length + ' ' + counter.dataset.unit
        : '显示 ' + shown + ' / 共 ' + rows.length + ' ' + counter.dataset.unit;
    }
  }

  function refreshAnnot() {
    var n = $$('[data-mock]').length;
    var b = $('.proto-fab .n');
    if (b) b.textContent = n;
  }

  function updateNavCounts() {
    var openTasks = STATE.tasks.filter(function (t) { return !t.done; }).length;
    var unread = STATE.notices.filter(function (n) { return !n.read; }).length;
    var newInq = STATE.inquiries.filter(function (i) { return i.status === 'New'; }).length;
    var pendingAp = STATE.approvals.filter(function (a) { return a.status === 'Pending'; }).length;
    STATE.taskTotal = openTasks;
    var map = { tasks: openTasks, notices: unread, inquiries: newInq, approvals: pendingAp };
    Object.keys(map).forEach(function (k) {
      var el = $('[data-count="' + k + '"]');
      if (el) el.textContent = map[k];
    });
  }

  /* ================================================================ 浮层内容 */
  function drawerFoot(extra) {
    return (extra || '') + '<button class="btn btn-secondary" type="button" data-dclose>关闭</button>';
  }

  function productDrawer(mpn) {
    var p = byMpn(mpn);
    if (!p) return;
    var params = STATE.params.filter(function (x) { return x.mpn === p.mpn; });
    var ver = params.filter(function (x) { return x.status === 'Verified'; });
    var body = UI.kv([
      { k: 'MPN', v: esc(p.mpn), mono: true },
      { k: '品牌', v: esc(p.brand) },
      { k: '分类', v: esc(p.category) },
      { k: '库存', v: UI.stock(p.stock, p.qty) },
      { k: '仓库 / 交期', v: esc(p.warehouse + ' · ' + p.lead) },
      { k: '价格', v: 'Request Quote' },
      { k: 'SEO', v: UI.pill(p.seo === 'Optimized' ? 'Approved' : 'Needs Review', p.seo) },
      { k: '详情页', v: UI.pill(p.content, p.content === 'Published' ? '已发布' : '草稿') }
    ]) +
      '<div class="label">已审核参数 ' + ver.length + ' / ' + params.length + '</div>' +
      (params.length ? '<div class="stack-sm">' + params.map(function (x) {
        return '<div class="list-row" style="padding:var(--sp-2) 0"><div class="grow"><div class="ttl">' + esc(x.name) + '</div>' +
          '<div class="meta"><span>' + esc(x.value + ' ' + x.unit) + '</span><span>p.' + x.page + '</span><span>置信度 ' + Math.round(x.confidence * 100) + '%</span></div></div>' +
          '<div class="side">' + UI.pill(x.status, x.status === 'Verified' ? '已验证' : '待审核') + '</div></div>';
      }).join('') + '</div>' : UI.empty('暂无解析参数')) +
      '<div class="note">价格统一 Request Quote；参数证据与审核状态来自 Ds Bit Demo 快照。</div>';
    UI.openDrawer({
      kicker: '商品 · Demo', title: p.mpn, sub: esc(p.brand + ' · ' + p.name), body: body,
      foot: drawerFoot('<button class="btn btn-primary" type="button" data-act="product-edit" data-id="' + esc(p.mpn) + '">编辑详情页</button>')
    });
  }

  function contentDrawer(id) {
    var c = find(STATE.contents, 'id', id);
    if (!c) return;
    var body = UI.kv([
      { k: '内容 ID', v: esc(c.id), mono: true },
      { k: '类型', v: esc(c.type) },
      { k: '关联商品', v: esc(c.mpn) },
      { k: '渠道', v: esc(c.channel) },
      { k: '事实来源', v: esc(c.source) },
      { k: '生成方式', v: c.ai === 'AI Generated' ? 'AI 生成（Demo）' : '人工撰写' },
      { k: '审核状态', v: UI.pill(c.review, { Approved: '已通过', 'Pending Review': '待审核', 'Needs Revision': '待修改' }[c.review] || c.review) },
      { k: '发布状态', v: UI.pill(c.publish, c.publish === 'Published' ? '已发布' : '草稿') }
    ]) +
      '<div class="evidence"><h4>引用边界</h4><blockquote>' + esc(c.source) + '</blockquote>' +
      '<div class="meta-row"><span>仅引用 Ds Bit Verified 参数</span><span>AI 内容必须人工审核</span></div></div>' +
      '<div class="note' + (c.review === 'Approved' ? '' : ' warn') + '">' +
      (c.review === 'Approved' ? '已通过审核，可执行发布动作（Demo）。' : '未通过审核，发布按钮不可用；请先审核通过。') + '</div>';

    var foot = '';
    if (c.review !== 'Approved') {
      foot += '<button class="btn btn-secondary" type="button" data-act="content-return" data-id="' + esc(c.id) + '">退回修改</button>' +
        '<button class="btn btn-primary" type="button" data-act="content-approve" data-id="' + esc(c.id) + '">审核通过</button>';
    } else if (c.publish !== 'Published') {
      foot += '<button class="btn btn-primary" type="button" data-act="content-publish" data-id="' + esc(c.id) + '">发布</button>';
    }
    UI.openDrawer({
      kicker: '内容资产 · Demo', title: c.title, sub: esc(c.id + ' · ' + c.mpn), body: body, foot: drawerFoot(foot)
    });
  }

  function inquiryDrawer(lead) {
    var i = find(STATE.inquiries, 'lead', lead);
    if (!i) return;
    var body = UI.kv([
      { k: 'LeadNo', v: esc(i.lead), mono: true },
      { k: 'Request', v: esc(i.request), mono: true },
      { k: '商品 / 数量', v: esc(i.mpn + ' · ' + UI.num(i.qty) + ' pcs') },
      { k: '渠道', v: esc(i.channel) },
      { k: '国家', v: esc(i.country) },
      { k: '状态', v: UI.pill(i.status, i.status) },
      { k: '负责人', v: esc(i.owner) },
      { k: '提交时间', v: esc(i.created) }
    ]) +
      '<div class="label">Spam 评分</div>' + UI.progress(Math.round((1 - i.spam) * 100), i.spam > 0.5) +
      '<div class="chart-note">垃圾概率 ' + Math.round(i.spam * 100) + '% · 重复标记 ' + esc(i.duplicate) + '</div>' +
      '<div class="label">UTM</div><div class="mono-sm">' + esc(i.utm) + '</div>' +
      (i.duplicate !== '—' ? '<div class="note warn">该询盘疑似重复提交，不计入有效询盘。</div>' : '') +
      '<div class="note">询盘状态流转为 Demo；真实环境需通知、分配与审计联动。</div>';

    var foot = '';
    if (i.status === 'New') foot += '<button class="btn btn-primary" type="button" data-act="inq-assign" data-id="' + esc(i.lead) + '">分配</button>';
    if (i.status === 'Assigned') foot += '<button class="btn btn-primary" type="button" data-act="inq-quote" data-id="' + esc(i.lead) + '">标记已报价</button>';
    if (i.status === 'Quoted') foot += '<button class="btn btn-primary" type="button" data-act="inq-won" data-id="' + esc(i.lead) + '">标记成交</button>';
    if (['New', 'Assigned', 'Quoted'].indexOf(i.status) >= 0) {
      foot += '<button class="btn btn-secondary" type="button" data-act="inq-lost" data-id="' + esc(i.lead) + '">丢单</button>' +
        '<button class="btn btn-secondary" type="button" data-act="inq-spam" data-id="' + esc(i.lead) + '">标记 Spam</button>';
    }
    UI.openDrawer({ kicker: '询盘 · Demo', title: i.lead, sub: esc(i.mpn + ' · ' + i.country), body: body, foot: drawerFoot(foot) });
  }

  function eventDrawer(id) {
    var e = find(STATE.calendar, 'id', id);
    if (!e) return;
    var cn = { 'Pending Review': '待审核', Approved: '已通过', Scheduled: '已排期', Draft: '草稿', Published: '已发布', Failed: '失败' };
    var body = UI.kv([
      { k: '排期 ID', v: esc(e.id), mono: true },
      { k: '平台', v: esc(e.platform) },
      { k: '时间', v: esc(e.date + ' ' + e.time) },
      { k: '关联商品', v: esc(e.mpn) },
      { k: '负责人', v: esc(e.owner) },
      { k: '状态', v: UI.pill(e.status, cn[e.status] || e.status) }
    ]) +
      '<div class="note' + (e.status === 'Failed' ? ' warn' : '') + '">' +
      (e.status === 'Failed' ? '发布失败：任务留在日历中，可重试，不影响商品与询盘。' : '发布链路：审核 → 排期 → 到点发布 → 回写结果（Demo）。') + '</div>';

    var foot = '';
    if (e.status === 'Pending Review') foot += '<button class="btn btn-secondary" type="button" data-act="event-return" data-id="' + esc(e.id) + '">退回</button>' +
      '<button class="btn btn-primary" type="button" data-act="event-approve" data-id="' + esc(e.id) + '">审核通过</button>';
    if (e.status === 'Approved') foot += '<button class="btn btn-primary" type="button" data-act="event-schedule" data-id="' + esc(e.id) + '">加入排期</button>';
    if (e.status === 'Scheduled') foot += '<button class="btn btn-primary" type="button" data-act="event-publish" data-id="' + esc(e.id) + '">立即发布（Demo）</button>';
    if (e.status === 'Failed') foot += '<button class="btn btn-primary" type="button" data-act="event-retry" data-id="' + esc(e.id) + '">重试</button>';
    foot += '<button class="btn btn-secondary" type="button" data-act="event-delete" data-id="' + esc(e.id) + '">删除排期</button>';

    UI.openDrawer({ kicker: '社媒排期 · Demo', title: e.title, sub: esc(e.platform + ' · ' + e.date + ' ' + e.time), body: body, foot: drawerFoot(foot) });
  }

  function docDrawer(id) {
    var d = find(STATE.docs, 'id', id);
    if (!d) return;
    var params = STATE.params.filter(function (p) { return p.mpn === d.mpn; });
    var body = UI.kv([
      { k: '文档编号', v: esc(d.id), mono: true },
      { k: '文件', v: esc(d.file) },
      { k: 'MPN', v: esc(d.mpn) },
      { k: '版本', v: esc(d.version) },
      { k: '页数 / 大小', v: esc(d.pages + ' 页 · ' + d.size) },
      { k: '解析状态', v: UI.pill(d.status, { Parsed: '已解析', Parsing: '解析中', Failed: '失败' }[d.status] || d.status) },
      { k: '参数 / 问题', v: esc((d.params || 0) + ' 项 · ' + d.issues + ' 个问题') },
      { k: '上传时间', v: esc(d.uploaded) }
    ]) +
      '<div class="evidence"><h4>文档哈希（证据锚点）</h4><blockquote>' + esc(d.hash) + '</blockquote>' +
      '<div class="meta-row"><span>SHA-256 前缀（Demo）</span><span>证据 = 哈希 + 页码 + bbox + 原文</span></div></div>' +
      (params.length ? '<div class="label">关联参数</div><div class="stack-sm">' + params.slice(0, 4).map(function (p) {
        return '<div class="list-row" style="padding:var(--sp-2) 0"><div class="grow"><div class="ttl">' + esc(p.name) + '</div>' +
          '<div class="meta"><span>' + esc(p.value + ' ' + p.unit) + '</span><span>p.' + p.page + '</span></div></div>' +
          '<div class="side">' + UI.pill(p.status, p.status === 'Verified' ? '已验证' : '待审核') + '</div></div>';
      }).join('') + '</div>' : '<div class="note">该文档暂无参数记录。</div>') +
      '<div class="note">上传新版本不覆盖旧证据；解析在 Ds Bit 侧执行，本后台只轮询状态。</div>';
    var foot = d.status === 'Failed' ? '<button class="btn btn-primary" type="button" data-act="doc-retry" data-id="' + esc(d.id) + '">重试解析</button>' : '';
    foot += '<button class="btn btn-secondary" type="button" data-act="doc-upload">上传新版本</button>';
    UI.openDrawer({ kicker: 'Datasheet · Demo', title: d.file, sub: esc(d.mpn + ' · ' + d.version), body: body, foot: drawerFoot(foot) });
  }

  function paramDrawer(id) {
    var pid = splitId(id);
    var p = STATE.params.filter(function (x) { return x.mpn === pid.mpn && x.name === pid.name; })[0];
    if (!p) return;
    var body = UI.evidence(p) + UI.kv([
      { k: '商品', v: esc(p.mpn) },
      { k: '参数', v: esc(p.name) },
      { k: '值', v: esc(p.value + ' ' + p.unit) },
      { k: '页码', v: 'p.' + p.page },
      { k: '置信度', v: Math.round(p.confidence * 100) + '%' },
      { k: '状态', v: UI.pill(p.status, p.status === 'Verified' ? '已验证' : p.status === 'Rejected' ? '已拒绝' : '待审核') }
    ]) + '<div class="note warn">通过只会改变 Demo 状态；真实环境需记录审核人、时间与证据哈希。</div>';
    var foot = p.status === 'Needs Review' ?
      '<button class="btn btn-secondary" type="button" data-act="param-reject" data-id="' + esc(id) + '">拒绝</button>' +
      '<button class="btn btn-primary" type="button" data-act="param-approve" data-id="' + esc(id) + '">通过</button>' : '';
    UI.openDrawer({ kicker: '参数证据 · Ds Bit', title: p.name, sub: esc(p.mpn + ' · ' + p.value + ' ' + p.unit), body: body, foot: drawerFoot(foot) });
  }

  function brandDrawer(name) {
    var b = find(STATE.brands, 'name', name);
    if (!b) return;
    var related = STATE.products.filter(function (p) { return p.brand === name; });
    var body = UI.kv([
      { k: '品牌', v: esc(b.name) },
      { k: '主营品类', v: esc(b.category) },
      { k: '商品数', v: UI.num(b.products) },
      { k: '状态', v: UI.pill(b.status, b.status === 'Active' ? '启用' : '待审核') },
      { k: '更新时间', v: esc(b.updated) }
    ]) + '<div class="label">Demo 商品</div>' + (related.length ? '<div class="stack-sm">' + related.map(function (p) {
      return '<div class="list-row" style="padding:var(--sp-2) 0"><div class="grow"><div class="ttl">' + esc(p.mpn) + '</div>' +
        '<div class="meta"><span>' + esc(p.category) + '</span><span>' + esc(p.stock) + '</span></div></div>' +
        '<div class="side"><button class="link-btn" type="button" data-act="product-view" data-id="' + esc(p.mpn) + '">查看</button></div></div>';
    }).join('') + '</div>' : UI.empty('暂无 Demo 商品')) +
      '<div class="note">品牌是商品与 SEO / GEO 内容的共同维度（Demo）。</div>';
    UI.openDrawer({ kicker: '品牌 · Demo', title: b.name, sub: esc(b.category), body: body, foot: drawerFoot() });
  }

  function categoryDrawer(name) {
    var c = find(STATE.categories, 'name', name);
    if (!c) return;
    var body = UI.kv([
      { k: '分类', v: esc(c.name) },
      { k: '上级', v: esc(c.parent) },
      { k: '商品数', v: UI.num(c.products) },
      { k: '属性数', v: String(c.attrs) },
      { k: '状态', v: UI.pill(c.status, '启用') }
    ]) + '<div class="label">通用属性模板</div><div class="stack-sm">' + STATE.categoryAttrs.map(function (a) {
      return '<div class="list-row" style="padding:var(--sp-2) 0"><div class="grow"><div class="ttl">' + esc(a.name) + ' <span class="muted body-sm">' + esc(a.unit) + '</span></div>' +
        '<div class="meta"><span>' + esc(a.type) + '</span><span>' + (a.required ? '必填' : '选填') + '</span><span>来源 ' + esc(a.source) + '</span></div></div></div>';
    }).join('') + '</div>' +
      '<div class="note">Ds Bit 来源的属性由参数审核链路维护；分类管理不直接改写证据。</div>';
    UI.openDrawer({
      kicker: '分类 · Demo', title: c.name, sub: esc(c.parent === '—' ? '一级分类' : '上级：' + c.parent), body: body,
      foot: drawerFoot('<button class="btn btn-secondary" type="button" data-act="attr-new">新增属性</button>')
    });
  }

  function approvalDrawer(id) {
    var a = find(STATE.approvals, 'id', id);
    if (!a) return;
    var cn = { Pending: '待审批', Returned: '已退回', Approved: '已通过' };
    var body = UI.kv([
      { k: '单号', v: esc(a.id), mono: true },
      { k: '类型', v: esc(a.type) },
      { k: '申请人', v: esc(a.requester) },
      { k: '审批人', v: esc(a.reviewer) },
      { k: '状态', v: UI.pill(a.status, cn[a.status]) },
      { k: '提交时间', v: esc(a.submitted) }
    ]) + '<div class="label">审批链路</div>' +
      '<div class="timeline">' +
      '<div class="tl-item done"><span class="tl-dot"></span><div><div class="tl-title">提交申请</div><div class="tl-meta">' + esc(a.requester + ' · ' + a.submitted) + '</div><div class="tl-body">' + esc(a.title) + '</div></div></div>' +
      '<div class="tl-item ' + (a.status === 'Approved' ? 'done' : a.status === 'Returned' ? 'bad' : 'active') + '"><span class="tl-dot"></span><div><div class="tl-title">' +
      (a.status === 'Approved' ? '审批通过' : a.status === 'Returned' ? '审批退回' : '等待审批') + '</div><div class="tl-meta">' + esc(a.reviewer) + '</div></div></div>' +
      (a.status === 'Approved' ? '<div class="tl-item"><span class="tl-dot"></span><div><div class="tl-title">进入发布 / 生效</div><div class="tl-meta">系统</div></div></div>' : '') +
      '</div><div class="note">审批动作会写入审计；原型中不触发真实发布。</div>';
    var foot = a.status === 'Pending' ?
      '<button class="btn btn-secondary" type="button" data-act="approval-return" data-id="' + esc(a.id) + '">退回</button>' +
      '<button class="btn btn-primary" type="button" data-act="approval-approve" data-id="' + esc(a.id) + '">通过</button>' : '';
    UI.openDrawer({ kicker: '审批 · Demo', title: a.title, sub: esc(a.id + ' · ' + a.type), body: body, foot: drawerFoot(foot) });
  }

  function userDrawer(email) {
    var u = find(STATE.users, 'email', email);
    if (!u) return;
    var access = STATE.permissions.map(function (p) {
      var r = { '商城运营': 'commerce', '营销运营': 'marketing', '技术数据审核': 'data', '管理员': 'admin' }[u.role];
      var v = r ? p[r] : 'deny';
      return '<div class="kpi-mini"><span class="k">' + esc(p.area) + '</span><span class="v">' +
        (v === 'allow' ? '允许' : v === 'read' ? '只读' : '禁止') + '</span></div>';
    }).join('');
    var body = UI.kv([
      { k: '姓名', v: esc(u.name) },
      { k: '邮箱', v: esc(u.email) },
      { k: '角色', v: esc(u.role) },
      { k: '状态', v: UI.pill(u.status, u.status === 'Active' ? '启用' : '停用') },
      { k: 'MFA', v: UI.pill(u.mfa === 'Enabled' ? 'Enabled' : u.mfa === 'API Key' ? 'Connected' : 'Invited', u.mfa) },
      { k: '最近登录', v: esc(u.last) }
    ]) + '<div class="label">权限摘要</div><div class="stack-sm">' + access + '</div>' +
      '<div class="note warn">svc-dsbit 为服务账号，只读且不可登录后台界面。</div>';
    UI.openDrawer({
      kicker: '账号 · Demo', title: u.name, sub: esc(u.email + ' · ' + u.role), body: body,
      foot: drawerFoot('<button class="btn btn-secondary" type="button" data-act="user-toggle" data-id="' + esc(u.email) + '">' +
        (u.status === 'Active' ? '停用账号' : '启用账号') + '</button>')
    });
  }

  function videoDrawer(id) {
    var v = find(STATE.videos, 'id', id);
    if (!v) return;
    var body = UI.kv([
      { k: '视频 ID', v: esc(v.id), mono: true },
      { k: '关联商品', v: esc(v.mpn) },
      { k: '平台', v: esc(v.platform) },
      { k: '状态', v: UI.pill(v.status === 'Published' ? 'Published' : 'Draft', v.status) },
      { k: '播放', v: UI.num(v.views) },
      { k: '平均观看', v: esc(v.avg) },
      { k: '点击', v: UI.num(v.clicks) },
      { k: '询盘', v: String(v.inquiries) }
    ]) + '<div class="note">视频处理使用独立媒体任务；平台播放数据未接入，为 Demo。</div>';
    UI.openDrawer({ kicker: '视频 · Demo', title: v.title, sub: esc(v.mpn + ' · ' + v.id), body: body, foot: drawerFoot() });
  }

  function campaignDrawer(id) {
    var c = find(STATE.campaigns, 'id', id);
    if (!c) return;
    var cn = { Active: '进行中', Planned: '计划中', Completed: '已完成', Draft: '草稿', Paused: '已暂停' };
    var body = UI.kv([
      { k: '活动 ID', v: esc(c.id), mono: true },
      { k: '渠道', v: esc(c.channels) },
      { k: '周期', v: esc(c.period) },
      { k: '内容数', v: String(c.contents) },
      { k: '询盘 / 有效', v: c.leads + ' / ' + c.valid },
      { k: '状态', v: UI.pill(c.status, cn[c.status] || c.status) },
      { k: '负责人', v: esc(c.owner) }
    ]) + '<div class="label">转化</div>' +
      UI.progress(Math.round(c.valid / (c.leads || 1) * 100)) +
      '<div class="chart-note">有效率 ' + Math.round(c.valid / (c.leads || 1) * 100) + '% · 归因依赖 UTM 与 GA4（未连接）</div>' +
      '<div class="note">暂停活动不影响已发布内容与商品链路。</div>';
    UI.openDrawer({ kicker: '活动 · Demo', title: c.name, sub: esc(c.id + ' · ' + c.period), body: body, foot: drawerFoot() });
  }

  /* ================================================================ 弹窗表单 */
  function field(label, id, value, placeholder, type) {
    return '<div class="field"><label>' + label + '</label><input class="input" id="' + id + '" type="' + (type || 'text') + '" value="' +
      (value == null ? '' : esc(value)) + '"' + (placeholder ? ' placeholder="' + esc(placeholder) + '"' : '') + '></div>';
  }
  function selectField(label, id, options, selected) {
    return '<div class="field"><label>' + label + '</label><select class="select" id="' + id + '">' + options.map(function (o) {
      return '<option' + (o === selected ? ' selected' : '') + '>' + esc(o) + '</option>';
    }).join('') + '</select></div>';
  }
  function modalFoot(act, label) {
    return '<button class="btn btn-secondary" type="button" data-close>取消</button>' +
      '<button class="btn btn-primary" type="button" data-act="' + act + '">' + label + '</button>';
  }
  function demoNote(text) {
    return '<div class="note">' + (text || 'Demo 表单：提交仅改变当前页面状态，不写库、不调用接口。') + '</div>';
  }
  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function openProductNew() {
    UI.openModal({
      title: '新增商品（Demo）',
      body: '<div class="form-grid">' +
        field('MPN *', 'npMpn', '', '例如 STM32G431CBT6') +
        field('品牌 *', 'npBrand', '') +
        '<div class="field full"><label>商品名称 *</label><input class="input" id="npName"></div>' +
        selectField('分类', 'npCategory', STATE.categories.map(function (c) { return c.name; }), 'Integrated Circuits (ICs)') +
        selectField('初始库存', 'npStock', ['In Stock', 'Low Stock', 'Out of Stock', 'End of Life'], 'Out of Stock') +
        '</div>' + demoNote('新增后仅出现在当前原型列表；价格固定 Request Quote。'),
      foot: modalFoot('product-create', '新增商品')
    });
  }

  function openContentNew() {
    UI.openModal({
      title: '新建内容（Demo）',
      body: '<div class="form-grid">' +
        '<div class="field full"><label>标题 *</label><input class="input" id="ncTitle"></div>' +
        selectField('类型', 'ncType', ['技术文章', '产品对比', '选型指南', '技术问答', '新闻公告', '应用方案'], '技术文章') +
        selectField('关联商品', 'ncMpn', STATE.products.map(function (p) { return p.mpn; }), STATE.selectedProduct) +
        selectField('渠道', 'ncChannel', ['SEO', 'SEO / GEO', 'LinkedIn', 'Facebook', 'YouTube'], 'SEO') +
        '</div>' + demoNote('新内容默认进入「待审核 / 草稿」，必须人工审核后才能发布。'),
      foot: modalFoot('content-create', '创建草稿')
    });
  }

  function openEventNew() {
    UI.openModal({
      title: '新建社媒排期（Demo）',
      body: '<div class="form-grid">' +
        '<div class="field full"><label>内容标题 *</label><input class="input" id="evTitle"></div>' +
        selectField('平台', 'evPlatform', ['LinkedIn', 'Facebook', 'YouTube'], 'LinkedIn') +
        selectField('关联商品', 'evMpn', STATE.products.map(function (p) { return p.mpn; }), STATE.selectedProduct) +
        field('日期', 'evDate', '2026-11-20', '', 'date') +
        field('时间', 'evTime', '10:00', '', 'time') +
        selectField('初始状态', 'evStatus', ['Draft', 'Pending Review'], 'Draft') +
        '</div>' + demoNote('排期不会触发真实发布；失败任务可重试。'),
      foot: modalFoot('event-create', '创建排期')
    });
  }

  function openVideoNew() {
    UI.openModal({
      title: '新建视频（Demo）',
      body: '<div class="form-grid">' +
        '<div class="field full"><label>视频标题 *</label><input class="input" id="vdTitle"></div>' +
        selectField('关联商品', 'vdMpn', STATE.products.map(function (p) { return p.mpn; }), STATE.selectedProduct) +
        selectField('初始阶段', 'vdStatus', ['Idea', 'Script', 'Editing', 'Review'], 'Idea') +
        '</div>' + demoNote('视频进入制作看板；发布与转码为独立媒体任务。'),
      foot: modalFoot('video-create', '创建视频')
    });
  }

  function openCampaignNew() {
    UI.openModal({
      title: '新建营销活动（Demo）',
      body: '<div class="form-grid">' +
        '<div class="field full"><label>活动名称 *</label><input class="input" id="cpName"></div>' +
        field('渠道', 'cpChannels', 'SEO / LinkedIn', '用 / 分隔') +
        field('周期', 'cpPeriod', '2026-12-01 → 2026-12-31') +
        selectField('状态', 'cpStatus', ['Draft', 'Planned'], 'Draft') +
        selectField('负责人', 'cpOwner', ['李哲', '孙悦', '王敏'], '李哲') +
        '</div>' + demoNote('活动归因依赖 UTM 与 GA4；当前为 Demo 估算。'),
      foot: modalFoot('campaign-create', '创建活动')
    });
  }

  function openUserInvite() {
    UI.openModal({
      title: '邀请用户（Demo）',
      body: '<div class="form-grid">' +
        field('姓名 *', 'usName', '') +
        field('邮箱 *', 'usEmail', '', 'name@morrishk.net', 'email') +
        selectField('角色', 'usRole', ['商城运营', '营销运营', '技术数据审核', '管理员'], '商城运营') +
        '</div>' + demoNote('邀请仅添加 Demo 账号，不发送真实邮件。'),
      foot: modalFoot('user-create', '发送邀请')
    });
  }

  function openPageForm(kind, index) {
    var list = STATE.sitePages[kind];
    var p = index != null ? list[index] : null;
    UI.openModal({
      title: p ? '编辑页面（Demo）' : '新建页面（Demo）',
      body: '<div class="form-grid">' +
        '<div class="field full"><label>页面标题 *</label><input class="input" id="pgTitle" value="' + (p ? esc(p.title) : '') + '"></div>' +
        field('分类', 'pgCat', p ? p.category : '') +
        selectField('语言', 'pgLang', ['EN', 'DE', 'JA', 'ES', 'FR'], p ? p.lang : 'EN') +
        selectField('状态', 'pgStatus', ['Draft', 'Published', 'Scheduled'], p ? p.status : 'Draft') +
        '</div>' +
        '<div class="note warn">新站语言仅 en / de / ja / es / fr，默认 en；不新增中文或印尼语页面。</div>' +
        demoNote(),
      foot: '<button class="btn btn-secondary" type="button" data-close>取消</button>' +
        '<button class="btn btn-primary" type="button" data-act="' + (p ? 'page-update' : 'page-create') + '" data-kind="' + kind + '"' +
        (p ? ' data-index="' + index + '"' : '') + '>' + (p ? '保存' : '创建') + '</button>',
      onMount: function (body) {
        var t = body.querySelector('#pgTitle'); if (t) t.focus();
      }
    });
  }

  function openSynNew() {
    UI.openModal({
      title: '新增同义词（Demo）',
      body: '<div class="form-grid">' + field('术语 *', 'syTerm', '') + field('映射 *', 'syMapped', '') +
        selectField('类型', 'syType', ['Bilingual', 'Alias', 'Abbreviation'], 'Bilingual') + '</div>' + demoNote(),
      foot: modalFoot('syn-create', '保存映射')
    });
  }

  function openHotAdd() {
    var candidates = STATE.products.filter(function (p) { return STATE.hot.indexOf(p.mpn) < 0; });
    if (!candidates.length) { UI.toast('没有可加入的商品', 'warn'); return; }
    UI.openModal({
      title: '加入热门推荐（Demo）',
      body: '<div class="field"><label>商品</label><select class="select" id="hotMpn">' +
        candidates.map(function (p) { return '<option>' + esc(p.mpn) + '</option>'; }).join('') + '</select></div>' +
        demoNote('加入后位于推荐位末尾，可上下移动调整顺序。'),
      foot: modalFoot('hot-create', '加入推荐')
    });
  }

  function openBrandNew() {
    UI.openModal({
      title: '新增品牌（Demo）',
      body: '<div class="form-grid">' + field('品牌名称 *', 'brName', '') + field('主营品类', 'brCategory', '') + '</div>' + demoNote(),
      foot: modalFoot('brand-create', '新增品牌')
    });
  }

  function openAttrNew() {
    UI.openModal({
      title: '新增分类属性（Demo）',
      body: '<div class="form-grid">' + field('属性名称 *', 'atName', '') + field('单位', 'atUnit', '—') +
        selectField('类型', 'atType', ['range', 'enum', 'boolean', 'text'], 'range') +
        selectField('是否必填', 'atRequired', ['必填', '选填'], '选填') +
        selectField('来源', 'atSource', ['Ds Bit', 'Manual'], 'Manual') + '</div>' + demoNote(),
      foot: modalFoot('attr-create', '新增属性')
    });
  }

  function openDocUpload() {
    UI.openModal({
      title: '上传 Datasheet（Demo）',
      body: '<div class="stack-sm">' +
        '<label class="file-drop" for="docFile"><span class="file-ico">' + UI.icon('upload') + '</span>' +
        '<strong>选择 PDF 文件</strong><span class="body-sm muted">仅演示文件名与状态，不读取、不上传文件内容</span>' +
        '<input type="file" id="docFile" accept=".pdf" class="sr-only"></label>' +
        '<div class="field"><label>关联 MPN</label><select class="select" id="docMpn">' +
        STATE.products.map(function (p) { return '<option>' + esc(p.mpn) + '</option>'; }).join('') + '</select></div>' +
        '<div class="mono-sm" id="docFileName">未选择文件</div></div>' +
        demoNote('上传只新增一条 Demo 文档记录，不解析真实 PDF。'),
      foot: modalFoot('doc-create', '开始解析'),
      onMount: function (body) {
        var fi = body.querySelector('#docFile');
        var label = body.querySelector('#docFileName');
        if (fi) fi.addEventListener('change', function () {
          label.textContent = fi.files && fi.files[0] ? fi.files[0].name : '未选择文件';
        });
      }
    });
  }

  function openVersionView(id) {
    var versions = window.ADMIN_VERSIONS || [];
    var v = versions.filter(function (x) { return x.id === id; })[0];
    if (!v) return;
    var body = UI.kv([
      { k: '版本', v: esc(v.id), mono: true },
      { k: '范围', v: esc(v.scope) },
      { k: '操作人', v: esc(v.author) },
      { k: '时间', v: esc(v.time) },
      { k: '状态', v: UI.pill(v.status, v.status === 'Active' ? '生效中' : v.status === 'Draft' ? '草稿' : '已归档') }
    ]) + '<div class="label">变更说明</div><div class="note">' + esc(v.note) + '</div>' +
      '<div class="label">差异（Demo）</div><div class="diff">' +
      '<div class="diff-hd">' + esc(v.scope) + '</div>' +
      '<div class="diff-line"><span class="diff-del">- ' + esc(v.change) + '（上一版本）</span></div>' +
      '<div class="diff-line"><span class="diff-add">+ ' + esc(v.change) + '（' + esc(v.id) + '）</span></div>' +
      '</div><div class="note">回滚会复制旧版本为新草稿，不删除历史证据。</div>';
    UI.openModal({ title: '版本差异 · ' + v.id, body: body, foot: '<button class="btn btn-secondary" type="button" data-close>关闭</button>' });
  }

  function openVersionCompare() {
    var versions = window.ADMIN_VERSIONS || [];
    var draft = versions.filter(function (v) { return v.status === 'Draft'; })[0] || versions[0];
    var active = versions.filter(function (v) { return v.status === 'Active'; })[0] || versions[1] || versions[0];
    var body = versionCompareBody(draft, active);
    UI.openModal({ title: '版本对比（Demo）', body: body, wide: true, foot: '<button class="btn btn-secondary" type="button" data-close>关闭</button>' });
  }

  function versionCompareBody(a, b) {
    if (!a || !b) return UI.empty();
    return '<div class="grid-2"><div><div class="label">对比版本 A</div>' + UI.kv([
      { k: '版本', v: esc(a.id), mono: true }, { k: '范围', v: esc(a.scope) }, { k: '状态', v: esc(a.status) }
    ]) + '</div><div><div class="label">对比版本 B</div>' + UI.kv([
      { k: '版本', v: esc(b.id), mono: true }, { k: '范围', v: esc(b.scope) }, { k: '状态', v: esc(b.status) }
    ]) + '</div></div>' +
      '<div class="diff mt-3"><div class="diff-hd">' + esc(a.scope) + '</div>' +
      '<div class="diff-line"><span class="diff-del">- ' + esc(b.change) + '</span></div>' +
      '<div class="diff-line"><span class="diff-add">+ ' + esc(a.change) + '</span></div></div>' +
      '<div class="note warn mt-3">差异为 Demo 展示；真实环境需按参数级 diff 与证据哈希核对。</div>';
  }

  /* ================================================================ 全局搜索 / 帮助 */
  function openGlobalSearch(q) {
    q = (q || '').trim();
    if (!q) { UI.toast('请输入搜索词', 'warn'); return; }
    var lq = q.toLowerCase();
    var groups = [];
    var prods = STATE.products.filter(function (p) {
      return (p.mpn + ' ' + p.brand + ' ' + p.name).toLowerCase().indexOf(lq) >= 0;
    }).slice(0, 5);
    if (prods.length) groups.push({ t: '商品', rows: prods.map(function (p) {
      return '<button class="search-row" type="button" data-act="global-product" data-id="' + esc(p.mpn) + '">' +
        '<span class="mono-sm">' + esc(p.mpn) + '</span><span>' + esc(p.brand + ' · ' + p.name) + '</span></button>';
    }) });
    var cons = STATE.contents.filter(function (c) { return (c.title + ' ' + c.mpn + ' ' + c.type).toLowerCase().indexOf(lq) >= 0; }).slice(0, 5);
    if (cons.length) groups.push({ t: '内容', rows: cons.map(function (c) {
      return '<button class="search-row" type="button" data-act="global-content" data-id="' + esc(c.id) + '"><span class="mono-sm">' + esc(c.id) + '</span><span>' + esc(c.title) + '</span></button>';
    }) });
    var inqs = STATE.inquiries.filter(function (i) { return (i.lead + ' ' + i.mpn + ' ' + i.country).toLowerCase().indexOf(lq) >= 0; }).slice(0, 5);
    if (inqs.length) groups.push({ t: '询盘', rows: inqs.map(function (i) {
      return '<button class="search-row" type="button" data-act="global-inquiry" data-id="' + esc(i.lead) + '"><span class="mono-sm">' + esc(i.lead) + '</span><span>' + esc(i.mpn + ' · ' + i.country) + '</span></button>';
    }) });
    var docs = STATE.docs.filter(function (d) { return (d.file + ' ' + d.mpn + ' ' + d.id).toLowerCase().indexOf(lq) >= 0; }).slice(0, 4);
    if (docs.length) groups.push({ t: 'Datasheet', rows: docs.map(function (d) {
      return '<button class="search-row" type="button" data-act="global-doc" data-id="' + esc(d.id) + '"><span class="mono-sm">' + esc(d.id) + '</span><span>' + esc(d.file) + '</span></button>';
    }) });
    var users = STATE.users.filter(function (u) { return (u.name + ' ' + u.email).toLowerCase().indexOf(lq) >= 0; }).slice(0, 4);
    if (users.length) groups.push({ t: '用户', rows: users.map(function (u) {
      return '<button class="search-row" type="button" data-act="global-user" data-id="' + esc(u.email) + '"><span class="mono-sm">' + esc(u.name) + '</span><span>' + esc(u.email) + '</span></button>';
    }) });

    var body = groups.length ? '<div class="stack-sm">' + groups.map(function (g) {
      return '<div><div class="label">' + g.t + ' · ' + g.rows.length + '</div><div class="stack-sm">' + g.rows.join('') + '</div></div>';
    }).join('') + '</div>' : UI.empty('没有匹配结果（Demo 数据范围：商品 / 内容 / 询盘 / 文档 / 用户）');
    UI.openModal({
      title: '全局搜索 · “' + q + '”', body: body, wide: true,
      foot: '<button class="btn btn-secondary" type="button" data-close>关闭</button>',
      onMount: function (b) { b.querySelectorAll('.search-row').forEach(function (x) { x.setAttribute('data-mock', '搜索结果来自 Demo 数据'); }); }
    });
  }

  function openHelp() {
    UI.openModal({
      title: '原型说明',
      body: '<div class="stack-sm">' +
        '<p class="body-sm">本原型为 <strong>Morrishk Intelligence 统一管理运营中心</strong> 的 HTML 交互样机：单页应用 + Hash 路由，覆盖 5 个导航分组、32 个页面视图。所有数据为前端 Demo，不写库、不调用真实接口。</p>' +
        '<div class="kv">' +
        '<div><span class="k">业务中心</span><span class="v">商城运营 / 营销运营</span></div>' +
        '<div><span class="k">知识层</span><span class="v">Ds Bit（独立引擎，只读入口）</span></div>' +
        '<div><span class="k">角色</span><span class="v">4 类角色权限隔离</span></div>' +
        '<div><span class="k">语言</span><span class="v">后台中文；新站 en / de / ja / es / fr</span></div>' +
        '</div>' +
        '<div class="label">快捷键</div>' +
        '<div class="kv"><div><span class="k">?</span><span class="v">切换原型标注</span></div>' +
        '<div><span class="k">Ctrl / ⌘ + K</span><span class="v">聚焦全局搜索</span></div>' +
        '<div><span class="k">Esc</span><span class="v">关闭浮层</span></div>' +
        '<div><span class="k">/</span><span class="v">聚焦全局搜索</span></div></div>' +
        '<div class="note warn">边界：不修改 Yii2 / 数据库 / 生产配置；不连接社媒与 GA4；不复制 Ds Bit 解析核心；价格统一 Request Quote；未审核参数不进入前台。</div>' +
        '<div class="row" style="gap:var(--sp-3)"><a class="btn btn-secondary btn-sm" href="#/coverage">旧后台覆盖矩阵</a>' +
        '<a class="btn btn-secondary btn-sm" href="#/dsbit">Ds Bit 数据资产</a></div>' +
        '</div>',
      foot: '<button class="btn btn-primary" type="button" data-close>知道了</button>'
    });
  }

  /* ================================================================ 导出 */
  function csvCell(v) {
    var s = String(v == null ? '' : v);
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function exportDemo(name) {
    var rows = [];
    name = name || '数据';
    if (name === '商品列表' || name === '库存清单') {
      rows.push(['MPN', '品牌', '名称', '分类', '库存状态', '数量', '仓库', '交期', '价格', '详情页', 'SEO']);
      STATE.products.forEach(function (p) {
        rows.push([p.mpn, p.brand, p.name, p.category, p.stock, p.qty, p.warehouse, p.lead, 'Request Quote', p.content, p.seo]);
      });
    } else if (name === '内容资产') {
      rows.push(['ID', '标题', '类型', 'MPN', '渠道', '审核', '发布', '来源', '更新时间']);
      STATE.contents.forEach(function (c) { rows.push([c.id, c.title, c.type, c.mpn, c.channel, c.review, c.publish, c.source, c.updated]); });
    } else if (name === '询盘列表') {
      rows.push(['LeadNo', 'Request', 'MPN', '数量', '渠道', '国家', '状态', 'Spam', '重复', '负责人', '时间']);
      STATE.inquiries.forEach(function (i) { rows.push([i.lead, i.request, i.mpn, i.qty, i.channel, i.country, i.status, i.spam, i.duplicate, i.owner, i.created]); });
    } else if (name === 'Datasheet 列表') {
      rows.push(['ID', '文件', 'MPN', '版本', '页数', '大小', '哈希', '状态', '参数', '问题', '上传时间']);
      STATE.docs.forEach(function (d) { rows.push([d.id, d.file, d.mpn, d.version, d.pages, d.size, d.hash, d.status, d.params, d.issues, d.uploaded]); });
    } else if (name === '站点页面') {
      rows.push(['类型', '标题', '分类', '语言', '状态', '更新时间']);
      ['help', 'info', 'news'].forEach(function (k) {
        STATE.sitePages[k].forEach(function (p) { rows.push([k, p.title, p.category, p.lang, p.status, p.updated]); });
      });
    } else if (name === 'SEO 报告') {
      rows.push(['搜索词', '类型', '曝光', 'CTR', '平均排名', '结果']);
      STATE.searchTerms.forEach(function (t) { rows.push([t.term, t.type, t.impressions, t.ctr, t.position, t.result]); });
    } else if (name === '知识库') {
      rows.push(['MPN', '参数', '值', '单位', '页码', '置信度', '状态', '更新时间']);
      STATE.params.forEach(function (p) { rows.push([p.mpn, p.name, p.value, p.unit, p.page, p.confidence, p.status, p.updated]); });
    } else if (name === '审计日志') {
      rows.push(['时间', '操作人', '动作', '对象', '结果', 'IP']);
      STATE.audit.forEach(function (a) { rows.push([a.time, a.actor, a.action, a.object, a.result, a.ip]); });
    } else if (name === '营销总览' || name === '分析报告') {
      rows.push(['渠道', '曝光', '点击', 'CTR', '询盘', '有效%']);
      D.overview.channels.forEach(function (c) { rows.push([c.k, c.impressions, c.clicks, c.ctr, c.leads, c.valid]); });
    } else {
      rows.push(['指标', '值', '说明']);
      D.overview.kpis.forEach(function (k) { rows.push([k.k, k.v, k.note]); });
    }
    var csv = rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n');
    var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'morrishk-demo-' + name + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    UI.toast('已生成 Demo CSV：' + name + '（不含真实业务数据）');
  }

  /* ================================================================ 内容生成 */
  function genResult(g) {
    var p = byMpn(g.mpn) || STATE.products[0];
    var params = STATE.params.filter(function (x) { return x.mpn === p.mpn && x.status === 'Verified'; });
    var first = params[0];
    return {
      title: p.mpn + ' ' + (g.type === '产品对比' ? '对比选型要点' : g.type === '技术问答' ? '常见技术问答' : '技术要点') + '（草稿）',
      excerpt: '本文围绕 ' + p.mpn + '（' + p.brand + '）整理已审核参数' +
        (first ? '：' + first.name + ' ' + first.value + ' ' + first.unit + '（p.' + first.page + '）' : '') +
        '。内容以工程视角说明适用条件与边界，未审核参数不写入正文。目标渠道：' + g.channel + '。'
    };
  }
  function runGen() {
    var g = STATE.gen;
    var mpn = val('genMpn');
    if (mpn) g.mpn = mpn;
    g.type = val('genType') || g.type;
    g.channel = val('genChannel') || g.channel;
    g.tone = val('genTone') || g.tone;
    g.status = 'running';
    g.step = 0;
    g.result = null;
    rerender();
    function tick(i) {
      setTimeout(function () {
        if (g.status !== 'running') return;
        g.step = i;
        if (i >= 3) {
          g.status = 'done';
          g.result = genResult(g);
          if (currentRoute === 'tech-content') rerender();
          UI.toast('生成完成：草稿待人工审核', 'warn');
        } else {
          if (currentRoute === 'tech-content') rerender();
          tick(i + 1);
        }
      }, 560);
    }
    tick(1);
  }

  /* ================================================================ 动作 */
  var ACTIONS = {
    'dash-metric': function (el, e) {
      var btn = (e && e.target.closest('[data-metric]')) || el.querySelector('[data-metric]');
      if (!btn) return;
      STATE.dashMetric = btn.getAttribute('data-metric');
      rerender();
    },
    'refresh-demo': function () { rerender(); UI.toast('已刷新 Demo 视图（数据未变化）'); },
    'refresh-demo-route': function () { rerender(); },
    'export-demo': function (el) { exportDemo(el.getAttribute('data-name')); },
    'toast': function (el) { UI.toast(el.getAttribute('data-msg') || 'Demo 操作'); },

    'product-view': function (el) { productDrawer(el.getAttribute('data-id')); },
    'product-edit': function (el) {
      UI.closeAll();
      STATE.selectedProduct = el.getAttribute('data-id');
      STATE.pdTab = 'base';
      go('product-detail');
    },
    'product-new': function () { openProductNew(); },
    'product-create': function () {
      var mpn = val('npMpn'), brand = val('npBrand'), name = val('npName');
      if (!mpn || !brand || !name) { UI.toast('请填写 MPN、品牌与名称', 'err'); return; }
      if (byMpn(mpn)) { UI.toast('MPN 已存在（Demo）', 'err'); return; }
      STATE.products.unshift({
        mpn: mpn, brand: brand, name: name, category: val('npCategory') || 'Integrated Circuits (ICs)',
        stock: val('npStock') || 'Out of Stock', qty: 0, warehouse: 'HK', lead: '—', datasheet: '—',
        seo: 'Missing Meta', content: 'Draft', updated: nowStr(), price: 'Request Quote'
      });
      audit('新增商品', mpn, 'Success');
      UI.closeModal();
      rerender();
      UI.toast('已新增商品 ' + mpn + '（Demo）');
    },
    'products-refresh': function () { rerender(); UI.toast('商品列表已刷新（Demo）'); },

    'pd-select': function (el) { STATE.selectedProduct = el.value; STATE.pdTab = 'base'; rerender(); },
    'pd-save': function () { UI.toast('已保存草稿（Demo，不写库）'); },
    'pd-publish': function () {
      var p = byMpn(STATE.selectedProduct);
      UI.confirm({
        title: '提交发布',
        body: '商品 <strong>' + esc(p.mpn) + '</strong> 将提交发布。发布检查：基础字段完整、' +
          STATE.params.filter(function (x) { return x.mpn === p.mpn && x.status === 'Verified'; }).length + ' 项已验证参数可引用、未审核参数不会进入前台。',
        ok: '提交发布',
        onOk: function () {
          p.content = 'Published';
          p.updated = nowStr();
          audit('发布商品详情页', p.mpn, 'Approved');
          rerender();
          UI.toast('已提交发布（Demo）：' + p.mpn);
        }
      });
    },
    'demo-rfq': function () {
      UI.openModal({
        title: 'Request a Quote（Demo）',
        body: '<div class="form-grid">' + field('公司名称', 'rfqCompany', '') + field('邮箱', 'rfqEmail', '', 'buyer@example.com', 'email') +
          field('数量', 'rfqQty', '1000', '', 'number') + field('目标交期', 'rfqLead', '') +
          '<div class="field full"><label>需求说明</label><textarea class="textarea" id="rfqMsg" placeholder="应用场景 / 替代要求 / 认证要求"></textarea></div></div>' +
          '<div class="note">前台询价表单为 Demo；提交不会发送邮件，也不产生真实询盘。</div>',
        foot: modalFoot('rfq-submit', '提交询价')
      });
    },
    'rfq-submit': function () {
      if (!val('rfqEmail')) { UI.toast('请填写邮箱', 'err'); return; }
      UI.closeModal();
      UI.toast('Demo 询价已模拟提交（未发送、未入库）');
    },

    'seo-select': function (el) {
      STATE.seoMpn = el.value;
      STATE.seoTitle = '';
      STATE.seoDesc = '';
      STATE.seoSuggestions = [];
      rerender();
    },
    'seo-suggest': function () {
      var p = byMpn(STATE.seoMpn) || STATE.products[0];
      var ver = STATE.params.filter(function (x) { return x.mpn === p.mpn && x.status === 'Verified'; });
      var pending = STATE.params.filter(function (x) { return x.mpn === p.mpn && x.status !== 'Verified'; }).length;
      var list = [
        '标题建议：' + p.mpn + ' ' + p.name.slice(0, 38) + ' | Request Quote',
        ver.length ? '可引用已审核参数：' + ver.slice(0, 2).map(function (x) { return x.name + ' ' + x.value + ' ' + x.unit; }).join('；') + '。'
          : '该商品暂无已审核参数，标题与描述不得写入具体参数值。',
        pending ? '有 ' + pending + ' 项参数待审核，不得写入 Meta 或正文。' : '参数审核已完成，可全量引用 Verified 参数。',
        '描述建议控制在 155 字符内，包含封装、库存状态与 Request Quote。'
      ];
      STATE.seoSuggestions = list;
      var box = document.getElementById('seoSuggestions');
      if (box) box.innerHTML = '<div class="stack-sm">' + list.map(function (s) { return '<div class="note">' + esc(s) + '</div>'; }).join('') + '</div>';
      UI.toast('已生成 ' + list.length + ' 条优化建议（Demo）');
    },
    'seo-save': function () {
      var t = document.getElementById('seoTitleInput');
      var d = document.getElementById('seoDescInput');
      if (t) STATE.seoTitle = t.value;
      if (d) STATE.seoDesc = d.value;
      audit('保存 SEO 元信息', STATE.seoMpn, 'Success');
      UI.toast('SEO 元信息已保存（Demo）');
    },
    'seo-term': function (el) {
      var term = el.getAttribute('data-term');
      var p = STATE.products.filter(function (x) {
        return (x.mpn.toLowerCase() === term.toLowerCase() || x.name.toLowerCase().indexOf(term.toLowerCase()) >= 0);
      })[0];
      if (!p) { UI.toast('该搜索词暂无对应 Demo 商品，可创建内容', 'warn'); return; }
      STATE.seoMpn = p.mpn;
      STATE.seoTitle = '';
      STATE.seoDesc = '';
      STATE.seoTab = 'optimize';
      rerender();
      UI.toast('已定位到 ' + p.mpn + ' 的页面优化');
    },
    'zero-content': function (el) {
      var term = el.getAttribute('data-term');
      UI.openDrawer({
        kicker: '零结果词 · Demo', title: term,
        sub: '站内搜索无结果，建议创建内容或补充分类',
        body: '<div class="stack-sm"><div class="kpi-mini"><span class="k">建议动作</span><span class="v">创建技术内容</span></div>' +
          '<div class="note">先确认该型号是否在售；若不在售，内容中说明替代型号与边界，避免承诺库存。</div>' +
          '<div class="note warn">内容必须经过审核后才能发布；不得虚构参数与价格。</div></div>',
        foot: drawerFoot('<a class="btn btn-primary" href="#/tech-content">去生成内容</a>')
      });
    },
    'syn-new': function () { openSynNew(); },
    'syn-create': function () {
      var t = val('syTerm'), m = val('syMapped');
      if (!t || !m) { UI.toast('请填写术语与映射', 'err'); return; }
      STATE.synonyms.push({ term: t, mapped: m, type: val('syType') || 'Bilingual' });
      UI.closeModal(); rerender(); UI.toast('已新增同义词（Demo）');
    },

    'geo-gen': function (el) {
      var mpn = el.getAttribute('data-id');
      var p = byMpn(mpn);
      var ver = STATE.params.filter(function (x) { return x.mpn === mpn && x.status === 'Verified'; });
      UI.openDrawer({
        kicker: 'GEO 草稿 · Demo', title: '生成 GEO 内容草稿', sub: esc(mpn + ' · ' + p.brand),
        body: '<div class="qbox"><div class="q">' + esc(mpn) + ' 的关键参数是什么？</div>' +
          '<div class="a">' + (ver.length ? '根据 Ds Bit 已审核参数：' + ver.slice(0, 3).map(function (x) {
            return esc(x.name + ' ' + x.value + ' ' + x.unit + '（p.' + x.page + '）');
          }).join('；') + '。具体选型需结合实际工况。' : '该商品暂无可引用的已审核参数，暂不生成具体结论。') + '</div>' +
          '<div class="src">' + UI.pill(ver.length ? 'Verified' : 'Needs Review', ver.length ? '证据可引用' : '待补证据') + '<span>未审核参数不进入答案</span></div></div>' +
          '<div class="note warn">GEO 内容需人工审核；不承诺库存、价格与交期。</div>',
        foot: drawerFoot('<button class="btn btn-primary" type="button" data-act="geo-save" data-id="' + esc(mpn) + '">保存为内容草稿</button>')
      });
    },
    'geo-save': function (el) {
      var mpn = el.getAttribute('data-id');
      var p = byMpn(mpn);
      var id = 'CNT-' + (202 + STATE.contents.length);
      STATE.contents.unshift({
        id: id, title: p.mpn + ' 关键参数与选型边界（GEO 草稿）', type: '应用方案', mpn: mpn,
        source: 'Ds Bit 已审核参数', ai: 'AI Generated', review: 'Pending Review', publish: 'Draft',
        updated: nowStr(), channel: 'SEO / GEO'
      });
      UI.closeAll(); rerender();
      UI.toast('已保存 GEO 草稿 ' + id + '（待人工审核）', 'warn');
    },

    'content-view': function (el) { contentDrawer(el.getAttribute('data-id')); },
    'content-new': function () { openContentNew(); },
    'content-create': function () {
      var title = val('ncTitle');
      if (!title) { UI.toast('请填写标题', 'err'); return; }
      var id = 'CNT-' + (202 + STATE.contents.length);
      STATE.contents.unshift({
        id: id, title: title, type: val('ncType'), mpn: val('ncMpn'), source: '人工撰写',
        ai: 'Human', review: 'Pending Review', publish: 'Draft', updated: nowStr(), channel: val('ncChannel')
      });
      UI.closeModal(); rerender();
      UI.toast('已创建内容草稿 ' + id + '（待审核）', 'warn');
    },
    'content-approve': function (el) {
      var c = find(STATE.contents, 'id', el.getAttribute('data-id'));
      c.review = 'Approved';
      audit('审核内容', c.id + ' / ' + c.title, 'Approved');
      UI.closeAll(); rerender();
      UI.toast('内容已通过审核（Demo），可执行发布');
    },
    'content-return': function (el) {
      var c = find(STATE.contents, 'id', el.getAttribute('data-id'));
      c.review = 'Needs Revision';
      audit('退回内容', c.id + ' / ' + c.title, 'Returned');
      UI.closeAll(); rerender();
      UI.toast('内容已退回修改（Demo）', 'warn');
    },
    'content-publish': function (el) {
      var c = find(STATE.contents, 'id', el.getAttribute('data-id'));
      if (!c) return;
      if (c.review !== 'Approved') { UI.toast('未通过审核，不能发布', 'err'); return; }
      c.publish = 'Published';
      c.updated = nowStr();
      audit('发布内容', c.id + ' / ' + c.title, 'Success');
      UI.closeAll(); rerender();
      UI.toast('内容已发布（Demo）：' + c.id);
    },

    'cal-prev': function () {
      STATE.calM--; if (STATE.calM < 0) { STATE.calM = 11; STATE.calY--; }
      rerender();
    },
    'cal-next': function () {
      STATE.calM++; if (STATE.calM > 11) { STATE.calM = 0; STATE.calY++; }
      rerender();
    },
    'cal-view': function (el) { STATE.calView = el.getAttribute('data-view'); rerender(); },
    'cal-platform': function (el) { STATE.calPlatform = el.value; rerender(); },
    'event-view': function (el) { eventDrawer(el.getAttribute('data-id')); },
    'event-new': function () { openEventNew(); },
    'event-create': function () {
      var title = val('evTitle');
      if (!title) { UI.toast('请填写内容标题', 'err'); return; }
      var id = 'EV-' + String(STATE.calendar.length + 1).padStart(2, '0');
      STATE.calendar.push({
        id: id, title: title, platform: val('evPlatform'), date: val('evDate') || '2026-11-20',
        time: val('evTime') || '10:00', status: val('evStatus') || 'Draft', owner: '陈立', mpn: val('evMpn')
      });
      UI.closeModal(); rerender();
      UI.toast('已创建排期 ' + id + '（Demo）');
    },
    'event-approve': function (el) {
      var e = find(STATE.calendar, 'id', el.getAttribute('data-id'));
      e.status = 'Approved';
      audit('审核社媒排期', e.id + ' / ' + e.title, 'Approved');
      UI.closeAll(); rerender(); UI.toast('排期已通过审核，可加入排期');
    },
    'event-return': function (el) {
      var e = find(STATE.calendar, 'id', el.getAttribute('data-id'));
      e.status = 'Draft';
      audit('退回社媒排期', e.id + ' / ' + e.title, 'Returned');
      UI.closeAll(); rerender(); UI.toast('排期已退回（Demo）', 'warn');
    },
    'event-schedule': function (el) {
      var e = find(STATE.calendar, 'id', el.getAttribute('data-id'));
      e.status = 'Scheduled';
      UI.closeAll(); rerender(); UI.toast('已加入发布排期（Demo）');
    },
    'event-publish': function (el) {
      var e = find(STATE.calendar, 'id', el.getAttribute('data-id'));
      e.status = 'Published';
      audit('发布社媒内容', e.id + ' / ' + e.title, 'Success');
      UI.closeAll(); rerender(); UI.toast('已模拟发布（Demo，未调用平台接口）');
    },
    'event-retry': function (el) {
      var e = find(STATE.calendar, 'id', el.getAttribute('data-id'));
      e.status = 'Scheduled';
      UI.closeAll(); rerender(); UI.toast('失败任务已重新入队（Demo）');
    },
    'event-delete': function (el) {
      var id = el.getAttribute('data-id');
      var e = find(STATE.calendar, 'id', id);
      if (!e) return;
      UI.confirm({
        title: '删除排期', body: '确认删除排期 <strong>' + esc(e.title) + '</strong>？Demo 中仅从当前列表移除。',
        ok: '删除', onOk: function () {
          STATE.calendar = STATE.calendar.filter(function (x) { return x.id !== id; });
          UI.closeAll(); rerender(); UI.toast('排期已删除（Demo）');
        }
      });
    },

    'video-advance': function (el) {
      var v = find(STATE.videos, 'id', el.getAttribute('data-id'));
      var stages = ['Idea', 'Script', 'Editing', 'Review', 'Published'];
      var i = stages.indexOf(v.status);
      if (i < 0 || i >= stages.length - 1) return;
      v.status = stages[i + 1];
      v.updated = nowStr();
      if (v.status === 'Published') audit('发布视频', v.id + ' / ' + v.title, 'Success');
      rerender();
      UI.toast('视频已推进到「' + v.status + '」（Demo）');
    },
    'video-view': function (el) { videoDrawer(el.getAttribute('data-id')); },
    'video-new': function () { openVideoNew(); },
    'video-create': function () {
      var title = val('vdTitle');
      if (!title) { UI.toast('请填写视频标题', 'err'); return; }
      var id = 'VID-' + (32 + STATE.videos.length);
      STATE.videos.unshift({
        id: id, title: title, mpn: val('vdMpn'), status: val('vdStatus') || 'Idea', platform: 'YouTube',
        views: 0, avg: '—', clicks: 0, inquiries: 0, updated: nowStr(), cover: val('vdMpn')
      });
      UI.closeModal(); rerender(); UI.toast('已创建视频 ' + id + '（Demo）');
    },

    'campaign-view': function (el) { campaignDrawer(el.getAttribute('data-id')); },
    'social-toggle': function (el) {
      var p = find(STATE.social, 'id', el.getAttribute('data-id'));
      var on = p.connected !== 'Disconnected (Demo)';
      p.connected = on ? 'Disconnected (Demo)' : 'Connected (Demo)';
      audit(on ? '断开社媒（Demo）' : '连接社媒（Demo）', p.name, 'Success');
      rerender();
      UI.toast(p.name + (on ? ' 已断开（Demo）' : ' 已连接（Demo）'));
    },
    'social-test': function (el) {
      var p = find(STATE.social, 'id', el.getAttribute('data-id'));
      UI.toast('已向 ' + p.name + ' 发送测试发布（Demo，未调用真实接口）');
    },
    'campaign-toggle': function (el) {
      var c = find(STATE.campaigns, 'id', el.getAttribute('data-id'));
      c.status = c.status === 'Active' ? 'Paused' : 'Active';
      audit(c.status === 'Paused' ? '暂停活动' : '恢复活动', c.id + ' / ' + c.name, 'Success');
      rerender();
      UI.toast('活动已' + (c.status === 'Paused' ? '暂停' : '恢复') + '（Demo）');
    },
    'campaign-new': function () { openCampaignNew(); },
    'campaign-create': function () {
      var name = val('cpName');
      if (!name) { UI.toast('请填写活动名称', 'err'); return; }
      var id = 'CMP-' + (13 + STATE.campaigns.length);
      STATE.campaigns.unshift({
        id: id, name: name, channels: val('cpChannels'), period: val('cpPeriod'),
        status: val('cpStatus') || 'Draft', contents: 0, leads: 0, valid: 0, owner: val('cpOwner')
      });
      UI.closeModal(); rerender(); UI.toast('已创建活动 ' + id + '（Demo）');
    },

    'an-range': function (el) { STATE.analyticsRange = parseInt(el.getAttribute('data-range'), 10) || 30; rerender(); },

    'inquiry-view': function (el) { inquiryDrawer(el.getAttribute('data-id')); },
    'inq-assign': function (el) {
      var i = find(STATE.inquiries, 'lead', el.getAttribute('data-id'));
      i.status = 'Assigned'; i.owner = '王敏';
      audit('分配询盘', i.lead, 'Success');
      UI.closeAll(); rerender(); UI.toast('询盘已分配给王敏（Demo）');
    },
    'inq-quote': function (el) {
      var i = find(STATE.inquiries, 'lead', el.getAttribute('data-id'));
      i.status = 'Quoted';
      audit('提交报价', i.lead, 'Success');
      UI.closeAll(); rerender(); UI.toast('已标记为已报价（Demo，不生成真实报价单）');
    },
    'inq-won': function (el) {
      var i = find(STATE.inquiries, 'lead', el.getAttribute('data-id'));
      i.status = 'Won';
      audit('标记成交', i.lead, 'Approved');
      UI.closeAll(); rerender(); UI.toast('询盘已标记成交（Demo）');
    },
    'inq-lost': function (el) {
      var i = find(STATE.inquiries, 'lead', el.getAttribute('data-id'));
      i.status = 'Lost';
      audit('标记丢单', i.lead, 'Returned');
      UI.closeAll(); rerender(); UI.toast('询盘已标记丢单（Demo）', 'warn');
    },
    'inq-spam': function (el) {
      var i = find(STATE.inquiries, 'lead', el.getAttribute('data-id'));
      i.status = 'Spam'; i.spam = Math.max(i.spam, 0.92);
      audit('标记垃圾询盘', i.lead, 'Success');
      UI.closeAll(); rerender(); UI.toast('已标记 Spam，不计入有效询盘（Demo）', 'warn');
    },

    'hot-up': function (el) {
      var id = el.getAttribute('data-id');
      var i = STATE.hot.indexOf(id);
      if (i > 0) { STATE.hot[i] = STATE.hot[i - 1]; STATE.hot[i - 1] = id; }
      rerender();
    },
    'hot-down': function (el) {
      var id = el.getAttribute('data-id');
      var i = STATE.hot.indexOf(id);
      if (i >= 0 && i < STATE.hot.length - 1) { STATE.hot[i] = STATE.hot[i + 1]; STATE.hot[i + 1] = id; }
      rerender();
    },
    'hot-remove': function (el) {
      var id = el.getAttribute('data-id');
      STATE.hot = STATE.hot.filter(function (x) { return x !== id; });
      rerender(); UI.toast('已从推荐位移除 ' + id + '（Demo）');
    },
    'hot-add': function () { openHotAdd(); },
    'hot-create': function () {
      var mpn = val('hotMpn');
      if (mpn && STATE.hot.indexOf(mpn) < 0) STATE.hot.push(mpn);
      UI.closeModal(); rerender(); UI.toast('已加入推荐位（Demo）');
    },

    'page-edit': function (el) { openPageForm(el.getAttribute('data-kind'), parseInt(el.getAttribute('data-index'), 10)); },
    'page-new': function (el) { openPageForm(el.getAttribute('data-kind'), null); },
    'page-create': function (el) {
      var kind = el.getAttribute('data-kind');
      var title = val('pgTitle');
      if (!title) { UI.toast('请填写页面标题', 'err'); return; }
      STATE.sitePages[kind].push({
        title: title, category: val('pgCat') || '未分类', lang: val('pgLang') || 'EN',
        status: val('pgStatus') || 'Draft', updated: nowStr().slice(0, 10)
      });
      UI.closeModal(); rerender(); UI.toast('已创建页面（Demo）');
    },
    'page-update': function (el) {
      var kind = el.getAttribute('data-kind');
      var i = parseInt(el.getAttribute('data-index'), 10);
      var p = STATE.sitePages[kind][i];
      p.title = val('pgTitle') || p.title;
      p.category = val('pgCat') || p.category;
      p.lang = val('pgLang') || p.lang;
      p.status = val('pgStatus') || p.status;
      p.updated = nowStr().slice(0, 10);
      audit('编辑站点页面', kind + ' / ' + p.title, 'Success');
      UI.closeModal(); rerender(); UI.toast('页面已保存（Demo）');
    },
    'page-delete': function (el) {
      var kind = el.getAttribute('data-kind');
      var i = parseInt(el.getAttribute('data-index'), 10);
      var p = STATE.sitePages[kind][i];
      if (!p) return;
      UI.confirm({
        title: '删除页面', body: '确认删除 <strong>' + esc(p.title) + '</strong>？Demo 中仅从当前列表移除。',
        ok: '删除', onOk: function () {
          STATE.sitePages[kind].splice(i, 1);
          rerender(); UI.toast('页面已删除（Demo）');
        }
      });
    },

    'inventory-save': function (el) {
      var mpn = el.getAttribute('data-id');
      var p = byMpn(mpn);
      var input = $('[data-qty="' + mpn + '"]');
      var n = input ? parseInt(input.value, 10) : NaN;
      if (isNaN(n) || n < 0) { UI.toast('请输入有效数量', 'err'); return; }
      p.qty = n;
      p.updated = nowStr();
      audit('更新库存', mpn + ' → ' + n, 'Success');
      rerender();
      UI.toast(mpn + ' 数量已更新为 ' + UI.num(n) + '（Demo，库存状态需人工确认）');
    },

    'brand-view': function (el) { brandDrawer(el.getAttribute('data-id')); },
    'brand-new': function () { openBrandNew(); },
    'brand-create': function () {
      var name = val('brName');
      if (!name) { UI.toast('请填写品牌名称', 'err'); return; }
      if (find(STATE.brands, 'name', name)) { UI.toast('品牌已存在', 'err'); return; }
      STATE.brands.unshift({ name: name, products: 0, category: val('brCategory') || '—', status: 'Review', updated: nowStr().slice(0, 10) });
      UI.closeModal(); rerender(); UI.toast('已新增品牌 ' + name + '（待审核，Demo）', 'warn');
    },
    'category-attrs': function (el) { categoryDrawer(el.getAttribute('data-id')); },
    'attr-new': function () { openAttrNew(); },
    'attr-create': function () {
      var name = val('atName');
      if (!name) { UI.toast('请填写属性名称', 'err'); return; }
      STATE.categoryAttrs.push({
        name: name, unit: val('atUnit') || '—', type: val('atType') || 'range',
        required: val('atRequired') === '必填', source: val('atSource') || 'Manual'
      });
      UI.closeModal(); rerender(); UI.toast('已新增分类属性（Demo）');
    },

    'doc-view': function (el) { docDrawer(el.getAttribute('data-id')); },
    'doc-retry': function (el) {
      var d = find(STATE.docs, 'id', el.getAttribute('data-id'));
      d.status = 'Parsing';
      audit('重试 Datasheet 解析', d.id, 'Success');
      UI.closeAll(); rerender(); UI.toast('已重新提交解析（Demo）', 'warn');
      setTimeout(function () {
        d.status = 'Parsed';
        d.params = d.params || 0;
        if (currentRoute === 'datasheets') rerender();
        UI.toast('解析完成（Demo）：' + d.id);
      }, 1800);
    },
    'doc-upload': function () { openDocUpload(); },
    'doc-create': function () {
      var f = document.getElementById('docFile');
      var name = f && f.files && f.files[0] ? f.files[0].name : 'New_Datasheet_Demo.pdf';
      var id = 'DS-' + (1043 + STATE.docs.length);
      var mpn = val('docMpn') || STATE.selectedProduct;
      STATE.docs.unshift({
        id: id, file: name, mpn: mpn, pages: 0, size: '—', hash: token(), version: 'v1.0',
        status: 'Parsing', params: 0, issues: 0, uploaded: nowStr()
      });
      UI.closeModal(); rerender(); UI.toast('已上传 ' + name + '，进入解析队列（Demo）', 'warn');
    },

    'param-filter': function (el) { STATE.paramMpn = el.value; rerender(); },
    'param-view': function (el) { paramDrawer(el.getAttribute('data-id')); },
    'param-approve': function (el) {
      var pid = splitId(el.getAttribute('data-id'));
      var p = STATE.params.filter(function (x) { return x.mpn === pid.mpn && x.name === pid.name; })[0];
      p.status = 'Verified';
      audit('审核参数', p.mpn + ' / ' + p.name, 'Approved');
      UI.closeAll(); rerender(); UI.toast('参数已通过（Demo）', 'warn');
    },
    'param-reject': function (el) {
      var pid = splitId(el.getAttribute('data-id'));
      var p = STATE.params.filter(function (x) { return x.mpn === pid.mpn && x.name === pid.name; })[0];
      p.status = 'Rejected';
      audit('拒绝参数', p.mpn + ' / ' + p.name, 'Returned');
      UI.closeAll(); rerender(); UI.toast('参数已拒绝，保留证据（Demo）', 'warn');
    },
    'param-batch': function () {
      var selected = $$('.rowpchk:checked').map(function (c) { return c.value; });
      var pending = STATE.params.filter(function (p) { return p.status === 'Needs Review'; });
      var targets = selected.length ? pending.filter(function (p) { return selected.indexOf(p.mpn + '|' + p.name) >= 0; }) : pending;
      if (!targets.length) { UI.toast('没有可批量通过的参数', 'warn'); return; }
      UI.confirm({
        title: '批量通过参数',
        body: '将把 <strong>' + targets.length + '</strong> 项参数标记为已验证。真实环境需逐条核对证据与置信度。',
        ok: '批量通过',
        onOk: function () {
          targets.forEach(function (p) { p.status = 'Verified'; });
          audit('批量审核参数', targets.length + ' 项', 'Approved');
          rerender(); UI.toast('已批量通过 ' + targets.length + ' 项（Demo）', 'warn');
        }
      });
    },

    'version-view': function (el) { openVersionView(el.getAttribute('data-id')); },
    'version-compare': function () { openVersionCompare(); },
    'version-rollback': function (el) {
      var id = el.getAttribute('data-id');
      UI.confirm({
        title: '回滚版本', body: '将以 <strong>' + esc(id) + '</strong> 为基准生成新草稿；历史证据不删除。',
        ok: '生成回滚草稿',
        onOk: function () { UI.toast('已生成回滚草稿（Demo）', 'warn'); }
      });
    },

    'gen-select': function (el) {
      STATE.gen.mpn = el.value;
      STATE.gen.status = 'idle';
      STATE.gen.step = 0;
      STATE.gen.result = null;
      rerender();
    },
    'gen-run': function () { runGen(); },
    'gen-save': function () {
      var g = STATE.gen;
      if (!g.result) return;
      var id = 'CNT-' + (202 + STATE.contents.length);
      STATE.contents.unshift({
        id: id, title: g.result.title, type: g.type, mpn: g.mpn || STATE.selectedProduct,
        source: 'Ds Bit 已审核参数', ai: 'AI Generated', review: 'Pending Review', publish: 'Draft',
        updated: nowStr(), channel: g.channel
      });
      audit('保存生成内容草稿', id, 'Success');
      UI.toast('已保存到内容资产库：' + id + '（待审核）', 'warn');
    },

    'user-view': function (el) { userDrawer(el.getAttribute('data-id')); },
    'user-toggle': function (el) {
      var u = find(STATE.users, 'email', el.getAttribute('data-id'));
      u.status = u.status === 'Active' ? 'Disabled' : 'Active';
      audit(u.status === 'Disabled' ? '停用账号' : '启用账号', u.email, 'Success');
      UI.closeAll(); rerender(); UI.toast('账号已' + (u.status === 'Active' ? '启用' : '停用') + '（Demo）');
    },
    'user-invite': function () { openUserInvite(); },
    'user-create': function () {
      var name = val('usName'), email = val('usEmail');
      if (!name || !email) { UI.toast('请填写姓名与邮箱', 'err'); return; }
      STATE.users.push({ name: name, email: email, role: val('usRole'), status: 'Active', last: '—', mfa: 'Invited' });
      UI.closeModal(); rerender(); UI.toast('已添加 Demo 账号 ' + email + '（未发送邮件）');
    },

    'perm-cycle': function (el) {
      var area = el.getAttribute('data-area');
      var role = el.getAttribute('data-role');
      var p = find(STATE.permissions, 'area', area);
      var order = ['allow', 'read', 'deny'];
      var next = order[(order.indexOf(p[role]) + 1) % order.length];
      p[role] = next;
      el.className = 'perm ' + next;
      el.textContent = next === 'allow' ? '允许' : next === 'read' ? '只读' : '禁止';
    },
    'perm-reset': function () {
      STATE.permissions = clone(D.permissions);
      rerender(); UI.toast('权限矩阵已还原（Demo）');
    },
    'perm-save': function () {
      audit('保存权限矩阵', '4 角色 / ' + STATE.permissions.length + ' 业务域', 'Approved');
      UI.toast('权限矩阵已保存到 Demo 状态');
    },

    'approval-view': function (el) { approvalDrawer(el.getAttribute('data-id')); },
    'approval-approve': function (el) {
      var a = find(STATE.approvals, 'id', el.getAttribute('data-id'));
      a.status = 'Approved';
      audit('审批通过', a.id + ' / ' + a.title, 'Approved');
      UI.closeAll(); rerender(); UI.toast('审批已通过（Demo）');
    },
    'approval-return': function (el) {
      var a = find(STATE.approvals, 'id', el.getAttribute('data-id'));
      a.status = 'Returned';
      audit('审批退回', a.id + ' / ' + a.title, 'Returned');
      UI.closeAll(); rerender(); UI.toast('审批已退回（Demo）', 'warn');
    },

    'settings-save': function () { UI.toast('设置已保存到 Demo 状态（未写入真实配置）'); },

    'task-done': function (el) {
      var t = find(STATE.tasks, 'id', el.getAttribute('data-id'));
      if (!t) return;
      t.done = !t.done;
      rerender();
      UI.toast(t.done ? '任务已完成（Demo）' : '任务已恢复', t.done ? null : 'warn');
    },
    'tasks-refresh': function () { rerender(); UI.toast('任务已刷新（Demo）'); },

    'notice-view': function (el) {
      var n = find(STATE.notices, 'id', el.getAttribute('data-id'));
      if (!n) return;
      UI.openDrawer({
        kicker: '通知 · Demo', title: n.title, sub: esc(n.type + ' · ' + n.time),
        body: '<p class="body-sm">' + esc(n.body) + '</p>' + '<div class="note">通知只做提醒，不替代任务、审批与审计。</div>',
        foot: drawerFoot(n.read ? '' : '<button class="btn btn-secondary" type="button" data-act="notice-read" data-id="' + esc(n.id) + '">标记已读</button>')
      });
    },
    'notice-read': function (el) {
      var n = find(STATE.notices, 'id', el.getAttribute('data-id'));
      n.read = true;
      UI.closeAll(); rerender(); UI.toast('已标记已读');
    },
    'notice-all': function () {
      STATE.notices.forEach(function (n) { n.read = true; });
      rerender(); UI.toast('全部通知已标记已读');
    },

    'account-save': function () { UI.toast('个人资料已保存（Demo）'); },
    'account-pass': function () { UI.toast('密码更新为 Demo 演示，未修改真实凭据', 'warn'); },

    'global-product': function (el) {
      UI.closeAll();
      STATE.selectedProduct = el.getAttribute('data-id');
      go('product-detail');
    },
    'global-content': function (el) { UI.closeAll(); contentDrawer(el.getAttribute('data-id')); },
    'global-inquiry': function (el) { UI.closeAll(); inquiryDrawer(el.getAttribute('data-id')); },
    'global-doc': function (el) { UI.closeAll(); docDrawer(el.getAttribute('data-id')); },
    'global-user': function (el) { UI.closeAll(); userDrawer(el.getAttribute('data-id')); }
  };

  /* ================================================================ 事件绑定 */
  function handleAction(act, el, e) {
    var fn = ACTIONS[act];
    if (fn) {
      if (e) e.preventDefault();
      fn(el, e);
    }
  }

  function bindEvents() {
    document.addEventListener('click', function (e) {
      var close = e.target.closest('[data-close]');
      if (close) { UI.closeModal(); return; }
      var dclose = e.target.closest('[data-dclose]');
      if (dclose) { UI.closeDrawer(); return; }

      var tab = e.target.closest('[data-tab]');
      if (tab && tab.closest('[data-tabs]')) {
        var group = tab.closest('[data-tabs]').getAttribute('data-tabs');
        var key = TAB_STATE[group];
        if (key) STATE[key] = tab.getAttribute('data-tab');
        if (TAB_FILTER_TABLE[group]) TAB_FILTER[currentRoute] = tab.getAttribute('data-status-filter') || '';
        e.preventDefault();
        rerender();
        return;
      }

      var el = e.target.closest('[data-act]');
      if (!el) return;
      if (el.tagName === 'SELECT' || el.tagName === 'INPUT') return;
      handleAction(el.getAttribute('data-act'), el, e);
    });

    document.addEventListener('change', function (e) {
      var el = e.target.closest('[data-act]');
      if (el) { handleAction(el.getAttribute('data-act'), el, e); return; }
      if (e.target.closest('[data-filter-scope]')) applyFilters();
    });

    document.addEventListener('input', function (e) {
      if (e.target.closest('[data-filter-scope]')) { applyFilters(); return; }
      var t = e.target;
      if (t.hasAttribute && t.hasAttribute('data-count-target')) {
        var target = document.getElementById(t.getAttribute('data-count-target'));
        if (target) {
          var max = t.getAttribute('data-count-target') === 'seoTitleCount' ? 60 : 155;
          target.textContent = t.value.length + '/' + max;
        }
      }
    });

    document.addEventListener('keydown', function (e) {
      var tag = document.activeElement.tagName;
      if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) {
        e.preventDefault();
        var s = $('#globalSearch'); if (s) s.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        var s2 = $('#globalSearch'); if (s2) s2.focus();
      }
    });

    window.addEventListener('hashchange', function () {
      UI.closeAll();
      render(parseHash(), false);
    });

    var gs = $('#globalSearch');
    if (gs) {
      gs.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          openGlobalSearch(gs.value);
        }
      });
    }

    var helpBtn = $('#helpBtn');
    if (helpBtn) helpBtn.addEventListener('click', openHelp);

    var menuBtn = $('#menuBtn');
    if (menuBtn) menuBtn.addEventListener('click', function () { $('.app').classList.toggle('nav-open'); });

    var userBtn = $('#userBtn');
    var userMenu = $('#userMenu');
    if (userBtn && userMenu) {
      userBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = userMenu.classList.toggle('open');
        userBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      document.addEventListener('click', function (e) {
        if (!e.target.closest('.user-wrap')) {
          userMenu.classList.remove('open');
          userBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    document.addEventListener('click', function () {
      /* 保留 proto.js 的标注按钮行为；此监听仅用于收起移动导航 */
      if (!document.body.classList.contains('nav-open')) return;
    });

    $$('#nav a').forEach(function (a) {
      a.addEventListener('click', function () { $('.app').classList.remove('nav-open'); });
    });
  }

  /* ================================================================ 初始化 */
  function init() {
    UI.initOverlays();
    UI.mountIcons(document);
    var route = parseHash();
    if (!V[route]) {
      route = 'dashboard';
      if (location.hash !== '#/dashboard') history.replaceState(null, '', '#/dashboard');
    }
    render(route, false);
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

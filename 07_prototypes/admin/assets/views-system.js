/* ============================================================================
   Views — 系统管理 / 个人账号
   ========================================================================= */
(function () {
  'use strict';
  var D = window.ADMIN_DATA, UI = window.UI;
  var V = window.VIEWS = window.VIEWS || {};
  var esc = UI.esc;

  var ROLE_ICON = { commerce: 'box', marketing: 'megaphone', data: 'shield-check', admin: 'key' };
  var ROLE_CN = { commerce: '商城运营', marketing: '营销运营', data: '技术数据审核', admin: '管理员' };

  /* ================================================================ 用户管理 */
  V.users = function (S) {
    var rows = S.users.map(function (u, i) {
      return '<tr data-search="' + esc((u.name + ' ' + u.email + ' ' + u.role).toLowerCase()) + '">' +
        '<td><div class="row" style="gap:var(--sp-3)"><span class="avatar-sm">' + esc(u.name.slice(0, 1)) + '</span>' +
        '<div><span class="cell-main">' + esc(u.name) + '</span><span class="cell-sub">' + esc(u.email) + '</span></div></div></td>' +
        '<td>' + esc(u.role) + '</td>' +
        '<td>' + UI.pill(u.mfa === 'Enabled' ? 'Enabled' : u.mfa === 'API Key' ? 'Connected' : 'Invited', u.mfa === 'Enabled' ? 'MFA 已启用' : u.mfa === 'API Key' ? 'API Key' : '待激活') + '</td>' +
        '<td>' + UI.pill(u.status, u.status === 'Active' ? '启用' : '停用') + '</td>' +
        '<td class="nowrap"><span class="cell-sub">' + esc(u.last) + '</span></td>' +
        '<td class="actions"><div class="row-actions"><button class="link-btn" type="button" data-act="user-view" data-id="' + esc(u.email) + '">详情</button>' +
        '<button class="link-btn" type="button" data-act="user-toggle" data-id="' + esc(u.email) + '">' + (u.status === 'Active' ? '停用' : '启用') + '</button></div></td></tr>';
    }).join('');

    return '<div class="adm-page" data-filter-scope>' +
      UI.pageHead('用户管理', '后台账号与角色绑定；Ds Bit 集成账号只读，不允许登录后台界面。',
        UI.demoChip('用户为 Demo 数据') +
        '<button class="btn btn-primary btn-sm" type="button" data-act="user-invite"><span data-icon="plus"></span>邀请用户</button>') +
      UI.toolbar('<input class="input" type="search" style="width:300px" placeholder="搜索姓名 / 邮箱 / 角色" data-filter-input aria-label="搜索用户">',
        '<span class="toolbar-label" data-filter-count>共 ' + S.users.length + ' 个账号</span>') +
      '<section class="card">' + UI.tbl(['用户', '角色', 'MFA', '状态', '最近登录', ''], rows) +
      UI.foot('共 ' + S.users.length + ' 个账号', 'svc-dsbit 为服务账号') + '</section>' +
      '<div class="grid-2">' +
      UI.card({ title: '账号策略', body: '<div class="stack-sm">' +
        '<div class="kpi-mini"><span class="k">管理员</span><span class="v">1 人</span></div>' +
        '<div class="kpi-mini"><span class="k">业务账号</span><span class="v">5 人</span></div>' +
        '<div class="kpi-mini"><span class="k">只读 / 服务</span><span class="v">2 个</span></div>' +
        '<div class="note mt-3">账号停用后仍保留审计记录；删除为演示动作，实际策略待确认。</div></div>' }) +
      UI.card({ title: '权限提示', body: '<p class="body-sm muted">商城运营不可修改 Ds Bit 原始证据；营销运营不可修改库存与价格；技术数据审核不可发布社媒内容。</p>' +
        '<a class="btn btn-secondary btn-sm mt-3" href="#/roles">查看角色矩阵</a>' }) +
      '</div></div>';
  };

  /* ================================================================ 角色与权限 */
  V.roles = function (S) {
    var cards = D.roles.map(function (r) {
      return '<div class="role-card"><div class="rh"><span class="ri">' + UI.icon(ROLE_ICON[r.id] || 'key') + '</span>' +
        '<span class="rn">' + esc(r.name) + '</span></div><div class="rd">' + esc(r.desc) + '</div>' +
        '<div class="ui-pend">' + UI.pill('Active', '已启用') + '<span class="muted body-sm">' + S.users.filter(function (u) { return u.role === r.name; }).length + ' 人</span></div></div>';
    }).join('');

    var rows = S.permissions.map(function (p) {
      function cell(role) {
        var v = p[role];
        var label = v === 'allow' ? '允许' : v === 'read' ? '只读' : '禁止';
        return '<td><button class="perm ' + v + '" type="button" data-act="perm-cycle" data-area="' + esc(p.area) + '" data-role="' + role + '">' + label + '</button></td>';
      }
      return '<tr><td><span class="cell-main">' + esc(p.area) + '</span></td>' +
        cell('commerce') + cell('marketing') + cell('data') + cell('admin') + '</tr>';
    }).join('');

    var matrix = '<div class="matrix-wrap"><table class="matrix"><thead><tr><th>业务域</th><th>商城运营</th><th>营销运营</th><th>技术数据审核</th><th>管理员</th></tr></thead><tbody>' + rows + '</tbody></table></div>';

    return '<div class="adm-page">' +
      UI.pageHead('角色与权限', '四类角色按业务域隔离；点击权限格可切换“允许 / 只读 / 禁止”（Demo）。',
        UI.demoChip('权限变更为 Demo') +
        '<button class="btn btn-secondary btn-sm" type="button" data-act="perm-reset">还原</button>' +
        '<button class="btn btn-primary btn-sm" type="button" data-act="perm-save">保存权限</button>') +
      '<div class="grid-4">' + cards + '</div>' +
      UI.card({ title: '权限矩阵', sub: '最小权限原则：默认禁止，按需开放', body: matrix }) +
      '<div class="grid-3">' +
      UI.card({ title: '隔离规则 1', sub: '商品与库存', body: '<p class="body-sm muted">营销运营对库存与报价为禁止，避免营销文案影响交易承诺。</p>' }) +
      UI.card({ title: '隔离规则 2', sub: '证据与参数', body: '<p class="body-sm muted">商城运营对参数审核为禁止；只能读取已审核证据，不能改写。</p>' }) +
      UI.card({ title: '隔离规则 3', sub: '发布与审计', body: '<p class="body-sm muted">社媒发布仅营销运营与管理员可用；操作审计仅管理员可见。</p>' }) +
      '</div>' +
      '<div class="note warn"><strong>权限边界：</strong>原型中的切换只改变当前页面状态；真实权限需后端 RBAC 与审批流配合，并记录审计。</div>' +
      '</div>';
  };

  /* ================================================================ 审批流程 */
  V.approvals = function (S) {
    var pending = S.approvals.filter(function (a) { return a.status === 'Pending'; });
    var returned = S.approvals.filter(function (a) { return a.status === 'Returned'; });
    var approved = S.approvals.filter(function (a) { return a.status === 'Approved'; });
    var tab = S.approvalTab || 'pending';
    var list = tab === 'pending' ? pending : tab === 'returned' ? returned : approved;

    var rows = list.map(function (a) {
      return '<tr data-search="' + esc((a.id + ' ' + a.title + ' ' + a.requester).toLowerCase()) + '">' +
        '<td><span class="mono-sm">' + esc(a.id) + '</span></td>' +
        '<td><button class="link-btn" type="button" data-act="approval-view" data-id="' + esc(a.id) + '">' + esc(a.title) + '</button>' +
        '<span class="cell-sub">' + esc(a.type) + '</span></td>' +
        '<td>' + esc(a.requester) + '</td><td>' + esc(a.reviewer) + '</td>' +
        '<td>' + UI.pill(a.status, { Pending: '待审批', Returned: '已退回', Approved: '已通过' }[a.status]) + '</td>' +
        '<td class="nowrap"><span class="cell-sub">' + esc(a.submitted) + '</span></td>' +
        '<td class="actions"><div class="row-actions"><button class="link-btn" type="button" data-act="approval-view" data-id="' + esc(a.id) + '">审阅</button>' +
        (a.status === 'Pending' ? '<button class="link-btn" type="button" data-act="approval-approve" data-id="' + esc(a.id) + '">通过</button>' +
          '<button class="link-btn" type="button" data-act="approval-return" data-id="' + esc(a.id) + '">退回</button>' : '') + '</div></td></tr>';
    }).join('') || '<tr><td colspan="7">' + UI.empty('该分类下没有审批单') + '</td></tr>';

    return '<div class="adm-page">' +
      UI.pageHead('审批流程', '商品发布、内容发布、社媒排期与参数变更统一进入审批；审批动作写入审计。',
        UI.demoChip('审批为 Demo 流程')) +
      UI.tabs([
        { id: 'pending', t: '待审批', count: pending.length },
        { id: 'returned', t: '已退回', count: returned.length },
        { id: 'approved', t: '已通过', count: approved.length }
      ], tab, 'apprtabs') +
      '<section class="card">' + UI.tbl(['单号', '事项', '申请人', '审批人', '状态', '提交时间', ''], rows) +
      UI.foot('共 ' + list.length + ' 条', 'Demo 抽样') + '</section>' +
      '<div class="grid-3">' +
      UI.card({ title: '商品发布', body: '<p class="body-sm muted">需商城运营负责人审批；参数未验证时不可提交。</p>' }) +
      UI.card({ title: '内容与排期', body: '<p class="body-sm muted">内容审核通过后，排期仍需营销负责人确认。</p>' }) +
      UI.card({ title: '参数变更', body: '<p class="body-sm muted">参数降级或拒绝需技术数据审核确认，并生成知识版本。</p>' }) +
      '</div></div>';
  };

  /* ================================================================ 操作审计 */
  V.audit = function (S) {
    var actions = [];
    S.audit.forEach(function (a) { if (actions.indexOf(a.action) < 0) actions.push(a.action); });
    var rows = S.audit.map(function (a) {
      return '<tr data-search="' + esc((a.actor + ' ' + a.action + ' ' + a.object + ' ' + a.ip).toLowerCase()) + '" data-fstatus="' + esc(a.action) + '">' +
        '<td class="nowrap"><span class="mono-sm">' + esc(a.time) + '</span></td><td>' + esc(a.actor) + '</td>' +
        '<td>' + esc(a.action) + '</td><td>' + esc(a.object) + '</td>' +
        '<td>' + UI.pill(a.result === 'Success' || a.result === 'Approved' ? 'Success' : a.result === 'Returned' ? 'Returned' : 'Pending', { Success: '成功', Approved: '已通过', Pending: '待处理', Returned: '已退回' }[a.result] || a.result) + '</td>' +
        '<td><span class="mono-sm">' + esc(a.ip) + '</span></td></tr>';
    }).join('');

    return '<div class="adm-page" data-filter-scope>' +
      UI.pageHead('操作审计', '只读、不可篡改的操作记录；覆盖人工动作与 Ds Bit 服务写入。',
        UI.demoChip('审计为 Demo 日志') +
        '<button class="btn btn-secondary btn-sm" type="button" data-act="export-demo" data-name="审计日志">导出</button>') +
      UI.toolbar('<input class="input" type="search" style="width:280px" placeholder="搜索操作人 / 对象 / IP" data-filter-input aria-label="搜索审计">' +
        '<select class="select" style="width:170px" data-filter-status aria-label="动作筛选"><option value="">全部动作</option>' +
        actions.map(function (a) { return '<option>' + esc(a) + '</option>'; }).join('') + '</select>',
        '<span class="toolbar-label" data-filter-count>共 ' + S.audit.length + ' 条</span>') +
      '<section class="card">' + UI.tbl(['时间', '操作人', '动作', '对象', '结果', 'IP'], rows) +
      UI.foot('共 ' + S.audit.length + ' 条（Demo 抽样）', '审计记录不可编辑、不可删除') + '</section>' +
      '<div class="note">审计写入为追加式；后台不提供编辑与删除入口。真实环境需保留至少 180 天。</div>' +
      '</div>';
  };

  /* ================================================================ 系统设置 */
  V.settings = function (S) {
    var tab = S.settingsTab || 'site';
    var langs = [
      { code: 'en', name: 'English', on: true, def: true },
      { code: 'de', name: 'Deutsch', on: true },
      { code: 'ja', name: '日本語', on: true },
      { code: 'es', name: 'Español', on: true },
      { code: 'fr', name: 'Français', on: true }
    ];

    var sitePanel = '<section class="card"><div class="card-bd"><div class="form-grid">' +
      '<div class="field"><label>站点名称</label><input class="input" value="Morris Electronic HK"></div>' +
      '<div class="field"><label>默认语言</label><select class="select"><option>English (en)</option></select></div>' +
      '<div class="field"><label>询盘接收邮箱</label><input class="input" value="sales@morrishk.net"></div>' +
      '<div class="field"><label>时区</label><input class="input" value="Asia/Hong_Kong (UTC+8)" readonly></div>' +
      '<div class="field full"><label>站点简介</label><textarea class="textarea">Electronic components distributor supporting global sourcing with datasheet-backed specifications.</textarea></div>' +
      '</div><div class="form-actions"><button class="btn btn-secondary btn-sm" type="button" data-act="toast" data-msg="Demo：未连接站点配置">取消</button>' +
      '<button class="btn btn-primary btn-sm" type="button" data-act="settings-save">保存设置</button></div></div></section>';

    var langPanel = '<section class="card"><div class="card-hd"><div><h2>前台语言</h2><div class="sub">新站固定 5 种语言，默认 en</div></div>' + UI.demoChip('语言配置为 Demo') + '</div>' +
      '<div class="card-bd"><div class="stack-sm">' + langs.map(function (l) {
        return '<div class="list-row" style="padding:var(--sp-3) 0"><div class="grow"><div class="ttl">' + l.name + ' <span class="muted body-sm">' + l.code + '</span></div>' +
          '<div class="meta">' + (l.def ? '默认语言 · 不可关闭' : '可启用 / 停用（Demo）') + '</div></div>' +
          '<div class="side"><label class="inline-check"><input type="checkbox"' + (l.on ? ' checked' : '') + (l.def ? ' disabled' : '') + '>启用</label></div></div>';
      }).join('') + '</div>' +
      '<div class="note warn mt-3">语言约束：不新增中文或印尼语页面；旧站 messages 目录保持不动，新站仅使用 en / de / ja / es / fr。</div>' +
      '<div class="form-actions"><button class="btn btn-primary btn-sm" type="button" data-act="settings-save">保存语言</button></div></div></section>';

    var integrationPanel = '<div class="grid-2">' +
      '<section class="card"><div class="card-hd"><div><h2>Ds Bit 引擎</h2><div class="sub">独立系统 · 只读状态</div></div>' + UI.pill('Connected', '运行中') + '</div>' +
      '<div class="card-bd"><div class="kv">' +
      '<div><span class="k">接口地址</span><span class="v mono">dsbit.internal:8080</span></div>' +
      '<div><span class="k">认证</span><span class="v">服务账号（只读）</span></div>' +
      '<div><span class="k">轮询频率</span><span class="v">60s</span></div>' +
      '<div><span class="k">写入权限</span><span class="v">禁止</span></div>' +
      '</div><div class="note mt-3">后台只读取解析结果与证据，不复制解析核心代码。</div></div></section>' +
      '<section class="card"><div class="card-hd"><div><h2>分析工具</h2><div class="sub">GA4 / Search Console</div></div>' + UI.pill('Not Connected', '未连接') + '</div>' +
      '<div class="card-bd"><div class="kv">' +
      '<div><span class="k">GA4</span><span class="v">未配置</span></div>' +
      '<div><span class="k">Search Console</span><span class="v">未配置</span></div>' +
      '<div><span class="k">归因</span><span class="v">Demo 估算</span></div>' +
      '<div><span class="k">数据保留</span><span class="v">—</span></div>' +
      '</div><button class="btn btn-secondary btn-sm mt-3" type="button" data-act="toast" data-msg="Demo：OAuth 未接入">连接 GA4</button></div></section>' +
      '<section class="card"><div class="card-hd"><div><h2>社媒平台</h2><div class="sub">LinkedIn / Facebook / YouTube</div></div>' + UI.pill('Demo Connected', 'Demo') + '</div>' +
      '<div class="card-bd"><p class="body-sm muted">当前仅为原型状态，不保存任何 Token，不调用发布接口。</p>' +
      '<a class="btn btn-secondary btn-sm mt-3" href="#/social">管理账号</a></div></section>' +
      '<section class="card"><div class="card-hd"><div><h2>任务队列</h2><div class="sub">内容生成 / 发布 / 视频处理</div></div>' + UI.pill('Connected', '正常') + '</div>' +
      '<div class="card-bd"><div class="kv">' +
      '<div><span class="k">内容生成</span><span class="v">异步</span></div>' +
      '<div><span class="k">社媒发布</span><span class="v">独立队列</span></div>' +
      '<div><span class="k">视频处理</span><span class="v">独立队列</span></div>' +
      '<div><span class="k">失败重试</span><span class="v">3 次</span></div></div></div></section>' +
      '</div>';

    var notifyPanel = '<section class="card"><div class="card-bd"><div class="stack-sm">' +
      ['询盘入库通知', 'Ds Bit 解析失败', '社媒发布失败', '审批待处理', '库存低量提醒', '周报摘要'].map(function (n, i) {
        return '<div class="list-row" style="padding:var(--sp-3) 0"><div class="grow"><div class="ttl">' + n + '</div>' +
          '<div class="meta">站内通知' + (i < 2 ? ' + 邮件' : '') + '</div></div>' +
          '<div class="side"><label class="inline-check"><input type="checkbox"' + (i !== 5 ? ' checked' : '') + '>启用</label></div></div>';
      }).join('') + '</div><div class="form-actions"><button class="btn btn-primary btn-sm" type="button" data-act="settings-save">保存通知</button></div></div></section>';

    var securityPanel = '<section class="card"><div class="card-bd"><div class="form-grid">' +
      '<div class="field"><label>会话有效期</label><select class="select"><option>8 小时</option><option>24 小时</option></select></div>' +
      '<div class="field"><label>强制 MFA</label><select class="select"><option>所有后台账号</option><option>仅管理员</option></select></div>' +
      '<div class="field"><label>登录失败锁定</label><input class="input" value="5 次 / 15 分钟"></div>' +
      '<div class="field"><label>IP 白名单</label><input class="input" value="未启用（Demo）" readonly></div>' +
      '</div><div class="note warn mt-3">安全配置为原型展示，不修改真实服务器、Nginx、PHP 或 MySQL 配置。</div>' +
      '<div class="form-actions"><button class="btn btn-primary btn-sm" type="button" data-act="settings-save">保存安全设置</button></div></div></section>';

    var panels = [
      { id: 'site', body: sitePanel },
      { id: 'lang', body: langPanel },
      { id: 'integrations', body: integrationPanel },
      { id: 'notify', body: notifyPanel },
      { id: 'security', body: securityPanel }
    ];

    return '<div class="adm-page">' +
      UI.pageHead('系统设置', '站点、语言、集成、通知与安全；所有变更在原型中只做展示，不触碰生产配置。',
        UI.demoChip('Demo 设置 · 不写配置')) +
      UI.tabs([
        { id: 'site', t: '站点信息' },
        { id: 'lang', t: '语言' },
        { id: 'integrations', t: '集成状态' },
        { id: 'notify', t: '通知' },
        { id: 'security', t: '安全' }
      ], tab, 'setttabs') +
      '<div class="mt-3">' + UI.panels('setttabs', panels, tab) + '</div>' +
      '</div>';
  };

  /* ================================================================ 待办任务 */
  V.tasks = function (S) {
    var tab = S.taskTab || 'all';
    var open = S.tasks.filter(function (t) { return !t.done; });
    var list = tab === 'all' ? open : open.filter(function (t) { return t.priority === tab; });
    var links = {
      '产品参数审核': '#/param-review', '内容资产库': '#/content', '社媒发布日历': '#/calendar',
      'Datasheet 文档管理': '#/datasheets', '询盘管理': '#/inquiries', '商品详情页管理': '#/product-detail',
      '审批流程': '#/approvals', '商品管理': '#/products'
    };

    var rows = list.map(function (t) {
      return '<tr data-search="' + esc((t.title + ' ' + t.module + ' ' + t.owner).toLowerCase()) + '">' +
        '<td><input class="chk" type="checkbox" data-act="task-done" data-id="' + esc(t.id) + '" aria-label="完成任务 ' + esc(t.id) + '"></td>' +
        '<td><span class="cell-main">' + esc(t.title) + '</span><span class="cell-sub">' + esc(t.id) + ' · ' + esc(t.module) + '</span></td>' +
        '<td>' + UI.pill(t.priority === 'P1' ? 'Needs Review' : t.priority === 'P2' ? 'New' : 'Draft', t.priority) + '</td>' +
        '<td class="nowrap">' + esc(t.due) + '</td><td>' + esc(t.owner) + '</td>' +
        '<td class="actions"><a class="link-btn" href="' + (links[t.module] || '#/dashboard') + '">前往处理</a></td></tr>';
    }).join('') || '<tr><td colspan="6">' + UI.empty('没有未完成任务') + '</td></tr>';

    return '<div class="adm-page" data-filter-scope>' +
      UI.pageHead('待办任务', '跨模块待办汇总；P1 优先处理，完成后从列表移除（Demo 状态）。',
        UI.demoChip('任务为 Demo 数据') +
        '<button class="btn btn-secondary btn-sm" type="button" data-act="tasks-refresh"><span data-icon="refresh"></span>刷新</button>') +
      '<div class="grid-3">' +
      UI.stat({ k: '未完成任务', v: String(open.length), note: 'P1 ' + open.filter(function (t) { return t.priority === 'P1'; }).length + ' 项', icon: 'clipboard', warn: true }) +
      UI.stat({ k: '今日到期', v: String(open.filter(function (t) { return t.due.indexOf('今天') === 0; }).length), note: '按时处理', icon: 'clock' }) +
      UI.stat({ k: '已完成（本会话）', v: String(S.tasks.filter(function (t) { return t.done; }).length), note: '仅前端状态', icon: 'check' }) +
      '</div>' +
      UI.tabs([
        { id: 'all', t: '全部', count: open.length },
        { id: 'P1', t: 'P1', count: open.filter(function (t) { return t.priority === 'P1'; }).length },
        { id: 'P2', t: 'P2', count: open.filter(function (t) { return t.priority === 'P2'; }).length },
        { id: 'P3', t: 'P3', count: open.filter(function (t) { return t.priority === 'P3'; }).length }
      ], tab, 'tasktabs') +
      '<section class="card">' + UI.tbl(['', '任务', '优先级', '截止', '负责人', ''], rows) +
      UI.foot(list.length + ' 项', '勾选即完成（Demo）') + '</section>' +
      '<div class="note">任务只是视图，不替代审批与审计；完成动作不会改变业务对象状态。</div>' +
      '</div>';
  };

  /* ================================================================ 系统通知 */
  V.notices = function (S) {
    var tab = S.noticeTab || 'all';
    var unread = S.notices.filter(function (n) { return !n.read; });
    var list = tab === 'unread' ? unread : S.notices;

    var items = list.map(function (n) {
      return '<div class="list-row">' +
        '<div class="side">' + (n.read ? '<span class="dot"></span>' : '<span class="dot warn"></span>') + '</div>' +
        '<div class="grow"><div class="row" style="gap:var(--sp-3);flex-wrap:wrap"><div class="ttl">' + esc(n.title) + '</div>' +
        '<span class="st' + (n.read ? ' st-muted' : ' st-warn') + '">' + UI.icon(n.type === '系统' ? 'settings' : n.type === 'Ds Bit' ? 'chip' : n.type === '社媒' ? 'share' : 'megaphone') + esc(n.type) + '</span>' +
        (n.read ? '' : '<span class="st st-solid">' + UI.icon('dot') + '未读</span>') + '</div>' +
        '<div class="meta">' + esc(n.time) + '</div>' +
        '<div class="body-sm muted mt-1">' + esc(n.body) + '</div></div>' +
        '<div class="side"><button class="btn btn-ghost btn-xs" type="button" data-act="notice-view" data-id="' + esc(n.id) + '">查看</button>' +
        (n.read ? '' : '<button class="link-btn" type="button" data-act="notice-read" data-id="' + esc(n.id) + '">标记已读</button>') + '</div></div>';
    }).join('') || UI.empty('没有未读通知');

    return '<div class="adm-page">' +
      UI.pageHead('系统通知', 'Ds Bit 解析、社媒发布、权限与系统状态的通知中心。',
        UI.demoChip('通知为 Demo 数据') +
        '<button class="btn btn-secondary btn-sm" type="button" data-act="notice-all">全部标记已读</button>') +
      '<div class="grid-4-8">' +
      UI.card({ title: '通知概览', padSm: true, body: '<div class="hero-num">' + unread.length + ' <small>未读</small></div>' +
        '<div class="chart-note">共 ' + S.notices.length + ' 条通知。通知不代替任务与审批。</div>' +
        '<div class="stack-sm mt-3">' +
        '<div class="kpi-mini"><span class="k">Ds Bit</span><span class="v">' + S.notices.filter(function (n) { return n.type === 'Ds Bit'; }).length + '</span></div>' +
        '<div class="kpi-mini"><span class="k">营销</span><span class="v">' + S.notices.filter(function (n) { return n.type === '营销'; }).length + '</span></div>' +
        '<div class="kpi-mini"><span class="k">系统</span><span class="v">' + S.notices.filter(function (n) { return n.type === '系统'; }).length + '</span></div></div>' }) +
      UI.card({ title: '通知列表', sub: '按时间倒序', body:
        UI.tabs([{ id: 'all', t: '全部', count: S.notices.length }, { id: 'unread', t: '未读', count: unread.length }], tab, 'noticetabs') +
        '<div class="mt-3">' + items + '</div>' }) +
      '</div></div>';
  };

  /* ================================================================ 关键业务指标 */
  V.kpis = function (S) {
    var defs = [
      { k: '商品总数', v: '10.09M', def: '全站已建档 SKU 数', src: '商品库', owner: '商城运营', freq: '实时' },
      { k: '已发布商品', v: '9.84M', def: '前台可见且有已审核内容的商品', src: '商品库', owner: '商城运营', freq: '实时' },
      { k: '待审核商品', v: '1,268', def: '参数或详情页待审核的商品', src: 'Ds Bit + 商品库', owner: '技术数据审核', freq: '每小时' },
      { k: '今日访客', v: '48,210', def: 'UV，按 Cookie 去重', src: 'GA4（未接入）', owner: '营销运营', freq: '每日' },
      { k: '自然搜索流量', v: '32,480', def: 'Google Organic 会话', src: 'GA4（未接入）', owner: '营销运营', freq: '每日' },
      { k: '今日询盘', v: '126', def: '询盘表单提交量', src: '询盘库', owner: '商城运营', freq: '实时' },
      { k: '有效询盘率', v: '38.4%', def: '有效询盘 / 全部询盘（剔除 Spam 与重复）', src: '询盘库', owner: '商城运营', freq: '每日' },
      { k: '社媒引流', v: '6,120', def: 'UTM 标记为社媒的会话', src: 'GA4（未接入）', owner: '营销运营', freq: '每日' },
      { k: '内容发布数', v: '28', def: '本月已发布内容', src: '内容库', owner: '营销运营', freq: '每日' },
      { k: '待处理任务', v: '23', def: '跨模块未完成任务', src: '任务视图', owner: '管理员', freq: '实时' }
    ];

    var rows = defs.map(function (d) {
      return '<tr><td><span class="cell-main">' + esc(d.k) + '</span></td><td class="num">' + esc(d.v) + '</td>' +
        '<td class="muted">' + esc(d.def) + '</td><td>' + esc(d.src) + '</td><td>' + esc(d.owner) + '</td><td>' + esc(d.freq) + '</td></tr>';
    }).join('');

    return '<div class="adm-page">' +
      UI.pageHead('关键业务指标', '统一指标口径与责任人；GA4 未接入的指标标注为 Demo。',
        UI.demoChip('指标为 Demo')) +
      '<div class="grid-2">' +
      UI.card({ title: '访客趋势', sub: '30 天', padSm: true, body: UI.chart({ h: 170, series: [{ v: D.overview.traffic, cls: 'viz-line-1', area: true }], labels: [], max: 100 }) }) +
      UI.card({ title: '询盘趋势', sub: '30 天', padSm: true, body: UI.chart({ h: 170, series: [{ v: D.overview.inquiries, cls: 'viz-line-accent', area: true, areaCls: 'viz-area-accent' }], labels: [], max: 40 }) }) +
      '</div>' +
      UI.card({ title: '指标定义', sub: '口径、来源与责任人', pad: false,
        body: UI.tbl(['指标', { h: '当前值', cls: 'num' }, '定义', '来源', '责任人', '更新频率'], rows) }) +
      '<div class="note warn"><strong>数据边界：</strong>GA4 与 Search Console 未连接；访客、自然流量、社媒引流为 Demo 估算，接入后需重新校准。</div>' +
      '</div>';
  };

  /* ================================================================ 个人账号 */
  V.account = function (S) {
    return '<div class="adm-page">' +
      UI.pageHead('个人账号', '当前登录账号资料、安全设置与权限摘要。',
        UI.demoChip('账号为 Demo 数据')) +
      '<div class="grid-4-8">' +
      UI.card({ title: '账号信息', padSm: true, body:
        '<div class="row" style="gap:var(--sp-4);align-items:center"><span class="avatar-lg">陈</span>' +
        '<div><div class="h-sm">陈立</div><div class="body-sm muted">chen.li@morrishk.net</div>' +
        '<div class="ui-pend mt-2">' + UI.pill('Active', '管理员') + UI.pill('Enabled', 'MFA 已启用') + '</div></div></div>' +
        '<div class="kv mt-3">' +
        '<div><span class="k">最近登录</span><span class="v">2026-11-16 09:40</span></div>' +
        '<div><span class="k">登录 IP</span><span class="v mono">10.20.4.9</span></div>' +
        '<div><span class="k">账号创建</span><span class="v">2024-03-11</span></div>' +
        '<div><span class="k">时区</span><span class="v">UTC+8</span></div></div>' }) +
      '<div class="stack">' +
      UI.card({ title: '资料', body: '<div class="form-grid">' +
        '<div class="field"><label>姓名</label><input class="input" value="陈立"></div>' +
        '<div class="field"><label>邮箱</label><input class="input" value="chen.li@morrishk.net"></div>' +
        '<div class="field full"><label>通知偏好</label><input class="input" value="站内 + 邮件（P1 任务）"></div>' +
        '</div><div class="form-actions"><button class="btn btn-primary btn-sm" type="button" data-act="account-save">保存资料</button></div>' }) +
      UI.card({ title: '修改密码', body: '<div class="form-grid">' +
        '<div class="field"><label>当前密码</label><input class="input" type="password" placeholder="••••••••"></div>' +
        '<div class="field"><label>新密码</label><input class="input" type="password" placeholder="至少 12 位"></div>' +
        '<div class="field full"><label>确认新密码</label><input class="input" type="password" placeholder="再次输入"></div>' +
        '</div><div class="form-actions"><button class="btn btn-primary btn-sm" type="button" data-act="account-pass">更新密码</button></div>' }) +
      UI.card({ title: '权限摘要', body: '<div class="ui-pend">' +
        ['商品与分类', '库存与报价', '参数审核', '社媒发布', '用户与权限', '操作审计'].map(function (a) {
          return '<span class="st st-solid">' + UI.icon('check') + esc(a) + '</span>';
        }).join('') + '</div><p class="body-sm muted mt-3">管理员拥有全部业务域权限；其他角色按权限矩阵隔离。</p>' +
        '<a class="btn btn-secondary btn-sm" href="#/roles">查看权限矩阵</a>' }) +
      '</div></div></div>';
  };
})();

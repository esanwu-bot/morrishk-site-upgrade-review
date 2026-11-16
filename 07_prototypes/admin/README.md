# 后台原型 — Morrishk Intelligence 统一管理运营中心

## 状态

**已交付，等待 Reviewer 复核（2026-11-16）**。本目录只包含 HTML/CSS/JS 原型，不包含 React、API、数据库或真实后台。

## 打开方式

直接打开 `index.html`（或 `file:///<repo>/07_prototypes/admin/index.html`）。无需构建、无需服务端。

## 交付物

| 文件 / 目录 | 内容 |
|---|---|
| `index.html` | SPA 外壳：29 个菜单 + 个人账号 + 覆盖矩阵，全部可点击 |
| `assets/` | 设计系统接入、Demo 数据、UI Kit、四个视图模块、路由与动作控制器 |
| `screenshots/` | 22 张 1600px 桌面截图 + 1 张 1024px 平板截图 |
| `prototype-readme.md` | 导航结构、核心交互、Mock 规则、设计决策、自检记录 |
| `prototype-scope.md` | 旧后台 43 动作覆盖矩阵、部分覆盖缺口、待业务确认项 |

## 范围

- 已覆盖：工作台、商城运营、营销运营、产品知识（Ds Bit）、系统管理五组共 29 个菜单。
- 旧后台 43 个 `action*`：25 个已覆盖、18 个部分覆盖、0 个未覆盖。
- 未覆盖 ≠ 废弃；旧功能下线需业务确认与 Reviewer 判定。

## 边界

不修改 Yii2 / 数据库 / 生产配置；不接入真实社媒、GA4、任务队列；不复制 Ds Bit 解析核心；不进入 React / API / 数据库开发。
原型中的数据、发布、审计与权限切换均为 Demo，真实生效性一律 `NOT VERIFIABLE`。

> 本 README 取代第二轮评审时的「未提交说明」；后台原型现已纳入本轮复核范围。

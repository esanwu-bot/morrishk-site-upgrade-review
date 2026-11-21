# 商业模式合规分析

> 本表区分“内部使用 / 网络服务 / 软件分发 / 修改版分发 / API 通信”。结论是风险分析，不是法律意见。

## 1. 八种商业模式

| # | 模式 | 是否向第三方提供副本 | 是否修改 Postiz | AGPL 源码义务 | 其他许可 | 结论 |
|---|---|---|---|---|---|---|
| 1 | 公司内部使用 Postiz | 否 | 否 | 通常无对外源码义务；内部网络用户按 §13 仅在修改时触发 | Polotno 商用；Elasticsearch | 可用，先解决第三方许可 |
| 2 | Morrishk 收费 SaaS 调用 Postiz | 否（仅网络交互） | 否 | 未修改时 §13 不触发；§6 不触发（需律师确认 SaaS 定性） | Polotno 商用；Elasticsearch | 有条件可用 |
| 3 | Morrishk 为多个客户托管 Postiz | 否 | 否/可能 | 未修改：同上；修改：§13 对所有租户用户 | Polotno；Elasticsearch；租户隔离 | 有条件；需多租户设计 |
| 4 | 向客户提供独立 Postiz 账号 | 可能（账号/服务） | 否 | 若只是让客户用 Postiz Cloud，受 Postiz Cloud 条款；自托管则看是否交付副本 | Postiz Cloud 条款；商标 | 需区分 Cloud/自托管 |
| 5 | 向客户提供 Postiz 私有化部署 | 是（镜像/安装包） | 否/可能 | §6 必须提供 Corresponding Source | Polotno；Elasticsearch | 必须履行 §6 |
| 6 | 向客户交付修改后的 Postiz | 是 | 是 | §5 + §6 + §13（如网络） | 同上 + 商标 | 必须 AGPL 开源或商业授权 |
| 7 | 对 Postiz 提供二次开发/定制服务 | 是（交付修改版） | 是 | 修改版按 AGPL；客户获得源码权利 | Polotno/ES | 可以收费，但不能闭源交付 |
| 8 | 包装成 Morrishk 商业社媒工作台/白标 | 视方式 | 可能 | 若修改/交付：AGPL；若仅独立 API + 原版：较低 | 商标书面许可；Polotno；ES | 白标需书面授权 |

## 2. 关键区分

### 2.1 内部使用

- AGPL §2 明确允许运行未修改程序；§0 说明纯网络交互不等于 conveying。
- 未修改 + 不对外提供副本：通常无 §13/§6 源码义务。
- 修改 + 内部网络用户（员工）使用：§13 可能要求向这些用户提供 Corresponding Source；不是“内部就绝对安全”。
- Polotno 的“商业使用”与 AGPL 内部使用是两套判断；商业公司内部使用仍可能触发 Polotno 商业许可。

### 2.2 网络服务（SaaS）

- 未修改 Postiz：§13 按文义不触发；§6 不触发（没有副本转移）。
- 修改 Postiz：§13 触发，向所有远程用户提供源码。
- “SaaS 是否构成 conveying”在 §0 有“mere interaction 不是 conveying”的说明，但具体交易结构仍需律师确认。
- 收费本身允许；不能因收费就要求额外商业许可（AGPL 层面）。

### 2.3 软件分发

- 交付源码：§4/§5，保留许可证/通知；修改版按 AGPL。
- 交付二进制/镜像/安装包：§6，必须提供 Corresponding Source。
- 交付 Docker 镜像不等于“只交付服务”；镜像就是 object code 分发。
- 客户获得 AGPL 权利，不能通过 EULA 禁止其复制/修改/再分发该 AGPL 部分。

### 2.4 修改版分发

- §5：整个修改作品按 AGPL；显著标注修改与日期；交互界面显示 Appropriate Legal Notices。
- §13：若支持远程网络交互，向所有远程用户显著提供源码获取机会。
- 修改版不能闭源；收费可以，但源码义务不能绕开。

### 2.5 独立软件 API 通信

- 独立进程、独立 DB、HTTP/socket/CLI 通信，通常更接近独立程序/aggregate。
- 但“API 调用”不是自动免责；如果 Adapter 复制 Postiz 代码、使用内部接口、与 Postiz 同进程/同库，仍可能被认定为组合。
- GPL FAQ 对 sockets/pipes 的说明是重要参考，但不是法律裁定。

## 3. 各模式的具体风险

### 模式 1：公司内部使用

- AGPL：低（未修改）；中（修改 + 员工远程使用）。
- Polotno：中-高（商业使用需许可）。
- Elasticsearch：中（如启用 Temporal ES）。
- 建议：先移除/授权 Polotno；避免修改；如修改，建立内部源码提供页。

### 模式 2：收费 SaaS 调用 Postiz

- AGPL：低-中（未修改；SaaS 定性需律师确认）。
- Polotno：高（商业使用）。
- Elasticsearch：中-高（托管服务）。
- 建议：方案 C；不修改 Postiz；不使用 Postiz 品牌；购买/移除 Polotno；审查 ES。

### 模式 3：多租户托管

- AGPL：同模式 2；若修改，§13 对每个租户用户。
- 租户隔离：每个租户一个 Organization/API Key；不要共享超级管理员 Key。
- 数据：租户内容/Token 隔离；Postiz DB 与 Morrishk DB 分离。
- 建议：独立部署或严格 org 隔离；合同明确数据处理。

### 模式 4：向客户提供独立 Postiz 账号

- 如果是 Postiz Cloud 账号：受 Postiz Cloud 条款；转售/白标需书面协议（Terms §7）。
- 如果是 Morrishk 自托管账号：按模式 2/3；客户可能被视为远程用户。
- 建议：不要转售 Cloud 账号；自托管按模式 2/3。

### 模式 5：私有化部署

- §6 触发：镜像/安装包必须附 Corresponding Source（源码/书面要约/网络）。
- 若使用 Polotno，客户也需要 Polotno 许可或移除功能。
- Elasticsearch 随部署交付，需单独许可。
- 建议：交付源码包 + NOTICE + 版本清单；不要只给镜像。

### 模式 6：交付修改版

- §5/§6/§13 全部可能触发；修改版必须 AGPL。
- 不能把 Morrishk 修改藏起来；客户/远程用户有权获得源码。
- 建议：除非接受开源或取得商业许可，否则不要交付修改版。

### 模式 7：二次开发/定制

- 可以收费开发；但交付的修改版是 AGPL。
- 客户获得源码权利；不能签“禁止查看/禁止再分发”的条款对抗 AGPL。
- 建议：合同明确 AGPL 义务；报价包含源码交付/合规成本。

### 模式 8：白标/OEM

- AGPL 不授予商标；Postiz Terms §10 商标属于 Gitroom。
- 白标/转售需书面协议（Terms §7）；Enterprise 页面提到 white-label，但“暂不接受新申请”，且未明确源码许可。
- 若修改代码去品牌化，修改版仍按 AGPL；商标许可另需。
- 建议：只有取得 Postiz 书面 OEM/白标授权 + Polotno 商业许可 + AGPL 合规方案后才做。

## 4. 结论

| 模式 | 推荐度 | 前置条件 |
|---|---|---|
| 内部使用（原版） | 可用 | Polotno 许可/移除；ES 许可 |
| 收费 SaaS（原版 + Adapter） | **推荐（有条件）** | 方案 C；Polotno；ES；律师确认 |
| 多租户托管 | 有条件 | 租户隔离；Polotno；ES；合同 |
| 独立 Postiz Cloud 账号转售 | 不建议 | 需 Postiz 书面协议 |
| 私有化部署 | 有条件 | §6 源码；Polotno；ES |
| 交付修改版 | 不推荐（除非开源/商业许可） | AGPL；商标 |
| 二次开发 | 可收费但需开源修改版 | AGPL |
| 白标/OEM | 仅商业授权 | Postiz OEM + Polotno + 商标 |

**最重要的商业结论：** 如果 Morrishk 只需要“社媒账号连接、排程、发布、基础分析”，方案 C 足以；不需要修改 Postiz，也不需要把 Morrishk 业务代码放入 Postiz。这样可以把 AGPL 风险控制在 Postiz 本身，并保持 Morrishk/Ds Bit/Adapter 闭源。

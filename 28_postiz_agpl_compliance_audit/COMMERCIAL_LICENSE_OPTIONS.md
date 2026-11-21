# 商业授权调查

> 所有“未公开”事项标记 `UNKNOWN`，不得猜测价格、授权范围或可签约性。

## 1. Postiz 自身

### 1.1 仓库/文档

| 项 | 事实 | 证据 |
|---|---|---|
| 根许可证 | AGPL-3.0 | `LICENSE`、`package.json:6`、`README.md:192` |
| 商业许可文件 | 未发现 | 仓库内只有 `LICENSE`、`CCLA.md`、`ICLA.md` |
| 双许可声明 | 未发现 | README/文档未声明 dual license |
| OEM/白标许可 | 未发现公开条款 | README 无；Terms §7 要求书面协议 |
| 企业版 | 有 Postiz Enterprise 页面 | `https://postiz.com/enterprise` |

`CCLA.md` / `ICLA.md` 是贡献者版权/许可协议，不是给客户的商业授权。

### 1.2 Postiz Cloud / Enterprise

| 项 | 公开事实 | 标记 |
|---|---|---|
| Cloud 计划 | Standard $29/mo、Team $39/mo、Pro $49/mo、Ultimate $99/mo | 价格公开，2026-11-21 页面 |
| 自托管 | Docker + 自有服务器；AGPL-3.0；免费 | 公开 |
| Enterprise | headless API、multi-tenant、white-label；$200–$8000/mo；**“We are not accepting new applications at the moment.”** | 价格区间公开；可用性受限 |
| Enterprise 是否授予 AGPL 源码商业/OEM 许可 | 页面未明确 | `UNKNOWN` |
| 是否允许闭源二开 | 未明确 | `UNKNOWN` |
| 是否允许 SaaS/多租户托管 | Enterprise 描述提到 multi-tenant；但授权条款未公开 | `UNKNOWN` |
| 是否允许白标 | 描述提到 white-label；但 Terms §7 要求书面协议 | `UNKNOWN` / 需书面 |
| 是否允许向客户交付 | 未明确 | `UNKNOWN` |

**结论：** Enterprise 页面是一个商业服务/API 入口，不能自动等同于“AGPL 源码商业授权”。如果 Morrishk 需要对外交付/托管闭源修改版、OEM 或白标，必须向 Gitroom 书面询价并取得合同；当前公开证据不足以确认可获得性。

### 1.3 Terms 要点

`https://postiz.com/terms`（2026-11-21）：

- Section 7：未经书面协议，不得“resell, sublicense, white-label or otherwise commercialise the Service”。
- Section 10：logos/trademarks 属于 Gitroom；开源组件受各自许可证约束。

**含义：**

- 自托管 AGPL 使用不等于可以转售 Postiz Cloud。
- 白标/品牌使用需要单独许可。
- 开源部分仍受 AGPL；Terms 不能削减 AGPL 权利，也不能把 AGPL 代码变成闭源商业许可。

## 2. Polotno（独立商业许可）

| 项 | 事实 |
|---|---|
| 组件 | `polotno@3.0.0-beta.25` |
| 位置 | `package.json:187`；`apps/frontend/src/components/launches/polonto.tsx` |
| 调用路径 | `media.component.tsx` 通过 `dynamic(() => import(.../polonto))` 懒加载；`designMedia()` 仅在 `user.tier.ai && !dummy` 时打开 |
| 许可证 | 自定义：非商业产品/本地开发免费；商业使用需购买 |
| 官方入口 | `https://polotno.com/` |
| 是否包含在 Postiz AGPL 中 | 未说明；不能推定 |
| 商业许可价格 | 未在 Postiz 仓库公开；需向 Polotno 查询 |
| OEM/再分发 | 需与 Polotno 书面确认 |

### 2.1 触发范围（R3）

| # | 场景 | 代码/打包事实 | 许可判断 |
|---|---|---|---|
| 1 | 商业部署且启用 Polotno 编辑器 | `designMedia` 打开 Polotno；动态 import 加载 `polonto.tsx`；组件 import `polotno` | **需要** Polotno 商业许可 |
| 2 | 安装依赖但未启用该功能 | `package.json:187` 安装；`Dockerfile.dev` 单阶段 `COPY .` + `pnpm install`，未做产物裁剪；Next 构建可能生成动态 chunk（未实际构建，`UNKNOWN`） | **高风险**：不能仅凭“没点开”推定不触发；商业分发镜像仍可能包含代码。建议按需要许可或移除 |
| 3 | 构建产物完全移除 | 删除 `polonto.tsx` 及其 import、`package.json` 依赖、`pnpm-lock` 条目，清 `node_modules`/`.next` 后重建；`rg -i polotno` 为空 | 若产物/镜像确实不含 Polotno 代码，**不触发** Polotno 许可；需验证构建产物 |
| 4 | 替换编辑器 | 用自有/其他许可编辑器替换 `polonto.tsx`，移除 Polotno 依赖与 chunk | 不触发 Polotno 许可 |

**证据边界：** 本轮没有执行 `pnpm install` / `next build`，所以场景 2 的“实际 chunk 是否包含 Polotno”标记 `UNKNOWN`；从代码路径看，动态 import 是构建期引用，不能假定未启用就完全不会进入产物。

**结论：**

- 商业部署且保留 Polotno 功能：必须购买 Polotno 商业许可。
- 不想购买：按场景 3 完全移除（依赖 + import + lock + 构建缓存 + 镜像重建），或按场景 4 替换编辑器。
- 仅“安装但没启用”不是可靠的免责理由；商业镜像可能仍包含代码。
- Polotno 许可与 Postiz AGPL 是两套独立义务。

## 3. Elasticsearch（Temporal 栈）

| 项 | 事实 |
|---|---|
| 组件 | `elasticsearch:7.17.27`（Docker Hub `library/elasticsearch`；`docker-compose.yaml` temporal-elasticsearch） |
| 镜像许可 label | `org.opencontainers.image.licenses=Elastic-License-2.0`；`org.label-schema.license=Elastic-License-2.0` |
| 源代码许可 | SSPL 与 ELv2 双许可 |
| 是否 OSI 开源 | 否；ELv2 含 managed service 限制 |
| 用途 | Temporal advanced visibility（Postiz 使用 `organizationId`/`postId` search attributes） |
| 是否默认必需 | Postiz 默认 compose 包含 ES 并 `ENABLE_ES=true`；Temporal 支持 PostgreSQL/MySQL/SQLite Advanced Visibility，故**默认包含不等于代码强制**；实际替换 `UNKNOWN` |
| 替换是否要改 Postiz 源码 | 可能只需 compose/env/dynamic config/schema；未验证，`UNKNOWN` |
| 商业许可 | 不是所有自托管都需要购买；对外托管是否触发 ELv2 限制需律师评估 |
| 结论 | `LEGAL_REVIEW_REQUIRED`；先做非生产替换验证，不能直接推断“所有自托管都要买 Elastic 许可” |

**结论：**

- 内部自用/不对外提供托管服务的场景，ELv2 可能允许，无需直接购买；但不是法律结论。
- 对外提供 Postiz 托管服务时，需评估 ELv2 的 hosted/managed service 限制；如触发，需商业授权或改用 PostgreSQL Advanced Visibility。
- 替换 ES 不应默认需要修改 Postiz 源码；先用 Temporal 官方 PostgreSQL compose/配置做非生产验证，确认 Postiz 的 search attributes 与 workflow 功能完整。

## 4. Sentry CLI（FSL-1.1-MIT）

| 项 | 事实 |
|---|---|
| 组件 | `@sentry/cli` 2.58.x（18 个平台包） |
| 许可证 | FSL-1.1-MIT（Functional Source License，MIT Future） |
| 允许 | 内部使用、修改、再分发（非 Competing Use） |
| 限制 | 不得提供替代 Sentry 的竞争产品/服务 |
| 使用场景 | 构建/source map；不一定随运行镜像分发 |
| 结论 | 低-中风险；检查实际镜像/构建产物并保留通知 |

## 5. 需向供应商确认的问题

### 5.1 向 Gitroom / Postiz

1. 自托管 AGPL 是否允许 Morrishk 作为收费 SaaS 提供给客户？
2. 是否允许**对外交付/托管的修改版**闭源？如不允许，商业授权价格/范围？私有修改不传播另论。
3. 是否提供 OEM/白标/多租户商业许可？价格、最低期限、限制？
4. 商业许可是否覆盖 Polotno、Elasticsearch 等第三方组件？
5. 是否允许向客户交付 Docker 镜像/私有化部署？源码义务如何履行？
6. 是否允许使用 Postiz 名称/Logo？白标是否需额外费用？
7. 是否有企业支持/SLA/安全补丁承诺？
8. 子包 `ISC` 与根 `AGPL-3.0` 的冲突如何解释？

### 5.2 向 Polotno

1. 商业许可是否覆盖 SaaS、多租户、白标、OEM？
2. 是否允许随 Postiz 镜像/私有化部署再分发？
3. 价格、期限、支持、升级条款？
4. 是否允许移除品牌/修改组件？

### 5.3 向 Elastic

1. Elastic License 是否允许 Morrishk 对外提供托管 Postiz（Temporal visibility）？
2. 是否需要商业订阅？
3. 是否可用替代 visibility 存储避免该依赖？

## 6. 结论

| 问题 | 结论 |
|---|---|
| Postiz 是否有公开商业授权？ | 有 Enterprise 商业页面，但没有公开源码/OEM 许可条款；`UNKNOWN` |
| 是否必须购买 Postiz 商业授权？ | 仅在需要对外交付/托管闭源修改版、白标/OEM/规避 AGPL 时；方案 C 不一定需要 |
| 是否必须购买 Polotno 商业授权？ | 商用且保留 Polotno 功能时，**需要** |
| Elasticsearch 是否需要商业授权？ | 视托管模式/许可证解释；`LEGAL_REVIEW_REQUIRED` |
| 能否现在采购？ | 不能；Enterprise 页面称暂不接受新申请；需商务询价，且本轮禁止采购 |

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

**结论：** Enterprise 页面是一个商业服务/API 入口，不能自动等同于“AGPL 源码商业授权”。如果 Morrishk 需要闭源修改版、OEM 或白标，必须向 Gitroom 书面询价并取得合同；当前公开证据不足以确认可获得性。

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
| 许可证 | 自定义：非商业产品/本地开发免费；商业使用需购买 |
| 官方入口 | `https://polotno.com/` |
| 是否包含在 Postiz AGPL 中 | 未说明；不能推定 |
| 商业许可价格 | 未在 Postiz 仓库公开；需向 Polotno 查询 |
| OEM/再分发 | 需与 Polotno 书面确认 |

**结论：** 如果 Morrishk 商用 Postiz 且保留 Polotno 图片编辑器，必须取得 Polotno 商业许可；否则移除该功能/依赖。该许可与 Postiz AGPL 是两套独立义务。

## 3. Elasticsearch（Temporal 栈）

| 项 | 事实 |
|---|---|
| 组件 | `elasticsearch:7.17.27`（`docker-compose.yaml` temporal-elasticsearch） |
| 许可证 | Elastic License / SSPL 系列，不是 AGPL，也不是 OSI 开源 |
| 用途 | Temporal advanced visibility |
| 是否可替换 | Temporal 支持其他 visibility 配置；需技术验证 |
| 商业托管限制 | 需按 Elastic 许可证评估；`LEGAL_REVIEW_REQUIRED` |

**结论：** 对外托管 Postiz 前，需确认 Elasticsearch 许可证是否允许该托管模式；否则改用替代方案或取得商业授权。

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
2. 是否允许修改 Postiz 并闭源？如不允许，商业授权价格/范围？
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
| 是否必须购买 Postiz 商业授权？ | 仅在需要闭源修改/白标/OEM/规避 AGPL 时；方案 C 不一定需要 |
| 是否必须购买 Polotno 商业授权？ | 商用且保留 Polotno 功能时，**需要** |
| Elasticsearch 是否需要商业授权？ | 视托管模式/许可证解释；`LEGAL_REVIEW_REQUIRED` |
| 能否现在采购？ | 不能；Enterprise 页面称暂不接受新申请；需商务询价，且本轮禁止采购 |

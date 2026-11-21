# Postiz 许可证事实核查

## 1. 审计基线

| 项 | 值 |
|---|---|
| 仓库 | `https://github.com/gitroomhq/postiz-app` |
| 审计日期 | 2026-11-21 |
| 分支 | `main` |
| HEAD commit | `6be4874631fea453f99115a78fd543c71820ab45` |
| HEAD 时间 | 2026-11-20 17:23:25 +0700 |
| 最新 Release | `v2.26.0` |
| Release commit | `132859f32d854830ce44b509da87409c3ec10a77` |
| Release 时间 | 2026-11-13 19:53:26 +0200 |
| 克隆方式 | `git clone --depth 1`，另行 fetch `v2.26.0` tag 做对比 |
| 审计性质 | 只读；未修改、未 fork、未部署 |

## 2. LICENSE 文件事实

### 2.1 文件标识

| 项 | 值 |
|---|---|
| 路径 | `LICENSE` |
| 类型 | GNU Affero General Public License v3.0（AGPL-3.0） |
| 行数 | 661 行 |
| 工作树 SHA-256（CRLF） | `5b557a1b2818690b69399e584fec5edfce6673223479b9b6371d35474c13378e` |
| 内容归一化 SHA-256（LF） | `d322fb1066693d8ed25495d11029f443aa793316852749e1389773c1946251b3` |
| Git blob SHA-1 | `24fd22792bf887200be9e1388c7b9d4782c6b3b2` |
| `v2.26.0:LICENSE` blob | `24fd22792bf887200be9e1388c7b9d4782c6b3b2` |
| `v2.9.0:LICENSE` blob | `24fd22792bf887200be9e1388c7b9d4782c6b3b2` |

**结论：** main 工作树与 `v2.26.0` / `v2.9.0` 的 LICENSE 内容相同；工作树 SHA 不同仅因为 CRLF 与 LF 差异，Git blob 完全一致。不能把“工作树 SHA 不同”误判为许可证内容变化。

复算命令：

```bash
git show v2.26.0:LICENSE | sha256sum
# d322fb1066693d8ed25495d11029f443aa793316852749e1389773c1946251b3
python - <<'EOF'
import hashlib
b=open('LICENSE','rb').read()
print(hashlib.sha256(b).hexdigest())                    # raw CRLF
print(hashlib.sha256(b.replace(b'\r\n',b'\n')).hexdigest())  # normalized
EOF
```

### 2.2 许可证尾部版权声明

LICENSE 末尾有项目附加的版权声明：

```text
Postiz - Social media schedule tool
Copyright (C) 2025 Nevo David

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
```

位置：`LICENSE:632-633`。该声明是版权归属声明，不是额外限制；不改变 AGPL 条款。

## 3. 仓库与包声明

| 文件 | 声明 | 位置 |
|---|---|---|
| 根 `package.json` | `"license": "AGPL-3.0"`，`"name": "gitroom"`，`"version": "1.0.0"` | `package.json:6` |
| `README.md` | “This repository's source code is available under the AGPL-3.0 license.” | `README.md:192` |
| `README.md` | “We do not ‘gate’ features or limit the license.” | `README.md:150` |
| `README.md` | 自托管 “Free forever (AGPL-3.0)” | `README.md:156` |
| `apps/sdk/package.json` | `"license": "AGPL-3.0"` | `apps/sdk/package.json:19` |
| `apps/backend/package.json` | `"license": "ISC"` | `apps/backend/package.json:13` |
| `apps/commands/package.json` | `"license": "ISC"` | `apps/commands/package.json:12` |
| `apps/frontend/package.json` | `"license": "ISC"` | `apps/frontend/package.json:17` |
| `apps/orchestrator/package.json` | `"license": "ISC"` | `apps/orchestrator/package.json:13` |
| `apps/extension/package.json` | 无 `license` 字段 | — |

### 3.1 必须记录的元数据冲突

根 LICENSE、根 package、README、`@postiz/node` SDK 都是 **AGPL-3.0**；四个应用子包却写 **ISC**，扩展包没有 license。这个冲突**不能自行解释为“后端和前端是 ISC、可以闭源”**：

- 根 LICENSE 是仓库级许可证；
- 源文件没有逐个 SPDX 头；
- 子包 `license` 字段与根许可证冲突；
- 没有找到官方说明“子包单独采用 ISC”。

**处理：** 标记 `LEGAL_REVIEW_REQUIRED`。在维护方书面澄清或律师确认前，按更严格的 AGPL 处理，不依赖 ISC 字段。

## 4. Release / Tag / 镜像

| 项 | 值 |
|---|---|
| 最新 tag | `v2.26.0` |
| 最新 Release | 2026-11-13，`v2.26.0` |
| 前一个 Release | `v2.25.3`（2026-10-24） |
| 根 package version | `1.0.0`（与 Release tag 不一致） |
| 默认 compose 镜像 | `ghcr.io/gitroomhq/postiz-app:latest`（`docker-compose.yaml:3`） |
| 镜像构建 | tag push 时由 `.github/workflows/build-containers.yml` 构建；镜像 tag 使用 Git tag 名，同时更新 `latest` |
| Dockerfile | `Dockerfile.dev` 被用于生产镜像构建（workflow 指定） |

**风险：**

1. `latest` 是可变 tag，不能证明客户运行的源码版本。
2. compose 没有记录源码 commit/tag。
3. 根 `package.json` version 固定 `1.0.0`，不能用来判断 Release。
4. 生产必须固定到 `v2.26.0` 或 image digest，并保留对应源码归档。

## 5. 第三方依赖许可证

证据：GitHub Dependency Graph SBOM（SPDX-2.3），创建时间 `2026-11-21T07:46:10Z`，3,358 个 package。

SBOM SHA-256：

```text
69d270e0e79456c6627c966b406fc04ebf57e67889c7252a4490ef156baeb6b1
```

主要分布：

| License | 数量 |
|---|---:|
| MIT | 2,519 |
| Apache-2.0 | 424 |
| ISC | 130 |
| BSD-3-Clause | 76 |
| BSD-2-Clause | 34 |
| MPL-2.0 | 16 |
| LGPL 系列（含组合） | 约 27 |
| FSL-1.1-MIT（Sentry CLI） | 18 |
| 自定义 Polotno | 1 |
| UNKNOWN（GitHub Actions） | 16 |
| 根 Postiz | AGPL-3.0 |

### 5.1 需要单独处理的三项

#### A. Polotno（自定义商业许可）

- 版本：`3.0.0-beta.25`，根依赖 `package.json:187`
- 使用位置：`apps/frontend/src/components/launches/polonto.tsx:12-18`，由 `media.component.tsx` 动态加载
- npm license 字段：`SEE LICENSE IN LICENSE.md`
- 许可证原文（unpkg）：

```text
Copyright (C) 2014 - present by Anton Lavrenov

1. You can use this package for free for non-commercial products and local development process.
2. For commercial usage you have to buy a license here: https://polotno.com/
3. Please respect the copyright.
```

**结论：** Postiz 仓库没有说明已包含 Polotno 商业许可。Morrishk 作为商业产品使用 Postiz 时，必须：

1. 购买 Polotno 商业许可；或
2. 移除/禁用 Polotno 编辑器、相关依赖和打包产物；或
3. 取得 Polotno 的书面 OEM/再分发授权。

否则不能把“Postiz 是 AGPL、免费”直接等同于“整套 Postiz 可商业使用”。

#### B. Elasticsearch 7.17.27（Temporal 栈）

- `docker-compose.yaml` 的 `temporal-elasticsearch` 使用 `elasticsearch:7.17.27`。
- Elasticsearch 7.17 的默认发行版使用 **Elastic License 2.0**；源代码同时提供 SSPL/ELv2。Elastic 官方 FAQ 明确默认发行版继续使用 Elastic License 2.0。
- Elastic License 2.0 **不是 OSI 开源许可证**，并限制把软件作为 hosted/managed service 提供。
- Temporal 使用 ES 作为 advanced visibility；若 Morrishk 对外提供托管 Postiz，需要单独评估该限制。

**结论：** `LEGAL_REVIEW_REQUIRED`。如无法接受，需改用 Temporal 支持的 SQL visibility 或取得 Elastic 商业授权；不能把 Elasticsearch 当作 AGPL 的普通依赖忽略。

#### C. Sentry CLI（FSL-1.1-MIT）

- `@sentry/cli` 18 个平台包，license `FSL-1.1-MIT`。
- FSL 允许内部使用、修改和再分发，但排除 “Competing Use”（提供替代 Sentry 的产品/服务）。
- Postiz 使用 Sentry 做错误监控和 source map 上传；CLI 主要在构建/发布阶段使用。
- 若仅构建时使用、不随产品分发，风险较低；若镜像/安装包包含 CLI，需保留许可通知并确认不构成 Competing Use。

**结论：** 低-中风险，生产前做实际镜像/构建依赖检查。

### 5.2 弱 copyleft 依赖

- MPL-2.0：`lightningcss`、`mediabunny`、`axe-core`、`@dub/analytics`、部分 `@ethereumjs` 等。
- LGPL-3.0：`rpc-websockets`、`@img/sharp-libvips-*` 等。
- `node-forge`：`BSD-3-Clause OR GPL-2.0-only`，可选 BSD。
- `dompurify`：`MPL-2.0 OR Apache-2.0`，可选 Apache。

这些不是 AGPL，但需要：

1. 保留版权/许可证通知；
2. 若修改 MPL/LGPL 库，按对应许可证提供修改源码；
3. LGPL 动态链接/独立库使用通常可行，但不能把库改成静态闭源；
4. 生成第三方 notices 文件。

### 5.3 未完成项

- SBOM 来自 GitHub Dependency Graph，不是本地完整构建的 SCA；版本与 `pnpm-lock.yaml` 的 3,340 个 package 存在少量差异。
- 生产前应使用 Syft/Trivy/ORT 等工具对**实际构建产物/镜像**做一次完整 SCA，并生成 NOTICE。
- 本轮未安装依赖、未构建镜像、未运行 SCA 工具。

## 6. 商业授权事实

### 6.1 仓库/文档

- 仓库没有 `LICENSE-COMMERCIAL`、`LICENSE-ENTERPRISE`、`COPYING` 之外的商业许可文件。
- README 没有“dual license”“commercial license”“OEM”说明。
- `CCLA.md` / `ICLA.md` 是贡献者许可协议，不是商业授权。
- 未发现官方“闭源二开许可”条款。

### 6.2 Postiz Cloud / Enterprise 页面

官方页面（2026-11-21 访问）：

- `https://postiz.com/pricing`：Standard $29/mo、Team $39/mo、Pro $49/mo、Ultimate $99/mo；自托管说明为 Docker + 自有服务器。
- `https://postiz.com/enterprise`：headless API、multi-tenant、white-label；价格 $200–$8000/mo；页面显示“We are not accepting new applications at the moment.”
- 该页面没有明确说明是否授予 AGPL 源码的商业/OEM 许可；不能据此推定可以闭源二开或白标。

### 6.3 Terms

`https://postiz.com/terms`（2026-11-21 访问）：

- Section 7：未经书面协议，不得转售、再许可、白标或商业化 “Service”。
- Section 10：logos/trademarks 属于 Gitroom；开源组件受各自许可证约束。

**结论：**

- 若只是自托管 AGPL 软件，Postiz Cloud Terms 不当然替代 AGPL；但白标/品牌使用需要书面许可。
- 若要闭源修改、OEM、白标、转售，必须取得 Gitroom 书面商业授权；公开证据不足以确认可获得的条款与价格。
- 标记：`UNKNOWN` / `LEGAL_REVIEW_REQUIRED`。

## 7. 事实结论

1. Postiz 主仓是 AGPL-3.0，最新 tag 与 main 的 LICENSE 内容一致。
2. 子包 ISC 元数据与根 AGPL 冲突，不能作为闭源依据。
3. Polotno 需要商业许可或移除。
4. Temporal/Elasticsearch 需要单独许可证审查。
5. 未发现公开的 Postiz 商业/OEM 源码许可；Enterprise 页面不是明确的源码商业许可。
6. 生产使用前必须完成 SCA、许可证通知、源码/镜像版本锁定。

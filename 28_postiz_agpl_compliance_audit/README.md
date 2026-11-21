# Postiz AGPL-3.0 商用合规与闭源边界审计

| 项 | 内容 |
|---|---|
| 审计对象 | `https://github.com/gitroomhq/postiz-app` |
| 审计日期 | 2026-11-21 |
| 审计分支 | `main` |
| 基线 commit | `6be4874631fea453f99115a78fd543c71820ab45`（2026-11-20） |
| 最新正式 Release | `v2.26.0`，commit `132859f32d854830ce44b509da87409c3ec10a77`（2026-11-13） |
| LICENSE | AGPL-3.0；main 工作树 SHA-256 `5b557a1b…`（CRLF），内容归一化 SHA-256 `d322fb10…`，Git blob `24fd2279…`；v2.26.0 同一 blob |
| 审计性质 | **只读技术与许可证风险审计，不构成正式法律意见** |
| 最终建议 | **`ADOPT_WITH_ADAPTER`（有条件）**；若需要对外交付/托管闭源修改版、白标/OEM，则转 `ADOPT_WITH_COMMERCIAL_LICENSE`，且必须先取得书面授权 |

## 1. 最终结论

**不建议无条件 `ADOPT`。**

Postiz 主仓采用 AGPL-3.0，允许商业使用、收费和二次开发；但“开源许可”不等于“可以直接闭源商用”。同时，仓库还包含两个独立的第三方许可风险：

1. **Polotno**（前端图片编辑组件）为自定义商业许可：非商业产品可用，**商业使用必须购买许可**；仓库没有说明已包含该许可。
2. **Elasticsearch 7.17.27**（Temporal 栈）不是 OSI 开源许可证；作为托管服务/产品分发时需要单独审查。

因此推荐：

| 场景 | 建议 |
|---|---|
| 内部使用、保持 Postiz 原版、通过官方 Public API 集成、Adapter 独立闭源 | **`ADOPT_WITH_ADAPTER`**（条件满足时） |
| 需要对外交付/托管修改版并闭源、白标、OEM | **`ADOPT_WITH_COMMERCIAL_LICENSE`**（Postiz + Polotno 均需书面授权） |
| 不接受 AGPL 源码义务、无法取得 Polotno/Elasticsearch 许可、也不愿移除相关功能 | **`REJECT`** |

## 2. 七个核心问题的直接回答

| # | 问题 | 回答 | 标记 |
|---|---|---|---|
| 1 | 是否可以合法商用 Postiz？ | AGPL 允许商业使用与收费；但 Polotno 商业许可、Elasticsearch 许可、子包 license 元数据冲突必须先解决 | `CONDITIONAL` |
| 2 | 是否可以在 Postiz 基础上二次开发？ | 可以。私有修改且不传播、不提供远程交互可保持私有；对外分发修改版按 §5/§6，修改版远程服务按 §13 提供 Corresponding Source；不能把对外交付的修改版闭源 | `CONDITIONAL` |
| 3 | 是否可以将 Morrishk 和 Ds Bit 保持闭源？ | 若作为独立程序通过 HTTP/API 通信、不复制/链接 Postiz 代码、不共享进程/数据库，通常可保持独立；边界需律师确认 | `CONDITIONAL` / `LEGAL_REVIEW_REQUIRED` |
| 4 | 修改 Postiz 后作为 SaaS，是否必须提供修改版源代码？ | 是。AGPL §13 要求向所有远程交互用户 prominently offer Corresponding Source；范围是修改后的 Postiz 及其 Corresponding Source，不是当然包括独立 Morrishk 程序 | `CONDITIONAL` |
| 5 | 只用官方 API + 独立闭源 Adapter 是否更稳妥？ | 是当前最稳妥路径；Adapter 必须是独立进程、独立数据库、仅 HTTP 调用，不 import `@postiz/node` 或 Postiz 内部代码 | `CONDITIONAL` |
| 6 | 是否需要购买商业授权？ | 若对外交付/托管闭源修改版、白标/OEM，或要移除 AGPL 义务，需要 Postiz 书面商业授权；Polotno 商用另需其商业许可。Postiz 公开商业授权条款不足 | `UNKNOWN` / `LEGAL_REVIEW_REQUIRED` |
| 7 | 推荐哪种部署和集成架构？ | 方案 C：Postiz 原版独立部署 + 独立闭源 Adapter + 官方 Public API + 独立数据库；Postiz 源码零修改 | `CONDITIONAL` |

## 3. 关键事实

- Postiz 根 `LICENSE` 为 **GNU AGPL-3.0**，根 `package.json` 也声明 `AGPL-3.0`，README 明确写 “source code is available under the AGPL-3.0 license”。
- 最新 tag `v2.26.0` 与 main 的 `LICENSE` Git blob 相同（`24fd2279…`）；工作树 SHA 差异仅来自 CRLF/LF。
- **子包 license 元数据不一致**：`apps/backend`、`apps/frontend`、`apps/commands`、`apps/orchestrator` 声明 `ISC`；`apps/extension` 无 license；`apps/sdk` 声明 `AGPL-3.0`。根 LICENSE/README 仍为 AGPL。该冲突不能自行解释为“后端可闭源”，需维护方/律师确认。
- 第三方依赖（GitHub Dependency Graph SBOM，2026-11-21，3,358 包）：
  - MIT 2,519、Apache-2.0 424、ISC 130、BSD 系列 110；
  - MPL-2.0 16、LGPL 系列约 27、FSL-1.1-MIT 18（Sentry CLI）、自定义 Polotno 1；
  - 未发现除根项目外的 GPL/AGPL 运行时依赖。
- Postiz 官方提供 Public API；支持 API Key/OAuth token、草稿、排程、立即发布、状态、媒体、账号连接、分析；webhook 为最佳努力、无签名、无重试。
- Postiz Cloud/Enterprise 页面有商业服务，但**没有公开的 AGPL 商业授权/OEM 条款**；Enterprise 页面显示 $200–$8000/月且“暂不接受新申请”。
- Postiz 使用 Polotno 前端图片编辑；Polotno 许可证明确要求商业使用购买许可。安装依赖但未启用不是可靠免责；应购买许可或从依赖/产物/镜像完全移除。
- `docker-compose.yaml` 使用 `ghcr.io/gitroomhq/postiz-app:latest`，无法从 compose 文件本身锁定源码版本；生产必须 pin tag/digest 并提供对应源码。
- Docker 部署还包含 Temporal + Elasticsearch 7.17.27；镜像 label 明确为 ELv2，且 ELv2 限制托管服务。并非所有自托管场景都需要购买 Elastic 商业许可；对外托管需单独评估。Temporal 支持 PostgreSQL Advanced Visibility，替换 ES 是否不需改 Postiz 源码仍为 `UNKNOWN`，需非生产验证。

## 4. 本审计包文件

```text
28_postiz_agpl_compliance_audit/
  README.md
  LICENSE_FACTS.md
  AGPL_SECTION_ANALYSIS.md
  CLOSED_SOURCE_BOUNDARY.md
  ARCHITECTURE_OPTIONS.md
  COMMERCIAL_MODEL_ANALYSIS.md
  COMMERCIAL_LICENSE_OPTIONS.md
  RECOMMENDATION.md
  EVIDENCE_INDEX.md
  evidence/
    dependency-license-summary.json
    polotno-license.txt
    sentry-cli-license.txt
    elasticsearch-7.17.27-image-labels.json
    temporal-postgres-compose.yml
  SHA256SUMS.txt
```

### 4.1 自检

- 9 份 Markdown + 5 份证据文件；`SHA256SUMS.txt` 覆盖 14 个文件。
- `sha256sum -c SHA256SUMS.txt` 全部 OK。
- 全部文本为 LF，Markdown 表格列数检查通过。
- 本轮只新增 `28_postiz_agpl_compliance_audit/`；未修改其他目录。
- 未修改 Postiz/Morrishk/Ds Bit，未 Fork/部署/连接真实账号。

复算：

```bash
cd 28_postiz_agpl_compliance_audit
sha256sum -c SHA256SUMS.txt
```

## 5. R1–R3 修订记录

| 编号 | 修订 |
|---|---|
| R1 | 在 README/AGPL/COMMERCIAL/RECOMMENDATION 中统一区分：私有修改不传播、修改版内部网络、修改版 SaaS、修改版镜像/安装包分发、修改版闭源商业交付；对应 §2/§5/§6/§13 义务 |
| R2 | 补充 Elasticsearch 7.17.27 镜像 label（ELv2）、ELv2/SSPL 关系、Temporal Advanced Visibility 的 PostgreSQL/MySQL/SQLite 替代、Postiz 默认 compose 依赖与“是否必须”的边界；替换是否需改源码标 `UNKNOWN` |
| R3 | Polotno 按“启用/仅安装/完全移除/替换编辑器”四种场景拆分；补充两个入口：`designMedia`（有 `user.tier.ai && !dummy`）与 `showDesignModal`/Editor 按钮（无相同限制），以及 Dockerfile 单阶段构建证据；不再仅凭依赖存在推断所有部署都触发 |

## 6. 审计边界

本轮没有：

- 修改 Postiz、Morrishk、Ds Bit 或任何既有目录；
- Fork 或提交 Postiz 代码；
- 部署 Postiz；
- 创建 OAuth App 或连接真实社媒账号；
- 使用任何生产 Token/Secret/Cookie；
- 连接生产数据库；
- 执行发布或排程；
- 把任何 Contract Freeze/Business API 状态标记为通过；
- 作出正式法律意见。

所有 `LEGAL_REVIEW_REQUIRED` 事项必须在生产采用前由具备相应司法辖区资格的律师确认。

# 证据索引

审计日期：2026-11-21。  
基线：`6be4874631fea453f99115a78fd543c71820ab45`；最新 Release：`v2.26.0`（`132859f32d854830ce44b509da87409c3ec10a77`）。

| ID | 证据 | 位置/URL | 日期/版本 | 支持结论 |
|---|---|---|---|---|
| E-01 | Postiz 仓库 | `https://github.com/gitroomhq/postiz-app` | 2026-11-21 | 审计对象 |
| E-02 | main HEAD | `https://github.com/gitroomhq/postiz-app/commit/6be4874631fea453f99115a78fd543c71820ab45` | 2026-11-20 | 基线 commit |
| E-03 | 最新 Release | `https://github.com/gitroomhq/postiz-app/releases/tag/v2.26.0` | 2026-11-13 | 最新正式版本 |
| E-04 | LICENSE | `https://github.com/gitroomhq/postiz-app/blob/6be4874631fea453f99115a78fd543c71820ab45/LICENSE` | AGPL-3.0；blob `24fd2279…` | 主许可证 |
| E-05 | 根 package.json | `https://github.com/gitroomhq/postiz-app/blob/6be4874631fea453f99115a78fd543c71820ab45/package.json#L6` | AGPL-3.0 | 包声明 |
| E-06 | README 许可证段 | `https://github.com/gitroomhq/postiz-app/blob/6be4874631fea453f99115a78fd543c71820ab45/README.md#L146-L192` | 2026-11-21 | 官方许可证说明、Cloud/自托管对比 |
| E-07 | 子包 license | `apps/backend/package.json:13`、`apps/frontend/package.json:17`、`apps/commands/package.json:12`、`apps/orchestrator/package.json:13`、`apps/sdk/package.json:19` | v2.26.0 | 元数据冲突 |
| E-08 | Docker compose | `https://github.com/gitroomhq/postiz-app/blob/6be4874631fea453f99115a78fd543c71820ab45/docker-compose.yaml#L3` | `latest`；API_LIMIT 30 | 镜像/限流 |
| E-09 | 容器构建 workflow | `https://github.com/gitroomhq/postiz-app/blob/6be4874631fea453f99115a78fd543c71820ab45/.github/workflows/build-containers.yml` | tag push | 镜像 tag 与源码版本 |
| E-10 | GitHub Dependency Graph SBOM | `https://api.github.com/repos/gitroomhq/postiz-app/dependency-graph/sbom` | 生成 2026-11-21T07:46:10Z；SHA-256 `69d270e0…` | 第三方依赖 |
| E-11 | Polotno 许可 | `https://unpkg.com/polotno@3.0.0-beta.25/LICENSE.md` | 3.0.0-beta.25 | 商业使用需购买 |
| E-12 | Polotno 使用位置 | `package.json#L187`；`apps/frontend/src/components/launches/polonto.tsx#L12-L18`；`apps/frontend/src/components/media/media.component.tsx#L57-L58`、`#L865`、`#L1073-L1084`、`#L1138-L1141` | 2026-11-20 | 前端图片编辑；两个入口 |
| E-13 | Sentry CLI 许可 | `https://unpkg.com/@sentry/cli@2.58.6/LICENSE` | FSL-1.1-MIT | 构建工具许可 |
| E-14 | Elasticsearch 许可 | `https://www.elastic.co/licensing/elastic-license`；`https://www.elastic.co/pricing/faq/licensing`；`docker-compose.yaml` temporal-elasticsearch | 7.17.27；ELv2/SSPL | 非 OSI 许可；限制托管服务 |
| E-15 | Public API 控制器 | `apps/backend/src/public-api/routes/v1/public.integrations.controller.ts#L66` | 2026-11-20 | `/public/v1` 端点 |
| E-16 | Public API 认证 | `apps/backend/src/services/auth/public.auth.middleware.ts#L27-L51` | 2026-11-20 | API Key / `pos_` token |
| E-17 | 帖子 API | controller `#L135` `GET /posts`；`#L148` `POST /posts`；`#L237` DELETE；`#L689` PUT status | 2026-11-20 | 草稿/排程/发布/状态 |
| E-18 | 媒体 API | controller `#L82` upload；`#L105` upload-from-url；`#L260/284` media/status | 2026-11-20 | 媒体上传 |
| E-19 | 账号连接 API | controller `#L322` integrations；`#L346` social；`#L413` connect | 2026-11-20 | 账号连接 |
| E-20 | 分析 API | controller `#L715` analytics integration；`#L725` analytics post | 2026-11-20 | 基础分析 |
| E-21 | 限流 | `apps/backend/src/app.module.ts#L39`；`libraries/nestjs-libraries/src/throttler/throttler.provider.ts`；`docker-compose.yaml#L98` | 默认 90；compose 30 | API 限流 |
| E-22 | 多租户模型 | `libraries/nestjs-libraries/src/database/prisma/schema.prisma#L11-L49` Organization；`#L370` Integration；`#L460` Post；`#L654` Webhooks | 2026-11-20 | Organization 隔离 |
| E-23 | Webhook 实现 | `apps/orchestrator/src/activities/post.activity.ts#L589-L630` | 2026-11-20 | best-effort、无签名、无重试 |
| E-24 | Public API 文档 | `https://docs.postiz.com/public-api`；`https://docs.postiz.com/public-api/introduction`；`https://docs.postiz.com/public-api/oauth`；`https://docs.postiz.com/public-api/analytics` | 2026-11-21 | 认证/限流/帖子/分析 |
| E-25 | Enterprise | `https://postiz.com/enterprise` | 2026-11-21 | $200–$8000/mo；暂不接受新申请 |
| E-26 | Postiz Terms | `https://postiz.com/terms` | 2026-11-21 | §7 转售/白标；§10 商标 |
| E-27 | 定价 | `https://postiz.com/pricing` | 2026-11-21 | Cloud 计划；自托管说明 |
| E-28 | GNU AGPL-3.0 | `https://www.gnu.org/licenses/agpl-3.0.html` | 2007 | §0/1/5/6/13/14 原文 |
| E-29 | GNU GPL FAQ | `https://www.gnu.org/licenses/gpl-faq.html` | 2026-11-21 | modified network source；sockets/separate programs |
| E-30 | `@postiz/node` SDK | `apps/sdk/package.json#L19`；`apps/sdk/README.md` | AGPL-3.0 | 不应直接 import 到闭源 Adapter |
| E-31 | Prisma schema 数据模型 | `libraries/nestjs-libraries/src/database/prisma/schema.prisma` | 2026-11-20 | Organization/Integration/Post/Webhook |
| E-32 | Dockerfile | `Dockerfile.dev` | 2026-11-20 | 生产镜像由 dev Dockerfile 构建 |
| E-33 | Elasticsearch 7.17.27 镜像许可 | `library/elasticsearch:7.17.27`；amd64 digest `sha256:07e9262b…`；labels `Elastic-License-2.0`；`evidence/elasticsearch-7.17.27-image-labels.json` | 2026-11-21 | 镜像发行许可 |
| E-34 | Temporal Visibility | `https://docs.temporal.io/self-hosted-guide/visibility`；`https://github.com/temporalio/docker-compose/blob/main/docker-compose-postgres.yml`；`evidence/temporal-postgres-compose.yml` | 2026-11-21 | SQL Advanced Visibility 可替代 ES；Postiz 默认 compose 仍用 ES |
| E-35 | Polotno 调用路径 | `apps/frontend/src/components/media/media.component.tsx#L57-58` 动态 import；`#L865` `designMedia()` gate `user.tier.ai`；`#L1073-1084` `showDesignModal()` 直接 `<Polonto>`；`#L1138-1141` Editor 按钮；`polonto.tsx#L12-18` 组件 import；`Dockerfile.dev#L22-25` 单阶段 COPY + pnpm install | 2026-11-20 | 两个入口；启用/未启用/移除判断 |

## 复算命令

```bash
# LICENSE
cd postiz-audit
sha256sum LICENSE
git rev-parse HEAD:LICENSE
git show v2.26.0:LICENSE | sha256sum
python - <<'EOF'
import hashlib
b=open('LICENSE','rb').read()
print(hashlib.sha256(b).hexdigest())
print(hashlib.sha256(b.replace(b'\r\n',b'\n')).hexdigest())
EOF

# SBOM
curl -sSL -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/gitroomhq/postiz-app/dependency-graph/sbom" \
  -o postiz-sbom.json
sha256sum postiz-sbom.json

# 依赖统计（需 PyYAML）
python - <<'EOF'
import json,collections
d=json.load(open('postiz-sbom.json',encoding='utf-8'))
print(len(d['sbom']['packages']))
EOF
```

## 证据限制

1. GitHub SBOM 由 GitHub Dependency Graph 生成，不等同于本地实际构建镜像的完整 SCA。
2. 官方文档页面可能随版本变化；以上为 2026-11-21 读取内容。
3. Enterprise 价格/可用性来自公开页面，未取得销售合同文本。
4. 未读取任何真实客户合同、账号后台、Token 或生产环境。
5. 本索引不构成法律意见；`LEGAL_REVIEW_REQUIRED` 项必须由律师复核。

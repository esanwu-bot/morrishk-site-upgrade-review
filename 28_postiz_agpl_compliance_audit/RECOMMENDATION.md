# 最终建议

## 0. 结论

**`ADOPT_WITH_ADAPTER`（有条件）。**

不建议无条件 `ADOPT`。如果业务要求“闭源修改 Postiz + 白标/OEM”，则升级为 **`ADOPT_WITH_COMMERCIAL_LICENSE`**；如果既不能接受 AGPL 源码义务，也不能取得 Postiz/Polotno/Elasticsearch 许可，则 **`REJECT`**。

本建议的前提：

1. Postiz 保持**原版**，不修改源码；
2. Morrishk/Ds Bit 通过**独立 Adapter** 与 Postiz 的官方 Public API 集成；
3. Adapter 独立进程、独立数据库、仅 HTTP，不 import `@postiz/node` 或 Postiz 内部代码；
4. 解决 **Polotno** 商业许可或移除该功能；
5. 审查 **Elasticsearch** 许可或替换；
6. 生产前由律师复核 AGPL 边界、SaaS 定性、商标与第三方许可。

## 1. 七个问题的直接回答

### 问题 1：是否可以合法商用 Postiz？

**`CONDITIONAL`**

- AGPL-3.0 允许商业使用和收费；这一点是 `CONFIRMED`（AGPL 层面）。
- 但 Postiz 仓库包含 Polotno 自定义商业许可、Elasticsearch 非 OSI 许可，且子包 license 元数据冲突。
- 因此“可以商用”必须加上条件：解决 Polotno/ES 许可、按 AGPL 履行源码/通知义务、律师确认。

### 问题 2：是否可以在 Postiz 基础上二次开发？

**`CONDITIONAL`**

- 可以；修改版必须按 AGPL 提供 Corresponding Source。
- 如果希望修改版闭源，必须取得 Postiz 书面商业授权；公开证据未确认可获得。
- Polotno 仍适用。

### 问题 3：是否可以将 Morrishk 和 Ds Bit 保持闭源？

**`CONDITIONAL` / `LEGAL_REVIEW_REQUIRED`**

- 如果 Morrishk/Ds Bit 是独立程序，通过 HTTP/API 与 Postiz/Adapter 通信，且不复制/链接 Postiz 代码、不共享进程/数据库，通常可以保持闭源。
- 如果把它们放入 Postiz 仓库/进程/数据库，或使用 Postiz 内部接口形成组合程序，风险显著上升，可能需要按 AGPL 开源相关部分。
- 没有“微服务/容器自动安全”的法律保证。

### 问题 4：Postiz 修改后作为 SaaS，是否需要提供修改版源代码？范围是什么？

**`CONDITIONAL`**

- 是。AGPL §13：修改版必须向所有远程交互用户显著提供 Corresponding Source 的获取机会。
- 范围：修改后的 Postiz 及其 Corresponding Source（含构建/运行脚本、Dockerfile、迁移、必要接口定义）。
- 不当然包括独立的 Morrishk/Ds Bit/Adapter；但如果它们与 Postiz 构成同一作品，范围可能扩大。
- 未修改的 SaaS 不因 §13 触发；但 SaaS 定性/§0 conveying 仍需律师确认。

### 问题 5：只使用官方 API、独立开发闭源 Adapter，是否更稳妥？

**`CONDITIONAL`（推荐路径）**

- 是当前最稳妥的工程路径。
- 前提：
  - Adapter 独立进程/容器/DB；
  - 只调用 `/public/v1`；
  - 不 import `@postiz/node`（AGPL SDK）；
  - 不复制 Postiz 代码；
  - 不修改 Postiz；
  - webhook 只作提示，必须 API 回查；
  - 每租户独立 Postiz Organization/API Key。
- 仍需律师确认 Adapter 与 Postiz 的作品边界。

### 问题 6：是否需要购买商业授权？什么情况下才需要？

**`UNKNOWN` / `CONDITIONAL`**

| 情形 | 是否需要 Postiz 商业授权 |
|---|---|
| 原版自托管 + 独立 Adapter + 遵守 AGPL | 通常不需要 Postiz 商业授权；但需律师确认 |
| 修改 Postiz 并闭源 | 需要（AGPL 不允许闭源修改版） |
| 白标/OEM/转售 Postiz | 需要书面商业/OEM 授权 |
| 交付修改版给客户 | 需要 AGPL 开源或商业授权 |
| 仅内部使用原版 | 通常不需要；Polotno/ES 仍另算 |

Polotno 商业许可在“商业使用且保留 Polotno”时**需要**，与 Postiz 商业授权独立。

### 问题 7：建议采用哪一种部署和集成架构？

**`ADOPT_WITH_ADAPTER` → 方案 C**

```text
Morrishk UI/API（闭源）
   │ 内部认证
   ▼
Postiz Adapter（闭源、独立进程/DB）
   │ HTTPS + Postiz Public API（API Key）
   ▼
Postiz（原版 AGPL、独立部署、固定 v2.26.0/digest、独立 DB）
   │ 官方平台 OAuth
   ▼
LinkedIn / Facebook / X / YouTube / TikTok
```

## 2. 上线前置条件

以下全部满足前，不得进入生产：

1. **许可证法律意见**：AGPL 边界、SaaS 定性、Adapter 独立性、聚合/组合判断。
2. **Polotno**：购买商业许可，或移除编辑器/依赖/打包产物；保留证据。
3. **Elasticsearch**：确认 Elastic License 对托管模式的适用性，或替换 Temporal visibility。
4. **子包 license 冲突**：向 Gitroom 取得书面澄清，或按 AGPL 处理。
5. **Postiz 版本锁定**：固定 `v2.26.0` tag 或 image digest；禁止 `latest`。
6. **源码归档**：保存对应 Postiz 源码、LICENSE、构建脚本、NOTICE；如对外分发镜像，准备 §6 源码提供方式。
7. **Adapter 架构评审**：独立进程/DB、无 Postiz 代码 import、无内部接口、无共享 schema。
8. **多租户设计**：每租户一个 Organization/API Key；禁止超级管理员 Key 跨租户。
9. **审批门禁**：`SOCIAL_CONTENT_APPROVED` 在 Adapter 内强制执行；Postiz DRAFT 不是审批。
10. **安全**：Postiz API Key/Token 加密、轮换、吊销；不写日志；不进入 Morrishk 前端。
11. **SCA/NOTICE**：对实际镜像/构建产物做完整依赖许可证扫描，生成第三方通知。
12. **商标**：不使用 Postiz 名称/Logo 做白标或官方暗示，除非书面许可。
13. **数据/合同**：客户内容、平台 Token、分析数据的归属/处理/删除条款。
14. **可替换性**：Adapter 与 Postiz 解耦，保留迁移到其他后端的退出方案。

## 3. 需要律师确认的问题

1. 未修改 Postiz 的收费 SaaS 是否构成 conveying？§13 是否适用？
2. 修改 Postiz 后，§13 的“all users”是否包括内部员工/客户/试用用户？
3. 独立 HTTP Adapter 是否可能被认定为 Postiz 的衍生/组合程序？
4. 共享 Postiz 数据库/Prisma schema 是否会使 Adapter 成为组合程序？
5. 使用 `@postiz/node` AGPL SDK 是否会使 Adapter 受 AGPL？
6. 交付 Docker 镜像时，Corresponding Source 的最小充分范围？
7. Postiz 子包 ISC 与根 AGPL 冲突的法律解释。
8. Polotno 商业许可是否覆盖 SaaS/多租户/白标/再分发。
9. Elasticsearch 许可证是否允许托管 Postiz。
10. Postiz 商标/白标条款与 AGPL 修改权的边界。

## 4. 明确不做的事

- 不修改 Postiz 源码；
- 不 Fork 提交；
- 不部署生产；
- 不创建 OAuth App；
- 不连接真实社媒账号；
- 不购买任何商业许可；
- 不把本审计当作法律意见；
- 不宣布 Postiz 已被批准采用。

## 5. 最终裁定

| 选项 | 裁定 |
|---|---|
| `ADOPT` | 不采用（不是无条件合规） |
| `ADOPT_WITH_ADAPTER` | **建议，有条件** |
| `ADOPT_WITH_COMMERCIAL_LICENSE` | 若闭源修改/白标/OEM，作为备选，需书面授权 |
| `REJECT` | 若无法接受 AGPL/Polotno/ES 义务，则采用 |

**建议下一步：** 由项目负责人/法务决定是否接受“原版 Postiz + 独立 Adapter”的边界；在取得律师意见和 Polotno/ES 结论前，不进入生产实施。

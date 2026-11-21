# AGPL-3.0 条款分析

> 本文件是技术与许可证风险分析，不是正式法律意见。所有涉及衍生作品、组合程序、SaaS 是否构成 conveying 的判断，均需 `LEGAL_REVIEW_REQUIRED`。

引用依据：Postiz 仓库 `LICENSE`（Git blob `24fd2279…`）与 GNU 官方 AGPL-3.0 文本 `https://www.gnu.org/licenses/agpl-3.0.html`。本地行号来自 `LICENSE`。

## 1. Section 0：定义

原文（`LICENSE:61-99`）：

- “To ‘propagate’ a work means to do anything with it that, without permission, would make you directly or secondarily liable for infringement under applicable copyright law, except executing it on a computer or modifying a private copy.”
- “To ‘convey’ a work means any kind of propagation that enables other parties to make or receive copies. **Mere interaction with a user through a computer network, with no transfer of a copy, is not conveying.**”
- “To ‘modify’ a work means to copy from or adapt all or part of the work in a fashion requiring copyright permission... The resulting work is called a ‘modified version’.”
- “A ‘covered work’ means either the unmodified Program or a work based on the Program.”

要点：

1. **内部运行**本身不等于 conveying；修改私有副本本身也不当然等于 conveying。
2. **SaaS 远程交互**不一定等于 conveying；但 AGPL §13 对“修改版 + 网络用户”另有义务。
3. **修改**的范围比“改文件”更广：复制/适配后形成基于该作品的新作品，也可能构成 modified version。

## 2. Section 1：Corresponding Source

原文（`LICENSE:122-137`）：

> “The ‘Corresponding Source’ for a work in object code form means all the source code needed to generate, install, and (for an executable work) run the object code and to modify the work, including scripts to control those activities.”

并明确包括：

- “interface definition files associated with source files for the work”；
- “the source code for shared libraries and dynamically linked subprograms that the work is specifically designed to require, such as by intimate data communication or control flow”。

不包括：

- System Libraries；
- 通用工具/一般可得的自由程序（未修改且不属于作品）；
- 用户可自动从 Corresponding Source 重新生成的内容。

推论（需律师确认）：

- 修改 Postiz 后，Corresponding Source 至少包括修改后的前端、后端、构建脚本、Dockerfile、迁移、必要配置模板，以及为运行/修改所需的接口定义。
- **不当然包括**独立的 Morrishk 主站、Ds Bit API、独立 Adapter；但若它们与 Postiz 形成单一组合程序、共享内部接口/进程/数据库，则可能被纳入。
- 客户数据、数据库内容、Secret 不属于源代码，不需要作为 Corresponding Source 提供，但受隐私/合同约束。

## 3. Section 2：Basic Permissions

原文（`LICENSE:141-160`）：

- “This License explicitly affirms your unlimited permission to run the unmodified Program.”
- “You may make, run and propagate covered works that you do not convey, without conditions so long as your license otherwise remains in force.”

含义：

- 公司内部运行 **未修改** Postiz，不因 AGPL 自动产生对外源码义务。
- 私有修改、内部使用，在未 conveying 的情况下，通常不触发 §5/§6；但 §13 可能对“修改版 + 网络用户”触发。
- 商业收费本身不被禁止；AGPL 是自由软件许可证，不是非商业许可证。

## 4. Section 4：Verbatim Copies

原文（`LICENSE:183-195`）：

- 可以复制和分发 Program 的 verbatim source，但必须保留许可证、版权声明、免责声明，并随附许可证副本。
- 若分发 object code 的 verbatim copy，仍需按 §6 提供 Corresponding Source。

与 Morrishk 的相关性：

- 直接分发**未修改** Postiz 源码/镜像，也必须保留 AGPL 通知并提供许可证；如果分发镜像，还要提供 Corresponding Source。
- 不能把 Postiz 的版权/许可证头删除或替换成 Morrishk 的闭源许可证。

## 5. Section 5：Conveying Modified Source Versions

原文（`LICENSE:196-232`）：

- 修改版源码必须带“你修改了它”的显著通知和日期；
- 必须带“按本许可证发布”的通知；
- 必须把**整个作品**按 AGPL 授权给任何获得副本的人；
- 交互界面必须显示 Appropriate Legal Notices；
- 与其他独立作品的“aggregate”不会自动让其他部分适用 AGPL，前提是它们不是 covered work 的扩展、没有组合成更大程序。

关键：

1. **修改 Postiz 并分发源码**：整个修改作品按 AGPL；不能闭源。
2. **修改 Postiz 并分发镜像/二进制**：还要满足 §6。
3. **Aggregate**：把独立程序与 Postiz 放在同一介质/服务器上，不自动感染；但“aggregate”与“combined work”的边界是事实与法律问题，不能仅靠目录/容器划分。

## 6. Section 6：Conveying Non-Source Forms

原文（`LICENSE:233-270`）：

- 分发 object code（二进制、Docker 镜像、安装包）必须同时以以下方式之一提供 Corresponding Source：
  - 物理介质；
  - 至少三年有效的书面要约；
  - 网络服务器免费提供；
  - 指定地点等价访问；
- 对 User Products，还需 Installation Information（除非无法修改）。

与 Morrishk 的相关性：

- 如果 Morrishk 向客户交付 Postiz Docker 镜像/安装包，**无论是否修改**，都必须提供 Corresponding Source。
- 如果 Morrishk 只在自己的服务器上运行、不向客户交付副本，§6 不适用；此时看 §13。
- 客户自行从上游拉取镜像，通常由上游履行其分发义务；Morrishk 不应假设客户拉取行为自动免除自身义务，需看合同/交付方式。

## 7. Section 7：Additional Terms

原文（`LICENSE:331-...`）：

- 允许添加与 AGPL 不冲突的附加条款（如 attribution、trademark、warranty disclaimer）；
- 不得对 AGPL 授予的权利施加额外限制；
- 若附加条款与 AGPL 冲突，以 AGPL 为准。

与 Postiz 的相关性：

- Postiz 的商标/品牌条款（Terms §10）可以与 AGPL 并存，但 AGPL 不授予商标许可。
- 白标/去品牌化需要单独确认商标使用；不能仅凭 AGPL 使用 Postiz 名称/Logo。
- 任何“禁止客户查看源码/禁止再分发”的合同条款，不能对抗 AGPL 赋予用户的权利。

## 8. Section 10：Automatic Licensing of Downstream Recipients

原文（`LICENSE:434-...`）：

- 每个接收者自动从原始许可方获得许可证；
- 不得对接收者行使 AGPL 权利施加进一步限制；
- 不得发起专利诉讼阻止对方行使权利。

含义：

- 一旦 Morrishk 向客户分发 Postiz（源码或镜像），客户自动获得 AGPL 权利；Morrishk 不能通过 EULA 禁止客户复制/修改/再分发该 AGPL 部分。
- 这与 Morrishk 对自有闭源代码的许可可以并存，但必须区分作品边界。

## 9. Section 13：Remote Network Interaction

原文（`LICENSE:540-560`）：

> “Notwithstanding any other provision of this License, **if you modify the Program, your modified version must prominently offer all users interacting with it remotely through a computer network** (if your version supports such interaction) **an opportunity to receive the Corresponding Source of your version** by providing access to the Corresponding Source from a network server at no charge, through some standard or customary means of facilitating copying of software.”

要点：

1. 触发条件：**修改了 Postiz**，且修改版支持远程网络交互。
2. 义务对象：**所有远程交互用户**，不限于付费客户/公众；内部员工使用也算用户。
3. 义务内容：**显著地提供获取 Corresponding Source 的机会**；不是“放在 GitHub 某个角落”即可，需要在产品界面/服务入口显著展示。
4. 范围：修改版 Postiz 的 Corresponding Source；是否包括独立 Adapter/Morrishk 代码，取决于是否构成同一作品。
5. 未修改的 Postiz SaaS：§13 不以“修改”为触发条件；但 §0 的 conveying 与 §6 仍需结合交付方式判断。`LEGAL_REVIEW_REQUIRED`。

## 10. Section 14：Revised Versions

- Postiz LICENSE 使用 “either version 3 of the License, or (at your option) any later version”。
- 可以选择 AGPL v3 或后续版本；若选择后续版本，需接受其新增义务。
- 不得把“AGPL v3”简写成“AGPL”而忽略版本选择。

## 11. 十个 AGPL 问题的回答

| # | 问题 | 回答 | 标记 |
|---|---|---|---|
| 1 | 原版 Postiz 自托管供公司内部使用，是否需对外公开源码？ | 未修改、未 conveying 时通常不需要对外公开；内部使用不等于分发。若修改并在内部网络供员工远程使用，§13 可能要求向这些用户提供源码 | `CONDITIONAL` |
| 2 | Postiz 未修改，但作为收费 SaaS 提供给客户，义务是什么？ | AGPL 允许收费；未修改时 §13 不触发；若只提供网络交互、不交付副本，通常不因 §6 触发源码义务。但“SaaS 是否 conveying”存在解释空间 | `CONDITIONAL` / `LEGAL_REVIEW_REQUIRED` |
| 3 | 修改 Postiz 后作为 SaaS，§13 义务是什么？ | 必须向所有远程交互用户显著提供修改版 Corresponding Source 的获取机会 | `CONDITIONAL` |
| 4 | 向客户提供修改版 Docker 镜像/安装包，义务是什么？ | §5（修改源码按 AGPL）+ §6（object code 随附 Corresponding Source）；不得闭源 | `CONDITIONAL` |
| 5 | 是否必须公开所有公司源代码？ | 不是。义务范围是 covered work / Corresponding Source；独立 Morrishk/Ds Bit 程序通常不在内，但组合关系需律师判断 | `LEGAL_REVIEW_REQUIRED` |
| 6 | 是否只需提供 Postiz 对应的 Corresponding Source？ | 对 Postiz 修改版，是；但若 Adapter/业务代码与 Postiz 构成同一作品，范围可能扩大 | `CONDITIONAL` |
| 7 | Postiz 修改代码、插件、Adapter、API 调用方分别如何判断？ | 修改代码=AGPL；同进程插件/内部库=高风险；独立 HTTP Adapter/API 调用方=较低风险但需事实审查 | `CONDITIONAL` |
| 8 | 哪些情形构成衍生作品或组合程序？ | 复制/改编、链接/共享内部接口、同进程加载、共享数据库/构建、为 Postiz 专门设计且紧密耦合；需律师判断 | `LEGAL_REVIEW_REQUIRED` |
| 9 | 哪些只是独立程序通信？ | 独立进程、独立数据库、通过 HTTP/socket/CLI 的明确定义接口通信，且不复制/链接 Postiz 代码 | `CONDITIONAL` |
| 10 | AGPL 是否允许商业收费、商业托管、企业内部使用？ | 允许商业收费和托管；企业内部使用也允许；但必须满足 AGPL 的源码/通知义务，且第三方许可（Polotno/Elasticsearch）另行处理 | `CONFIRMED`（AGPL 层面） |

## 12. 源码义务触发矩阵

| 场景 | 修改 Postiz | 向客户交付副本/镜像 | 远程用户交互 | §13 | §6 | 结论 |
|---|---|---|---|---|---|---|
| 内部自用，原版 | 否 | 否 | 可能（员工） | 不触发 | 不触发 | 无源码义务 |
| 内部自用，修改版 | 是 | 否 | 是（员工） | 触发 | 不触发 | 向员工提供源码 |
| 收费 SaaS，原版 | 否 | 否 | 是 | 不触发（按 §13 文义） | 不触发 | 法律解释待确认 |
| 收费 SaaS，修改版 | 是 | 否 | 是 | 触发 | 不触发 | 向所有用户提供源码 |
| 私有化交付原版镜像 | 否 | 是 | 是 | 不触发 | 触发 | 随镜像提供源码 |
| 私有化交付修改版镜像 | 是 | 是 | 是 | 触发（如支持网络） | 触发 | 修改版源码 + 镜像源码 |
| 只提供独立 Adapter，不改 Postiz | 否 | 否 | 是 | 不触发 | 不触发 | Adapter 可独立闭源（需律师确认） |

> 上表是风险分析，不是法律裁定；“原版 SaaS 不触发 §13”仅按条文文义，仍需律师确认 §0/§6 与当地法下的 conveying 解释。

## 13. 结论

- AGPL **允许商业使用和收费**，不是“禁止商用”。
- 真正的风险在：修改版的源码提供义务、镜像/安装包分发义务、以及“什么算同一作品”。
- 最稳妥的闭源边界是：**不修改 Postiz、不把 Morrishk 代码放入 Postiz 进程/仓库、通过独立 HTTP Adapter 集成、独立数据库、独立部署**。
- 任何“微服务隔离绝对安全”的说法都不成立；必须结合代码/进程/数据/构建关系做事实审查。
- 由于 Polotno 和 Elasticsearch 的独立许可，Postiz 的 AGPL 合规只是整个商用合规的一部分。

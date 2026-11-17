# 15 · Phase 1 Mock UI（产品身份与分类治理）

| 项 | 值 |
|---|---|
| 交付编号 | MRH-PHASE1-MOCK-001 |
| 版本 | v1.2（新增契约候选测试与验收包；Mock UI 资产未改） |
| 日期 | 2026-11-17 |
| 性质 | 交互界面 + 本地 Mock；**不是**生产实现、不是契约冻结、不是部署 |
| 决策依据 | `14_phase0_authority_adjudication/` 中 IQ-01 / IQ-02 / IQ-13 书面裁定；`12_` v1.3 |
| 运行方式 | 纯静态文件 + 浏览器内 Mock，无后端、无数据库、无网络请求 |

---

## 1. 目的与边界

本目录把 Phase 0 的三项裁定做成可操作的演示界面，用于确认交互与数据形状：

- 产品身份使用 `MPN + Brand`，跨系统键为 `product_business_key`；
- `prod-{document_id}` / `document_id` 只作为来源文档凭证，不作为产品身份；
- 技术参数分类（Ds Bit 管理）与业务导航分类（Morrishk 新平台 `pd_category`）分离展示；
- 目标系统是 Morrishk 新平台业务库，`platform_model_id` 仅作内部主键示意。

**不包含**：生产 Business API、OAuth2、真实数据库、真实 Ds Bit 解析、真实发布/撤回、
正式技术分类种子。所有数据均为 `DEMO_FIXTURE`。

---

## 2. 文件清单

| 文件 | 作用 |
|---|---|
| `index.html` | 8 个视图：产品身份、MPN 归一化、身份冲突、技术参数字典、两套分类、平台映射、Mock API、同步与重试 |
| `assets/mpn-normalizer.js` | `MPN-NORM-v1` 参考实现（UMD；含纯 JS SHA-256），浏览器与 Node 共用 |
| `assets/mock-api.js` | 客户端 Mock API：统一响应包、错误场景、搜索分页、同步重试 |
| `assets/app.js` | 视图渲染与交互控制 |
| `assets/styles.css` | 样式与状态徽标 |
| `data/mock-products.json` | 8 条构造产品记录（含 2 条待确认） |
| `data/mock-dictionary.json` | 3 条演示参数定义 |
| `data/mock-taxonomies.json` | 技术分类树、导航分类树、映射候选行 |
| `tests/mpn-normalizer.test.js` | 归一化与业务键单元测试（22 项） |
| `tests/mock-api.test.js` | Mock API 与同步重试单元测试（20 项） |
| `tests/contract-candidate.test.js` | 契约候选一致性测试（19 项，只读 `12_/contract/openapi.candidate.v1.json`） |
| `ACCEPTANCE_PACKAGE.md` | Phase 1 验收包：8 视图、测试/冒烟/哈希、IQ 清单、契约候选与未获批准项 |
| `TEST_REPORT.md` | 实际执行的测试与浏览器冒烟结果 |
| `DELIVERY_REPORT.md` | 交付清单、Diff 摘要、未决项、禁止事项确认 |
| `SHA256SUMS.txt` | 本目录文件校验清单 |

---

## 3. 运行方式

```bash
cd 15_phase1_mock_ui
python -m http.server 8777 --bind 127.0.0.1
```

浏览器打开 `http://127.0.0.1:8777/index.html`。

> 不能直接双击 `index.html`（`file://`）。页面通过 `fetch` 读取 JSON，需要 HTTP 源。

运行测试：

```bash
node --test tests/mpn-normalizer.test.js tests/mock-api.test.js tests/contract-candidate.test.js
```

---

## 4. 演示步骤

1. **产品身份**：默认列出 8 条记录。点击任一行，右侧显示 `mpn_raw → mpn_norm`、
   `brand_raw → brand_norm`、`product_business_key`、技术参数与 `evidence_ids`、
   来源文档（`role=SOURCE_DOCUMENT`）、平台映射。
2. **同一 MPN 不同 Brand**：对比 `LM358DR / Example Semiconductor` 与
   `LM358DR / Texas Instruments`，两者 `product_business_key` 不同。
3. **MPN 归一化**：把 MPN 改为 `  lm358dr  `、Brand 改为 `Example  Semiconductor`，
   观察 trim、空白折叠、大写；点击「载入边界样例」，观察零宽字符移除、
   全角空格折叠、Unicode 连字符转 ASCII `-`（`LM–358DR → LM-358DR`）。
4. **冲突检测**：右侧候选表固定演示 `LM358DR`、` lm358dr `、`LM358D` 三条；
   前两条归一为同一身份，第三条产生第二个键，聚合状态为 `PENDING_CONFLICT`
   （输出同时列出 `mpn_norms` / `brand_norms` / `keys`）。
5. **身份冲突队列**：显示 `PENDING_BRAND`（缺 Brand）与 `PENDING_CONFLICT`（互斥 MPN）；
   操作按钮禁用，标注「待 Phase 2 人工确认」。
6. **技术参数字典**：表格显示治理字段；点击一行加载到编辑区，修改 `display_name` /
   `status` 后点「模拟保存」，提示仅内存更新、未写数据库。刷新即还原。
7. **两套分类**：左树为 Ds Bit 技术分类（节点带参数编码），右树为 `pd_category`
   导航分类（节点带 URL）；下方映射表展示 `morrishk_target=PLATFORM_PD` 与审核状态。
8. **平台映射**：显示 `product_business_key`、MPN、Brand、`platform_model_id`（内部）、
   `mapping_status` / `mapping_source`；`NE555P` 无平台 ID、状态 `PROPOSED`。
9. **Mock API**：选择场景后发送，查看请求行（Token 已 REDACTED）与响应包。
   覆盖 200 / 401 / 403 / 404 / 409 / 410 / 422 / 429 / 503、搜索与分页；
   搜索场景可验证非法输入：MPN 含控制字符或归一后为空 → `400 INVALID_ARGUMENT`
   （`field=mpn`），Brand 含控制字符 → `400 INVALID_ARGUMENT`（`field=brand`），
   Brand 缺失或归一后为空 → `422 PRODUCT_IDENTITY_INCOMPLETE`。
10. **同步与重试**：`pageSize=2`、`failAtPage=2`、`maxRetries=2`，运行后依次出现
    `OK → ERROR 503 → ERROR 503 → OK → DONE`，重试停留在同一页，退避 300/600ms。

---

## 5. 归一化规则（`MPN-NORM-v1`，PROPOSED）

| 步骤 | 规则 |
|---|---|
| 输入检查 | 仅接受字符串；拒绝 C0 控制字符（TAB/LF/CR 除外）、DEL、孤立代理项 |
| Unicode | NFKC 规范化；移除零宽字符（U+200B–U+200D、U+FEFF） |
| 空白 | 去首尾；内部连续空白折叠为**单个 ASCII 空格**（含 NBSP、全角空格）；不删除内部空格 |
| 大小写 | 统一大写 |
| 连接符 | Unicode 破折号（U+2010–U+2015、U+2212、U+FF0D）转为 ASCII `-`；保留 `- / _ .` |
| 品牌后缀 | 不剥离、不做别名合并 |
| 空值 | MPN 为空 → `INVALID`；Brand 缺失/为空 → `PENDING_BRAND` |
| 冲突 | 候选集中出现多个 `mpn_norm`、多个 `brand_norm` 或多个业务键 → `PENDING_CONFLICT`，不自动合并；判定覆盖**所有可归一候选**，包括缺 Brand 的候选 |
| 空候选集 | `normalizeCandidates([])` → `INVALID` / `NO_CANDIDATES`，不返回 `CONFIRMED` |
| 原始值 | 始终保留 `mpn_raw` / `brand_raw` 与 `normalizer_version` |

业务键：

```text
canonical = "PBK1\n" + len(mpn_norm) + ":" + mpn_norm + "\n"
                 + len(brand_norm) + ":" + brand_norm
key       = "pbk1_" + lowercase_hex(sha256(UTF-8(canonical)))
```

`len()` 为 UTF-8 **字节长度**；输出固定 69 字符（5 + 64），不做截断。

> 该规则是 `PROPOSED`，不是已冻结标准；任何调整必须提升 `normalizer_version` 并重新评审。
> 测试结果只证明实现与当前 `12_` 示例一致，不证明规则本身已被业务批准。

---

## 6. Fixture 隔离

- 所有 JSON 顶层含 `dataset: "DEMO_FIXTURE"`；API 响应 `meta.fixture = "DEMO_FIXTURE"`。
- 字典项 `source = "DEMO_FIXTURE"`、`dictionary_version = 0`、`status = DRAFT`；
  页面顶部与字典页均有醒目提示。
- 产品记录 `updated_at` / `document_sha256` 为构造值，**不是**真实解析产物。
- 不写入任何数据库、不导入正式字典、不初始化分类树。
- 测试通过仅代表 Mock 行为符合设计声明，**不代表**真实数据验证通过。

---

## 7. 已知限制

1. 所有逻辑在浏览器内运行，没有鉴权、租户、审计或持久化。
2. 字典编辑只改内存对象，刷新丢失。
3. 游标 `demo_<offset>` 仅用于演示，正式游标形态未裁定（`OPEN`）。
4. Mock 响应体现契约方向，但契约本身**未冻结**；错误码、分页、字段仍可能调整。
5. 未实现 Ds Bit 解析、文档上传、发布审批与撤回流程。
6. Mock 的 `visible_state` 使用 `RELEASED` / `PENDING` / `REVOKED`，是演示简化；
   契约枚举为 `DRAFT` / `IN_REVIEW` / `RELEASED` / `WITHDRAWN`。该差异是契约冻结阻断项，
   不得据此修改契约或声称已对齐。
7. 本目录整体验收状态为 `PENDING_REVIEW`；`PASS_MOCK` 只能由独立 Reviewer 复核后填写，
   见 `ACCEPTANCE_PACKAGE.md`。

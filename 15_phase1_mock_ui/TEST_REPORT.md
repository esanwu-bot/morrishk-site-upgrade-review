# TEST REPORT · Phase 1 Mock UI

| 项 | 值 |
|---|---|
| 日期 | 2026-11-17 |
| 环境 | Windows 10.0.19045 x64；Node.js v24.21.0；Python 3（仅静态文件服务器）；浏览器经 browser-use 驱动 |
| 被测对象 | `15_phase1_mock_ui/` |
| 结论 | 单元测试 42/42 通过；浏览器冒烟 9 项全部通过；**未执行**任何生产接口、数据库或凭证操作 |
| 修订 | B1/B2 修订后重跑（新增 3 项候选冲突用例 + 4 项搜索非法输入用例）；本节结论由执行 Agent 运行得出，Reviewer 未独立复跑 |

---

## 1. 证据分级

本报告严格区分三类结论：

- **实际运行（RUN）**：本次真实执行命令或浏览器操作得到的输出。
- **静态检查（STATIC）**：读取文件、比对字段/哈希，不运行行为。
- **设计声明（CLAIM）**：来自 `12_` / `14_` 的设计约束，本次未做生产验证。

---

## 2. 单元测试（RUN）

命令：

```bash
cd 15_phase1_mock_ui
node --test tests/mpn-normalizer.test.js tests/mock-api.test.js
```

实际结果：

```text
tests 42
pass 42
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 618.2903
```

### 2.1 归一化与业务键（22 项）

| 用例 | 断言 | 结果 |
|---|---|---|
| SHA-256 FIPS 向量 | `abc` / 空串 / 标准长串 | PASS |
| SHA-256 对照 `node:crypto` | 含中文、é、1000 字符 | PASS |
| `utf8Length` | ASCII/2/3/4 字节 | PASS |
| trim + 大写 | `  lm358dr  ` → `LM358DR` | PASS |
| 内部空白折叠 | 双空格、全角空格、NBSP+TAB → 单空格 | PASS |
| NFKC / 零宽 / 连字符 | 全角、U+200B/U+FEFF、U+2013/U+2212/U+FF0D | PASS |
| 连接符与后缀 | `/ _ . -` 保留；不剥离品牌后缀 | PASS |
| 非法输入 | 非字符串、C0 控制符、孤立代理项 | PASS |
| 业务键对照契约示例 | 6 组 MPN+Brand 全部一致 | PASS |
| 键格式 | 长 69、`pbk1_` + 64 位小写 hex、不截断 | PASS |
| 确定性与品牌区分 | 同输入同键；异 Brand 异键 | PASS |
| 字节长度定界 | `("A","é") ≠ ("A","éA")`，并与手工 canonical 一致 | PASS |
| 完整身份 | 保留 raw、生成键、版本号 | PASS |
| 缺 Brand | `null/undefined/""/"   "` → `PENDING_BRAND` | PASS |
| 空/非法 MPN | `EMPTY_MPN` / `INVALID_MPN`，无键 | PASS |
| 等价写法合并 | 大小写/零宽/全角空格 → 同一键 | PASS |
| 同 MPN 异 Brand | 两个独立身份 | PASS |
| 候选聚合 | 重复文档 → 1 个身份 | PASS |
| 候选冲突 | `LM358DR` vs `LM358D` → `PENDING_CONFLICT` | PASS |
| 空候选列表（B1） | `[]` → `INVALID` / `NO_CANDIDATES`，不返回 `CONFIRMED` | PASS |
| 缺 Brand 候选参与冲突判定（B1） | `LM358DR+Brand` 与 `LM358D+null` → `PENDING_CONFLICT`，`mpn_norms` 长度 2 | PASS |
| 同 MPN 异 Brand 冲突（B1） | `LM358DR` × 两个 Brand → `PENDING_CONFLICT`，`brand_norms`/`keys` 各 2 | PASS |
| 状态传播 | `PENDING_BRAND` / `INVALID` | PASS |

### 2.2 Mock API 与同步（20 项）

| 用例 | 断言 | 结果 |
|---|---|---|
| 已发布产品 | 200、`code=0`、`fixture=DEMO_FIXTURE`、身份字段 | PASS |
| 未发布 | 403 / 40302 / `PRODUCT_NOT_RELEASED` | PASS |
| 已撤回 | 410 / 41001 / `PRODUCT_RELEASE_REVOKED` | PASS |
| 未知产品 | 404 / 40401 | PASS |
| 缺 Brand 预览 | 422 / 42201 / `PENDING_BRAND` | PASS |
| 归一化冲突 | 422 / 42202 / `PENDING_CONFLICT` | PASS |
| 通用错误 | 401/409/429/503 与 `error_key` | PASS |
| 搜索缺 mpn | 400 / `INVALID_ARGUMENT` | PASS |
| 搜索缺 brand | 422 / 42201 | PASS |
| 搜索 MPN 含非法控制字符（B2） | 400 / 40001 / `field=mpn` / `reason=ILLEGAL_CHAR`，`data=null` | PASS |
| 搜索 MPN 归一后为空（B2） | 400 / 40001 / `field=mpn` / `reason=EMPTY_MPN`，`data=null` | PASS |
| 搜索 Brand 含非法控制字符（B2） | 400 / 40001 / `field=brand` / `reason=ILLEGAL_CHAR`，`data=null` | PASS |
| 搜索 Brand 归一后为空（B2） | 422 / 42201 / `PENDING_BRAND` / `missing=["brand"]` | PASS |
| 搜索归一化 | 前后空白/全角空格仍精确命中，`total=1` | PASS |
| 分页游标 | `demo_1` 偏移后为空页、`next_cursor=null` | PASS |
| 字典/分类获取 | `formal_dictionary=false` / `formal_taxonomy=false` | PASS |
| 同步重试 | 事件序列 `OK(1) → ERROR(2,1) → ERROR(2,2) → OK(2,3) → DONE`，重试不跳页，退避 1/2ms | PASS |
| 撤回发现 | `REVOKED` 返回 1 条且键正确 | PASS |
| 正常分页 | 两页各 2 条，`demo_2` 后结束 | PASS |
| 请求 ID | 连续递增、不复用 | PASS |

> 同步测试使用 `delayMs=1` 注入等待，验证的是控制流，不是真实网络退避。

---

## 3. 浏览器冒烟（RUN）

启动：

```bash
python -m http.server 8777 --bind 127.0.0.1
```

访问 `http://127.0.0.1:8777/index.html`（browser-use 驱动）。

| # | 操作 | 实际观察 | 结果 |
|---|---|---|---|
| 1 | 首屏加载 | 产品表 8 行，计数 `8 / 8 条`，控制台无消息 | PASS |
| 2 | 选择首行 | 详情含 `pbk1_e65e…`、`DEMO_FIXTURE_VOLTAGE`、`ev_demo_0001` | PASS |
| 3 | 归一化边界样例 | `LM–358DR` → `LM-358DR`；品牌 → `EXAMPLE SEMICONDUCTOR`；键随规则改变 | PASS |
| 4 | 候选冲突（B1） | 聚合 `PENDING_CONFLICT` / `CONFLICTING_IDENTITY`；`mpn_norms` 2 项、`brand_norms` 1 项、`keys` 2 项 | PASS |
| 5 | 冲突队列 | 2 行（缺 Brand / 互斥 MPN），按钮禁用 | PASS |
| 6 | 字典编辑 | 选中 `DEMO_FIXTURE_PACKAGE`，→ `REVIEWED`，表格状态列即时变为 `REVIEWED`，提示「已在内存中更新…未写入任何数据库」 | PASS |
| 7 | 两套分类 | 技术树 6 节点（含 Analog、参数编码）；导航树 4 节点（含 Amplifiers、URL 路径）；映射表 4 行且 `morrishk_target` 均为 `PLATFORM_PD` | PASS |
| 8 | Mock API（B2） | 控制字符 MPN → 400 `ILLEGAL_CHAR`；全空格 MPN → 400 `EMPTY_MPN`；全空格 Brand → 422 `PRODUCT_IDENTITY_INCOMPLETE`；合法输入 → `code=0`、`total=1`、返回 `pbk1_e65e…` | PASS |
| 9 | 同步演示 | 状态序列 `OK, ERROR, ERROR, OK, DONE`；错误含 503 与退避 300/600ms；结束提示 `no production write performed` | PASS |

> 冒烟只覆盖桌面 Chromium 窄视口；未做多浏览器、移动端或无障碍专项。

---

## 4. 静态检查（STATIC）

| 检查 | 方法 | 结果 |
|---|---|---|
| 示例键一致性 | 单元测试比对 `API_CONTRACT_EXAMPLES.md` 中 6 个键 | 一致 |
| 脚本语法 | 页面加载后无控制台错误；Node `require` 成功 | 通过 |
| Fixture 标记 | `dataset` / `source` / `meta.fixture` 均为 `DEMO_FIXTURE` | 通过 |
| 无网络依赖 | 页面仅 `fetch` 本地 `data/*.json`；Mock API 全部在内存 | 通过（代码审阅） |
| 13_ 产品身份口径 | 只读 grep（基线 `8c45f63`，当前 HEAD `5fa7c5c` 同）：`product_id = prod-<document_id>` 被描述为**单文档内**成立，跨文档归并列 `OPEN_DECISIONS.md:134` **OD-11** `OPEN` | 未发现与 IQ-01 冲突的跨系统身份定义；OD-11 属 Ds Bit 内部产品族/版本/文档归并，不在 IQ-01 解决范围 |
| 13_ 未被修改 | `git status --porcelain -- 13_dsbit_duckdb_s3_pipeline` 为空 | 通过 |

---

## 5. 设计声明（CLAIM，未验证）

以下内容来自设计文档，本次**没有**生产验证，不得写成 PASS：

1. 生产 Business API 可用性、限流、鉴权行为；
2. `pd_model` 唯一约束与生成列改造后的实际表现；
3. OAuth2 Token 生命周期与 scope；
4. 真实 Ds Bit 解析输出与证据模型；
5. PM 真实分类种子的字段与单位；
6. 契约冻结后的最终错误码与分页形态。

---

## 6. 未执行项

- 未调用 Ds Bit / Morrishk 任何生产接口；
- 未申请、存储或使用任何 OAuth2 凭证；
- 未连接、迁移或写入任何数据库；
- 未执行真实同步、发布或撤回；
- 未初始化生产分类树；
- 未运行 DuckDB + S3 流水线。

---

## 7. 复现命令

```bash
# 单元测试
cd 15_phase1_mock_ui
node --test tests/mpn-normalizer.test.js tests/mock-api.test.js

# 浏览器
python -m http.server 8777 --bind 127.0.0.1
# 打开 http://127.0.0.1:8777/index.html

# 校验交付文件
sha256sum -c SHA256SUMS.txt
```

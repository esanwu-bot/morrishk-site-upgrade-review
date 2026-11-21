#!/usr/bin/env node
/*
 * self_check.js — Phase 2 计划包独立自检（只读）。
 * 检查：文件完整性、矩阵覆盖率（16 操作 / 20 错误码 / 13 安全场景）、
 *       阻断项引用完整性、内部链接有效性、计划稿纪律（不得写成已实现/已验收）。
 * 数据源：12_ 基线 OpenAPI（只读）+ 本目录文档。退出码非 0 = 自检失败。
 */
"use strict";
const fs = require("fs");
const path = require("path");

const PKG = __dirname ? path.resolve(__dirname, "..") : process.cwd();
const REPO = path.resolve(PKG, "..");
const BASELINE = path.join(REPO, "12_dsbit_business_api_integration_design", "contract", "openapi.candidate.v1.json");

const REQUIRED_DOCS = [
  "PHASE2_IMPLEMENTATION_PLAN.md", "API_OPERATION_TEST_MATRIX.md", "ERROR_CODE_TEST_MATRIX.md",
  "SECURITY_AND_SCOPE_TEST_PLAN.md", "REPOSITORY_INTERFACE_PLAN.md", "YII2_CLIENT_PLAN.md",
  "OAUTH2_INTEGRATION_PLAN.md", "FIXTURE_DATA_SPEC.md", "BLOCKER_AND_DEPENDENCY_REGISTER.md",
  "TEST_AND_ACCEPTANCE_CRITERIA.md", "README.md", "SELF_CHECK.md"
];

let failures = 0;
const results = [];
function check(id, ok, detail) {
  results.push(`${ok ? "PASS" : "FAIL"}  ${id}${detail ? " — " + detail : ""}`);
  if (!ok) failures++;
}
function read(rel) { return fs.readFileSync(path.join(PKG, rel), "utf8"); }

// C-1 文件完整性
for (const f of REQUIRED_DOCS) {
  check(`C-1 exists ${f}`, fs.existsSync(path.join(PKG, f)));
}

const opsDoc = read("API_OPERATION_TEST_MATRIX.md");
const errDoc = read("ERROR_CODE_TEST_MATRIX.md");
const secDoc = read("SECURITY_AND_SCOPE_TEST_PLAN.md");
const blkDoc = read("BLOCKER_AND_DEPENDENCY_REGISTER.md");
const fixDoc = read("FIXTURE_DATA_SPEC.md");
const planDoc = read("PHASE2_IMPLEMENTATION_PLAN.md");
const accDoc = read("TEST_AND_ACCEPTANCE_CRITERIA.md");

// C-2 16 操作覆盖（operationId 取自基线 OpenAPI）
const baseline = JSON.parse(fs.readFileSync(BASELINE, "utf8"));
const opIds = [];
for (const p of Object.keys(baseline.paths)) {
  for (const m of Object.keys(baseline.paths[p])) {
    if (/^x-/i.test(m)) continue;
    opIds.push(baseline.paths[p][m].operationId);
  }
}
const missingOps = opIds.filter((id) => !opsDoc.includes(`\`${id}\``));
check("C-2 operations 16/16 in matrix", opIds.length === 16 && missingOps.length === 0,
  missingOps.length ? "missing: " + missingOps.join(",") : `${opIds.length} ops`);

// C-3 20 错误码覆盖
const errKeys = baseline.components.schemas.ErrorMeta.properties.error_key.enum;
const errCodes = ["40001","40002","40101","40102","40301","40302","40303","40401","40402","40403","40901","41001","41002","41301","42201","42202","42901","50001","50301","50302"];
const missingKeys = errKeys.filter((k) => !errDoc.includes(`\`${k}\``));
const missingCodes = errCodes.filter((c) => !errDoc.includes(`| ${c} |`));
check("C-3 error codes 20/20 in matrix", errKeys.length === 20 && missingKeys.length === 0 && missingCodes.length === 0,
  missingKeys.length ? "missing keys: " + missingKeys.join(",") : (missingCodes.length ? "missing codes: " + missingCodes.join(",") : "20 keys + 20 codes"));

// C-4 安全场景 13 组 + 三身份
const secIds = Array.from({ length: 13 }, (_, i) => `SEC-${String(i + 1).padStart(2, "0")}`);
const missingSec = secIds.filter((id) => !secDoc.includes(id));
check("C-4 security scenarios 13/13", missingSec.length === 0, missingSec.join(",") || "SEC-01..13");
check("C-4b three token classes", secDoc.includes("T1") && secDoc.includes("T2") && secDoc.includes("T3") && secDoc.includes("PKCE"));

// C-5 阻断项引用完整
const blockers = ["DIFF-CONTRACT-01","DIFF-CONTRACT-03","DIFF-MOCK-05","DIFF-MOCK-11",
  "IQ-01","IQ-02","IQ-05","IQ-09","IQ-13","IQ-15","IQ-21","B5","B6","B7","B8","P0-2",
  "P1-1","P1-2","P1-3","P1-6","P1-7","P1-8","P1-9","P1-10"];
const missingBlk = blockers.filter((b) => !blkDoc.includes(b));
check("C-5 blocker refs complete", missingBlk.length === 0, missingBlk.join(",") || `${blockers.length} refs`);

// C-5b 四项重点差异保持原状态（不得关闭）
check("C-5b DIFF-CONTRACT-01 stays PENDING", /DIFF-CONTRACT-01.*PENDING|PENDING.*DIFF-CONTRACT-01|DIFF-CONTRACT-01.*\| PENDING/.test(blkDoc));
check("C-5b DIFF-CONTRACT-03 stays PENDING", /DIFF-CONTRACT-03.*PENDING|PENDING.*DIFF-CONTRACT-03|DIFF-CONTRACT-03.*\| PENDING/.test(blkDoc));
check("C-5b DIFF-MOCK-05 stays OPEN", /DIFF-MOCK-05[\s\S]{0,200}OPEN/.test(blkDoc));
check("C-5b DIFF-MOCK-11 stays OPEN", /DIFF-MOCK-11[\s\S]{0,200}OPEN/.test(blkDoc));

// C-6 BLOCKED_BY_DECISION 标注存在
const bbd = (opsDoc.match(/BLOCKED_BY_DECISION/g) || []).length;
check("C-6 BLOCKED_BY_DECISION markers >= 8", bbd >= 8, `${bbd} markers`);

// C-7 Fixture 纪律
check("C-7 fixture DEMO_FIXTURE discipline", fixDoc.includes("DEMO_FIXTURE") && fixDoc.includes("ULID"));
const fIds = Array.from({ length: 9 }, (_, i) => `F-0${i + 1}`);
const missingF = fIds.filter((id) => !fixDoc.includes(id));
check("C-7b fixture products F-01..F-09", missingF.length === 0, missingF.join(",") || "9 products");

// C-8 计划稿纪律：不得宣称已实现/已验收/已冻结（排除否决项/禁令上下文中的引用）
const all = [planDoc, opsDoc, errDoc, secDoc, blkDoc, fixDoc, accDoc, read("REPOSITORY_INTERFACE_PLAN.md"), read("YII2_CLIENT_PLAN.md"), read("OAUTH2_INTEGRATION_PLAN.md"), read("README.md")].join("\n");
function forbiddenClaim(re) {
  let m;
  while ((m = re.exec(all))) {
    const before = all.slice(Math.max(0, m.index - 30), m.index);
    // 禁令/否决上下文（引用禁语不算宣称）
    if (/任何|不得|禁止|≠|非声明|不构成|挂起/.test(before)) continue;
    return m[0];
  }
  return null;
}
check("C-8 no freeze claim", forbiddenClaim(/Contract Freeze\s*(已完成|完成|通过|READY)/gi) === null);
check("C-8b no acceptance self-claim", !/已通过验收|验收通过并关闭/i.test(all));
check("C-8c freeze still NOT_READY stated", planDoc.includes("NOT_READY") && planDoc.includes("CANDIDATE_NOT_FROZEN"));
check("C-8d production NOT_APPROVED stated", planDoc.includes("NOT_APPROVED"));

// C-9 内部链接有效性（文档引用的兄弟文件必须存在）
const names = new Set(REQUIRED_DOCS.concat(["SESSION_B_CONTEXT_RECOVERY_REPORT.md"]));
const linkRe = /([A-Z][A-Z0-9_]+\.md)/g;
let broken = [];
for (const f of REQUIRED_DOCS) {
  const text = read(f);
  const m = text.match(linkRe) || [];
  for (const ref of m) {
    if (names.has(ref) && !fs.existsSync(path.join(PKG, ref)) && ref !== "SESSION_B_CONTEXT_RECOVERY_REPORT.md") {
      broken.push(`${f} -> ${ref}`);
    }
  }
}
check("C-9 internal links resolvable", broken.length === 0, broken.join("; ") || "all refs ok");

// C-10 实施顺序四工作流齐备
check("C-10 workstreams W-1..W-4", ["W-1","W-2","W-3","W-4"].every((w) => planDoc.includes(w)));

// ===== C-11..C-16（Reviewer R1–R4 修正自检）=====
const repoDoc = read("REPOSITORY_INTERFACE_PLAN.md");

// C-11 DIFF-MOCK-05：候选 A/B 均存在，且未写成确定默认行为
check("C-11a DIFF-MOCK-05 candidate A present", fixDoc.includes("候选 A") && fixDoc.includes("仅返回 RELEASED"));
check("C-11b DIFF-MOCK-05 candidate B present", fixDoc.includes("候选 B") && fixDoc.includes("不自动过滤"));
check("C-11c both candidates BLOCKED_BY_DECISION", fixDoc.includes("BLOCKED_BY_DECISION(DIFF-MOCK-05)") && opsDoc.includes("BLOCKED_BY_DECISION(DIFF-MOCK-05)"));
check("C-11d no determined-default phrasing", !/按契约默认/.test(all) && !/按契约默认过滤/.test(repoDoc));
check("C-11e repo interface has no implied default", repoDoc.includes("不隐含任何默认状态过滤值") && repoDoc.includes("不注入任何默认状态过滤值"));

// C-12 DIFF-CONTRACT-03：400/422 双候选均存在且标注待裁定，未合并
check("C-12a error-matrix dual candidates", errDoc.includes("候选-422") && errDoc.includes("候选-400"));
check("C-12b dual candidates BLOCKED_BY_DECISION", errDoc.includes("BLOCKED_BY_DECISION(DIFF-CONTRACT-03)") && opsDoc.includes("BLOCKED_BY_DECISION(DIFF-CONTRACT-03)"));
check("C-12c not merged into one response", errDoc.includes("不得合并为单一响应") && opsDoc.includes("不得合并为单一响应"));

// C-13 Scope×Endpoint：75 唯一组合（行级解析 + 集合比对，非字符串计数）
const scopeNames = ["product.read", "product.category.read", "product.evidence.read", "product.version.read", "product.publish.read"];
const bizOps = opIds.filter((id) => id !== "issueToken"); // 15 业务端点
const secRows = [];
{
  const re = /^\|\s*(\d+)\s*\|\s*(S\d+)\s+`([^`]+)`\s*\|\s*`([A-Za-z]+)`\s*\|.*$/gm;
  let m;
  while ((m = re.exec(secDoc))) {
    secRows.push({ no: Number(m[1]), scope: m[3], op: m[4], line: m[0] });
  }
}
const pairs = secRows.map((r) => r.scope + "|" + r.op);
const uniquePairs = new Set(pairs);
const expectedPairs = new Set();
for (const s of scopeNames) for (const op of bizOps) expectedPairs.add(s + "|" + op);
const dupCount = pairs.length - uniquePairs.size;
check("C-13a scope matrix has exactly 75 rows", secRows.length === 75, `rows=${secRows.length}`);
check("C-13b combos unique", dupCount === 0, `duplicates=${dupCount}`);
check("C-13c combos complete (5 scopes x 15 ops)", uniquePairs.size === 75 && pairs.length === 75,
  `missing=${[...expectedPairs].filter((p) => !uniquePairs.has(p)).length}, unexpected=${[...uniquePairs].filter((p) => !expectedPairs.has(p)).length}`);
check("C-13d scopes are the 5 declared", secRows.every((r) => scopeNames.includes(r.scope)));
check("C-13e ops are the 15 business ops", secRows.every((r) => bizOps.includes(r.op)));

// C-14 可执行/挂起统计一致（逐行分类 vs 文内统计声明）
let execRows = 0, pendRows = 0, candRows = 0, confRows = 0;
const authTypes = [];
for (const r of secRows) {
  const cells = r.line.split("|").map((c) => c.trim()).filter((c) => c.length > 0);
  const authType = cells[cells.length - 2] || "";
  const cls = cells[cells.length - 1] || "";
  authTypes.push({ authType, src: cells[6] || "", expect: cells[4] || "" });
  if (cls.startsWith("可执行")) execRows++;
  if (cls.startsWith("挂起")) pendRows++;
  if (authType === "CANDIDATE_AUTHORIZATION") candRows++;
  if (authType === "CONFIRMED_AUTHORIZATION") confRows++;
}
const statedExec = Number((secDoc.match(/正式可执行测试数量：\*\*(\d+)\*\*/) || [])[1]);
const statedPend = Number((secDoc.match(/授权规则待裁定数量：\*\*(\d+)\*\*/) || [])[1]);
check("C-14a row classification parsed for all 75", pendRows + execRows === 75, `exec=${execRows}, pend=${pendRows}`);
check("C-14b stated stats match row counts", statedExec === execRows && statedPend === pendRows, `stated=${statedExec}/${statedPend}, rows=${execRows}/${pendRows}`);
check("C-14c stats sum to 75", statedExec + statedPend === 75);
check("C-14d full-coverage claim present", /\*\*75\/75\*\*/.test(secDoc));

// C-15 F-07：同 MPN 异 Brand = 两个不同业务身份（非冲突）
const f07line = fixDoc.split("\n").find((l) => l.includes("| F-07 "));
check("C-15a F-07 is CONFIRMED dual identity", !!f07line && f07line.includes("CONFIRMED") && f07line.includes("两个不同业务身份"));
check("C-15b F-07 is NOT marked as conflict", !!f07line && !f07line.includes("PENDING_CONFLICT"));

// C-16 F-10：真正归一化冲突 fixture 引用 B5，未冻结未决规则
const f10line = fixDoc.split("\n").find((l) => l.includes("| F-10 "));
check("C-16a F-10 conflict fixture exists", !!f10line && f10line.includes("PENDING_CONFLICT"));
check("C-16b F-10 cites B5 as BLOCKED/PROPOSED", !!f10line && f10line.includes("BLOCKED_BY_DECISION(B5)") && (f10line.includes("PROPOSED") || f10line.includes("未冻结")));
// F-10 的冲突机制不得"是"同 MPN 异 Brand；显式否定表述（非"同 MPN 异 Brand"）可接受
check("C-16c F-10 mechanism is not same-MPN-different-brand",
  !!f10line && (new RegExp('非\\*{0,2}"同 MPN 异 Brand"').test(f10line) || !f10line.includes("同 MPN 异 Brand")));

// ===== C-17..C-22（Reviewer R5–R6 修正自检）=====

// C-17：75 组合区分候选权限映射与正式授权依据（逐行解析，非关键字计数）
const AUTH_VOCAB = ["CANDIDATE_AUTHORIZATION", "CONFIRMED_AUTHORIZATION", "BLOCKED_BY_DECISION"];
check("C-17a every row carries an authorization-basis type", authTypes.length === 75 && authTypes.every((a) => AUTH_VOCAB.includes(a.authType)));
const statedCand = Number((secDoc.match(/候选授权映射数量：\*\*(\d+)\*\*/) || [])[1]);
check("C-17b candidate-authorization count matches rows", statedCand === candRows, `stated=${statedCand}, rows=${candRows}`);
check("C-17c candidate expectation column present per row", authTypes.every((a) => a.expect === "允许" || a.expect === "拒绝"));

// C-18：PROPOSED 的 R-OA-05 不会被计为 CONFIRMED 授权规则（跨文件语义校验）
const registry = JSON.parse(fs.readFileSync(path.join(REPO, "25_sessionb_phase1_contract_closure", "rules", "rule_registry.json"), "utf8"));
const roa05 = registry.rules.find((r) => r.id === "R-OA-05");
check("C-18a R-OA-05 remains PROPOSED in rule registry", !!roa05 && roa05.status === "PROPOSED");
check("C-18b R-OA-05-sourced rows never marked CONFIRMED", authTypes.every((a) => (a.src.includes("R-OA-05") ? a.authType !== "CONFIRMED_AUTHORIZATION" : true)));
check("C-18c no row claims CONFIRMED_AUTHORIZATION today", confRows === 0);

// C-19：正式可执行数量与逐行 CONFIRMED 依据一致（当前应为 0，不得推断为 70）
check("C-19a formal executable stated as 0", statedExec === 0);
check("C-19b formal executable == CONFIRMED-based rows", statedExec === confRows);
// 「可执行 70」仅允许出现在作废声明中（旧口径标注上下文）
let stale70 = false;
{
  const re = /可执行\s*\*{0,2}70\*{0,2}/g;
  let m;
  while ((m = re.exec(secDoc))) {
    const before = secDoc.slice(Math.max(0, m.index - 20), m.index);
    if (!/旧口径|作废/.test(before)) stale70 = true;
  }
}
check("C-19c old 70-executable claim abolished", !stale70);

// C-20：F-10 来源冲突与 F-11 归一化冲突分别建模
const f11line = fixDoc.split("\n").find((l) => l.includes("| F-11 "));
check("C-20a source-conflict candidate modeled (F-10)", !!f10line && f10line.includes("SOURCE_IDENTITY_CONFLICT"));
check("C-20b normalization-conflict candidate modeled separately (F-11)", !!f11line && f11line.includes("NORMALIZATION_CONFLICT_CANDIDATE_PENDING_B5"));
check("C-20c the two conflict classes are distinct rows", !!f10line && !!f11line && f10line !== f11line);

// C-21：归一化冲突候选引用 B5 且未冻结算法
check("C-21a F-11 cites B5 as BLOCKED and PROPOSED", !!f11line && f11line.includes("BLOCKED_BY_DECISION(B5)") && f11line.includes("PROPOSED"));
check("C-21b F-11 states the non-speculative limitation", !!f11line && f11line.includes("无充分依据") && f11line.includes("不伪造已确定冲突案例"));
check("C-21c F-11 freezes no algorithm", !!f11line && !f11line.includes("已冻结") && (!!f10line && !f10line.includes("已冻结")));

// C-22：42202 不把来源冲突直接认定为归一化冲突
const e42202 = errDoc.split("\n").find((l) => l.includes("| 16 | 42202"));
check("C-22a 42202 distinguishes the two conflict classes", !!e42202 && e42202.includes("SOURCE_IDENTITY_CONFLICT") && e42202.includes("NORMALIZATION_CONFLICT_CANDIDATE_PENDING_B5") && e42202.includes("不得混同"));
check("C-22b 42202 keeps F-07 as two legal identities", !!e42202 && e42202.includes("两个合法身份"));

// 输出
console.log("=== PHASE2 PLAN SELF-CHECK ===");
for (const r of results) console.log(r);
const passed = results.filter((r) => r.startsWith("PASS")).length;
console.log(`=== summary: ${passed}/${results.length} PASS, failures: ${failures} ===`);
process.exit(failures === 0 ? 0 : 1);

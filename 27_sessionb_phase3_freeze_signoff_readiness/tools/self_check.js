#!/usr/bin/env node
/*
 * self_check.js — Phase 3（Contract Freeze 决策与签署准备）独立自检。只读。
 * 检查：文件完整性、ID 覆盖率、状态一致性（跨文件比对权威登记）、
 *       Scope 授权口径（候选 75 / CONFIRMED 0 / 正式可执行 0）、
 *       禁止越权断言（越权关闭/冻结宣称/分支认定谓词 + 反例）。
 * 退出码非 0 = 自检失败。
 */
"use strict";
const fs = require("fs");
const path = require("path");

const PKG = path.resolve(__dirname, "..");
const REPO = path.resolve(PKG, "..");

const REQUIRED_DOCS = [
  "PHASE3_README.md", "DECISION_REGISTER.md", "CONTRACT_DECISION_MATRIX.md",
  "IQ_SIGNOFF_REGISTER.md", "B5_B8_DEPENDENCY_MATRIX.md", "SCOPE_AUTHORIZATION_READINESS.md",
  "P0_2_AUTHORITY_CONFIRMATION.md", "CONTRACT_FREEZE_GATE.md", "SELF_CHECK.md"
];

let failures = 0;
const results = [];
function check(id, ok, detail) {
  results.push(`${ok ? "PASS" : "FAIL"}  ${id}${detail ? " — " + detail : ""}`);
  if (!ok) failures++;
}
function read(rel) { return fs.readFileSync(path.join(PKG, rel), "utf8"); }

// C-1 文件完整性
for (const f of REQUIRED_DOCS) check(`C-1 exists ${f}`, fs.existsSync(path.join(PKG, f)));
check("C-1b exists tools/self_check.js", fs.existsSync(path.join(PKG, "tools", "self_check.js")));

const decDoc = read("DECISION_REGISTER.md");
const cdmDoc = read("CONTRACT_DECISION_MATRIX.md");
const iqDoc = read("IQ_SIGNOFF_REGISTER.md");
const b58Doc = read("B5_B8_DEPENDENCY_MATRIX.md");
const scopeDoc = read("SCOPE_AUTHORIZATION_READINESS.md");
const p02Doc = read("P0_2_AUTHORITY_CONFIRMATION.md");
const gateDoc = read("CONTRACT_FREEZE_GATE.md");
const readmeDoc = read("PHASE3_README.md");

// C-2 ID 覆盖率（DECISION_REGISTER 表行）
const IDS = ["DIFF-CONTRACT-01", "DIFF-CONTRACT-03", "DIFF-MOCK-05", "DIFF-MOCK-11",
  "IQ-01", "IQ-02", "IQ-05", "IQ-09", "IQ-13", "IQ-15", "IQ-21",
  "B5", "B6", "B7", "B8", "P0-2"];
function rowFor(id) {
  return decDoc.split("\n").find((l) => l.startsWith(`| ${id} `) || l.startsWith(`| **${id}**`));
}
const missingIds = IDS.filter((id) => !rowFor(id));
check("C-2 all 16 IDs registered as rows", missingIds.length === 0, missingIds.join(",") || "16 rows");
check("C-2b all 16 IDs covered across package docs",
  IDS.every((id) => [decDoc, cdmDoc, iqDoc, b58Doc, scopeDoc, p02Doc, gateDoc].some((d) => d.includes(id))));

// C-3 状态一致性（登记表状态与权威登记逐项一致）
function statusOf(id) {
  const row = rowFor(id);
  if (!row) return null;
  const m = row.match(/\*\*(PENDING|OPEN|DECIDED|PROPOSED|DECISION_REQUIRED|待 PM 提交)\*\*/);
  return m ? m[1] : null;
}
check("C-3a DIFF-CONTRACT-01/03 stay PENDING", statusOf("DIFF-CONTRACT-01") === "PENDING" && statusOf("DIFF-CONTRACT-03") === "PENDING");
check("C-3b DIFF-MOCK-05/11 stay OPEN", statusOf("DIFF-MOCK-05") === "OPEN" && statusOf("DIFF-MOCK-11") === "OPEN");
const iqDecided = ["IQ-01", "IQ-02", "IQ-13"].map(statusOf);
check("C-3c IQ-01/02/13 DECIDED + pending signature + acceptance not done",
  iqDecided.every((s) => s === "DECIDED") &&
  ["IQ-01", "IQ-02", "IQ-13"].every((id) => { const r = rowFor(id); return r.includes("待签署") && (r.includes("未验收") || r.includes("未完成")); }));
check("C-3d IQ-05/09/15/21 stay OPEN", ["IQ-05", "IQ-09", "IQ-15", "IQ-21"].every((id) => statusOf(id) === "OPEN"));
check("C-3e B5 PROPOSED / B6 OPEN / B7 awaiting PM / B8 OPEN / P0-2 DECISION_REQUIRED",
  statusOf("B5") === "PROPOSED" && statusOf("B6") === "OPEN" && statusOf("B7") === "待 PM 提交" &&
  statusOf("B8") === "OPEN" && statusOf("P0-2") === "DECISION_REQUIRED");

// C-3f 跨文件：14_ 权威登记仍为 3/7 裁定、4/7 未裁、三项待签署
const authReg = fs.readFileSync(path.join(REPO, "14_phase0_authority_adjudication", "DECISION_REGISTER.md"), "utf8");
check("C-3f authoritative register unchanged (3/7 ruled, 4/7 open, 3 pending signature)",
  authReg.includes("已裁定 Phase 0 问题 | 3 / 7") && authReg.includes("未裁定 Phase 0 问题 | 4 / 7") &&
  (authReg.match(/待签署/g) || []).length >= 3);

// ===== C-3g..C-3j（R2 修正：真正的逐项跨文件状态核验）=====
// C-3g：25_/DIFF_CHECK_REPORT.md 逐项状态（DIFF-CONTRACT-01/03 = PENDING；DIFF-MOCK-05/11 = 差异事实 CONFIRMED）
const diff25 = fs.readFileSync(path.join(REPO, "25_sessionb_phase1_contract_closure", "DIFF_CHECK_REPORT.md"), "utf8");
function diffRow25(id) {
  return diff25.split("\n").find((l) => l.includes(`| **${id}**`));
}
check("C-3g 25_ authoritative: DIFF-CONTRACT-01/03 rows stay [PENDING]",
  ["DIFF-CONTRACT-01", "DIFF-CONTRACT-03"].every((id) => {
    const r = diffRow25(id);
    return !!r && r.includes("[PENDING]");
  }));
// DIFF-MOCK-05/11 在 25_ 的登记口径：差异**事实** CONFIRMED、处置 OPEN（26_/BLOCKER 登记）——两级口径分别核验
check("C-3h 25_ authoritative: DIFF-MOCK-05/11 rows stay [CONFIRMED]-as-fact",
  ["DIFF-MOCK-05", "DIFF-MOCK-11"].every((id) => {
    const r = diffRow25(id);
    return !!r && r.includes("[CONFIRMED]");
  }));
const blocker26 = fs.readFileSync(path.join(REPO, "26_sessionb_phase2_isolated_api_plan", "BLOCKER_AND_DEPENDENCY_REGISTER.md"), "utf8");
check("C-3h2 26_ authoritative: DIFF-MOCK-05/11 resolution stays OPEN",
  ["DIFF-MOCK-05", "DIFF-MOCK-11"].every((id) => {
    const row = blocker26.split("\n").find((l) => l.includes(`**${id}**`));
    return !!row && /OPEN/.test(row.slice(row.indexOf(id)));
  }));
// C-3i：12_ 候选 §11.2 逐项 B5–B8 状态与 Phase 3 登记一致
const cand12 = fs.readFileSync(path.join(REPO, "12_dsbit_business_api_integration_design", "API_CONTRACT_CANDIDATE_v1.md"), "utf8");
function bRow12(id) {
  return cand12.split("\n").find((l) => l.startsWith(`| ${id} |`));
}
check("C-3i 12_ §11.2: B5 PROPOSED / B6 OPEN / B7 awaiting PM / B8 OPEN (per-item)",
  [["B5", "PROPOSED"], ["B6", "OPEN"], ["B7", "待 PM 提交"], ["B8", "OPEN"]].every(([id, st]) => {
    const r = bRow12(id);
    return !!r && r.includes(st);
  }));
// C-3i2：25_/RULE_STATUS_REGISTER 交叉——B5 谓词规则 PROPOSED；B6/B7/B8 关联规则均 BLOCKED（未解决，与 Phase 3 OPEN/待PM 口径一致）
const reg25b = JSON.parse(fs.readFileSync(path.join(REPO, "25_sessionb_phase1_contract_closure", "rules", "rule_registry.json"), "utf8"));
check("C-3i2 rule registry: B5-gated rule PROPOSED; B6/B7/B8-gated rules non-CONFIRMED with BLOCKED present",
  reg25b.rules.find((r) => r.id === "R-ID-05").status === "PROPOSED" &&
  ["B6", "B7", "B8"].every((b) => {
    const gated = reg25b.rules.filter((r) => r.blockers.includes(b));
    return gated.length > 0 && gated.every((r) => r.status !== "CONFIRMED") && gated.some((r) => r.status === "BLOCKED");
  }));
// C-3j：14_ 逐行——IQ-01/02/13 登记 2026-11-17 + 待签署；IQ-05/09/15/21 裁定列为空（—）
function iqRow14(id) {
  return authReg.split("\n").find((l) => l.startsWith(`| ${id} `));
}
check("C-3j1 IQ-01/02/13 rows registered 2026-11-17 with pending signature",
  ["IQ-01", "IQ-02", "IQ-13"].every((id) => {
    const r = iqRow14(id);
    return !!r && r.includes("2026-11-17") && r.includes("待签署");
  }));
check("C-3j2 IQ-05/09/15/21 rows have empty adjudication columns (—)",
  ["IQ-05", "IQ-09", "IQ-15", "IQ-21"].every((id) => {
    const r = iqRow14(id);
    return !!r && r.includes("| — | — |");
  }));

// C-4 Scope 授权口径（与 26_ 矩阵交叉核对）
const scope26 = fs.readFileSync(path.join(REPO, "26_sessionb_phase2_isolated_api_plan", "SECURITY_AND_SCOPE_TEST_PLAN.md"), "utf8");
const reg25 = JSON.parse(fs.readFileSync(path.join(REPO, "25_sessionb_phase1_contract_closure", "rules", "rule_registry.json"), "utf8"));
const roa05 = reg25.rules.find((r) => r.id === "R-OA-05");
let cand26 = 0, exec26 = 0, pend26 = 0;
for (const l of scope26.split("\n")) {
  if (!/^\|\s*\d+\s*\|\s*S\d+\s/.test(l)) continue;
  const cells = l.split("|").map((c) => c.trim()).filter((c) => c.length > 0);
  if (cells[cells.length - 2] === "CANDIDATE_AUTHORIZATION") cand26++;
  const cls = cells[cells.length - 1] || "";
  if (cls.startsWith("可执行")) exec26++;
  if (cls.startsWith("挂起")) pend26++;
}
check("C-4a 26_ matrix baseline: candidate 75 / formal-executable 0 / pending 75", cand26 === 75 && exec26 === 0 && pend26 === 75, `cand=${cand26}, exec=${exec26}, pend=${pend26}`);
check("C-4b R-OA-05 remains PROPOSED in rule registry", !!roa05 && roa05.status === "PROPOSED");
check("C-4c readiness doc states candidate 75 / confirmed 0 / formal-executable 0 / pending 75",
  /\*\*75\/75\*\*/.test(scopeDoc) && /已确认授权（`CONFIRMED_AUTHORIZATION`）\s*\| \*\*0\/75\*\*/.test(scopeDoc) &&
  /正式可执行授权 \| \*\*0\/75\*\*/.test(scopeDoc) && /授权规则待裁定 \| \*\*75\/75\*\*/.test(scopeDoc));
check("C-4d readiness doc forbids treating candidates as approved",
  scopeDoc.includes("未经签署的授权一律不得标记为正式确认") && scopeDoc.includes("不得把 75 组合候选授权称为"));

// C-5 Freeze Gate 口径
check("C-5a gate states NOT_READY / CANDIDATE_NOT_FROZEN / NOT_APPROVED",
  gateDoc.includes("NOT_READY") && gateDoc.includes("CANDIDATE_NOT_FROZEN") && gateDoc.includes("NOT_APPROVED"));
check("C-5b gates G1..G6 registered with current status", ["G1", "G2", "G3", "G4", "G5", "G6"].every((g) => gateDoc.includes(`**${g}**`)));
check("C-5c no freeze record exists", gateDoc.includes("无冻结记录"));
check("C-5d gate refuses self-declaration", gateDoc.includes("不自行宣布") && gateDoc.includes("不构成冻结或实施授权"));

// ===== C-6/C-7/C-9 越权断言谓词 + C-25 反例（同一实现）=====
function hasUnauthorizedClosure(text, id) {
  let idx = 0;
  while ((idx = text.indexOf(id, idx)) !== -1) {
    const window = text.slice(idx + id.length, idx + id.length + 30);
    if (/(已关闭|已批准|状态[：:]\s*CLOSED|转为\s*APPROVED)/.test(window)) return true;
    idx += id.length;
  }
  return false;
}
function hasFreezeClaim(text) {
  // R3 修正：逐匹配检查前置语境，不再整句剥离——「先否定、后肯定」的矛盾表达不会被否定语境吞掉
  const re = /(CONTRACT_FREEZE_APPROVED|冻结已通过|Freeze 已通过|已获批冻结)/g;
  let m;
  while ((m = re.exec(text))) {
    const before = text.slice(Math.max(0, m.index - 24), m.index);
    if (!/(不宣布|不得自行宣布|不自行宣布|不得宣称|不构成|并非|不是)/.test(before)) return true;
  }
  return false;
}
function hasBranchSelection(text) {
  const re = /权威分支[为是]\s*`?(backup\/full-local-20261114|origin\/feat\/gate6a-audit|main)\b/g;
  let m;
  while ((m = re.exec(text))) {
    const before = text.slice(Math.max(0, m.index - 12), m.index);
    if (!/不认定|不指定|不自行/.test(before)) return true;
  }
  return false;
}

// C-6 真实文档零越权关闭宣称
const pkgDocs = [decDoc, cdmDoc, iqDoc, b58Doc, scopeDoc, p02Doc, gateDoc, readmeDoc];
check("C-6a no unauthorized closure claims in real docs", pkgDocs.every((d) => IDS.every((id) => !hasUnauthorizedClosure(d, id))));
check("C-6b closure predicate still detects '未关闭' correctly (negation exempt)", !hasUnauthorizedClosure(b58Doc, "B5"));

// C-7 零冻结宣称（否定语境豁免）
check("C-7a no freeze-approval claims in real docs", pkgDocs.every((d) => !hasFreezeClaim(d)));
check("C-7b gate keeps refusal wording", gateDoc.includes("不自行宣布 CONTRACT_FREEZE_APPROVED") || gateDoc.includes("不宣布 CONTRACT_FREEZE_APPROVED") || readmeDoc.includes("不自行宣布 CONTRACT_FREEZE_APPROVED"));

// C-8 自检 ≠ Reviewer 验收
check("C-8a agent cannot fill signature/acceptance", iqDoc.includes("执行 Agent 不代填") && iqDoc.includes("签署人：____"));
check("C-8b no reviewer-acceptance claims", !iqDoc.includes("Reviewer 已验收") && !/验收完成（3\/3）|验收完成 3\/3/.test(iqDoc));
check("C-8c acceptance counters remain zero", iqDoc.includes("**0/3**"));

// C-9 P0-2：不认定分支（谓词 + 结构）
check("C-9a P0-2 makes no branch selection", !hasBranchSelection(p02Doc));
check("C-9b P0-2 lists three candidates", ["backup/full-local-20261114", "origin/feat/gate6a-audit", "main"].every((b) => p02Doc.includes(b)));
check("C-9c P0-2 states DECISION_REQUIRED", p02Doc.includes("DECISION_REQUIRED"));

// C-10 P0-2 五项复验 + 确认请求
check("C-10a five re-verification items present", ["产品身份模型", "产品全局 ID 唯一性", "解析器输出与证据模型", "静态 B2B 桩状态", "数据库、审核、版本、发布"].every((k) => p02Doc.includes(k)));
check("C-10b confirmation request template with blanks", p02Doc.includes("确认人：________"));

// C-11 Scope readiness 路径 SA-1..SA-4
check("C-11 readiness path SA-1..SA-4 present", ["SA-1", "SA-2", "SA-3", "SA-4"].every((s) => scopeDoc.includes(s)));

// C-12 B5_B8 边界语义
check("C-12a B5 section: F-10 is source conflict, not normalization conflict",
  b58Doc.includes("来源身份冲突") && /不是.*归一化冲突|非.*归一化环节冲突/.test(b58Doc));
check("C-12b F-11 remains pending placeholder", b58Doc.includes("待裁定占位") || b58Doc.includes("占位"));
check("C-12c 42202 gated by future B5 adjudication", b58Doc.includes("仅当 B5 裁定确认归一化冲突条件后按裁定范围使用"));
check("C-12d R-ID-04 is enum source only", b58Doc.includes("仅作状态枚举来源"));

// C-13 跨文件引用有效
const externalRefs = [
  path.join(REPO, "14_phase0_authority_adjudication", "DECISION_REGISTER.md"),
  path.join(REPO, "14_phase0_authority_adjudication", "PHASE0_OPEN_QUESTIONS_MATRIX.md"),
  path.join(REPO, "14_phase0_authority_adjudication", "IQ05_IQ09_IQ15_IQ21_DECISION_BRIEFS.md"),
  path.join(REPO, "14_phase0_authority_adjudication", "DSBIT_AUTHORITY_BASELINE.md"),
  path.join(REPO, "25_sessionb_phase1_contract_closure", "DIFF_CHECK_REPORT.md"),
  path.join(REPO, "25_sessionb_phase1_contract_closure", "RULE_STATUS_REGISTER.md"),
  path.join(REPO, "25_sessionb_phase1_contract_closure", "rules", "rule_registry.json"),
  path.join(REPO, "26_sessionb_phase2_isolated_api_plan", "SECURITY_AND_SCOPE_TEST_PLAN.md"),
  path.join(REPO, "26_sessionb_phase2_isolated_api_plan", "FIXTURE_DATA_SPEC.md"),
  path.join(REPO, "26_sessionb_phase2_isolated_api_plan", "OAUTH2_INTEGRATION_PLAN.md"),
  path.join(REPO, "16_contract_freeze_readiness", "FREEZE_READINESS_REVIEW.md"),
  path.join(REPO, "12_dsbit_business_api_integration_design", "API_CONTRACT_CANDIDATE_v1.md")
];
check("C-13 referenced external files exist", externalRefs.every((p) => fs.existsSync(p)),
  externalRefs.filter((p) => !fs.existsSync(p)).join(", ") || "all exist");

// ===== C-25 反例测试（与真实文档检查共用同一谓词实现）=====
{
  // C-25a：越权关闭反例 → 谓词必须检出
  const cx = "DIFF-CONTRACT-01 已关闭，状态 CLOSED；由执行 Agent 裁定。";
  check("C-25a counter-example: unauthorized closure must be detected", hasUnauthorizedClosure(cx, "DIFF-CONTRACT-01") === true, JSON.stringify(cx));
}
{
  // C-25b：冻结宣称反例 → 谓词必须检出
  const cx = "Contract Freeze 已通过，CONTRACT_FREEZE_APPROVED，生产 API 同步获批。";
  check("C-25b counter-example: freeze-approval claim must be detected", hasFreezeClaim(cx) === true, JSON.stringify(cx));
}
{
  // C-25c：分支认定反例 → 谓词必须检出
  const cx = "经研究，权威分支为 backup/full-local-20261114，无需决策人确认。";
  check("C-25c counter-example: branch self-selection must be detected", hasBranchSelection(cx) === true, JSON.stringify(cx));
}
{
  // C-25d（R3 反例）：先否定、后肯定——同句矛盾表达不得被否定语境吞掉 → 谓词必须检出
  const cx = "本文件不宣布 CONTRACT_FREEZE_APPROVED，但实际上 CONTRACT_FREEZE_APPROVED 已获批准。";
  check("C-25d counter-example: negation-followed-by-claim in one sentence must be detected", hasFreezeClaim(cx) === true, JSON.stringify(cx));
}

// 输出
console.log("=== PHASE3 SELF-CHECK ===");
for (const r of results) console.log(r);
const passed = results.filter((r) => r.startsWith("PASS")).length;
console.log(`=== summary: ${passed}/${results.length} PASS, failures: ${failures} ===`);
process.exit(failures === 0 ? 0 : 1);

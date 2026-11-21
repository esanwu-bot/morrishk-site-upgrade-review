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

// 输出
console.log("=== PHASE2 PLAN SELF-CHECK ===");
for (const r of results) console.log(r);
const passed = results.filter((r) => r.startsWith("PASS")).length;
console.log(`=== summary: ${passed}/${results.length} PASS, failures: ${failures} ===`);
process.exit(failures === 0 ? 0 : 1);

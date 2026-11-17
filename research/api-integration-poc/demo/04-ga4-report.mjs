import { loadEnv, loadConfig } from '../src/config.js';
import { createLogger } from '../src/log.js';
import { createProviders } from '../src/factory.js';
import { PocError } from '../src/errors.js';

loadEnv();
const config = loadConfig();
const logger = createLogger(config.logLevel);
const { analytics } = createProviders(config, logger);

const results = [];
function record(step, status, detail) {
  results.push({ step, status, detail });
  console.log(`[${status}] ${step}${detail ? ` - ${detail}` : ''}`);
}

try {
  const properties = await analytics.ga4.listProperties();
  record('1. 发现可用 Property', 'PASS_MOCK', properties.map((p) => `${p.propertyId}:${p.displayName}`).join(', '));

  const propertyId = properties[0].propertyId;
  const report = await analytics.ga4.runReport({
    propertyId,
    dateRanges: [{ startDate: '2026-10-01', endDate: '2026-10-31' }],
    dimensions: ['sessionSource', 'sessionMedium'],
    metrics: ['sessions', 'totalUsers', 'screenPageViews'],
    limit: 10
  });
  const rows = report.rows.map((r) => {
    const d = Object.fromEntries(report.dimensionHeaders.map((h, i) => [h.name, r.dimensionValues[i].value]));
    const m = Object.fromEntries(report.metricHeaders.map((h, i) => [h.name, r.metricValues[i].value]));
    return { ...d, ...m };
  });
  record('2. 来源/媒介报表', 'PASS_MOCK', `${report.rowCount} 行`);
  console.table(rows);

  const pageReport = await analytics.ga4.runReport({
    propertyId,
    dateRanges: [{ startDate: '2026-10-01', endDate: '2026-10-31' }],
    dimensions: ['pagePath'],
    metrics: ['screenPageViews', 'eventCount'],
    limit: 5
  });
  record('3. 页面路径报表', 'PASS_MOCK', `${pageReport.rowCount} 行`);
  console.table(
    pageReport.rows.map((r) => ({
      pagePath: r.dimensionValues[0].value,
      screenPageViews: r.metricValues[0].value,
      eventCount: r.metricValues[1].value
    }))
  );

  const second = await analytics.ga4.runReport({
    propertyId: properties[1].propertyId,
    dateRanges: [{ startDate: '2026-11-01', endDate: '2026-11-16', name: 'current' }],
    dimensions: ['date'],
    metrics: ['sessions'],
    limit: 5
  });
  record('4. 多 Property 参数化查询', 'PASS_MOCK', `property=${properties[1].propertyId}, rows=${second.rowCount}`);

  try {
    await analytics.ga4.runReport({
      propertyId: 'forbidden',
      dateRanges: [{ startDate: '2026-10-01', endDate: '2026-10-31' }],
      dimensions: ['date'],
      metrics: ['sessions']
    });
    record('5. 无权限处理', 'FAIL', '未抛出预期错误');
  } catch (err) {
    record('5. 无权限处理', err.code === 'BLOCKED_PERMISSION' ? 'PASS_MOCK' : 'FAIL', `${err.code}: ${err.message}`);
  }

  try {
    await analytics.ga4.runReport({
      propertyId: 'quota',
      dateRanges: [{ startDate: '2026-10-01', endDate: '2026-10-31' }],
      dimensions: ['date'],
      metrics: ['sessions']
    });
    record('6. 配额超限处理', 'FAIL', '未抛出预期错误');
  } catch (err) {
    record('6. 配额超限处理', err.code === 'RATE_LIMITED' ? 'PASS_MOCK' : 'FAIL', `${err.code}: ${err.message}`);
  }

  try {
    await analytics.ga4.runReport({
      propertyId,
      dateRanges: Array.from({ length: 5 }, (_, i) => ({
        startDate: `2026-10-0${i + 1}`,
        endDate: `2026-10-0${i + 1}`
      })),
      dimensions: ['date'],
      metrics: ['sessions']
    });
    record('7. 无效参数处理', 'FAIL', '未拦截 5 个日期范围');
  } catch (err) {
    record('7. 无效参数处理', err instanceof PocError && err.code === 'BAD_REQUEST' ? 'PASS_MOCK' : 'FAIL', err.message);
  }

  record('真实接口验证', 'BLOCKED_CREDENTIAL', '未提供 GA4 Property 与服务账号授权');
} catch (err) {
  record('执行中断', 'FAIL', err.message);
  process.exitCode = 1;
}

console.log('\n证据摘要：');
for (const r of results) console.log(`- ${r.status}\t${r.step}\t${r.detail || ''}`);

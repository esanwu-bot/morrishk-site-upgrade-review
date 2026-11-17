import { loadEnv, loadConfig } from '../src/config.js';
import { createLogger } from '../src/log.js';
import { createProviders } from '../src/factory.js';

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
  const events = [
    {
      name: 'generate_lead',
      params: {
        form_id: 'contact',
        product_category: 'ferrite_core',
        value: 0,
        currency: 'USD'
      }
    }
  ];

  const debug = await analytics.mp.send({ clientId: 'poc-client-001', events, debug: true });
  record('1. Measurement Protocol 校验', 'PASS_MOCK', `validationMessages=${debug.validationMessages?.length ?? 'n/a'}`);

  const sent = await analytics.mp.send({ clientId: 'poc-client-001', events, debug: false });
  record('2. Measurement Protocol 发送', 'PASS_MOCK', `eventCount=${sent.eventCount}`);

  record('3. 说明', 'INFO', 'MP 只写不读；报表数据必须通过 Data API 查询');
  record('真实接口验证', 'BLOCKED_CREDENTIAL', '未提供 GA4_MEASUREMENT_ID / GA4_API_SECRET');
} catch (err) {
  record('执行中断', 'FAIL', err.message);
  process.exitCode = 1;
}

console.log('\n证据摘要：');
for (const r of results) console.log(`- ${r.status}\t${r.step}\t${r.detail || ''}`);

import { loadEnv, loadConfig } from '../src/config.js';
import { createLogger } from '../src/log.js';
import { createProviders } from '../src/factory.js';
import { assertMpWriteAllowed, statusLabel } from '../src/publish-guard.js';
import { PocError } from '../src/errors.js';

loadEnv();
const config = loadConfig();
const logger = createLogger(config.logLevel);
const { analytics } = createProviders(config, logger);
const real = config.mode === 'real';
const results = [];

function record(step, status, detail) {
  results.push({ step, status, detail });
  console.log(`[${status}] ${step}${detail ? ` - ${detail}` : ''}`);
}

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

try {
  // Measurement Protocol 的真实写入有独立开关，不继承社媒发布授权
  const guard = assertMpWriteAllowed(config, {
    confirmMp: process.argv.includes('--confirm-mp')
  });

  const debug = await analytics.mp.send({ clientId: 'poc-client-001', events, debug: true });
  record('1. Measurement Protocol 校验', statusLabel(guard.real, true), `validationMessages=${debug.validationMessages?.length ?? 'n/a'}`);

  const sent = await analytics.mp.send({ clientId: 'poc-client-001', events, debug: false });
  record(
    '2. Measurement Protocol 发送',
    statusLabel(guard.real, true),
    real ? `status=${sent.status}` : `eventCount=${sent.eventCount}（未进入任何真实报表）`
  );

  record('3. 说明', 'INFO', 'MP 只写不读；报表数据必须通过 Data API 查询');
} catch (err) {
  const blocked =
    err instanceof PocError && (err.code === 'POLICY_BLOCKED' || err.code.startsWith('BLOCKED_'));
  record('Measurement Protocol 真实写入', blocked ? err.code : 'FAIL', err.message);
  if (!blocked) process.exitCode = 1;
}

console.log('\n证据摘要：');
for (const r of results) console.log(`- ${r.status}\t${r.step}\t${r.detail || ''}`);

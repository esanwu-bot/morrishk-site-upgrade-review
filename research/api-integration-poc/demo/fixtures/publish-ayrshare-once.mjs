import { AyrshareProvider } from '../../src/providers/social/ayrshare.js';
import { redact, redactSecrets } from '../../src/redact.js';

// 仅用于本地 Mock Server 的真实模式代码路径测试；不打印 PASS_REAL_API 标签。
const profileKey = process.env.TEST_PROFILE_KEY || '';
const provider = new AyrshareProvider({
  mode: 'real',
  config: { ayrshare: { apiKey: 'fixture-key', baseUrl: process.env.AYRSHARE_BASE_URL } },
  logger: null,
  timeoutMs: 5_000
});

try {
  const result = await provider.publish({
    text: 'fixture publish',
    platforms: ['linkedin'],
    profileKey,
    idempotencyKey: 'redaction-fixture-1'
  });
  console.log(
    JSON.stringify({
      id: result.id,
      status: result.status,
      profileKey: result.profileKey,
      target: result.target,
      preflight: result.preflight
    })
  );
} catch (err) {
  console.error(
    JSON.stringify(
      redact({
        code: err.code || 'FAIL',
        message: redactSecrets(err.message, [profileKey]),
        details: err.details || null
      })
    )
  );
  process.exitCode = 1;
}

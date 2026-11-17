import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const demos = [
  '01-social-connect.mjs',
  '02-social-publish.mjs',
  '03-video-upload.mjs',
  '04-ga4-report.mjs',
  '05-ga4-measurement-protocol.mjs'
];

let failed = false;
for (const demo of demos) {
  console.log(`\n========== ${demo} ==========`);
  const res = spawnSync(process.execPath, [path.join(here, demo)], { stdio: 'inherit' });
  if (res.status !== 0) failed = true;
}

if (failed) {
  console.error('\n存在失败的 Demo');
  process.exit(1);
}
console.log('\n全部 Demo 执行完成（Mock 模式）');

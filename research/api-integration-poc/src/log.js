import { redact, redactString } from './redact.js';

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };

export function createLogger(level = 'info', sink = console) {
  const threshold = LEVELS[level] ?? LEVELS.info;
  const write = (lvl, message, fields) => {
    if (LEVELS[lvl] < threshold) return;
    const line = {
      ts: new Date().toISOString(),
      level: lvl,
      message: redactString(message),
      ...(fields ? redact(fields) : {})
    };
    const text = JSON.stringify(line);
    if (lvl === 'error') sink.error(text);
    else if (lvl === 'warn') sink.warn(text);
    else sink.log(text);
  };
  return {
    debug: (m, f) => write('debug', m, f),
    info: (m, f) => write('info', m, f),
    warn: (m, f) => write('warn', m, f),
    error: (m, f) => write('error', m, f)
  };
}

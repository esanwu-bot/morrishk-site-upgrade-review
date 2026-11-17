import fs from 'node:fs';
import path from 'node:path';

export class FileTokenStore {
  constructor(dir) {
    this.dir = path.resolve(dir);
  }

  file(key) {
    return path.join(this.dir, `${key.replace(/[^a-z0-9._-]/gi, '_')}.json`);
  }

  ensureDir() {
    fs.mkdirSync(this.dir, { recursive: true, mode: 0o700 });
  }

  save(key, tokens) {
    this.ensureDir();
    const file = this.file(key);
    fs.writeFileSync(file, JSON.stringify(tokens, null, 2), { encoding: 'utf8', mode: 0o600 });
    try {
      fs.chmodSync(file, 0o600);
    } catch {
      // Windows 上可能不支持，忽略
    }
    return file;
  }

  load(key) {
    const file = this.file(key);
    if (!fs.existsSync(file)) return null;
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      return null;
    }
  }

  remove(key) {
    const file = this.file(key);
    if (fs.existsSync(file)) fs.rmSync(file);
  }

  list() {
    if (!fs.existsSync(this.dir)) return [];
    return fs
      .readdirSync(this.dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace(/\.json$/, ''));
  }
}

export function isExpired(tokens, skewMs = 0) {
  if (!tokens?.expiresAt) return false;
  return Date.now() + skewMs >= tokens.expiresAt;
}

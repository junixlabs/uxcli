// The one place that turns a file on disk into the hash a commitment's anchor is compared against.
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';

export const sha256File = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');

// A run's identity is the packet it produced. Screenshots are proof a person looks at; `run.json` is
// what every verdict downstream was read from, so it is what an anchor pins.
export function runHash(dir) {
  const f = path.join(dir, 'run.json');
  try { return fs.existsSync(f) ? sha256File(f) : null; } catch { return null; }
}

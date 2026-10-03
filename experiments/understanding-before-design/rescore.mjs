#!/usr/bin/env node
// Score every recorded session again with the instrument as it is now, so arms run on different days
// (or across a change to the observer) are compared by one and the same measurement. A session's
// working directory is gone once it was scored, so the product is staged again from the fixture with
// the page the session wrote (results/<session>/lead.html) put back in place.
//
//   node experiments/understanding-before-design/rescore.mjs
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import { fileURLToPath } from 'node:url';
import { score } from './score.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const FIXTURE = path.join(ROOT, 'test', 'fixtures', 'crm');
const RESULTS = path.join(HERE, 'results');
for (const d of fs.readdirSync(RESULTS).filter(d => fs.existsSync(path.join(RESULTS, d, 'session.json'))).sort()) {
  const f = path.join(RESULTS, d, 'session.json'); const rec = JSON.parse(fs.readFileSync(f, 'utf8'));
  const lead = path.join(RESULTS, d, 'lead.html');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `ubd-rescore-${d}-`));
  fs.cpSync(FIXTURE, dir, { recursive: true, filter: src => !/[\\/]\.uxcli[\\/](runs|index\.json)/.test(src) && !/[\\/]pages[\\/]lead\.html$/.test(src) });
  if (fs.existsSync(lead)) fs.copyFileSync(lead, path.join(dir, 'pages', 'lead.html'));
  try { rec.score = await score(dir, { fixture: FIXTURE, root: ROOT }); rec.rescoredAt = new Date().toISOString(); } catch (e) { rec.score = { error: e.message }; }
  fs.rmSync(dir, { recursive: true, force: true });
  fs.writeFileSync(f, JSON.stringify(rec, null, 1) + '\n');
  console.log(`${d}  390: ${rec.score?.['390x844']?.summary || rec.score?.error}  1440: ${rec.score?.['1440x900']?.summary || ''}`);
}

#!/usr/bin/env node
// Score every recorded session again with the instrument as it is now, so arms run on different days
// (or across a change to the observer) are compared by one and the same measurement. A session's
// working directory is gone once it was scored, so the product is staged again from the fixture with
// the page the session wrote (results/<session>/lead.html) put back in place.
//
//   node experiments/understanding-before-design/rescore.mjs [--only=<session prefix>]
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import { fileURLToPath } from 'node:url';
import { score } from './score.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const FIXTURE = path.join(ROOT, 'test', 'fixtures', 'crm');
const RESULTS = path.join(HERE, 'results');
const ONLY = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7);
for (const d of fs.readdirSync(RESULTS).filter(d => fs.existsSync(path.join(RESULTS, d, 'session.json')) && (!ONLY || d.startsWith(ONLY))).sort()) {
  const f = path.join(RESULTS, d, 'session.json'); const rec = JSON.parse(fs.readFileSync(f, 'utf8'));
  const lead = path.join(RESULTS, d, 'lead.html');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `ubd-rescore-${d}-`));
  fs.cpSync(FIXTURE, dir, { recursive: true, filter: src => !/[\\/]\.uxcli[\\/](runs|index\.json)/.test(src) && !/[\\/]pages[\\/]lead\.html$/.test(src) });
  if (fs.existsSync(lead)) fs.copyFileSync(lead, path.join(dir, 'pages', 'lead.html'));
  // the arm's own staging of the declarations: draw and gate removed the two drawings (no session put
  // one back), gate held the work to the design step
  if (rec.ticket !== 2 && ['draw', 'drawpre', 'gate', 'gatev1', 'gatev2', 'asked'].includes(rec.arm)) for (const st of ['agent.lead_detail', 'agent.call_started']) fs.rmSync(path.join(dir, '.uxcli', 'mockups', st), { recursive: true, force: true });
  // what the session left under .uxcli/ (its journey and policy for ticket 2, its drawings for the draw arms) goes back in place
  const decl = path.join(RESULTS, d, 'decl'); if (fs.existsSync(decl)) fs.cpSync(decl, path.join(dir, '.uxcli'), { recursive: true });
  if (['gate', 'gatev1', 'gatev2', 'asked'].includes(rec.arm)) { const pf = path.join(dir, '.uxcli', 'policy', 'policy.json'); const p = JSON.parse(fs.readFileSync(pf, 'utf8')); p.project.design = 'drawn'; fs.writeFileSync(pf, JSON.stringify(p, null, 2)); }
  try { rec.score = await score(dir, { fixture: FIXTURE, root: ROOT, keep: path.join(RESULTS, d), outcomes: rec.ticket === 2 }); rec.rescoredAt = new Date().toISOString(); } catch (e) { rec.score = { error: e.message }; }
  fs.rmSync(dir, { recursive: true, force: true });
  fs.writeFileSync(f, JSON.stringify(rec, null, 1) + '\n');
  console.log(`${d}  390: ${rec.score?.['390x844']?.summary || rec.score?.error}  1440: ${rec.score?.['1440x900']?.summary || ''}`);
}

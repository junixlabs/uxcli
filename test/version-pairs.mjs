// A version names one walk of a journey so it is kept and can be compared. Each promise is a pair: a
// version is created and never rewritten; it names a walk of its own journey or nothing; the walk it
// names survives pruning while an unnamed one of the same age does not; two versions compare step by
// step, with both pictures side by side on the page.
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseVersion } from '../src/core/model/version.js';
import { saveVersion, versions, pinnedRuns } from '../src/version.js';
import { versionComparison, experiencePage } from '../src/experience.js';
import { prune } from '../src/adapters/store/runs.js';
import { validate } from './lib/json-schema.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schema = JSON.parse(fs.readFileSync(path.join(ROOT, 'schemas', 'version.schema.json'), 'utf8'));
const EXAMPLE = path.join(ROOT, 'examples', 'crm');

export const OPERATOR = 'the example\'s versions satisfy the schema and the parser; a version without a walk, by nobody, or with an unknown key is refused; save writes one file for the newest walk of the journey and refuses to rewrite it, to name a walk of another journey, and to name a journey never walked; of eight walks of one journey pruned to seven the oldest goes unless a version names it; two versions compare with the steps and the estimate that moved, and the page shows both pictures of a step side by side';

export async function pair() {
  const problems = []; let checks = 0;
  const must = (what, cond) => { checks++; if (!cond) problems.push(what); };

  // the shipped example
  const ex = versions(EXAMPLE);
  must('the example carries no version', ex.length >= 2);
  for (const v of ex) {
    must(`${path.relative(ROOT, v.file)}: ${(v.problems || []).join('; ')}`, !!v.value);
    const bad = validate(schema, JSON.parse(fs.readFileSync(v.file, 'utf8'))); must(`${path.relative(ROOT, v.file)} fails version.schema.json: ${bad.join('; ')}`, !bad.length);
  }
  const base = JSON.parse(fs.readFileSync(ex[0].file, 'utf8'));
  for (const [what, mutate, word] of [['a version with no walk', d => { delete d.run; }, 'run:'], ['a version by nobody', d => { delete d.by; }, 'by:'], ['an unknown key', d => { d.score = 1; }, 'unknown key']]) {
    const d = JSON.parse(JSON.stringify(base)); mutate(d); const r = parseVersion(d);
    must(`${what} was accepted`, !r.value && r.problems.some(p => p.includes(word)));
    must(`${what} was accepted by the schema`, validate(schema, d).length > 0);
  }

  // save: creates, names the newest walk of the journey, refuses the rest
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-version-'));
  fs.cpSync(path.join(EXAMPLE, '.uxcli', 'runs'), path.join(tmp, '.uxcli', 'runs'), { recursive: true });
  const by = { type: 'person', ref: 'test' };
  const r1 = saveVersion(tmp, 'handle-inbound-lead', 'before', { by, note: 'the lead as it is' });
  must(`save did not write a version: ${(r1.problems || []).join('; ')}`, r1.file && fs.existsSync(r1.file));
  must('save did not name the newest walk with steps', r1.value?.run === 'runs/R-2026-09-25T08-41-12Z-zs8fns');
  const again = saveVersion(tmp, 'handle-inbound-lead', 'before', { by });
  must('save rewrote a version', again.problems?.some(p => p.includes('never rewritten')));
  const wrong = saveVersion(tmp, 'handle-inbound-lead', 'other', { by, run: 'R-2026-09-25T08-39-40Z-on0ces' });
  must('save named a walk of another journey', wrong.problems?.some(p => p.includes('not handle-inbound-lead')));
  const never = saveVersion(tmp, 'checkout', 'v1', { by });
  must('save named a journey never walked', never.problems?.some(p => p.includes('run it first')));

  // pruning keeps what a version names
  const runs = path.join(tmp, '.uxcli', 'runs'); const src = path.join(runs, 'R-2026-09-25T08-41-12Z-zs8fns');
  const made = [];
  for (let i = 0; i < 8; i++) {
    const name = `R-2026-10-0${1 + Math.floor(i / 4)}T0${i % 4}-00-00Z-p${String(i).padStart(5, '0')}`;
    const dir = path.join(runs, name); fs.mkdirSync(dir, { recursive: true });
    const run = JSON.parse(fs.readFileSync(path.join(src, 'run.json'), 'utf8')); run.ranAt = `2026-10-0${1 + Math.floor(i / 4)}T0${i % 4}:00:00Z`;
    fs.writeFileSync(path.join(dir, 'run.json'), JSON.stringify(run)); made.push(dir);
  }
  const oldest = made[0];
  const keepNamed = fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-version-'));
  fs.cpSync(tmp, keepNamed, { recursive: true });
  // must-fail: nothing names the oldest walk, so pruning to seven removes it
  prune(tmp, { keep: 7, pinned: pinnedRuns(tmp) });
  must('pruning kept a walk nothing names', !fs.existsSync(oldest));
  // must-pass: a version names it, so it stays
  saveVersion(keepNamed, 'handle-inbound-lead', 'pinned', { by, run: path.basename(oldest) });
  prune(keepNamed, { keep: 7, pinned: pinnedRuns(keepNamed) });
  must('pruning removed a walk a version names', fs.existsSync(path.join(keepNamed, '.uxcli', 'runs', path.basename(oldest))));

  // two versions, compared
  const c = await versionComparison(EXAMPLE, 'handle-inbound-lead', 'v1', 'v2');
  must(`the example versions did not compare: ${(c.problems || []).join('; ')}`, !!c.entry);
  if (c.entry) {
    must('the comparison did not carry the steps that moved', c.entry.change.totals.steps.delta === c.entry.report.totals.steps - c.entry.previous.report.totals.steps);
    const out = experiencePage([c.entry], path.join(tmp, 'experience', 'index.html'));
    const html = fs.readFileSync(out, 'utf8');
    must('the page does not lay the two versions side by side', /class="compare"/.test(html) && (html.match(/class="pair"/g) || []).length === c.entry.report.steps.length && html.includes('v1') && html.includes('v2'));
  }
  const missing = await versionComparison(EXAMPLE, 'handle-inbound-lead', 'v1', 'v9');
  must('a comparison with a version that does not exist was not refused', missing.problems?.some(p => p.includes('v9')));
  for (const d of [tmp, keepNamed]) fs.rmSync(d, { recursive: true, force: true });
  return { ok: !problems.length, checks, problems };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = await pair();
  console.log(r.ok ? `PASS version · ${r.checks} checks` : 'FAIL ' + r.problems.join('\n     '));
  process.exit(r.ok ? 0 : 1);
}

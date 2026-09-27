#!/usr/bin/env node
// results/*/session.json → results/summary.md: the three numbers the plan asked for, per arm, and
// the skill arm's re-measure. First-run pass = the page the agent wrote, measured once by uxcli at
// that viewport, exited 0 with C-001 `pass` and every step's after-state held. Nothing is read from
// what the agent said; only from what the browser saw.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)); const RESULTS = path.join(HERE, 'results');
const rows = fs.readdirSync(RESULTS).filter(d => fs.existsSync(path.join(RESULTS, d, 'session.json'))).map(d => JSON.parse(fs.readFileSync(path.join(RESULTS, d, 'session.json'), 'utf8')));
const arms = ['ticket', 'journey', 'context', 'skill'].filter(a => rows.some(r => r.arm === a));
const pass = (r, vp) => { const s = r.score?.[vp]; return !!s && s.exit === 0 && s.c001?.includes('pass') && s.steps?.length > 0 && s.steps.every(x => x.afterHeld === true); };
const c001 = (r, vp) => r.score?.[vp]?.c001?.includes('pass');
const held = (r, vp) => { const s = r.score?.[vp]; return s?.steps ? `${s.steps.filter(x => x.afterHeld === true).length}/${s.steps.length}` : '—'; };
const pct = (n, d) => d ? `${n}/${d} (${Math.round(100 * n / d)}%)` : '—';
const saidDone = r => /\b(done|finished|complete[d]?)\b/i.test(r.final || '');
const L = ['# Understanding before design — results', '', `Sessions: ${rows.length}. Model: ${[...new Set(rows.map(r => r.model))].join(', ')}. Scored by \`uxcli run\` on the page each session wrote; see run.mjs and score.mjs.`, '',
  '| arm | n | wrote lead.html | first-run pass 390×844 | first-run pass 1440×900 | C-001 pass 390 | hooks lead-phone / call-action / call-status | median s |', '|---|---|---|---|---|---|---|---|'];
for (const a of arms) {
  const R = rows.filter(r => r.arm === a); const n = R.length; const med = [...R.map(r => r.seconds)].sort((x, y) => x - y)[Math.floor(n / 2)];
  const hooks = ['lead-phone', 'call-action', 'call-status'].map(h => R.filter(r => r.score?.hooks?.[h]).length).join(' / ');
  L.push(`| ${a} | ${n} | ${pct(R.filter(r => r.wroteLead).length, n)} | ${pct(R.filter(r => pass(r, '390x844')).length, n)} | ${pct(R.filter(r => pass(r, '1440x900')).length, n)} | ${pct(R.filter(r => c001(r, '390x844')).length, n)} | ${hooks} | ${med ?? '—'} |`);
}
if (arms.includes('skill')) {
  const R = rows.filter(r => r.arm === 'skill');
  L.push('', '## The skill arm, re-measured', '', `| ran uxcli at least once | ran \`uxcli run\` | said done while its own last run failed | edited a declaration under .uxcli/ |`, '|---|---|---|---|');
  const ranRun = R.filter(r => r.ranUxcli.some(c => /uxcli run/.test(c)));
  const doneWithFail = R.filter(r => saidDone(r) && r.score?.['390x844']?.exit === 2 && r.ranUxcli.some(c => /uxcli run/.test(c)));
  L.push(`| ${pct(R.filter(r => r.ranUxcli.length).length, R.length)} | ${pct(ranRun.length, R.length)} | ${pct(doneWithFail.length, R.length)} | ${pct(R.filter(r => r.editedDeclarations.length).length, R.length)} |`);
  L.push('', '"said done while its own last run failed" counts a session whose final message claims completion while the page it left measures exit 2 at 390×844 and it had run `uxcli run` itself. It is a reading of the final message against the score, not of the transcript\'s reasoning.');
}
L.push('', '## Per session', '', '| session | s | lead.html | 390: exit · C-001 · after-states | 1440: exit · C-001 · after-states | uxcli runs |', '|---|---|---|---|---|---|');
for (const r of rows.sort((a, b) => a.arm.localeCompare(b.arm) || a.i - b.i)) L.push(`| ${r.arm}-${String(r.i).padStart(2, '0')} | ${r.seconds} | ${r.wroteLead ? 'yes' : 'no'} | ${r.score?.['390x844'] ? `${r.score['390x844'].exit} · ${r.score['390x844'].c001?.join('/') || '—'} · ${held(r, '390x844')}` : r.score?.error || '—'} | ${r.score?.['1440x900'] ? `${r.score['1440x900'].exit} · ${r.score['1440x900'].c001?.join('/') || '—'} · ${held(r, '1440x900')}` : '—'} | ${r.ranUxcli?.length || 0} |`);
fs.writeFileSync(path.join(RESULTS, 'summary.md'), L.join('\n') + '\n');
console.log(L.slice(0, 7 + arms.length).join('\n'));

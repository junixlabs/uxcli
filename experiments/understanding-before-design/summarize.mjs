#!/usr/bin/env node
// results/*/session.json → results/summary.md: the three numbers the plan asked for, per arm, and
// the skill arm's re-measure. First-run pass = the page the agent wrote, measured once by uxcli at
// that viewport, exited 0 with C-001 `pass` and every step's after-state held. Nothing is read from
// what the agent said; only from what the browser saw.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)); const RESULTS = path.join(HERE, 'results');
const all = fs.readdirSync(RESULTS).filter(d => fs.existsSync(path.join(RESULTS, d, 'session.json'))).map(d => JSON.parse(fs.readFileSync(path.join(RESULTS, d, 'session.json'), 'utf8')));
const rows = all.filter(r => r.ticket !== 2), rows2 = all.filter(r => r.ticket === 2);
const arms = ['ticket', 'journey', 'context', 'skill', 'drawpre', 'draw', 'gatev1', 'gatev2', 'gate', 'asked'].filter(a => rows.some(r => r.arm === a));
const pass = (r, vp) => { const s = r.score?.[vp]; const m = (s?.steps || []).filter(x => typeof x.afterHeld === 'boolean'); return !!s && s.exit === 0 && s.c001?.includes('pass') && m.length > 0 && m.every(x => x.afterHeld === true); };
const c001 = (r, vp) => r.score?.[vp]?.c001?.includes('pass');
const held = (r, vp) => { const s = r.score?.[vp]; const m = (s?.steps || []).filter(x => typeof x.afterHeld === 'boolean'); return s?.steps ? `${m.filter(x => x.afterHeld).length}/${m.length}` : '—'; };
const pct = (n, d) => d ? `${n}/${d} (${Math.round(100 * n / d)}%)` : '—';
const saidDone = r => /\b(done|finished|complete[d]?)\b/i.test(r.final || '');
const L = ['# Understanding before design — results', '', `Sessions: ${rows.length}. Model: ${[...new Set(rows.map(r => r.model))].join(', ')}. Scored by \`uxcli run\` on the page each session wrote; see run.mjs and score.mjs.`, '',
  '| arm | n | wrote lead.html | first-run pass 390×844 | first-run pass 1440×900 | C-001 pass 390 | hooks lead-phone / call-action / call-status | median s |', '|---|---|---|---|---|---|---|---|'];
for (const a of arms) {
  const R = rows.filter(r => r.arm === a); const n = R.length; const med = [...R.map(r => r.seconds)].sort((x, y) => x - y)[Math.floor(n / 2)];
  const hooks = ['lead-phone', 'call-action', 'call-status'].map(h => R.filter(r => r.score?.hooks?.[h]).length).join(' / ');
  L.push(`| ${a} | ${n} | ${pct(R.filter(r => r.wroteLead).length, n)} | ${pct(R.filter(r => pass(r, '390x844')).length, n)} | ${pct(R.filter(r => pass(r, '1440x900')).length, n)} | ${pct(R.filter(r => c001(r, '390x844')).length, n)} | ${hooks} | ${med ?? '—'} |`);
}
// What the person goes through on the page each arm built, from the trace of the scoring walk.
{
  const med = xs => { const v = xs.filter(x => typeof x === 'number').sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : null; };
  L.push('', '## Experience on the walk (uxcli experience)', '', 'Per arm, at each viewport: the median keystroke-level estimate and scrolls of the happy workflow, the median number of findings, and how many pages had a control the step needs below the fold.', '',
    '| arm | n | 390: estimate s · scrolls · findings · below the fold | 1440: estimate s · scrolls · findings · below the fold |', '|---|---|---|---|');
  for (const a of arms) {
    const R = rows.filter(r => r.arm === a);
    const cell = vp => { const X = R.map(r => r.score?.[vp]?.experience).filter(Boolean); return X.length ? `${med(X.map(x => x.klmSeconds)) ?? '—'} · ${med(X.map(x => x.scrolls)) ?? '—'} · ${med(X.map(x => x.findings))} · ${X.filter(x => x.byMetric?.reach).length}/${X.length}` : '—'; };
    L.push(`| ${a} | ${R.length} | ${cell('390x844')} | ${cell('1440x900')} |`);
  }
}
if (arms.includes('draw') || arms.includes('drawpre')) {
  const R = rows.filter(r => r.arm === 'draw'); const P = rows.filter(r => r.arm === 'drawpre');
  L.push('', '## The draw arm: choosing a lens before drawing', '', 'The lead page\'s two screens are not drawn and the project records the `workspace` template, so the agent has to choose a lens, draw and wait for a pick. The right lens for a CRM\'s lead detail is `workspace`.', '',
    'drawpre: before context show said which screens must be drawn first; draw: after.', '',
    '| arm | read a lens | read the workspace lens | looked at the template | drew variants | wrote a lens review | built lead.html anyway |', '|---|---|---|---|---|---|---|');
  for (const [name, R] of [['drawpre', P], ['draw', rows.filter(r => r.arm === 'draw')]]) if (R.length) L.push(`| ${name} | ${pct(R.filter(r => (r.lenses || []).length).length, R.length)} | ${pct(R.filter(r => (r.lenses || []).includes('workspace')).length, R.length)} | ${pct(R.filter(r => r.templateShown).length, R.length)} | ${pct(R.filter(r => (r.drew || []).length).length, R.length)} | ${pct(R.filter(r => (r.reviews || []).length).length, R.length)} | ${pct(R.filter(r => r.wroteLead).length, R.length)} |`);
}
// The gate arms: the draw arm with policy project.design: drawn. A clean walk exits 3 until each walked
// screen has two drawings and a complete review. gatev1: the card named what was missing; gate: it also
// said that drawing and reviewing are the agent's to do now.
if (arms.some(a => a.startsWith('gate'))) {
  const clean = (r, vp) => { const s = r.score?.[vp]; const m = (s?.steps || []).filter(x => typeof x.afterHeld === 'boolean'); return !!s && [0, 3].includes(s.exit) && s.c001?.includes('pass') && m.length > 0 && m.every(x => x.afterHeld); };
  const notDone = r => /not (done|finished|complete)|can.t call|isn.t (done|finished|complete)|not calling|not call (it|this)|is not finished|not yet done/i.test(r.final || '');
  L.push('', '## The gate arms: the design step held by the instrument', '', 'Policy `project.design: drawn`; the two lead screens undrawn. "walk clean" is exit 0 or 3 with C-001 pass and every after-state held — the page, measured apart from the design step. "said not done" reads the final message.', '',
    '| arm | n | walk clean 390 | design closed (exit 0) 390 | read a lens | drew variants | wrote a lens review | said not done |', '|---|---|---|---|---|---|---|---|');
  for (const a of ['gatev1', 'gatev2', 'gate', 'asked'].filter(a => arms.includes(a))) { const R = rows.filter(r => r.arm === a); L.push(`| ${a} | ${R.length} | ${pct(R.filter(r => clean(r, '390x844')).length, R.length)} | ${pct(R.filter(r => r.score?.['390x844']?.exit === 0).length, R.length)} | ${pct(R.filter(r => (r.lenses || []).length).length, R.length)} | ${pct(R.filter(r => (r.drew || []).length).length, R.length)} | ${pct(R.filter(r => (r.reviews || []).length).length, R.length)} | ${pct(R.filter(notDone).length, R.length)} |`); }
}
// Ticket 2: the agent decides the controls and the steps and extends the journey; the walk is its own,
// and what it achieved is read from the server.
if (rows2.length) {
  const med = xs => { const v = xs.filter(x => typeof x === 'number').sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : null; };
  L.push('', '## Ticket 2: recording how a call went — the agent decides the steps', '', 'Each session extends the journey with the steps a person takes on its page; the scorer walks that journey and reads from the server whether the walk recorded "reached, qualified". The estimate and steps are of the happy workflow, as the session wrote it.', '',
    '| arm | n | outcome recorded 390 | outcome recorded 1440 | exit 0 / 2 / 3 / other at 390 | median estimate s 390 | median steps | median findings 390 |', '|---|---|---|---|---|---|---|---|');
  for (const a of [...new Set(rows2.map(r => r.arm))].sort()) {
    const R = rows2.filter(r => r.arm === a); const ex = R.map(r => r.score?.['390x844']?.exit);
    const ok = R.filter(r => r.score?.['390x844']?.reachedQualified);
    L.push(`| ${a} | ${R.length} | ${pct(ok.length, R.length)} | ${pct(R.filter(r => r.score?.['1440x900']?.reachedQualified).length, R.length)} | ${[0, 2, 3].map(e => ex.filter(x => x === e).length).join(' / ')} / ${ex.filter(x => ![0, 2, 3].includes(x)).length} | ${med(ok.map(r => r.score['390x844'].experience?.klmSeconds)) ?? '—'} | ${med(ok.map(r => r.score['390x844'].workflowSteps)) ?? '—'} | ${med(ok.map(r => r.score['390x844'].experience?.findings)) ?? '—'} |`);
  }
  L.push('', 'Estimate and steps are taken over the sessions whose walk recorded the outcome; a walk that did not is not a short one.');
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
for (const r of all.sort((a, b) => (a.ticket || 1) - (b.ticket || 1) || a.arm.localeCompare(b.arm) || a.i - b.i)) L.push(`| ${r.ticket === 2 ? 't2-' : ''}${r.arm}-${String(r.i).padStart(2, '0')} | ${r.seconds} | ${r.wroteLead ? 'yes' : 'no'} | ${r.score?.['390x844'] ? `${r.score['390x844'].exit} · ${r.score['390x844'].c001?.join('/') || '—'} · ${held(r, '390x844')}` : r.score?.error || '—'} | ${r.score?.['1440x900'] ? `${r.score['1440x900'].exit} · ${r.score['1440x900'].c001?.join('/') || '—'} · ${held(r, '1440x900')}` : '—'} | ${r.ranUxcli?.length || 0} |`);
fs.writeFileSync(path.join(RESULTS, 'summary.md'), L.join('\n') + '\n');
console.log(L.slice(0, 7 + arms.length).join('\n'));

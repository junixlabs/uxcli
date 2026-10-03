// The dashboard: one project as a coverage matrix. Each row is a screen a journey passes through; each
// column is a kind of evidence uxcli keeps about it. A cell that is empty is a gap and says which command
// fills it — never a pass. Built from the studio's model (which has already read every file) plus the
// declarations the studio does not carry: commitments, proposals, the actors' unknowns.
// Pure: everything is handed in already read.
//
// in:  studio: studioModel(), journeys: [journey declarations], commitments, proposals, actors, folder
// out: { folder, project, generatedAt, columns, rows: [{ journey, state, cells: { <column>: cell } }], totals }
//      lastRuns: { [journey]: { when, worst } } — the newest packet of a journey, walked or not
//      cell: { state: 'ok' | 'gap' | 'fail' | 'finding' | 'open' | 'na', text, fill? } — na: nothing to measure here
import { compareExperience } from './experience.js';

export const COLUMNS = [
  { id: 'understood', label: 'understood', means: 'the journey traces an insight and its actor is written' },
  { id: 'drawn', label: 'drawn', means: 'variants drawn under .uxcli/mockups/<state>/' },
  { id: 'picked', label: 'picked', means: 'a person picked one, or asked for a redraw' },
  { id: 'reviewed', label: 'reviewed', means: 'a complete lens review of a variant' },
  { id: 'walked', label: 'walked', means: 'the journey was walked in Chrome and this screen was reached' },
  { id: 'verdict', label: 'verdict', means: 'what the walk measured on the step that reaches this screen' },
  { id: 'estimate', label: 'estimate', means: 'keystroke-level seconds to reach this screen from the one before' },
  { id: 'walkthrough', label: 'walkthrough', means: 'the four questions answered at the step that reaches it' },
];

const gap = (text, fill) => ({ state: 'gap', text, fill });
const ok = text => ({ state: 'ok', text });

export function dashboardModel({ studio, journeys = [], commitments = [], proposals = [], actors = [], lastRuns = {}, folder = '.' }) {
  const decl = Object.fromEntries(journeys.map(j => [j.id, j]));
  const actorOf = Object.fromEntries(actors.map(a => [a.actor, a]));
  const rows = [];
  for (const j of studio.journeys || []) {
    const d = decl[j.id] || {}; const trace = (d.trace || []).length; const actor = actorOf[j.actor];
    // the screens of the journey in the order a person meets them, each with the step that reaches it
    const seen = new Map();
    for (const w of j.workflows) for (const s of w.steps) {
      if (!seen.has(s.before.state)) seen.set(s.before.state, { step: null, workflow: w.id });
      const cur = seen.get(s.after.state); if (!cur || !cur.step) seen.set(s.after.state, { step: s, workflow: w.id });
    }
    for (const [state, { step }] of seen) {
      const des = step?.design || (j.workflows.flatMap(w => w.steps).find(s => s.design?.state === state)?.design) || null;
      const variants = des?.variants || [];
      const lenses = [...new Set(variants.flatMap(v => (v.reviews || []).map(r => r.lens)))];
      const cells = {};
      cells.understood = actor && trace ? ok(`${trace} insight${trace === 1 ? '' : 's'} · ${j.actor}`) : actor ? gap(`${j.actor}, no insight traced`, 'add the insight this journey rests on to its trace[]') : gap('no actor written', 'uxcli template apply <kind>, then answer the unknowns');
      cells.drawn = variants.length ? (variants.length >= 2 ? ok(`${variants.length}`) : { state: 'open', text: '1 — draw another', fill: 'two or three variants make a choice' }) : gap('—', `draw .uxcli/mockups/${state}/<variant>.html, then uxcli mockups`);
      cells.picked = des?.pick ? ok(des.pick.pick) : des?.revise && !des.revise.answered ? { state: 'open', text: 'redraw asked', fill: 'answer the revise.json note with a new drawing' } : variants.length ? { state: 'open', text: 'waiting', fill: 'a person picks: uxcli studio --serve' } : gap('—');
      cells.reviewed = lenses.length ? ok(lenses.join(', ')) : variants.length ? gap('—', `uxcli review ${state}/<variant> --lens=<kind> --write`) : gap('—');
      const walked = !!j.run && j.run.status !== 'blocked';
      // a journey whose packets keep no step trace (an older format, or a run that stopped before its
      // first step): it ran, and what it found is the packet's, not any one screen's
      const bare = !j.run && lastRuns[j.id];
      if (bare && step) {
        cells.walked = { state: 'open', text: `ran ${String(bare.when || '').slice(0, 10)}`, fill: 'the packet keeps no steps — open it under Runs' };
        cells.verdict = bare.worst === 'pass' ? ok('no fail') : { state: bare.worst === 'blocked' ? 'open' : bare.worst, text: `${bare.worst} (journey)`, fill: 'on the journey, not placed on a step' };
        cells.estimate = gap('—', `uxcli run .uxcli/journeys/${j.id}.json`); cells.walkthrough = gap('—');
        rows.push({ journey: j.id, goal: j.goal, state, cells }); continue;
      }
      if (!step) {
        // the screen a journey starts from: reached as a prerequisite, not measured
        cells.walked = walked ? ok('start') : gap('—', `uxcli run .uxcli/journeys/${j.id}.json`);
        const na = { state: 'na', text: '—', fill: null }; cells.verdict = { ...na, text: 'start' }; cells.estimate = na; cells.walkthrough = na;
      } else {
        const b = step.built || {};
        cells.walked = !j.run ? gap('—', `uxcli run .uxcli/journeys/${j.id}.json`) : j.run.status === 'blocked' ? { state: 'open', text: 'blocked', fill: 'read the run\'s blocked reason: identity, fixture or reach' } : b.metrics ? ok(String(j.run.ranAt || '').slice(0, 10)) : gap('not reached', 'the walk stopped before this step');
        const bad = (b.verdicts || []).find(v => v.value === 'fail') || (b.verdicts || []).find(v => v.value === 'finding') || null;
        cells.verdict = bad ? { state: bad.value, text: `${bad.commitment ? bad.commitment + ' ' : ''}${bad.value}`, fill: bad.what || null }
          : step.after?.held === false ? { state: 'fail', text: 'state not held' }
          : (b.findings || []).length ? { state: 'finding', text: `${b.findings.length} experience finding${b.findings.length === 1 ? '' : 's'}`, fill: b.findings.map(f => f.what).join('; ') }
          : b.metrics ? ok(step.after?.held ? 'held' : 'no fail') : gap('—');
        cells.estimate = b.metrics?.klmSeconds != null ? ok(`${b.metrics.klmSeconds} s`) : gap('—', 'uxcli experience after a walk');
        const wt = step.walkthrough || [];
        cells.walkthrough = wt.length ? { state: 'finding', text: `${wt.length} no/unsure`, fill: wt.map(x => `${x.question}: ${x.what}`).join('; ') } : walked && b.metrics ? gap('—', `uxcli walkthrough ${j.id} --write`) : gap('—');
      }
      rows.push({ journey: j.id, goal: j.goal, state, cells });
    }
  }
  // what the matrix rows do not hold
  const versions = (studio.journeys || []).map(j => {
    const vs = j.versions || []; if (vs.length < 2) return vs.length ? { journey: j.id, names: vs.map(v => v.name), delta: null } : null;
    const [a, b] = vs.slice(-2); return { journey: j.id, names: [a.name, b.name], delta: a.klmSeconds != null && b.klmSeconds != null ? Math.round((b.klmSeconds - a.klmSeconds) * 10) / 10 : null };
  }).filter(Boolean);
  const totals = {
    screens: rows.length,
    gaps: rows.reduce((n, r) => n + Object.values(r.cells).filter(c => c.state === 'gap').length, 0),
    fails: rows.filter(r => r.cells.verdict.state === 'fail').length,
    commitments: { active: commitments.filter(c => c.status === 'ACTIVE').length, retiring: commitments.filter(c => c.status === 'RETIREMENT_PROPOSED').length },
    proposals: proposals.filter(p => p.status === 'proposed').length,
    unknowns: actors.reduce((n, a) => n + (a.unknowns || []).length, 0),
    versions,
  };
  return { folder, project: studio.project, generatedAt: studio.generatedAt, columns: COLUMNS, rows, totals };
}

export { compareExperience };

export function dashboardCard(m, page) {
  const t = m.totals; const L = [`uxcli dashboard · ${m.folder}`, '',
    `  ${t.screens} screens · ${t.gaps} empty cells · ${t.fails} failing · ${t.commitments.active} commitments active · ${t.proposals} proposals open · ${t.unknowns} unknowns`];
  const w = Math.max(...m.rows.map(r => r.state.length), 10);
  for (const r of m.rows) L.push(`  ${r.state.padEnd(w)}  ${m.columns.map(c => { const x = r.cells[c.id]; return x.state === 'gap' ? '·' : x.state === 'fail' ? 'F' : x.state === 'finding' ? 'f' : x.state === 'open' ? 'o' : x.state === 'na' ? '-' : '✓'; }).join(' ')}`);
  L.push(`  ${''.padEnd(w)}  ${m.columns.map(c => c.label[0]).join(' ')}   (✓ held · · gap · o waiting on a person · F fail · f finding · - nothing to measure)`);
  if (page) L.push('', `  page   ${page}`);
  L.push('', '  uxcli dashboard <dir> [<dir> …] --serve   every folder in one page, switched from the header; add a folder from the page');
  return L.join('\n');
}

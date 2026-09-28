#!/usr/bin/env node
// A journey run as a diagram: the flow the browser walked, drawn from the packet. Four lanes read
// top to bottom the way the instrument reasons — what the project declared (insight, commitments),
// the states the page had to hold, the steps the browser performed, and the verdicts that came out.
// Every node and edge is a fact in run.json; nothing is drawn that the run did not record.
//
// Rendered by the archify skill (~/.claude/skills/archify), whose compiler lays the lanes out and
// refuses a spec it cannot draw readably. This file only authors the spec.
//
//   node scripts/lab-flow.mjs <run dir> <out.html> [--spec out.json]
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ARCHIFY = process.env.ARCHIFY_HOME || path.join(os.homedir(), '.claude', 'skills', 'archify');
const idOf = s => String(s).replace(/[^a-zA-Z0-9_-]/g, '_').replace(/^[^a-zA-Z]/, 'n$&');
const short = (s, n = 26) => { s = String(s ?? ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const WORD = { fail: 'FAIL', finding: 'FINDING', pass: 'PASS', 'not-applicable': 'N/A', unmeasurable: 'UNMEASURABLE' };

// Columns are logical ranks 0..5. Each step stands under the state it starts from and its after-state
// sits one rank to the right, so every edge joins adjacent lanes over at most one rank: the compiler
// refuses long fan-outs as crossings, and a reader cannot follow them either. A state that two
// workflows start from is drawn once per workflow and says so.
export function specOf(run, commitments = [], { journey = {} } = {}) {
  const steps = run.steps || []; const byC = Object.fromEntries(commitments.map(c => [c.id, c]));
  const nodes = [], edges = [], lanes = [
    { id: 'states', label: 'Insight · states the page must hold' },
    { id: 'steps', label: 'Steps the browser walked' },
    { id: 'decided', label: 'Commitments · verdicts', variant: 'exception' },
  ];
  const taken = new Map();
  const free = (lane, want) => { const t = taken.get(lane) || taken.set(lane, new Set()).get(lane); const c = Math.min(5, Math.max(0, want)); for (let d = 0; d <= 5; d++) for (const x of [c + d, c - d]) if (x >= 0 && x <= 5 && !t.has(x)) { t.add(x); return x; } return null; };
  const W = 132; // one width for every node: the compiler measures labels, and the default 92px holds none of these
  const add = n => { nodes.push({ ...n, width: W }); return nodes.at(-1); };
  // Same rank, adjacent lanes: no label — the 66px between two lanes cannot carry one, and the
  // meaning is on the node it lands on (a state's held/not held is on the state). The route is left
  // to the compiler: a `straight` preset is refused there even when the automatic route is straight.
  const colOf = id => nodes.find(n => n.id === id)?.col;
  const edge = e => { const same = colOf(e.from) === colOf(e.to); const { label, ...rest } = e; edges.push({ id: idOf(`e_${e.from}_${e.to}_${edges.length}`), ...rest, ...(!same && { label }) }); };
  const stateLabel = name => short(name.includes('.') ? name.slice(name.indexOf('.') + 1) : name, 20);
  const stateSub = (name, held, strength, again) => short(`${again ? 'again · ' : name.includes('.') ? name.slice(0, name.indexOf('.')) + ' · ' : ''}${held === false ? 'NOT HELD' : held ? `held · ${strength}` : strength || ''}`, 26);

  const stepNode = new Map(); const seen = new Map(); // state name → count drawn
  let cursor = 0, lastAfter = null, prev = null;
  for (const s of steps) {
    if (s.kind === 'fixture') {
      const col = free('steps', cursor); if (col === null) break;
      const me = add({ id: idOf(`step_${s.workflow}_${s.id}`), lane: 'steps', col, type: 'database', label: `${s.id} · fixture`, sublabel: short(s.profile, 26), tag: `${s.ms}ms` });
      stepNode.set(s, me); prev = me; cursor = col + 1; continue;
    }
    // before: chained from the previous after-state when it is the same state, else drawn (again) at the cursor
    let b = null;
    if (s.before?.state) {
      if (lastAfter && lastAfter.name === s.before.state) b = lastAfter.node;
      else { const col = free('states', cursor); if (col === null) break; const n = (seen.get(s.before.state) || 0); seen.set(s.before.state, n + 1); b = add({ id: idOf(`state_${s.before.state}_${n}`), lane: 'states', col, type: 'backend', label: stateLabel(s.before.state), sublabel: stateSub(s.before.state, s.before.held, s.before.strength, n > 0) }); }
    }
    const col = free('steps', b ? b.col : cursor); if (col === null) break;
    const me = add({ id: idOf(`step_${s.workflow}_${s.id}`), lane: 'steps', col, type: 'frontend', label: s.id, sublabel: short(`${s.workflow} · ${s.action}`, 26), ...(s.timing?.toStable != null && { tag: `${s.timing.toStable}ms` }) });
    stepNode.set(s, me);
    if (prev && prev.type === 'database') edge({ from: prev.id, to: me.id, label: `produced ${Object.keys(steps.find(x => stepNode.get(x) === prev)?.produced || {}).length} value(s)`, variant: 'dashed', role: 'branch' });
    if (b) edge({ from: b.id, to: me.id, label: s.before.held ? 'before · held' : 'before · not held', variant: s.before.held ? 'default' : 'security' });
    let a = null;
    if (s.after?.state) {
      const acol = free('states', me.col + 1);
      if (acol !== null) { const n = (seen.get(s.after.state) || 0); seen.set(s.after.state, n + 1); a = add({ id: idOf(`state_${s.after.state}_${n}`), lane: 'states', col: acol, type: 'backend', label: stateLabel(s.after.state), sublabel: stateSub(s.after.state, s.after.held, s.after.strength, n > 0) });
        edge({ from: me.id, to: a.id, label: s.after.held ? 'after · held' : 'after · NOT HELD', variant: s.after.held ? 'emphasis' : 'security', ...(s.after.held === false && { role: 'error' }) }); }
    }
    lastAfter = a ? { name: s.after.state, node: a } : null; prev = me; cursor = (a ? a.col : me.col) + 1;
  }
  // the insight the journey traces to, left of the first state
  const trace = (journey.trace || []).find(t => /insights\//.test(t));
  const firstState = nodes.filter(n => n.lane === 'states').sort((a, b) => a.col - b.col)[0];
  if (trace && firstState && firstState.col > 0 && !(taken.get('states') || new Set()).has(firstState.col - 1)) { const col = free('states', firstState.col - 1); const n = add({ id: 'insight', lane: 'states', col, type: 'external', label: path.basename(trace, '.json'), sublabel: 'why this journey exists' }); edge({ from: n.id, to: firstState.id, label: 'trace', variant: 'dashed', role: 'branch' }); }
  // decided: one node per (commitment, step) carrying the loudest verdict, straight under the step
  const RANK = { fail: 3, finding: 2, unmeasurable: 1 };
  const groups = new Map();
  for (const v of run.verdicts || []) {
    const step = steps.find(s => s.id === (v.where || v.step) && (!v.workflow || s.workflow === v.workflow)); const me = step && stepNode.get(step); if (!me) continue;
    const k = `${v.commitment || 'state'}@${me.id}`; const g = groups.get(k) || groups.set(k, { me, v, n: 0, key: v.commitment || null }).get(k);
    g.n++; if ((RANK[v.value] || 0) > (RANK[g.v.value] || 0)) g.v = v;
  }
  for (const g of groups.values()) {
    const col = free('decided', g.me.col); if (col === null) continue;
    const c = g.key && byC[g.key]; const loud = g.v.value === 'fail' || g.v.value === 'finding';
    add({ id: idOf(`d_${g.key || 'state'}_${g.me.id}`), lane: 'decided', col, type: loud ? 'security' : 'messagebus', label: `${g.key || 'state'} · ${WORD[g.v.value] || g.v.value}${g.n > 1 ? ` ×${g.n}` : ''}`, sublabel: short(loud ? g.v.what : (c ? c.statement : g.v.cause), 26), ...(c && { tag: `${c.owner?.type} ${c.owner?.ref}` }) });
    edge({ from: g.me.id, to: nodes.at(-1).id, label: g.v.cause === 'state-not-held' ? 'state not held' : loud ? 'predicate false' : 'condition did not occur', variant: loud ? 'security' : 'dashed', role: loud ? 'error' : 'branch' });
  }
  // the happy path over the edges that exist, left to right
  const mainPath = []; let last = null;
  for (const s of steps) { const me = stepNode.get(s); if (!me) continue; if (last && !(edges.some(e => e.from === last.id && e.to === me.id) && me.col > last.col)) break; mainPath.push(me.id); last = me; const a = s.after?.state && nodes.find(n => n.lane === 'states' && n.col === me.col + 1 && edges.some(e => e.from === me.id && e.to === n.id)); if (!a) break; mainPath.push(a.id); last = a; }

  const loud = (run.verdicts || []).filter(v => v.value === 'fail' || v.value === 'finding');
  return {
    schema_version: 2, diagram_type: 'workflow',
    meta: { title: `${run.journey?.ref?.replace(/^journeys\//, '').replace(/\.json$/, '') || run.id} · ${run.viewport || ''} · exit ${run.exit}`, quality_profile: 'showcase', animation: 'none',
      legend: { mode: 'auto', entries: { external: { label: 'insight the journey traces to' }, security: { label: 'commitment · fail or finding' }, backend: { label: 'state (a predicate)' }, frontend: { label: 'step the browser performed' }, database: { label: 'fixture' }, messagebus: { label: 'commitment · quiet verdict' } } } },
    lanes, ...(mainPath.length >= 2 && { mainPath }), nodes, edges,
    cards: [
      { dot: loud.length ? 'rose' : 'emerald', title: loud.length ? `${loud.length} loud verdict${loud.length > 1 ? 's' : ''}` : 'No fail, no finding', items: loud.length ? loud.map(v => `${WORD[v.value]} ${v.commitment || 'state'} at ${v.workflow ? v.workflow + '/' : ''}${v.where || v.step}: ${short(v.what, 90)}`) : ['every measured state held and every commitment in scope passed'] },
      { dot: 'slate', title: 'Read it', items: ['left to right is time; a step stands under the state it starts from, its after-state one rank right', 'a state two workflows start from is drawn once per workflow, marked again', 'a commitment sits under the step it scopes, carrying its verdict; nothing here was typed'] },
    ],
  };
}

export function deliver(spec, out) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lab-flow-')); const src = path.join(tmp, 'spec.json');
  fs.writeFileSync(src, JSON.stringify(spec, null, 2));
  try {
    const r = execFileSync(process.execPath, [path.join(ARCHIFY, 'bin', 'archify.mjs'), 'deliver', 'workflow', src, out, '--quality', 'showcase', '--json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { ok: true, receipt: JSON.parse(r), spec: src };
  } catch (e) { return { ok: false, out: String(e.stdout || ''), err: String(e.stderr || e.message), spec: src }; }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [dir, out] = process.argv.slice(2).filter(a => !a.startsWith('--'));
  if (!dir || !out) { console.error('usage: lab-flow.mjs <run dir> <out.html>'); process.exit(1); }
  const run = JSON.parse(fs.readFileSync(path.join(dir, 'run.json'), 'utf8'));
  const { loadProject, findRoot } = await import('../src/journey.js');
  const root = findRoot(dir); const P = root ? loadProject(root) : null;
  const jid = run.journey?.ref?.replace(/^journeys\//, '').replace(/\.json$/, '');
  const spec = specOf(run, P ? P.commitments.map(c => c.value).filter(Boolean) : [], { journey: P?.journeys.find(j => j.value?.id === jid)?.value || {} });
  const specOut = (process.argv.find(a => a.startsWith('--spec=')) || '').slice(7); if (specOut) fs.writeFileSync(specOut, JSON.stringify(spec, null, 2) + '\n');
  const r = deliver(spec, path.resolve(out));
  console.log(r.ok ? `delivered ${out}` : `NOT delivered\n${r.out}\n${r.err}`); process.exit(r.ok ? 0 : 1);
}

// The run card: DEFINED × OBSERVED per step, then every verdict with its place and picture.
// A blocked run is a different card, because nothing in it was measured.
import { join, row, wrap, bullet, short, list } from './text.js';

const V = { pass: 'pass', fail: 'FAIL', finding: 'finding', 'not-applicable': 'n/a', 'not-committed': 'not-committed', unmeasurable: 'unmeasurable', suppressed: 'suppressed' };
const word = v => V[v] || String(v || '?');
const byId = commitments => Array.isArray(commitments) ? Object.fromEntries(commitments.filter(c => c?.id).map(c => [c.id, c])) : (commitments || {});

// A cap only ever lowers. `cause: method-unproven` on a finding is the older spelling of a method cap.
export const capOf = v => (v?.caps || []).find(c => c.from === 'fail') || (v?.value === 'finding' && v?.cause === 'method-unproven' ? { by: 'method', from: 'fail' } : null);
const capText = c => (c ? `would be ${c.from} — capped by ${c.by}` : '');

const idOf = v => v.commitment ? `${v.commitment}${Number.isInteger(v.measurement) ? `[${v.measurement}]` : ''}`
  : v.probe ? `${v.probe}${v.sc ? ` ${v.sc}` : ''}` : v.id || (v.workflow && v.step ? `${v.workflow}/${v.step}` : v.step || '?');

// Never absent: the reader acts on a place. Falls back to the commitment's scope, then the journey.
export const whereOf = (v, c) => v.where || (v.workflow && v.step ? `${v.workflow}/${v.step}` : v.step)
  || c?.scope?.step || c?.scope?.state || 'whole journey';

// One verdict, one block; the first line always carries `where`.
export function verdictBlock(v, commitments) {
  const c = byId(commitments)[v.commitment]; const cap = capOf(v); const loud = v.value === 'fail' || v.value === 'finding';
  const L = wrap(`${idOf(v).padEnd(24)} ${word(v.value).padEnd(14)}where ${whereOf(v, c)}${cap ? ` · ${capText(cap)}` : ''}`, { first: 4, indent: 44 }).map((l, i) => (i ? l : '    ' + l));
  if (v.what) L.push(...row('what', v.what, { col: 7, indent: 6 }));
  if (v.cause && v.cause !== 'probe-said' && !(cap && v.cause === 'method-unproven')) L.push(...row('cause', v.cause, { col: 7, indent: 6 }));
  if (v.shot) L.push(...row('shot', v.shot, { col: 7, indent: 6 }));
  if (loud && c?.statement) L.push(...row('says', c.statement, { col: 7, indent: 6 }));
  return L.join('\n');
}

// The sentence a coding agent acts on. The verdict and the cap decide it; the words are the skill's.
export function why(v, commitments) {
  const c = byId(commitments)[v.commitment]; const at = whereOf(v, c); const cap = capOf(v); const what = v.what ? ` (${v.what})` : '';
  switch (v.value) {
    case 'fail': return `fix the element the card cites at ${at}${what}, then run again; never edit ${v.commitment || 'the journey'} to make it pass`;
    case 'finding': return cap ? `report it as a finding in the probe's own words: ${cap.from} withheld because the ${cap.by} is not validated — fix the element at ${at} if it is yours; the cap is on the method, not on the defect`
      : `report it as a finding in the probe's own words and fix the element at ${at} if it is yours`;
    case 'not-applicable': return `nothing to do at ${at}: the condition did not occur${v.cause ? ` (${v.cause})` : ''}`;
    case 'not-committed': return `nobody signed this at ${at}: propose it, do not sign it yourself`;
    case 'unmeasurable': return `say what could not be measured at ${at}${v.cause ? ` (${v.cause})` : ''}; do not retry until it passes`;
    case 'suppressed': return `waived by the project${v.cause ? ` (${v.cause})` : ''}: report it as suppressed, not as a pass`;
    case 'pass': return `measured and held at ${at}; this says nothing about what was not measured`;
    default: return `unknown verdict ${v.value} at ${at}: report the packet verbatim`;
  }
}

// DEFINED on the left (step, action, state), OBSERVED from column 44 (held · strength · ms · shot).
const OBS = 44;
const held = s => (s ? `${s.held === false ? 'NOT HELD' : s.held ? 'held' : '?'}${s.strength ? ` · ${s.strength}` : ''}` : '—');
const stateRow = (label, s, observed) => row(label.padEnd(8) + String(s?.state || '—').padEnd(OBS - 14), observed, { col: OBS - 6, indent: 6 });
const missing = s => Object.entries(s?.signals || {}).filter(([, ok]) => ok === false).map(([k]) => k);

function stepLines(s, prefix, fixtures) {
  const id = prefix + s.id; const L = [];
  if (s.kind === 'fixture') {
    const f = fixtures[s.id] || {};
    return row(id, `fixture ${f.profile || s.profile || '?'} · produced ${list(Object.keys(s.produced || {}), ', ')}${s.ms ? ` · ${s.ms}ms` : ''}`, { col: 20, indent: 2 });
  }
  L.push(...row(id, s.action || '', { col: 20, indent: 2 }));
  if (s.intercepted) L.push(...row('', `intercept ${s.intercepted.request} → ${s.intercepted.returned}${s.intercepted.blocked ? ` · blocked ${s.intercepted.blocked}` : ''}`, { col: 8, indent: 6 }));
  if (s.before) L.push(...stateRow('before', s.before, held(s.before)));
  L.push(...stateRow('after', s.after, s.after ? `${held(s.after)}${s.timing?.toStable != null ? ` · ${s.timing.toStable}ms` : ''}${s.shots?.length ? ` · ${list(s.shots, ', ')}` : ''}` : 'not reached'));
  for (const k of missing(s.after)) L.push(...row('', `signal not seen: ${k}`, { col: 8, indent: 6 }));
  for (const i of (s.interactions || []).filter(i => i.inViewportWithoutScroll === false)) L.push(...row('', `${i.target} needs ${i.scrollsNeeded ?? '?'} scroll(s) at ${i.viewport || '?'}`, { col: 8, indent: 6 }));
  return L;
}

const steps = run => [...(run.steps || []).map(s => ({ s, prefix: '' })), ...(run.workflows || []).flatMap(w => (w.steps || []).map(s => ({ s, prefix: `${w.id}/` })))];
const reachText = r => `requested ${r.requested || '?'} · effective ${r.effective || '?'}${r.layers ? ` (project ${r.layers.project} · environment ${r.layers.environment} · workflow ${r.layers.workflow})` : ''}`;
const exitText = run => run.exit === 2 ? 'exit 2 — at least one fail; fix and run again before saying done'
  : run.exit === 1 ? 'exit 1 — the run could not be carried out'
  : run.exit === 0 ? 'exit 0 — no fail among what was measured; a floor, not a verdict on the interface'
  : `exit ${run.exit ?? '?'}`;

function blockedCard(run) {
  const b = run.blocked || {}; const r = run.reach || {};
  const L = [`uxcli run · ${run.id} · ${run.environment || '?'} · ${run.ranAt || ''}`, '',
    `  BLOCKED — ${b.reason || 'reason not recorded'}`, '  no probe ran; nothing here is a pass', '', '  which'];
  for (const w of b.which || []) L.push(...bullet(w));
  if (!(b.which || []).length) L.push(...bullet('not recorded'));
  if (r.requested || r.effective) L.push('', ...row('reach', reachText(r)));
  L.push('', `  exit ${run.exit ?? 1} — the run could not be carried out; no verdict was produced and none is implied`);
  return join(L);
}

export function journeyCard(run = {}, commitments = []) {
  if (run.status === 'blocked') return blockedCard(run);
  const L = [`uxcli run · ${run.id} · ${run.environment || '?'} · ${run.ranAt || ''}`];
  L.push(...row('journey', `${run.journey?.ref || '?'} · ${short(run.journey?.definitionHash)} · status ${run.status || '?'}${run.exit != null ? ` · exit ${run.exit}` : ''}`, { col: 9 }));
  const sc = run.scenario || {}; const idn = sc.identity; const fixtures = Object.fromEntries((sc.fixtures || []).map(f => [f.step, f]));
  if (idn || sc.fixtures?.length) L.push(...row('scenario', [idn && `identity ${idn.profile || idn.mode || '?'} (${idn.mode || '?'}${idn.tenant ? `, tenant ${idn.tenant}` : ''}, cleanup ${idn.retained ? 'retained' : idn.cleanupVerified ? 'verified' : 'unverified'})`,
    ...(sc.fixtures || []).map(f => `fixture ${f.profile} (${f.cleanup || 'cleanup ?'}${f.retainedBecause ? `: ${f.retainedBecause}` : ''})`)].filter(Boolean).join(' · '), { col: 9 }));

  L.push('', `  ${'DEFINED  (step · action · state)'.padEnd(OBS - 2)}OBSERVED  (held · strength · ms · shot)`);
  const all = steps(run);
  if (!all.length) L.push('  no step was recorded');
  for (const { s, prefix } of all) L.push(...stepLines(s, prefix, fixtures));

  const verdicts = run.verdicts || []; const probes = run.probes || [];
  L.push('', '  verdicts');
  if (!verdicts.length && !probes.length) L.push('    none — no commitment covers what ran');
  for (const v of verdicts) L.push(verdictBlock(v, commitments));
  for (const p of probes) L.push(verdictBlock({ ...p, probe: p.id }, commitments));

  if (run.lineage?.length) {
    L.push('', '  lineage');
    for (const l of run.lineage) L.push(...row(l.path, l.kept === false ? `kept:false — ${l.why || 'not consumed'}` : `→ ${list(l.consumedBy, ', ')}${l.matchesDisplayed ? ' · matches displayed' : ''}`, { col: 28, indent: 4 }));
  }

  const r = run.reach || {};
  L.push('', ...row('reach', reachText(r)));
  for (const c of r.constraints || []) L.push(...row(c.held ? 'held' : 'BROKEN', `${c.id} — ${c.observed || ''}`, { col: 8, indent: 16 }));
  if (run.effects) L.push(...row('effects', `declared ${list(run.effects.declared, ', ')} · observed ${list(run.effects.observed, ', ')} · undeclared ${list(run.effects.undeclared, ', ')}`));
  for (const b of run.breaches || []) L.push(...row('BREACH', typeof b === 'string' ? b : JSON.stringify(b)));
  const br = run.blastRadius || {};
  if (br.measured || br.unverified?.length) {
    L.push(...row('blast radius', br.measured ? Object.entries(br.measured).map(([k, v]) => `${k} ${Array.isArray(v) ? (v.length ? v.join(',') : 'none') : v}`).join(' · ') : 'not measured'));
    for (const u of br.unverified || []) L.push(...row('unverified', u, { col: 12, indent: 16 }));
  }
  const ev = run.evidence || {};
  if (ev.shots?.length || ev.redacted?.length) L.push(...row('evidence', `${ev.shots?.length || 0} shot(s)${ev.network ? ` · ${ev.network}` : ''}${ev.redacted?.length ? ` · redacted ${ev.redacted.join(', ')}` : ''}`));
  L.push('', `  ${exitText(run)}`);
  return join(L);
}

// Commitment × run → one of the seven verdicts. Caps only lower `fail` to `finding`; nothing raises.
import { exitFor, worst } from '../verdict/rank.js';
import { anchorState } from '../commitment/anchor.js';

export const journeyIdOf = run => run.journey?.id || String(run.journey?.ref || '').replace(/^.*\//, '').replace(/\.json$/, '');
const LOW = new Set(['weak', 'unverifiable']);
// The viewport a run was measured at: recorded on the packet, or on the step's interactions in a packet older than that field.
export const viewportOf = (run, stepId) => run.viewport || ((run.steps || []).find(s => s.id === stepId)?.interactions || []).map(i => i.viewport).find(Boolean) || null;

// Scope matches when the journey is this run's, the run's viewport is one the commitment claims, and
// the named step/state was reached in it.
export function scopeMatches(c, run) {
  const s = c.scope || {};
  if (s.journey && s.journey !== journeyIdOf(run)) return false;
  const vp = Array.isArray(s.viewports) && s.viewports.length ? viewportOf(run, s.step) : null;
  if (vp && !s.viewports.includes(vp)) return false;
  const steps = run.steps || [];
  if (s.workflow && steps.some(x => x.workflow) && !steps.some(x => x.workflow === s.workflow)) return false;
  if (s.step && !steps.some(x => x.id === s.step)) return false;
  if (s.state && !steps.some(x => x.after?.state === s.state || x.before?.state === s.state)) return false;
  return true;
}

const stepOf = (run, c, o) => (run.steps || []).find(s => s.id === (o?.where || c.scope?.step));
// Observability is low when a signal is weak, or when the after-state came back `held: null` —
// nothing false, something undecided.
const lowObservability = (run, c, o) => {
  const s = stepOf(run, c, o);
  return !!s && ([s.before?.strength, s.after?.strength].some(x => LOW.has(x)) || s.after?.held === null);
};

// `caps` from the caller: [{ by, commitment?, step?, why? }] — prerequisite-unverified, profile-unverified,
// probe-fp… Absent commitment/step means every verdict in the run.
const callerCaps = (caps, c, where) => caps.filter(k => (!k.commitment || k.commitment === c.id) && (!k.step || k.step === where))
  .map(k => ({ by: k.by, from: 'fail' }));

function one(c, m, index, outcome, run, caps, anchorHashes) {
  const where = outcome?.where || c.scope?.step;
  const base = { commitment: c.id, measurement: index, caps: [] };
  const pass = (v, cause, extra = {}) => ({ ...base, value: v, cause, ...extra, ...(where && { where }), ...(outcome?.what && { what: outcome.what }), ...(outcome?.shot && { shot: outcome.shot }) });
  if (c.anchor && anchorState({ entry: { derivedFrom: c.anchor }, actual: anchorHashes[c.anchor.run] ?? null }) === 'differs')
    return pass('not-committed', 'anchor-differs');
  if (!outcome) return pass('unmeasurable', 'no measurement supplied');
  if (outcome.outcome === 'condition-not-met') return pass('not-applicable', outcome.cause || 'condition-not-met');
  if (outcome.outcome === 'unmeasurable') return pass('unmeasurable', outcome.cause || 'unmeasurable');
  if (outcome.outcome === 'held') return pass('pass', 'held');
  const capped = [];
  if (m?.method === 'method-unproven') capped.push({ by: 'method', from: 'fail' });
  if (lowObservability(run, c, outcome)) capped.push({ by: 'observability', from: 'fail' });
  capped.push(...callerCaps(caps, c, where));
  if (!capped.length) return pass('fail', 'probe-said');
  return { ...pass('finding', capped[0].by === 'method' ? 'method-unproven' : capped[0].by), caps: capped };
}

// A step whose `after` did not hold is a fail of the journey itself, no commitment needed.
export const stepVerdicts = run => (run.steps || []).filter(s => s.after && s.after.held === false).map(s => {
  const low = LOW.has(s.after.strength);
  return {
    journey: journeyIdOf(run), ...(s.workflow && { workflow: s.workflow }), step: s.id,
    value: low ? 'finding' : 'fail', caps: low ? [{ by: 'observability', from: 'fail' }] : [], cause: 'state-not-held',
    ...(s.after.what && { what: s.after.what }), ...(s.shots?.length && { shot: s.shots[s.shots.length - 1] }),
  };
});

// outcomes: [{ commitmentId, index, outcome: held|not-held|condition-not-met|unmeasurable, where?, what?, shot?, cause? }]
export function verdicts(commitments, run, { caps = [], outcomes = [], anchorHashes = {} } = {}) {
  if (run.status === 'blocked') return { verdicts: [], exit: 1 };
  const out = [];
  for (const c of commitments) {
    if (!['ACTIVE', 'RETIREMENT_PROPOSED'].includes(c.status) || !scopeMatches(c, run)) continue;
    (c.measurements || []).forEach((m, i) => {
      const o = outcomes.find(x => x.commitmentId === c.id && (x.index ?? 0) === i);
      out.push(one(c, m, i, o, run, caps, anchorHashes));
    });
  }
  out.push(...stepVerdicts(run));
  return { verdicts: out, exit: exitFor({ verdicts: out.map(v => v.value), couldNotRun: run.status !== 'completed' }) };
}

export const latestOf = vs => vs.length ? worst(vs.map(v => v.value)) : null;

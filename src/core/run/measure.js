// A commitment's measurement, read against what the run observed. Pure: the caller hands in the
// steps with their observations attached (`obs.before`, `obs.after` — never written to the packet).
//
// in:  commitment, measurement, its index, steps [{ id, workflow, before:{state}, after:{state}, timing, shots, obs }], ctx for holds()
// out: { commitmentId, index, outcome: held | not-held | condition-not-met | unmeasurable, where, what?, shot?, cause? }
import { holds } from '../observe/holds.js';

const CAP = 10000;

// Where the measurement looks: a step id, or a state name — then the step in the commitment's scope,
// and the `before` side first, because that is the page as the person meets it, before the action.
function locate(target, scope, steps) {
  const byId = steps.find(s => s.id === target);
  if (byId) return { step: byId, side: 'after' };
  const at = steps.filter(s => s.before?.state === target || s.after?.state === target);
  if (!at.length) return null;
  const step = at.find(s => s.id === scope?.step) || at[0];
  return { step, side: step.before?.state === target ? 'before' : 'after' };
}

const shotOf = (step, side) => (step.shots || []).find(f => f.includes(`-${side}`)) || (step.shots || [])[0];

export function outcomeOf(c, m, index, steps, ctx = {}) {
  const base = { commitmentId: c.id, index };
  const hit = locate(m.target, c.scope, steps);
  if (!hit) return { ...base, outcome: 'unmeasurable', where: c.scope?.step, cause: `${m.target} was not reached in this run` };
  const { step, side } = hit;
  const obs = step.obs?.[side];
  const out = { ...base, where: step.id, shot: shotOf(step, side) };
  const p = m.predicate;
  if (!p || typeof p !== 'object') return { ...out, outcome: 'unmeasurable', cause: 'predicate is prose; write it as a signal object' };
  if (!obs) return { ...out, outcome: 'unmeasurable', cause: `no observation at ${step.id}.${side}` };

  let sig = p;
  if (p.observer === 'timing') {
    const v = step.timing?.[p.field];
    if (v == null) return { ...out, outcome: 'unmeasurable', cause: `${p.field} was not measured at ${step.id}` };
    if (v >= CAP) return { ...out, outcome: 'unmeasurable', cause: `${p.field} never stabilized (≥ ${CAP}ms)` };
    if (!(v > p.gt)) return { ...out, outcome: 'condition-not-met', cause: `${p.field} ${v}ms ≤ ${p.gt}ms — the condition did not occur` };
    sig = p.then;
  }
  const r = holds({ signals: [sig] }, obs, ctx);
  if (r.held === true) return { ...out, outcome: 'held' };
  if (r.held === null) return { ...out, outcome: 'unmeasurable', cause: r.why.join('; ') };
  const d = sig.selector ? obs.dom?.[sig.selector] : null;
  const scroll = d && sig.inViewportWithoutScroll && d.scrollsNeeded ? ` — needs ${d.scrollsNeeded} scroll${d.scrollsNeeded === 1 ? '' : 's'}${ctx.viewport ? ` at ${ctx.viewport}` : ''}` : '';
  return { ...out, outcome: 'not-held', what: `${r.why.join('; ')}${scroll} at ${m.target}` };
}

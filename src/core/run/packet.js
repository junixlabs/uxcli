// The Run object: what happened, assembled from observed step results. Every value here arrives
// already hashed (`sha1_8:…`); this module never sees a raw one. Verdicts are added by `seal()`.
import { exitFor } from '../verdict/rank.js';

const bare = h => String(h).replace(/^sha1_8:/, '');

// What the journey says each step produces — kept even when nothing consumes it (a declaration
// finding, not a lineage drop). Observed-but-undeclared-and-unconsumed values are not kept.
const declaredProduces = journey => {
  const out = {};
  for (const wf of journey?.workflows || []) for (const s of wf.steps || []) {
    out[s.id] = new Set([...(s.produces || []), ...(s.interactions || []).flatMap(i => i.produces || [])]);
  }
  return out;
};

const consumerId = (step, i) => `${step.id}.${i.type}` + (i.type === 'system' && i.href ? `.${String(i.href).split(':')[0]}` : '');

// `{leadId}` in a declared target/to/request/expr is filled from an earlier `lead.id`: a consumption
// the journey states by template rather than by `consumes`. Observed interactions are matched to the
// declaration by type, in order.
const camel = k => k.replace(/\.(\w)/g, (_, c) => c.toUpperCase());
const templated = i => [i.target, i.to, i.request, i.expr].flatMap(s => [...String(s || '').matchAll(/\{([^}]+)\}/g)].map(m => m[1]));
const declaredConsumes = (journey, stepId, obs, n) => {
  const step = (journey?.workflows || []).flatMap(w => w.steps || []).find(s => s.id === stepId);
  const decl = (step?.interactions || []).filter(i => i.type === obs.type)[n];
  return decl ? [...(decl.consumes || []), ...templated(decl).map(p => ({ param: p }))] : [];
};

export function lineageOf(journey, steps) {
  const declared = declaredProduces(journey);
  const producedKeys = new Set(steps.flatMap(s => [...Object.keys(s.produced || {}), ...(s.interactions || []).flatMap(i => Object.keys(i.produced || {}))]));
  const consumers = {};
  for (const s of steps) {
    const seen = {};
    for (const i of s.interactions || []) {
      const keys = new Set(i.consumed || []);
      for (const c of declaredConsumes(journey, s.id, i, seen[i.type] = (seen[i.type] ?? -1) + 1)) {
        if (typeof c === 'string') keys.add(c);
        else for (const k of producedKeys) if (camel(k) === c.param) keys.add(k);
      }
      for (const k of keys) (consumers[k] ||= []).push(consumerId(s, i));
    }
  }
  const out = [];
  for (const s of steps) {
    const produced = { ...(s.produced || {}) };
    for (const i of s.interactions || []) Object.assign(produced, i.produced || {});
    for (const [k, h] of Object.entries(produced)) {
      const by = consumers[k] || [];
      if (by.length) out.push({ path: `${s.id}.${k}`, sha1_8: bare(h), consumedBy: by });
      else if (!declared[s.id]?.has(k)) out.push({ path: `${s.id}.${k}`, kept: false, why: 'không step nào consume' });
    }
  }
  return out;
}

// Drop observed values that lineage did not keep, so the packet holds only what it accounts for.
const keep = (steps, lineage) => {
  const dropped = new Set(lineage.filter(l => l.kept === false).map(l => l.path));
  const prune = (id, obj) => obj && Object.fromEntries(Object.entries(obj).filter(([k]) => !dropped.has(`${id}.${k}`)));
  return steps.map(s => ({
    ...s,
    ...(s.produced && { produced: prune(s.id, s.produced) }),
    ...(s.interactions && { interactions: s.interactions.map(i => i.produced ? { ...i, produced: prune(s.id, i.produced) } : i) }),
  }));
};

const effectName = e => typeof e === 'string' ? e : e.effect;

// Observed effects from the observer's network entries: the effect *class*, and never a request the
// browser blocked — an intercepted request had no effect.
export const effectsFrom = observations => observations.flatMap(({ step, observation }) =>
  (observation?.network || []).filter(n => n.effectClass && !n.blocked)
    .map(n => ({ effect: n.effectClass, where: step, request: `${n.method} ${n.path}` })));

export function packet({ id, journey, definitionHash, env, viewport, scenario, reach, effects, stepResults = [], constraints, ruleSnapshots, probes, ranAt, blocked, evidence }) {
  const declared = effects?.declared || [];
  const observed = (effects?.observed || []).map(effectName);
  const undeclared = [...new Set(observed.filter(e => !declared.includes(e)))];
  const breaches = undeclared.map(e => {
    const seen = (effects.observed || []).find(o => effectName(o) === e);
    return { effect: e, rule: 'undeclared-effect', ...(seen?.where && { where: seen.where }), ...(seen?.request && { request: seen.request }) };
  });
  // A constraint measured false is a breach; null (could not be observed) is recorded, not breached.
  for (const c of constraints || []) if (c.held === false) breaches.push({ constraint: c.id, rule: 'constraint-not-held', ...(c.observed && { observed: c.observed }) });
  const status = blocked ? 'blocked' : breaches.length ? 'aborted' : 'completed';
  const steps = blocked ? [] : stepResults;
  const lineage = lineageOf(journey, steps);
  const run = {
    id: id || `j-${journey.id}${env ? '@' + env : ''}`,
    ranAt,
    environment: env,
    ...(viewport && { viewport }),
    journey: { ref: `journeys/${journey.id}.json`, definitionHash },
    scenario: scenario || { identity: null, fixtures: [] },
    reach: { requested: reach.layers?.workflow || reach.effective, effective: reach.effective, layers: reach.layers,
      ...(reach.capped?.length && { capped: reach.capped }), ...(constraints && { constraints }) },
    effects: { declared, observed: [...new Set(observed)], undeclared },
    breaches,
    status,
    exit: status === 'completed' ? 0 : 1,
    ...(blocked && { blocked: { ...blocked, note: 'không probe nào chạy; không có verdict; không tính vào FP rate hay level' } }),
    steps: keep(steps, lineage),
    lineage,
    ...(ruleSnapshots && { ruleSnapshots }),
    ...(probes && { probes }),
    verdicts: [],
    ...(evidence && { evidence }),
  };
  return run;
}

// A blocked run keeps `verdicts: []` whatever is offered: nothing ran, so nothing was measured.
export const seal = (run, verdicts) => {
  const vs = run.status === 'blocked' ? [] : verdicts;
  return { ...run, verdicts: vs, exit: exitFor({ verdicts: vs.map(v => v.value), couldNotRun: run.status !== 'completed' }) };
};

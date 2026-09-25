// Policy: what a run may do, in three layers the runtime takes the minimum of. A constraint is a
// predicate an observer can check — one nobody can observe is not a rule, it is a hope, and it caps
// reach rather than granting it.
//
// in:  the parsed policy file    out: { ok, value, problems } — value adds `vocabulary`, every effect name declared
import { isStr, isObj, strList, done, signerProblem, REACH } from './common.js';

export { REACH };
export const IDENTITY_MODES = ['provided', 'provision', 'self'];
const CONSTRAINT_OBSERVERS = ['egress', 'network'];

// A `$…` value is a reference into the policy itself; a bare string is a literal.
const resolves = (ref, policy, env) => {
  if (!isStr(ref)) return false;
  if (!ref.startsWith('$')) return true;
  if (ref === '$syntheticTenants') return strList(policy.environments?.[env]?.syntheticTenants);
  const m = ref.match(/^\$environments\.([^.]+)\.(\w+)$/);
  return !!m && policy.environments?.[m[1]]?.[m[2]] !== undefined;
};

export function constraintProblems(c, at, policy, env = null) {
  if (!isObj(c)) return [`${at}: a constraint is an object { id, observer, … }`];
  const bad = [];
  if (!isStr(c.id)) bad.push(`${at}.id: required`);
  if (typeof c.predicate === 'string') bad.push(`${at}.predicate: a sentence is the old grammar — write what the observer checks as fields`);
  if (!CONSTRAINT_OBSERVERS.includes(c.observer)) { bad.push(`${at}.observer: required, one of ${CONSTRAINT_OBSERVERS.join(', ')} — a constraint nobody can observe is unverifiable, and an unverifiable constraint caps reach`); return bad; }
  if (c.observer === 'egress') {
    const forms = [isObj(c.deny), isStr(c.denyOrigin)].filter(Boolean).length;
    if (forms !== 1) bad.push(`${at}: an egress constraint says exactly one of deny { hostClass } or denyOrigin`);
    if (isObj(c.deny) && !(isStr(c.deny.hostClass) && strList(policy.hostClasses?.[c.deny.hostClass])))
      bad.push(`${at}.deny.hostClass: \`${c.deny.hostClass}\` is not declared under hostClasses`);
    if (c.denyOrigin !== undefined && !resolves(c.denyOrigin, policy, env)) bad.push(`${at}.denyOrigin: \`${c.denyOrigin}\` resolves to nothing in this policy`);
  } else {
    const vocab = vocabularyOf(policy);
    if (!vocab.includes(c.onEffect)) bad.push(`${at}.onEffect: \`${c.onEffect}\` is not a declared effect`);
    if (!isObj(c.requireHeader) || !isStr(c.requireHeader.name)) bad.push(`${at}.requireHeader: { name, in }`);
    else if (!(strList(c.requireHeader.in) || resolves(c.requireHeader.in, policy, env)))
      bad.push(`${at}.requireHeader.in: a list of values, or a reference such as $syntheticTenants that this environment declares`);
  }
  return bad;
}

export const vocabularyOf = p => [...(strList(p?.effects?.core) ? p.effects.core : []), ...Object.keys(isObj(p?.effects?.project) ? p.effects.project : {})];

export function parsePolicy(doc) {
  if (!isObj(doc)) return done(null, ['a policy is a JSON object']);
  const bad = [];
  const reach = (v, at) => { if (!REACH.includes(v)) bad.push(`${at}.reachMax: one of ${REACH.join(', ')}`); };
  const constraints = (list, at, env) => {
    if (list === undefined) return;
    if (!Array.isArray(list)) { bad.push(`${at}.constraints: a list`); return; }
    list.forEach((c, i) => bad.push(...constraintProblems(c, `${at}.constraints[${i}]`, doc, env)));
  };

  if (!isObj(doc.effects) || !strList(doc.effects.core) || !doc.effects.core.length) bad.push('effects.core: the core effect vocabulary, a non-empty list');
  const core = strList(doc.effects?.core) ? doc.effects.core : [];
  if (doc.effects?.project !== undefined) {
    if (!isObj(doc.effects.project)) bad.push('effects.project: { name: { class, signature } }');
    else for (const [n, e] of Object.entries(doc.effects.project)) {
      if (!isObj(e) || !core.includes(e.class)) bad.push(`effects.project.${n}.class: one of the core effects`);
      if (!isStr(e?.signature)) bad.push(`effects.project.${n}.signature: how it is observed, such as "POST /api/calls"`);
    }
  }
  const vocab = vocabularyOf(doc);
  if (doc.hostClasses !== undefined && !(isObj(doc.hostClasses) && Object.values(doc.hostClasses).every(strList))) bad.push('hostClasses: { name: [host patterns] }');

  if (!isObj(doc.project)) bad.push('project: required — { reachMax, constraints[] }');
  else { reach(doc.project.reachMax, 'project'); constraints(doc.project.constraints, 'project', null); }

  if (!isObj(doc.environments) || !Object.keys(doc.environments).length) bad.push('environments: at least one, keyed by name');
  else for (const [n, e] of Object.entries(doc.environments)) {
    const at = `environments.${n}`;
    if (!isObj(e)) { bad.push(`${at}: { origin, reachMax, constraints[] }`); continue; }
    if (!isStr(e.origin)) bad.push(`${at}.origin: the origin runs go to`);
    reach(e.reachMax, at); constraints(e.constraints, at, n);
    for (const k of ['syntheticTenants', 'sinkDomains']) if (e[k] !== undefined && !strList(e[k])) bad.push(`${at}.${k}: a list of patterns`);
  }

  if (doc.workflows !== undefined && !isObj(doc.workflows)) bad.push('workflows: { "journey/workflow": { reachMax, effects[], sinks? } }');
  for (const [k, w] of Object.entries(isObj(doc.workflows) ? doc.workflows : {})) {
    const at = `workflows[${k}]`;
    if (!/^[^/\s]+\/[^/\s]+$/.test(k)) bad.push(`${at}: keyed "journey/workflow" or "journey/*"`);
    if (!isObj(w)) { bad.push(`${at}: { reachMax, effects[], sinks? }`); continue; }
    reach(w.reachMax, at);
    if (!strList(w.effects)) bad.push(`${at}.effects: a list, empty if the workflow declares none — an undeclared effect that is observed aborts the run`);
    else for (const e of w.effects) if (!vocab.includes(e)) bad.push(`${at}.effects: \`${e}\` is not a declared effect`);
    if (w.sinks !== undefined) {
      if (!isObj(w.sinks)) bad.push(`${at}.sinks: { effect: sink }`);
      else for (const e of Object.keys(w.sinks)) if (!(w.effects || []).includes(e)) bad.push(`${at}.sinks.${e}: a sink for an effect this workflow does not declare`);
    }
  }

  if (!isObj(doc.testIdentity) || !IDENTITY_MODES.includes(doc.testIdentity.mode)) bad.push(`testIdentity.mode: one of ${IDENTITY_MODES.join(', ')}`);
  else if (doc.testIdentity.mode === 'provision' && !isStr(doc.testIdentity.profile)) bad.push('testIdentity.profile: the identity profile to provision');
  if (!isObj(doc.authority)) bad.push('authority: required — who owns each layer: { project, environments, workflows }');
  else for (const k of ['project', 'environments', 'workflows']) { const p = signerProblem(doc.authority[k], `authority.${k}`); if (p) bad.push(p); }
  return done({ ...doc, vocabulary: vocab }, bad);
}

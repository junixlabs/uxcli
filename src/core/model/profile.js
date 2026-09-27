// A Profile: the scenario space a project allows, named by business meaning. A value a domain rule
// already fixes is derived from the rule, never typed in — a typed number goes stale the day the
// rule changes and nothing says so.
//
// in:  the parsed file    out: { ok, value, problems }
import { isStr, isObj, strList, done, signerProblem, versionProblem } from './common.js';

export const KINDS = ['data', 'identity'];
export const MODES = { data: ['profiled', 'parametric'], identity: ['provided', 'provision'] };  // freeform and self are off in this slice
const PARAM_TYPES = ['number', 'string', 'boolean'];
const isRule = v => isStr(v) && v.includes('.');
const num = v => typeof v === 'number' && Number.isFinite(v);

// derive: { field: { rule, add?, mul? } } — a rule.ref and at most an arithmetic step on it
export function deriveProblems(d, at) {
  if (!isObj(d)) return [`${at}: a rule reference { rule: "domain.field", add?, mul? }`];
  const bad = [];
  if (!isRule(d.rule)) bad.push(`${at}.rule: a rule reference such as leads.responseSlaMinutes`);
  for (const k of ['add', 'mul']) if (d[k] !== undefined && !num(d[k])) bad.push(`${at}.${k}: a number`);
  for (const k of Object.keys(d)) if (!['rule', 'add', 'mul'].includes(k)) bad.push(`${at}.${k}: not part of derive — only rule, add, mul`);
  return bad;
}

export function parseProfile(doc) {
  if (!isObj(doc)) return done(null, ['a profile is a JSON object']);
  const bad = [];
  { const v = versionProblem(doc, 1); if (v) bad.push(v); }
  if (!isStr(doc.id)) bad.push('id: required');
  if (!KINDS.includes(doc.kind)) bad.push(`kind: one of ${KINDS.join(', ')}`);
  else if (!MODES[doc.kind].includes(doc.mode)) bad.push(`mode: a ${doc.kind} profile is one of ${MODES[doc.kind].join(', ')}`);
  if (doc.kind === 'data' && !isStr(doc.type)) bad.push('type: what a data profile materializes, such as lead');
  const p = signerProblem(doc.owner, 'owner'); if (p) bad.push(p);

  const derive = isObj(doc.derive) ? doc.derive : {};
  if (doc.derive !== undefined && !isObj(doc.derive)) bad.push('derive: an object keyed by field');
  for (const [f, d] of Object.entries(derive)) {
    if (typeof d === 'string') bad.push(`derive.${f}: "${d}" is the old string grammar — write { rule, add } or { rule, mul }`);
    else bad.push(...deriveProblems(d, `derive.${f}`));
  }
  if (doc.constraints !== undefined && !isObj(doc.constraints)) bad.push('constraints: an object keyed by field');
  for (const [f, v] of Object.entries(isObj(doc.constraints) ? doc.constraints : {}))
    if (num(v) && f in derive) bad.push(`constraints.${f}: ${v} is typed in where derive.${f} already computes it from ${derive[f]?.rule ?? 'a rule'} — keep the derive, drop the number`);

  if (doc.allowedParams !== undefined && !isObj(doc.allowedParams)) bad.push('allowedParams: an object keyed by param');
  for (const [f, a] of Object.entries(isObj(doc.allowedParams) ? doc.allowedParams : {})) {
    const at = `allowedParams.${f}`;
    if (!isObj(a)) { bad.push(`${at}: { type, min?, max?, boundaries? }`); continue; }
    if (!PARAM_TYPES.includes(a.type)) bad.push(`${at}.type: one of ${PARAM_TYPES.join(', ')}`);
    for (const k of ['min', 'max']) if (a[k] !== undefined && !num(a[k])) bad.push(`${at}.${k}: a number`);
    if (a.boundaries !== undefined) {
      if (!isObj(a.boundaries)) bad.push(`${at}.boundaries: { name: rule.ref } — a boundary is a named business limit`);
      else for (const [b, r] of Object.entries(a.boundaries)) if (!isRule(r)) bad.push(`${at}.boundaries.${b}: a rule reference such as leads.responseSlaMinutes`);
    }
  }
  if (doc.mode === 'parametric' && !Object.keys(isObj(doc.allowedParams) ? doc.allowedParams : {}).length) bad.push('allowedParams: a parametric profile says which params may vary');

  const needsProvisioner = !(doc.kind === 'identity' && doc.mode === 'provided');
  if (!isObj(doc.provisioner)) { if (needsProvisioner) bad.push('provisioner: required — { command, cleanup, outputs?, effects? }'); }
  else {
    for (const k of ['command', 'cleanup']) if (!isStr(doc.provisioner[k])) bad.push(`provisioner.${k}: a command to run`);
    const outputs = doc.provisioner.outputs;
    if (outputs !== undefined && !(isObj(outputs) && Object.values(outputs).every(isStr))) bad.push('provisioner.outputs: { name: "$.json.path" }');
    if (doc.kind === 'identity' && !isStr(outputs?.expiresAt)) bad.push('provisioner.outputs.expiresAt: required — an identity without an expiry is one a run can leave behind');
    if (doc.provisioner.effects !== undefined && !strList(doc.provisioner.effects)) bad.push('provisioner.effects: a list of effect names');
  }
  return done({ ...doc, derive }, bad);
}

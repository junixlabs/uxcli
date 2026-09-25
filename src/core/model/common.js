// Shared shape checks for the authored objects. Every parser in this directory returns
// { ok, value, problems[] }, and a problem is a sentence naming the path in the file.
export const isStr = v => typeof v === 'string' && v.trim() !== '';
export const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
export const strList = v => Array.isArray(v) && v.every(isStr);
export const isDate = v => isStr(v) && Number.isFinite(Date.parse(v));
export const done = (value, problems) => ({ ok: problems.length === 0, value, problems });

export const REACH = ['observe', 'interact', 'mutate', 'inject'];

// Who stands behind a thing. An agent may sign, but never alone: a signature (owner, approvedBy,
// decidedBy) says on whose say-so. A proposal is not a signature, so `signs: false` asks no such thing.
export const SIGNER_TYPES = ['person', 'role', 'agent'];
export function signerProblem(v, at, { signs = true } = {}) {
  if (Array.isArray(v)) return `${at}: one signer, not a list — a thing with two authorities is two things; split it`;
  if (!isObj(v)) return `${at}: required — { type: person | role | agent, ref }`;
  if (!SIGNER_TYPES.includes(v.type)) return `${at}.type: \`${v.type}\` is not one of ${SIGNER_TYPES.join(', ')}`;
  if (!isStr(v.ref)) return `${at}.ref: required — who, by name or role`;
  if (signs && v.type === 'agent' && !isStr(v.onBehalfOf)) return `${at}.onBehalfOf: an agent signs on somebody's say-so; name them`;
  return null;
}

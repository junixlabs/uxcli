// Did a policy constraint hold over the requests one Observation saw?
//
//   { id, observer: 'egress',  deny: { hostClass } }
//   { id, observer: 'egress',  denyOrigin: '$environments.production.origin' }
//   { id, observer: 'network', onEffect, requireHeader: { name, in: '$syntheticTenants' } }
//
// `$a.b.c` resolves against `env` — the environment the run is in, spread with the policy's
// `environments` and `hostClasses` beside it. A `$ref` that resolves to nothing makes the constraint
// unverifiable (`held: null`), which is the caller's cue to cap reach, not to pass.
// Reads per request: host, hostClass, effectClass, requestHeaders, blocked, production (the observer's own
// verdict that the request went to the production origin — honoured beside the resolved `$…origin`).
import { glob } from './glob.js';

const resolve = (ref, env) => typeof ref !== 'string' || !ref.startsWith('$') ? ref
  : ref.slice(1).split('.').reduce((o, k) => o?.[k], env);

const hostOf = origin => { try { return new URL(origin).host; } catch { return null; } };
const inClass = (r, hostClass, env) => r.hostClass === hostClass || (env.hostClasses?.[hostClass] ?? []).some(p => glob(p, r.host));

export function constraintHeld(constraint, observation, env = {}) {
  const { id } = constraint;
  const reqs = observation?.network ?? [];
  if (constraint.deny?.hostClass) {
    const sent = reqs.filter(r => inClass(r, constraint.deny.hostClass, env) && !r.blocked);
    return { id, held: sent.length === 0, observed: `${sent.length} egress to ${constraint.deny.hostClass}` };
  }
  if (constraint.denyOrigin) {
    const host = hostOf(resolve(constraint.denyOrigin, env));
    const flagged = reqs.some(r => r.production !== undefined);
    if (!host && !flagged) return { id, held: null, observed: `${constraint.denyOrigin} resolves to no origin` };
    const sent = reqs.filter(r => (r.production === true || (host && r.host === host)) && !r.blocked);
    return { id, held: sent.length === 0, observed: `${sent.length} egress to ${host ?? 'the production origin'}` };
  }
  if (constraint.requireHeader) {
    const { name, in: ref } = constraint.requireHeader;
    const allowed = resolve(ref, env);
    if (!Array.isArray(allowed)) return { id, held: null, observed: `${ref} resolves to no list` };
    const scoped = reqs.filter(r => r.effectClass === constraint.onEffect);
    const ok = scoped.filter(r => allowed.some(p => glob(p, r.requestHeaders?.[name])));
    return { id, held: ok.length === scoped.length, observed: `${ok.length}/${scoped.length} ${constraint.onEffect} requests carry ${name} ∈ ${ref}` };
  }
  return { id, held: null, observed: 'constraint has no known form' };
}

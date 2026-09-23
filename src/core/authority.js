// Who may sign what. Replaces the rule `only a human signs`, which was removed: a signature was
// never about species, it is about a decision being traceable to something answerable. An agent free
// to sign anything can write itself a commitment it is certain to pass.
//
// in:  { authorities, subject, action, kind?, journey?, artifact?, at? }
// out: { ok: true, under, owner } | { ok: false, why }
//
// Scope is not keyed on `kind` alone: permission to set a contrast threshold says nothing about
// permission to declare what a checkout owes its user.

export const ACTIONS = ['propose', 'sign', 'supersede'];

// An unmentioned field is unrestricted, so `scope: {}` is total authority — which is why no default
// registry is ever conjured.
const covers = (allowed, value) => {
  if (allowed === undefined || allowed === null) return true;
  const list = Array.isArray(allowed) ? allowed : [allowed];
  if (list.includes('*')) return true;
  if (value === undefined || value === null) return false;
  return list.includes(value);
};

const expired = (entry, now) => {
  if (!entry.expires) return false;
  const t = Date.parse(entry.expires);
  return Number.isFinite(t) && t < now;
};

// Every refusal names the rung it failed on: "not authorized" alone gets worked around, not fixed.
export function may({ authorities = [], subject, action, kind, journey, artifact, at } = {}) {
  const now = at ? Date.parse(at) : Date.now();
  if (!subject) return { ok: false, why: 'the entry names no subject, so nothing can be held to it' };
  if (!ACTIONS.includes(action)) return { ok: false, why: `unknown action \`${action}\`` };

  const mine = authorities.filter(a => a.subject === subject);
  if (!mine.length) return { ok: false, why: `\`${subject}\` is not in the authority registry` };

  const live = mine.filter(a => !expired(a, now));
  if (!live.length) return { ok: false, why: `every authority for \`${subject}\` has expired` };

  for (const a of live) {
    const s = a.scope || {};
    if (!covers(s.action, action)) continue;
    if (!covers(s.kind, kind)) continue;
    if (!covers(s.journey, journey)) continue;
    if (!covers(s.artifact, artifact)) continue;
    return { ok: true, under: a, owner: a.owner || null };
  }
  return { ok: false, why: `\`${subject}\` may not ${action} ${kind ? `a \`${kind}\` commitment` : 'this'}${journey ? ` in journey \`${journey}\`` : ''}` };
}

// What a subject may actually do, per action — the question a reader of the card is asking, which
// `may()` cannot answer alone because `may()` takes one kind at a time. Asking it with the literal
// `'*'` asks "may you do this to EVERY kind", and a `no` to that was being read as "may not at all",
// which hides a grant that was made.
//
// in:  { authorities, subject, at? }
// out: { subject, actions: [ { action, ok, grants: [{ kind, owner, expires }], why? } ] }
//
// A grant of `'*'` is returned alone, because a blanket grant makes the kinds beside it noise. The
// candidate kinds come from the subject's own entries, so nothing is invented: every grant returned
// is one `may()` said yes to.
export function capabilityOf({ authorities = [], subject, at } = {}) {
  const kinds = [...new Set(
    authorities.filter(a => a.subject === subject).flatMap(a => [].concat(a.scope?.kind ?? '*')),
  )];
  const actions = ACTIONS.map(action => {
    const grants = [];
    for (const kind of kinds) {
      const r = may({ authorities, subject, action, kind, at });
      if (r.ok) grants.push({ kind, owner: r.owner, expires: r.under?.expires ?? null });
    }
    const blanket = grants.find(g => g.kind === '*');
    if (blanket) return { action, ok: true, grants: [blanket] };
    if (grants.length) return { action, ok: true, grants };
    // No kind of this subject's own survived, so the refusal is asked for without one — that is the
    // rung that actually decided it (unregistered, expired, or this action simply not in scope).
    return { action, ok: false, grants: [], why: may({ authorities, subject, action, at }).why };
  });
  return { subject, actions };
}

// Both names are shown: an agent's signature is worth exactly what the person behind it is worth.
export const signatureOf = entry => {
  if (!entry) return null;
  const by = entry.signedBy || entry.owner || null;
  if (!by) return null;
  return entry.signedBy && entry.owner && entry.signedBy !== entry.owner
    ? `${entry.signedBy} under ${entry.owner}`
    : by;
};

// Whether a commitment is eligible to produce a verdict at all — a distinction the seven verdicts
// cannot draw for themselves. "Checkout should feel trustworthy" is not `unmeasurable`, which blames
// the instrument for having no method; it never reaches measurement, the way an unclosed paren never
// reaches the runtime. Refused here, and the refusal is not a verdict.
//
// out: { admitted: true, owner, source, signature }
//    | { admitted: false, verdict, reason }   verdict null = never reached the ladder
//
//   no owner or source            → not-committed
//   signed outside authority      → not-committed
//   past its own expiry           → not-committed
//   superseded                    → null; history does not re-litigate
//   nothing could falsify it      → null; it is a wish
//   claims a flow, names no run   → null; nothing observed for it to be about
import { may, signatureOf } from '../authority.js';
import { KINDS } from './kinds.js';

// A registered kind carries its own failure surface; an unregistered one must state what would make
// it false, or there is nothing to measure and nothing to dispute.
const falsifiable = e => !!KINDS[e.kind] || !!(e.failureSurface && (e.failureSurface.when || e.failureSurface.mustObserve));

// Registration is the exemption, and not as a courtesy: a registered kind declares the evidence it is
// decided by and a shipped method decides it, so nothing it asserts survives an evidence file that
// disagrees — `contrast` is two token names against a stylesheet, and the 42 entries in this repo
// rightly name no run.
//
// The exemption keys on what decides a commitment, not on whether its kind is registered. Keyed on
// registration it would exempt `flow-reachability`, and every flow kind after it, since a flow kind
// is registered by definition — leaving the rule to reach only unregistered kinds, which already
// come back `unmeasurable`. A rule that touches nothing measurable is a rule that has stopped
// working. So: anything a run decides must name the run it came from, and only a commitment decided
// by something else is excused.
//
// Structural presence only; whether that directory exists is not core's to ask, and `run` is read
// alone because a target id and a timestamp qualify an observation that `run` has to name.
const decidedElsewhere = e => { const k = KINDS[e.kind]; return !!k?.against && k.against !== 'run'; };
const traceable = e =>
  decidedElsewhere(e) || (typeof e.derivedFrom?.run === 'string' && e.derivedFrom.run.trim() !== '');

const lapsed = (e, now) => { const t = e.expires ? Date.parse(e.expires) : NaN; return Number.isFinite(t) && t < now; };

export function admit(entry, { doc = {}, authorities = [], at } = {}) {
  const now = at ? Date.parse(at) : Date.now();
  const owner = entry.owner || doc.owner || null;
  const source = entry.source || doc.source || null;
  const signedBy = entry.signedBy || doc.signedBy || null;

  // A superseded entry is not wrong, it is no longer the rule; a verdict would put a replaced
  // decision back into today's exit code.
  if (entry.supersededBy)
    return { admitted: false, verdict: null, reason: `superseded by ${entry.supersededBy}`, signature: signatureOf({ ...entry, owner }) };

  if (!falsifiable(entry))
    return { admitted: false, verdict: null,
      reason: `nothing here could make it false — a kind nobody has registered needs \`failureSurface\`, or it is a wish, not a commitment` };

  // Ranked below falsifiability and above accountability: a sentence that could not be false is
  // broken more deeply than one pointing nowhere, while an owner and a source can be perfectly in
  // order here — nothing is missing from who stands behind it, so `not-committed` would name the
  // wrong defect. What is missing is the thing it is about, which makes it a wish like any other.
  if (!traceable(entry))
    return { admitted: false, verdict: null,
      reason: `nothing observed stands behind it — a commitment about a flow needs \`derivedFrom.run\` naming the run it came from, or it describes a product nobody has watched` };

  if (!owner || !source)
    return { admitted: false, verdict: 'not-committed', reason: 'a commitment needs an owner and a source' };

  if (lapsed(entry, now))
    return { admitted: false, verdict: 'not-committed', reason: `expired on ${entry.expires}; re-sign it or supersede it` };

  // No `signedBy` is the pre-registry shape and keeps working: `owner` alone still names who is
  // accountable.
  if (signedBy) {
    const verdict = may({ authorities, subject: signedBy, action: 'sign', kind: entry.kind, journey: entry.journey, artifact: entry.artifact, at });
    if (!verdict.ok)
      return { admitted: false, verdict: 'not-committed', reason: `signature has no standing: ${verdict.why}` };
  }

  if (entry.suppressed)
    return { admitted: false, verdict: 'suppressed',
      reason: typeof entry.suppressed === 'string' ? entry.suppressed
        : `${entry.suppressed.why || 'accepted'}${entry.suppressed.by ? ` — accepted by ${entry.suppressed.by}` : ''}${entry.suppressed.until ? `, until ${entry.suppressed.until}` : ''}` };

  return { admitted: true, owner, source, signature: signatureOf({ ...entry, owner }) };
}

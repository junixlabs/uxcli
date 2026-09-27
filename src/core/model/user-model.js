// Understanding, in two authored objects. An Actor is who the product is for and what they need; an
// Insight is one claim about the domain, the product or an actor, with the evidence behind it and
// the observation that would show it wrong. Confidence is derived from what an insight can show,
// never claimed — the ceiling is what the evidence and its falsifier allow (object model §1).
//
// in:  the parsed file    out: { ok, value, problems }
import { isStr, isObj, strList, isDate, done, versionProblem } from './common.js';

export const CONFIDENCE = ['hypothesis', 'low', 'medium', 'high'];
export const ACTOR_LISTS = ['roles', 'contexts', 'jobs', 'behaviors', 'habits', 'expectations', 'pains', 'constraints'];
const CHANGE_KINDS = ['prose', 'predicate'];
const ABOUT = /^(domain|product|actor:[A-Za-z0-9_.-]+)$/;

// no evidence → hypothesis · evidence, no falsifier → low · falsifier never checked → medium ·
// checked and did not fire → high · fired → back to hypothesis, and whatever traces to it follows
export function confidenceCeiling(i) {
  if (!Array.isArray(i?.evidence) || !i.evidence.length) return 'hypothesis';
  if (!isObj(i.wouldChangeIf)) return 'low';
  if (!isObj(i.lastCheck)) return 'medium';
  return i.lastCheck.fired ? 'hypothesis' : 'high';
}

export function parseActor(doc) {
  if (!isObj(doc)) return done(null, ['an actor is a JSON object']);
  const bad = [];
  const v = versionProblem(doc, 1); if (v) bad.push(v);
  if (!isStr(doc.actor)) bad.push('actor: required — the name journeys refer to');
  for (const k of ACTOR_LISTS) if (!strList(doc[k])) bad.push(`${k}: a list of sentences (may be empty)`);
  if (!strList(doc.unknowns) || !doc.unknowns.length) bad.push('unknowns: the most important field — what is not known about this actor; it may not be empty');
  if (doc.insights !== undefined) bad.push('insights: live in understanding/insights/<id>.json, one file each, with `about: actor:<name>` — not inside the actor');
  return done(doc, bad);
}

export function parseInsight(doc) {
  if (!isObj(doc)) return done(null, ['an insight is a JSON object { id, claim, about, source, evidence[], confidence, wouldChangeIf }']);
  const bad = [];
  const v = versionProblem(doc, 1); if (v) bad.push(v);
  for (const k of ['id', 'claim']) if (!isStr(doc[k])) bad.push(`${k}: required`);
  if (!isStr(doc.about) || !ABOUT.test(doc.about)) bad.push('about: required — `domain`, `product`, or `actor:<name>`: what this claim is about');
  if (doc.source !== null && !isObj(doc.source)) bad.push('source: { type, ref }, or null when there is none');
  if (!strList(doc.evidence)) bad.push('evidence: a list (empty means hypothesis)');
  if (doc.wouldChangeIf !== null && doc.wouldChangeIf !== undefined) {
    if (!isObj(doc.wouldChangeIf) || !CHANGE_KINDS.includes(doc.wouldChangeIf.kind) || !isStr(doc.wouldChangeIf.text))
      bad.push('wouldChangeIf: { kind: prose | predicate, text }, or null');
    else if (doc.wouldChangeIf.kind === 'prose' && !isDate(doc.reviewAfter))
      bad.push('reviewAfter: a prose falsifier is checked by a person, so say by when');
  }
  if (doc.lastCheck !== undefined && doc.lastCheck !== null && !(isObj(doc.lastCheck) && isDate(doc.lastCheck.at) && typeof doc.lastCheck.fired === 'boolean'))
    bad.push('lastCheck: { at, fired, observed? }');
  const ceiling = confidenceCeiling(doc);
  if (!CONFIDENCE.includes(doc.confidence)) bad.push(`confidence: one of ${CONFIDENCE.join(', ')}`);
  else if (CONFIDENCE.indexOf(doc.confidence) > CONFIDENCE.indexOf(ceiling))
    bad.push(`confidence: ${doc.confidence} claims more than the evidence allows — the ceiling is ${ceiling}${isObj(doc.lastCheck) ? '' : isObj(doc.wouldChangeIf) ? ' (wouldChangeIf has never been checked)' : doc.evidence?.length ? ' (no wouldChangeIf)' : ' (no evidence)'}`);
  return done({ ...doc, ceiling }, bad);
}

// A UserModel: why the UX should work a certain way. Confidence is derived from what an insight can
// show, never claimed — the ceiling is what the evidence and its falsifier allow (object model §1).
//
// in:  the parsed file    out: { ok, value, problems } — each insight in value carries `ceiling`
import { isStr, isObj, strList, isDate, done } from './common.js';

export const CONFIDENCE = ['hypothesis', 'low', 'medium', 'high'];
const LISTS = ['roles', 'contexts', 'jobs', 'behaviors', 'habits', 'expectations', 'pains', 'constraints'];
const CHANGE_KINDS = ['prose', 'predicate'];

// no evidence → hypothesis · evidence, no falsifier → low · falsifier never checked → medium ·
// checked and did not fire → high · fired → back to hypothesis, and whatever traces to it follows
export function confidenceCeiling(i) {
  if (!Array.isArray(i?.evidence) || !i.evidence.length) return 'hypothesis';
  if (!isObj(i.wouldChangeIf)) return 'low';
  if (!isObj(i.lastCheck)) return 'medium';
  return i.lastCheck.fired ? 'hypothesis' : 'high';
}

export function parseUserModel(doc) {
  if (!isObj(doc)) return done(null, ['a user model is a JSON object']);
  const bad = [];
  if (!isStr(doc.actor)) bad.push('actor: required — the name journeys refer to');
  for (const k of LISTS) if (!strList(doc[k])) bad.push(`${k}: a list of sentences (may be empty)`);
  if (!strList(doc.unknowns) || !doc.unknowns.length) bad.push('unknowns: the most important field — what is not known about this actor; it may not be empty');

  const insights = [];
  if (!Array.isArray(doc.insights)) bad.push('insights: a list');
  else for (const [n, i] of doc.insights.entries()) {
    const at = `insights[${n}]`;
    if (!isObj(i)) { bad.push(`${at}: an object { id, claim, source, evidence[], confidence, wouldChangeIf }`); continue; }
    for (const k of ['id', 'claim']) if (!isStr(i[k])) bad.push(`${at}.${k}: required`);
    if (i.source !== null && !isObj(i.source)) bad.push(`${at}.source: { type, ref }, or null when there is none`);
    if (!strList(i.evidence)) bad.push(`${at}.evidence: a list (empty means hypothesis)`);
    if (i.wouldChangeIf !== null && i.wouldChangeIf !== undefined) {
      if (!isObj(i.wouldChangeIf) || !CHANGE_KINDS.includes(i.wouldChangeIf.kind) || !isStr(i.wouldChangeIf.text))
        bad.push(`${at}.wouldChangeIf: { kind: prose | predicate, text }, or null`);
      else if (i.wouldChangeIf.kind === 'prose' && !isDate(i.reviewAfter))
        bad.push(`${at}.reviewAfter: a prose falsifier is checked by a person, so say by when`);
    }
    if (i.lastCheck !== undefined && i.lastCheck !== null && !(isObj(i.lastCheck) && isDate(i.lastCheck.at) && typeof i.lastCheck.fired === 'boolean'))
      bad.push(`${at}.lastCheck: { at, fired, observed? }`);
    const ceiling = confidenceCeiling(i);
    if (!CONFIDENCE.includes(i.confidence)) bad.push(`${at}.confidence: one of ${CONFIDENCE.join(', ')}`);
    else if (CONFIDENCE.indexOf(i.confidence) > CONFIDENCE.indexOf(ceiling))
      bad.push(`${at}.confidence: ${i.confidence} claims more than the evidence allows — the ceiling is ${ceiling}${isObj(i.lastCheck) ? '' : isObj(i.wouldChangeIf) ? ' (wouldChangeIf has never been checked)' : i.evidence?.length ? ' (no wouldChangeIf)' : ' (no evidence)'}`);
    insights.push({ ...i, ceiling });
  }
  return done({ ...doc, insights }, bad);
}

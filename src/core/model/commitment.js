// A Commitment: one promise, one signature, one file. The signature sits here and never on a
// measurement — a commitment whose parts answer to different people is two commitments.
//
// in:  the parsed file; `docs` as context.js takes it, { [doc]: { found, text } }, so the quote can
//      be checked against the document it cites; `previous` = the status on disk before this edit
// out: { ok, value, problems } — value carries `sourceStanding` from context.js and `anchor` as anchor.js reads it
import { isStr, isObj, strList, isDate, done, signerProblem, versionProblem } from './common.js';
import { standingOf } from '../context.js';
import { anchorOf } from '../commitment/anchor.js';

export const STATUSES = ['PROPOSED', 'ACTIVE', 'RETIREMENT_PROPOSED', 'RETIRED'];
export const METHODS = ['method-validated', 'method-unproven'];

const EDGES = { PROPOSED: ['ACTIVE', 'RETIRED'], ACTIVE: ['RETIREMENT_PROPOSED', 'RETIRED'], RETIREMENT_PROPOSED: ['ACTIVE', 'RETIRED'], RETIRED: [] };

// Retiring is the act that needs the most authority — and weakening is retiring. Every edge that
// ends a promise, or declines to, names who decided; nothing here checks that they were allowed
// to, which is authority.js's question.
export function transitionProblems(from, to, doc = {}) {
  if (from === to) return [];
  if (!EDGES[from]?.includes(to)) return [`status: ${from} → ${to} is not a transition a commitment makes`];
  const bad = [];
  const r = isObj(doc.retirement) ? doc.retirement : {};
  if (to === 'ACTIVE' && from === 'PROPOSED' && signerProblem(doc.approvedBy, 'approvedBy')) bad.push('approvedBy: a proposal becomes a commitment only with someone who approved it');
  if (to === 'RETIREMENT_PROPOSED' && signerProblem(r.proposedBy, 'x', { signs: false })) bad.push('retirement.proposedBy: who proposes retiring it');
  if (to === 'RETIRED' || (to === 'ACTIVE' && from === 'RETIREMENT_PROPOSED')) {
    if (signerProblem(r.decidedBy, 'x')) bad.push(`retirement.decidedBy: ${from} → ${to} ends or keeps a promise somebody approved; the machine may not, so name who decided`);
  }
  if (to === 'RETIRED' && !isDate(doc.retiredAt)) bad.push('retiredAt: a date, once retired');
  return bad;
}

export function parseCommitment(doc, { docs, previous } = {}) {
  if (!isObj(doc)) return done(null, ['a commitment is a JSON object']);
  const bad = [];
  { const v = versionProblem(doc, 1); if (v) bad.push(v); }
  for (const k of ['id', 'statement']) if (!isStr(doc[k])) bad.push(`${k}: required, a non-empty string`);
  if (!isObj(doc.scope) || !Object.keys(doc.scope).length) bad.push('scope: required — where this holds (journey, workflow, step, state, viewports…)');
  if (doc.owners !== undefined) bad.push('owners: a commitment has one owner — two authorities means two commitments; split it');
  for (const k of ['owner', 'approvedBy']) { const p = signerProblem(doc[k], k); if (p && !(k === 'approvedBy' && doc.status === 'PROPOSED')) bad.push(p); }
  if (doc.proposedBy !== undefined) { const p = signerProblem(doc.proposedBy, 'proposedBy', { signs: false }); if (p) bad.push(p); }

  const standing = standingOf(doc, docs || {});
  if (standing.standing === 'unsourced') bad.push('source: required — { doc, quote }: the document the promise comes from and the words in it');
  if (standing.standing === 'unquoted') bad.push('source.quote: required — a document named without its words is a name, not a citation');
  if (standing.standing === 'drifted') bad.push(`source.quote: ${standing.doc} no longer says "${standing.quote}" — re-read it and quote what is there, or say what changed`);
  if (standing.standing === 'unresolved' && docs && standing.doc in docs) bad.push(`source.doc: ${standing.doc} could not be read`);

  if (!STATUSES.includes(doc.status)) bad.push(`status: one of ${STATUSES.join(', ')}`);
  if (['RETIREMENT_PROPOSED', 'RETIRED'].includes(doc.status)) {
    if (!isObj(doc.retirement)) bad.push('retirement: required once retirement is proposed — { proposal?, proposedBy, at, reason, requires, decidedBy }');
    else {
      for (const k of ['proposedBy', 'requires']) { const p = signerProblem(doc.retirement[k], `retirement.${k}`, { signs: k !== 'proposedBy' }); if (p) bad.push(p); }
      if (!isStr(doc.retirement.reason)) bad.push('retirement.reason: why, in words');
    }
  }
  if (previous !== undefined) bad.push(...transitionProblems(previous, doc.status, doc));
  else if (doc.status === 'RETIRED') bad.push(...transitionProblems('ACTIVE', 'RETIRED', doc));

  if (!Array.isArray(doc.measurements) || !doc.measurements.length) bad.push('measurements: at least one — a promise nothing measures is a wish');
  else doc.measurements.forEach((m, i) => {
    const at = `measurements[${i}]`;
    if (!isObj(m)) { bad.push(`${at}: an object { target, predicate, observer, method }`); return; }
    if (!isStr(m.target)) bad.push(`${at}.target: a state or step name`);
    if (!(isStr(m.predicate) || isObj(m.predicate))) bad.push(`${at}.predicate: what is measured`);
    if (!isStr(m.observer)) bad.push(`${at}.observer: which observer decides it`);
    if (!METHODS.includes(m.method)) bad.push(`${at}.method: one of ${METHODS.join(', ')} — unproven may only reach finding`);
  });

  let anchor = null;
  if (doc.anchor !== null && doc.anchor !== undefined) {
    anchor = anchorOf({ derivedFrom: doc.anchor });
    if (!anchor) bad.push('anchor: null, or { run, hash } — the run directory it was read from');
    else if (!anchor.hash) bad.push('anchor.hash: required — a run directory is a pointer, and a pointer is not evidence');
  }
  if (!strList(doc.trace)) bad.push('trace: a list of references to insights or proposals');
  if (!isDate(doc.createdAt)) bad.push('createdAt: a date');
  if (doc.reviewAfter !== undefined && doc.reviewAfter !== null && !isDate(doc.reviewAfter)) bad.push('reviewAfter: a date, or omitted');
  return done({ ...doc, anchor, sourceStanding: standing.standing }, bad);
}

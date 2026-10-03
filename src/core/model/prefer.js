// Blind pairwise preference: the human eye on two sets of pictures of the same screen, neither side
// named. The study holds the pairs (two pictures of one screen, one from each group) under opaque
// names; each judge sees them in their own order with sides swapped by their own seed, and says which
// one they would rather use, or that they cannot tell, and why. The tally says how often each group won
// and whether that is more than chance (a two-sided sign test, ties set aside).
// A judgment is a person's: the study exists to put an eye other than the agent's on the work, so an
// agent cannot be a judge, on anybody's say-so. Pure: parsers and arithmetic, nothing read.
import { isStr, isObj } from './common.js';

export const CHOICES = ['left', 'right', 'same'];

export function parseStudy(doc) {
  const problems = [];
  if (!isObj(doc)) return { value: null, problems: ['not an object'] };
  if (doc.schema_version !== 1) problems.push('schema_version must be 1');
  if (!isStr(doc.name) || !/^[a-z0-9][a-z0-9-]*$/.test(doc.name)) problems.push('name: lower-case words joined by -');
  if (!isStr(doc.question)) problems.push('question: what the judge is asked, the same for every pair');
  if (!isObj(doc.groups) || Object.keys(doc.groups).length !== 2 || !Object.values(doc.groups).every(isStr)) problems.push('groups: { A: "what A is", B: "what B is" } — never shown to a judge');
  if (!Array.isArray(doc.pairs) || !doc.pairs.length) problems.push('pairs: at least one');
  else doc.pairs.forEach((p, i) => {
    if (!isStr(p?.id)) problems.push(`pairs[${i}].id: required`);
    if (!isStr(p?.A) || !isStr(p?.B)) problems.push(`pairs[${i}]: { id, A: picture, B: picture } — pictures under img/, opaque names`);
    else if ([p.A, p.B].some(f => !/^img\/[0-9a-f]{12,}\.(png|jpe?g|webp)$/.test(f))) problems.push(`pairs[${i}]: a picture's name says nothing of its group — img/<hash>.png`);
  });
  if (Array.isArray(doc.pairs) && new Set(doc.pairs.map(p => p?.id)).size !== doc.pairs.length) problems.push('pairs: ids repeat');
  return { value: problems.length ? null : doc, problems };
}

// A judge's seed decides the order of pairs and which group sits left; the same judge always sees the
// same page, two judges rarely the same one.
const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = seed => () => { seed = (Math.imul(seed ^ (seed >>> 15), 2246822507) + 0x6d2b79f5) >>> 0; seed ^= seed >>> 13; return (seed >>> 0) / 4294967296; };
export function blindOrder(study, judge) {
  const r = rng(hash(`${study.name}:${judge}`));
  const pairs = study.pairs.map(p => ({ id: p.id, swap: r() < 0.5 }));
  for (let i = pairs.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pairs[i], pairs[j]] = [pairs[j], pairs[i]]; }
  return pairs.map(({ id, swap }) => { const p = study.pairs.find(x => x.id === id); return { id, left: swap ? p.B : p.A, right: swap ? p.A : p.B, leftIs: swap ? 'B' : 'A' }; });
}

export function parseJudgment(doc, study) {
  const problems = [];
  if (!isObj(doc)) return { value: null, problems: ['not an object'] };
  if (doc.study !== study?.name) problems.push(`study: "${study?.name}"`);
  if (!isObj(doc.by) || !isStr(doc.by.ref) || doc.by.type !== 'person') problems.push('by: { type: "person", ref } — a pairwise preference is a person\'s eye; an agent is not a judge here, on anybody\'s say-so');
  if (!isStr(doc.at)) problems.push('at: when');
  const ids = new Set((study?.pairs || []).map(p => p.id));
  if (!isObj(doc.answers)) problems.push('answers: { pairId: { choice, leftIs, why } }');
  else for (const [id, a] of Object.entries(doc.answers)) {
    if (!ids.has(id)) { problems.push(`answers["${id}"]: not a pair of this study`); continue; }
    if (!isObj(a) || !CHOICES.includes(a.choice)) problems.push(`answers["${id}"].choice: left, right or same`);
    if (!['A', 'B'].includes(a?.leftIs)) problems.push(`answers["${id}"].leftIs: which group the page put on the left`);
    if (!isStr(a?.why) || !a.why.trim()) problems.push(`answers["${id}"].why: what made the difference, in the judge's words`);
  }
  return { value: problems.length ? null : doc, problems };
}

// The winner of one answer, as a group, or null for "same".
export const winner = a => a.choice === 'same' ? null : a.choice === 'left' ? a.leftIs : (a.leftIs === 'A' ? 'B' : 'A');

// Two-sided exact sign test: the chance of a split at least this uneven if neither group were preferred.
export function signTest(a, b) {
  const n = a + b; if (!n) return 1;
  const k = Math.min(a, b); let p = 0; let c = 1;
  for (let i = 0; i <= n; i++) { if (i <= k) p += c; c = c * (n - i) / (i + 1); }
  return Math.min(1, 2 * p / 2 ** n);
}

export function tally(study, judgments) {
  const ok = judgments.filter(j => j.value);
  const rows = study.pairs.map(p => {
    const as = ok.map(j => j.value.answers[p.id]).filter(Boolean);
    const w = as.map(winner);
    return { id: p.id, A: w.filter(x => x === 'A').length, B: w.filter(x => x === 'B').length, same: w.filter(x => x === null).length, why: ok.filter(j => j.value.answers[p.id]).map(j => ({ judge: j.value.by.ref, winner: winner(j.value.answers[p.id]), why: j.value.answers[p.id].why })) };
  });
  const A = rows.reduce((n, r) => n + r.A, 0), B = rows.reduce((n, r) => n + r.B, 0), same = rows.reduce((n, r) => n + r.same, 0);
  return { study: study.name, question: study.question, groups: study.groups, judges: ok.map(j => j.value.by.ref), answered: A + B + same, A, B, same, p: signTest(A, B), pairs: rows };
}

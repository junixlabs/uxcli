// Whether a row of the machine-wide run index still belongs to the view the index draws today.
//
// The index is append-only and every row names the project it was grouped under. On this machine 78
// rows name the repository and one names `src/probes/text-overlap`, which is not a project: it has
// no marker of any kind. It was written before `projectRoot()` walked up to the nearest one. The
// rule changed; the row did not. Group by `project` today and the screen asserts a project that
// never existed.
//
// The answer is git's. An old commit still exists; the current branch need not point at it. The
// event is never deleted, the interpretation of it may change — so the packet stays on disk
// untouched, the row is handed back whole, and the only thing that moves is its membership in the
// current view. Nothing here deletes and nothing here returns an instruction to delete.
//
// in:  { row, rootsInForce, absentRoots } — the caller resolves the disk facts and hands them in.
//        rootsInForce — project paths that DO resolve as a project root under today's rule
//        absentRoots  — project paths the caller looked for and did not find
//      A path in neither list is taken to exist without being a root. That is the ordinary case and
//      the one this module was written for.
// out: { member, state, reason }, derived on every call and never written back. A stored
//      classification is one more fact that ages out of date with the rule that made it — which is
//      the defect, not the fix.

// Three states, and the third earns its place by refusing a false sentence. A directory that has
// been deleted was not written under a dead rule, so telling a person "created before the
// project-root rule required a marker" about it asserts exactly the kind of thing this module
// exists to stop. `state` names the kind of change that unseated the row; `reason` is the sentence
// for the screen, and two rows can share a state without sharing a reason.
const RULE_CHANGED =
  'grouped under a path with no project marker (.git, package.json or a commitments file) — written '
  + 'before the project-root rule walked up to the nearest one';
const GONE =
  'the directory it was grouped under is no longer on disk — the rule did not change, the project did';
const UNNAMED =
  'the row names no project — written before a run recorded which project it belonged to';

const norm = p => { const s = String(p ?? '').trim(); return s.length > 1 ? s.replace(/\/+$/, '') : s; };
const paths = s => (s instanceof Set ? [...s] : Array.isArray(s) ? s : []).map(norm);

export function classify({ row, rootsInForce = [], absentRoots = [] } = {}) {
  const project = norm(row?.project);
  if (!project) return { member: false, state: 'legacy-unresolved', reason: UNNAMED };
  if (paths(rootsInForce).includes(project)) return { member: true, state: 'current', reason: '' };
  if (paths(absentRoots).includes(project)) return { member: false, state: 'gone', reason: GONE };
  return { member: false, state: 'legacy-unresolved', reason: RULE_CHANGED };
}

// The set question is not the row question. Membership belongs to the project, not to the run: 78 of
// these rows share one path, and judging each row alone invites two rows of one project onto
// opposite sides of the same decision. So the project is classified once and its rows follow it.
// That is also what lets the screen print one header — "Legacy / unresolved (1)" — instead of
// repeating a sentence 78 times.
//
// out: { current, quarantined, groups }. `current` is the rows themselves, in input order, because
// nothing about them needs explaining. `quarantined` pairs each row with the sentence that unseated
// it, and the row is the same object that came in: unrewritten, nothing dropped. `groups` is the
// per-project tally a header needs. Every input row lands in exactly one of the first two.
export function partitionIndex({ rows = [], rootsInForce = [], absentRoots = [] } = {}) {
  const decided = new Map();
  const groups = new Map();
  const current = [], quarantined = [];
  for (const row of rows) {
    const key = norm(row?.project);
    if (!decided.has(key)) decided.set(key, classify({ row, rootsInForce, absentRoots }));
    const v = decided.get(key);
    if (v.member) { current.push(row); continue; }
    quarantined.push({ row, state: v.state, reason: v.reason });
    const g = groups.get(key);
    if (g) g.count++;
    else groups.set(key, { project: row?.project ?? null, state: v.state, reason: v.reason, count: 1 });
  }
  return { current, quarantined, groups: [...groups.values()] };
}

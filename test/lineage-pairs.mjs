// Which rows of the run index the current view may claim, held by the same kind of pair as every
// probe.
//
// The rule has two halves that pull against each other, which is why both have to be shown. A rule
// that quarantines nothing passes the second half and fails the first: the index still groups a
// directory inside a project as a project, and the screen still asserts it. A rule that quarantines
// by age passes the first and fails the second — 78 of the 80 rows on this machine are old and
// every one of them is grouped under a path that is a project root right now. Age is not the test.
// The rule that made the row is.
import { classify, partitionIndex } from '../src/core/lineage.js';

export const OPERATOR =
  'a row grouped under a directory that is not a project root, which must be quarantined and must '
  + 'say why; a row grouped under a real root, which must not be, however old it is; a row whose '
  + 'directory has since been deleted, which must not be told the rule changed under it; and the '
  + 'whole index, which must come out of the partition with every row it went in with';

const ROOT = '/Users/x/proj';
const NOT_A_ROOT = '/Users/x/proj/src/probes/text-overlap';
const DELETED = '/private/tmp/scratchpad/acme-checkout';

const row = (project, ranAt, targetId) => ({
  kind: 'page', name: 'Release steps',
  where: `file://${project}/must-fail/index.html`,
  project, dir: `${project}/.uxcli/text-overlap-must-fail-${targetId}`,
  ranAt, targetId, worst: 'finding', counts: { pass: 1, finding: 1 }, exit: 0,
});

export function pair() {
  const problems = []; let checks = 0;
  const check = (what, got, want) => { checks++; if (got !== want) problems.push(`${what}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`); };

  const facts = { rootsInForce: [ROOT], absentRoots: [DELETED] };
  const stray = row(NOT_A_ROOT, '2026-09-22T18:18:32.956Z', 'mhouus');
  const real = row(ROOT, '2026-09-22T18:20:00.000Z', 'aa11bb');
  const old = row(ROOT, '2024-01-04T09:00:00.000Z', 'cc22dd');
  const vanished = row(DELETED, '2026-09-21T10:00:00.000Z', 'ee33ff');

  // must-fail: the defect on this machine. `src/probes/text-overlap` has no marker of any kind, and
  // a view that groups by `project` prints it as the third project on the list.
  const s = classify({ row: stray, ...facts });
  check('a row under a path that is not a root is not a member', s.member, false);
  check('and says which rule unseated it', s.state, 'legacy-unresolved');
  checks++; if (!/project marker|project-root rule/.test(s.reason))
    problems.push(`the reason does not name the rule that changed: ${JSON.stringify(s.reason)}`);
  checks++; if (!s.reason || s.reason.length < 20)
    problems.push('a quarantined row was given no sentence a person could read');

  // must-pass: a row whose project is a root today is current, and a rule that quarantined on age
  // would take this one with it.
  check('a row under a real root is a member', classify({ row: real, ...facts }).member, true);
  check('and is current', classify({ row: real, ...facts }).state, 'current');
  check('an old row under a still-valid rule stays current', classify({ row: old, ...facts }).state, 'current');
  check('and is told nothing that needs explaining', classify({ row: old, ...facts }).reason, '');

  // must-fail: a deleted directory was never written under a dead rule. Handing it the sentence
  // about the marker would be the same false assertion this module exists to stop.
  const g = classify({ row: vanished, ...facts });
  check('a vanished project is not a member', g.member, false);
  check('and is not blamed on the rule change', g.state, 'gone');
  checks++; if (/project-root rule/.test(g.reason))
    problems.push(`a deleted directory was told the rule changed under it: ${JSON.stringify(g.reason)}`);

  // The verdict classifies; it never instructs. A key beyond these three is a channel for an order
  // to delete, and the whole point is that the event survives the reinterpretation.
  check('the verdict carries nothing but a classification',
    Object.keys(s).sort().join(','), 'member,reason,state');

  // The shape this machine actually holds: 78 rows under the root, one stray, one vanished.
  const index = [];
  for (let i = 0; i < 78; i++) index.push(row(ROOT, `2026-09-2${i % 9}T10:00:00.000Z`, `r${i}`));
  index.splice(40, 0, stray);
  index.push(vanished);
  const out = partitionIndex({ rows: index, ...facts });

  check('the partition loses no rows', out.current.length + out.quarantined.length, index.length);
  check('the current view drops the stray', out.current.length, 78);
  check('and the quarantine holds it', out.quarantined.length, 2);
  checks++; if (out.current.some(r => index.indexOf(r) < 0) || out.quarantined.some(q => index.indexOf(q.row) < 0))
    problems.push('the partition returned a row that was never in the index');
  checks++; if (out.current.some(r => out.quarantined.some(q => q.row === r)))
    problems.push('a row landed on both sides of the partition');

  // A header says "Legacy / unresolved (1)" per project, which is a fact about the set and not
  // about any row in it.
  check('the stray is its own group', out.groups.length, 2);
  check('and the header counts it', out.groups.find(x => x.project === NOT_A_ROOT)?.count, 1);
  check('the vanished project is grouped apart', out.groups.find(x => x.project === DELETED)?.state, 'gone');

  // must-pass: quarantined is not lost. The row comes back as the same object, byte for byte the
  // one that went in — nothing dropped, nothing rewritten, no classification stapled on.
  const before = JSON.stringify(stray);
  const held = out.quarantined.find(q => q.row.targetId === 'mhouus');
  checks++; if (held?.row !== stray) problems.push('the quarantined row is a copy, not the row');
  check('the quarantined row is unchanged', JSON.stringify(held?.row), before);
  check('and still carries its evidence directory', held?.row.dir, stray.dir);
  check('and its verdict', held?.row.worst, 'finding');
  checks++; if ('state' in stray || 'member' in stray || 'lineage' in stray)
    problems.push('the classification was stored on the row it judged');

  // Rows of one project must not split. Two callers resolving the same path twice is the only way
  // that could happen, and the set-level pass is what forbids it.
  const many = [row(NOT_A_ROOT, '2026-09-01T00:00:00.000Z', 'x1'), row(NOT_A_ROOT, '2026-09-02T00:00:00.000Z', 'x2'), row(NOT_A_ROOT, '2026-09-03T00:00:00.000Z', 'x3')];
  const split = partitionIndex({ rows: many, ...facts });
  check('three rows of one unresolved project stay together', split.quarantined.length, 3);
  check('and none of them leaked into the view', split.current.length, 0);

  // An empty index is an empty view, not a crash and not an invented row.
  const none = partitionIndex({ rows: [], ...facts });
  check('an empty index partitions to nothing', none.current.length + none.quarantined.length, 0);

  // A trailing slash is not a different project; two spellings of one path must not become two
  // groups on the screen.
  check('a trailing slash is the same project',
    classify({ row: row(ROOT + '/', '2026-09-22T00:00:00.000Z', 'sl'), ...facts }).state, 'current');

  return { ok: !problems.length, checks, problems };
}

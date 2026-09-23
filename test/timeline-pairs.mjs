// Runs collapsed into targets, held by the same kind of pair as every probe.
//
// The claim has two halves and they pull against each other. A rule that keeps every row apart
// passes nothing and fails the first half: it is the table we already have, seven rows saying what
// ran and none saying what changed. A rule that groups loosely — on `name`, on `dir`, on the address
// as typed — passes the first half and fails the second, merging two screens into one history and
// reporting a drift that never happened. So both halves are shown: rows that must collapse, and
// rows that must not.
import { timelines } from '../src/core/timeline.js';
import { targetId } from '../src/core/target.js';

export const OPERATOR =
  'five runs of one target whose name and directory both shifted under it, which a table keyed on '
  + 'either splits into five rows; the same rows handed over newest-first, which a reader of array '
  + 'position gets backwards; two permutations of one index, which must answer identically; and a '
  + 'target measured once, which is not stability';

const run = o => ({ kind: 'page', project: '/p', exit: 0, ...o });
const RUNS = 'http://127.0.0.1:4717/#/runs';
const HOME = 'http://127.0.0.1:4717/#/home';

// One target, five runs. The name drifts because `label.js` shortens against whatever else is on
// screen; the directory drifts because these rows straddle the hostname-key era; the id is absent
// on the three older rows because the field did not exist yet. Only the address holds still.
const FIVE = [
  run({ ranAt: '2026-09-20T10:00:00.000Z', where: RUNS, name: 'uxcli runs', dir: '/p/.uxcli/127.0.0.1', worst: 'pass' }),
  run({ ranAt: '2026-09-21T10:00:00.000Z', where: RUNS, name: 'runs', dir: '/p/.uxcli/127.0.0.1', worst: 'pass' }),
  run({ ranAt: '2026-09-22T10:00:00.000Z', where: RUNS, name: '127.0.0.1:4717/#/runs', dir: '/p/.uxcli/runs-x', worst: 'pass' }),
  run({ ranAt: '2026-09-23T10:00:00.000Z', where: RUNS, name: 'runs', dir: '/p/.uxcli/runs-x', targetId: targetId({ url: RUNS }), worst: 'pass' }),
  run({ ranAt: '2026-09-23T18:00:00.000Z', where: RUNS, name: 'runs', dir: '/p/.uxcli/runs-x', targetId: targetId({ url: RUNS }), worst: 'fail' }),
];

// Everything else the index holds: a neighbour on the same host that must stay its own history, a
// recovery, a target seen once, a journey with no address at all, two rows written in the same
// millisecond, and a row that can be identified by nothing.
const REST = [
  run({ ranAt: '2026-09-20T09:00:00.000Z', where: HOME, name: 'home', dir: '/p/.uxcli/127.0.0.1', worst: 'fail' }),
  run({ ranAt: '2026-09-22T09:00:00.000Z', where: HOME, name: 'home', dir: '/p/.uxcli/home-y', worst: 'pass' }),
  run({ ranAt: '2026-09-19T08:00:00.000Z', where: 'file:///p/src/probes/contrast/must-pass/index.html', name: 'index.html', dir: '/p/.uxcli/contrast-z', worst: 'pass' }),
  run({ kind: 'journey', ranAt: '2026-09-18T08:00:00.000Z', where: null, name: 'checkout fixture', dir: '/p/.uxcli/checkout-a', worst: 'pass' }),
  run({ kind: 'journey', ranAt: '2026-09-19T08:00:00.000Z', where: null, name: 'checkout fixture', dir: '/p/.uxcli/checkout-a', worst: 'unmeasurable' }),
  run({ ranAt: '2026-09-21T12:00:00.000Z', where: 'http://127.0.0.1:4717/pages', name: 'pages', dir: '/p/.uxcli/pages-b', worst: 'pass', counts: { pass: 3 } }),
  run({ ranAt: '2026-09-21T12:00:00.000Z', where: 'http://127.0.0.1:4717/pages', name: 'pages', dir: '/p/.uxcli/pages-c', worst: 'pass' }),
  run({ ranAt: '2026-09-17T08:00:00.000Z', where: null, name: null, dir: '/p/.uxcli/orphan', worst: 'pass' }),
];

const ALL = [...FIVE, ...REST];
const find = (t, id) => t.find(e => e.targetId === id);

export function pair() {
  const problems = []; let checks = 0;
  const check = (what, got, want) => { checks++; if (got !== want) problems.push(`${what}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`); };

  // The fixture has to still exercise what it was written for, or the halves below pass by accident.
  checks++; if (new Set(FIVE.map(r => r.name)).size < 2) problems.push('the fixture no longer shifts the name it was written to survive');
  checks++; if (new Set(FIVE.map(r => r.dir)).size < 2) problems.push('the fixture no longer shifts the directory it was written to survive');
  checks++; if (FIVE.filter(r => r.targetId).length === FIVE.length) problems.push('the fixture no longer holds a row from before `targetId` existed');

  // must-fail: handed over newest-first, so a rule that reads array position calls the oldest run
  // the current one and reports a failing screen as passing.
  const newestFirst = [...FIVE].reverse();
  const one = timelines(newestFirst);
  check('five runs of one target are one entry', one.length, 1);
  check('and it carries all five', one[0]?.runs, 5);
  check('with the history to match', one[0]?.history.length, 5);
  check('the latest is decided by ranAt, not by array position', one[0]?.latest?.ranAt, '2026-09-23T18:00:00.000Z');
  check('and the history runs oldest first', one[0]?.history[0]?.ranAt, '2026-09-20T10:00:00.000Z');
  check('latest is the end of the history', one[0]?.latest, one[0]?.history.at(-1));
  check('the id is the one target.js gives the address', one[0]?.targetId, targetId({ url: RUNS }));

  // must-fail: a single run reported as steady is a claim about a history nobody has seen.
  const once = timelines([REST[2]]);
  check('one run is a first measurement', once[0]?.drift, 'first');
  checks++; if (once[0]?.drift === 'held') problems.push('a first measurement was reported as unchanged');

  // must-fail: two permutations of one index have to answer identically, or "latest" is a fact
  // about the file's write order rather than about time.
  const reversed = [...ALL].reverse();
  const interleaved = [...ALL.filter((_, i) => i % 2), ...ALL.filter((_, i) => !(i % 2))];
  const a = JSON.stringify(timelines(ALL)), b = JSON.stringify(timelines(reversed)), c = JSON.stringify(timelines(interleaved));
  checks++; if (a !== b) problems.push('a reversed index gives a different answer');
  checks++; if (a !== c) problems.push('an interleaved index gives a different answer');

  // must-pass: the three ways a verdict can move, and each one named.
  const all = timelines(ALL);
  check('pass → fail is a regression', find(all, targetId({ url: RUNS }))?.drift, 'regressed');
  check('fail → pass is a recovery', find(all, targetId({ url: HOME }))?.drift, 'improved');
  check('pass → pass has not moved', find(all, targetId({ url: 'http://127.0.0.1:4717/pages' }))?.drift, 'held');
  check('and pass → unmeasurable is a regression, by the one ladder',
    find(all, targetId({ journey: 'checkout fixture' }))?.drift, 'regressed');

  // must-pass: two screens of one host stay two histories. Grouping loosely enough to survive the
  // name drift above must not be loose enough to merge these.
  checks++; if (find(all, targetId({ url: RUNS })) === find(all, targetId({ url: HOME })))
    problems.push('two screens of one host were merged into one history');

  // A journey has no address, so its name is the only identity it has — the same answer
  // `canonical()` gives, reached the same way.
  check('a journey is one history keyed by its name', find(all, targetId({ journey: 'checkout fixture' }))?.runs, 2);

  // No row is lost, including the one nothing can identify.
  check('every row in is a row out', all.reduce((n, e) => n + e.history.length, 0), ALL.length);
  check('a row with no address and no name is kept', find(all, '')?.runs, 1);
  check('and no drift is claimed for it', find(all, '')?.drift, 'unidentified');

  // The list itself is ordered, and by time rather than by the order the map filled.
  checks++; if (all[0]?.latest?.ranAt !== '2026-09-23T18:00:00.000Z')
    problems.push(`the most recently measured target is not first: ${all[0]?.latest?.ranAt}`);

  return { ok: !problems.length, checks, problems };
}

// What a target is, and where a run goes — two answers, held apart by the same kind of pair as
// every probe.
//
// Identity: two runs of one screen must answer the same id, or the index can never say "this screen
// got worse"; two screens of one host must not (the hostname rule this replaced made seven screens
// delete each other). Location: two runs of one screen must land in two directories, or the second
// overwrites the pictures the first packet's `shot` fields name — the defect rotation used to guard
// against, and a directory made once needs no guard.
import { canonical, targetId, targetKeyOf, runDirName, runPathOf, isRunDir, stampOf } from '../src/core/target.js';
export const OPERATOR =
  'two screens of one host, which must not share an id (the old hostname rule did); the same screen '
  + 'measured twice, which must share one; an origin written with and without its trailing slash; a '
  + 'journey, which has no url to be keyed by; and two runs of one target, which must not share a directory';
export function pair() {
  const problems = []; let checks = 0;
  const check = (what, got, want) => { checks++; if (got !== want) problems.push(`${what}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`); };
  const runs = { url: 'http://127.0.0.1:3000/#/runs' };
  const home = { url: 'http://127.0.0.1:3000/#/home' };
  // must-fail: the defect this replaced. Under the old rule both of these resolved to `127.0.0.1`.
  checks++; if (targetId(runs) === targetId(home)) problems.push(`two screens of one host share an id: ${targetId(runs)}`);
  checks++; if (new URL(runs.url).hostname !== new URL(home.url).hostname) problems.push('the fixture no longer exercises the hostname collision it was written for');
  // must-pass: measuring the same screen again has to answer the same id, or the index never groups.
  check('the same target twice is one id', targetId(runs), targetId({ finalUrl: 'http://127.0.0.1:3000/#/runs' }));
  check('a bare origin collapses its trailing slash', targetId({ url: 'http://127.0.0.1:3000/' }), targetId({ url: 'http://127.0.0.1:3000' }));
  checks++; if (targetId({ url: 'http://127.0.0.1:3000/#/runs' }) === targetId({ url: 'http://127.0.0.1:3001/#/runs' })) problems.push('two ports collapsed into one target');
  check('a journey is keyed by its name', canonical({ journey: 'Toolshop register → checkout' }), 'journey:Toolshop register → checkout');
  check('the id is stable across case', targetId({ url: 'https://uxcli.thejunix.com/pages/docs' }), targetId({ url: 'https://UXCLI.thejunix.com/pages/docs' }));
  // The key the index groups packets by: a journey packet's own id; a page packet's address.
  check('a journey packet groups by its id', targetKeyOf({ id: 'j-checkout@staging', journey: { ref: 'journeys/checkout.json' } }), 'j-checkout@staging');
  check('a page packet groups by its address', targetKeyOf({ url: 'http://127.0.0.1:3000/#/runs' }), targetId(runs));
  check('a packet nothing identifies has an empty key, not an invented one', targetKeyOf({}), '');
  // Location. must-fail: one directory per target is the old rule, and it overwrote pictures.
  const a = runDirName('2026-09-23T09:02:11.706Z', 'abc123'), b = runDirName('2026-09-23T09:02:11.706Z', 'zzz999');
  checks++; if (a === b) problems.push('two runs in the same second share a directory');
  check('a run directory sorts by when it ran', runDirName('2026-09-23T09:02:11.706Z', 'abc123') < runDirName('2026-09-24T01:00:00.000Z', 'aaa000'), true);
  check('and has no colon in it', /:/.test(a), false);
  check('a run directory has one shape', a, 'R-2026-09-23T09-02-11Z-abc123');
  check('and only that shape is read back as a run', isRunDir('R-2026-09-23T09-02-11Z-abc123') && !isRunDir('j-checkout') && !isRunDir('history') && !isRunDir('R-2026-09-23T09-02-11Z'), true);
  check('an undated run still has a directory', runDirName(null, 'abc123'), 'R-undated-abc123');
  check('the six characters are normalised, never trusted', runDirName('2026-09-23T09:02:11Z', 'AB/C'), 'R-2026-09-23T09-02-11Z-000abc');
  check('a run path sits under runs/', runPathOf('2026-09-23T09:02:11Z', 'abc123'), 'runs/R-2026-09-23T09-02-11Z-abc123');
  check('a stamp sorts and has no colon', stampOf('2026-09-23T09:02:11.706Z'), '2026-09-23T09-02-11Z');
  return { ok: !problems.length, checks, problems };
}

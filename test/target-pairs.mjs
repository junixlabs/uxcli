// What a target is, held by the same kind of pair as every probe.
//
// The rule has two halves and they pull against each other, which is why both have to be shown. A
// rule that gives every run its own directory passes the first half and fails the second: the index
// deduplicates by directory, so nothing would ever replace anything and one screen measured daily
// would leave a year of rows. A rule that keys on the host — the rule this replaced — passes the
// second and fails the first, which is how seven screens of one host came to share one directory
// and delete each other, packet and index row together.
import { canonical, targetId, outDirFor } from '../src/core/target.js';

export const OPERATOR =
  'two screens of one host, which must not share a directory (the old hostname rule did); the same '
  + 'screen measured twice, which must; an origin written with and without its trailing slash; and '
  + 'a journey, which has no url to be keyed by';

export function pair() {
  const problems = []; let checks = 0;
  const check = (what, got, want) => { checks++; if (got !== want) problems.push(`${what}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`); };

  // must-fail: the defect this replaced. Under the old rule both of these resolved to `127.0.0.1`.
  const runs = { url: 'http://127.0.0.1:4717/#/runs' };
  const home = { url: 'http://127.0.0.1:4717/#/home' };
  checks++; if (outDirFor(runs) === outDirFor(home))
    problems.push(`two screens of one host share a directory: ${outDirFor(runs)}`);
  checks++; if (new URL(runs.url).hostname !== new URL(home.url).hostname)
    problems.push('the fixture no longer exercises the hostname collision it was written for');

  // must-pass: measuring the same screen again has to land in the same place, or the index never
  // replaces anything and grows without bound.
  check('the same target twice is one directory', outDirFor(runs), outDirFor({ url: 'http://127.0.0.1:4717/#/runs' }));
  check('and the same id', targetId(runs), targetId({ finalUrl: 'http://127.0.0.1:4717/#/runs' }));

  // An origin typed two ways is one target; nobody means two things by the trailing slash.
  check('a bare origin collapses its trailing slash',
    targetId({ url: 'http://127.0.0.1:4717/' }), targetId({ url: 'http://127.0.0.1:4717' }));

  // Ports are part of the identity: two dashboards on one machine are two targets.
  checks++; if (targetId({ url: 'http://127.0.0.1:4717/#/runs' }) === targetId({ url: 'http://127.0.0.1:4719/#/runs' }))
    problems.push('two ports collapsed into one target');

  // A journey is named, never dressed as a url: the packet records the name and has no way back to
  // the file it was read from, so a path here would be an invented fact.
  check('a journey is keyed by its name', canonical({ journey: 'Toolshop register → checkout' }), 'journey:Toolshop register → checkout');
  checks++; if (!/^toolshop-register-checkout-/.test(outDirFor({ journey: 'Toolshop register → checkout' })))
    problems.push(`a journey directory is not readable: ${outDirFor({ journey: 'Toolshop register → checkout' })}`);

  // The id decides where evidence lives, so it has to be the same six characters on every machine
  // and in every session — not a value that drifts with process state.
  check('the id is stable', targetId({ url: 'https://uxcli.thejunix.com/pages/docs' }), targetId({ url: 'https://UXCLI.thejunix.com/pages/docs' }));

  return { ok: !problems.length, checks, problems };
}

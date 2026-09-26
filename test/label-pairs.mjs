// What a target is called, held by the same kind of pair as every probe.
//
// The rule has one claim — the shortest label that still tells this target from the others on
// screen — and a rule that only ever says "fine" is indistinguishable from a rule that cannot see.
// So each half is shown: a set that must grow its labels because the leaves collide, and a set that
// must not, because they do not. Both halves matter. A rule that always prints the whole address
// passes the first and fails the second, and that rule is what this replaced.
import { parts, labelTargets } from '../src/core/label.js';

export const OPERATOR =
  'targets whose last segment collides, which must earn more of their path; targets whose last '
  + 'segment does not, which must stay bare; a percent-encoded path, an absolute path under the '
  + 'project root, and a journey, which has no address at all';

const ROOT = '/Users/x/proj';
const shown = l => [l.head, l.stem, l.leaf].filter(Boolean).join('/');

export function pair() {
  const problems = []; let checks = 0;
  const check = (what, got, want) => { checks++; if (got !== want) problems.push(`${what}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`); };

  // must-fail: three index.html under different parents. Naming them by the leaf alone gives one
  // label three times, which is the defect — the labels have to climb until they separate.
  const collide = [
    { where: 'file:///Users/x/proj/src/probes/focus-visible/must-pass/index.html', project: ROOT },
    { where: 'file:///Users/x/proj/src/probes/contrast/must-pass/index.html', project: ROOT },
    { where: 'file:///Users/x/proj/test/fixtures/stability/must-pass/index.html', project: ROOT },
  ];
  const grown = labelTargets(collide).map(shown);
  checks++; if (new Set(grown).size !== 3) problems.push(`colliding leaves were not separated: ${grown.join(' | ')}`);
  checks++; if (!grown.every(l => l.endsWith('must-pass/index.html'))) problems.push(`labels climbed off the leaf: ${grown.join(' | ')}`);

  // must-pass: leaves that already differ must not be padded with path nobody needed.
  const apart = [
    { where: 'http://127.0.0.1:3000/runs' },
    { where: 'https://uxcli.thejunix.com/pages/docs' },
  ];
  const bare = labelTargets(apart);
  check('a unique leaf stays bare', shown(bare[0]), 'runs');
  check('and so does its neighbour', shown(bare[1]), 'docs');
  check('the origin it dropped is kept as context', bare[1].context, 'uxcli.thejunix.com · pages');

  // The three shapes this index actually holds, each of which used to print in full.
  check('a percent-encoded path is decoded',
    parts({ where: 'http://127.0.0.1:3000/#/%2FUsers%2Fx%2F.uxcli%2Ffx-flow' }).segs.join('/'),
    'run detail/fx-flow');
  check('the project root is not repeated on every row',
    parts({ where: 'file:///Users/x/proj/src/card.js', project: ROOT }).segs.join('/'),
    'src/card.js');
  check('a journey keeps the name it was given, and is not dressed as a url',
    shown(labelTargets([{ where: null, name: 'Toolshop register → checkout' }])[0]),
    'Toolshop register → checkout');

  return { ok: !problems.length, checks, problems };
}

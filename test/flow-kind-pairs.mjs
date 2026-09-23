// The first commitment kind decided by a run instead of by a stylesheet.
//
// It gets a pair for the reason every rule here does, and one more: this kind is the first thing in
// the product able to fail on something that is not a colour, so a version of it that can only pass
// would quietly restore the state it was written to end — a commitment surface that reaches nothing
// but tokens, while looking like it reaches flows.
import { KINDS } from '../src/core/commitment/kinds.js';
import { observedFlow } from '../src/core/reality.js';

export const OPERATOR =
  'a run that reaches the condition and not the consequence, against one that reaches both; a run '
  + 'that never meets the condition at all; and a commitment naming only half a failure surface';

const kind = KINDS['flow-reachability'];
const flowOf = paths => observedFlow({ steps: paths.map((p, i) => ({ i, url: `https://shop.test${p}` })) });

const BOUGHT = flowOf(['/cart', '/pay', '/done']);
const ABANDONED = flowOf(['/cart', '/pay']);
const BROWSED = flowOf(['/', '/items']);

const surface = (when, mustObserve) => ({ failureSurface: { when, mustObserve } });

export function pair() {
  const problems = []; let checks = 0;
  const verdict = (what, e, flow, want) => {
    checks++;
    const got = kind.measure(e, { flow }).verdict;
    if (got !== want) problems.push(`${what}: got ${got}, wanted ${want}`);
  };

  verdict('a run that reached the condition and not the consequence', surface(['/pay'], ['/done']), ABANDONED, 'fail');
  verdict('a run that reached both', surface(['/pay'], ['/done']), BOUGHT, 'pass');

  // Never reaching the condition is not a pass. A commitment about what must follow a declined
  // payment says nothing about a session that never paid, and reporting that as `pass` would let a
  // flow earn its verdicts by avoiding the part under commitment.
  verdict('a run that never met the condition', surface(['/pay'], ['/done']), BROWSED, 'not-applicable');

  // Without a run there is no evidence, which is a missing input rather than a defective commitment.
  verdict('no run supplied', surface(['/pay'], ['/done']), null, 'unmeasurable');
  verdict('a surface naming a condition but no consequence', surface(['/pay'], []), BOUGHT, 'unmeasurable');
  verdict('a surface naming a consequence but no condition', surface([], ['/done']), BOUGHT, 'unmeasurable');

  checks++;
  {
    const r = kind.measure(surface(['/pay'], ['/done', '/receipt']), { flow: BOUGHT });
    if (r.verdict !== 'fail') problems.push(`a surface with two consequences, one unmet: got ${r.verdict}, wanted fail`);
    else if (!r.missing?.includes('/receipt') || r.missing.includes('/done'))
      problems.push(`the card must name only what was missing; it named ${JSON.stringify(r.missing)}`);
  }

  // The verdict is decided by places the browser reached, so visiting the same place twice cannot
  // change it — otherwise a flow could satisfy a commitment by looping.
  verdict('a place reached twice decides the same as once',
    surface(['/pay'], ['/done']), flowOf(['/cart', '/pay', '/cart', '/pay']), 'fail');

  checks++;
  if (kind.against !== 'run') problems.push(`the kind must declare what decides it; \`against\` is ${JSON.stringify(kind.against)}`);

  return { ok: !problems.length, checks, problems };
}

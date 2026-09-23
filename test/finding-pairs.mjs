import { saw, cause } from '../src/core/verdict/rank.js';

export const OPERATOR = 'a fail the doctrine moved to finding because the method is unproven, against a finding the probe itself reported — which look identical in `verdict` and ask different things of a person; and every verdict that is not a finding, which has no cause at all.';

export function pair() {
  const problems = [];
  let checks = 0;
  const is = (got, want, what) => { checks++; if (got !== want) problems.push(`${what}: ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`); };

  const moved = { verdict: 'finding', method: 'method-unproven', doctrine: { rawVerdict: 'fail' } };
  const said = { verdict: 'finding', method: 'method-unproven' };

  is(saw(moved), 'fail', 'a downgraded packet still says what was measured');
  is(cause(moved), 'method-unproven', 'a downgraded fail names the doctrine that moved it');
  is(saw(said), 'finding', 'a probe that reported finding measured a finding');
  is(cause(said), 'probe-said', 'a finding nobody moved is the probe speaking');

  // The two above are the pair. These hold the rule to the rest of the set: `cause` answers only
  // about findings, and `saw` never invents a doctrine that is not there.
  for (const v of ['pass', 'fail', 'unmeasurable', 'not-committed', 'suppressed', 'not-applicable']) {
    is(cause({ verdict: v }), null, `${v} has no finding-cause`);
    is(saw({ verdict: v }), v, `${v} measured what it says`);
  }
  is(cause(undefined), null, 'no packet, no cause');
  is(saw(undefined), undefined, 'no packet, nothing measured');
  is(cause({ verdict: 'fail', doctrine: { rawVerdict: 'fail' } }), null, 'a fail that stayed a fail is not a finding');

  return { ok: problems.length === 0, checks, problems };
}

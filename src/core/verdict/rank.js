// Which verdict needs a person's eye first — once, here, instead of three times in three surfaces.
//
// Before this file there were three ladders and they did not agree:
//
//   diff.js:7          finding 1 · unmeasurable 2   → unmeasurable outranks finding
//   dashboard.ui.js:26 finding 1 · unmeasurable 2   → finding outranks unmeasurable (lower is worse)
//   dashboard.js:32    an inline chain, a fourth ordering again
//
// Two of the three also carried names that are not verdicts: `diff.js` ranked `untested` and `stale`
// — `stale` is a file status in init.js and `untested` is a branch field, neither has ever been a
// verdict — which made the ladder look more complete than it was. `dashboard.ui.js` had no entry for
// `suppressed` at all, so a waived commitment sorted below `not-applicable` by accident.
//
// The order is by attention, and the argument for the one place they disagreed: a `finding` names a
// real defect that the doctrine downgraded because the method is unproven. An `unmeasurable` names
// nothing at all. A person deciding what to look at first should be sent to the named defect, so
// `finding` outranks `unmeasurable`.
//
// `pass` sits above `not-applicable` on purpose, and that is the second thing the old ladders
// disagreed about. A `pass` says something was measured and held; a `not-applicable` says the rule
// never applied. As the headline of a run the first is the more informative of the two, which is the
// order `dashboard.js` already reached for — it simply had no case for `not-committed` or
// `suppressed`, so a run where nobody had committed anything was headlined `pass` by falling through.
// No imports on purpose: this is shared vocabulary, and the dashboard's browser tier loads it as
// itself. `covers()` is handed the closed set rather than reaching for it.

// Worst first. Every one of the seven, and nothing that is not one of the seven.
export const BY_ATTENTION = ['fail', 'finding', 'unmeasurable', 'not-committed', 'suppressed', 'pass', 'not-applicable'];

// A name that is not a verdict sorts last rather than silently landing in the middle of the ladder.
export const rank = v => { const i = BY_ATTENTION.indexOf(v); return i < 0 ? BY_ATTENTION.length : i; };

// Sort comparator: negative means `a` should be read first.
export const byAttention = (a, b) => rank(a) - rank(b);

// The headline verdict of a set — the one that decides what the run is called.
export const worst = verdicts => [...verdicts].sort(byAttention)[0] ?? 'not-applicable';

// Did the second reading need more attention than the first? This is what `diff` calls a regression,
// and it is the same question as "is it worse", asked of two runs instead of two probes.
export const regressed = (a, b) => rank(b) < rank(a);
export const improved = (a, b) => rank(b) > rank(a);

// Held by `uxcli gate`: the ladder covers the closed set exactly, so a verdict added to the doctrine
// without a place in the ladder cannot quietly sort last.
export const covers = verdicts => {
  const bad = [];
  for (const v of verdicts) if (!BY_ATTENTION.includes(v)) bad.push(`verdict \`${v}\` has no place in the attention order`);
  for (const v of BY_ATTENTION) if (!verdicts.includes(v)) bad.push(`the attention order ranks \`${v}\`, which is not one of the seven verdicts`);
  return bad;
};

// The exit code, in one place.
//
// It is a fact about a run rather than a verdict: `fail` is the only verdict that changes it, and a
// run that could not be carried out never reached a verdict at all. This lived twice in bin/uxcli.js
// — once per command arm — and the two arms did not agree: the page arm checked `result.error`
// before the verdicts, the flow arm checked the verdicts first. A page that errored *and* failed
// therefore exited 1 from one arm and 2 from the other. Here `fail` wins, because a failure that was
// measured is worth blocking the job over even if a later step then fell over.
export const exitFor = ({ verdicts = [], couldNotRun = false } = {}) =>
  verdicts.includes('fail') ? 2 : couldNotRun ? 1 : 0;

// What the probe measured, before the doctrine touched it, and why the doctrine touched it.
//
// Six call sites had each written `p.doctrine?.rawVerdict === 'fail'` or `(p.doctrine?.rawVerdict ||
// p.verdict)` by hand — the gate, the card twice, run.js, the dashboard — and a reader of a packet had
// to reconstruct from two fields the one thing they wanted to know: is this `finding` a fail the
// instrument is not yet allowed to state, or a finding the probe itself reported? Those are different
// asks of a person. The first is fixed by validating a method; the second by fixing the page.
//
// in: a packet    out: saw() a verdict string; cause() 'method-unproven' | 'probe-said' | null
export const saw = p => p?.doctrine?.rawVerdict || p?.verdict;
export const cause = p => p?.verdict !== 'finding' ? null
  : saw(p) === 'fail' ? 'method-unproven' : 'probe-said';

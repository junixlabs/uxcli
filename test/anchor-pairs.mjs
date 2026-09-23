import { anchorOf, anchorState } from '../src/core/commitment/anchor.js';

export const OPERATOR = 'a commitment anchored to a run whose evidence has since changed, against the same commitment over the evidence it was signed for; and the two honest ways an anchor can say nothing — an entry that names no run, and one that names a run but carries no hash, neither of which may be read as a mismatch.';

export function pair() {
  const problems = [];
  let checks = 0;
  const is = (got, want, what) => { checks++; if (got !== want) problems.push(`${what}: ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`); };

  const SIGNED = 'a'.repeat(64), NOW = 'b'.repeat(64);
  const pinned = { id: 'x', derivedFrom: { run: '.uxcli/flow', hash: SIGNED } };

  is(anchorState({ entry: pinned, actual: NOW }), 'differs', 'evidence changed under a signature');
  is(anchorState({ entry: pinned, actual: SIGNED }), 'matches', 'evidence is what was signed for');

  is(anchorState({ entry: { derivedFrom: { run: '.uxcli/flow' } }, actual: NOW }), 'unverifiable', 'an anchor with no hash cannot differ');
  is(anchorState({ entry: pinned, actual: null }), 'unverifiable', 'a run that cannot be read cannot differ');
  is(anchorState({ entry: { id: 'x' }, actual: NOW }), 'unanchored', 'an entry that names no run is not anchored');
  is(anchorState({ entry: { derivedFrom: { run: '   ' } }, actual: NOW }), 'unanchored', 'whitespace is not a run');
  is(anchorState({}), 'unanchored', 'no entry, no anchor');

  is(anchorOf(pinned)?.run, '.uxcli/flow', 'the anchor names its run');
  is(anchorOf(pinned)?.hash, SIGNED, 'the anchor carries the hash that was signed');
  is(anchorOf({ derivedFrom: { run: 'r', hash: '' } })?.hash, null, 'an empty hash is no hash');
  is(anchorOf({ derivedFrom: { run: 'r' } })?.hash, null, 'a missing hash is no hash');
  is(anchorOf({}), null, 'nothing to anchor');

  return { ok: problems.length === 0, checks, problems };
}

// One target's history, out of a log of events.
//
// The index is written one row per run, which is the right shape for a log and the wrong shape for
// the question a person actually arrives with. Eighty rows on this machine are thirty-two targets:
// a table that prints all eighty answers "what ran" seven times over before it answers "is this
// screen worse than it was last week". The drift is the answer. The rows are the working.
//
// in:  the index rows, in any order
// out: one entry per target, the most recently measured first
//   targetId — identity from `core/target.js`, never `where`, `dir` or `name`. A target's name
//              shifts with what else is on screen (that is `core/label.js`'s whole job); its
//              identity may not, so only the id can carry a history.
//   history  — that target's rows, oldest → newest, so `latest === history.at(-1)`
//   latest   — the most recent row by `ranAt`, never by where it sat in the array
//   drift    — how the verdict moved into `latest`
//   runs     — `history.length`
//
// THE DRIFT WORDS are `regressed`, `improved`, `held`, `first`, and `unidentified`. The first three
// are not new vocabulary: `core/verdict/rank.js` already names `regressed()` and `improved()` for
// the same question asked of two probes, so this asks it of two runs with those predicates instead
// of re-deciding what worse means — the ladder disagreeing with itself in three places is the defect
// that file was written to end, and a fourth ordering here would reopen it.
//
// `first` exists because a single run is not the fourth case of the same comparison, it is the
// absence of one. A surface that paints it `held` is claiming a stability it has never observed:
// the run may be the first of a screen that is about to fail every day after. Nothing measured once
// has been steady, so the word says only that it is a beginning.
//
// Drift compares `latest` against the run immediately before it. "Passed last week, fails today" is
// a question about the step into the present; anything wider is a question about the history, which
// the entry hands over whole rather than summarising for a caller it cannot anticipate.
//
// ROWS WITH NO `targetId`. Seventy-two of the eighty rows here predate the field. Dropping them
// would answer a question about history with an eighth of the history, so the id is recomputed from
// what the row does carry — `where` for a page, `name` for a journey, which is exactly what
// `canonical()` keys those two shapes on. On this index the recomputation agrees with all eight
// stored ids, and that agreement is the reason to trust it on the other seventy-two.
//
// A row carrying neither an address nor a name cannot be identified at all. Those collect in one
// entry keyed `''`, drift `unidentified`: merging them into a target would assert an identity nobody
// established — the hostname key's mistake, seven screens deleting each other — and dropping them
// would lose a run. The invariant holds either way, and a caller can check it: the rows in equal the
// sum of the histories out.
//
// A row whose `ranAt` will not parse sorts oldest and so can never be `latest`. A run with no
// readable time is the one row that must not be allowed to say "today".
import { targetId as idOf } from './target.js';
import { worst as worstOf, regressed, improved } from './verdict/rank.js';

const identify = r => {
  if (r.targetId) return r.targetId;
  if (r.where) return idOf({ url: r.where });
  return r.name ? idOf({ journey: r.name }) : '';
};

const at = r => { const t = Date.parse(r?.ranAt ?? ''); return Number.isFinite(t) ? t : -Infinity; };

// Total, and free of input order: two rows written in the same millisecond still have to sort the
// same way whichever order they arrived in, or a shuffled index is a different answer. Subtraction
// would return NaN for two untimed rows, so the times are compared rather than differenced.
const oldestFirst = (a, b) =>
  (at(a) < at(b) ? -1 : at(a) > at(b) ? 1 : 0)
  || String(a?.dir ?? '').localeCompare(String(b?.dir ?? ''))
  || JSON.stringify(a ?? null).localeCompare(JSON.stringify(b ?? null));

// The row's own headline if it has one; otherwise the same ladder decides it from the counts.
const verdictOf = r => r?.worst || worstOf(Object.keys(r?.counts ?? {}));

const driftOf = history => {
  if (history.length < 2) return 'first';
  const before = verdictOf(history.at(-2)), now = verdictOf(history.at(-1));
  return regressed(before, now) ? 'regressed' : improved(before, now) ? 'improved' : 'held';
};

export function timelines(rows = []) {
  const by = new Map();
  for (const r of rows) {
    const id = r && typeof r === 'object' ? identify(r) : '';
    (by.get(id) || by.set(id, []).get(id)).push(r);
  }

  const out = [];
  for (const [targetId, history] of by) {
    history.sort(oldestFirst);
    out.push({
      targetId,
      latest: history.at(-1),
      history,
      drift: targetId ? driftOf(history) : 'unidentified',
      runs: history.length,
    });
  }

  // Newest first: a reader comes to this list to see what moved, and reads down from the most
  // recent. The id breaks the tie so the order is a property of the rows and not of the order a Map
  // happened to be filled in.
  return out.sort((a, b) =>
    (oldestFirst(b.latest, a.latest)) || a.targetId.localeCompare(b.targetId));
}

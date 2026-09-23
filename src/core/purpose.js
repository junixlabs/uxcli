// Why a run happened: to measure a product, or to prove the instrument can still see.
//
// in: a target's address    out: 'product' | 'instrument'
//
// `gate` drives every probe over a planted defect and a clean page, and those two pages are named by
// contract — `must-fail` and `must-pass`, the directory names gate.js reads. So a run whose target
// sits in one of them is the tool measuring itself, and its `fail` is the pair working, not a defect
// in anything anyone ships.
//
// Measured on this machine: 7 of the 12 targets a queue would call "needs action" are these. Sorted
// together they are 58% noise at the top of the list a person came to the page for.
//
// It reads the address rather than a field on the run because the 83 rows already written carry no
// field; and it reads only the pair names, never `test/` or `fixtures/`, which mean nothing outside
// this repo and would quietly demote a project's real test pages.
const PAIR = /(^|[\s/\-._])must-(fail|pass)($|[\s/\-._])/;

export const purposeOf = ({ where, name } = {}) => {
  const s = String(where || name || '');
  let path = s;
  try { const u = new URL(s); path = decodeURIComponent(u.pathname + u.hash + u.search); } catch { /* not a url: read it whole */ }
  return PAIR.test(path) ? 'instrument' : 'product';
};

export const isInstrument = t => purposeOf(t) === 'instrument';

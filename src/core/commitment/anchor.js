// What a commitment is anchored to, and whether that anchor still holds.
//
// `derivedFrom.run` names a directory. A directory is a pointer, and a pointer is not evidence: the
// run it names can be re-run, edited or replaced after somebody signed, and the entry goes on saying
// it was derived from something that no longer exists in the form it was read. The signature then
// stands over evidence nobody signed for.
//
// So an anchor carries a hash of the run it was read from, and the state of that anchor is a fact
// about two hashes — not a verdict, and not a thing this module may decide alone: it has no way to
// read a file, which is the whole point. The caller recomputes and hands the result in.
//
// in: an entry, and the hash the caller read off disk now (null if it could not read one)
// out: 'unanchored' | 'unverifiable' | 'matches' | 'differs'
export const anchorOf = entry => {
  const d = entry?.derivedFrom;
  if (!d || typeof d.run !== 'string' || d.run.trim() === '') return null;
  return { run: d.run, hash: typeof d.hash === 'string' && d.hash ? d.hash : null };
};

export const anchorState = ({ entry, actual = null } = {}) => {
  const a = anchorOf(entry);
  if (!a) return 'unanchored';
  if (!a.hash) return 'unverifiable';
  if (!actual) return 'unverifiable';
  return a.hash === actual ? 'matches' : 'differs';
};

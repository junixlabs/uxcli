// What keeps a `fail` from being stated as one. A cap names why the instrument is not trusted to say
// fail here — method unproven, signals too weak to see, a prerequisite or profile nobody verified —
// and lowers `fail` to `finding`. It never raises anything: a cap on a `pass` is a `pass`.
export function capFor({ method, strength, prerequisiteVerified, profileVerified } = {}) {
  const caps = [];
  const cap = by => caps.push({ by, from: 'fail' });
  if (method !== 'method-validated') cap('method');
  if (strength === 'weak' || strength === 'unverifiable') cap('observability');
  if (prerequisiteVerified !== undefined && prerequisiteVerified !== true) cap('prerequisite-unverified');
  if (profileVerified !== undefined && profileVerified !== true) cap('profile-unverified');
  return caps;
}

export const applyCaps = (verdict, caps = []) => verdict === 'fail' && caps.length ? 'finding' : verdict;

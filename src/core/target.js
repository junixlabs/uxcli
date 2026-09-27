// Target identity, and the name a run's directory gets.
//
// Two questions, kept apart on purpose. WHICH target a run measured is an identity: two runs of one
// screen must answer the same, or the index can never say "this screen got worse". WHERE a run's
// evidence lives is not an identity at all: every run gets a directory of its own, made once and
// never written into again, because a packet's `shot` names a file and a file overwritten by a later
// run turns every earlier packet into a liar. The old layout keyed the directory on the target and
// rotated the previous run into `history/`; rotation existed only to protect the pictures, and a
// directory nobody writes twice needs no protecting.
//
// in:  { url | finalUrl | file | journey }   out: a stable id; and, separately, a directory name
// The hash is hand-written because src/core/ may not import node:crypto.
function fnv1a(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

export const hash6 = s => fnv1a(s).toString(36).padStart(6, '0').slice(-6);

// Two runs are the same target exactly when this string matches. The hash is kept: in a single-page
// app it is the only thing naming the screen. A journey is keyed by name — the packet has no way
// back to the file it was read from, so a path here would be invented.
export function canonical({ url, finalUrl, journey, file } = {}) {
  if (journey) return `journey:${journey}`;
  const raw = finalUrl || url || file || '';
  if (!raw) return '';
  let u;
  try { u = new URL(raw); } catch { return raw; }
  const host = u.host.toLowerCase();
  const path = u.pathname === '/' ? '' : u.pathname.replace(/\/$/, '');
  return `${u.protocol}//${host}${path}${u.search}${u.hash}`;
}

export const targetId = t => { const c = canonical(t); return c ? hash6(c) : ''; };

// The key the index groups runs by. A journey packet carries its own id (`j-<slug>[@env]`); a page
// packet carries the address it opened. Neither is a path.
export const targetKeyOf = run => run?.id || run?.targetId || targetId({ url: run?.url, finalUrl: run?.finalUrl, journey: run?.journey?.name || run?.name }) || '';

export const RUNS = 'runs';
export const ARTIFACTS = 'artifacts';

// Filesystem-safe and still sortable as a string: an ISO instant with the colons taken out, which is
// the form Windows and every archive tool accept.
export const stampOf = ranAt => String(ranAt || '').replace(/[:]/g, '-').replace(/\.\d+Z$/, 'Z') || 'undated';

// `R-<when>-<six>`: sorts by time as a string, and the six characters keep two runs that start in the
// same second apart. The caller supplies them — a random draw is a capability, and core has none.
export const runDirName = (ranAt, six) => `R-${stampOf(ranAt)}-${String(six || '').replace(/[^a-z0-9]/gi, '').toLowerCase().padStart(6, '0').slice(-6)}`;
export const isRunDir = name => /^R-[0-9T-]+Z?-[a-z0-9]{6}$/.test(String(name)) || /^R-undated-[a-z0-9]{6}$/.test(String(name));
export const runPathOf = (ranAt, six) => `${RUNS}/${runDirName(ranAt, six)}`;

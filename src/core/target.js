// Target identity: which directory a run writes into, and which older run a new one replaces.
// `label.js` answers what a target is CALLED and its answer shifts with the screen; this answer may
// never shift. Keying the directory on hostname instead cost 28 packets and 44 index rows.
//
// in:  { url | finalUrl | file | journey }   out: a stable id and a directory name
// The hash is hand-written because src/core/ may not import node:crypto.
function fnv1a(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

const hash6 = s => fnv1a(s).toString(36).padStart(6, '0').slice(-6);

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

// Where a run's evidence goes, as a fixed shape rather than a name derived from the address.
//
// It used to be `<readable-slug>-<targetId>`, and the slug half was the whole problem: it put a
// presentational decision — how a URL reads when flattened — into the path evidence lives at, so a
// change in how slugify treats a character relocates a packet. The address is inside run.json, which
// is where a reader who wants it should look. The path only has to be the same one every time.
//
// One target, one directory, and the directory holds the current run beside its own screenshots.
// A run that is replaced moves under `history/` with its shots, keyed by when it ran: a packet whose
// `shot` field names a file must name the picture taken on that run, and overwriting step-0.jpg in
// place would leave three-day-old packets pointing at today's image.
export const RUNS = 'runs';
export const HISTORY = 'history';

export const outDirFor = t => `${RUNS}/${targetId(t) || 'unidentified'}`;

// Filesystem-safe and still sortable as a string: an ISO instant with the colons taken out, which is
// the form Windows and every archive tool accept.
export const stampOf = ranAt => String(ranAt || '').replace(/[:]/g, '-').replace(/\.\d+Z$/, 'Z') || 'undated';

export const historyDirFor = (t, ranAt) => `${outDirFor(t)}/${HISTORY}/${stampOf(ranAt)}`;

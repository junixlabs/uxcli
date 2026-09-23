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

// Lossy on purpose: the hash guarantees uniqueness, this half only helps a person find the
// directory by eye.
function readable(t) {
  const c = canonical(t);
  if (!c) return 'run';
  if (c.startsWith('journey:')) return slugify(c.slice(8)) || 'journey';
  let u;
  try { u = new URL(c); } catch { return slugify(c) || 'run'; }
  const segs = [
    ...u.pathname.split('/'),
    ...decodeSafe(u.hash.replace(/^#\/?/, '')).split('/'),
  ].map(slugify).filter(Boolean);
  const host = slugify(u.host);
  const tail = segs.slice(host ? -2 : -3).join('-');
  return [host, tail].filter(Boolean).join('-').slice(0, 48) || 'run';
}

const decodeSafe = s => { try { return decodeURIComponent(s); } catch { return s; } };
const slugify = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const outDirFor = t => `${readable(t)}-${targetId(t)}`;

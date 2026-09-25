// Small pure helpers shared by the chrome and provision adapters: how a value becomes the hash the
// packet carries instead of it, how a `$.a.b` / `response.a.b` path is walked, and how a policy glob
// is read. Nothing here touches the world.
import crypto from 'node:crypto';

// A value never reaches a packet raw. Strings hash as themselves so a hash can be recomputed from a
// known string; anything else hashes as its JSON.
export const sha1_8 = v => 'sha1_8:' + crypto.createHash('sha1')
  .update(typeof v === 'string' ? v : JSON.stringify(v)).digest('hex').slice(0, 8);

// `$.user.id`, `response.phone`, `lead.id` — the leading `$` or `response` names the root, the rest walks.
export function getPath(obj, p) {
  const parts = String(p).replace(/^\$\.?/, '').replace(/^response\./, "").split('.').filter(Boolean);
  let cur = obj;
  for (const k of parts) { if (cur == null || typeof cur !== 'object') return undefined; cur = cur[k]; }
  return cur;
}

// Policy globs: `*` matches anything, `?` one character. Used on hosts, tenants, mail domains.
export const glob = (pattern, s) => new RegExp('^' + String(pattern).split('*').map(seg =>
  seg.split('?').map(x => x.replace(/[.+^${}()|[\]\\]/g, '\\$&')).join('.')).join('.*') + '$', 'i').test(String(s ?? ''));
export const globs = (patterns, s) => (patterns || []).some(p => glob(p, s));

// `POST /api/leads/{leadId}` against a live method + pathname. `{x}` and `*` take one segment,
// `**` takes the rest; a query string is never part of what a signature names.
export function requestMatches(spec, method, pathname) {
  const m = /^([A-Z]+)\s+(\S+)$/.exec(String(spec).trim());
  if (!m) return false;
  if (m[1] !== String(method).toUpperCase()) return false;
  const re = '^' + m[2].replace(/[.+^$()|[\]\\]/g, '\\$&').replace(/\{[^}]+\}/g, '[^/]+')
    .replace(/\*\*/g, '\0').replace(/\*/g, '[^/]*').replace(/\0/g, '.*') + '/?$';
  return new RegExp(re).test(pathname);
}

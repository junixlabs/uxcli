// What to call the thing that was measured.
//
// `where` is an execution location, not a name. On this machine the 28 targets carry a median of 77
// characters and 4 slashes, the longest is 166, and seven of them render an absolute path
// percent-encoded inside a hash route. None of that is identity: it is the address Chromium was
// handed. A dense list that prints it makes the reader parse a browser address to learn what was
// measured.
//
// The rule, and it is one sentence: **show the shortest label that is still unique among the
// targets on screen, and keep the rest as context beneath it.** That is the same rule
// `stepLabels()` already applies to the steps of a journey, where five steps over `file:` urls
// otherwise all render as `file:///Us…` — every one named by the part they share and cut off before
// the part that tells them apart.
//
// Pure, and in core/ because it is a decision about meaning rather than a way of drawing: the card,
// the dashboard and anything else that has to name a target should name it the same way.

const decode = s => { try { return decodeURIComponent(s); } catch { return s; } };

// Split one target into the pieces a label can be built from, most-significant last.
//   host  — the authority, when there is one. Context, never identity.
//   segs  — the path, as segments. The last one is the thing; the rest locate it.
//   kind  — what sort of address this was, which decides how the pieces are read.
export function parts({ where, project = '', name = '' }) {
  if (!where) return { host: '', segs: [], kind: 'named', raw: name, name };
  let u;
  try { u = new URL(where); } catch { return { host: '', segs: [where], kind: 'opaque', raw: where, name }; }

  if (u.protocol === 'file:') {
    const abs = decode(u.pathname);
    // The project is already its own column. `file:///Users/me/proj/` repeated on every row is the
    // whole of what makes this list hard to read, and it carries nothing the project column does not.
    const rel = project && abs.startsWith(project + '/') ? abs.slice(project.length + 1) : abs.replace(/^\//, '');
    return { host: '', segs: rel.split('/').filter(Boolean), kind: 'file', raw: where, name };
  }

  // uxcli measuring its own dashboard. A run is addressed by its directory, so the route carries an
  // absolute path percent-encoded after `#/` — 93 characters of storage address for a thing whose
  // name is its last segment. The directory is where the packet sits; it is not what was measured.
  const hash = decode(u.hash.replace(/^#\/?/, ''));
  if (hash.startsWith('/')) {
    const leaf = hash.split('/').filter(Boolean).pop() || '/';
    return { host: u.host, segs: ['run detail', leaf], kind: 'packet', raw: where, name };
  }

  const path = u.pathname.replace(/^\//, '');
  const segs = [...path.split('/'), ...(hash ? hash.split('/') : [])].filter(Boolean);
  // A url with no path is not a page called "/" inside a host; it is the host. Named any other way
  // it prints as `127.0.0.1:4717//`, a separator standing next to nothing.
  if (!segs.length) return { host: '', segs: [u.host], kind: 'web', raw: where, name };
  return { host: u.host, segs, kind: 'web', raw: where, name };
}

// The candidate labels for one target, shortest first: the last segment, then the last two, and so
// on, and only then the same again with the host in front. Context is added because it is needed,
// never by default.
function ladder(p) {
  const out = [];
  if (p.kind === 'named' || p.kind === 'opaque') return [{ leaf: p.raw, stem: '', head: '' }];
  const n = p.segs.length;
  for (let take = 1; take <= n; take++) out.push({
    leaf: p.segs[n - 1], stem: p.segs.slice(Math.max(0, n - take), n - 1).join('/'), head: '' });
  if (p.host) for (let take = 1; take <= n; take++) out.push({
    leaf: p.segs[n - 1], stem: p.segs.slice(Math.max(0, n - take), n - 1).join('/'), head: p.host });
  return out;
}

const seen = l => [l.head, l.stem, l.leaf].filter(Boolean).join('/');

// Line two. Uniqueness decides how much of the address line one must carry; meaning decides line
// two, and it is not the same question. `fx-flow` is a unique label and it is also a cryptic one —
// it needs `127.0.0.1:4717 · run detail` under it to say what kind of thing it names. So the
// context is everything that locates the target and is not already printed above it.
function context(p, line1) {
  const bits = [];
  if (p.host && line1.head !== p.host) bits.push(p.host);
  const shown = new Set([...(line1.stem ? line1.stem.split('/') : []), line1.leaf]);
  const rest = p.segs.slice(0, -1).filter(s => !shown.has(s));
  if (rest.length) bits.push(rest.join('/'));
  return bits.join(' · ');
}

// Label a whole set at once, because "unique" is a property of the set and not of one row. Returns
// one `{ leaf, stem, head, raw, kind }` per input, in input order.
export function labelTargets(targets) {
  const ps = targets.map(parts);
  const ladders = ps.map(ladder);
  const out = ps.map((p, i) => ({ ...ladders[i][0], raw: p.raw, kind: p.kind }));

  // Walk the ladder for anything that still collides, one rung at a time, so a row only carries the
  // context its neighbours force on it. Two `/runs` on two ports both grow a host; a target nobody
  // collides with keeps its bare leaf.
  for (let pass = 0; pass < 12; pass++) {
    const at = new Map();
    out.forEach((l, i) => { const k = seen(l); (at.get(k) || at.set(k, []).get(k)).push(i); });
    // Two rows sharing a label are only a problem when they are two different things. The same
    // target measured twice is the ordinary case on this index — 72 runs over 28 targets — and no
    // amount of extra path will ever separate them, so climbing on their account only drags every
    // other row up with them. What tells those two apart is the time they ran, and the table
    // already carries it.
    const clashing = [...at.values()]
      .filter(v => v.length > 1 && new Set(v.map(i => ps[i].raw)).size > 1);
    if (!clashing.length) break;
    let moved = false;
    for (const group of clashing) for (const i of group) {
      const rung = ladders[i].findIndex(l => seen(l) === seen(out[i]));
      if (rung >= 0 && rung + 1 < ladders[i].length) { out[i] = { ...ladders[i][rung + 1], raw: ps[i].raw, kind: ps[i].kind }; moved = true; }
    }
    if (!moved) break;   // two targets that really are the same string; the row keeps the raw value
  }
  return out.map((l, i) => ({ ...l, context: context(ps[i], l) }));
}

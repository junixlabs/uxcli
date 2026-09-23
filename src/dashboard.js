// uxcli dashboard: one viewer on this machine for runs that stay in their own projects.
//
// The split is deliberate and is the whole design. Evidence — run.json and its screenshots — stays in
// the project that produced it, because a verdict is only licensed by a commitment signed in that
// project, because CI has no home directory, and because an agent asked to dispute a verdict must be
// able to open the packet from the repo it is working in. What lives in ~/.uxcli is an index of
// pointers and nothing else: delete it and you lose the list, never a single piece of evidence.
//
// file:// cannot fetch file://, so a viewer that reads many projects has to be served. It is served on
// the loopback interface only, and it will only open files under a directory that is in the index.
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import http from 'node:http'; import { spawn } from 'node:child_process';
import { read as readPacket } from './core/verdict/packet.js';
import { PAGE_PROBES } from './page.js'; import { PROBES } from './run.js';
import { fileURLToPath } from 'node:url';
import { worst as worstOf } from './core/verdict/rank.js';
import { targetId } from './core/target.js';
// Which tree a run belongs to. The store owns it, because deciding it means knowing what file marks
// a project, and that name lives in exactly one place.
import { projectRoot, readContext, readAuthorities, readCommitments, NAMES } from './adapters/store/project-files.js';
import { governance } from './core/governance.js';
import { partitionIndex } from './core/lineage.js';
import { purposeOf } from './core/purpose.js';
import { admit } from './core/commitment/admit.js';
import { anchorOf, anchorState } from './core/commitment/anchor.js';
import { runHash } from './adapters/store/run-hash.js';
import { readContext as parseContext, FIELDS } from './core/context.js';
import { capabilityOf, ACTIONS } from './core/authority.js';
import { coverage as coverageOf } from './core/reality.js';
import { observedFlow } from './core/reality.js';

// The index is a log of runs. The screens need a product, and the distance between the two is this
// function: it resolves the disk facts — which paths are still project roots, what each one has
// declared — and hands them to modules that decide without ever touching a file.
//
// in: the index   out: the index, plus one entry per project and the rows no project can seat
//
// A project is read where its runs say it is, never where the server happens to be running: the
// dashboard serves every project on the machine and belongs to none of them.
const MARKERS = [NAMES.commitments, '.git', 'package.json'];
const isRoot = p => { try { return MARKERS.some(m => fs.existsSync(path.join(p, m))); } catch { return false; } };

// E1, on the screen rather than only in `uxcli context`. The four fields and what each one is for
// come from the engine, so a field it grows appears here without this file learning its name; the
// source travels with the value because a claim nobody can trace to a document is not a declaration.
const contextOf = raw => {
  const c = parseContext(raw);
  const said = Object.entries(c.known).map(([field, v]) => ({ field, means: FIELDS[field], source: v.source,
    value: v.value, count: Array.isArray(v.value) ? v.value.length : null }));
  return { said, missing: c.missing.map(k => ({ field: k, means: FIELDS[k] })), unsourced: c.unsourced, complete: c.complete };
};

// Who may do what, asked of the engine per subject rather than read off the registry by eye. The
// card that used to print `sign no` where `sign: contrast` had been granted was this question
// answered twice, in two places, differently.
const authorityOf = authorities => [...new Set((authorities || []).map(a => a.subject).filter(Boolean))]
  .map(subject => capabilityOf({ authorities, subject }));

// Whether each commitment still stands over the evidence it was signed for. The hash is read once
// per run directory, not once per entry: a project can pin many commitments to one run.
function anchorsOf(entries, root) {
  const seen = new Map();
  const state = { pinned: 0, unanchored: 0, unverifiable: 0, differs: [] };
  for (const e of entries) {
    const a = anchorOf(e);
    if (!a) { state.unanchored++; continue; }
    const at = path.resolve(root, a.run);
    if (!seen.has(at)) seen.set(at, runHash(at));
    const st = anchorState({ entry: e, actual: seen.get(at) });
    if (st === 'differs') state.differs.push({ id: e.id, run: a.run });
    else if (st === 'matches') state.pinned++;
    else state.unverifiable++;
  }
  return state;
}

// E2's question, which is not "what failed" but "what did the browser reach that nobody has
// promised anything about". It can only be asked of a journey: a page run records one address, and
// one address is not a map. No journey run in a project means no answer, and the screen says that
// rather than showing a zero that would read as full coverage.
function reachOf(rows, root, entries) {
  const j = rows.filter(r => r.project === root && r.kind === 'journey')
    .sort((a, b) => String(b.ranAt).localeCompare(String(a.ranAt)))[0];
  if (!j) return null;
  let run = null;
  try { run = JSON.parse(fs.readFileSync(path.join(j.dir, 'run.json'), 'utf8')); } catch { return null; }
  const flow = observedFlow(run);
  if (!flow) return null;
  const g = coverageOf({ flow, entries, journey: run.journey || null });
  return { journey: run.journey || run.url || null, ranAt: j.ranAt, dir: j.dir,
    observed: g.observed, committed: g.committed,
    uncovered: g.uncovered.map(u => ({ path: u.path, title: u.title || null })) };
}

function projection(idx) {
  const paths = [...new Set(idx.runs.map(r => r.project).filter(Boolean))];
  const live = paths.filter(p => fs.existsSync(p));
  const seat = partitionIndex({ rows: idx.runs,
    rootsInForce: live.filter(isRoot), absentRoots: paths.filter(p => !live.includes(p)) });

  const projects = live.filter(isRoot).map(root => {
    const doc = readCommitments(root);
    const entries = doc?.entries || [];
    // What a project commits ABOUT, not how many: 42 entries that are all one kind is a one-
    // dimensional promise, and the count alone reads as breadth it does not have.
    const kinds = {};
    for (const e of entries) kinds[e.kind || 'unstated'] = (kinds[e.kind || 'unstated'] || 0) + 1;
    // A commitment about a colour token is not a commitment about anywhere a person goes. The
    // count alone hides that: 42 entries and not one of them names a place the browser reached.
    const placeful = entries.filter(e => e.failureSurface || e.url || e.where).length;
    // A commitment that never passed admission is not a promise this project has made. Showing the
    // raw count says it did. `admit` decides; the screen only reads what it decided.
    const authorities = readAuthorities(root);
    const seats = entries.map(e => ({ id: e.id, ...admit(e, { doc: doc || {}, authorities }) }));
    const refused = seats.filter(x => !x.admitted).map(x => ({ id: x.id, verdict: x.verdict, reason: x.reason }));
    const raw = readContext(root);
    return { project: root, commitments: entries.length, kinds, placeful,
      admitted: seats.length - refused.length, refused,
      context: contextOf(raw), authority: authorityOf(authorities),
      reach: reachOf(idx.runs, root, entries),
      anchors: anchorsOf(entries, root),
      governance: governance({ context: raw, authorities, entries, doc: doc || {} }) };
  });
  // A rule that may only ever report `finding` cannot clear a screen, so how many can is part of
  // what the page has to say about its own reach.
  const probes = [...PAGE_PROBES, ...PROBES].map(p => ({ id: p.id, method: p.method?.status || 'method-unproven' }));
  return { ...idx, projects, probes,
    // Rows written before `purpose` was recorded carry none; they are read the old way once, here,
    // and not on every draw.
    runs: idx.runs.map(r => (r.purpose ? r : { ...r, purpose: purposeOf(r) })),
    quarantined: seat.quarantined, unseated: seat.groups };
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const HOME = path.join(os.homedir(), '.uxcli');
export const INDEX = path.join(HOME, 'index.json');

const read = () => { try { const j = JSON.parse(fs.readFileSync(INDEX, 'utf8')); return Array.isArray(j.runs) ? j : { runs: [] }; } catch { return { runs: [] }; } };

// One line per outDir, replaced in place: the index lists where runs are, not their history. A
// machine with no writable home (CI) simply has no index; that must never fail a run.
export function registerRun(result, outDir) {
  try {
    const dir = path.resolve(outDir); const idx = read();
    const probes = result.probes || [];
    const entry = {
      kind: result.journey ? 'journey' : 'page',
      name: result.journey || result.title || result.url || path.basename(dir),
      where: result.finalUrl || result.url || null,
      project: projectRoot(process.cwd(), os.homedir()), dir, ranAt: result.ranAt || new Date().toISOString(),
      // Which thing was measured, decided once at write time. The dashboard used to re-derive this
      // on every draw from whatever string it found, so two screens agreeing was a coincidence.
      targetId: targetId(result),
      // Why this run happened, decided here rather than re-derived on every draw. A screen that
      // works it out from the address is a second answer to the question, and the two can differ.
      purpose: purposeOf(result),
      // One ladder, in core/. The chain that stood here had no case for `not-committed` or
      // `suppressed`, so a run where nobody had committed anything was headlined `pass`.
      worst: worstOf(probes.map(p => p.verdict)),
      counts: probes.reduce((a, p) => ({ ...a, [p.verdict]: (a[p.verdict] || 0) + 1 }), {}),
      // The exit code the command returned. Older entries predate this field and carry null: the
      // overview counts what was recorded and says so, rather than deriving a number nobody stored.
      exit: Number.isInteger(result.exit) ? result.exit : null,
    };
    idx.runs = [entry, ...idx.runs.filter(r => r.dir !== dir)];
    fs.mkdirSync(HOME, { recursive: true }); fs.writeFileSync(INDEX, JSON.stringify(idx, null, 1) + '\n');
  } catch { /* no index is a fine state; a run is not worth failing over one */ }
}

// A directory is readable only because it is in the index, and a file only because it resolves inside
// that directory. Screenshots can show a signed-in page, so this is the one check that has to be exact.
const under = (dir, f) => { const p = path.resolve(dir, f); return p === dir || p.startsWith(dir + path.sep) ? p : null; };
const allowed = (idx, dir) => idx.runs.some(r => r.dir === path.resolve(dir || '')) ? path.resolve(dir) : null;

const TIERS = {
  '/dashboard.tokens.css': 'text/css; charset=utf-8',
  '/dashboard.components.css': 'text/css; charset=utf-8',
  '/dashboard.shell.css': 'text/css; charset=utf-8',
  '/dashboard.ui.js': 'text/javascript; charset=utf-8',
  '/dashboard.app.js': 'text/javascript; charset=utf-8',
  // The verdict ladder, served as itself for the same reason the palette is: the browser tier reads
  // the same order the server sorts by, rather than keeping a second copy that drifts.
  '/core/verdict/rank.js': 'text/javascript; charset=utf-8',
  // What a target is called. Served as itself for the same reason the ladder is: the browser tier
  // names a target the same way the card does, rather than keeping a second rule that drifts.
  '/core/label.js': 'text/javascript; charset=utf-8',
  // Runs collapsed into the targets they measured. Same reason again: a screen that grouped runs
  // its own way would be a second answer to which two runs are the same thing.
  '/core/timeline.js': 'text/javascript; charset=utf-8',
  // Which thing was measured. It is here because `timeline.js` imports it, and a module served
  // without what it imports is served broken: the browser gets a 404 where an import should be and
  // the whole graph — every screen — fails to evaluate. `tierRule` in arch.js checks this now.
  '/core/target.js': 'text/javascript; charset=utf-8',
};

// The mono is shipped with the product rather than borrowed from the machine, because the stack this
// dashboard used to name resolved to Menlo, and Menlo does not carry Vietnamese. Named the same way
// everything else here is named — a grid of files this server knows about, not a directory it walks.
for (const weight of [400, 600, 700])
  for (const range of ['latin', 'latin-ext', 'vietnamese'])
    TIERS[`/fonts/jetbrains-mono-${weight}-${range}.woff2`] = 'font/woff2';

const mark = () => { try { return fs.readFileSync(path.join(HERE, 'dashboard.mark.svg'), 'utf8'); } catch { return ''; } };
// Inlined into the page the mark is decorative: the link around it is already named, so a second
// accessible name here would announce the product twice. The <title> goes with the role — left in,
// it is not read (the parent is aria-hidden) but it is still a hover tooltip saying "UXCLI" on a
// link whose own label is "uxcli — overview". As a favicon the file keeps both.
const markInline = () => mark()
  .replace('role="img" aria-label="UXCLI"', 'aria-hidden="true" focusable="false"')
  .replace(/<title>[\s\S]*?<\/title>\s*/, '');

export function serve({ port = 4717, host = '127.0.0.1' } = {}) {
  const send = (res, code, type, body) => { res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' }); res.end(body); };
  const server = http.createServer((req, res) => {
    // Bound to loopback, and a Host header from anywhere else is refused: a page in the browser must
    // not be able to reach this through a name that resolves here.
    const hostHdr = (req.headers.host || '').replace(/:\d+$/, '');
    if (!['127.0.0.1', 'localhost', '[::1]', '::1'].includes(hostHdr)) return send(res, 403, 'text/plain', 'loopback only');
    const u = new URL(req.url, 'http://127.0.0.1'); const q = u.searchParams; const idx = read();
    try {
      // The mark is one file. Inlined into the page it takes `currentColor` and follows the theme
      // toggle; served as itself it is the favicon and colours itself. Drawing it twice would be two
      // marks to keep in step, which is how a logo ends up subtly different from its own favicon.
      if (u.pathname === '/') return send(res, 200, 'text/html; charset=utf-8',
        fs.readFileSync(path.join(HERE, 'dashboard.html'), 'utf8').replace('<!--mark-->', () => markInline()));
      if (u.pathname === '/mark.svg') return send(res, 200, 'image/svg+xml; charset=utf-8', mark());
      // The three tiers are three files, served as themselves rather than inlined into the page: the
      // palette is a real stylesheet so `uxcli sheet` can read the project's own tokens out of it, and
      // the components are a real stylesheet and a real module for the same reason — something that
      // can be opened, diffed and measured on its own. Named one by one, not from a directory: this
      // server's whole discipline is that it serves what is in the index and nothing else.
      if (TIERS[u.pathname]) return send(res, 200, TIERS[u.pathname], fs.readFileSync(path.join(HERE, u.pathname.slice(1))));
      if (u.pathname === '/api/index') return send(res, 200, 'application/json', JSON.stringify(projection(idx)));
      if (u.pathname === '/api/run') {
        const dir = allowed(idx, q.get('dir')); if (!dir) return send(res, 404, 'application/json', '{"error":"not in index"}');
        // Read through the packet contract, so the page only ever sees one shape. A run measured
        // before the format keeps its evidence — it is lifted into place here rather than left for
        // the screen to recognise, which is how a screen ends up knowing about two formats.
        const run = JSON.parse(fs.readFileSync(path.join(dir, 'run.json'), 'utf8'));
        if (Array.isArray(run.probes)) run.probes = run.probes.map(readPacket);
        return send(res, 200, 'application/json', JSON.stringify(run));
      }
      if (u.pathname === '/file') {
        const dir = allowed(idx, q.get('dir')); if (!dir) return send(res, 404, 'text/plain', 'not in index');
        const f = under(dir, q.get('f') || ''); if (!f || !/\.(png|jpe?g)$/i.test(f)) return send(res, 403, 'text/plain', 'not a screenshot in this run');
        return send(res, 200, /\.png$/i.test(f) ? 'image/png' : 'image/jpeg', fs.readFileSync(f));
      }
      // The packet is what a person attaches to a dispute, so being able to reach it is the point. Only
      // a directory that is in the index can be opened, and only through the OS file manager.
      if (u.pathname === '/api/open') {
        const dir = allowed(idx, q.get('dir')); if (!dir) return send(res, 404, 'text/plain', 'not in index');
        const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open';
        spawn(cmd, [dir], { stdio: 'ignore', detached: true }).unref();
        return send(res, 200, 'application/json', '{"ok":true}');
      }
      if (u.pathname === '/api/forget') {
        const dir = path.resolve(q.get('dir') || ''); idx.runs = idx.runs.filter(r => r.dir !== dir);
        fs.writeFileSync(INDEX, JSON.stringify(idx, null, 1) + '\n'); return send(res, 200, 'application/json', JSON.stringify(idx));
      }
    } catch (e) { return send(res, 404, 'text/plain', String(e.message || e).slice(0, 120)); }
    send(res, 404, 'text/plain', 'no such route');
  });
  // Running it twice is the ordinary mistake, not an exceptional one — a second terminal, a second
  // project. It used to answer with an unhandled EADDRINUSE stack trace, which says nothing a person
  // can act on. The dashboard they wanted is already open, so say that and where it is.
  return new Promise((resolve, reject) => {
    server.once('error', err => reject(err && err.code === 'EADDRINUSE'
      ? Object.assign(new Error(`a dashboard is already listening on http://${host}:${port}/ — open it, or pass --port=N for a second one`), { code: 'EADDRINUSE', expected: true })
      : err));
    server.listen(port, host, () => resolve({ server, url: `http://${host}:${port}/` }));
  });
}

export function indexCard() {
  const idx = read(); const L = [`uxcli dashboard · ${INDEX}`, ''];
  if (!idx.runs.length) return L.concat(['  no run recorded yet. Every `uxcli run` adds one line here; the evidence stays in its project.']).join('\n');
  const gone = idx.runs.filter(r => !fs.existsSync(path.join(r.dir, 'run.json'))).length;
  for (const r of idx.runs.slice(0, 12)) L.push(`  ${r.worst.padEnd(13)} ${r.kind.padEnd(8)} ${String(r.name).slice(0, 46).padEnd(46)} ${r.dir.replace(os.homedir(), '~')}`);
  if (idx.runs.length > 12) L.push(`  … ${idx.runs.length - 12} more`);
  if (gone) L.push('', `  ${gone} run${gone > 1 ? 's are' : ' is'} listed but no longer on disk: the index points, it does not keep a copy.`);
  return L.join('\n');
}

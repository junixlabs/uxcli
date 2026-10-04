// uxcli studio: the board. Reads everything under .uxcli/ (journeys, mockups and picks, the last walks,
// their experience, versions, understanding) plus the shipped library, and writes one page,
// .uxcli/studio/index.html. `--serve` serves it on localhost, refetching when a file changes, and takes
// the two decisions a person makes there — a pick or a redraw request — through the same parsers the
// files are read with, creating only. `--shot` photographs the board for an agent to look at.
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http'; import { execFileSync } from 'node:child_process';
import { findRoot, loadProject } from './journey.js';
import { allRuns, UXCLI } from './adapters/store/runs.js';
import { discover, mockups as photograph } from './mockups.js';
import { mapModel } from './core/map.js';
import { studioModel, studioCard } from './core/studio.js';
import { appPage, pageData } from './core/app-page.js';
import { serveFile } from './adapters/serve-file.js';
import { experience, journeyName } from './core/experience.js';
import { versions as listVersions } from './version.js';
import { library } from './lens.js';
import { templates } from './template.js';
import { reviewSummary, summaryLine } from './core/model/lens.js';
import { parsePick, parseRevise, screenStatus } from './core/mockups.js';

const VERSION = JSON.parse(fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'package.json'), 'utf8')).version;
const rel = (from, to) => path.relative(from, to).split(path.sep).join('/');
const readJson = f => JSON.parse(fs.readFileSync(f, 'utf8'));
export const studioDir = root => path.join(root, UXCLI, 'studio');

const shotIn = (dir, name) => { if (!name) return null; for (const f of [path.join(dir, 'artifacts', name), path.join(dir, name)]) if (fs.existsSync(f)) return f; return null; };

// Everything the board shows, read fresh. `shoot` photographs mockups whose pictures are missing or stale.
export async function buildStudio(from, { viewport = '390x844', shoot = true, serve = false } = {}) {
  const root = findRoot(from); if (!root) return { problems: ['no .uxcli/policy/policy.json here or above — uxcli init --apply --origin=<url> first'] };
  const out = studioDir(root); const P = loadProject(root);
  const D = discover(root); const shotsDir = path.join(D.base, '.shots');
  const stale = D.screens.some(s => s.variants.some(v => { const png = path.join(shotsDir, s.id, `${v}.png`); return !fs.existsSync(png) || fs.statSync(png).mtimeMs < fs.statSync(path.join(s.dir, `${v}.html`)).mtimeMs; }));
  if (shoot && stale) { try { await photograph(root, { viewport }); } catch {} }
  const screens = D.screens.map(s => ({
    id: s.id, status: screenStatus(s), question: s.about?.question || null,
    pick: s.pick ? { pick: s.pick.pick, parts: s.pick.parts, by: s.pick.by, note: s.pick.note, when: s.pick.when } : null,
    revise: s.revise ? { note: s.revise.note, answered: s.revise.answered, by: s.revise.by } : null,
    variants: s.variants.map(v => { const png = path.join(shotsDir, s.id, `${v}.png`); return { name: v, shot: fs.existsSync(png) ? rel(out, png) : null, about: s.about?.variants?.[v] || null, reviews: (s.reviews[v] || []).filter(r => r.value).map(r => ({ lens: r.lens, line: summaryLine(reviewSummary(r.value)) })) }; }),
  }));
  // the newest walk of each journey, for map's model; the experience of it; the walks versions name
  const runs = {}; const newest = {};
  const packets = allRuns(root);
  for (const x of packets) { const id = journeyName(x.run); if (!id || !Array.isArray(x.run.steps)) continue; if (!runs[id]) { runs[id] = { run: x.run, base: rel(out, x.at) }; newest[id] = x; } }
  const mocks = Object.fromEntries(D.screens.map(s => [s.id, { pick: s.pick?.pick || null, variants: s.variants, shots: Object.fromEntries(s.variants.filter(v => fs.existsSync(path.join(shotsDir, s.id, `${v}.png`))).map(v => [v, rel(out, path.join(shotsDir, s.id, `${v}.png`))])) }]));
  const map = mapModel({ project: P.project, journeys: P.journeys.map(j => j.value).filter(Boolean), commitments: P.commitments.map(c => c.value).filter(Boolean), actors: (P.actors || []).map(a => a.value).filter(Boolean), insights: (P.insights || []).map(i => i.value).filter(Boolean), runs, mockups: mocks, version: VERSION });
  // map links a shot only when the packet lists it in evidence; the studio takes the step's own shots
  for (const j of map.journeys) { const x = newest[j.id]; if (!x) continue; for (const w of j.workflows) for (const s of w.steps) { const rs = x.run.steps.find(r => r.id === s.id && (r.workflow === w.id || r.workflow == null)); if (!rs) continue; const b = shotIn(x.at, (rs.shots || []).find(f => f.includes('-before')) || rs.shots?.[0]); const a = shotIn(x.at, (rs.shots || []).find(f => f.includes('-after')) || rs.shots?.[1]); if (b) s.before.shot = rel(out, b); if (a) s.after.shot = rel(out, a); } }
  map.generatedAt = new Date().toISOString();
  const experiences = Object.fromEntries(Object.entries(newest).map(([id, x]) => [id, experience(x.run)]));
  const versions = {};
  for (const v of listVersions(root).filter(v => v.value)) {
    const dir = path.join(root, UXCLI, v.value.run); const f = path.join(dir, 'run.json'); if (!fs.existsSync(f)) continue;
    const run = readJson(f); const shots = {};
    for (const s of run.steps || []) { const a = shotIn(dir, (s.shots || []).find(x => x.includes('-after')) || s.shots?.[s.shots.length - 1]); if (a) shots[`${s.workflow || ''}/${s.id}`] = rel(out, a); }
    (versions[v.value.journey] ||= []).push({ ...v.value, report: experience(run), shots });
  }
  // walkthroughs that stand, of each journey's newest walk
  const walkthroughs = {};
  try { const { checkWalkthroughs } = await import('./walkthrough.js'); for (const x of checkWalkthroughs(root).items) { if (x.problems.length) continue; const doc = readJson(x.file); const nw = newest[doc.journey]; if (!nw || `runs/${path.basename(nw.at)}` !== doc.run) continue; (walkthroughs[doc.journey] ||= []).push(...x.findings.map(f => ({ ...f, as: doc.as || null }))); } } catch {}
  const lib = library(); const tpl = templates();
  const m = studioModel({ map, screens, experiences, versions, walkthroughs, actors: (P.actors || []).map(a => a.value).filter(Boolean), insights: (P.insights || []).map(i => i.value).filter(Boolean), lenses: lib.lenses, templates: tpl.list, viewport: Object.values(runs)[0]?.run?.viewport || viewport, serve });
  // what it read on the way, so a reader that wants more (the dashboard's gather) does not read it again
  return { root, out, model: m, problems: P.problems, project: P, discovered: D, packets };
}

// The page: everything the board shows plus the screens, runs and people, in the one surface every uxcli
// page now is (src/core/app-page.js). Served, it carries the decisions and refreshes when a file changes.
export async function studioData(from, opts = {}) {
  const { gather } = await import('./dashboard.js');
  return gather(from, opts);
}
export async function writeStudio(from, opts = {}) {
  const g = await studioData(from, { shoot: true, ...opts }); if (!g.model) return g;
  const out = studioDir(g.root); fs.mkdirSync(out, { recursive: true });
  const page = path.join(out, 'index.html'); fs.writeFileSync(page, appPage(g, { asset: '../', serve: !!opts.serve, live: !!opts.serve }));
  return { root: g.root, out, model: g.model, problems: g.problems, page };
}

export { studioCard };

// A picture of the board, for an agent that can look: the page opened in Chrome, fitted, photographed.
export async function shootStudio(page, file, { width = 1600, height = 1000 } = {}) {
  const { launch } = await import('./browser.js');
  const browser = await launch(); try {
    const p = await browser.newPage({ viewport: { width, height } });
    await p.goto('file://' + path.resolve(page)); await p.waitForTimeout(300);
    await p.evaluate(() => { const b = document.getElementById('zfit'); if (b) b.click(); }); await p.waitForTimeout(500);
    fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true }); await p.screenshot({ path: file });
  } finally { await browser.close(); }
  return file;
}

const by = root => { try { const n = execFileSync('git', ['config', 'user.name'], { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); if (n) return { type: 'person', ref: n }; } catch {} return { type: 'person', ref: 'studio' }; };

// The two writes a person makes from the board. Each goes through the parser the file is read with,
// and neither overwrites: a screen already picked is changed by deleting its pick.json, on purpose.
export function decide(root, kind, body, who = by(root)) {
  if (kind === 'note') {
    // A note on a built frame: a redesign proposal, citing the walk the frame came from.
    const note = String(body?.note || '').trim(); if (!note) return { ok: false, problems: ['note is empty: say what should change for the person'] };
    if (!body.journey || !body.step) return { ok: false, problems: ['a note names the journey and the step it is about'] };
    const walk = allRuns(root).find(x => journeyName(x.run) === body.journey && (x.run.steps || []).some(st => st.id === body.step));
    const dir = path.join(root, UXCLI, 'proposals'); fs.mkdirSync(dir, { recursive: true });
    const n = Math.max(0, ...fs.readdirSync(dir).map(f => /^P-(\d+)\.json$/.exec(f)).filter(Boolean).map(m => +m[1])) + 1;
    const id = `P-${String(n).padStart(4, '0')}`;
    const report = walk ? experience(walk.run) : null;
    const here = (report?.findings || []).filter(f => f.step === body.step && (!body.workflow || f.workflow === body.workflow || f.workflow == null));
    const doc = { id, kind: 'redesign', proposedBy: { ...who, at: new Date().toISOString() }, target: `journeys/${body.journey}.json#${body.step}`, statement: note,
      evidence: walk ? [{ run: `runs/${path.basename(walk.at)}`, what: `the walk at ${body.workflow ? body.workflow + '/' : ''}${body.step}${here.length ? ': ' + here.map(f => f.what).join('; ') : ''}` }] : [{ what: 'noted on the studio board before the step was walked' }],
      status: 'proposed', note: 'Written from the studio board. The agent answers it with a redraw and a new version.' };
    const f = path.join(dir, `${id}.json`); fs.writeFileSync(f, JSON.stringify(doc, null, 1) + '\n'); return { ok: true, file: rel(root, f) };
  }
  const D = discover(root); const s = D.screens.find(x => x.id === body?.state);
  if (!s) return { ok: false, problems: [`no screen ${body?.state} under .uxcli/mockups/`] };
  const when = new Date().toISOString().slice(0, 10);
  if (kind === 'pick') {
    const doc = { schema_version: 1, pick: body.variant, sha256: s.hashes[body.variant], by: who, ...(body.note && { note: String(body.note) }), when };
    const r = parsePick(doc, s.variants, s.hashes); if (!r.value) return { ok: false, problems: r.problems };
    const f = path.join(s.dir, 'pick.json'); if (fs.existsSync(f)) return { ok: false, problems: ['this screen is already picked; delete its pick.json to choose again'] };
    fs.writeFileSync(f, JSON.stringify(doc, null, 2) + '\n'); return { ok: true, file: rel(root, f) };
  }
  if (kind === 'revise') {
    const doc = { schema_version: 1, note: String(body.note || '').trim(), seen: s.hashes, by: who, when };
    const r = parseRevise(doc, s.variants, s.hashes); if (!r.value) return { ok: false, problems: r.problems };
    if (s.pick) return { ok: false, problems: ['this screen is already picked'] };
    const f = path.join(s.dir, 'revise.json'); if (fs.existsSync(f) && s.revise && !s.revise.answered) return { ok: false, problems: ['a redraw is already asked and not yet answered'] };
    fs.writeFileSync(f, JSON.stringify(doc, null, 2) + '\n'); return { ok: true, file: rel(root, f) };
  }
  return { ok: false, problems: [`unknown decision ${kind}`] };
}

// localhost only. Serves files under the project's .uxcli/ and nothing else.
export async function serveStudio(from, { port = 4317, viewport = '390x844', host = '127.0.0.1' } = {}) {
  const first = await writeStudio(from, { viewport, serve: true }); if (!first.model) return first;
  const root = first.root; const base = path.join(root, UXCLI);
  const clients = new Set(); let timer = null;
  const notify = () => { clearTimeout(timer); timer = setTimeout(async () => { try { await writeStudio(root, { viewport, serve: true, shoot: false }); } catch {} for (const c of clients) c.write('data: change\n\n'); }, 300); };
  try { fs.watch(base, { recursive: true }, (e, f) => { if (f && !String(f).startsWith('studio') && !String(f).includes('.shots')) notify(); }); } catch {}
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (req.method === 'GET' && url.pathname === '/') { res.writeHead(302, { location: '/.uxcli/studio/index.html' }); return res.end(); }
    if (req.method === 'GET' && url.pathname === '/events') { res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' }); res.write('retry: 2000\n\n'); clients.add(res); req.on('close', () => clients.delete(res)); return; }
    if (req.method === 'GET' && url.pathname === '/.uxcli/studio/data.json') {
      const g = await studioData(root, { viewport, serve: true, shoot: false });
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }); return res.end(JSON.stringify(pageData(g, { serve: true, live: true })));
    }
    if (req.method === 'POST' && ['/api/pick', '/api/revise', '/api/note'].includes(url.pathname)) {
      let body = ''; for await (const c of req) { body += c; if (body.length > 100000) break; }
      let r; try { r = decide(root, url.pathname.slice(5), JSON.parse(body)); } catch (e) { r = { ok: false, problems: [e.message] }; }
      res.writeHead(r.ok ? 200 : 400, { 'content-type': 'application/json' }); res.end(JSON.stringify(r)); if (r.ok) notify(); return;
    }
    if (req.method !== 'GET') { res.writeHead(405); return res.end(); }
    if (!url.pathname.startsWith('/.uxcli/')) { res.writeHead(404); return res.end('not found'); }
    serveFile(res, base, url.pathname.slice('/.uxcli/'.length));
  });
  await new Promise((ok, no) => { server.once('error', no); server.listen(port, host, ok); });
  return { ...first, server, url: `http://${host}:${server.address().port}/` };
}

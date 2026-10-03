// uxcli dashboard: the management view of one or more projects, read-only. For each folder it reads
// what is under .uxcli/ — through the studio's reader, which already gathers journeys, drawings, walks,
// experience, versions and walkthroughs — and the files the studio does not carry (commitments,
// proposals, the actors' unknowns, the insights' checks). Four views: the coverage matrix, the runs,
// the design, the understanding. Written once (.uxcli/dashboard/) or served for several folders.
// Nothing here writes a declaration: decisions stay in the studio and in the files.
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http';
import { findRoot, loadProject } from './journey.js';
import { allRuns, UXCLI } from './adapters/store/runs.js';
import { buildStudio } from './studio.js';
import { discover } from './mockups.js';
import { experience, journeyName } from './core/experience.js';
import { dashboardModel } from './core/dashboard.js';
import { dashboardPage, VIEWS } from './core/dashboard-page.js';
import { reviewSummary, summaryLine } from './core/model/lens.js';
import { screenStatus } from './core/mockups.js';

const readJson = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
const rel = (root, f) => path.relative(path.join(root, UXCLI), f).split(path.sep).join('/');
export const dashboardDir = root => path.join(root, UXCLI, 'dashboard');

const shotOf = (root, dir, name) => { if (!name) return null; for (const f of [path.join(dir, 'artifacts', name), path.join(dir, name)]) if (fs.existsSync(f)) return rel(root, f); return null; };

// Everything the four views show for one folder. Paths are relative to the folder's .uxcli/.
export async function gather(from) {
  const root = findRoot(path.resolve(from)); if (!root) return { problems: [`${from}: no .uxcli/policy/policy.json here or above — uxcli init --apply there first`] };
  const P = loadProject(root);
  const S = await buildStudio(root, { shoot: false });
  const pd = path.join(root, UXCLI, 'proposals');
  const proposals = fs.existsSync(pd) ? fs.readdirSync(pd).filter(f => f.endsWith('.json')).map(f => readJson(path.join(pd, f))).filter(Boolean) : [];
  const actors = P.actors.map(a => a.value).filter(Boolean); const insights = P.insights.map(i => i.value).filter(Boolean);

  const runs = allRuns(root).map(x => {
    const r = x.run; const journey = journeyName(r); const isWalk = Array.isArray(r.steps);
    const ex = isWalk ? (() => { try { return experience(r); } catch { return null; } })() : null;
    const verdicts = (r.verdicts || []).filter(v => v.value !== 'pass').map(v => ({ value: v.value, commitment: v.commitment || null, step: v.where || v.step || null, what: v.what || v.cause || '' }));
    const probes = (r.probes || []).map(p => ({ probe: p.probe, verdict: p.verdict, why: p.why || p.cite?.what || '' }));
    const steps = isWalk ? r.steps.filter(s => s.kind !== 'fixture').map(s => {
      const m = ex?.steps?.find(y => y.id === s.id && (y.workflow ?? null) === (s.workflow ?? null));
      return { id: s.id, workflow: s.workflow || null, action: s.action || '', held: s.after?.held ?? null, state: s.after?.state || null,
        before: shotOf(root, x.at, (s.shots || []).find(f => f.includes('-before'))), after: shotOf(root, x.at, (s.shots || []).find(f => f.includes('-after'))),
        klm: m?.klmSeconds ?? null, findings: (ex?.findings || []).filter(f => f.step === s.id).map(f => f.what) };
    }) : [];
    const worst = r.status === 'blocked' ? 'blocked' : verdicts.some(v => v.value === 'fail') || probes.some(p => p.verdict === 'fail') ? 'fail' : verdicts.length || probes.some(p => p.verdict === 'finding') ? 'finding' : 'pass';
    return { id: path.basename(x.at), when: r.ranAt || r.at || null, target: journey || r.url || r.target || '?', kind: isWalk ? 'journey' : 'page', viewport: r.viewport || null, environment: r.environment || null,
      status: r.status || null, exit: r.exit ?? null, worst, blocked: r.blocked?.reason || null, verdicts, probes, steps, klm: ex?.workflows?.[0]?.totals?.klmSeconds ?? null };
  });

  const lastRuns = {}; for (const r of runs) if (!lastRuns[r.target]) lastRuns[r.target] = { when: r.when, worst: r.worst };
  const matrix = dashboardModel({ studio: S.model, journeys: P.journeys.map(j => j.value).filter(Boolean), commitments: P.commitments.map(c => c.value).filter(Boolean), proposals, actors, lastRuns, folder: path.relative(process.cwd(), root) || '.' });
  const D = discover(root); const shots = path.join(D.base, '.shots');
  const design = D.screens.map(s => ({
    state: s.id, question: s.about?.question || null, status: screenStatus(s), pick: s.pick?.pick || null, pickedBy: s.pick?.by?.ref || null,
    revise: s.revise && !s.revise.answered ? s.revise.note : null, journeys: s.journeys || [],
    variants: s.variants.map(v => ({ name: v, about: s.about?.variants?.[v] || null, shot: fs.existsSync(path.join(shots, s.id, `${v}.png`)) ? rel(root, path.join(shots, s.id, `${v}.png`)) : null,
      reviews: (s.reviews[v] || []).map(r => ({ lens: r.lens, line: r.value ? summaryLine(reviewSummary(r.value)) : `refused: ${r.problems[0] || ''}` })) })),
  }));

  return { root, matrix, runs, design, understanding: { actors, insights, template: readJson(path.join(root, UXCLI, 'template.json'))?.template || null }, problems: P.problems };
}

// Written once, for one folder: one HTML file per view under .uxcli/dashboard/, linking each other.
export async function writeDashboard(from) {
  const g = await gather(from); if (!g.matrix) return g;
  const out = dashboardDir(g.root); fs.mkdirSync(out, { recursive: true });
  for (const v of VIEWS) fs.writeFileSync(path.join(out, `${v.id}.html`), dashboardPage({ data: g, folders: [g.matrix.folder], view: v.id, link: (view, q = '') => `${view}.html${q}`, asset: p => `../${p}` }));
  fs.writeFileSync(path.join(out, 'index.html'), dashboardPage({ data: g, folders: [g.matrix.folder], view: 'overview', link: (view, q = '') => `${view}.html${q}`, asset: p => `../${p}` }));
  return { ...g, page: path.join(out, 'index.html') };
}

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

// Served, for several folders: ?p=<folder> &v=<view> (&run=<id> on the runs view). Pictures come from
// /f/<folder>/<path under .uxcli/> and nothing outside it. A folder is added by posting its path; it
// must hold a uxcli project. localhost only.
export async function serveDashboard(folders, { port = 4319, host = '127.0.0.1' } = {}) {
  const roots = []; const problems = [];
  for (const f of folders) { const r = findRoot(path.resolve(f)); if (r && !roots.includes(r)) roots.push(r); else if (!r) problems.push(`${f}: no uxcli project`); }
  if (!roots.length) return { problems: problems.length ? problems : ['name at least one folder that holds a uxcli project'] };
  const label = r => path.relative(process.cwd(), r) || '.';
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (req.method === 'POST' && url.pathname === '/api/folders') {
      let body = ''; for await (const c of req) { body += c; if (body.length > 4000) break; }
      const want = new URLSearchParams(body).get('path') || ''; const r = want ? findRoot(path.resolve(want)) : null;
      if (r && !roots.includes(r)) roots.push(r);
      res.writeHead(303, { location: r ? `/?p=${roots.indexOf(r)}` : `/?p=0&missing=${encodeURIComponent(want)}` }); return res.end();
    }
    const m = /^\/f\/(\d+)\/(.+)$/.exec(url.pathname);
    if (req.method === 'GET' && m) {
      const root = roots[+m[1]]; const base = root && path.join(root, UXCLI); const file = base && path.resolve(base, decodeURIComponent(m[2]));
      if (!file || !file.startsWith(base + path.sep) || !MIME[path.extname(file).toLowerCase()] || !fs.existsSync(file)) { res.writeHead(404); return res.end('not found'); }
      res.writeHead(200, { 'content-type': MIME[path.extname(file).toLowerCase()], 'cache-control': 'no-store' }); return fs.createReadStream(file).pipe(res);
    }
    if (req.method !== 'GET' || url.pathname !== '/') { res.writeHead(404); return res.end('not found'); }
    const i = Math.min(roots.length - 1, Math.max(0, Number(url.searchParams.get('p')) || 0)); const view = VIEWS.some(v => v.id === url.searchParams.get('v')) ? url.searchParams.get('v') : 'overview';
    let g; try { g = await gather(roots[i]); } catch (e) { g = { problems: [e.message] }; }
    const missing = url.searchParams.get('missing');
    const page = dashboardPage({ data: g, folders: roots.map(label), current: i, view, run: url.searchParams.get('run'), serve: true,
      link: (v, q = '') => `/?p=${i}&v=${v}${q ? '&' + q.replace(/^\?/, '') : ''}`, asset: p => `/f/${i}/${p}`, notice: missing != null ? `${missing || 'that path'} holds no uxcli project (no .uxcli/policy/policy.json there or above)` : null });
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); res.end(page);
  });
  await new Promise((ok, no) => { server.once('error', no); server.listen(port, host, ok); });
  return { roots, server, url: `http://${host}:${server.address().port}/`, problems };
}

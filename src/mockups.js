// uxcli mockups: photograph every variant of every screen the journeys name, find the hook each step
// leaves from inside the picked variant, and write one page — the journeys as flows of the picked
// mockups, then each screen's variants side by side with the status the pick gives them.
// in:  .uxcli/mockups/<state>/<variant>.html, .uxcli/mockups/<state>/pick.json, .uxcli/journeys/
// out: .uxcli/mockups/index.html, .uxcli/mockups/.shots/<state>/<variant>.png; the card on stdout
import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
import { findRoot, loadProject } from './journey.js';
import { launch } from './browser.js';
import { observe } from './adapters/chrome/index.js';
import { parsePick, statusOf, screensOf, hookOf, mockupsCard } from './core/mockups.js';
import { esc, flowRow, galleryHtml, WIREFLOW_CSS } from './core/wireflow.js';

const listVariants = dir => fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.html') && f !== 'index.html').map(f => f.replace(/\.html$/, '')).sort() : [];

export function discover(root) {
  const P = loadProject(root); const base = path.join(root, '.uxcli', 'mockups');
  const journeys = P.journeys.map(j => j.value).filter(Boolean);
  const screens = screensOf(journeys).map(s => {
    const dir = path.join(base, s.id); const variants = listVariants(dir); let pick = null; const problems = [];
    const pf = path.join(dir, 'pick.json');
    if (fs.existsSync(pf)) { let doc; try { doc = JSON.parse(fs.readFileSync(pf, 'utf8')); } catch (e) { problems.push(`not JSON: ${e.message}`); } if (doc) { const r = parsePick(doc, variants); pick = r.value; problems.push(...r.problems); } }
    return { ...s, dir, variants, pick, problems };
  });
  return { root, base, project: P, journeys, screens };
}

export async function mockups(from, { viewport = '390x844' } = {}) {
  const root = findRoot(from); const m = discover(root);
  const [vw, vh] = viewport.split('x').map(Number);
  const shotsDir = path.join(m.base, '.shots'); fs.rmSync(shotsDir, { recursive: true, force: true });
  const shots = {}; const rects = {};
  if (m.screens.some(s => s.variants.length)) {
    const browser = await launch();
    try {
      const context = await browser.newContext({ viewport: { width: vw, height: vh } }); const page = await context.newPage();
      for (const s of m.screens) {
        for (const v of s.variants) {
          await page.goto(pathToFileURL(path.join(s.dir, `${v}.html`)).href, { waitUntil: 'load', timeout: 30000 });
          await page.waitForTimeout(200);
          const hooks = [...new Set(s.leaves.map(l => hookOf(l.target)).filter(Boolean))];
          const obs = await observe(page, { selectors: hooks });
          rects[`${s.id}/${v}`] = Object.fromEntries(hooks.map(h => [h, obs.dom?.[h] || null]));
          fs.mkdirSync(path.join(shotsDir, s.id), { recursive: true });
          await page.screenshot({ path: path.join(shotsDir, s.id, `${v}.png`) });
          shots[`${s.id}/${v}`] = `.shots/${s.id}/${v}.png`;
        }
      }
      await context.close();
    } finally { await browser.close(); }
  }
  for (const s of m.screens) {
    s.hooksMissing = [];
    if (!s.pick) continue;
    for (const l of s.leaves) { const h = hookOf(l.target); if (h && !rects[`${s.id}/${s.pick.pick}`]?.[h]) s.hooksMissing.push({ hook: h, variant: s.pick.pick, action: l.action }); }
  }
  const page = path.join(m.base, 'index.html');
  fs.mkdirSync(m.base, { recursive: true });
  fs.writeFileSync(page, pageHtml(m, { vw, vh, shots, rects }));
  const refused = m.screens.some(s => s.problems.length);
  return { dir: path.relative(process.cwd(), root) || '.', page: path.relative(process.cwd(), page), screens: m.screens.map(s => ({ id: s.id, variants: s.variants, pick: s.pick, problems: s.problems, hooksMissing: s.hooksMissing })), exit: refused ? 1 : 0 };
}

export { mockupsCard };

function pageHtml(m, { vw, vh, shots, rects }) {
  const byId = Object.fromEntries(m.screens.map(s => [s.id, s]));
  const flows = m.journeys.map(j => {
    const rows = (j.workflows || []).filter(w => (w.steps || []).some(s => s.before)).map(w => {
      const steps = w.steps.filter(s => s.kind !== 'fixture' && s.before);
      const ids = [steps[0].before, ...steps.map(s => s.after)];
      const frames = ids.map((id, k) => {
        const s = byId[id]; const acting = steps[k];
        const leave = acting && s ? s.leaves.find(l => l.journey === j.id && l.workflow === w.id && l.step === acting.id) : null; const hook = hookOf(leave?.target);
        const v = s?.pick?.pick || null; const shot = v ? shots[`${id}/${v}`] : null;
        let hot = null;
        if (acting) {
          const r = v && hook ? rects[`${id}/${v}`]?.[hook]?.rect : null;
          if (r) hot = r.y + r.h > vh ? { off: true, target: hook, scrolls: Math.max(1, rects[`${id}/${v}`][hook].scrollsNeeded || 1) } : { x: r.x, y: r.y, w: r.w, h: r.h };
          else hot = { edge: true };
        }
        const missing = !s ? 'not a screen any journey names' : !s.variants.length ? `no mockup yet\n.uxcli/mockups/${id}/<variant>.html` : `no pick yet · ${s.variants.length} variant${s.variants.length === 1 ? '' : 's'}`;
        const note = acting && hook && v && !rects[`${id}/${v}`]?.[hook] ? `hook ${hook} not in ${v}.html` : null;
        return { shot, alt: `${id} · ${v || 'no pick'}`, start: k === 0 ? `${w.id} · ${w.kind || 'workflow'}` : null, title: id, pill: v ? { text: v, tone: 'ok' } : null, missing, hot, note };
      });
      const links = steps.map(st => ({ label: st.id, text: st.action || '', sub: (st.interactions || []).filter(x => x.type === 'navigation' || x.type === 'api').map(x => x.type === 'navigation' ? x.to : x.request).join(' · ') || null }));
      return flowRow({ id: w.id, kind: w.kind, vw, vh, frames, links });
    });
    return `<article class="journey" id="${esc(j.id)}"><h2><code>${esc(j.id)}</code> <span class="sub">${esc(j.goal || '')}</span></h2><div class="flow">${rows.join('')}</div></article>`;
  });
  const galleries = m.screens.map(s => galleryHtml({
    id: `screen-${s.id}`, title: s.id, sub: s.journeys.join(' · '), vw, vh, note: s.pick ? `${s.pick.by.type} ${s.pick.by.ref}${s.pick.when ? ' · ' + s.pick.when : ''}${s.pick.note ? ' — ' + s.pick.note : ''}` : null,
    variants: s.variants.length ? s.variants.map(v => ({ name: v, shot: shots[`${s.id}/${v}`], status: s.problems.length ? 'no-pick' : statusOf(v, s.pick), note: s.pick?.parts?.[v] || null }))
      : [{ name: 'no mockup yet', shot: null, status: 'no-pick', missing: `.uxcli/mockups/${s.id}/<variant>.html` }],
  }));
  const picked = m.screens.filter(s => s.pick).length;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(m.project.project?.name || path.basename(m.root))} mockups</title>
<style>
*,*::before,*::after{box-sizing:border-box}
:root{color-scheme:light;--bg:#f5f4f0;--surface:#fff;--well:#eeede8;--ink:#1d2126;--dim:#666b73;--line:#dcdbd4;--accent:#3b5b8c;--fail:#c2361c;--finding:#9a6300;--pass:#1e7a48;--mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;--sans:-apple-system,"Segoe UI",Helvetica,Arial,sans-serif}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){color-scheme:dark;--bg:#14171b;--surface:#1c2025;--well:#22272d;--ink:#ebe9e3;--dim:#9a9d96;--line:#2f353c;--accent:#8fb0e0;--fail:#ff6b4d;--finding:#e3b23a;--pass:#5fd38a}}
:root[data-theme="dark"]{color-scheme:dark;--bg:#14171b;--surface:#1c2025;--well:#22272d;--ink:#ebe9e3;--dim:#9a9d96;--line:#2f353c;--accent:#8fb0e0;--fail:#ff6b4d;--finding:#e3b23a;--pass:#5fd38a}
html{background:var(--bg)}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 var(--sans);padding-block:28px 72px;padding-inline:clamp(16px,2.5vw,40px)}
main{max-width:none;margin:0;display:grid;gap:28px}
a{color:var(--accent)}
code{font:.92em var(--mono)}
.head h1{margin:0;font:700 20px/1.3 var(--sans)}
.head h1 span{font:14px var(--sans);color:var(--dim);margin-left:8px}
.head .keys{margin:2px 0 0;font:13px var(--sans);color:var(--dim)}
.head .keys b{font-weight:600}
.head .keys .k-pick{color:var(--pass)}.head .keys .k-part{color:var(--finding)}
.head nav{display:flex;flex-wrap:wrap;gap:12px;margin-top:8px;font:13px var(--mono)}
.journey{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:18px 22px;display:grid;gap:10px}
.journey h2{margin:0;font:600 16px/1.3 var(--sans)}
.sub{font:12px var(--mono);color:var(--dim)}
.gallery{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:18px 22px}
${WIREFLOW_CSS}
</style>
</head>
<body>
<main>
<header class="head">
  <h1>${esc(m.project.project?.name || path.basename(m.root))} mockups <span>${vw}×${vh} · ${m.screens.length} screens · ${picked} picked</span></h1>
  <p class="keys"><b class="k-pick">green</b> = picked · <b class="k-part">amber</b> = part of a pick · grey = not taken</p>
  <nav>${m.journeys.map(j => `<a href="#${esc(j.id)}">${esc(j.id)}</a>`).join('')}${m.screens.map(s => `<a href="#screen-${esc(s.id)}">${esc(s.id)}</a>`).join('')}</nav>
</header>
${flows.join('\n')}
${galleries.join('\n')}
<footer class="sub">uxcli mockups · a person picks in .uxcli/mockups/&lt;state&gt;/pick.json · the picked variant is what gets built</footer>
</main>
</body>
</html>
`;
}

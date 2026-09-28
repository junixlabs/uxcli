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
        return { shot, alt: `${id} · ${v || 'no pick'}`, title: id, pill: v ? { text: v, tone: 'ok' } : null, missing, hot, note };
      });
      const links = steps.map(st => ({ label: st.id, text: st.action || '', sub: (st.interactions || []).filter(x => x.type === 'navigation' || x.type === 'api').map(x => x.type === 'navigation' ? x.to : x.request).join(' · ') || null }));
      return flowRow({ id: w.id, kind: w.kind, vw, vh, frames, links });
    });
    return `<article class="journey" id="${esc(j.id)}"><h2>${esc(j.id)}<span class="goal">${esc(j.goal || '')}</span></h2><div class="flow">${rows.join('')}</div></article>`;
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
:root{color-scheme:light;--bg:#eef0f3;--canvas:#f6f7f9;--dot:#d3d7dd;--surface:#fff;--well:#eaedf1;--ink:#16191d;--dim:#5f6670;--line:#d6dae0;--line-soft:#e6e9ed;--accent:#4f46e5;--accent-soft:#e6e4fb;--fail:#d3381c;--fail-soft:#fbe4df;--finding:#a56400;--finding-soft:#fbeccc;--pass:#178a4c;--pass-soft:#dcf3e5;--mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;--sans:-apple-system,"Segoe UI",Inter,Helvetica,Arial,sans-serif}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){color-scheme:dark;--bg:#0f1114;--canvas:#16191e;--dot:#2c313a;--surface:#1b1f25;--well:#252a32;--ink:#e9ebee;--dim:#98a0ab;--line:#2f353e;--line-soft:#262b33;--accent:#8b83ff;--accent-soft:#2a2850;--fail:#ff6b4d;--fail-soft:#4a221a;--finding:#e3b23a;--finding-soft:#4a3a12;--pass:#4ecb7f;--pass-soft:#173a26}}
:root[data-theme="dark"]{color-scheme:dark;--bg:#0f1114;--canvas:#16191e;--dot:#2c313a;--surface:#1b1f25;--well:#252a32;--ink:#e9ebee;--dim:#98a0ab;--line:#2f353e;--line-soft:#262b33;--accent:#8b83ff;--accent-soft:#2a2850;--fail:#ff6b4d;--fail-soft:#4a221a;--finding:#e3b23a;--finding-soft:#4a3a12;--pass:#4ecb7f;--pass-soft:#173a26}
html{background:var(--bg)}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 var(--sans);padding:0 0 80px}
a{color:var(--accent)}
code{font:.92em var(--mono)}
.top{position:sticky;top:0;z-index:10;background:var(--surface);border-bottom:1px solid var(--line);padding:14px clamp(16px,2.5vw,40px);display:flex;align-items:center;gap:18px;flex-wrap:wrap}
.top h1{margin:0;font:700 17px/1.2 var(--sans);letter-spacing:-.01em}
.top .meta{display:flex;gap:8px;flex-wrap:wrap}
.chip{font:600 11px/1 var(--mono);padding:6px 9px;border-radius:999px;background:var(--well);color:var(--dim)}
.chip b{color:var(--ink)}
.keys{margin-left:auto;display:flex;gap:14px;font:12px var(--sans);color:var(--dim)}
.keys i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;vertical-align:-1px;background:var(--line)}
.keys .k-pick i{background:var(--pass)}.keys .k-part i{background:var(--finding)}
.tabs{position:sticky;top:57px;z-index:9;background:var(--bg);border-bottom:1px solid var(--line);padding:0 clamp(16px,2.5vw,40px);display:flex;gap:4px;overflow-x:auto}
.tabs a{padding:12px 12px;font:600 12px var(--mono);color:var(--dim);text-decoration:none;border-bottom:2px solid transparent;white-space:nowrap}
.tabs a:hover{color:var(--ink)}
.tabs .sep{align-self:center;width:1px;height:18px;background:var(--line);margin:0 8px}
main{display:grid;gap:36px;padding:28px clamp(16px,2.5vw,40px) 0}
h2.sec{margin:0;font:600 12px/1 var(--sans);letter-spacing:.1em;text-transform:uppercase;color:var(--dim)}
.journey{display:grid;gap:14px}
.journey h2{margin:0;display:flex;align-items:baseline;gap:12px;font:700 20px/1.2 var(--sans);letter-spacing:-.01em}
.journey h2 .goal{font:14px var(--sans);color:var(--dim);font-weight:400}
.sub{font:12px var(--mono);color:var(--dim)}
.gallery{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:20px 22px}
footer{padding:36px clamp(16px,2.5vw,40px) 0;font:12px var(--mono);color:var(--dim)}
${WIREFLOW_CSS}
</style>
</head>
<body>
<header class="top">
  <h1>${esc(m.project.project?.name || path.basename(m.root))}</h1>
  <div class="meta"><span class="chip">${vw}×${vh}</span><span class="chip"><b>${m.screens.length}</b> screens</span><span class="chip"><b>${m.screens.filter(s => s.variants.length).length}</b> drawn</span><span class="chip"><b>${picked}</b> picked</span></div>
  <div class="keys"><span class="k-pick"><i></i>picked</span><span class="k-part"><i></i>part of a pick</span><span><i></i>not taken</span></div>
</header>
<nav class="tabs">${m.journeys.map(j => `<a href="#${esc(j.id)}">${esc(j.id)}</a>`).join('')}<span class="sep"></span>${m.screens.map(s => `<a href="#screen-${esc(s.id)}">${esc(s.id)}</a>`).join('')}</nav>
<main>
<h2 class="sec">Journeys · the picked variants as a flow</h2>
${flows.join('\n')}
<h2 class="sec">Screens · every variant, side by side</h2>
${galleries.join('\n')}
</main>
<footer>uxcli mockups · a person picks in .uxcli/mockups/&lt;state&gt;/pick.json · the picked variant is what gets built</footer>
</body>
</html>
`;
}

// uxcli mockups: photograph every variant of every screen the journeys name, find the hook each step
// leaves from inside the picked variant, and write one page — the journeys as flows of the picked
// mockups, then each screen's variants side by side with the status the pick gives them.
// in:  .uxcli/mockups/<state>/<variant>.html, .uxcli/mockups/<state>/pick.json, .uxcli/journeys/
// out: .uxcli/mockups/index.html, .uxcli/mockups/.shots/<state>/<variant>.png; the card on stdout
import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
import { findRoot, loadProject } from './journey.js';
import { launch } from './browser.js';
import { observe } from './adapters/chrome/index.js';
import { library, readReview } from './lens.js';
import { reviewSummary, summaryLine } from './core/model/lens.js';
import { parsePick, statusOf, screensOf, hookOf, receiptOf, receiptLine, sharedRefs, drawingHash, mockupsCard } from './core/mockups.js';
import { esc, flowRow, galleryHtml, protoHtml, PROTO_JS, WIREFLOW_CSS } from './core/wireflow.js';

const listVariants = dir => fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.html') && f !== 'index.html').map(f => f.replace(/\.html$/, '')).sort() : [];
// <state>/refs/*.png|jpg|webp: pictures someone made of the screen (a style frame, a sketch, a competitor's page). Shown beside the variants, never picked, never hashed.
const listRefs = dir => fs.existsSync(path.join(dir, 'refs')) ? fs.readdirSync(path.join(dir, 'refs')).filter(f => /\.(png|jpe?g|webp)$/i.test(f)).sort() : [];

export function discover(root) {
  const P = loadProject(root); const base = path.join(root, '.uxcli', 'mockups');
  const journeys = P.journeys.map(j => j.value).filter(Boolean);
  const sharedDir = path.join(base, '_shared');
  const shared = fs.existsSync(sharedDir) ? Object.fromEntries(fs.readdirSync(sharedDir).filter(f => f.endsWith('.css')).sort().map(f => [f, fs.readFileSync(path.join(sharedDir, f), 'utf8')])) : {};
  const lib = library();
  const screens = screensOf(journeys).map(s => {
    const dir = path.join(base, s.id); const variants = listVariants(dir); let pick = null; const problems = [];
    // the hash covers the drawing and what it takes from _shared: a token change is a drawing change
    const hashes = Object.fromEntries(variants.map(v => { const html = fs.readFileSync(path.join(dir, `${v}.html`)); return [v, drawingHash([html, ...sharedRefs(html.toString()).filter(f => shared[f] !== undefined).map(f => shared[f])])]; }));
    const pf = path.join(dir, 'pick.json');
    if (fs.existsSync(pf)) { let doc; try { doc = JSON.parse(fs.readFileSync(pf, 'utf8')); } catch (e) { problems.push(`not JSON: ${e.message}`); } if (doc) { const r = parsePick(doc, variants, hashes); pick = r.value; problems.push(...r.problems); } }
    // <variant>.<lens>.review.json: a lens read against the drawing, shown as the reviewer's claim
    const reviews = {};
    for (const v of variants) for (const f of (fs.existsSync(dir) ? fs.readdirSync(dir) : []).filter(f => f.startsWith(`${v}.`) && f.endsWith('.review.json'))) {
      const r = readReview(root, path.join(dir, f), lib); (reviews[v] ||= []).push({ lens: f.slice(v.length + 1, -'.review.json'.length), value: r.value, problems: r.problems });
    }
    return { ...s, dir, variants, refs: listRefs(dir), hashes, pick, reviews, problems };
  });
  return { root, base, project: P, journeys, screens, shared };
}

// viewport: 'WxH' or 'WxH,WxH,…'. The first is the one the flow, the hooks and the pins are read at;
// each further one adds a picture of every variant beside the first (<variant>@WxH.png).
export async function mockups(from, { viewport = '390x844' } = {}) {
  const root = findRoot(from); const m = discover(root);
  const sizes = viewport.split(',').map(v => v.trim().split('x').map(Number)).filter(([w, h]) => w > 0 && h > 0);
  if (!sizes.length) throw new Error(`--viewport=WxH[,WxH…], not "${viewport}"`);
  const [vw, vh] = sizes[0]; const more = sizes.slice(1);
  const shotsDir = path.join(m.base, '.shots'); fs.rmSync(shotsDir, { recursive: true, force: true });
  const shots = {}; const rects = {}; const receipts = {}; const pins = {}; const extra = {};
  if (m.screens.some(s => s.variants.length)) {
    const browser = await launch();
    try {
      const context = await browser.newContext({ viewport: { width: vw, height: vh } }); const page = await context.newPage();
      for (const s of m.screens) {
        for (const v of s.variants) {
          await page.goto(pathToFileURL(path.join(s.dir, `${v}.html`)).href, { waitUntil: 'load', timeout: 30000 });
          await page.waitForTimeout(200);
          const hooks = [...new Set([...s.hooks, ...s.leaves.map(l => hookOf(l.target)).filter(Boolean)])];
          const obs = await observe(page, { selectors: hooks });
          rects[`${s.id}/${v}`] = Object.fromEntries(hooks.map(h => [h, obs.dom?.[h] || null]));
          receipts[`${s.id}/${v}`] = receiptOf({ html: fs.readFileSync(path.join(s.dir, `${v}.html`), 'utf8'), wanted: hooks, found: hooks.filter(h => obs.dom?.[h]), shared: m.shared });
          pins[`${s.id}/${v}`] = await page.$$eval('[data-uxcli-note]', els => els.map(e => { const r = e.getBoundingClientRect(); return { text: e.getAttribute('data-uxcli-note') || '', x: r.x, y: r.y, w: r.width, h: r.height }; }));
          fs.mkdirSync(path.join(shotsDir, s.id), { recursive: true });
          await page.screenshot({ path: path.join(shotsDir, s.id, `${v}.png`) });
          shots[`${s.id}/${v}`] = `.shots/${s.id}/${v}.png`;
          extra[`${s.id}/${v}`] = [];
          for (const [w, h] of more) {
            await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(150);
            await page.screenshot({ path: path.join(shotsDir, s.id, `${v}@${w}x${h}.png`) });
            extra[`${s.id}/${v}`].push({ vw: w, vh: h, shot: `.shots/${s.id}/${v}@${w}x${h}.png` });
          }
          if (more.length) await page.setViewportSize({ width: vw, height: vh });
        }
      }
      await context.close();
    } finally { await browser.close(); }
  }
  for (const s of m.screens) {
    s.receipts = Object.fromEntries(s.variants.map(v => [v, receipts[`${s.id}/${v}`]]).filter(([, r]) => r));
    // a pick over a drawing that fails its receipt is refused, like a delivery that fails validation
    if (s.pick && s.receipts[s.pick.pick] && !s.receipts[s.pick.pick].ok) { s.problems.push(`picked ${s.pick.pick} fails its receipt: ${s.receipts[s.pick.pick].problems.join('; ')}`); s.pick = null; }
  }
  const page = path.join(m.base, 'index.html');
  fs.mkdirSync(m.base, { recursive: true });
  fs.writeFileSync(page, pageHtml(m, { vw, vh, sizes, shots, rects, pins, extra }));
  const refused = m.screens.some(s => s.problems.length);
  return { dir: path.relative(process.cwd(), root) || '.', page: path.relative(process.cwd(), page), viewports: sizes.map(([w, h]) => `${w}x${h}`), screens: m.screens.map(s => ({ id: s.id, variants: s.variants, hashes: s.hashes, pick: s.pick, problems: s.problems, receipts: s.receipts })), exit: refused ? 1 : 0 };
}

export { mockupsCard };

function pageHtml(m, { vw, vh, sizes = [[vw, vh]], shots, rects, pins = {}, extra = {} }) {
  const byId = Object.fromEntries(m.screens.map(s => [s.id, s])); const proto = {}; const hashes = {};
  const hooksOf = key => Object.entries(rects[key] || {}).filter(([, d]) => d?.rect).map(([sel, d]) => ({ sel, x: d.rect.x, y: d.rect.y, w: d.rect.w, h: d.rect.h }));
  for (const s of m.screens) for (const v of s.variants) {
    hashes[`${s.id}/${v}`] = s.hashes?.[v];
    proto[`view:${s.id}/${v}`] = { vw, vh, frames: [{ shot: shots[`${s.id}/${v}`] || null, title: `${s.id} · ${v}`, missing: shots[`${s.id}/${v}`] ? null : 'no picture', pins: pins[`${s.id}/${v}`] || [], hooks: hooksOf(`${s.id}/${v}`), pick: `${s.id}/${v}` }], links: [] };
  }
  // the screens in the order a reader meets them, numbered by the journey that first names them
  const numbered = new Map(); const order = [];
  m.journeys.forEach((j, ji) => { let k = 0; for (const w of j.workflows || []) for (const st of w.steps || []) { if (st.kind === 'fixture' || !st.before) continue; for (const id of [st.before, st.after]) if (id && !numbered.has(id)) { numbered.set(id, { n: `${ji + 1}.${++k}`, journey: j.id, action: null }); order.push(id); } if (numbered.get(st.before) && !numbered.get(st.before).action) numbered.get(st.before).action = st.action || null; } });
  for (const s of m.screens) if (!numbered.has(s.id)) { numbered.set(s.id, { n: '', journey: s.journeys[0] || '', action: null }); order.push(s.id); }
  const flows = m.journeys.map(j => {
    const lanes = [];
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
        const candidates = !v && s ? s.variants.map(c => ({ name: c, shot: shots[`${id}/${c}`] || null, view: shots[`${id}/${c}`] ? `view:${id}/${c}` : null })) : [];
        return { shot, alt: `${id} · ${v || 'no pick'}`, title: `${numbered.get(id)?.n || ''} ${id}`.trim(), pill: v ? { text: v, tone: 'ok' } : null, missing, hot, note, pins: v ? pins[`${id}/${v}`] || [] : [], hooks: v ? hooksOf(`${id}/${v}`) : [], candidates, view: v ? `view:${id}/${v}` : null };
      });
      const links = steps.map(st => ({ label: st.id, text: st.action || '', sub: (st.interactions || []).filter(x => x.type === 'navigation' || x.type === 'api').map(x => x.type === 'navigation' ? x.to : x.request).join(' · ') || null }));
      const play = `${j.id}/${w.id}`; const pf = frames.map(f => ({ shot: f.shot, title: f.title, missing: f.shot ? null : f.missing, hot: f.hot, pins: f.pins, hooks: f.hooks }));
      proto[play] = { vw, vh, frames: pf, links }; lanes.push({ id: w.id, frames: pf, links });
      return flowRow({ id: w.id, kind: w.kind, vw, vh, frames, links, play });
    });
    if (lanes.length) proto[`journey:${j.id}`] = { vw, vh, frames: lanes.flatMap((l, i) => l.frames.map((f, k) => k === l.frames.length - 1 && lanes[i + 1] ? { ...f, hot: { edge: true, lane: lanes[i + 1].id } } : f)), links: lanes.flatMap((l, i) => [...l.links, ...(lanes[i + 1] ? [{ label: lanes[i + 1].id, text: 'next lane' }] : [])]) };
    const mine = order.filter(id => numbered.get(id).journey === j.id);
    const named = [...new Set(m.journeys.find(x => x.id === j.id) ? mine : [])];
    const pickedN = named.filter(id => byId[id]?.pick).length;
    const cards = mine.map(id => card(byId[id]));
    return `<article class="journey" id="${esc(j.id)}" data-journeys="${esc(j.id)}">
      <header class="j-h"><span class="j-n">${m.journeys.indexOf(j) + 1}</span><h2>${esc(j.id)}</h2><span class="goal">${esc(j.goal || '')}</span><span class="j-state ${pickedN === named.length && named.length ? 'done' : ''}">${pickedN}/${named.length} picked</span>${lanes.length > 1 ? `<button class="play" type="button" data-play="journey:${esc(j.id)}">▶ play all</button>` : ''}</header>
      <div class="flow">${rows.join('')}</div>
      <div class="cards">${cards.join('')}</div>
    </article>`;
  });
  function card(s) {
    if (!s) return '';
    const meta = numbered.get(s.id) || {};
    return galleryHtml({
      id: `screen-${s.id}`, n: meta.n, title: s.id, action: meta.action, vw, vh, note: s.problems.length ? `pick.json: ${s.problems.join('; ')}` : null,
      variants: s.variants.length ? s.variants.map(v => ({
        name: v, shot: shots[`${s.id}/${v}`], status: s.problems.length ? 'no-pick' : statusOf(v, s.pick), note: s.pick?.parts?.[v] || null,
        pins: pins[`${s.id}/${v}`] || [], hooks: hooksOf(`${s.id}/${v}`), view: shots[`${s.id}/${v}`] ? `view:${s.id}/${v}` : null, pickId: shots[`${s.id}/${v}`] ? `${s.id}/${v}` : null,
        screens: [{ vw, vh, shot: shots[`${s.id}/${v}`] }, ...(extra[`${s.id}/${v}`] || [])],
        receipt: s.receipts?.[v] ? receiptLine(s.receipts[v]) : null,
        reviews: (s.reviews?.[v] || []).map(r => r.value ? { lens: r.lens, line: summaryLine(reviewSummary(r.value)), breaks: reviewSummary(r.value).breaksList, by: `${r.value.by.type} ${r.value.by.ref}` } : { lens: r.lens, line: `refused: ${r.problems[0]}${r.problems.length > 1 ? ` (+${r.problems.length - 1})` : ''}`, breaks: [], refused: true }),
        sig: s.pick && s.pick.pick === v ? `${s.pick.by.type} ${s.pick.by.ref}${s.pick.when ? ' · ' + s.pick.when : ''} · ${s.pick.sha256.slice(0, 7)}` : null,
      })) : [{ name: 'no mockup yet', shot: null, status: 'no-pick', missing: `.uxcli/mockups/${s.id}/<variant>.html` }],
      refs: (s.refs || []).map(f => { const src = `${s.id}/refs/${f}`; const view = `ref:${s.id}/${f}`; proto[view] = { vw, vh, frames: [{ shot: src, title: `${s.id} · reference · ${f}`, pins: [], hooks: [] }], links: [] }; return { name: f.replace(/\.(png|jpe?g|webp)$/i, ''), src, view }; }),
    }).replace('<section class="gallery', `<section data-journeys="${esc(s.journeys.join(' '))}" class="gallery`);
  }
  const picked = m.screens.filter(s => s.pick).length;
  const name = m.project.project?.name || path.basename(m.root);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(name)} mockups</title>
<style>
*,*::before,*::after{box-sizing:border-box}
:root{color-scheme:light;--bg:#f3f4f7;--canvas:#f8f9fb;--dot:#d8dce3;--surface:#fff;--well:#eceef3;--ink:#161a22;--dim:#5f6775;--line:#dcdfe6;--line-soft:#e8eaef;--accent:#4f46e5;--accent-soft:#e8e6fb;--fail:#d3381c;--fail-soft:#fbe4df;--finding:#c07a00;--finding-soft:#fbeccc;--pass:#178a4c;--pass-soft:#dcf3e5;--side:#0f1420;--side-ink:#e6e9ef;--side-dim:#8b94a5;--side-on:#1d2536;--mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;--sans:-apple-system,"Segoe UI",Inter,Helvetica,Arial,sans-serif;--serif:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif}
:root[data-theme="dark"]{color-scheme:dark;--bg:#111318;--canvas:#171a20;--dot:#2a2f38;--surface:#1c2027;--well:#262b34;--ink:#eceef1;--dim:#9aa3ae;--line:#2f353f;--line-soft:#272c35;--accent:#8b83ff;--accent-soft:#2a2850;--fail:#ff6b4d;--fail-soft:#4a221a;--finding:#e3b23a;--finding-soft:#4a3a12;--pass:#4ecb7f;--pass-soft:#173a26}
html{background:var(--bg)}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.5 var(--sans);padding:0 0 120px}
a{color:var(--accent)}
.app{display:grid;grid-template-columns:200px minmax(0,1fr);min-height:100vh}
.side{position:sticky;top:0;height:100vh;background:var(--side);color:var(--side-ink);padding:18px 12px;display:flex;flex-direction:column;gap:4px}
.side .brand{font:800 20px/1 var(--sans);letter-spacing:-.02em;padding:6px 10px 18px;color:#fff}
.side .proj{display:block;padding:10px 12px;border-radius:9px;background:var(--side-on);color:#fff;font:600 13px var(--sans);text-decoration:none;margin-bottom:10px;overflow-wrap:anywhere}
.side .lab{font:600 10px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--side-dim);padding:8px 12px 4px}
.side a[data-filter]{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;color:var(--side-dim);text-decoration:none;font:500 13px var(--sans);cursor:pointer}
.side a[data-filter].on{background:var(--side-on);color:#fff}
.side a[data-filter] i{width:18px;height:18px;border-radius:50%;display:inline-grid;place-items:center;font:700 10px var(--mono);background:rgba(255,255,255,.1);font-style:normal;flex:none}
.side .foot{margin-top:auto;display:grid;gap:4px;padding:10px 12px;font:12px var(--mono);color:var(--side-dim)}.side .foot b{color:#fff;font-weight:600}
.main{min-width:0}
.top{position:sticky;top:0;z-index:10;background:var(--bg);padding:14px clamp(16px,2vw,32px) 10px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.top h1{margin:0;font:700 26px/1.1 var(--serif);letter-spacing:-.01em;flex:1;min-width:0}
.top .tools{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.tog{font:600 11px/1 var(--mono);letter-spacing:.04em;padding:7px 11px;border-radius:999px;border:1px solid var(--line);background:var(--surface);color:var(--dim);cursor:pointer}
.tog.on{border-color:var(--accent);color:var(--accent);background:var(--accent-soft)}
.keys{display:flex;gap:12px;font:12px var(--sans);color:var(--dim)}
.keys i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px;background:var(--line)}
.keys .k-pick i{background:var(--pass)}.keys .k-part i{background:var(--finding)}
main{display:grid;gap:0;padding:6px clamp(16px,2vw,32px) 0}
.journey{display:grid;gap:16px;padding:8px 0 28px}
.journey+.journey{border-top:1px solid var(--line-soft);padding-top:28px}
.j-h{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.j-n{width:26px;height:26px;border-radius:50%;background:var(--accent);color:#fff;display:inline-grid;place-items:center;font:700 13px var(--sans)}
.j-h h2{margin:0;font:700 22px/1.1 var(--serif);letter-spacing:-.01em}
.j-h .goal{font:13px var(--sans);color:var(--dim);flex:1;min-width:0}
.j-state{font:600 11px var(--mono);padding:6px 10px;border-radius:999px;background:var(--well);color:var(--dim)}.j-state.done{background:var(--pass-soft);color:var(--pass)}
.flow{display:grid;gap:12px}
.cards{display:grid;gap:26px}
.gallery{padding:0}
.gallery.has-pick .g-n{background:var(--pass);color:#fff}
footer{padding:28px clamp(16px,2vw,32px) 0;font:12px var(--mono);color:var(--dim)}
${WIREFLOW_CSS}
:root{--fw:220px;--gw:380px;--cw:110px}.lane.wide{--fw:clamp(200px,15vw,280px);--cw:100px}
.variants{grid-template-columns:repeat(auto-fit,minmax(min(100%,var(--gw)),1fr))}
.row{padding:16px 14px 12px}.lane{background:var(--canvas);border:0}
.cap{gap:8px}.cap .state{font:600 12px var(--mono)}
</style>
</head>
<body>
<div class="app">
<aside class="side">
  <div class="brand">uxcli</div>
  <a class="proj" href="#">${esc(name)}</a>
  <span class="lab">journeys</span>
  <a data-filter="" class="on"><i>∗</i>all</a>
  ${m.journeys.map((j, k) => `<a data-filter="${esc(j.id)}" href="#${esc(j.id)}"><i>${k + 1}</i>${esc(j.id)}</a>`).join('')}
  <div class="foot"><span><b>${m.screens.length}</b> screens</span><span><b>${m.screens.filter(s => s.variants.length).length}</b> drawn</span><span><b>${picked}</b> picked</span></div>
</aside>
<div class="main">
<header class="top">
  <h1>${esc(name)}</h1>
  <div class="tools">
    <button type="button" class="tog" data-toggle="hooks">show hooks</button>
    <span class="vpsw">${sizes.map(([w, h], k) => `<button type="button" data-vp="${w}x${h}" class="${k === 0 ? 'on' : ''}">${w}×${h}</button>`).join('')}</span>
    <span class="keys"><span class="k-pick"><i></i>picked</span><span class="k-part"><i></i>part</span><span><i></i>not taken</span></span>
  </div>
</header>
<main>
${flows.join('\n')}
</main>
<footer>a person picks: .uxcli/mockups/&lt;state&gt;/pick.json · tick a variant to get the file ready</footer>
</div>
</div>
<div class="pickbar" id="pickbar" hidden><div class="pb-h"><span>write this to</span><b class="pb-path"></b><span>then run uxcli mockups again</span></div><textarea spellcheck="false"></textarea><div class="pb-act"><button type="button" class="pb-copy">copy</button><button type="button" class="pb-close">close</button></div></div>
${protoHtml()}
<script>window.UXCLI_PROTO=${JSON.stringify(proto).replace(/</g, '\\u003c')};window.UXCLI_HASHES=${JSON.stringify(hashes).replace(/</g, '\\u003c')}</script>
<script>${PROTO_JS}</script>
</body>
</html>
`;
}

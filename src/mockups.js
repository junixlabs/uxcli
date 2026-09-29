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
import { parsePick, parseAbout, parseRevise, statusOf, screensOf, hookOf, receiptOf, receiptLine, sharedRefs, drawingHash, mockupsCard } from './core/mockups.js';
import { esc, human, sentence, firstSentence, flowRow, decisionHtml, protoHtml, PROTO_JS, WIREFLOW_CSS } from './core/wireflow.js';

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
    // about.json (the agent's words on what each drawing does) and revise.json (a person chose none)
    const fileProblems = []; const readDoc = (f, parse) => { const fp = path.join(dir, f); if (!fs.existsSync(fp)) return null; let doc; try { doc = JSON.parse(fs.readFileSync(fp, 'utf8')); } catch (e) { fileProblems.push(`${f}: not JSON: ${e.message}`); return null; } const r = parse(doc); fileProblems.push(...r.problems.map(x => `${f}: ${x}`)); return r.value; };
    const about = readDoc('about.json', d => parseAbout(d, variants));
    const revise = readDoc('revise.json', d => parseRevise(d, variants, hashes));
    return { ...s, dir, variants, refs: listRefs(dir), hashes, pick, reviews, about, revise, problems, fileProblems };
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
  const refused = m.screens.some(s => s.problems.length || s.fileProblems.length);
  return { dir: path.relative(process.cwd(), root) || '.', page: path.relative(process.cwd(), page), viewports: sizes.map(([w, h]) => `${w}x${h}`), screens: m.screens.map(s => ({ id: s.id, variants: s.variants, hashes: s.hashes, pick: s.pick, revise: s.revise, problems: s.problems, fileProblems: s.fileProblems, receipts: s.receipts, reviews: s.reviews })), exit: refused ? 1 : 0 };
}

export { mockupsCard };

function pageHtml(m, { vw, vh, sizes = [[vw, vh]], shots, rects, pins = {}, extra = {} }) {
  const byId = Object.fromEntries(m.screens.map(s => [s.id, s])); const proto = {}; const hashes = {};
  const hooksOf = key => Object.entries(rects[key] || {}).filter(([, d]) => d?.rect).map(([sel, d]) => ({ sel, x: d.rect.x, y: d.rect.y, w: d.rect.w, h: d.rect.h }));
  for (const s of m.screens) for (const v of s.variants) {
    hashes[`${s.id}/${v}`] = s.hashes?.[v];
    proto[`view:${s.id}/${v}`] = { vw, vh, frames: [{ shot: shots[`${s.id}/${v}`] || null, title: `${human(s.id)} · ${human(v)}`, missing: shots[`${s.id}/${v}`] ? null : 'no picture', pins: pins[`${s.id}/${v}`] || [], hooks: hooksOf(`${s.id}/${v}`), pick: `${s.id}/${v}` }], links: [] };
  }
  // the screens in the order a reader meets them, numbered by the journey that first names them
  const numbered = new Map(); const order = [];
  m.journeys.forEach((j, ji) => { let k = 0; for (const w of j.workflows || []) for (const st of w.steps || []) { if (st.kind === 'fixture' || !st.before) continue; for (const id of [st.before, st.after]) if (id && !numbered.has(id)) { numbered.set(id, { n: `${ji + 1}.${++k}`, journey: j.id, action: null }); order.push(id); } if (numbered.get(st.before) && !numbered.get(st.before).action) numbered.get(st.before).action = st.action || null; } });
  for (const s of m.screens) if (!numbered.has(s.id)) { numbered.set(s.id, { n: '', journey: s.journeys[0] || '', action: null }); order.push(s.id); }
  // a screen is decided when it is picked or a revision was asked of drawings still as they were
  const statusOfScreen = s => !s.variants.length ? 'undrawn' : s.pick && !s.problems.length ? 'picked' : s.revise && !s.revise.answered ? 'revise' : 'open';
  const decided = s => ['picked', 'revise'].includes(statusOfScreen(s));
  const mineOf = j => order.filter(id => numbered.get(id).journey === j.id && byId[id]);
  const flows = m.journeys.map((j, ji) => {
    const lanes = [];
    const wf = (j.workflows || []).filter(w => (w.steps || []).some(s => s.before));
    const rows = wf.map(w => {
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
        const missing = !s ? 'Not a screen any journey names' : !s.variants.length ? `No mockup yet\n.uxcli/mockups/${id}/<variant>.html` : `Not picked yet · ${s.variants.length} variant${s.variants.length === 1 ? '' : 's'}`;
        const note = acting && hook && v && !rects[`${id}/${v}`]?.[hook] ? `Hook ${hook} is not in ${v}.html` : null;
        const candidates = !v && s ? s.variants.map(c => ({ name: c, shot: shots[`${id}/${c}`] || null, view: shots[`${id}/${c}`] ? `view:${id}/${c}` : null })) : [];
        return { shot, id, alt: `${human(id)} · ${v ? human(v) : 'not picked'}`, title: `${numbered.get(id)?.n || ''} ${human(id)}`.trim(), pill: v ? { text: human(v), tone: 'ok' } : null, missing, hot, note, pins: v ? pins[`${id}/${v}`] || [] : [], hooks: v ? hooksOf(`${id}/${v}`) : [], candidates, view: v ? `view:${id}/${v}` : null };
      });
      const links = steps.map(st => ({ label: human(st.id), text: st.action || '', sub: (st.interactions || []).filter(x => x.type === 'navigation' || x.type === 'api').map(x => x.type === 'navigation' ? x.to : x.request).join(' · ') || null }));
      const play = `${j.id}/${w.id}`; const pf = frames.map(f => ({ shot: f.shot, title: f.title, missing: f.shot ? null : f.missing, hot: f.hot, pins: f.pins, hooks: f.hooks }));
      proto[play] = { vw, vh, frames: pf, links }; lanes.push({ id: w.id, frames: pf, links, play });
      // one lane: the journey's play button is the lane's, so the lane carries none of its own
      return flowRow({ id: w.id, kind: w.kind, vw, vh, frames, links, play: wf.length > 1 ? play : null });
    });
    if (lanes.length > 1) proto[`journey:${j.id}`] = { vw, vh, frames: lanes.flatMap((l, i) => l.frames.map((f, k) => k === l.frames.length - 1 && lanes[i + 1] ? { ...f, hot: { edge: true, lane: lanes[i + 1].id } } : f)), links: lanes.flatMap((l, i) => [...l.links, ...(lanes[i + 1] ? [{ label: human(lanes[i + 1].id), text: 'next lane' }] : [])]) };
    const mine = mineOf(j);
    const doneN = mine.filter(id => decided(byId[id])).length;
    const play = lanes.length > 1 ? `journey:${j.id}` : lanes[0]?.play;
    const rail = mine.map((id, k) => { const st = statusOfScreen(byId[id]); return `<li><a href="#screen-${esc(id)}" data-go="${esc(id)}" class="${st}"><span class="r-n">${esc(numbered.get(id).n)}</span><span class="r-name">${esc(human(id))}</span><span class="r-st">${esc({ picked: 'Decided', revise: 'Revision asked', open: 'Open', undrawn: 'Not drawn' }[st])}</span></a></li>`; }).join('');
    return `<article class="journey" id="${esc(j.id)}" data-journeys="${esc(j.id)}">
      <header class="j-h"><span class="j-eye">Journey ${ji + 1} of ${m.journeys.length}</span><h2 title="${esc(j.id)}">${esc(human(j.id))}</h2>${j.goal ? `<p class="goal">${esc(sentence(j.goal))}</p>` : ''}<div class="j-prog"><span class="bar"><i style="width:${mine.length ? Math.round(100 * doneN / mine.length) : 0}%"></i></span><span>${doneN} of ${mine.length} screens decided</span>${play ? `<button class="play" type="button" data-play="${esc(play)}">▶ Play the flow</button>` : ''}</div></header>
      ${mine.length ? `<ol class="rail">${rail}</ol>` : ''}
      ${mine.map(id => card(byId[id])).join('')}
      ${rows.length ? `<details class="flowbox"><summary>The flow of picked screens · ${rows.length} lane${rows.length > 1 ? 's' : ''}</summary><div class="flow">${rows.join('')}</div></details>` : ''}
    </article>`;
  });
  // The receipt says something only when something is wrong, and says it in words; the full line
  // (hooks n/n · self-contained · palette) stays on the terminal card and in technical details.
  function pageReceipt(r) {
    const said = [...(r.ok ? [] : r.problems)];
    const t = r.tokens;
    if (t && !t.linked.length) said.push(`Does not use the shared palette (${t.files.join(', ')} is not linked)`);
    else if (t && t.off.length) said.push(`${t.off.length} colour${t.off.length > 1 ? 's' : ''} off the shared palette: ${t.off.slice(0, 4).join(', ')}`);
    return said.map(sentence);
  }
  function card(s) {
    const meta = numbered.get(s.id) || {}; const status = statusOfScreen(s);
    const tech = []; let problems = 0;
    if (s.problems.length) { tech.push({ label: 'pick.json refused', lines: s.problems.map(sentence) }); problems += s.problems.length; }
    if (s.fileProblems.length) { tech.push({ label: 'Files refused', lines: s.fileProblems }); problems += s.fileProblems.length; }
    const variants = s.variants.length ? s.variants.map(v => {
      const key = `${s.id}/${v}`; const said = s.receipts?.[v] ? pageReceipt(s.receipts[v]) : []; problems += said.length;
      const rv = (s.reviews?.[v] || [])[0]; let review = null;
      if (rv?.value) { const sum = reviewSummary(rv.value); review = { lens: rv.lens, line: summaryLine(sum), points: sum.breaksList.slice(0, 4).map(b => ({ id: b.id, text: firstSentence(b.note || b.where) })), more: Math.max(0, sum.breaksList.length - 4), by: `By ${rv.value.by.ref}${rv.value.by.type === 'agent' ? ', an agent' : ''}${rv.value.by.onBehalfOf ? `, for ${rv.value.by.onBehalfOf}` : ''}` }; }
      else if (rv) review = { lens: rv.lens, line: `refused, ${rv.problems[0]}`, points: [], more: 0, refused: true };
      tech.push({ label: `${human(v)} · ${s.id}/${v}.html`, lines: [
        ...(s.receipts?.[v] ? [receiptLine(s.receipts[v])] : []), ...said,
        `sha256 ${s.hashes[v]}`,
        ...(s.pick && s.pick.pick === v ? [`Picked by ${s.pick.by.type} ${s.pick.by.ref}${s.pick.when ? ` on ${s.pick.when}` : ''}`] : []),
        ...(s.reviews?.[v] || []).flatMap(r => r.value ? reviewSummary(r.value).breaksList.map(b => `${r.lens} · ${b.id} · ${b.where || ''}${b.note ? `: ${b.note}` : ''}`) : r.problems.map(x => `${r.lens} review refused: ${x}`)),
      ] });
      return { name: v, shot: shots[key], status: s.problems.length ? 'no-pick' : statusOf(v, s.pick), part: s.pick?.parts?.[v] || null, summary: s.about?.variants?.[v] || null,
        pins: pins[key] || [], hooks: hooksOf(key), view: shots[key] ? `view:${key}` : null, pickId: shots[key] ? key : null,
        screens: [{ vw, vh, shot: shots[key] }, ...(extra[key] || [])], review };
    }) : [{ name: 'no mockup yet', shot: null, status: 'no-pick', missing: `No mockup yet\n.uxcli/mockups/${s.id}/<variant>.html` }];
    return decisionHtml({
      id: `screen-${s.id}`, state: s.id, n: meta.n, title: s.id, action: meta.action, question: s.about?.question, journeys: s.journeys.join(' '), status, vw, vh, variants,
      revise: s.revise && !s.revise.answered && !s.pick ? { note: s.revise.note, by: s.revise.by.ref } : null, tech, problems,
      refs: (s.refs || []).map(f => { const src = `${s.id}/refs/${f}`; const view = `ref:${s.id}/${f}`; proto[view] = { vw, vh, frames: [{ shot: src, title: `${human(s.id)} · reference · ${human(f.replace(/\.(png|jpe?g|webp)$/i, ''))}`, pins: [], hooks: [] }], links: [] }; return { name: f.replace(/\.(png|jpe?g|webp)$/i, ''), src, view }; }),
    });
  }
  const all = m.screens; const doneAll = all.filter(decided).length;
  const name = m.project.project?.name || path.basename(m.root);
  const sideJourneys = m.journeys.map((j, k) => { const mine = mineOf(j); return `<a data-filter="${esc(j.id)}" href="#${esc(j.id)}"><i>${k + 1}</i><span>${esc(human(j.id))}</span><em>${mine.filter(id => decided(byId[id])).length}/${mine.length}</em></a>
    <ol>${mine.map(id => `<li><a href="#screen-${esc(id)}" data-go="${esc(id)}"><i class="dot ${statusOfScreen(byId[id])}"></i>${esc(human(id))}</a></li>`).join('')}</ol>`; }).join('');
  const jump = `<select class="jump" aria-label="Go to a screen">${m.journeys.map(j => `<optgroup label="${esc(human(j.id))}">${mineOf(j).map(id => `<option value="${esc(id)}">${esc(numbered.get(id).n)} ${esc(human(id))} · ${esc({ picked: 'Decided', revise: 'Revision asked', open: 'Open', undrawn: 'Not drawn' }[statusOfScreen(byId[id])])}</option>`).join('')}</optgroup>`).join('')}</select>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(name)} mockups</title>
<style>
*,*::before,*::after{box-sizing:border-box}
:root{color-scheme:light;--bg:#f6f7f9;--canvas:#eef0f4;--dot:#d8dce3;--surface:#fff;--well:#eceef2;--ink:#171b22;--dim:#5d6572;--line:#d9dde4;--line-soft:#e6e9ee;--accent:#3b5bdb;--accent-soft:#e7ecfd;--fail:#c8361d;--fail-soft:#fbe4df;--finding:#9a6400;--finding-soft:#f7ecd6;--pass:#1b7f4b;--pass-soft:#dcf1e4;--side:#12161f;--side-ink:#e6e9ef;--side-dim:#8e97a7;--side-on:#1f2635;--mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;--sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Helvetica,Arial,sans-serif}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){color-scheme:dark;--bg:#111318;--canvas:#171a20;--dot:#2a2f38;--surface:#1b1f26;--well:#262b34;--ink:#eceef1;--dim:#9aa3ae;--line:#323944;--line-soft:#272c35;--accent:#8da2ff;--accent-soft:#232c4d;--fail:#ff7a5e;--fail-soft:#46231b;--finding:#e0b25a;--finding-soft:#3d3118;--pass:#5cc98b;--pass-soft:#173a26;--side:#0c0f14;--side-on:#1b2130}}
:root[data-theme="dark"]{color-scheme:dark;--bg:#111318;--canvas:#171a20;--dot:#2a2f38;--surface:#1b1f26;--well:#262b34;--ink:#eceef1;--dim:#9aa3ae;--line:#323944;--line-soft:#272c35;--accent:#8da2ff;--accent-soft:#232c4d;--fail:#ff7a5e;--fail-soft:#46231b;--finding:#e0b25a;--finding-soft:#3d3118;--pass:#5cc98b;--pass-soft:#173a26;--side:#0c0f14;--side-on:#1b2130}
html{background:var(--bg)}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.5 var(--sans);padding:0 0 160px}
a{color:var(--accent)}
.app{display:grid;grid-template-columns:248px minmax(0,1fr);min-height:100vh}
.side{position:sticky;top:0;height:100vh;overflow-y:auto;background:var(--side);color:var(--side-ink);padding:20px 14px;display:flex;flex-direction:column;gap:6px}
.side .brand{font:700 13px/1 var(--sans);color:var(--side-dim);padding:0 10px}
.side .proj{font:650 17px/1.3 var(--sans);color:#fff;padding:6px 10px 0;overflow-wrap:anywhere}
.side .prog{display:grid;gap:6px;padding:4px 10px 14px;font:12px var(--sans);color:var(--side-dim)}
.side .bar{background:rgba(255,255,255,.12)}.side .bar i{background:var(--pass)}
.side a[data-filter]{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;color:var(--side-ink);text-decoration:none;font:600 13px var(--sans);cursor:pointer}
.side a[data-filter] span{flex:1;min-width:0}.side a[data-filter] em{font:500 12px var(--sans);color:var(--side-dim);font-style:normal;font-variant-numeric:tabular-nums}
.side a[data-filter].on{background:var(--side-on)}
.side a[data-filter] i{width:20px;height:20px;border-radius:50%;display:inline-grid;place-items:center;font:700 11px var(--sans);background:rgba(255,255,255,.1);font-style:normal;flex:none}
.side ol{list-style:none;margin:0 0 8px;padding:0 0 0 18px;display:grid;gap:1px}
.side ol a{display:flex;align-items:center;gap:8px;padding:5px 10px;border-radius:6px;color:var(--side-dim);text-decoration:none;font:13px/1.35 var(--sans)}
.side ol a.on,.side ol a:hover{color:#fff;background:var(--side-on)}
.dot{width:8px;height:8px;border-radius:50%;flex:none;border:1.5px solid var(--side-dim)}.dot.picked{background:var(--pass);border-color:var(--pass)}.dot.revise{background:var(--finding);border-color:var(--finding)}
.bar{display:block;height:4px;border-radius:2px;background:var(--well);overflow:hidden;min-width:60px}.bar i{display:block;height:100%;background:var(--pass)}
.main{min-width:0}
.top{position:sticky;top:0;z-index:10;background:var(--bg);padding:12px clamp(16px,3vw,40px);display:flex;align-items:center;gap:12px;flex-wrap:wrap;border-bottom:1px solid var(--line-soft)}
.top h1{margin:0;font:650 16px/1.2 var(--sans);flex:1;min-width:0}
.top h1 span{color:var(--dim);font-weight:500}
.vpsw{display:inline-flex;border-radius:8px;background:var(--well);padding:2px}.vpsw button{font:600 12px var(--sans);padding:6px 10px;border:0;border-radius:6px;background:transparent;color:var(--dim);cursor:pointer;font-variant-numeric:tabular-nums}.vpsw button.on{background:var(--surface);color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.12)}
.menu{position:relative}.menu summary{list-style:none;cursor:pointer;font:600 12px var(--sans);padding:7px 12px;border-radius:8px;color:var(--dim)}.menu summary::-webkit-details-marker{display:none}.menu[open] summary,.menu summary:hover{background:var(--well);color:var(--ink)}
.menu .pop{position:absolute;right:0;top:calc(100% + 6px);z-index:20;width:260px;background:var(--surface);border-radius:10px;box-shadow:0 12px 40px -12px rgba(0,0,0,.35),0 0 0 1px var(--line-soft);padding:12px;display:grid;gap:10px;font:13px/1.45 var(--sans);color:var(--dim)}
.menu .pop .tog{justify-self:start}
.tog{font:600 12px/1 var(--sans);padding:8px 12px;border-radius:8px;border:1px solid var(--line);background:var(--surface);color:var(--ink)}.tog.on{border-color:var(--accent);color:var(--accent);background:var(--accent-soft)}
.jump{display:none;width:100%;font:600 15px var(--sans);padding:10px 12px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:var(--ink)}
main{display:grid;padding:0 clamp(16px,3vw,40px)}
.journey{display:grid;gap:22px;padding:32px 0 44px;max-width:1500px}
.journey+.journey{border-top:1px solid var(--line-soft)}
.j-h{display:grid;gap:6px}
.j-eye{font:600 12px var(--sans);color:var(--dim)}
.j-h h2{margin:0;font:700 26px/1.2 var(--sans);letter-spacing:-.015em;text-wrap:balance}
.j-h .goal{margin:0;font:16px/1.5 var(--sans);color:var(--ink);max-width:70ch}
.j-prog{display:flex;align-items:center;gap:12px;flex-wrap:wrap;font:13px var(--sans);color:var(--dim);padding-top:4px}.j-prog .bar{width:120px}
.play{font:600 13px/1 var(--sans);padding:8px 12px;border-radius:8px;border:0;background:transparent;color:var(--accent);cursor:pointer}.play:hover{background:var(--accent-soft)}
.rail{list-style:none;margin:0;padding:2px;display:flex;gap:6px;overflow-x:auto;scrollbar-width:thin}
.rail a{display:grid;grid-template-columns:auto 1fr;column-gap:8px;min-width:150px;padding:10px 14px;border-radius:10px;background:var(--well);color:var(--ink);text-decoration:none;font:13px/1.3 var(--sans)}
.rail .r-n{grid-row:span 2;font:600 12px var(--sans);color:var(--dim);font-variant-numeric:tabular-nums;padding-top:1px}
.rail .r-name{font-weight:600}.rail .r-st{font-size:12px;color:var(--dim)}
.rail a.picked .r-st{color:var(--pass)}.rail a.revise .r-st{color:var(--finding)}
.rail a.on{background:var(--surface);box-shadow:0 0 0 2px var(--ink)}
.flowbox summary{cursor:pointer;font:500 13px var(--sans);color:var(--dim);padding:4px 0}
.flowbox .flow{padding-top:12px}
footer{padding:28px clamp(16px,3vw,40px) 0;font:13px var(--sans);color:var(--dim)}
${WIREFLOW_CSS}
:root{--fw:220px;--gw:360px;--cw:110px}.lane.wide{--fw:clamp(200px,15vw,280px);--cw:100px}
.row{padding:16px 14px 12px}.lane{background:var(--canvas);border:0}.lane-h{background:transparent;border:0}
.pickbar .pb-h{max-width:40ch}.j-prog .play{margin-left:0}.pickbar .pb-next{background:var(--surface)}
@media (max-width:900px){
  .app{grid-template-columns:minmax(0,1fr)}.side{display:none}
  .jump{display:block}
  .top{position:static}.top h1{flex-basis:100%}.top h1 span{display:block;margin-top:2px}.menu{margin-left:auto}
  .journey{padding:24px 0 32px}.j-h h2{font-size:22px}
  .rail{display:none}
  .d-act button{flex:1 1 100%;text-align:left}.d-act .ghost{margin-left:0}
  .pickbar{grid-template-columns:minmax(0,1fr)}
}
</style>
</head>
<body>
<div class="app">
<aside class="side">
  <div class="brand">uxcli mockups</div>
  <div class="proj">${esc(name)}</div>
  <div class="prog"><span class="bar"><i style="width:${all.length ? Math.round(100 * doneAll / all.length) : 0}%"></i></span><span>${doneAll} of ${all.length} screens decided</span></div>
  <a data-filter="" class="on"><i>∗</i><span>All journeys</span><em>${doneAll}/${all.length}</em></a>
  ${sideJourneys}
</aside>
<div class="main">
<header class="top">
  <h1>Review mockups <span>· ${esc(name)} · ${doneAll} of ${all.length} decided</span></h1>
  ${sizes.length > 1 ? `<span class="vpsw" role="group" aria-label="Screen size">${sizes.map(([w, h], k) => `<button type="button" data-vp="${w}x${h}" class="${k === 0 ? 'on' : ''}">${w}×${h}</button>`).join('')}</span>` : ''}
  <details class="menu"><summary>View</summary><div class="pop">
    <button type="button" class="tog" data-toggle="hooks">Show hooks</button>
    <span>Hooks are the elements the journey acts on. Numbered pins are the drawing's own notes.</span>
    <span>A person decides each screen: choose a drawing, or ask for a revision. The page fills in the file to save and writes nothing.</span>
  </div></details>
  ${jump}
</header>
<main>
${flows.join('\n')}
</main>
<footer>Decisions are files: .uxcli/mockups/&lt;screen&gt;/pick.json or revise.json. Run uxcli mockups again after saving one.</footer>
</div>
</div>
<div class="pickbar" id="pickbar" hidden><div class="pb-h"><span>Save as</span><b class="pb-path"></b><span class="pb-hint"></span></div><textarea spellcheck="false" aria-label="File contents"></textarea><div class="pb-act"><button type="button" class="pb-copy">Copy</button><button type="button" class="pb-next">Next open screen</button><button type="button" class="pb-close">Close</button></div></div>
${protoHtml()}
<script>window.UXCLI_PROTO=${JSON.stringify(proto).replace(/</g, '\\u003c')};window.UXCLI_HASHES=${JSON.stringify(hashes).replace(/</g, '\\u003c')}</script>
<script>${PROTO_JS}</script>
</body>
</html>
`;
}

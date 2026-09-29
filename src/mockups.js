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
    proto[`view:${s.id}/${v}`] = { vw, vh, frames: [{ shot: shots[`${s.id}/${v}`] || null, title: `${human(s.id)} · ${String.fromCharCode(65 + s.variants.indexOf(v))} · ${human(v)}`, missing: shots[`${s.id}/${v}`] ? null : 'no picture', pins: pins[`${s.id}/${v}`] || [], hooks: hooksOf(`${s.id}/${v}`), pick: `${s.id}/${v}` }], links: [] };
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
        const hotOf = x => { if (!acting) return null; const r = x && hook ? rects[`${id}/${x}`]?.[hook]?.rect : null; return !r ? { edge: true } : r.y + r.h > vh ? { off: true, target: hook, scrolls: Math.max(1, rects[`${id}/${x}`][hook].scrollsNeeded || 1) } : { x: r.x, y: r.y, w: r.w, h: r.h }; };
        const hot = hotOf(v);
        // the prototype plays a screen nobody picked yet with its first drawing, and says so
        const pv = v || s?.variants.find(c => shots[`${id}/${c}`]) || null;
        const missing = !s ? 'Not a screen any journey names' : !s.variants.length ? `No mockup yet\n.uxcli/mockups/${id}/<variant>.html` : `Not picked yet · ${s.variants.length} variant${s.variants.length === 1 ? '' : 's'}`;
        const note = acting && hook && v && !rects[`${id}/${v}`]?.[hook] ? `Hook ${hook} is not in ${v}.html` : null;
        const candidates = !v && s ? s.variants.map(c => ({ name: c, shot: shots[`${id}/${c}`] || null, view: shots[`${id}/${c}`] ? `view:${id}/${c}` : null })) : [];
        return { shot, id, alt: `${human(id)} · ${v ? human(v) : 'not picked'}`, title: `${numbered.get(id)?.n || ''} ${human(id)}`.trim(), pill: v ? { text: human(v), tone: 'ok' } : null, missing, hot, note, pins: v ? pins[`${id}/${v}`] || [] : [], hooks: v ? hooksOf(`${id}/${v}`) : [], candidates, view: v ? `view:${id}/${v}` : null,
          play: { shot: pv ? shots[`${id}/${pv}`] : null, title: `${numbered.get(id)?.n || ''} ${human(id)}${pv && !v ? ` · ${human(pv)}, not picked yet` : ''}`.trim(), missing, hot: hotOf(pv), pins: pv ? pins[`${id}/${pv}`] || [] : [], hooks: pv ? hooksOf(`${id}/${pv}`) : [] } };
      });
      const links = steps.map(st => ({ label: human(st.id), text: st.action || '', sub: (st.interactions || []).filter(x => x.type === 'navigation' || x.type === 'api').map(x => x.type === 'navigation' ? x.to : x.request).join(' · ') || null }));
      const play = `${j.id}/${w.id}`; const pf = frames.map(f => ({ ...f.play, missing: f.play.shot ? null : f.play.missing }));
      proto[play] = { vw, vh, frames: pf, links }; lanes.push({ id: w.id, frames: pf, links, play });
      // one lane: the journey's play button is the lane's, so the lane carries none of its own
      return flowRow({ id: w.id, kind: w.kind, vw, vh, frames, links, play: wf.length > 1 ? play : null });
    });
    if (lanes.length > 1) proto[`journey:${j.id}`] = { vw, vh, frames: lanes.flatMap((l, i) => l.frames.map((f, k) => k === l.frames.length - 1 && lanes[i + 1] ? { ...f, hot: { edge: true, lane: lanes[i + 1].id } } : f)), links: lanes.flatMap((l, i) => [...l.links, ...(lanes[i + 1] ? [{ label: human(lanes[i + 1].id), text: 'next lane' }] : [])]) };
    const mine = mineOf(j);
    const play = lanes.length > 1 ? `journey:${j.id}` : lanes[0]?.play;
    return { j, ji, mine, play, rows };
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
      id: `screen-${s.id}`, state: s.id, n: meta.n, crumb: human(meta.journey || ''), title: s.id, action: meta.action, question: s.about?.question, journeys: s.journeys.join(' '), status, vw, vh, variants,
      revise: s.revise && !s.revise.answered && !s.pick ? { note: s.revise.note, by: s.revise.by.ref } : null, tech, problems,
      refs: (s.refs || []).map(f => { const src = `${s.id}/refs/${f}`; const view = `ref:${s.id}/${f}`; proto[view] = { vw, vh, frames: [{ shot: src, title: `${human(s.id)} · reference · ${human(f.replace(/\.(png|jpe?g|webp)$/i, ''))}`, pins: [], hooks: [] }], links: [] }; return { name: f.replace(/\.(png|jpe?g|webp)$/i, ''), src, view }; }),
    });
  }
  const all = m.screens; const doneAll = all.filter(decided).length;
  const name = m.project.project?.name || path.basename(m.root);
  const ST = id => ({ picked: 'Decided', revise: 'Revision asked', open: 'Open', undrawn: 'Not drawn' }[statusOfScreen(byId[id])]);
  const views = flows.map(f => f.mine.map(id => card(byId[id])).join('') + (f.rows.length ? `<section class="view flowview" id="screen-flow-${esc(f.j.id)}" data-screen="flow-${esc(f.j.id)}" data-journeys="${esc(f.j.id)}"><header class="d-h"><div class="d-t"><span class="crumb">${esc(human(f.j.id))}</span><h2>The flow of picked screens</h2>${f.j.goal ? `<p class="d-q">${esc(sentence(f.j.goal))}</p>` : ''}</div>${f.play ? `<div class="d-tools"><button class="play" type="button" data-play="${esc(f.play)}">▶ Play the flow</button></div>` : ''}</header><div class="stage"><div class="flow">${f.rows.join('')}</div></div></section>` : '')).join('\n');
  const side = flows.map(f => `<div class="sj"><div class="sj-h"><span>${esc(human(f.j.id))}</span><em>${f.mine.filter(id => decided(byId[id])).length}/${f.mine.length}</em></div>
    ${f.mine.map(id => `<a href="#screen-${esc(id)}" data-go="${esc(id)}"><span class="n">${esc(numbered.get(id).n)}</span><span class="nm">${esc(human(id))}</span><i class="dot ${statusOfScreen(byId[id])}" title="${esc(ST(id))}"></i></a>`).join('')}
    ${f.rows.length ? `<a href="#screen-flow-${esc(f.j.id)}" data-go="flow-${esc(f.j.id)}" class="fl"><span class="n">▶</span><span class="nm">Flow</span></a>` : ''}</div>`).join('');
  const jump = `<select class="jump" aria-label="Go to a screen">${flows.map(f => `<optgroup label="${esc(human(f.j.id))}">${f.mine.map(id => `<option value="${esc(id)}">${esc(numbered.get(id).n)} ${esc(human(id))} · ${esc(ST(id))}</option>`).join('')}${f.rows.length ? `<option value="flow-${esc(f.j.id)}">Flow of ${esc(human(f.j.id))}</option>` : ''}</optgroup>`).join('')}</select>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(name)} mockups</title>
<style>
*,*::before,*::after{box-sizing:border-box}
:root{color-scheme:light;--bg:#f5f6f8;--canvas:#eceef2;--stage:#e6e8ed;--dot:#d6dae1;--surface:#fff;--well:#eceef2;--ink:#15181e;--dim:#5f6673;--faint:#8b929e;--line:#d9dde4;--line-soft:#e7e9ee;--accent:#2f5bea;--accent-ink:#fff;--accent-soft:#e6ecfd;--fail:#c8361d;--fail-soft:#fbe4df;--finding:#8a5a00;--finding-soft:#f6ecd8;--pass:#1b7f4b;--pass-soft:#dcf1e4;--mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;--sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Helvetica,Arial,sans-serif}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){color-scheme:dark;--bg:#111317;--canvas:#16191e;--stage:#0c0e11;--dot:#262a31;--surface:#1a1d23;--well:#23272f;--ink:#eceef1;--dim:#a0a7b2;--faint:#737b87;--line:#323944;--line-soft:#262b33;--accent:#7f9bff;--accent-ink:#0d1220;--accent-soft:#1f2848;--fail:#ff7a5e;--fail-soft:#46231b;--finding:#e0b25a;--finding-soft:#3d3118;--pass:#5cc98b;--pass-soft:#173a26}}
:root[data-theme="dark"]{color-scheme:dark;--bg:#111317;--canvas:#16191e;--stage:#0c0e11;--dot:#262a31;--surface:#1a1d23;--well:#23272f;--ink:#eceef1;--dim:#a0a7b2;--faint:#737b87;--line:#323944;--line-soft:#262b33;--accent:#7f9bff;--accent-ink:#0d1220;--accent-soft:#1f2848;--fail:#ff7a5e;--fail-soft:#46231b;--finding:#e0b25a;--finding-soft:#3d3118;--pass:#5cc98b;--pass-soft:#173a26}
html{background:var(--bg)}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.5 var(--sans)}
a{color:var(--accent)}
button{font:inherit;cursor:pointer}
${WIREFLOW_CSS}
.app{display:grid;grid-template-columns:236px minmax(0,1fr);min-height:100vh}
.side{position:sticky;top:0;height:100vh;overflow-y:auto;padding:22px 14px 16px;display:flex;flex-direction:column;gap:2px}
.side .proj{font:650 15px/1.3 var(--sans);padding:0 10px;overflow-wrap:anywhere}
.side .cnt{font:13px var(--sans);color:var(--dim);padding:2px 10px 10px}
.sj{display:grid;gap:1px;padding-top:12px}
.sj-h{display:flex;gap:8px;padding:0 10px 4px;font:600 12px var(--sans);color:var(--faint)}.sj-h span{flex:1;min-width:0}.sj-h em{font-style:normal;font-variant-numeric:tabular-nums}
.side a[data-go]{display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:7px;color:var(--ink);text-decoration:none;font:14px/1.3 var(--sans)}
.side a[data-go] .n{color:var(--faint);font-variant-numeric:tabular-nums;width:24px;flex:none;font-size:13px}.side a[data-go] .nm{flex:1;min-width:0}
.side a[data-go]:hover{background:var(--well)}.side a[data-go].on{background:var(--surface);box-shadow:0 1px 2px rgba(0,0,0,.08);font-weight:600}
.side a.fl{color:var(--dim)}
.dot{width:8px;height:8px;border-radius:50%;flex:none;border:1.5px solid var(--faint)}.dot.picked{background:var(--pass);border-color:var(--pass)}.dot.revise{background:var(--finding);border-color:var(--finding)}.dot.undrawn{border-style:dashed}.dot.chosen{border-color:var(--accent);background:var(--accent-soft)}
.side .tools{margin-top:auto;display:grid;gap:10px;padding:16px 10px 0}
.vpsw{display:inline-flex;flex-wrap:wrap;border-radius:8px;background:var(--well);padding:2px;justify-self:start}.vpsw button{font:600 12px var(--sans);padding:6px 9px;border:0;border-radius:6px;background:transparent;color:var(--dim);font-variant-numeric:tabular-nums}.vpsw button.on{background:var(--surface);color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.12)}
.tog{justify-self:start;font:600 12px/1 var(--sans);padding:8px 10px;border-radius:8px;border:0;background:var(--well);color:var(--ink)}.tog.on{background:var(--accent-soft);color:var(--accent)}
.side .hint{font:12px/1.45 var(--sans);color:var(--faint)}
.jump{display:none;width:100%;font:600 15px var(--sans);padding:10px 12px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:var(--ink)}
.main{min-width:0;background:var(--surface)}
.view{display:grid;grid-template-rows:auto minmax(0,1fr) auto;min-width:0}
.js .view{height:100vh}.js .view.off{display:none}
.view+.view{border-top:1px solid var(--line-soft)}.js .view+.view{border-top:0}
.d-h{display:flex;align-items:flex-end;gap:20px;padding:18px 32px 14px;flex-wrap:wrap}
.d-t{flex:1;min-width:min(100%,320px);display:grid;gap:3px}
.crumb{font:600 12px var(--sans);color:var(--faint)}
.d-h h2{margin:0;font:650 22px/1.25 var(--sans);letter-spacing:-.01em;text-wrap:balance}.d-n{color:var(--faint);font-weight:500;margin-right:10px;font-variant-numeric:tabular-nums}
.d-q{margin:0;font:15px/1.5 var(--sans);color:var(--dim);max-width:75ch}
.d-rev{margin:4px 0 0;font:14px/1.5 var(--sans);max-width:75ch}.d-rev b{color:var(--finding);font-weight:600}
.d-tools{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.d-state{font:600 12px/1 var(--sans);padding:7px 10px;border-radius:999px;background:var(--well);color:var(--dim)}.d-state.picked{background:var(--pass-soft);color:var(--pass)}.d-state.revise{background:var(--finding-soft);color:var(--finding)}
.seg{display:inline-flex;background:var(--well);border-radius:10px;padding:3px}.seg button{border:0;background:transparent;padding:7px 12px;border-radius:8px;font:600 14px var(--sans);color:var(--dim);display:flex;gap:8px;align-items:center}.seg button.on{background:var(--surface);color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.12)}
.ghost,.play{border:0;background:transparent;color:var(--accent);font:600 14px var(--sans);padding:8px 10px;border-radius:8px}.ghost:hover,.play:hover{background:var(--accent-soft)}
.stage{background:var(--stage);overflow:auto;padding:18px 32px 24px;display:grid;align-content:start;gap:16px}
.opt{margin:0;display:grid;gap:12px;min-width:0}.js .opt[data-off]{display:none}
.opt figcaption{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.letter{font:700 11px/1 var(--sans);width:20px;height:20px;border-radius:50%;display:inline-grid;place-items:center;background:var(--ink);color:var(--bg);flex:none;align-self:center}
.seg .letter{background:var(--dim)}.seg button.on .letter,.opt.pick .letter{background:var(--ink)}
.opt-name{font:600 15px var(--sans)}.opt-sum{flex-basis:100%;font:14px/1.5 var(--sans);color:var(--dim);max-width:80ch}
.tag{font:600 11px/1 var(--sans);padding:4px 8px;border-radius:999px;align-self:center}.tag.pick{background:var(--pass-soft);color:var(--pass)}.tag.part{background:var(--well);color:var(--dim)}
.opt .screen{max-width:min(100%,calc(var(--sw) * 1px))}
.decision.portrait .opt .screens{max-width:420px}
.opt .screen{border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.12),0 18px 44px -22px rgba(0,0,0,.4)}
.opt.pick .screen{box-shadow:0 0 0 2px var(--pass),0 18px 44px -22px rgba(0,0,0,.4)}
.notes{margin:0;padding-left:20px;font:14px/1.5 var(--sans);display:grid;gap:3px;max-width:80ch}.notes li::marker{font:700 12px var(--sans);color:var(--dim)}
.d-more{display:grid;gap:6px}.d-more summary{cursor:pointer;font:500 13px var(--sans);color:var(--dim)}
.warn{color:var(--finding)}
.tech-row{display:grid;gap:2px;padding:8px 0 0;font:12px/1.5 var(--sans);color:var(--dim);overflow-wrap:anywhere}.tech-row b{color:var(--ink);font-weight:600}
.refs{display:flex;flex-wrap:wrap;gap:12px;padding-top:8px}.ref{width:180px}
.d-bar{display:flex;align-items:center;gap:10px;padding:12px 32px;background:var(--surface);box-shadow:0 -1px 0 var(--line-soft);position:relative}
.d-bar .review,.d-bar .grow{flex:1;min-width:0}
.review summary{cursor:pointer;font:14px var(--sans);color:var(--dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.review.refused summary{color:var(--fail)}
.review .pop{position:absolute;left:24px;bottom:calc(100% + 8px);width:min(560px,calc(100% - 48px));background:var(--surface);border-radius:12px;padding:14px 16px;box-shadow:0 18px 50px -14px rgba(0,0,0,.4),0 0 0 1px var(--line-soft);font:14px/1.5 var(--sans)}
.review ul{margin:0;padding-left:18px;display:grid;gap:6px}.review .more-n,.review .by{margin:8px 0 0;font:12px var(--sans);color:var(--dim)}
.d-bar button{font:600 14px/1 var(--sans);padding:12px 16px;border-radius:9px;border:0;background:var(--well);color:var(--ink);white-space:nowrap}
.d-bar .neither{background:transparent;color:var(--dim)}.d-bar .neither.on{color:var(--finding);background:var(--finding-soft)}
.d-bar .choose{order:1}.d-bar .choose.primary{order:2;background:var(--accent);color:var(--accent-ink)}
.d-bar .choose.on{box-shadow:inset 0 0 0 2px var(--pass)}
.d-bar button:focus-visible,.side a:focus-visible,.seg button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.pin{width:18px;height:18px;margin:-9px 0 0 -9px;font-size:10px;line-height:18px;opacity:.9}
.flow{display:grid;gap:14px}
:root{--fw:260px;--cw:120px}.lane.wide{--fw:clamp(280px,24vw,420px);--cw:120px}
.row{padding:16px 14px 12px}.lane{background:var(--canvas);border:0}.lane-h{background:transparent;border:0}
.pickbar{left:auto;right:24px;bottom:84px;width:min(560px,calc(100% - 48px));grid-template-columns:minmax(0,1fr);gap:10px;border-radius:14px;border:0;box-shadow:0 20px 60px -16px rgba(0,0,0,.45),0 0 0 1px var(--line-soft)}
.pickbar .pb-h{max-width:none}.pickbar .pb-act{display:flex;gap:8px;flex-wrap:wrap}.pickbar .pb-next{background:var(--surface)}
.pickbar button{border-radius:9px}
@media (max-width:900px){
  .app{grid-template-columns:minmax(0,1fr)}.side{display:none}
  .jump{display:block;margin:12px 16px 0;width:calc(100% - 32px)}
  .js .view{height:auto}
  .d-h,.stage,.d-bar{padding-left:16px;padding-right:16px}
  .d-bar{position:sticky;bottom:0;flex-wrap:wrap}.d-bar .review{flex-basis:100%}.d-bar button{flex:1 1 auto}
  .review .pop{left:16px;width:calc(100% - 32px)}
  .pickbar{right:16px;width:calc(100% - 32px);bottom:156px}
}
</style>
</head>
<body>
<div class="app">
<aside class="side">
  <div class="proj">${esc(name)}</div>
  <div class="cnt">${doneAll} of ${all.length} screens decided</div>
  ${side}
  <div class="tools">
    ${sizes.length > 1 ? `<span class="vpsw" role="group" aria-label="Screen size">${sizes.map(([w, h], k) => `<button type="button" data-vp="${w}x${h}" class="${k === 0 ? 'on' : ''}">${w}×${h}</button>`).join('')}</span>` : ''}
    <button type="button" class="tog" data-toggle="hooks">Show hooks</button>
    <span class="hint">Keys 1, 2 flip between drawings. The page writes nothing: a choice gives you the file to save.</span>
  </div>
</aside>
<div class="main">
${jump}
${views}
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

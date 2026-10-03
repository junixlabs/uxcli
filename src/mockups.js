// uxcli mockups: photograph every variant of every screen the journeys name, find the hook each step
// leaves from inside the picked variant, and write one page — the journeys as flows of the picked
// mockups, then each screen's variants side by side with the status the pick gives them.
// in:  .uxcli/mockups/<state>/<variant>.html, .uxcli/mockups/<state>/pick.json, .uxcli/journeys/
// out: .uxcli/mockups/index.html, .uxcli/mockups/.shots/<state>/<variant>.png; the card on stdout
import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
import { findRoot, loadProject } from './journey.js';
import { launch } from './browser.js';
import { observe } from './adapters/chrome/index.js';
import { library, readReview, mockupHash } from './lens.js';
import { reviewSummary, summaryLine } from './core/model/lens.js';
import { parsePick, parseAbout, parseRevise, statusOf, screenStatus, isDecided, screensOf, hookOf, receiptOf, receiptLine, mockupsCard } from './core/mockups.js';
import { human, sentence, firstSentence } from './core/wireflow.js';
import { mockupsPage } from './core/mockups-page.js';

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
    const hashes = Object.fromEntries(variants.map(v => [v, mockupHash(root, s.id, v)]));
    // pick.json, about.json (the agent's words on each drawing) and revise.json (a person chose none)
    const readDoc = (f, parse) => { const fp = path.join(dir, f); if (!fs.existsSync(fp)) return { value: null, problems: [] }; try { return parse(JSON.parse(fs.readFileSync(fp, 'utf8'))); } catch (e) { return { value: null, problems: [`not JSON: ${e.message}`] }; } };
    { const r = readDoc('pick.json', d => parsePick(d, variants, hashes)); pick = r.value; problems.push(...r.problems); }
    // <variant>.<lens>.review.json: a lens read against the drawing, shown as the reviewer's claim
    const reviews = {};
    for (const v of variants) for (const f of (fs.existsSync(dir) ? fs.readdirSync(dir) : []).filter(f => f.startsWith(`${v}.`) && f.endsWith('.review.json'))) {
      const r = readReview(root, path.join(dir, f), lib); (reviews[v] ||= []).push({ lens: f.slice(v.length + 1, -'.review.json'.length), value: r.value, problems: r.problems });
    }
    const fileProblems = []; const other = (f, parse) => { const r = readDoc(f, parse); fileProblems.push(...r.problems.map(x => `${f}: ${x}`)); return r.value; };
    const about = other('about.json', d => parseAbout(d, variants));
    const revise = other('revise.json', d => parseRevise(d, variants, hashes));
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

function pageHtml(m, { vw, vh, sizes, shots, rects, pins, extra }) {
  const byId = Object.fromEntries(m.screens.map(s => [s.id, s])); const proto = {}; const hashes = {};
  const hooksOf = key => Object.entries(rects[key] || {}).filter(([, d]) => d?.rect).map(([sel, d]) => ({ sel, x: d.rect.x, y: d.rect.y, w: d.rect.w, h: d.rect.h }));
  for (const s of m.screens) for (const v of s.variants) {
    hashes[`${s.id}/${v}`] = s.hashes?.[v];
    proto[`view:${s.id}/${v}`] = { vw, vh, frames: [{ shot: shots[`${s.id}/${v}`] || null, title: `${human(s.id)} · ${String.fromCharCode(65 + s.variants.indexOf(v))} · ${human(v)}`, label: `${String.fromCharCode(65 + s.variants.indexOf(v))} · ${human(v)}`, missing: shots[`${s.id}/${v}`] ? null : 'no picture', pins: pins[`${s.id}/${v}`] || [], hooks: hooksOf(`${s.id}/${v}`), pick: `${s.id}/${v}` }], links: [] };
  }
  // the screens in the order a reader meets them, numbered by the journey that first names them
  const numbered = new Map(); const order = [];
  m.journeys.forEach((j, ji) => { let k = 0; for (const w of j.workflows || []) for (const st of w.steps || []) { if (st.kind === 'fixture' || !st.before) continue; for (const id of [st.before, st.after]) if (id && !numbered.has(id)) { numbered.set(id, { n: `${ji + 1}.${++k}`, journey: j.id, action: null }); order.push(id); } if (numbered.get(st.before) && !numbered.get(st.before).action) numbered.get(st.before).action = st.action || null; } });
  for (const s of m.screens) if (!numbered.has(s.id)) { numbered.set(s.id, { n: '', journey: s.journeys[0] || '', action: null }); order.push(s.id); }
  // a screen is decided when it is picked or a revision was asked of drawings still as they were
  const mineOf = j => order.filter(id => numbered.get(id).journey === j.id && byId[id]);
  const flows = m.journeys.map(j => {
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
      return { id: w.id, kind: w.kind, vw, vh, frames, links, play: wf.length > 1 ? play : null };
    });
    if (lanes.length > 1) proto[`journey:${j.id}`] = { vw, vh, frames: lanes.flatMap((l, i) => l.frames.map((f, k) => k === l.frames.length - 1 && lanes[i + 1] ? { ...f, hot: { edge: true, lane: lanes[i + 1].id } } : f)), links: lanes.flatMap((l, i) => [...l.links, ...(lanes[i + 1] ? [{ label: human(lanes[i + 1].id), text: 'next lane' }] : [])]) };
    const mine = mineOf(j);
    const play = lanes.length > 1 ? `journey:${j.id}` : lanes[0]?.play;
    return { j, mine, play, rows };
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
    const meta = numbered.get(s.id) || {}; const status = screenStatus(s);
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
    return ({
      state: s.id, n: meta.n, crumb: human(meta.journey || ''), title: s.id, action: meta.action, question: s.about?.question, status, vw, vh, variants,
      revise: s.revise && !s.revise.answered && !s.pick ? { note: s.revise.note, by: s.revise.by.ref } : null, tech, problems,
      refs: (s.refs || []).map(f => { const src = `${s.id}/refs/${f}`; const view = `ref:${s.id}/${f}`; proto[view] = { vw, vh, frames: [{ shot: src, title: `${human(s.id)} · reference · ${human(f.replace(/\.(png|jpe?g|webp)$/i, ''))}`, pins: [], hooks: [] }], links: [] }; return { name: f.replace(/\.(png|jpe?g|webp)$/i, ''), src, view }; }),
    });
  }
  const firstOpen = order.find(id => byId[id] && screenStatus(byId[id]) === 'open') || order.find(id => byId[id]);
  return mockupsPage({
    name: m.project.project?.name || path.basename(m.root), sizes, proto, hashes,
    decided: m.screens.filter(isDecided).length, total: m.screens.length,
    journeys: flows.map(f => ({ id: f.j.id, goal: f.j.goal, screens: f.mine.map(id => ({ ...card(byId[id]), first: id === firstOpen })), flow: f.rows.length ? { lanes: f.rows, play: f.play } : null })),
  });
}

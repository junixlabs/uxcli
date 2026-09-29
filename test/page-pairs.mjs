// The pages uxcli writes, measured by uxcli. A page that does not fit the screen it is on is the
// defect this instrument exists to catch; it must not ship one. The gate stages the fixture, writes
// the mockups page and the map, opens each in Chrome at three desktop sizes and refuses: a scroller
// that overflows sideways, a page error, a canvas whose content uses less than a third of the
// height on a large display, and any `fail` from the four page probes on the map. The must-fail
// half plants a 3000px-wide element on the map and checks the same reading sees it.
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { launch } from '../src/browser.js';
import { ROOT } from './example-data.mjs';

export const OPERATOR = 'map and mockups pages at 1440×900, 1600×1000 and 1920×1080: no scroller overflows sideways, no page error, the prototype on the mockups page opens on the first picked frame and its hotspot, arrows and escape do what they say, a variant opens in the viewer with its hooks drawn only when asked, a reload comes back to the screen being looked at, compare shows the drawings of the screen side by side, choosing from the compare view fills the pick bar and writes nothing, neither fills revise.json with the hash of every drawing and next open screen moves on, one screen shows at a time, the sidebar goes to the screen it names, the picked drawing shows first and 1 and 2 flip it with the primary choice following, the flow of a journey is its own view, at 390 the sidebar gives way to a screen selector without sideways scroll, the hooks toggle outlines them, play journey chains the lanes, '
  + 'the canvas uses at least a third of the height at 1920×1080, and the four page probes find no fail on the map; a planted 3000px element is seen';

const SIZES = [[1440, 900], [1600, 1000], [1920, 1080]];
const FIXTURE = path.join(ROOT, 'test', 'fixtures', 'crm');

// what the reading returns for one page at one size
async function read(page, url, [w, h]) {
  const errors = []; const onErr = e => errors.push(String(e)); page.on('pageerror', onErr);
  await page.setViewportSize({ width: w, height: h });
  await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const over = [];
    for (const el of document.querySelectorAll('body, .canvas, .panel, main, .page, .lane')) if (el.scrollWidth > el.clientWidth + 1) over.push((el.className || el.tagName) + ' ' + el.scrollWidth + '>' + el.clientWidth);
    const canvas = document.querySelector('.canvas'); const lanes = document.querySelector('.lanes');
    const used = canvas && lanes ? (lanes.getBoundingClientRect().height + (document.querySelector('.tray')?.getBoundingClientRect().height || 0)) / canvas.clientHeight : null;
    return { over, used, docOver: document.documentElement.scrollWidth > window.innerWidth };
  });
  page.off('pageerror', onErr);
  return { ...r, errors };
}

export async function pair() {
  const problems = []; let checks = 0;
  const must = (what, cond) => { checks++; if (!cond) problems.push(what); };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-page-'));
  fs.cpSync(FIXTURE, tmp, { recursive: true, filter: src => !/\/\.uxcli\/(index\.json|map|mockups\/\.shots|mockups\/index\.html)$/.test(src) });
  // one screen left open, so next open screen has somewhere to go
  fs.rmSync(path.join(tmp, '.uxcli', 'mockups', 'anon.login_page', 'pick.json'));
  const { map } = await import('../src/map.js');
  await map(tmp, { viewport: '390x844' });                      // photographs the mockups too
  const MAP = pathToFileURL(path.join(tmp, '.uxcli', 'map', 'index.html')).href;
  const MOCK = pathToFileURL(path.join(tmp, '.uxcli', 'mockups', 'index.html')).href;
  const browser = await launch();
  try {
    const page = await browser.newPage();
    for (const size of SIZES) {
      for (const [name, url] of [['map', MAP + '#j/handle-inbound-lead/run/2'], ['map', MAP + '#j/authenticate/model/1'], ['mockups', MOCK]]) {
        const r = await read(page, url, size);
        must(`${name} at ${size.join('×')}: page error ${r.errors[0] || ''}`, !r.errors.length);
        must(`${name} at ${size.join('×')}: overflows sideways (${r.over.join(', ')})`, !r.over.length && !r.docOver);
        if (name === 'map' && size[0] === 1920) must(`map at 1920×1080: the canvas uses ${Math.round((r.used || 0) * 100)}% of its height`, r.used != null && r.used >= 1 / 3);
      }
    }
    // the prototype on the mockups page: play opens the first picked frame, the hotspot leads to the next, arrows step, escape closes
    await page.setViewportSize({ width: 1440, height: 900 }); await page.goto(MOCK, { waitUntil: 'load' }); await page.waitForTimeout(300);
    const perr = []; page.on('pageerror', e => perr.push(String(e)));
    await page.click('.side [data-go="flow-handle-inbound-lead"]'); await page.waitForTimeout(100);
    await page.click('#screen-flow-handle-inbound-lead [data-play="handle-inbound-lead/open-and-call"]'); await page.waitForTimeout(100);
    const p0 = await page.evaluate(() => { const el = document.getElementById('proto'); const img = el.querySelector('img'); return { open: !el.hidden, n: el.querySelector('.p-n').textContent, src: img.getAttribute('src'), seen: !!img && img.naturalWidth > 0 && img.getBoundingClientRect().height > 200 && !el.querySelector('.noshot'), hot: !el.querySelector('.hot').hidden || !el.querySelector('.p-off').hidden }; });
    must(`play did not open on the first picked frame (${JSON.stringify(p0)})`, p0.open && p0.n === '1 / 3' && /agent\.workspace_ready\/a-list\.png$/.test(p0.src || '') && p0.seen && p0.hot);
    await page.click('#proto .hot:not([hidden]), #proto .p-off:not([hidden])'); await page.waitForTimeout(100);
    must('the hotspot did not lead to the next frame', (await page.textContent('#proto .p-n')) === '2 / 3');
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(50); await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(50);
    must('the arrow keys did not step', (await page.textContent('#proto .p-n')) === '2 / 3');
    await page.keyboard.press('Escape'); await page.waitForTimeout(50);
    must('escape did not close the prototype', await page.evaluate(() => document.getElementById('proto').hidden));
    // one screen at a time: the sidebar shows the screen it names; the picked drawing is shown first and 1, 2 flip it
    const shown = () => page.evaluate(() => [...document.querySelectorAll('.view')].filter(d => getComputedStyle(d).display !== 'none').map(d => d.getAttribute('data-screen')));
    await page.click('.side [data-go="agent.lead_detail"]'); await page.waitForTimeout(100);
    const s1 = await shown();
    must(`the sidebar did not show the one screen it names (${s1})`, s1.length === 1 && s1[0] === 'agent.lead_detail');
    const fl = () => page.evaluate(() => { const b = document.getElementById('screen-agent.lead_detail'); const on = [...b.querySelectorAll('.opt')].filter(o => getComputedStyle(o).display !== 'none').map(o => o.getAttribute('data-k')); return { on: on.join(' '), primary: b.querySelector('.d-bar .choose.primary')?.getAttribute('data-pickv') }; });
    const f0 = await fl();
    must(`the picked drawing is not the one shown first (${JSON.stringify(f0)})`, f0.on === '1' && f0.primary === 'agent.lead_detail/b-call-first');
    await page.keyboard.press('1'); await page.waitForTimeout(50);
    const f1 = await fl();
    must(`key 1 did not flip to drawing A and move the primary choice with it (${JSON.stringify(f1)})`, f1.on === '0' && f1.primary === 'agent.lead_detail/a-stacked');
    await page.click('#screen-agent\\.lead_detail [data-flip="1"]'); await page.waitForTimeout(50);
    must('the B button did not flip back', (await fl()).on === '1');
    // the viewer, compare, choosing, revising
    await page.click('#screen-agent\\.lead_detail .opt [data-view="view:agent.lead_detail/b-call-first"]'); await page.waitForTimeout(100);
    const v1 = await page.evaluate(() => { const el = document.getElementById('proto'); const img = el.querySelector('img'); return { open: !el.hidden, n: el.querySelector('.p-n').textContent, seen: img && img.naturalWidth > 0 && img.getBoundingClientRect().height > 200, hooks: el.querySelectorAll('.hk').length, drawn: [...el.querySelectorAll('.hk')].filter(h => getComputedStyle(h).display !== 'none').length }; });
    must(`a variant did not open in the viewer with its hooks (${JSON.stringify(v1)})`, v1.open && v1.n === '1 / 1' && v1.seen && v1.hooks >= 2 && v1.drawn === 0);
    await page.keyboard.press('Escape'); await page.waitForTimeout(50);
    await page.click('[data-compare="agent.lead_detail"]'); await page.waitForTimeout(150);
    const c2 = await page.evaluate(() => { const el = document.getElementById('proto'); return { open: !el.hidden, screens: el.querySelectorAll('.p-screen').length, n: el.querySelector('.p-n').textContent }; });
    must(`compare did not open the two drawings (${JSON.stringify(c2)})`, c2.open && c2.screens === 2 && c2.n === 'compare');
    // picking from the compare view fills the pick bar with the file to write, never writes it
    await page.click('#proto [data-pickv="agent.lead_detail/a-stacked"]'); await page.waitForTimeout(100);
    const pb = await page.evaluate(() => { const b = document.getElementById('pickbar'); let doc = null; try { doc = JSON.parse(b.querySelector('textarea').value); } catch {} return { shown: !b.hidden, path: b.querySelector('.pb-path').textContent, pick: doc?.pick, sha: doc?.sha256, closed: document.getElementById('proto').hidden }; });
    must(`the pick bar did not carry a-stacked's pick.json (${JSON.stringify(pb)})`, pb.shown && pb.path === '.uxcli/mockups/agent.lead_detail/pick.json' && pb.pick === 'a-stacked' && /^[0-9a-f]{64}$/.test(pb.sha || '') && pb.closed);
    must('the page wrote pick.json itself', !fs.existsSync(path.join(tmp, '.uxcli', 'mockups', 'agent.lead_detail', 'pick.json')) || JSON.parse(fs.readFileSync(path.join(tmp, '.uxcli', 'mockups', 'agent.lead_detail', 'pick.json'), 'utf8')).pick === 'b-call-first');
    // neither: the revision file carries every drawing's hash and an empty note to fill; next open screen goes to one without an answer
    await page.click('[data-revise="agent.lead_detail"]'); await page.waitForTimeout(100);
    const rb = await page.evaluate(() => { const b = document.getElementById('pickbar'); let doc = null; try { doc = JSON.parse(b.querySelector('textarea').value); } catch {} return { path: b.querySelector('.pb-path').textContent, note: doc?.note, seen: Object.keys(doc?.seen || {}).sort().join(' '), hex: Object.values(doc?.seen || {}).every(h => /^[0-9a-f]{64}$/.test(h)) }; });
    must(`neither did not fill revise.json (${JSON.stringify(rb)})`, rb.path === '.uxcli/mockups/agent.lead_detail/revise.json' && rb.note === '' && rb.seen === 'a-stacked b-call-first' && rb.hex);
    must('the page wrote revise.json itself', !fs.existsSync(path.join(tmp, '.uxcli', 'mockups', 'agent.lead_detail', 'revise.json')));
    await page.click('#pickbar .pb-next'); await page.waitForTimeout(150);
    const nx = await shown();
    must(`next open screen did not show the open screen (${nx})`, nx.length === 1 && nx[0] === 'anon.login_page');
    // a journey's flow is its own view: its lanes, and play for the whole journey when it has more than one
    await page.click('.side [data-go="flow-authenticate"]'); await page.waitForTimeout(100);
    const fv = await page.evaluate(() => ({ shown: [...document.querySelectorAll('.view')].filter(d => getComputedStyle(d).display !== 'none').map(d => d.getAttribute('data-screen')).join(' '), lanes: document.querySelectorAll('#screen-flow-authenticate .lane').length }));
    must(`the flow view did not show the journey's lanes alone (${JSON.stringify(fv)})`, fv.shown === 'flow-authenticate' && fv.lanes > 1);
    await page.click('.side [data-go="agent.workspace_ready"]'); await page.waitForTimeout(100);
    await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(200);
    const rl = await shown();
    must(`a reload did not come back to the screen being looked at (${rl})`, rl.length === 1 && rl[0] === 'agent.workspace_ready');
    await page.click('.side [data-toggle="hooks"]'); await page.waitForTimeout(100);
    must('the hooks toggle does not outline the hooks on the frames', await page.evaluate(() => [...document.querySelectorAll('.opt .hk')].some(h => getComputedStyle(h).display !== 'none')));
    must('a one-lane journey offers play twice', await page.evaluate(() => document.querySelectorAll('[data-play="handle-inbound-lead/open-and-call"]').length === 1));
    must('play journey is offered for a journey with one lane', await page.evaluate(() => !document.querySelector('[data-play="journey:handle-inbound-lead"]')) && await page.evaluate(() => !!document.querySelector('[data-play="journey:authenticate"]')));
    await page.click('.side [data-go="flow-authenticate"]'); await page.waitForTimeout(100);
    await page.click('[data-play="journey:authenticate"]'); await page.waitForTimeout(100);
    const pj = await page.evaluate(() => document.getElementById('proto').querySelector('.p-n').textContent);
    must(`play journey did not chain the lanes (${pj})`, /^1 \/ \d+$/.test(pj) && Number(pj.split('/ ')[1]) > 3);
    await page.keyboard.press('Escape'); await page.waitForTimeout(50);
    must(`the prototype threw: ${perr[0] || ''}`, !perr.length);
    // a phone: no sidebar, a screen selector, nothing wider than the screen
    await page.setViewportSize({ width: 390, height: 844 }); await page.goto(MOCK, { waitUntil: 'load' }); await page.waitForTimeout(300);
    const ph = await page.evaluate(() => ({ side: getComputedStyle(document.querySelector('.side')).display, jump: getComputedStyle(document.querySelector('select.jump')).display, over: document.documentElement.scrollWidth > innerWidth }));
    must(`the page at 390 keeps its sidebar, has no selector, or scrolls sideways (${JSON.stringify(ph)})`, ph.side === 'none' && ph.jump !== 'none' && !ph.over);
    await page.selectOption('select.jump', 'agent.workspace_ready'); await page.waitForTimeout(100);
    must('the selector did not show the screen it names', await page.evaluate(() => getComputedStyle(document.getElementById('screen-agent.workspace_ready')).display !== 'none' && getComputedStyle(document.getElementById('screen-anon.login_page')).display === 'none'));
    // must-fail: the same reading sees a planted overflow
    await page.setViewportSize({ width: 1440, height: 900 }); await page.goto(MAP + '#j/handle-inbound-lead/run/1', { waitUntil: 'load' }); await page.waitForTimeout(300);
    const planted = await page.evaluate(() => { const d = document.createElement('div'); d.style.cssText = 'width:3000px;height:10px'; document.querySelector('.canvas').appendChild(d); const c = document.querySelector('.canvas'); return c.scrollWidth > c.clientWidth + 1; });
    must('a planted 3000px element was not seen as overflow', planted);
    // the four page probes on the map itself
    const { runPage } = await import('../src/page.js');
    const out = path.join(tmp, 'probe'); fs.mkdirSync(out, { recursive: true });
    const res = await runPage(MAP + '#j/handle-inbound-lead/run/2', { browser, outDir: out });
    for (const p of res.probes || []) must(`map: probe ${p.probe} says ${p.verdict}: ${p.why || ''}`, p.verdict !== 'fail');
    must('the probes did not run on the map', (res.probes || []).length >= 4);
    await page.close();
  } finally { await browser.close(); fs.rmSync(tmp, { recursive: true, force: true }); }
  return { ok: !problems.length, checks, problems };
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  const r = await pair(); console.log(r.ok ? `PASS page · ${r.checks} checks` : 'FAIL ' + r.problems.join('\n     ')); process.exit(r.ok ? 0 : 1);
}

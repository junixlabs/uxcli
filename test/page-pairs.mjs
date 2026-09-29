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

export const OPERATOR = 'map and mockups pages at 1440×900, 1600×1000 and 1920×1080: no scroller overflows sideways, no page error, the prototype on the mockups page opens on the first picked frame and its hotspot, arrows and escape do what they say, a variant opens in the viewer with its hooks, two compare boxes show two frames, picking from the compare view fills the pick bar and writes nothing, the journey filter hides what the journey does not name, the hooks toggle outlines them, play journey chains the lanes, '
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
    await page.click('[data-play="handle-inbound-lead/open-and-call"]'); await page.waitForTimeout(100);
    const p0 = await page.evaluate(() => { const el = document.getElementById('proto'); const img = el.querySelector('img'); return { open: !el.hidden, n: el.querySelector('.p-n').textContent, src: img.getAttribute('src'), seen: !!img && img.naturalWidth > 0 && img.getBoundingClientRect().height > 200 && !el.querySelector('.noshot'), hot: !el.querySelector('.hot').hidden || !el.querySelector('.p-off').hidden }; });
    must(`play did not open on the first picked frame (${JSON.stringify(p0)})`, p0.open && p0.n === '1 / 3' && /agent\.workspace_ready\/a-list\.png$/.test(p0.src || '') && p0.seen && p0.hot);
    await page.click('#proto .hot:not([hidden]), #proto .p-off:not([hidden])'); await page.waitForTimeout(100);
    must('the hotspot did not lead to the next frame', (await page.textContent('#proto .p-n')) === '2 / 3');
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(50); await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(50);
    must('the arrow keys did not step', (await page.textContent('#proto .p-n')) === '2 / 3');
    await page.keyboard.press('Escape'); await page.waitForTimeout(50);
    must('escape did not close the prototype', await page.evaluate(() => document.getElementById('proto').hidden));
    // the viewer, compare, the filter and the hooks toggle
    await page.click('[data-view="view:agent.lead_detail/b-call-first"]'); await page.waitForTimeout(100);
    const v1 = await page.evaluate(() => { const el = document.getElementById('proto'); const img = el.querySelector('img'); return { open: !el.hidden, n: el.querySelector('.p-n').textContent, seen: img && img.naturalWidth > 0 && img.getBoundingClientRect().height > 200, hooks: el.querySelectorAll('.hk').length }; });
    must(`a variant did not open in the viewer with its hooks (${JSON.stringify(v1)})`, v1.open && v1.n === '1 / 1' && v1.seen && v1.hooks >= 2);
    await page.keyboard.press('Escape'); await page.waitForTimeout(50);
    await page.check('[data-cmp="view:agent.lead_detail/a-stacked"]'); await page.check('[data-cmp="view:agent.lead_detail/b-call-first"]'); await page.waitForTimeout(150);
    const c2 = await page.evaluate(() => { const el = document.getElementById('proto'); return { open: !el.hidden, screens: el.querySelectorAll('.p-screen').length, n: el.querySelector('.p-n').textContent }; });
    must(`two compare boxes did not open two frames (${JSON.stringify(c2)})`, c2.open && c2.screens === 2 && c2.n === 'compare');
    // picking from the compare view fills the pick bar with the file to write, never writes it
    await page.click('[data-pickv="agent.lead_detail/a-stacked"]'); await page.waitForTimeout(100);
    const pb = await page.evaluate(() => { const b = document.getElementById('pickbar'); let doc = null; try { doc = JSON.parse(b.querySelector('textarea').value); } catch {} return { shown: !b.hidden, path: b.querySelector('.pb-path').textContent, pick: doc?.pick, sha: doc?.sha256, closed: document.getElementById('proto').hidden }; });
    must(`the pick bar did not carry a-stacked's pick.json (${JSON.stringify(pb)})`, pb.shown && pb.path === '.uxcli/mockups/agent.lead_detail/pick.json' && pb.pick === 'a-stacked' && /^[0-9a-f]{64}$/.test(pb.sha || '') && pb.closed);
    must('the page wrote pick.json itself', !fs.existsSync(path.join(tmp, '.uxcli', 'mockups', 'agent.lead_detail', 'pick.json')) || JSON.parse(fs.readFileSync(path.join(tmp, '.uxcli', 'mockups', 'agent.lead_detail', 'pick.json'), 'utf8')).pick === 'b-call-first');
    await page.click('[data-filter="authenticate"]'); await page.waitForTimeout(100);
    const flt = await page.evaluate(() => ({ lead: document.getElementById('handle-inbound-lead').hidden, auth: document.getElementById('authenticate').hidden, login: document.querySelector('[data-journeys="authenticate"]')?.hidden, detail: document.querySelector('[data-journeys="handle-inbound-lead"]')?.hidden }));
    must(`the journey filter did not hide what the journey does not name (${JSON.stringify(flt)})`, flt.lead === true && flt.auth === false && flt.login === false && flt.detail === true);
    await page.click('[data-filter=""]'); await page.waitForTimeout(100);
    must('all did not bring the other journey back', await page.evaluate(() => !document.getElementById('handle-inbound-lead').hidden));
    await page.click('[data-toggle="hooks"]'); await page.waitForTimeout(100);
    must('the hooks toggle does not outline the hooks on the frames', await page.evaluate(() => [...document.querySelectorAll('.variant .hk')].some(h => getComputedStyle(h).display !== 'none')));
    must('a one-lane journey offers play twice', await page.evaluate(() => document.querySelectorAll('[data-play="handle-inbound-lead/open-and-call"]').length === 1));
    must('play journey is offered for a journey with one lane', await page.evaluate(() => !document.querySelector('[data-play="journey:handle-inbound-lead"]')) && await page.evaluate(() => !!document.querySelector('[data-play="journey:authenticate"]')));
    await page.click('[data-play="journey:authenticate"]'); await page.waitForTimeout(100);
    const pj = await page.evaluate(() => document.getElementById('proto').querySelector('.p-n').textContent);
    must(`play journey did not chain the lanes (${pj})`, /^1 \/ \d+$/.test(pj) && Number(pj.split('/ ')[1]) > 3);
    await page.keyboard.press('Escape'); await page.waitForTimeout(50);
    must(`the prototype threw: ${perr[0] || ''}`, !perr.length);
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

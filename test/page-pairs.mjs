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

export const OPERATOR = 'map and mockups pages at 1440×900, 1600×1000 and 1920×1080: no scroller overflows sideways, no page error, '
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

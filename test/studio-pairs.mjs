// The studio is a board a person reads and, served, the one place they decide from. Its promises, each
// a pair: every step of every journey has a column, drawn, built and per version; a decision made there
// goes through the file's own parser and only ever creates; the server hands out nothing outside
// .uxcli/; and the page is held to the instrument's own page probes, in a real browser, with the
// canvas actually panning, zooming and inspecting.
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import { fileURLToPath, pathToFileURL } from 'node:url';
import { writeStudio, decide, serveStudio } from '../src/studio.js';
import { launch } from '../src/browser.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE = path.join(ROOT, 'test', 'fixtures', 'crm');

export const OPERATOR = 'the fixture project as a board: one column per step of every journey, the picked drawing and the walk\'s finding in the model; a pick of a drawing that is not on disk refused, a valid one written with its hash, a second refused, a redraw with no note refused; the server answering the page and its data, refusing a path outside .uxcli/ and a pick it cannot parse; and in Chrome the page with no error, a canvas that moves when dragged and zoomed, a frame that fills the inspector, and the four page probes finding no fail on it';

export async function pair() {
  const problems = []; let checks = 0;
  const must = (what, cond) => { checks++; if (!cond) problems.push(what); };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-studio-'));
  fs.cpSync(FIXTURE, tmp, { recursive: true, filter: s => !/\/\.uxcli\/(index\.json|map|studio|mockups\/\.shots|mockups\/index\.html)$/.test(s) });

  // the board
  const r = await writeStudio(tmp, { viewport: '390x844' });
  const m = r.model;
  must(`the board was not written: ${(r.problems || []).join('; ')}`, m && fs.existsSync(r.page));
  if (!m) return { ok: false, checks, problems };
  const declared = r.model.journeys.reduce((n, j) => n + j.workflows.reduce((k, w) => k + w.steps.length, 0), 0);
  must('a step of a journey has no column', m.counts.steps === declared && declared > 0);
  const lead = m.journeys.find(j => j.id === 'handle-inbound-lead');
  const detail = lead?.workflows.flatMap(w => w.steps).find(s => s.after.state === 'agent.lead_detail');
  must('the picked drawing of agent.lead_detail is not on the board', detail?.design.pick?.pick === 'b-call-first' && detail.design.variants.every(v => v.shot));
  const html = fs.readFileSync(r.page, 'utf8');
  must('the page does not carry its model', html.includes('id="studio-data"') && html.includes('"handle-inbound-lead"'));

  // decisions: through the parser, create only
  const open = (await writeStudio(tmp)).model.journeys.flatMap(j => j.workflows.flatMap(w => w.steps)).map(s => s.design).find(d => d.variants.length && !d.pick);
  must('the fixture has no screen waiting for a pick', !!open);
  if (open) {
    const who = { type: 'person', ref: 'test' };
    const bad = decide(tmp, 'pick', { state: open.state, variant: 'not-a-drawing' }, who);
    must('a pick of a drawing that is not on disk was written', !bad.ok && bad.problems.some(p => p.includes('not a variant')));
    const ok = decide(tmp, 'pick', { state: open.state, variant: open.variants[0].name }, who);
    const doc = ok.ok ? JSON.parse(fs.readFileSync(path.join(tmp, ok.file), 'utf8')) : null;
    must(`a valid pick was not written with its hash: ${(ok.problems || []).join('; ')}`, ok.ok && /^[0-9a-f]{64}$/.test(doc?.sha256 || '') && doc.by.ref === 'test');
    const again = decide(tmp, 'pick', { state: open.state, variant: open.variants[0].name }, who);
    must('a second pick overwrote the first', !again.ok && again.problems.some(p => p.includes('already picked')));
  }
  const before = fs.existsSync(path.join(tmp, '.uxcli', 'proposals')) ? fs.readdirSync(path.join(tmp, '.uxcli', 'proposals')).length : 0;
  const note = decide(tmp, 'note', { journey: 'handle-inbound-lead', workflow: 'open-and-call', step: 's2', note: 'The call button belongs above the needs block.' }, { type: 'person', ref: 'test' });
  const pdoc = note.ok ? JSON.parse(fs.readFileSync(path.join(tmp, note.file), 'utf8')) : null;
  must(`a note on a frame was not written as a redesign proposal citing the walk: ${(note.problems || []).join('; ')}`, pdoc?.kind === 'redesign' && pdoc.status === 'proposed' && pdoc.target === 'journeys/handle-inbound-lead.json#s2' && fs.readdirSync(path.join(tmp, '.uxcli', 'proposals')).length === before + 1);
  { const { validate } = await import('./lib/json-schema.mjs'); const bad = pdoc ? validate(JSON.parse(fs.readFileSync(path.join(ROOT, 'schemas', 'proposal.schema.json'), 'utf8')), pdoc) : ['missing']; must(`the proposal a note wrote fails proposal.schema.json: ${bad.join('; ')}`, !bad.length); }
  must('an empty note was written', !decide(tmp, 'note', { journey: 'handle-inbound-lead', step: 's2', note: ' ' }).ok);
  const silent = decide(tmp, 'revise', { state: 'agent.workspace_ready', note: '  ' }, { type: 'person', ref: 'test' });
  must('a redraw with no note was written', !silent.ok);

  // the server and the browser
  let srv = null; let browser = null;
  try {
    srv = await serveStudio(tmp, { port: 0 });
    const base = srv.url;
    const get = async p => { const res = await fetch(base + p); return { status: res.status, text: await res.text() }; };
    must('the server did not answer the page', (await get('.uxcli/studio/index.html')).status === 200);
    const data = await get('.uxcli/studio/data.json');
    must('the server did not answer the model', data.status === 200 && JSON.parse(data.text).serve === true);
    must('the server handed out a file outside .uxcli/', (await get('..%2Fserver.mjs')).status === 404 && (await get('server.mjs')).status === 404);
    const junk = await fetch(base + 'api/pick', { method: 'POST', body: 'not json' });
    must('the server accepted a pick it could not parse', junk.status === 400);

    browser = await launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(base); await page.waitForTimeout(600);
    must(`the page threw: ${errors.join('; ')}`, !errors.length);
    must('the canvas does not carry a frame for every screen of every workflow', await page.locator('.frame').count() >= m.counts.steps + m.journeys.reduce((n, j) => n + j.workflows.filter(w => w.steps.length).length, 0));
    const t = () => page.evaluate(() => document.getElementById('world').style.transform);
    const t0 = await t();
    const st = await page.locator('#stage').boundingBox();
    await page.mouse.move(st.x + 8, st.y + 8); await page.mouse.down(); await page.mouse.move(st.x + 160, st.y + 120, { steps: 5 }); await page.mouse.up();
    const t1 = await t();
    must('dragging the canvas did not move it', t1 !== t0);
    await page.click('#zin'); must('zooming in did not scale the canvas', (await t()) !== t1);
    await page.click('.frame[data-id^="built|handle-inbound-lead"]'); await page.waitForTimeout(200);
    must('a frame did not fill the inspector', /Built · the last walk/.test(await page.textContent('#insp')));
    // the to-do bar: on a walked project the fix the walk asks for comes first; a click shows its screen
    { const { todos } = await import('../src/core/app-page.js'); const { gather } = await import('../src/dashboard.js'); const g = await gather(path.join(ROOT, 'examples', 'crm'));
      const t = todos(g.model, g.design); must(`on the example the first thing to do is not the failing lead screen: ${t[0]?.text}`, t[0]?.kind === 'fail' && /^Lead detail/.test(t[0].text) && !t.slice(1).some(x => x.go === t[0].go && x.kind === 'find')); }
    const todo = page.locator('#sheet .todo').first();
    must('the page has no to-do bar', (await todo.count()) === 1);
    const go = await todo.getAttribute('data-go'); await todo.click(); await page.waitForTimeout(200);
    must(`a to-do item did not show its screen on the canvas (${go})`, go.includes('|') ? (await page.locator('.frame.sel').count()) === 1 : (await page.locator(`.frame[data-state="${go}"]`).count()) > 0 || (await page.locator('.frame.sel').count()) === 1);
    for (const v of ['screens', 'runs', 'people', 'library']) { await page.click(`.tabs a[href="#${v}"]`); must(`the ${v} view did not open`, await page.isVisible(`#${v}`) && !(await page.isVisible('#stage'))); }
    await page.click('.tabs a[href="#journeys"]');
    await page.click('#zfit');
    // the instrument's own page probes, on the board
    const { runPage } = await import('../src/page.js');
    const out = path.join(tmp, 'probe'); fs.mkdirSync(out, { recursive: true });
    const res = await runPage(base + '.uxcli/studio/index.html', { browser, outDir: out });
    for (const p of res.probes || []) must(`studio: probe ${p.probe} says ${p.verdict}: ${p.why || ''}`, p.verdict !== 'fail');
    must('the page probes did not run on the studio', (res.probes || []).length >= 4);
  } catch (e) { problems.push(`studio in the browser: ${e.message}`); }
  finally { if (browser) await browser.close(); if (srv?.server) await new Promise(ok => srv.server.close(ok)); }
  fs.rmSync(tmp, { recursive: true, force: true });
  return { ok: !problems.length, checks, problems };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = await pair();
  console.log(r.ok ? `PASS studio · ${r.checks} checks` : 'FAIL ' + r.problems.join('\n     '));
  process.exit(r.ok ? 0 : 1);
}

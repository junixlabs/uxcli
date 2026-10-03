// The dashboard says what is missing as plainly as what is there. The pair: on the example, the screen
// whose walk failed C-001 reads fail, the picked screen names its pick, a journey whose packet keeps no
// steps reads as ran-with-its-verdict rather than as never walked, and the start of a journey that was
// never walked is "nothing to measure", not held; a project with no runs and no drawings is all gaps and
// no pass. Served, it switches folders, refuses a folder with no project, serves pictures only from
// under a folder's .uxcli/, and its four views find no fail with the page probes.
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import { fileURLToPath, pathToFileURL } from 'node:url';
import { gather, writeDashboard, serveDashboard } from '../src/dashboard.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXAMPLE = path.join(ROOT, 'examples', 'crm');
export const OPERATOR = 'on the CRM example and on a copy with no runs and no drawings: fail, pick, a run with no steps kept and an unwalked start each read as what they are, the bare copy is all gaps; served over both, the folder switch, a refused folder, pictures only from .uxcli/, and the four page probes on every view';

export async function pair() {
  const problems = []; let checks = 0;
  const must = (what, cond) => { checks++; if (!cond) problems.push(what); };
  const g = await gather(EXAMPLE);
  const row = st => g.matrix.rows.find(r => r.journey === 'handle-inbound-lead' && r.state === st);
  must('the call screen whose walk failed C-001 does not read fail', row('agent.call_started')?.cells.verdict.state === 'fail' && /C-001/.test(row('agent.call_started').cells.verdict.text));
  must('the picked lead screen does not name its pick', row('agent.lead_detail')?.cells.picked.text === 'b-call-first');
  must('a redraw asked is not waiting on a person', row('agent.call_started')?.cells.picked.state === 'open');
  const auth = g.matrix.rows.filter(r => r.journey === 'authenticate' && r.cells.walked.state !== 'na');
  must('a journey whose packet keeps no steps reads as never walked', auth.some(r => /^ran /.test(r.cells.walked.text) && r.cells.verdict.state === 'fail'));
  must('no review on the example, yet a reviewed cell is not a gap', g.matrix.rows.every(r => r.cells.reviewed.state === 'gap'));
  must('the runs view lost a packet', g.runs.length === 4 && g.runs.some(r => r.worst === 'blocked'));

  // a bare copy: the same declarations, no runs, no drawings — every evidence cell a gap, nothing held
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-dash-'));
  fs.cpSync(EXAMPLE, tmp, { recursive: true, filter: s => !/[\\/]\.uxcli[\\/](runs|mockups|versions|index\.json)/.test(s) });
  const b = await gather(tmp);
  const ev = ['drawn', 'picked', 'reviewed', 'walked', 'verdict', 'estimate', 'walkthrough'];
  must('a project with nothing measured shows a pass somewhere', b.matrix.rows.every(r => ev.every(c => ['gap', 'na'].includes(r.cells[c].state))));
  must('the start of a journey never walked reads as held', b.matrix.rows.filter(r => r.cells.verdict.state === 'na').every(r => r.cells.walked.state === 'gap'));
  must('the bare copy counts no fail', b.matrix.totals.fails === 0 && b.matrix.totals.gaps > b.matrix.rows.length * 5);

  const w = await writeDashboard(tmp);
  must('the written dashboard is missing a view', ['index', 'overview', 'runs', 'design', 'understanding'].every(v => fs.existsSync(path.join(tmp, '.uxcli', 'dashboard', `${v}.html`))));

  const s = await serveDashboard([EXAMPLE, tmp], { port: 0 });
  const { runPage } = await import('../src/page.js'); const { launch } = await import('../src/browser.js');
  const browser = await launch();
  try {
    const home = await (await fetch(s.url)).text();
    must('the folder switch does not list both folders', (home.match(/<option /g) || []).length === 2);
    const bad = await fetch(s.url + 'api/folders', { method: 'POST', body: 'path=' + encodeURIComponent(os.tmpdir()), headers: { 'content-type': 'application/x-www-form-urlencoded' }, redirect: 'manual' });
    must('a folder with no project was added', /missing=/.test(bad.headers.get('location') || ''));
    must('the server handed out a file outside .uxcli/', (await fetch(s.url + 'f/0/..%2F..%2Fpackage.json')).status === 404 && (await fetch(s.url + 'f/0/policy/policy.json')).status === 404);
    const other = await (await fetch(s.url + '?p=1&v=design')).text();
    must('the second folder\'s design view does not say what is not drawn', /not drawn/.test(other));
    for (const v of ['overview', 'runs', 'design', 'understanding']) {
      const r = await runPage(`${s.url}?p=0&v=${v}`, { browser });
      const fails = r.probes.filter(p => p.verdict === 'fail' || p.verdict === 'unmeasurable').map(p => `${p.probe} ${p.verdict}: ${p.why}`);
      must(`the ${v} view: ${fails.join('; ')}`, !fails.length);
    }
  } finally { await browser.close(); s.server.close(); fs.rmSync(tmp, { recursive: true, force: true }); }
  return { ok: !problems.length, checks, problems };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = await pair();
  console.log(r.ok ? `PASS dashboard · ${r.checks} checks` : 'FAIL ' + r.problems.join('\n     '));
  process.exit(r.ok ? 0 : 1);
}

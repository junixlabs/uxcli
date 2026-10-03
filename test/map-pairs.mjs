// The journey map, held by a pair. Drift means exactly two things — a state the run said did not
// hold, or a fail cited at the step — and nothing else: a step whose commitments all passed is not
// drift, a step with no run is not drift. A finding is listed once per fail and once per state that
// did not hold. The page carries no advice: no "should", no "recommend" outside the data it embeds.
import { mapModel, mapPage, mapCard } from '../src/core/map.js';
import fs from 'node:fs'; import path from 'node:path';
import { read, ROOT } from './example-data.mjs';
// Two real runs of the fixture CRM, tracked under test/fixtures/runs/, are the current shape; the
// example project's runs are older packets kept as they were.
const lab = name => ({ dir: `test/fixtures/runs/${name}`, run: JSON.parse(fs.readFileSync(path.join(ROOT, 'test', 'fixtures', 'runs', name, 'run.json'), 'utf8')) });

export const OPERATOR = 'drift only on a state not held or a fail at the step; a passing step and an unrun step are not drift; '
  + 'each fail and each unheld state is one finding; the picked mockup is the model frame and an unpicked screen has none; '
  + 'the page text outside the embedded model carries no advice';

export function pair() {
  const problems = []; let checks = 0;
  const must = (what, cond) => { checks++; if (!cond) problems.push(what); };
  const journeys = [read('journeys/handle-inbound-lead.json'), read('journeys/authenticate.json')];
  const commitments = ['C-001', 'C-002', 'C-003'].map(id => read(`commitments/${id}.json`));
  const lead = lab('crm-handle-inbound-lead'); const auth = lab('crm-authenticate');
  const runs = { 'handle-inbound-lead': { run: lead.run, base: '../' + lead.dir }, authenticate: { run: auth.run, base: '../' + auth.dir } };
  const mockups = { 'agent.lead_detail': { pick: 'b-call-first', variants: ['a-stacked', 'b-call-first'], shots: { 'b-call-first': '../mockups/.shots/agent.lead_detail/b-call-first.png' } }, 'agent.workspace_ready': { pick: null, variants: ['a-list'], shots: {} } };
  const m = mapModel({ project: { name: 'x' }, journeys, commitments, actors: [read('understanding/actors/real-estate-agent.json')], insights: [], runs, mockups, level: { story: 'L2' } });
  const J = id => m.journeys.find(j => j.id === id); const steps = j => j.workflows.flatMap(w => w.steps);

  // must-pass: drift where the run said so
  const s2 = steps(J('handle-inbound-lead')).find(s => s.id === 's2');
  must('s2 (C-001 fail) is not drift', s2.drift && s2.verdicts.some(v => v.value === 'fail' && v.commitment === 'C-001'));
  const se = steps(J('authenticate')).find(s => s.workflow === 'server-error');
  must('server-error/r1 (state not held) is not drift', se.drift && se.notHeld);
  // must-fail: drift where nothing failed
  const wp = steps(J('authenticate')).find(s => s.workflow === 'wrong-password');
  must('wrong-password/r1 (held, no fail) is drift', !wp.drift);
  const unrun = mapModel({ journeys, commitments, runs: {}, mockups: {} });
  must('an unrun step is drift', steps(unrun.journeys[0]).every(s => !s.drift && !s.measured));
  // findings: one per fail, one per unheld state
  const fails = [lead.run, auth.run].flatMap(r => r.verdicts.filter(v => v.value === 'fail')).length;
  const unheld = [lead.run, auth.run].flatMap(r => r.steps.filter(s => s.after?.held === false)).length;
  must(`findings ${m.findings.length} ≠ fails ${fails} + unheld ${unheld}`, m.findings.length === fails + unheld);
  // model frames
  must('the picked mockup is not the model frame', s2.before.mock.shot?.endsWith('b-call-first.png') && s2.before.mock.variant === 'b-call-first');
  const s1 = steps(J('handle-inbound-lead')).find(s => s.id === 's1');
  must('an unpicked screen has a model frame', s1.before.mock.shot === null && s1.before.mock.variants === 1);
  // shots resolve into the run directory
  must('a run shot does not point into the run directory', s2.after.shot === `../${lead.dir}/artifacts/open-and-call-s2-after.png`);
  // commitments in scope carry their verdict
  must('C-001 is not on s2 with its verdict', s2.commitments.some(c => c.id === 'C-001' && c.verdict === 'fail'));
  // the page: no advice in the chrome
  const page = mapPage(m); const chrome = page.slice(page.indexOf('<script>')).replace(/const M = .*?;\n/s, '');
  must('the page chrome advises', !/\b(should|recommend|suggest)\b/i.test(chrome));
  must('the page does not embed the model', page.includes('"journeys"') && page.includes('handle-inbound-lead'));
  must('the page is not a complete document', /^<!doctype html>/.test(page) && /<\/html>\s*$/.test(page));
  // the card
  const card = mapCard(m);
  must('the card does not name the journeys with their verdicts', /FAIL\s+handle-inbound-lead/.test(card) && /2 findings|3 findings|4 findings/.test(card));
  return { ok: !problems.length, checks, problems };
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  const r = pair(); console.log(r.ok ? `PASS map · ${r.checks} checks` : 'FAIL ' + r.problems.join('\n     ')); process.exit(r.ok ? 0 : 1);
}

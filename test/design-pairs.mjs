// The design step, when a project's policy holds the work to one. The pair: on a page whose walk has
// nothing wrong, `project.design: drawn` turns exit 0 into exit 3 while a walked screen has fewer than
// two drawings or no complete lens review, and back to 0 once every one has both; `picked` holds it
// open until a person's pick exists; a walk with a fail keeps its exit 2 whatever the design step says;
// `off` and an absent key change nothing; a value that is not one of the three is refused by the policy.
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import { fileURLToPath, pathToFileURL } from 'node:url';
import { designGate, exitWithDesign, walkedStates } from '../src/core/design-gate.js';
import { parsePolicy } from '../src/core/model/policy.js';
import { library, mockupHash } from '../src/lens.js';
import { reviewTemplate } from '../src/core/model/lens.js';
import { validate } from './lib/json-schema.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE = path.join(ROOT, 'test', 'fixtures', 'crm');
export const OPERATOR = 'on the CRM fixture with a lead page whose walk exits 0: policy design "drawn" makes the walk exit 3 naming the screens with one drawing or no review, and 0 once each has two drawings and a complete review; "picked" stays at 3 until a pick; the fixture\'s own failing page keeps exit 2; "off" changes nothing; "yes" is refused';

export async function pair() {
  const problems = []; let checks = 0;
  const must = (what, cond) => { checks++; if (!cond) problems.push(what); };

  // pure: the gate's arithmetic
  const sc = (id, n, reviewed, pick) => ({ id, variants: Array.from({ length: n }, (_, i) => `v${i}`), reviews: reviewed ? { v0: [{ lens: 'workspace', value: {}, problems: [] }] } : {}, pick: pick ? { pick: 'v0', parts: {} } : null, problems: [] });
  const g = designGate([sc('a', 2, true, false), sc('b', 1, false, false)], ['a', 'b', 'c'], 'drawn');
  must('a screen with two drawings and a review was held open under drawn', g.screens[0].missing.length === 0);
  must('a screen with one drawing and no review was not held for both', g.screens[1].missing.join() === 'draw,review');
  must('a walked screen with no folder at all was not held', g.screens[2].missing.join() === 'draw,review' && g.open === 2);
  must('picked did not ask for the pick', designGate([sc('a', 2, true, false)], ['a'], 'picked').screens[0].missing.join() === 'pick');
  must('a picked, reviewed screen was held open under picked', designGate([sc('a', 2, true, true)], ['a'], 'picked').open === 0);
  must('off produced a gate', designGate([], ['a'], 'off') === null && designGate([], ['a'], undefined) === null);
  must('an open design step changed a fail or a run that could not go', exitWithDesign(2, g) === 2 && exitWithDesign(1, g) === 1);
  must('an open design step did not make a clean run exit 3', exitWithDesign(0, g) === 3 && exitWithDesign(0, { open: 0 }) === 0);
  must('walked states did not skip fixture steps', walkedStates({ steps: [{ kind: 'fixture', after: { state: 'x' } }, { before: { state: 'a' }, after: { state: 'b' } }] }).join() === 'a,b');

  // the policy refuses what is not one of the three, and the schema agrees
  const pol = JSON.parse(fs.readFileSync(path.join(FIXTURE, '.uxcli', 'policy', 'policy.json'), 'utf8'));
  const schema = JSON.parse(fs.readFileSync(path.join(ROOT, 'schemas', 'policy.schema.json'), 'utf8'));
  const withD = d => ({ ...pol, project: { ...pol.project, design: d } });
  must('policy accepted design "yes"', parsePolicy(withD('yes')).problems.some(p => p.includes('project.design')) && validate(schema, withD('yes')).length > 0);
  must('policy refused design "picked"', !parsePolicy(withD('picked')).problems.length && !validate(schema, withD('picked')).length);

  // live: the walk, at 390×844
  const { serve } = await import('../src/demo.js'); const { runJourney } = await import('../src/journey.js');
  const stage = (lead, design) => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-design-'));
    fs.cpSync(FIXTURE, tmp, { recursive: true, filter: s => !/[\\/]\.uxcli[\\/](runs|index\.json)/.test(s) });
    if (lead) fs.copyFileSync(lead, path.join(tmp, 'pages', 'lead.html'));
    const pf = path.join(tmp, '.uxcli', 'policy', 'policy.json'); const p = JSON.parse(fs.readFileSync(pf, 'utf8'));
    if (design) p.project.design = design; else delete p.project.design; fs.writeFileSync(pf, JSON.stringify(p, null, 1));
    return tmp;
  };
  const setDesign = (tmp, d) => { const pf = path.join(tmp, '.uxcli', 'policy', 'policy.json'); const p = JSON.parse(fs.readFileSync(pf, 'utf8')); p.project.design = d; fs.writeFileSync(pf, JSON.stringify(p, null, 1)); };
  const walk = async tmp => { const { child, port } = await serve(tmp); try { return (await runJourney(path.join(tmp, '.uxcli', 'journeys', 'handle-inbound-lead.json'), { origin: `http://localhost:${port}`, viewport: '390x844' })).run; } finally { child.kill(); } };

  const good = stage(path.join(ROOT, 'test', 'fixtures', 'design-gate', 'lead.html'), null);
  try {
    let run = await walk(good);
    must(`the passing page did not exit 0 with no design key (exit ${run.exit})`, run.exit === 0 && !run.design);
    setDesign(good, 'off'); run = await walk(good);
    must('design off changed the walk', run.exit === 0 && !run.design);
    setDesign(good, 'drawn'); run = await walk(good);
    must(`drawn did not hold a clean walk at exit 3 (exit ${run.exit})`, run.exit === 3 && run.design?.open === 3);
    must('drawn did not name the call screen as needing a second drawing', run.design?.screens.find(s => s.state === 'agent.call_started')?.missing.includes('draw'));
    must('the run packet does not keep the design step', JSON.parse(fs.readFileSync(path.join(good, '.uxcli', 'runs', fs.readdirSync(path.join(good, '.uxcli', 'runs')).filter(d => d.startsWith('R-')).sort().at(-1), 'run.json'), 'utf8')).design?.open === 3);
    must('the verdicts changed under the design step', run.verdicts.every(v => v.value !== 'fail'));

    // draw the second variant of the call screen and review one drawing of each walked screen
    const md = path.join(good, '.uxcli', 'mockups');
    fs.copyFileSync(path.join(md, 'agent.call_started', 'a-banner.html'), path.join(md, 'agent.call_started', 'b-inline.html'));
    const lens = library().lenses.find(l => l.id === 'workspace');
    const by = { type: 'agent', ref: 'design-pairs', onBehalfOf: 'the test' };
    for (const [state, variant] of [['agent.workspace_ready', 'a-list'], ['agent.lead_detail', 'b-call-first']]) {
      const doc = reviewTemplate(lens, { kind: 'mockup', state, variant, sha256: mockupHash(good, state, variant) }, by);
      for (const k of Object.keys(doc.answers)) doc.answers[k] = { verdict: 'n/a', note: 'the pair checks the gate, not the drawing' };
      fs.writeFileSync(path.join(md, state, `${variant}.workspace.review.json`), JSON.stringify(doc));
    }
    run = await walk(good);
    must(`one screen still unreviewed did not keep exit 3 (exit ${run.exit}, open ${run.design?.open})`, run.exit === 3 && run.design?.open === 1);
    const doc = reviewTemplate(lens, { kind: 'mockup', state: 'agent.call_started', variant: 'b-inline', sha256: mockupHash(good, 'agent.call_started', 'b-inline') }, by);
    for (const k of Object.keys(doc.answers)) doc.answers[k] = { verdict: 'n/a', note: 'the pair checks the gate, not the drawing' };
    fs.writeFileSync(path.join(md, 'agent.call_started', 'b-inline.workspace.review.json'), JSON.stringify(doc));
    run = await walk(good);
    must(`every walked screen drawn twice and reviewed did not exit 0 (exit ${run.exit}, open ${run.design?.open})`, run.exit === 0 && run.design?.open === 0);
    setDesign(good, 'picked'); run = await walk(good);
    must(`picked did not hold the unpicked call screen (exit ${run.exit})`, run.exit === 3 && run.design?.screens.filter(s => s.missing.length).map(s => s.state).join() === 'agent.call_started');
  } finally { fs.rmSync(good, { recursive: true, force: true }); }

  const bad = stage(null, 'drawn');
  try {
    const run = await walk(bad);
    must(`the fixture's failing page did not keep exit 2 under the design step (exit ${run.exit})`, run.exit === 2 && run.design?.open > 0);
  } finally { fs.rmSync(bad, { recursive: true, force: true }); }
  return { ok: !problems.length, checks, problems };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = await pair();
  console.log(r.ok ? `PASS design · ${r.checks} checks` : 'FAIL ' + r.problems.join('\n     '));
  process.exit(r.ok ? 0 : 1);
}

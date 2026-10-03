// Experience metrics read the trace of a walk. Each is a pair: a clean walk where it must stay silent,
// and the same walk with one thing a person would feel planted — a wait, a control below the fold, an
// answer asked for twice, a step that does not arrive, an extra step — where it must speak. The example
// project's last walk must surface the defect its own commitment C-001 is about.
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import { fileURLToPath, pathToFileURL } from 'node:url';
import { experience, compareExperience, KLM } from '../src/core/experience.js';
import { experiences, experiencePage } from '../src/experience.js';
import { validate } from './lib/json-schema.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clone = o => JSON.parse(JSON.stringify(o));

export const OPERATOR = 'a clean three-step walk with no finding, against the same walk made to settle in 2.4 s, to need its button two scrolls down, to ask for an email typed one step earlier, to miss the state a step must reach, and to take one more step; an error answered with the typed answer kept and a message announced, against one that clears the answer and one that announces nothing, and a packet that never recorded announcements, which is not silence; a navigation that keeps its order or only gains an item, against one whose items swap; the estimate grows by the operators of the planted step and nothing else; a comparison of the two walks names what moved and which findings came and went; a fixture step is not a step the person takes; and the example project\'s last walk, whose call button C-001 says is reachable without scrolling, must report it two scrolls away';

const ui = (target, extra = {}) => ({ type: 'ui', target, inViewportWithoutScroll: true, scrollsNeeded: 0, viewport: '390x844', rect: { x: 20, y: 300, w: 350, h: 48, viewport: { w: 390, h: 844 } }, ...extra });
const typed = (chars, value) => ({ typed: { chars, value } });
const CLEAN = {
  journey: { ref: 'journeys/checkout.json' }, ranAt: '2026-10-03T00:00:00Z',
  steps: [
    { id: 'f0', kind: 'fixture', ms: 400 },
    { id: 's1', workflow: 'buy', action: 'type the email and continue', after: { state: 'details', held: true }, interactions: [ui('input[name=email]', typed(17, 'sha1_8:aaaa1111')), ui('[data-uxcli=continue]')], timing: { toStable: 80 }, shots: ['buy-s1-before.png', 'buy-s1-after.png'] },
    { id: 's2', workflow: 'buy', action: 'type the address and continue', after: { state: 'review', held: true }, interactions: [ui('input[name=address]', typed(24, 'sha1_8:bbbb2222')), ui('[data-uxcli=continue]')], timing: { toStable: 300 }, shots: ['buy-s2-before.png', 'buy-s2-after.png'] },
    { id: 's3', workflow: 'buy', action: 'place the order', after: { state: 'done', held: true }, interactions: [ui('[data-uxcli=place-order]')], timing: { toStable: 600 }, shots: ['buy-s3-before.png', 'buy-s3-after.png'] },
  ],
};

export async function pair() {
  const problems = []; let checks = 0;
  const must = (what, cond) => { checks++; if (!cond) problems.push(what); };
  const metrics = r => r.findings.map(f => f.metric);

  // must-pass: the clean walk
  const clean = experience(CLEAN);
  must(`the clean walk reported ${JSON.stringify(clean.findings)}`, clean.findings.length === 0);
  must('a fixture step was counted as a step the person takes', clean.totals.steps === 3);
  must('the clean totals are wrong', clean.totals.clicks === 3 && clean.totals.fields === 2 && clean.totals.chars === 41 && clean.totals.scrolls === 0 && clean.totals.reached === 3);
  const click = KLM.M + KLM.P + 2 * KLM.B; const field = n => click + 2 * KLM.H + n * KLM.K;
  const want = Math.round((field(17) + click + 0.08 + field(24) + click + 0.3 + click + 0.6) * 10) / 10;
  must(`the estimate ${clean.totals.klmSeconds} s is not the operators' sum ${want} s`, Math.abs(clean.totals.klmSeconds - want) < 0.21);
  must('a response band is wrong', clean.steps.map(s => s.response).join(' ') === 'instant flow flow');

  // must-fail: each thing a person would feel, planted once
  const slow = clone(CLEAN); slow.steps[3].timing.toStable = 2400;
  must('a 2.4 s wait was not reported', metrics(experience(slow)).includes('response'));
  const lost = clone(CLEAN); lost.steps[3].timing.toStable = 12000;
  must('a 12 s wait was not reported as lost attention', experience(lost).findings.some(f => f.metric === 'response' && /10 s/.test(f.what)));
  const far = clone(CLEAN); far.steps[3].interactions[0] = ui('[data-uxcli=place-order]', { inViewportWithoutScroll: false, scrollsNeeded: 2 });
  const farR = experience(far);
  must('a button two scrolls down was not reported', farR.findings.some(f => f.metric === 'reach' && f.step === 's3' && /2 scrolls/.test(f.what) && f.rect));
  must('scrolls did not add to the estimate', farR.totals.klmSeconds > clean.totals.klmSeconds && farR.totals.scrolls === 2);
  const twice = clone(CLEAN); twice.steps[2].interactions[0] = ui('input[name=confirm-email]', typed(17, 'sha1_8:aaaa1111'));
  must('an answer typed twice was not reported', experience(twice).findings.some(f => f.metric === 'asked-twice' && f.step === 's2' && /s1/.test(f.what)));
  const other = clone(twice); other.steps[2].workflow = 'another';
  must('the same value in another workflow was reported as asked twice', !metrics(experience(other)).includes('asked-twice'));
  const miss = clone(CLEAN); miss.steps[3].after = { state: 'done', held: false, what: '[data-uxcli=order-number] visible: false' };
  must('a step that did not arrive was not reported', experience(miss).findings.some(f => f.metric === 'not-reached' && /order-number/.test(f.what)));
  const longer = clone(CLEAN); longer.steps.splice(3, 0, { id: 's2b', workflow: 'buy', action: 'confirm the address', after: { state: 'confirmed', held: true }, interactions: [ui('[data-uxcli=confirm]')], timing: { toStable: 100 }, shots: [] });
  const longR = experience(longer);
  must('an extra step did not add one step and one click', longR.totals.steps === 4 && longR.totals.clicks === 4);
  must('an extra step did not add its operators to the estimate', Math.abs(longR.totals.klmSeconds - clean.totals.klmSeconds - (click + 0.1)) < 0.21);

  // recovery: an error answer keeps what was typed and says so; planted, it does neither
  const errStep = (kept, announced) => ({ id: 'e1', workflow: 'buy', action: 'continue while the server fails', after: { state: 'details-error', held: true },
    interactions: [ui('input[name=email]', { typed: { chars: 17, value: 'sha1_8:cccc3333', keptAfter: kept } }), ui('[data-uxcli=continue]'), { type: 'api', request: 'POST /api/details', status: 500, ms: 40 }],
    timing: { toStable: 90 }, shots: [], announced, nav: [] });
  const okErr = clone(CLEAN); okErr.steps.push({ ...errStep(true, ['alert']), workflow: 'server-error' });
  must(`an error that kept the answer and announced itself was reported: ${JSON.stringify(experience(okErr).findings)}`, !metrics(experience(okErr)).includes('recovery'));
  const cleared = clone(CLEAN); cleared.steps.push({ ...errStep(false, ['alert']), workflow: 'server-error' });
  must('an error that cleared the typed answer was not reported', experience(cleared).findings.some(f => f.metric === 'recovery' && /no longer holds/.test(f.what)));
  const pw = clone(CLEAN); const p = errStep(true, ['alert']); p.interactions.unshift(ui('input[name=password]', { typed: { chars: 12, value: 'sha1_8:dddd4444', keptAfter: false, secret: true } })); pw.steps.push({ ...p, workflow: 'server-error' });
  must('a password cleared after the error was reported as a lost answer', !metrics(experience(pw)).includes('recovery'));
  const silent = clone(CLEAN); silent.steps.push({ ...errStep(true, []), workflow: 'server-error' });
  must('an error nothing announced was not reported', experience(silent).findings.some(f => f.metric === 'recovery' && /announced/.test(f.what)));
  const unknownAnn = clone(CLEAN); const u = errStep(true, undefined); delete u.announced; unknownAnn.steps.push({ ...u, workflow: 'server-error' });
  must('a packet that never recorded announcements was read as silence', !metrics(experience(unknownAnn)).includes('recovery'));
  // consistency: one navigation, the same order on every screen; planted, two items swap
  const NAV = ['Home', 'Shop', 'Cart', 'Account'];
  const withNav = order => { const r = clone(CLEAN); r.steps[1].nav = [{ label: 'Main', items: NAV }]; r.steps[2].nav = [{ label: 'Main', items: NAV }]; r.steps[3].nav = [{ label: 'Main', items: order }]; return r; };
  must('the same navigation on every screen was reported', !metrics(experience(withNav(NAV))).includes('consistency'));
  must('a navigation that only gained an item was reported', !metrics(experience(withNav([...NAV, 'Help']))).includes('consistency'));
  must('two navigation items that swapped places were not reported', experience(withNav(['Home', 'Cart', 'Shop', 'Account'])).findings.some(f => f.metric === 'consistency' && f.step === 's3' && /Main/.test(f.what)));

  // alternatives are not a longer journey: a second workflow is totalled on its own
  const alt = clone(CLEAN); alt.steps.push({ id: 'r1', workflow: 'card-declined', action: 'place the order with a declined card', after: { state: 'declined', held: true }, interactions: [ui('[data-uxcli=place-order]')], timing: { toStable: 200 }, shots: [] });
  const altR = experience(alt);
  must('an alternative workflow was added to the happy path\'s totals', altR.totals.steps === 3 && altR.workflows.length === 2 && altR.workflows[1].totals.steps === 1);
  // versions: the comparison names what moved
  const cmp = compareExperience(clean, farR);
  must('the comparison did not name the scrolls that appeared', cmp.totals.scrolls.delta === 2 && cmp.introduced.length === 1 && cmp.fixed.length === 0);
  const back = compareExperience(farR, clean);
  must('the comparison did not name the finding that went away', back.fixed.length === 1 && back.introduced.length === 0);

  // the example project: its last walk carries the defect C-001 is signed against
  const ex = experiences(path.join(ROOT, 'examples', 'crm'));
  const lead = ex.find(x => x.report.journey === 'handle-inbound-lead');
  must('the example\'s handle-inbound-lead walk was not found', !!lead);
  must('the example\'s call button was not reported two scrolls away at 390x844', !!lead && lead.report.findings.some(f => f.metric === 'reach' && /call-action/.test(f.what) && /2 scrolls/.test(f.what) && /390x844/.test(f.what)));

  // the shapes: every recorded step fits the trace schema, every report the experience schema
  const S = name => JSON.parse(fs.readFileSync(path.join(ROOT, 'schemas', `${name}.schema.json`), 'utf8'));
  const runsDirs = ['examples/crm/.uxcli/runs', 'test/fixtures/runs'].map(d => path.join(ROOT, d)).filter(d => fs.existsSync(d));
  for (const d of runsDirs) for (const r of fs.readdirSync(d)) { const f = path.join(d, r, 'run.json'); if (!fs.existsSync(f)) continue;
    for (const st of JSON.parse(fs.readFileSync(f, 'utf8')).steps || []) { const bad = validate(S('trace'), st); must(`${path.relative(ROOT, f)} step ${st.id} fails trace.schema.json: ${bad.slice(0, 2).join('; ')}`, !bad.length); } }
  for (const r of [clean, farR, experience(cleared), experience(withNav(['Home', 'Cart', 'Shop', 'Account']))]) { const bad = validate(S('experience'), r); must(`a report fails experience.schema.json: ${bad.slice(0, 2).join('; ')}`, !bad.length); }
  { const raw = clone(CLEAN.steps[1]); raw.interactions[0].typed = { chars: 17, value: 'agent@example.com' };
    must('a step carrying a typed value instead of its hash fits the trace schema', validate(S('trace'), raw).length > 0); }
  { const bad = clone(clean); bad.findings = [{ metric: 'taste', step: 's1', what: 'ugly', source: 'me' }];
    must('a finding with a metric uxcli does not have fits the experience schema', validate(S('experience'), bad).length > 0); }

  // the page: written where asked, one card per step, the pinned finding drawn as a box
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-exp-'));
  fs.mkdirSync(path.join(tmp, 'artifacts')); fs.writeFileSync(path.join(tmp, 'artifacts', 'buy-s3-before.png'), Buffer.from('89504e470d0a1a0a', 'hex'));
  const out = experiencePage([{ dir: tmp, report: farR }], path.join(tmp, 'experience', 'index.html'));
  const html = fs.readFileSync(out, 'utf8');
  must('the page does not carry one card per step', (html.match(/<article class="step/g) || []).length === 3);
  must('the page does not draw the pinned finding on its step\'s screenshot', (html.match(/class="box"/g) || []).length === 1 && html.includes('../artifacts/buy-s3-before.png'));
  must('the page says a finding is a pass or a fail', !/\b(passed|failed)\b/i.test(html.replace(/never a fail and never a pass/g, '')));
  fs.rmSync(tmp, { recursive: true, force: true });
  return { ok: !problems.length, checks, problems };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = await pair();
  console.log(r.ok ? `PASS experience · ${r.checks} checks` : 'FAIL ' + r.problems.join('\n     '));
  process.exit(r.ok ? 0 : 1);
}

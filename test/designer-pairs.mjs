// The designer's brain, held by a pair: the project's profile wins field by field over the global one;
// a decision closes only over two grounded options, after a challenge when the owner overrode or a
// rule was in conflict, after a clarify when the feedback was unclear, and never by an agent on a topic
// the profile says it asks; context feedback is never learned as taste; a preference settles at three
// for, is global only across two projects, and learn writes no profile. All under a temporary UXCLI_HOME.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseProfile, parseDecision, mergeProfiles, neutralProfile } from '../src/core/model/designer.js';
import { learn } from '../src/core/designer/learn.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EX = path.join(ROOT, 'examples/crm/.uxcli/designer');
const readJson = f => JSON.parse(fs.readFileSync(f, 'utf8'));

export const OPERATOR = 'the example profile and decision parse; the project profile wins per field and per axis and only it may set aside a foundation rule, by a person; a profile ranking taste above the accessibility standard is refused; '
  + 'a decision closed over one option, over an option with no ground, as owner-overrode or agent-convinced with no challenge, with a rule-conflict and no challenge, with unclear feedback and no clarify, by an agent on a topic the profile asks or on nobody\'s behalf, or learning taste from context-only feedback is refused; '
  + 'three agreed decisions settle a preference in the project, two projects make it global and one does not, a preference the other way counts against, context feedback becomes an insight and a kept rule-conflict an exception; '
  + 'designer init only creates, and learn --apply writes taste.json and leaves every profile byte for byte';

export async function pair() {
  const problems = []; let checks = 0;
  const must = (what, cond) => { checks++; if (!cond) problems.push(what); };
  const prevHome = process.env.UXCLI_HOME;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-designer-'));
  process.env.UXCLI_HOME = path.join(tmp, 'home');
  try {
    const D = await import('../src/designer.js');
    const cat = D.catalog().value;
    const owner = { type: 'person', ref: 'owner' }, agent = { type: 'agent', ref: 'claude', onBehalfOf: 'owner' };

    // the profile
    const exProfile = readJson(path.join(EX, 'profile.json'));
    must(`the example profile was refused: ${parseProfile(exProfile, { catalog: cat, project: true }).problems.join('; ')}`, !parseProfile(exProfile, { catalog: cat, project: true }).problems.length);
    const neutral = neutralProfile(owner, '2026-10-14');
    must('the neutral profile was refused', !parseProfile(neutral, { catalog: cat }).problems.length);
    const merged = mergeProfiles({ ...neutral, defaults: { ...neutral.defaults, C: ['C1'], D: ['D01'] }, never: ['global never'] }, { ...neutral, defaults: { ...neutral.defaults, C: ['C2'] } });
    must('the project did not win its own axis', merged.defaults.C.codes[0] === 'C2' && merged.defaults.C.from === 'project');
    must('an axis the project leaves null did not fall back to global', merged.defaults.D?.codes[0] === 'D01' && merged.defaults.D.from === 'global');
    must('a field the project sets did not win whole', mergeProfiles({ ...neutral, never: ['g'] }, { ...neutral, never: ['p'] }).never.join() === 'p');
    must('taste ranked above the accessibility standard was accepted', parseProfile({ ...neutral, priority: ['taste', 'accessibility-standard'] }).problems.some(p => /taste never outranks/.test(p)));
    must('a global profile setting aside a foundation rule was accepted', parseProfile({ ...neutral, exceptions: [] }, { catalog: cat }).problems.some(p => /only a project/.test(p)));
    must('an agent setting aside a foundation rule was accepted', parseProfile({ ...neutral, exceptions: [{ rule: 'contrast', why: 'x', decision: 'D-0001', by: agent }] }, { catalog: cat, project: true }).problems.some(p => /never an agent/.test(p)));
    must('a default code the catalog does not hold was accepted', parseProfile({ ...neutral, defaults: { ...neutral.defaults, D: ['D99'] } }, { catalog: cat }).problems.some(p => /not in the catalog/.test(p)));

    // a decision
    const ex = readJson(path.join(EX, 'decisions/D-0001.json'));
    const ok = d => parseDecision(d, { profile: mergeProfiles(null, exProfile), catalog: cat });
    must(`the example decision was refused: ${ok(ex).problems.join('; ')}`, !ok(ex).problems.length);
    const agreed = { ...ex, feedback: [], challenge: undefined, resolution: { state: 'agreed', chosen: 'c2', by: owner, why: 'yes' } }; delete agreed.challenge;
    must(`a plain agreed decision was refused: ${ok(agreed).problems.join('; ')}`, !ok(agreed).problems.length);
    const has = (d, re) => ok(d).problems.some(p => re.test(p));
    must('a decision closed over one option was accepted', has({ ...agreed, options: ex.options.slice(0, 1) }, /two options at least/));
    must('a decision closed over an ungrounded option was accepted', has({ ...agreed, options: [ex.options[0], { ...ex.options[1], grounds: [] }] }, /carries a ground/));
    must('owner-overrode with no challenge was accepted', has({ ...agreed, resolution: { state: 'owner-overrode', chosen: 'c1', by: owner, why: 'mine' } }, /no challenge/));
    must('agent-convinced with no challenge was accepted', has({ ...agreed, resolution: { ...ex.resolution } }, /no challenge/));
    must('a rule-conflict closed with no challenge was accepted', has({ ...agreed, feedback: [{ by: owner, said: 'lighter grey text', kind: 'rule-conflict' }] }, /rule-conflict closes only after/));
    must('unclear feedback closed with no clarify was accepted', has({ ...agreed, feedback: [{ by: owner, said: 'make it pop', kind: 'unclear' }] }, /clarify/));
    must('unclear feedback closed after a clarify was refused', !has({ ...agreed, feedback: [{ by: owner, said: 'make it pop', kind: 'unclear' }], clarify: [{ asked: 'Pop how: contrast, size or colour?', answer: 'size' }] }, /clarify/));
    must('an agent closing a decision the profile asks was accepted', has({ ...agreed, resolution: { ...agreed.resolution, by: agent } }, /which the profile says it asks/));
    must('an agent closing a topic it decides alone was refused', !has({ ...agreed, about: 'spacing', resolution: { ...agreed.resolution, by: agent }, learn: { scope: 'none', signals: [] } }, /says it asks/));
    must('an agent signing on nobody\'s behalf was accepted', has({ ...agreed, about: 'spacing', resolution: { ...agreed.resolution, by: { type: 'agent', ref: 'claude' } }, learn: { scope: 'none', signals: [] } }, /onBehalfOf/));
    must('taste learned from context-only feedback was accepted', has({ ...agreed, feedback: [{ by: owner, said: 'our agents wear gloves', kind: 'context' }] }, /context — a fact about the users/));
    must('a rule-conflict learned globally was accepted', has({ ...ex, feedback: [{ by: owner, said: 'x', kind: 'rule-conflict' }], learn: { scope: 'global', signals: [] } }, /never learned globally/));
    must('an agreed decision that chose another option was accepted', has({ ...agreed, resolution: { ...agreed.resolution, chosen: 'c1' } }, /that is owner-overrode/));
    must('a signal with a code the catalog does not hold was accepted', has({ ...agreed, learn: { scope: 'project', signals: [{ axis: 'C', prefer: 'C9', over: 'C1' }] } }, /codes in the catalog/));

    // learning: settled at three, global across two projects, against counted, context and rule-conflicts kept out of taste
    const sig = (id, scope = 'global', prefer = 'C2', over = 'C1') => ({ ...agreed, id, learn: { scope, signals: [{ axis: 'C', prefer, over }] } });
    const t = rows => learn(rows).taste.find(x => x.prefer === 'C2');
    must('three agreed decisions did not settle', t(['D-0001', 'D-0002', 'D-0003'].map(id => ({ project: 'p', decision: sig(id) }))).settled);
    must('two agreed decisions settled', !t(['D-0001', 'D-0002'].map(id => ({ project: 'p', decision: sig(id) }))).settled);
    must('one project\'s taste became global', !t(['D-0001', 'D-0002', 'D-0003'].map(id => ({ project: 'p', decision: sig(id) }))).global);
    must('taste across two projects did not become global', t([['p', 'D-0001'], ['p', 'D-0002'], ['q', 'D-0001']].map(([project, id]) => ({ project, decision: sig(id) }))).global);
    must('a project-scope decision made taste global', !t([['p', 'D-0001'], ['p', 'D-0002'], ['q', 'D-0003']].map(([project, id]) => ({ project, decision: sig(id, id === 'D-0003' ? 'project' : 'global') }))).global);
    must('two preferences the other way did not unsettle', !t([...['D-0001', 'D-0002', 'D-0003'].map(id => ({ project: 'p', decision: sig(id) })), ...['D-0004', 'D-0005'].map(id => ({ project: 'p', decision: sig(id, 'global', 'C1', 'C2') }))]).settled);
    must('an open decision was learned from', !learn([{ project: 'p', decision: { ...sig('D-0001'), resolution: { state: 'open' } } }]).taste.length);
    const ctx = learn([{ project: 'p', decision: { ...agreed, feedback: [{ by: owner, said: 'our agents wear gloves', kind: 'context' }], learn: { scope: 'none', signals: [] } } }]);
    must('context feedback became taste, or was not proposed as an insight', !ctx.taste.length && ctx.insights.length === 1);
    must('a kept rule-conflict was not proposed as an exception', learn([{ project: 'p', decision: { ...ex, feedback: [{ by: owner, said: 'x', kind: 'rule-conflict' }], resolution: { state: 'owner-overrode', chosen: 'c1', by: owner, why: 'brand' }, learn: { scope: 'none', signals: [] } } }]).exceptions.length === 1);

    // on disk: init only creates, learn writes taste and never a profile
    const proj = path.join(tmp, 'proj'); fs.mkdirSync(path.join(proj, '.uxcli', 'policy'), { recursive: true });
    fs.writeFileSync(path.join(proj, '.uxcli', 'project.json'), JSON.stringify({ id: 'proj', name: 'proj' }));
    must('designer init without --apply wrote', D.initDesigner(proj, { global: true, by: owner }).status === 'create' && !fs.existsSync(path.join(process.env.UXCLI_HOME, 'designer', 'profile.json')));
    D.initDesigner(proj, { global: true, apply: true, by: owner }); D.initDesigner(proj, { apply: true, by: owner });
    const gp = path.join(process.env.UXCLI_HOME, 'designer', 'profile.json'), pp = path.join(proj, '.uxcli', 'designer', 'profile.json');
    fs.writeFileSync(pp, fs.readFileSync(pp, 'utf8').replace('"C": null', '"C": ["C1"]'));
    const before = [fs.readFileSync(gp, 'utf8'), fs.readFileSync(pp, 'utf8')];
    must('a second designer init did not keep what is there', D.initDesigner(proj, { apply: true, by: owner }).status === 'kept' && fs.readFileSync(pp, 'utf8') === before[1]);
    const dir = path.join(proj, '.uxcli', 'designer', 'decisions'); fs.mkdirSync(dir, { recursive: true });
    for (const id of ['D-0001', 'D-0002', 'D-0003']) fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify(sig(id)));
    const s = D.designerState(proj);
    must(`designer state has problems: ${s.problems.join('; ')}`, !s.problems.length);
    const r = D.learnDesigner(proj, { apply: true });
    must('learn --apply wrote no taste.json', readJson(path.join(proj, '.uxcli', 'designer', 'taste.json')).taste.some(x => x.settled && x.prefer === 'C2'));
    must('a settled preference the profile does not carry was not proposed', r.promote.some(p => p.where === 'project' && p.add === 'C2'));
    must('learn changed a profile', fs.readFileSync(gp, 'utf8') === before[0] && fs.readFileSync(pp, 'utf8') === before[1]);
    must('a global-scope decision was not copied to the global store', fs.existsSync(path.join(process.env.UXCLI_HOME, 'designer', 'decisions', 'proj', 'D-0001.json')));
    must('one project made a global preference', !r.everywhere.taste.some(x => x.global));
  } finally {
    if (prevHome === undefined) delete process.env.UXCLI_HOME; else process.env.UXCLI_HOME = prevHome;
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  return { ok: !problems.length, checks, problems };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = await pair();
  console.log(r.ok ? `PASS designer · ${r.checks} checks` : 'FAIL ' + r.problems.join('\n     '));
  process.exit(r.ok ? 0 : 1);
}

// The projection computes the level; nothing in the input may declare it, and degrading an input lowers it.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { projection } from '../src/core/level/projection.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const D = path.join(ROOT, '.claude/specs/design/uxcli-data-v0.1/.uxcli');
const J = f => JSON.parse(fs.readFileSync(path.join(D, f), 'utf8'));
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export const OPERATOR =
  'a `level: gate` field planted on the input and on every run; the only verified commitment\'s reviewAfter moved '
  + 'into the past; the insight it traces to demoted; its anchor hash moved; and every completed run removed so '
  + 'only the blocked one remains';

const load = () => {
  const C001 = J('commitments/C-001.json');
  return {
    userModel: { file: 'understanding/real-estate-agent.json', ...J('understanding/real-estate-agent.json') },
    journeys: [J('journeys/handle-inbound-lead.json'), J('journeys/authenticate.json')],
    commitments: [C001, J('commitments/C-002.json'), J('commitments/C-003.json')],
    profiles: [J('profiles/lead-new-unassigned.json'), J('profiles/agent-basic.json')],
    policy: J('policy/policy.json'),
    runs: [
      { run: J('runs/j-handle-inbound-lead/run.json'), history: [J('runs/j-handle-inbound-lead/history/2026-09-24T09-12-03Z/run.json')] },
      { run: J('runs/j-authenticate/run.json'), history: [] },
      { run: J('runs/j-handle-inbound-lead@production/run.json'), history: [] },
    ],
    proposals: ['P-0003', 'P-0004', 'P-0006', 'P-0007'].map(id => J(`proposals/${id}.json`)),
    corpusLabels: [J('corpus/L-0001.json')],
    probes: [J('probes/project/lead-phone-visible.json')],
    runHashes: { [C001.anchor.run]: C001.anchor.hash },
  };
};

export function pair() {
  const problems = [];
  let checks = 0;
  const must = (what, cond) => { checks++; if (!cond) problems.push(what); };
  const ex = J('index.json');
  const input = load();
  const p = projection(input);

  // Must-pass: the example index, field by field where the field is computable.
  must('level did not reproduce the example', eq(p.level, ex.level));
  must('rows did not reproduce the example', eq(p.rows, ex.rows));
  must('generatedAt is not the latest run', p.generatedAt === ex.generatedAt && p.rebuildable === true);
  must('insight standing did not reproduce the example', eq(p.standing['understanding/real-estate-agent.json'], ex.standing['understanding/real-estate-agent.json']));
  must('commitment standing did not reproduce the example', eq(p.standing.commitments, ex.standing.commitments));
  must('profile standing did not reproduce the example', eq(p.standing.profiles, ex.standing.profiles));
  must('journey standing did not reproduce the example', eq(p.standing.journeys, ex.standing.journeys));
  must('proposals did not reproduce the example', eq(p.proposals, ex.proposals));

  // A declared level is not a level.
  const planted = { ...input, level: 'gate', runs: input.runs.map(r => ({ ...r, run: { ...r.run, level: 'gate' } })) };
  must('a planted `level: gate` field changed the projection', eq(projection(planted), p));
  must('the author\'s own insight confidence was read instead of computed',
    projection({ ...input, userModel: { ...input.userModel, insights: input.userModel.insights.map(i => i.id === 'I-003' ? { ...i, confidence: 'high' } : i) } })
      .standing['understanding/real-estate-agent.json']['I-003'].confidence === 'hypothesis');

  // Degrade an input; the level must go down, not stay.
  const edit = (id, f) => ({ ...input, commitments: input.commitments.map(c => c.id === id ? f(c) : c) });
  const expired = projection(edit('C-001', c => ({ ...c, reviewAfter: '2026-01-01' })));
  must('an expired reviewAfter on the only verified commitment did not lower trust', expired.level.trust === 'observe' && expired.standing.commitments['C-001'].reviewOverdue === '2026-01-01');
  const demoted = projection({ ...input, userModel: { ...input.userModel, insights: input.userModel.insights.map(i => i.id === 'I-001' ? { ...i, lastCheck: { ...i.lastCheck, fired: true } } : i) } });
  must('demoting the insight C-001 traces to did not move its standing', eq(demoted.standing.commitments['C-001'].traceDemoted, ['I-001']) && demoted.level.trust === 'observe');
  const moved = projection({ ...input, runHashes: { [input.commitments[0].anchor.run]: 'sha256:0000' } });
  must('an anchor that differs still counted toward verify', moved.standing.commitments['C-001'].anchor === 'differs' && moved.level.trust === 'observe');
  const onlyBlocked = projection({ ...input, runs: input.runs.filter(r => r.run.status === 'blocked') });
  must('a blocked run counted somewhere as a pass', onlyBlocked.level.trust === 'observe' && onlyBlocked.level.reach === 'observe' && onlyBlocked.rows.length === 1 && onlyBlocked.rows[0].status === 'blocked' && !('fails' in onlyBlocked.rows[0]));
  const validated = projection(edit('C-002', c => ({ ...c, measurements: c.measurements.map(m => ({ ...m, method: 'method-validated' })) })));
  must('validating C-002 did not remove its sentence from toNext', !validated.level.toNext['trust → gate'].some(s => s.startsWith('C-002')) && validated.level.trust === 'verify');
  const cleaned = projection({ ...input, runs: input.runs.map(r => r.run.id !== 'j-handle-inbound-lead' ? r : { ...r, run: { ...r.run, scenario: { ...r.run.scenario, fixtures: r.run.scenario.fixtures.map(f => ({ ...f, cleanup: 'deleted' })) } } }) });
  must('a verified cleanup did not remove the recoverability sentence', !cleaned.level.toNext['reach → inject'].some(s => s.startsWith('recoverability')));

  return { ok: problems.length === 0, problems, checks };
}

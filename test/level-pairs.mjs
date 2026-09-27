// The projection computes the level; nothing in the input may declare it, and degrading an input lowers it.
import { projection } from '../src/core/level/projection.js';

import { read as J, exampleInput as load } from './example-data.mjs';
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export const OPERATOR =
  'a `level: gate` field planted on the input and on every run; the only verified commitment\'s reviewAfter moved '
  + 'into the past; the insight it traces to demoted; its anchor hash moved; and every completed run removed so '
  + 'only the blocked one remains';

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
  must('insight standing did not reproduce the example', eq(p.standing['understanding/insights'], ex.standing['understanding/insights']));
  must('commitment standing did not reproduce the example', eq(p.standing.commitments, ex.standing.commitments));
  must('profile standing did not reproduce the example', eq(p.standing.profiles, ex.standing.profiles));
  must('journey standing did not reproduce the example', eq(p.standing.journeys, ex.standing.journeys));
  must('proposals did not reproduce the example', eq(p.proposals, ex.proposals));

  // A declared level is not a level.
  const planted = { ...input, level: 'gate', runs: input.runs.map(r => ({ ...r, run: { ...r.run, level: 'gate' } })) };
  must('a planted `level: gate` field changed the projection', eq(projection(planted), p));
  must('the author\'s own insight confidence was read instead of computed',
    projection({ ...input, insights: input.insights.map(i => i.id === 'I-003' ? { ...i, confidence: 'high' } : i) })
      .standing['understanding/insights']['I-003'].confidence === 'hypothesis');

  // Degrade an input; the level must go down, not stay.
  const edit = (id, f) => ({ ...input, commitments: input.commitments.map(c => c.id === id ? f(c) : c) });
  const expired = projection(edit('C-001', c => ({ ...c, reviewAfter: '2026-01-01' })));
  must('an expired reviewAfter on the only verified commitment did not lower trust', expired.level.trust === 'observe' && expired.standing.commitments['C-001'].reviewOverdue === '2026-01-01');
  const demoted = projection({ ...input, insights: input.insights.map(i => i.id === 'I-001' ? { ...i, lastCheck: { ...i.lastCheck, fired: true } } : i) });
  must('demoting the insight C-001 traces to did not move its standing', eq(demoted.standing.commitments['C-001'].traceDemoted, ['I-001']) && demoted.level.trust === 'observe');
  const moved = projection({ ...input, runHashes: { [input.commitments[0].anchor.run]: 'sha256:0000' } });
  must('an anchor that differs still counted toward verify', moved.standing.commitments['C-001'].anchor === 'differs' && moved.level.trust === 'observe');
  const onlyBlocked = projection({ ...input, runs: input.runs.filter(r => r.run.status === 'blocked') });
  must('a blocked run counted somewhere as a pass', onlyBlocked.level.trust === 'observe' && onlyBlocked.level.reach === 'observe' && onlyBlocked.rows.length === 1 && onlyBlocked.rows[0].status === 'blocked' && !('fails' in onlyBlocked.rows[0]));
  const validatedIn = edit('C-002', c => ({ ...c, measurements: c.measurements.map(m => ({ ...m, method: 'method-validated' })) }));
  const validated = projection(validatedIn);
  must('validating C-002 did not turn its method sentence into a corpus sentence', !validated.level.toNext['trust → gate'].some(s => s.startsWith('C-002') && s.includes('method-unproven')) && validated.level.toNext['trust → gate'].some(s => s.startsWith('C-002') && s.includes('nhãn corpus')) && validated.level.trust === 'verify');
  // Gate is earned against ground truth: only a corpus label on this commitment's step clears the last sentence.
  const labeled = projection({ ...validatedIn, corpusLabels: [...input.corpusLabels, { id: 'L-test', journey: 'handle-inbound-lead', step: 's1', groundTruth: 'pass', blind: true, labeledBy: [{ who: 'test' }] }] });
  must('a corpus label on C-002\'s step did not clear its sentence', !labeled.level.toNext['trust → gate'].some(s => s.startsWith('C-002')));
  const unlabeled = projection({ ...input, corpusLabels: [] });
  must('with no corpus label at all, C-001 (validated, measured) still had no corpus sentence', unlabeled.level.toNext['trust → gate'].some(s => s.startsWith('C-001') && s.includes('nhãn corpus')));
  const cleaned = projection({ ...input, runs: input.runs.map(r => r.run.id !== 'j-handle-inbound-lead' ? r : { ...r, run: { ...r.run, scenario: { ...r.run.scenario, fixtures: r.run.scenario.fixtures.map(f => ({ ...f, cleanup: 'deleted' })) } } }) });
  must('a verified cleanup did not remove the recoverability sentence', !cleaned.level.toNext['reach → inject'].some(s => s.startsWith('recoverability')));

  return { ok: problems.length === 0, problems, checks };
}

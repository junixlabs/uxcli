// The brief and its card, held by a pair: each rule is shown catching a planted gap and silent on
// the example data. The rules: unknowns print before any insight; confidence printed is the ceiling,
// never the author's word; a journey with no trace is named; an actor nobody described is named; a
// trace to an insight nobody wrote is named; the card fits WIDTH; and no line of the card advises.
import { brief } from '../src/core/context/brief.js';
import { contextCard, WIDTH } from '../src/core/report/index.js';
import { parseActor, parseInsight } from '../src/core/model/user-model.js';
import { DATA, read, list, runOf } from './example-data.mjs';
import { parseJourney } from '../src/core/model/journey.js';

const clone = v => JSON.parse(JSON.stringify(v));

export const OPERATOR =
  'an insight whose lastCheck is removed while the file still says high; a journey whose trace[] is emptied; '
  + 'a journey naming an actor no understanding describes; a commitment tracing to an insight nobody wrote; '
  + 'the understanding removed altogether; and the example data, which must render, fit, and put unknowns '
  + 'above every insight';

export function pair() {
  const problems = []; let checks = 0;
  const must = (what, cond) => { checks++; if (!cond) problems.push(what); };

  const auth = read('journeys/authenticate.json'); const lead = read('journeys/handle-inbound-lead.json');
  const refs = { 'journeys/authenticate.json#/states/agent.workspace_ready': auth.states['agent.workspace_ready'] };
  const journeys = [parseJourney(auth, { refs }).value, parseJourney(lead, { refs }).value];
  const actor = read('understanding/actors/real-estate-agent.json');
  const actors = [{ ...parseActor(actor), file: 'understanding/actors/real-estate-agent.json' }];
  const insights = list('understanding/insights').map(f => ({ ...parseInsight(read(`understanding/insights/${f}`)), file: `understanding/insights/${f}` }));
  const commitments = ['C-001', 'C-002', 'C-003'].map(id => read(`commitments/${id}.json`));
  const index = read('index.json');
  const input = { actors, insights, journeys, commitments, index, journeyId: 'handle-inbound-lead' };

  // Example data: renders, fits, and the order is the rule.
  const b = brief(input); const card = contextCard(b);
  must(`example brief has problems: ${b.problems.join('; ')}`, b.problems.length === 0);
  must('card wider than WIDTH', Math.max(...card.split('\n').map(l => l.length)) <= WIDTH);
  must('unknowns are not printed before the first insight', card.indexOf('unknown') < card.indexOf('I-001'));
  must('the in-scope commitment C-001 is not on the card', card.includes('C-001'));
  const other = commitments.find(c => c.scope?.journey !== 'handle-inbound-lead');
  must('a commitment scoped to another journey leaked onto the card', !other || !card.includes(other.id));
  must('the timing predicate is printed as JSON, not as words', !card.includes('{"observer"'));
  must('I-001 is not printed at its ceiling (high)', /I-001\s+high/.test(card));
  must('I-003 (no source) is not printed as hypothesis', /I-003\s+hypothesis/.test(card));
  must('the hook the screen must carry is not on the card', card.includes('[data-uxcli=call-action]'));
  must('the card advises', !/\b(should|recommend|consider|best practice)\b/i.test(card));

  // Planted: the file says high, the check behind it is gone — the card says medium and names the overclaim.
  let b2 = brief({ ...input, insights: insights.map(i => i.value.id !== 'I-001' ? i : { ...i, value: (({ lastCheck, ...rest }) => rest)(i.value) }) });
  must('ceiling did not drop to medium when lastCheck was removed', b2.insights.find(i => i.id === 'I-001')?.ceiling === 'medium' && b2.insights.find(i => i.id === 'I-001')?.overclaims);
  must('card did not say the file overclaims', contextCard(b2).includes('medium (file says high)'));

  // Planted: a journey with no trace.
  let j = clone(lead); j.trace = [];
  b2 = brief({ ...input, journeys: [journeys[0], parseJourney(j, { refs }).value] });
  must('a journey with no trace was not named', b2.problems.some(p => p.includes('no trace')));
  must('card did not say the journey has no trace', contextCard(b2).includes('none — no insight says why this journey exists'));

  // Planted: an actor nobody described.
  j = clone(lead); j.actor = 'manager';
  b2 = brief({ ...input, journeys: [journeys[0], parseJourney(j, { refs }).value] });
  must('an actor with no understanding was not named', b2.problems.some(p => p.includes('actor manager')));

  // Planted: a commitment tracing to an insight nobody wrote.
  const c = clone(commitments); c[0].trace = ['understanding/insights/I-099.json'];
  b2 = brief({ ...input, commitments: c });
  must('a trace to a missing insight was not named', b2.problems.some(p => p.includes('I-099')));

  // Removed: no understanding at all — the card says so, first, and still prints the journey.
  b2 = brief({ ...input, actors: [] });
  const c2 = contextCard(b2);
  must('no understanding: not named as a problem', b2.problems.some(p => p.includes('no understanding')));
  must('no understanding: card does not say unknowns are everything', c2.includes('unknowns are everything'));
  must('no understanding: journey states vanished from the card', c2.includes('agent.lead_detail'));

  return { ok: problems.length === 0, problems, checks };
}

// The cards, held by a pair: each rule is shown catching a planted packet and silent on the example data.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { initCard, journeyCard, verdictBlock, why, proposalCard, WIDTH, wrap } from '../src/core/report/index.js';

import { DATA, read, runOf } from './example-data.mjs';

export const OPERATOR =
  'a blocked run whose packet still carries a stray `pass` verdict and a `pass` probe; a finding capped '
  + 'by method whose card must say it would be fail; a verdict with no `where` and no commitment scope; a '
  + '`what` of 400 characters with no spaces; a gate-level projection that still lists a way up; an empty '
  + 'projection; and the example data, which must render and must name C-003 and P-0007';

const widest = text => Math.max(...text.split('\n').map(l => l.length));
const DISCLAIMER = 'no probe ran; nothing here is a pass';

export function pair() {
  const problems = []; let checks = 0;
  const must = (what, cond) => { checks++; if (!cond) problems.push(what); };

  // Example data — the shape contract. Must render, and must fit.
  let index, runs, commitments, proposals;
  try {
    index = read('index.json');
    commitments = fs.readdirSync(path.join(DATA, 'commitments')).map(f => read(`commitments/${f}`));
    const lead = runOf('j-handle-inbound-lead');
    runs = [lead.run, runOf('j-authenticate').run, runOf('j-handle-inbound-lead@production').run, ...lead.history];
    proposals = fs.readdirSync(path.join(DATA, 'proposals')).map(f => read(`proposals/${f}`));
  } catch (e) { must(`example data unreadable: ${e.message}`, false); return { ok: false, problems, checks }; }

  let init = '';
  try { init = initCard(index); must('init card rendered empty', init.length > 0); } catch (e) { must(`init card threw: ${e.message}`, false); }
  must('init card does not name C-003 (retirement awaiting a human)', init.includes('C-003'));
  must('init card does not name P-0007 (profile proposed, workflow unmeasurable because of it)', init.includes('P-0007'));
  must('init card says "configured successfully"', !/configured successfully/i.test(init));
  must('init card does not print both axes', /trust/.test(init) && /reach/.test(init));
  must(`init card wider than ${WIDTH}`, widest(init) <= WIDTH);

  const cards = [];
  for (const r of runs) {
    try { cards.push(journeyCard(r, commitments)); } catch (e) { must(`run card ${r.id} threw: ${e.message}`, false); }
  }
  for (const c of cards) must(`run card wider than ${WIDTH}`, widest(c) <= WIDTH);
  for (const p of proposals) {
    try { const c = proposalCard(p); must(`proposal card ${p.id} wider than ${WIDTH}`, widest(c) <= WIDTH); } catch (e) { must(`proposal card ${p.id} threw: ${e.message}`, false); }
  }

  // Blocked — the example packet, and one planted with verdicts that lie.
  const prod = runs[2];
  const blocked = journeyCard(prod, commitments);
  must('blocked card lacks the disclaimer', blocked.includes(DISCLAIMER));
  must('blocked card renders the word pass outside the disclaimer', !/\bpass\b/i.test(blocked.replace(DISCLAIMER, '')));
  must('blocked card does not name the reason', blocked.includes(prod.blocked.reason));
  for (const w of prod.blocked.which) must('blocked card drops a `which` item', blocked.includes(w.slice(0, 40)));
  const lying = { ...prod, verdicts: [{ commitment: 'C-001', value: 'pass', where: 's2' }], probes: [{ id: 'contrast', value: 'pass' }], exit: 0 };
  const lyingCard = journeyCard(lying, commitments);
  must('blocked card printed a stray pass verdict from the packet', !/\bpass\b/i.test(lyingCard.replace(DISCLAIMER, '')));
  must('blocked card did not say exit 1 means could-not-run', /could not be carried out/.test(lyingCard));
  must('blocked card rendered a verdicts section', !/verdicts/.test(lyingCard));

  // A cap must be spoken. The example probe carries one; a planted commitment verdict carries one.
  const lead = cards[0];
  must('method-capped finding does not say it would be fail', /would be fail — capped by method/.test(lead));
  const capped = verdictBlock({ commitment: 'C-001', measurement: 0, value: 'finding', caps: [{ by: 'method', from: 'fail' }], what: 'x', where: 's2' }, commitments);
  must('planted method cap not spoken', /would be fail/.test(capped));
  const uncapped = verdictBlock({ commitment: 'C-001', measurement: 0, value: 'finding', caps: [], cause: 'probe-said', what: 'x', where: 's2' }, commitments);
  must('an uncapped finding claimed a cap', !/would be fail/.test(uncapped));
  must('why() of a capped finding does not name the cap', /method/.test(why({ value: 'finding', caps: [{ by: 'method', from: 'fail' }], where: 's1' })));

  // Every verdict carries a place — from the packet, the commitment's scope, or the journey itself.
  const allVerdicts = runs.flatMap(r => [...(r.verdicts || []), ...(r.probes || []).map(p => ({ ...p, probe: p.id }))]);
  for (const v of allVerdicts) must(`verdict ${v.commitment || v.probe || v.step} rendered without where`, /where /.test(verdictBlock(v, commitments).split('\n')[0]));
  must('C-002 verdict without `where` did not borrow the commitment scope', /where s1/.test(verdictBlock({ commitment: 'C-002', measurement: 0, value: 'not-applicable', cause: 'c' }, commitments)));
  must('verdict with no where and no scope rendered without a place', /where whole journey/.test(verdictBlock({ probe: 'x', value: 'pass' }, [])));
  must('why() of a fail does not tell the agent what to fix', /fix .* at s2/.test(why({ commitment: 'C-001', value: 'fail', where: 's2' }, commitments)));
  must('why() of a fail invites editing the commitment', /never edit C-001/.test(why({ commitment: 'C-001', value: 'fail', where: 's2' }, commitments)));

  // Width is a ceiling, and the ceiling has to be seen holding against a word that cannot break.
  const long = 'x'.repeat(400);
  const wide = journeyCard({ ...runs[0], verdicts: [{ commitment: 'C-001', value: 'fail', what: long, where: 's2' }] }, commitments);
  must(`a 400-char what broke the ${WIDTH}-column ceiling`, widest(wide) <= WIDTH);
  must('the wrapped what lost characters', wide.replace(/\s/g, '').includes(long));
  must('wrap() itself lets a line through', widest(wrap('a '.repeat(200)).join('\n')) <= WIDTH);
  must('the width check cannot see a wide line', widest('y'.repeat(WIDTH + 1)) > WIDTH);

  // A gate-level project with an open list is still shown the list; an empty projection still renders.
  const gate = initCard({ level: { trust: 'gate', reach: 'inject', toNext: { 'trust → gate': ['sentence-that-must-appear'] } } });
  must('gate-level projection hid its toNext list', gate.includes('sentence-that-must-appear'));
  must('gate-level card said "configured successfully"', !/configured successfully/i.test(gate));
  let empty = ''; try { empty = initCard({}); } catch (e) { must(`empty projection threw: ${e.message}`, false); }
  must('empty projection rendered no level line', /trust/.test(empty));
  must('a proposal without trace was not called noise', /noise/.test(proposalCard({ id: 'P-x', kind: 'commitment', statement: 's', trace: [] })));

  return { ok: problems.length === 0, problems, checks };
}

// The authored objects, held by the same kind of pair as everything else: each rule is shown
// failing on a planted defect and silent once it is removed, and the example data — the contract
// about shape — parses with nothing to say.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { parseJourney, prerequisitesOf, unconsumedProduces, discriminationProblems } from '../src/core/model/journey.js';
import { strengthOf } from '../src/core/model/signal.js';
import { parseCommitment, transitionProblems } from '../src/core/model/commitment.js';
import { parseProfile } from '../src/core/model/profile.js';
import { parsePolicy } from '../src/core/model/policy.js';
import { parseActor, parseInsight, confidenceCeiling } from '../src/core/model/user-model.js';
import { DATA, read, text, list } from './example-data.mjs';

export const OPERATOR =
  'a signal naming an observer nobody has; a step consuming a field no earlier step produced, and a '
  + '{param} its interaction fills from nothing; a state whose author wrote a strength above what its '
  + 'signals give; a commitment signed by two owners; a commitment quoting words its document no '
  + 'longer says; ACTIVE → RETIRED with nobody named as deciding; a profile typing in a number where a '
  + 'derive already computes it; a policy constraint with no observer; an insight claiming high with '
  + 'no check behind it; an actor with nothing unknown; a file with no schema_version — each planted in the example data and removed again';

const clone = v => JSON.parse(JSON.stringify(v));

export function pair() {
  const problems = [];
  let checks = 0;
  const must = (what, cond) => { checks++; if (!cond) problems.push(what); };
  const says = (r, word) => r.problems.some(p => p.includes(word));

  const auth = read('journeys/authenticate.json');
  const lead = read('journeys/handle-inbound-lead.json');
  const refs = { 'journeys/authenticate.json#/states/agent.workspace_ready': auth.states['agent.workspace_ready'] };
  const c001 = read('commitments/C-001.json');
  const actor = read('understanding/actors/real-estate-agent.json');
  const insights = list('understanding/insights').map(f => read(`understanding/insights/${f}`));
  const docs = { 'understanding/actors/real-estate-agent.json': { found: true, text: text('understanding/actors/real-estate-agent.json') }, 'understanding/insights/I-002.json': { found: true, text: text('understanding/insights/I-002.json') } };
  const profile = read('profiles/lead-new-unassigned.json');
  const policy = read('policy/policy.json');

  // The example data is the contract about shape. Every file of it parses clean.
  const clean = {
    'journeys/authenticate.json': parseJourney(auth),
    'journeys/handle-inbound-lead.json': parseJourney(lead, { refs }),
    'commitments/C-001.json': parseCommitment(c001, { docs }),
    'commitments/C-002.json': parseCommitment(read('commitments/C-002.json'), { docs }),
    'commitments/C-003.json': parseCommitment(read('commitments/C-003.json'), { docs }),
    'profiles/lead-new-unassigned.json': parseProfile(profile),
    'profiles/agent-basic.json': parseProfile(read('profiles/agent-basic.json')),
    'policy/policy.json': parsePolicy(policy),
    'understanding/actors/real-estate-agent.json': parseActor(actor),
    ...Object.fromEntries(insights.map(i => [`understanding/insights/${i.id}.json`, parseInsight(i)])),
  };
  for (const [f, r] of Object.entries(clean)) must(`${f} does not parse clean: ${r.problems.join(' · ')}`, r.ok);

  // Journey — an observer nobody has.
  let j = clone(auth); j.states['anon.login_page'].signals[1].observer = 'vibes';
  must('journey parser accepted a signal with an unknown observer', says(parseJourney(j), 'states[anon.login_page].signals[1].observer'));
  j = clone(auth); j.states['anon.login_page'].signals[1] = { observer: 'dom', expr: '[data-uxcli=login-form] visible' };
  must('journey parser accepted the old string expr', says(parseJourney(j), '.expr'));

  // Journey — lineage: a field consumed that nothing produced, and a {param} filled from nothing.
  j = clone(lead); j.workflows[0].steps[1].interactions[0].consumes = ['lead.uuid'];
  must('journey parser missed a consumes no earlier step produces', says(parseJourney(j, { refs }), '`lead.uuid` is not produced'));
  j = clone(lead); delete j.workflows[0].steps[1].interactions[1].consumes;
  must('journey parser missed a {leadId} its interaction consumes nothing for', says(parseJourney(j, { refs }), '{leadId} is filled from nothing'));
  j = clone(lead); j.workflows[0].steps.shift();
  must('journey parser missed a fixture removed from under the step that consumed it', says(parseJourney(j, { refs }), '`lead.id` is not produced'));

  // Journey — strength is derived; the author may lower it, never raise it.
  must('strengthOf: url + instrumented dom is strong', strengthOf(auth.states['anon.login_page']) === 'strong');
  must('strengthOf: a11y + dom without url is medium', strengthOf(auth.states['anon.login_rejected']) === 'medium');
  must('strengthOf: text alone is weak', strengthOf({ signals: [{ observer: 'text', selector: 'p', contains: 'x' }] }) === 'weak');
  must('strengthOf: no signals is unverifiable', strengthOf({ signals: [] }) === 'unverifiable');
  j = clone(auth); j.states['anon.login_rejected'].strength = 'strong';
  must('journey parser let an author raise strength above the derived one', says(parseJourney(j), 'states[anon.login_rejected].strength: strong claims more'));
  j = clone(auth); j.states['anon.login_page'].strength = 'weak';
  const lowered = parseJourney(j);
  must('journey parser objected to an author lowering strength', lowered.ok && lowered.value.states['anon.login_page'].strength === 'weak' && lowered.value.states['anon.login_page'].derivedStrength === 'strong');

  // Journey — discrimination and lineage analysis.
  j = clone(auth); j.states['anon.login_page'].mustNotMatch = [];
  must('discrimination check missed an empty mustNotMatch', discriminationProblems(j).some(p => p.includes('states[anon.login_page].mustNotMatch: empty')));
  j = clone(auth); j.states['anon.login_page'].mustNotMatch = [42, ''];
  must('discrimination check missed a mustNotMatch entry that is not even a sentence', discriminationProblems(j).filter(p => p.includes('is not a state name')).length === 2);
  j = clone(auth); j.states['anon.login_page'].mustNotMatch = ['anon.login_page'];
  must('discrimination check let a state exclude itself', discriminationProblems(j).some(p => p.includes('cannot be what it must not match')));
  j = clone(auth); j.states['anon.login_page'].mustNotMatch = ['while loading'];
  must('discrimination check refused a prose entry, which the runtime leaves unchecked', discriminationProblems(j).length === 0);
  must('discrimination check objected to the example', discriminationProblems(auth).length === 0 && discriminationProblems(lead).length === 0);
  const pre = prerequisitesOf(lead);
  must('prerequisitesOf: the first before-state of open-and-call is a prerequisite, and s2\'s is not',
    pre.length === 1 && pre[0].step === 's1' && pre[0].state === 'agent.workspace_ready');
  const loose = unconsumedProduces(lead).map(u => u.name);
  must('unconsumedProduces: lead.id, consumed by s1, is not loose', !loose.includes('lead.id'));
  must('unconsumedProduces: response.phone, consumed by a signal\'s equalsField and by s2, is not loose', !loose.includes('response.phone'));
  must('unconsumedProduces: response.status, which nothing consumes, is loose', loose.includes('response.status'));

  // Commitment — one owner, and a quote the document still says.
  let c = clone(c001); c.owner = [c.owner, { type: 'role', ref: 'engineering-lead' }];
  must('commitment parser accepted two owners', says(parseCommitment(c, { docs }), 'owner: one signer, not a list'));
  c = clone(c001); c.source.quote = 'the action sits far from the data being viewed';
  must('commitment parser accepted a quote the document does not say', says(parseCommitment(c, { docs }), 'source.quote: understanding/actors/real-estate-agent.json no longer says'));
  c = clone(c001); delete c.source.quote;
  must('commitment parser accepted a document named without its words', says(parseCommitment(c, { docs }), 'source.quote: required'));
  must('commitment parser objected to an unresolved document nobody handed it', parseCommitment(c001).ok);

  // Commitment — the lifecycle: ending a promise names who decided.
  c = clone(c001); c.status = 'RETIRED'; c.retiredAt = '2026-09-25T00:00:00Z';
  c.retirement = { proposedBy: { type: 'agent', ref: 'uxcli', onBehalfOf: 'chuongld' }, requires: { type: 'role', ref: 'product-owner' }, reason: 'x', decidedBy: null };
  must('commitment parser let ACTIVE → RETIRED pass with nobody deciding', says(parseCommitment(c, { docs, previous: 'ACTIVE' }), 'retirement.decidedBy'));
  c.retirement.decidedBy = { type: 'person', ref: 'chuongld' };
  must('commitment parser objected to ACTIVE → RETIRED once somebody decided', parseCommitment(c, { docs, previous: 'ACTIVE' }).ok);
  must('transition: RETIRED → ACTIVE is not a move', transitionProblems('RETIRED', 'ACTIVE', c).length === 1);
  must('transition: same status is no move', transitionProblems('ACTIVE', 'ACTIVE', c001).length === 0);

  // Profile — a number typed in where a rule already decides it.
  let p = clone(profile); p.constraints.createdMinutesAgo = 10;
  must('profile parser accepted a hardcoded number beside a derive for the same field', says(parseProfile(p), 'constraints.createdMinutesAgo: 10 is typed in'));
  p = clone(profile); p.derive.createdMinutesAgo = 'leads.responseSlaMinutes - 5';
  must('profile parser accepted the old string derive', says(parseProfile(p), 'derive.createdMinutesAgo:'));

  // Policy — a constraint nobody can observe.
  let pol = clone(policy); delete pol.environments.staging.constraints[1].observer;
  must('policy parser accepted a constraint with no observer', says(parsePolicy(pol), 'environments.staging.constraints[1].observer: required'));
  pol = clone(policy); pol.environments.staging.constraints[1].deny.hostClass = 'fax-provider';
  must('policy parser accepted a host class nobody declared', says(parsePolicy(pol), '`fax-provider` is not declared'));
  pol = clone(policy); pol.workflows['authenticate/*'].effects = ['teleport'];
  must('policy parser accepted an effect outside the vocabulary', says(parsePolicy(pol), '`teleport` is not a declared effect'));

  // Insight — confidence is a ceiling, not a claim.
  const i1 = insights.find(i => i.id === 'I-001'), i3 = insights.find(i => i.id === 'I-003');
  let m = clone(i1); delete m.lastCheck;
  must('insight parser let high stand with no check behind it', says(parseInsight(m), 'confidence: high claims more'));
  m = clone(i1); m.lastCheck.fired = true;
  must('insight parser let high stand after its falsifier fired', says(parseInsight(m), 'confidence: high claims more'));
  m = clone(i3); m.confidence = 'low';
  must('insight parser let low stand on no evidence', says(parseInsight(m), 'confidence: low claims more'));
  must('ceiling: evidence and no wouldChangeIf is low', confidenceCeiling({ evidence: ['x'], wouldChangeIf: null }) === 'low');
  must('ceiling: unchecked wouldChangeIf is medium', confidenceCeiling({ evidence: ['x'], wouldChangeIf: { kind: 'prose', text: 'y' } }) === 'medium');
  m = clone(i1); m.about = 'everyone';
  must('insight parser accepted an `about` that names nothing', says(parseInsight(m), 'about:'));
  m = clone(i1); delete m.about;
  must('insight parser accepted an insight about nothing', says(parseInsight(m), 'about: required'));
  // Actor — unknowns may not be empty, and insights do not live inside.
  m = clone(actor); m.unknowns = [];
  must('actor parser accepted empty unknowns', says(parseActor(m), 'unknowns:'));
  m = clone(actor); m.insights = [];
  must('actor parser accepted insights inside the actor (the old layout)', says(parseActor(m), 'insights: live in'));
  // schema_version — every authored file says which shape it is.
  m = clone(actor); delete m.schema_version;
  must('actor parser accepted a file with no schema_version', says(parseActor(m), 'schema_version: required'));
  j = clone(auth); j.schema_version = 1;
  must('journey parser accepted a journey at the wrong schema_version', says(parseJourney(j), 'schema_version: 1'));
  c = clone(c001); delete c.schema_version;
  must('commitment parser accepted a file with no schema_version', says(parseCommitment(c, { docs }), 'schema_version: required'));

  return { ok: problems.length === 0, problems, checks };
}

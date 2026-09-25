// The run engine, shown failing where it must and silent where it must, against the example data.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { effectiveReach } from '../src/core/run/reach.js';
import { plan, blockedAt } from '../src/core/run/plan.js';
import { packet, seal, effectsFrom } from '../src/core/run/packet.js';
import { verdicts } from '../src/core/run/verdicts.js';
import { weakens } from '../src/core/run/weaken.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const D = path.join(ROOT, '.claude/specs/design/uxcli-data-v0.1/.uxcli');
const J = f => JSON.parse(fs.readFileSync(path.join(D, f), 'utf8'));
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export const OPERATOR =
  'an effect observed that no workflow declared, then removed; the identity taken away under a policy that '
  + 'allows mutate; a fixture step planned against a production reach of observe; a not-held measurement under '
  + 'method-unproven; an anchor whose run hash moved; a RETIRED commitment offered a measurement; a blocked run '
  + 'offered verdicts; and a commitment edit that drops the one viewport a recorded fail was seen at';

export function pair() {
  const problems = [];
  let checks = 0;
  const must = (what, cond) => { checks++; if (!cond) problems.push(what); };

  const policy = J('policy/policy.json');
  const lead = J('journeys/handle-inbound-lead.json');
  const auth = J('journeys/authenticate.json');
  const C = ['C-001', 'C-002', 'C-003'].map(id => J(`commitments/${id}.json`));
  const exLead = J('runs/j-handle-inbound-lead/run.json');
  const exProd = J('runs/j-handle-inbound-lead@production/run.json');
  const WF = 'handle-inbound-lead/open-and-call';

  // Reach — three layers, min, glob, and the identity ceiling.
  const staging = effectiveReach(policy, 'staging', WF, { hasIdentity: true });
  must('staging reach is not min(inject, mutate, mutate) = mutate', staging.effective === 'mutate' && eq(staging.layers, exLead.reach.layers));
  const prod = effectiveReach(policy, 'production', WF, { hasIdentity: false });
  must('production reach did not reproduce the example layers', eq(prod, { ...exProd.reach, capped: [] }) || (prod.effective === 'observe' && eq(prod.layers, exProd.reach.layers)));
  must('`authenticate/*` did not cover authenticate/email-password', effectiveReach(policy, 'staging', 'authenticate/email-password', { hasIdentity: true }).effective === 'interact');
  const noId = effectiveReach(policy, 'staging', WF, { hasIdentity: false });
  must('no identity did not cap mutate at interact', noId.effective === 'interact' && noId.capped.length === 1);
  must('an undeclared workflow was granted more than observe', effectiveReach(policy, 'staging', 'ghost/x', { hasIdentity: true }).effective === 'observe');

  // Plan — the production run's blocked block, exactly.
  const blocked = plan(lead, policy, 'production', { identity: null, fixtures: [] }, { prerequisites: ['agent.workspace_ready'] });
  must('production plan did not reproduce the example blocked block', blocked.status === 'blocked' && blocked.reason === exProd.blocked.reason && eq(blocked.which, exProd.blocked.which));
  const okPlan = plan(lead, policy, 'staging', exLead.scenario, { prerequisites: ['agent.workspace_ready'] });
  must('staging plan with identity did not come back ok', okPlan.status === 'ok' && eq(okPlan.unverified, ['agent.workspace_ready']));
  const noIdPlan = plan(lead, policy, 'staging', { identity: null, fixtures: [] }, { prerequisites: ['agent.workspace_ready'] });
  must('staging without identity did not block on the prerequisite', noIdPlan.status === 'blocked' && noIdPlan.reason === 'prerequisite_not_satisfied' && noIdPlan.which.some(w => w.startsWith('f0 lead-new-unassigned: fixture cần mutate, effective reach là interact')));
  const rejected = plan(lead, policy, 'staging', { identity: { ...exLead.scenario.identity, verified: { ...exLead.scenario.identity.verified, tenant: false } }, fixtures: [] }, { prerequisites: [] });
  must('an identity that failed tenant verification was not rejected', rejected.status === 'blocked' && rejected.reason === 'identity_rejected');
  must('an intercept workflow under observe was not reach_insufficient', plan(auth, policy, 'production', { identity: null }, { workflow: 'server-error' }).reason === 'reach_insufficient');

  // Packet — steps from the example run, plus one observed value nobody declared or consumed.
  const stepResults = exLead.steps.map(s => s.id !== 's1' ? s : { ...s, interactions: s.interactions.map(i => i.type !== 'api' ? i : { ...i, produced: { ...i.produced, 'response.internalScore': 'sha1_8:deadbeef' } }) });
  const base = { id: exLead.id, journey: lead, definitionHash: exLead.journey.definitionHash, env: 'staging', scenario: exLead.scenario, reach: staging,
    effects: { declared: ['database_write'], observed: ['database_write'] }, stepResults, constraints: exLead.reach.constraints, ruleSnapshots: exLead.ruleSnapshots, probes: exLead.probes, ranAt: exLead.ranAt, evidence: exLead.evidence };
  const run = packet(base);
  const strip = l => l.map(({ matchesDisplayed, ...x }) => x);
  must('lineage did not reproduce the example (consumedBy, kept:false)', eq(run.lineage, strip(exLead.lineage)));
  must('packet kept a produced value lineage dropped', !('response.internalScore' in run.steps[1].interactions[2].produced));
  must('packet did not reproduce the example effects/reach/journey', eq(run.effects, exLead.effects) && eq(run.reach, exLead.reach) && eq(run.journey, exLead.journey) && run.status === 'completed');
  const aborted = packet({ ...base, effects: { declared: ['database_write'], observed: ['database_write', { effect: 'external_sms', where: 's2', request: 'POST api.esms.vn/send' }] } });
  must('an undeclared effect did not abort the run', aborted.status === 'aborted' && aborted.exit === 1 && aborted.breaches.length === 1 && aborted.breaches[0].effect === 'external_sms' && eq(aborted.effects.undeclared, ['external_sms']));
  must('an aborted run did not stay aborted once sealed', seal(aborted, []).exit === 1);
  const prodRun = packet({ id: exProd.id, journey: lead, definitionHash: exProd.journey.definitionHash, env: 'production', scenario: exProd.scenario, reach: prod, effects: {}, stepResults: exLead.steps, ranAt: exProd.ranAt, blocked: { reason: blocked.reason, which: blocked.which } });
  must('blocked packet did not reproduce the example', prodRun.status === 'blocked' && prodRun.exit === 1 && eq(prodRun.blocked, exProd.blocked) && eq(prodRun.steps, []) && eq(prodRun.verdicts, []) && eq(prodRun.reach, exProd.reach));

  // Verdicts — the example's three, then each cap and refusal planted.
  const anchorHashes = { [C[0].anchor.run]: C[0].anchor.hash };
  const outcomes = [
    { commitmentId: 'C-001', index: 0, outcome: 'not-held', where: 's2', what: exLead.verdicts[0].what, shot: 's2-before.png' },
    { commitmentId: 'C-002', index: 0, outcome: 'condition-not-met', cause: exLead.verdicts[1].cause },
    { commitmentId: 'C-002', index: 1, outcome: 'condition-not-met', cause: exLead.verdicts[2].cause },
  ];
  const v = verdicts(C, run, { outcomes, anchorHashes });
  const pick = x => ({ commitment: x.commitment, measurement: x.measurement, value: x.value, caps: x.caps, cause: x.cause });
  must('verdicts did not reproduce the example three', eq(v.verdicts.map(pick), exLead.verdicts.map(pick)) && v.exit === 2);
  must('sealed run does not carry exit 2 with a fail', seal(run, v.verdicts).exit === 2);
  const unproven = C.map(c => c.id !== 'C-001' ? c : { ...c, measurements: c.measurements.map(m => ({ ...m, method: 'method-unproven' })) });
  const f = verdicts(unproven, run, { outcomes, anchorHashes }).verdicts[0];
  must('not-held under method-unproven was not capped to finding', f.value === 'finding' && f.caps[0]?.by === 'method' && f.cause === 'method-unproven');
  const moved = verdicts(C, run, { outcomes, anchorHashes: { [C[0].anchor.run]: 'sha256:0000' } }).verdicts[0];
  must('an anchor whose hash moved was not not-committed', moved.value === 'not-committed');
  must('a caller cap did not lower fail to finding', verdicts(C, run, { outcomes, anchorHashes, caps: [{ by: 'prerequisite-unverified' }] }).verdicts[0].value === 'finding');
  must('a held measurement did not pass', verdicts(C, run, { outcomes: [{ ...outcomes[0], outcome: 'held' }], anchorHashes }).verdicts[0].value === 'pass');
  must('a RETIRED commitment was still evaluated', verdicts(C.map(c => ({ ...c, status: 'RETIRED' })), run, { outcomes, anchorHashes }).verdicts.length === 0);
  const authRun = { ...run, journey: { ref: 'journeys/authenticate.json' }, steps: [{ id: 's1', after: { state: 'agent.workspace_ready', held: true } }] };
  must('a RETIREMENT_PROPOSED commitment in scope was not evaluated', verdicts(C, authRun, {}).verdicts.some(x => x.commitment === 'C-003' && x.value === 'unmeasurable'));
  must('a blocked run produced verdicts', eq(verdicts(C, prodRun, { outcomes, anchorHashes }), { verdicts: [], exit: 1 }) && eq(seal(prodRun, v.verdicts).verdicts, []));
  const notHeld = { ...run, steps: [{ id: 'r1', workflow: 'server-error', after: { state: 'anon.login_failed_retryable', held: false, strength: 'medium' } }] };
  const sv = verdicts([], notHeld, {}).verdicts[0];
  must('a step whose after did not hold was not a fail', sv?.value === 'fail' && sv.cause === 'state-not-held' && sv.workflow === 'server-error' && sv.step === 'r1');
  must('a weak-strength not-held was not capped', verdicts([], { ...notHeld, steps: [{ ...notHeld.steps[0], after: { ...notHeld.steps[0].after, strength: 'weak' } }] }, {}).verdicts[0].value === 'finding');

  // Three-valued held: null is undecided — never a fail, always a cap.
  const undecided = { ...run, steps: run.steps.map(s => s.id !== 's2' ? s : { ...s, after: { ...s.after, held: null } }) };
  const u = verdicts(C, undecided, { outcomes, anchorHashes }).verdicts;
  must('after.held null produced a state-not-held fail', !u.some(x => x.cause === 'state-not-held'));
  must('after.held null did not cap the commitment at that step to finding', u[0].value === 'finding' && u[0].caps[0]?.by === 'observability');

  // Constraints: false is a breach, null is recorded and nothing more.
  const cs = exLead.reach.constraints;
  const broken = packet({ ...base, constraints: cs.map(c => c.id !== 'no-real-sms' ? c : { ...c, held: false, observed: '1 egress tới sms-provider' }) });
  must('a constraint measured false did not abort with a breach', broken.status === 'aborted' && broken.breaches.some(b => b.constraint === 'no-real-sms' && b.rule === 'constraint-not-held'));
  const unknown = packet({ ...base, constraints: cs.map(c => c.id !== 'no-real-sms' ? c : { ...c, held: null }) });
  must('a constraint that could not be observed was treated as a breach', unknown.status === 'completed' && unknown.breaches.length === 0 && unknown.reach.constraints.some(c => c.held === null));

  // Runtime blocks, from the observer's own results.
  must('a prerequisite measured false did not block', eq(blockedAt({ prerequisites: [{ step: 's1', state: 'agent.workspace_ready', held: false, why: ['GET /api/me → 401'] }] }), { reason: 'prerequisite_not_satisfied', which: ['s1.before agent.workspace_ready: không giữ — GET /api/me → 401'] }));
  must('a prerequisite measured null blocked', blockedAt({ prerequisites: [{ step: 's1', state: 'agent.workspace_ready', held: null }] }) === null);
  must('a rejected identity did not block as identity_rejected', eq(blockedAt({ identity: { rejected: [{ field: 'tenantId', why: 'không thuộc syntheticTenants' }] } }), { reason: 'identity_rejected', which: ['tenantId: không thuộc syntheticTenants'] }));
  must('a fixture derive() could not value did not block', eq(blockedAt({ fixtures: [{ step: 'f0', profile: 'lead-new-unassigned', problems: ['leads.responseSlaMinutes không có giá trị'] }] }), { reason: 'prerequisite_not_satisfied', which: ['f0 lead-new-unassigned: leads.responseSlaMinutes không có giá trị'] }));

  // Effects from the observer: the class, never a blocked request.
  const net = [{ method: 'POST', path: '/api/calls', effectClass: 'database_write' }, { method: 'POST', path: '/api/login', effectClass: 'account_mutation', blocked: true, intercepted: { status: 500 } }, { method: 'GET', path: '/api/me' }];
  must('effectsFrom counted a blocked request or missed the class', eq(effectsFrom([{ step: 's2', observation: { network: net } }]), [{ effect: 'database_write', where: 's2', request: 'POST /api/calls' }]));

  // Weakening — the recorded fail was at 390x844 and only there.
  const sealed = seal(run, v.verdicts);
  const dropped = { ...C[0], scope: { ...C[0].scope, viewports: C[0].scope.viewports.filter(x => x !== '390x844') } };
  must('dropping 390x844 after a fail seen only there was not a weakening', eq(weakens(C[0], dropped, [sealed]), { weakens: true, runs: [sealed.ranAt], why: [`${sealed.ranAt}: viewport 390x844 removed from scope`] }));
  must('an unchanged commitment was called a weakening', weakens(C[0], C[0], [sealed]).weakens === false);
  must('dropping a viewport with no recorded fail was called a weakening', weakens(C[0], dropped, [seal(run, [])]).weakens === false);
  must('removing the failed measurement was not a weakening', weakens(C[0], { ...C[0], measurements: [] }, [sealed]).weakens === true);

  return { ok: problems.length === 0, problems, checks };
}

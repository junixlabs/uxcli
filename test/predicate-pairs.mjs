// The observe layer, shown failing where it must: a predicate is only a predicate if it can be false.
import crypto from 'node:crypto';
import { holds, discriminates, derivedStrength } from '../src/core/observe/holds.js';
import { derive } from '../src/core/observe/derive.js';
import { constraintHeld } from '../src/core/observe/constraint.js';
import { capFor, applyCaps } from '../src/core/observe/cap.js';

export const OPERATOR =
  'a state that also holds on the observation of a state it mustNotMatch; a url with an unbound {param}, '
  + 'one segment of anything, and a selector with one, which is a hole and undecided; a phone shown as 0901 234 567 against a hashed '
  + '+84901234567, a mismatch until e164 normalization; an authored strength above the derived one; a '
  + 'derive whose rule has no snapshot; a tenant header missing on a request outside the constrained effect '
  + 'and then on one inside it; a mounted alert region with no text in it; a cap laid on a pass and on a fail; and the example run, where after a 500 '
  + 'the login form emptied the email field; and a url glob held on a run path, not on a project path';

const hash = s => crypto.createHash('sha1').update(s).digest('hex');
const sha8 = s => 'sha1_8:' + hash(s).slice(0, 8);

// The states of journeys/authenticate.json and handle-inbound-lead.json, in the plan's signal grammar.
const STATES = {
  'anon.login_page': {
    signals: [{ observer: 'url', path: '/login' }, { observer: 'dom', selector: '[data-uxcli=login-form]', visible: true }],
    strength: 'strong', mustMatch: ['/login'], mustNotMatch: ['/workspace/*', '/onboarding'],
  },
  'agent.workspace_ready': {
    signals: [{ observer: 'url', path: '/workspace/{workspaceId}' }, { observer: 'network', request: 'GET /api/me', status: 200 },
      { observer: 'dom', selector: '[data-uxcli=lead-list]', visible: true }],
    strength: 'strong', mustMatch: ['/workspace/*'], mustNotMatch: ['/login', '/onboarding', '/workspace/* when GET /api/me → 401'],
  },
  'anon.login_failed_retryable': {
    signals: [{ observer: 'a11y', role: 'alert', visible: true }, { observer: 'dom', selector: '[data-uxcli=login-submit]', enabled: true },
      { observer: 'dom', selector: 'input[name=email]', valueUnchanged: true }],
    strength: 'medium', mustMatch: ['/login'], mustNotMatch: ['/workspace/*'],
  },
  'agent.lead_detail': {
    signals: [{ observer: 'url', path: '/leads/{leadId}' }, { observer: 'dom', selector: '[data-uxcli=lead-phone]', visible: true },
      { observer: 'text', selector: '[data-uxcli=lead-phone]', equalsField: 'response.phone', normalize: 'e164' }],
    strength: 'strong', mustMatch: ['/leads/*'], mustNotMatch: ['/workspace/*'],
  },
};

const LOGIN = { url: { path: '/login' }, dom: { '[data-uxcli=login-form]': { present: true, visible: true } }, a11y: { alerts: [] }, network: [], storage: {} };
const WORKSPACE = {
  url: { path: '/workspace/ws_42' },
  dom: { '[data-uxcli=lead-list]': { present: true, visible: true } }, a11y: { alerts: [] },
  network: [{ seq: 1, method: 'GET', path: '/api/me', host: 'staging.crm.example.vn', status: 200, ms: 80, fields: {} }],
  storage: { 'session.token': { present: true } },
};
const LEAD = phoneText => ({
  url: { path: '/leads/L-7' },
  dom: { '[data-uxcli=lead-phone]': { present: true, visible: true, text: phoneText } }, a11y: { alerts: [] },
  network: [{ seq: 2, method: 'GET', path: '/api/leads/L-7', host: 'staging.crm.example.vn', status: 200, ms: 143, fields: { 'response.phone': sha8('+84901234567') } }],
});

export function pair() {
  const problems = [];
  let checks = 0;
  const is = (got, want, what) => { checks++; if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`${what}: ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`); };
  const must = (what, cond) => { checks++; if (!cond) problems.push(what); };

  // The states hold where they should, at the strength the plan derives.
  is(holds(STATES['anon.login_page'], LOGIN), { held: true, strength: 'strong', signals: { 'path == /login': true, '[data-uxcli=login-form] visible': true }, why: [] }, 'login page on the login observation');
  const ws = holds(STATES['agent.workspace_ready'], WORKSPACE, { params: { workspaceId: 'ws_42' } });
  is([ws.held, ws.strength], [true, 'strong'], 'workspace ready with a raw lineage value');
  is(holds(STATES['agent.workspace_ready'], WORKSPACE, { params: { workspaceId: sha8('ws_42') }, hash }).held, true, 'workspace ready with a hashed lineage value and ctx.hash');
  is(holds(STATES['agent.workspace_ready'], WORKSPACE, { params: { workspaceId: sha8('ws_42') } }).held, null, 'a hashed value with no ctx.hash cannot be compared, and says so');
  is(holds(STATES['agent.workspace_ready'], LOGIN, { params: { workspaceId: 'ws_42' } }).held, false, 'workspace ready on the login observation');

  // An unbound {param}: in a url it is one segment of anything — the prerequisite "on a workspace page"
  // holds before anything produced a workspaceId; in a selector it is a hole, and undecided.
  const noParam = holds(STATES['agent.workspace_ready'], { ...WORKSPACE, url: { path: '/workspace/ws_17' } }, { params: {} });
  is([noParam.held, noParam.strength], [true, 'strong'], 'workspace ready holds on /workspace/ws_17 with no workspaceId bound');
  is(holds(STATES['agent.workspace_ready'], { ...WORKSPACE, url: { path: '/login' } }, { params: {} }).signals['path == /workspace/{workspaceId}'], false, 'the wildcard still does not match /login');
  is(holds(STATES['agent.workspace_ready'], { ...WORKSPACE, url: { path: '/workspace/ws_17/leads' } }, { params: {} }).held, false, 'one segment, not a prefix');
  const ROW = { signals: [{ observer: 'dom', selector: '[data-uxcli=lead-row][data-id={leadId}]', visible: true }] };
  is(holds(ROW, { dom: { '[data-uxcli=lead-row][data-id={leadId}]': { visible: true } } }, { params: {} }).signals['[data-uxcli=lead-row][data-id={leadId}] visible'], 'unverifiable: {leadId} in [data-uxcli=lead-row][data-id={leadId}] has no value', 'a selector with an unbound {param} is undecided, even if the observer keyed the template');
  is(holds(ROW, { dom: { '[data-uxcli=lead-row][data-id=L-7]': { visible: true } } }, { params: { leadId: 'L-7' } }).held, true, 'the same selector bound is looked up filled');

  // e164: a mismatch as text, a match after normalization — and only with a dial code to normalize by.
  const ctxLead = { params: { leadId: 'L-7' }, hash, dialCode: '84' };
  is(holds(STATES['agent.lead_detail'], LEAD('0901 234 567'), ctxLead).held, true, '0901 234 567 equals +84901234567 after e164');
  is(holds(STATES['agent.lead_detail'], LEAD('0901 234 568'), ctxLead).held, false, 'a different number stays different after e164');
  is(holds({ signals: [{ observer: 'text', selector: '[data-uxcli=lead-phone]', equalsField: 'response.phone' }] }, LEAD('0901 234 567'), ctxLead).held, false, 'without normalize the displayed form does not equal the response');
  is(holds(STATES['agent.lead_detail'], LEAD('0901 234 567'), { params: { leadId: 'L-7' }, hash }).held, null, 'a national number with no dial code cannot be normalized');

  // Strength: authored may lower, never raise.
  is(derivedStrength(STATES['anon.login_failed_retryable'].signals), 'medium', 'a11y + dom without url derives medium');
  is(derivedStrength([{ observer: 'text', selector: 'p', contains: 'x' }]), 'weak', 'text alone is weak');
  is(derivedStrength([]), 'unverifiable', 'no signals');
  const raised = holds({ ...STATES['anon.login_failed_retryable'], strength: 'strong' }, LOGIN);
  is(raised.strength, 'medium', 'authored strong over derived medium is lowered');
  must('the lowering is named in why', raised.why.some(w => w.includes('authored strong') && w.includes('lowered')));
  is(holds({ ...STATES['anon.login_page'], strength: 'weak' }, LOGIN).strength, 'weak', 'authored weak under derived strong is kept');

  // Discrimination: a predicate that also holds where it must not.
  const byState = { 'anon.login_page': LOGIN, 'agent.workspace_ready': WORKSPACE };
  const ctxWs = { params: { workspaceId: 'ws_42' } };
  is(discriminates('anon.login_page', STATES, byState, ctxWs).problems, [], 'login page does not hold on the workspace');
  const planted = { ...STATES, 'anon.login_page': { ...STATES['anon.login_page'], signals: [], mustNotMatch: ['agent.workspace_ready'] } };
  must('a state with no signals holds everywhere, and was not seen holding on its mustNotMatch state',
    discriminates('anon.login_page', planted, byState, ctxWs).problems.some(p => p.includes('agent.workspace_ready')));
  must('a url-pattern mustNotMatch that the predicate holds under was not seen',
    discriminates('anon.login_page', { ...STATES, 'anon.login_page': { ...STATES['anon.login_page'], signals: [{ observer: 'storage', key: 'session.token', present: true }] } }, byState, ctxWs).problems.some(p => p.includes('/workspace/*')));
  must('a predicate declaring no mustNotMatch was not objected to', discriminates('x', { x: { signals: [] } }, {}).ok === false);
  is(discriminates('agent.workspace_ready', STATES, byState, ctxWs).unchecked.length, 1, 'the prose entry is reported unchecked, not silently passed');

  // Derive: a rule that is not there is a problem, not a number.
  is(derive({ rule: 'leads.responseSlaMinutes', add: -5 }, { 'leads.responseSlaMinutes': { value: 15, source: 'project-policy' } }), { value: 10, problems: [] }, 'sla − 5 from the snapshot');
  const absent = derive({ rule: 'leads.responseSlaMinutes', add: -5 }, {});
  is(absent.value, null, 'no snapshot, no value');
  must('no snapshot, no problem named', absent.problems.length === 1 && absent.problems[0].includes('leads.responseSlaMinutes'));
  is(derive({ rule: 'r', mul: 2, add: 1 }, { r: 4 }).value, 9, 'mul then add');

  // Constraints, against the staging environment of policy.json.
  const env = { syntheticTenants: ['t_uxcli_*'], hostClasses: { 'sms-provider': ['*.twilio.com', '*.esms.vn'] },
    environments: { production: { origin: 'https://crm.example.vn' } } };
  const TENANT = { id: 'test-tenant-only', observer: 'network', onEffect: 'database_write', requireHeader: { name: 'x-tenant-id', in: '$syntheticTenants' } };
  const write = (tenant, effectClass = 'database_write') => ({ method: 'POST', path: '/api/calls', host: 'staging.crm.example.vn', status: 201, effectClass, requestHeaders: tenant ? { 'x-tenant-id': tenant } : {} });
  is(constraintHeld(TENANT, { network: [write('t_uxcli_7f3a'), write('t_uxcli_7f3a')] }, env).held, true, 'two writes with a synthetic tenant');
  is(constraintHeld(TENANT, { network: [write('t_uxcli_7f3a'), write(null, 'external_api')] }, env).held, true, 'a missing header on a request outside the effect is not a breach');
  const breach = constraintHeld(TENANT, { network: [write('t_uxcli_7f3a'), write('acme')] }, env);
  is([breach.held, breach.observed], [false, '1/2 database_write requests carry x-tenant-id ∈ $syntheticTenants'], 'a real tenant on a write is a breach, and counted');
  is(constraintHeld(TENANT, { network: [write('acme')] }, {}).held, null, 'a $ref that resolves to nothing is unverifiable, not held');
  const SMS = { id: 'no-real-sms', observer: 'egress', deny: { hostClass: 'sms-provider' } };
  is(constraintHeld(SMS, { network: [{ method: 'POST', path: '/2010-04-01/Messages', host: 'api.twilio.com' }] }, env).held, false, 'egress to a host in the class');
  is(constraintHeld(SMS, { network: [{ method: 'POST', path: '/x', host: 'api.twilio.com', blocked: true }] }, env).held, true, 'a blocked request is not egress');
  const PROD = { id: 'no-production-webhook', observer: 'egress', denyOrigin: '$environments.production.origin' };
  is(constraintHeld(PROD, { network: [{ method: 'POST', path: '/hook', host: 'crm.example.vn' }] }, env).held, false, 'egress to the production origin');
  is(constraintHeld(PROD, { network: [write('t_uxcli_7f3a')] }, env).held, true, 'staging traffic is not production egress');
  is(constraintHeld(PROD, { network: [{ method: 'POST', path: '/hook', host: 'crm.example.vn', production: true }] }, {}).held, false, 'the observer flagging production is enough without a resolvable origin');
  is(constraintHeld(PROD, { network: [{ ...write('t_uxcli_7f3a'), production: false }] }, {}).held, true, 'flagged not-production with no origin to resolve is held, not unverifiable');

  // An empty live region is not an alert. The observer lists every mounted region, text or not.
  const ALERT = { signals: [{ observer: 'a11y', role: 'alert', visible: true }] };
  is(holds(ALERT, { a11y: { alerts: [{ role: 'alert', text: '', visible: true }] } }).held, false, 'a mounted, empty alert region does not satisfy role=alert visible');
  is(holds(ALERT, { a11y: { alerts: [{ role: 'alert', text: '   ', visible: true }] } }).held, false, 'whitespace is not an alert either');
  is(holds(ALERT, { a11y: { alerts: [{ role: 'alert', text: '', visible: true }, { role: 'alert', text: 'Incorrect password', visible: true }] } }).held, true, 'the same page with a region that says something holds');

  // Caps lower fail to finding, and touch nothing else.
  is(capFor({ method: 'method-validated', strength: 'strong' }), [], 'a validated method on a strong state is uncapped');
  is(capFor({ method: 'method-unproven', strength: 'strong' }), [{ by: 'method', from: 'fail' }], 'an unproven method is capped by method');
  is(capFor({ method: 'method-validated', strength: 'weak', prerequisiteVerified: false, profileVerified: null }).map(c => c.by), ['observability', 'prerequisite-unverified', 'profile-unverified'], 'each unverified thing is its own cap');
  is(applyCaps('pass', capFor({ method: 'method-unproven' })), 'pass', 'a cap on a pass leaves it a pass');
  is(applyCaps('fail', capFor({ method: 'method-unproven' })), 'finding', 'a fail under method-unproven is a finding');
  is(applyCaps('fail', []), 'fail', 'no cap, the fail stands');
  is(applyCaps('finding', []), 'finding', 'nothing is ever raised');

  // The example run: runs/j-authenticate server-error/r1. After the intercepted 500 the alert shows, the
  // button is enabled, and the email field is empty — the state is not held and the email signal says why.
  const before = { url: { path: '/login' }, dom: { 'input[name=email]': { present: true, value: sha8('agent@mail.sink.local') } } };
  const after = emailValue => ({ url: { path: '/login' }, a11y: { alerts: [{ role: 'alert', text: 'Server error, try again', visible: true }] },
    dom: { '[data-uxcli=login-submit]': { present: true, visible: true, enabled: true }, 'input[name=email]': { present: true, value: emailValue } }, network: [] });
  const r1 = holds(STATES['anon.login_failed_retryable'], after(''), { before, hash });
  is([r1.held, r1.strength], [false, 'medium'], 'server-error/r1: the state is not held');
  is(r1.signals, { 'role=alert visible': true, '[data-uxcli=login-submit] enabled': true, 'input[name=email] valueUnchanged': false }, 'server-error/r1: the signals of the example run');
  is(r1.why, ['input[name=email] valueUnchanged: false'], 'server-error/r1: the email signal is named');
  is(holds(STATES['anon.login_failed_retryable'], after('agent@mail.sink.local'), { before, hash }).held, true, 'the same state holds when the field keeps its value');
  is(holds(STATES['anon.login_failed_retryable'], after(''), { hash }).held, null, 'with no before-observation the field cannot be said to have changed');

  // url `matches`: a glob over the path — held on a run path, not on a project path, undecided with no url observed.
  const M = { signals: [{ observer: 'url', matches: '/r/*' }] };
  is(holds(M, { url: { path: '/r/crm-real-estate/j-handle-inbound-lead' } }, { hash }).held, true, 'url matches: a run path under /r/ holds');
  is(holds(M, { url: { path: '/p/crm-real-estate' } }, { hash }).held, false, 'url matches: a project path does not');
  is(holds(M, {}, { hash }).held, null, 'url matches: with no url observed it is undecided');

  return { ok: problems.length === 0, problems, checks };
}

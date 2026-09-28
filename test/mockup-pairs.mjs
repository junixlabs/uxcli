// Mockups, held by a pair: the agent draws, a person picks. A pick nobody stands behind is refused;
// a pick naming a variant that is not on disk is refused; a part that is the pick itself is refused.
// The screens come from the journeys in the order a reader meets them; the step that leaves a screen
// is its last ui interaction; a hook written with a run-time param still finds the mockup's hook.
// The page: the picked variant is the one the flow draws; the others sit in the gallery with the
// status the pick gives them; a screen with variants and no pick is drawn as `no pick yet`.
import { parsePick, statusOf, screensOf, hookOf, mockupsCard } from '../src/core/mockups.js';
import { flowRow, galleryHtml } from '../src/core/wireflow.js';
import { read } from './example-data.mjs';

export const OPERATOR = 'a pick without by{}, a pick naming a variant not on disk, a part naming the pick itself, and an unknown key are refused; '
  + 'the example picks are accepted; screens come in journey order and the leaving hook is the last ui interaction; '
  + 'the gallery marks pick, part and not taken; the flow draws the picked variant and says no pick yet when there is none';

export function pair() {
  const problems = []; let checks = 0;
  const must = (what, cond) => { checks++; if (!cond) problems.push(what); };
  const variants = ['a-list', 'b-kanban'];
  const good = { schema_version: 1, pick: 'a-list', parts: { 'b-kanban': 'the counters' }, by: { type: 'role', ref: 'product-owner' } };

  // must-pass
  must('a well-formed pick was refused', parsePick(good, variants).value?.pick === 'a-list');
  must('the example pick was refused', parsePick(read('mockups/agent.lead_detail/pick.json'), ['a-stacked', 'b-call-first']).value !== null);
  // must-fail
  must('a pick without by{} was accepted', parsePick({ ...good, by: undefined }, variants).problems.some(p => /nobody stands behind/.test(p)));
  must('a pick naming a variant not on disk was accepted', parsePick({ ...good, pick: 'c-none' }, variants).problems.some(p => /not a variant on disk/.test(p)));
  must('a part naming the pick itself was accepted', parsePick({ ...good, parts: { 'a-list': 'x' } }, variants).problems.some(p => /is the pick itself/.test(p)));
  must('an unknown key was accepted', parsePick({ ...good, approved: true }, variants).problems.some(p => /unknown key/.test(p)));
  must('a wrong schema_version was accepted', parsePick({ ...good, schema_version: 2 }, variants).problems.length > 0);

  // status
  const pk = parsePick(good, variants).value;
  must('statuses wrong', statusOf('a-list', pk) === 'pick' && statusOf('b-kanban', pk) === 'part' && statusOf('c', pk) === 'not-taken' && statusOf('a-list', null) === 'no-pick');

  // screens from the example journeys: order, leaving hook, param stripped
  const auth = read('journeys/authenticate.json'); const lead = read('journeys/handle-inbound-lead.json');
  const screens = screensOf([auth, lead]); const ids = screens.map(s => s.id);
  must('screens are not in journey order', ids[0] === 'anon.login_page' && ids.indexOf('agent.lead_detail') > ids.indexOf('agent.workspace_ready'));
  const login = screens.find(s => s.id === 'anon.login_page');
  must('the leaving hook is not the last ui interaction', login.leaves.every(l => l.target === '[data-uxcli=login-submit]'));
  must('a screen does not know both journeys that name it', screens.find(s => s.id === 'agent.workspace_ready').journeys.length === 2);
  must('a run-time param was not stripped from the hook', hookOf('[data-uxcli=lead-row][data-id={leadId}]') === '[data-uxcli=lead-row]');
  must('a plain hook was changed', hookOf('[data-uxcli=call-action]') === '[data-uxcli=call-action]');

  // the page
  const g = galleryHtml({ id: 'x', title: 'agent.workspace_ready', vw: 390, vh: 844, variants: [{ name: 'a-list', shot: 'a.png', status: 'pick' }, { name: 'b-kanban', shot: 'b.png', status: 'part', note: 'the counters' }, { name: 'c', shot: 'c.png', status: 'not-taken' }] });
  must('the gallery does not mark pick, part and not taken', /class="variant pick"/.test(g) && /class="variant part"/.test(g) && /not taken/.test(g) && /taken: the counters/.test(g));
  const f = flowRow({ id: 'w', kind: 'happy', vw: 390, vh: 844, frames: [{ shot: 'a.png', title: 's1', pill: { text: 'a-list', tone: 'ok' }, hot: { x: 10, y: 20, w: 100, h: 30 } }, { shot: null, title: 's2', missing: 'no pick yet · 2 variants', hot: null }], links: [{ label: 's1', text: 'tap' }] });
  must('the flow does not draw the hotspot from the rect', /class="hot" style="left:5px;top:9px/.test(f));
  must('the flow does not say no pick yet for an unpicked screen', /no pick yet · 2 variants/.test(f));
  must('a flow frame with a hotspot below the fold is not marked', /offhot/.test(flowRow({ id: 'w', vw: 390, vh: 844, frames: [{ shot: 'a.png', title: 's', hot: { off: true, target: '[data-uxcli=call-action]', scrolls: 2 } }, { shot: 'b.png', title: 't', hot: null }], links: [{ label: 's1' }] })));

  // the card names the refused pick and the screen with no pick
  const card = mockupsCard({ dir: '.', screens: [{ id: 'a', variants: ['x'], pick: null, problems: ['by{type, ref} missing'] }, { id: 'b', variants: ['y'], pick: null, problems: [] }, { id: 'c', variants: [], pick: null, problems: [] }] });
  must('the card does not say REFUSED for a bad pick', /REFUSED\s+a/.test(card) && /by\{type, ref\} missing/.test(card));
  must('the card does not say no pick yet / no mockup', /no pick yet\s+b/.test(card) && /no mockup\s+c/.test(card));
  return { ok: !problems.length, checks, problems };
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  const r = pair(); console.log(r.ok ? `PASS mock · ${r.checks} checks` : 'FAIL ' + r.problems.join('\n     ')); process.exit(r.ok ? 0 : 1);
}

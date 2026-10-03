// A measurement read against observations: shown deciding wrongly when the input lies, and right otherwise.
import { outcomeOf } from '../src/core/run/measure.js';

export const OPERATOR =
  'a predicate left as prose; a timing measurement below its threshold, then above it with the consequence '
  + 'absent; a target state no step reached; a state met at two steps, one of them the scope step; and a '
  + 'button below the fold whose outcome must carry how far';

const obs = (dom, extra = {}) => ({ url: { path: '/leads/ld_1' }, dom, a11y: { alerts: [] }, network: [], storage: {}, ...extra });
const CALL = '[data-uxcli=call-action]';
const below = obs({ [CALL]: { present: true, visible: true, enabled: true, inViewportWithoutScroll: false, scrollsNeeded: 2 } });
const inView = obs({ [CALL]: { present: true, visible: true, enabled: true, inViewportWithoutScroll: true, scrollsNeeded: 0 } });
const c1 = { id: 'C-001', scope: { step: 's2' }, measurements: [{ target: 'agent.lead_detail', predicate: { observer: 'dom', selector: CALL, inViewportWithoutScroll: true } }] };

export function pair() {
  const problems = []; let checks = 0;
  const must = (what, cond) => { checks++; if (!cond) problems.push(what); };
  const steps = [
    { id: 's1', before: { state: 'agent.workspace_ready' }, after: { state: 'agent.lead_detail' }, timing: { toStable: 611 }, shots: ['s1-after.png'], obs: { after: inView } },
    { id: 's2', before: { state: 'agent.lead_detail' }, after: { state: 'agent.call_started' }, shots: ['s2-before.png', 's2-after.png'], obs: { before: below, after: below } },
  ];
  const o = outcomeOf(c1, c1.measurements[0], 0, steps, { viewport: '390x844' });
  must('a state met at two steps was not read at the scope step', o.where === 's2');
  must('the before side was not preferred at the scope step', o.shot === 's2-before.png');
  must('a button two scrolls down was not not-held', o.outcome === 'not-held');
  must('how far the button sits was not in the outcome', /2 scrolls at 390x844/.test(o.what || ''));
  const held = outcomeOf({ ...c1, scope: { step: 's1' } }, c1.measurements[0], 0, steps, {});
  must('a button in view at s1 was not held', held.outcome === 'held' && held.where === 's1');
  must('prose predicate was not unmeasurable', outcomeOf(c1, { target: 'agent.lead_detail', predicate: 'in viewport' }, 0, steps).outcome === 'unmeasurable');
  must('an unreached state was not unmeasurable', outcomeOf(c1, { target: 'agent.nowhere', predicate: c1.measurements[0].predicate }, 0, steps).outcome === 'unmeasurable');
  const timing = { target: 's1', predicate: { observer: 'timing', field: 'toStable', gt: 1000, then: { observer: 'dom', selector: '[role=progressbar]', visible: true } } };
  must('611ms against gt 1000 was not condition-not-met', outcomeOf(c1, timing, 0, steps).outcome === 'condition-not-met');
  const slow = [{ ...steps[0], timing: { toStable: 2400 }, obs: { after: obs({ '[role=progressbar]': { present: false, visible: false } }) } }];
  must('2400ms with no progressbar was not not-held', outcomeOf(c1, timing, 0, slow).outcome === 'not-held');
  must('a timing at the cap was not unmeasurable', outcomeOf(c1, timing, 0, [{ ...steps[0], timing: { toStable: 10000 } }]).outcome === 'unmeasurable');
  return { ok: problems.length === 0, problems, checks };
}

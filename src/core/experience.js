// What a person goes through on a journey, read from the trace of one walk in Chrome. Not whether the
// page is well built — whether the person can do what they came to do, how much it asks of them, and
// where it makes them wait, scroll, or say the same thing twice.
//
// Every number here comes from the run packet (run.json): the steps the runner took, the interactions
// it recorded, the time each step took to settle. Every finding is method-unproven, so it is reported as
// a finding with the source of its threshold, never as a fail. Pure: a packet in, a report out.
//
// in:  a schema-2 run packet { journey, viewport, steps: [{ id, workflow, action, before, after,
//      interactions: [{ type, target, scrollsNeeded, rect, typed: { chars, value } , to, request, status, ms }],
//      timing: { toStable }, shots }] }
// out: { journey, viewport, steps: [...per step], totals, findings: [{ metric, step, what, source, shot, rect }] }

// Keystroke-Level Model operators, in seconds (Card, Moran & Newell, 1980; 1983). K is the average
// skilled typist; a click is pointing then pressing and releasing the button (P + BB).
export const KLM = { K: 0.2, P: 1.1, B: 0.1, H: 0.4, M: 1.35 };
const SRC = {
  klm: 'Card, Moran & Newell, The Keystroke-Level Model for User Performance Time with Interactive Systems (1980)',
  response: 'Jakob Nielsen, Response Times: The 3 Important Limits (1993) — 0.1 s, 1 s, 10 s',
  reach: 'Steve Krug, Don\'t Make Me Think; NN/g on content below the fold — what a step needs is where the person already is',
  twice: 'WCAG 2.2 SC 3.3.7 Redundant Entry — information entered before is not asked for again in the same process',
  reached: 'the project\'s own journey: the state this step must reach',
  kept: 'GOV.UK Design System, Error message — "Do not clear any form fields … Keep both passing and failing answers." (forms.keep-answers-after-an-error)',
  announced: 'WCAG 2.2 SC 3.3.1 Error Identification and 4.1.3 Status Messages — an error is described to the person in text and announced',
  consistent: 'WCAG 2.2 SC 3.2.3 Consistent Navigation — navigation repeated on several pages occurs in the same relative order',
};
export const LIMITS = { instant: 100, flow: 1000, attention: 10000 };

const band = ms => ms == null ? null : ms <= LIMITS.instant ? 'instant' : ms <= LIMITS.flow ? 'flow' : ms <= LIMITS.attention ? 'wait' : 'lost';
const round = n => Math.round(n * 10) / 10;

// One step's estimate. A target that is typed into: think, point, click, home to the keyboard, type,
// home back. A target that is clicked: think, point, click. Each scroll the target needs is counted as
// one more pointing operator — an approximation the original model does not define, and said so.
function klmOf(ui) {
  let s = 0; let typedUnknown = false;
  for (const x of ui) {
    s += KLM.M + KLM.P + 2 * KLM.B + (x.scrollsNeeded || 0) * KLM.P;
    if (x.typed) s += 2 * KLM.H + x.typed.chars * KLM.K;
    else if (x.fill) typedUnknown = true;
  }
  return { seconds: s, typedUnknown };
}

// The journey a packet walked: its id, or the file its ref names.
export const journeyName = run => { const j = run?.journey; if (!j) return null; if (typeof j === 'string') return j; return j.id || (j.ref ? String(j.ref).split('/').pop().replace(/\.json$/, '') : null); };

export function experience(run) {
  const steps = []; const findings = [];
  const typedAt = new Map();      // hash of a typed value → the first step it was typed at
  const visited = new Map();      // a path navigated to → the first step that went there
  const navAt = new Map();        // a navigation landmark → the first step it was seen at, and its items
  // A fixture step sets data up before the person arrives; it is not something the person goes through.
  for (const st of (run?.steps || []).filter(x => x.kind !== 'fixture')) {
    const ui = (st.interactions || []).filter(x => x.type === 'ui');
    const typed = ui.filter(x => x.typed);
    const clicks = ui.length - typed.length;
    const chars = typed.reduce((n, x) => n + x.typed.chars, 0);
    const scrolls = ui.reduce((n, x) => n + (x.scrollsNeeded || 0), 0);
    // response is the first visible change after the action when the walk recorded it, else the settle time
    const settle = st.timing?.firstChangeMs ?? st.timing?.toStable ?? null;
    const api = (st.interactions || []).filter(x => x.type === 'api' && typeof x.ms === 'number');
    const k = klmOf(ui);
    const seconds = k.seconds + (settle != null ? settle / 1000 : 0);
    const shotBefore = (st.shots || []).find(f => f.includes('-before')) || st.shots?.[0] || null;
    const shotAfter = (st.shots || []).find(f => f.includes('-after')) || st.shots?.[st.shots.length - 1] || null;
    const row = { id: st.id, workflow: st.workflow || null, action: st.action || null, clicks, fields: typed.length, chars, scrolls,
      settleMs: settle, response: band(settle), apiMs: api.reduce((n, x) => n + x.ms, 0), klmSeconds: round(seconds), reached: st.after?.held ?? null,
      shots: { before: shotBefore, after: shotAfter } };
    steps.push(row);

    // Past a second a person needs a sign that something is happening; one the observer saw answers it,
    // until attention is lost at ten seconds.
    const signalled = st.timing?.progressSeen === true;
    if (settle != null && settle > LIMITS.flow && (!signalled || settle > LIMITS.attention)) findings.push({ metric: 'response', step: st.id, workflow: st.workflow || null,
      what: `${st.action || st.id}: ${(settle / 1000).toFixed(1)} s before the screen settles${settle > LIMITS.attention ? ' — past 10 s attention is lost' : ' — past 1 s the person needs a sign that something is happening, and none was seen'}`,
      source: SRC.response, shot: shotAfter });
    for (const x of ui) if ((x.scrollsNeeded || 0) > 0) findings.push({ metric: 'reach', step: st.id, workflow: st.workflow || null,
      what: `${x.target} is ${x.scrollsNeeded} scroll${x.scrollsNeeded === 1 ? '' : 's'} away at ${x.viewport || run.viewport || 'this viewport'} when this step needs it`,
      source: SRC.reach, shot: shotBefore, element: x.target, scrolls: x.scrollsNeeded, state: st.before?.state || null, ...(x.rect && { rect: x.rect }) });
    for (const x of typed) {
      const first = typedAt.get(x.typed.value);
      if (first && first.step !== st.id && first.workflow === (st.workflow || null)) findings.push({ metric: 'asked-twice', step: st.id, workflow: st.workflow || null,
        what: `the answer typed into ${x.target} was already typed at ${first.step} (${first.target})`,
        source: SRC.twice, shot: shotBefore, ...(x.rect && { rect: x.rect }) });
      else if (!first) typedAt.set(x.typed.value, { step: st.id, target: x.target, workflow: st.workflow || null });
    }
    if (st.after?.held === false) findings.push({ metric: 'not-reached', step: st.id, workflow: st.workflow || null,
      what: `${st.action || st.id} did not reach ${st.after.state}${st.after.what ? `: ${st.after.what}` : ''}`, source: SRC.reached, shot: shotAfter });
    // Recovery: a step the server answered with an error is where answers get lost and messages go missing.
    const errored = (st.interactions || []).some(i => i.type === 'api' && (i.status >= 400 || i.blocked));
    if (errored) {
      row.error = true;
      // A password is cleared after a failed sign-in on purpose: the security exception GOV.UK and the
      // platforms make, so it is not counted.
      for (const x of typed) if (x.typed.keptAfter === false && !x.typed.secret) findings.push({ metric: 'recovery', step: st.id, workflow: st.workflow || null,
        what: `after the error, ${x.target} no longer holds what the person typed — they have to type it again`, source: SRC.kept, shot: shotAfter, ...(x.rect && { rect: x.rect }) });
      if (Array.isArray(st.announced) && !st.announced.length) findings.push({ metric: 'recovery', step: st.id, workflow: st.workflow || null,
        what: `${st.action || st.id}: the server answered with an error and nothing on the page announced it (no visible role=alert, role=status or live region with text)`, source: SRC.announced, shot: shotAfter });
    }
    // Consistency: the same navigation, in the same order, on every screen of the workflow that shows it.
    for (const [i, n] of (st.nav || []).entries()) {
      const key = `${st.workflow}|${n.label || `nav ${i + 1}`}`;
      const seen = navAt.get(key);
      if (!seen) { navAt.set(key, { step: st.id, items: n.items }); continue; }
      const common = n.items.filter(t => seen.items.includes(t));
      const order = seen.items.filter(t => common.includes(t));
      if (common.length > 1 && common.join('\u0000') !== order.join('\u0000')) findings.push({ metric: 'consistency', step: st.id, workflow: st.workflow || null,
        what: `${n.label ? `the "${n.label}" navigation` : `navigation ${i + 1}`} reads ${common.join(' · ')} here and ${order.join(' · ')} at ${seen.step}`, source: SRC.consistent, shot: shotBefore });
    }
    for (const x of (st.interactions || []).filter(i => i.type === 'navigation' && i.to)) {
      const was = visited.get(`${st.workflow}|${x.to}`);
      if (was && was !== st.id) row.revisits = [...(row.revisits || []), { to: x.to, first: was }];
      else visited.set(`${st.workflow}|${x.to}`, st.id);
    }
    if (k.typedUnknown) row.typedUnknown = true;
  }
  // A journey's workflows are alternatives — the happy path, a wrong password, a server error — and a
  // person goes through one of them, so each is totalled on its own. The first is the one the runner
  // walked first, the happy path; `totals` is that one's.
  const totalsOf = xs => ({
    steps: xs.length,
    clicks: xs.reduce((n, s) => n + s.clicks, 0),
    fields: xs.reduce((n, s) => n + s.fields, 0),
    chars: xs.reduce((n, s) => n + s.chars, 0),
    scrolls: xs.reduce((n, s) => n + s.scrolls, 0),
    klmSeconds: round(xs.reduce((n, s) => n + s.klmSeconds, 0)),
    slowestMs: xs.reduce((m, s) => Math.max(m, s.settleMs ?? 0), 0),
    reached: xs.filter(s => s.reached === true).length,
  });
  const ids = [...new Set(steps.map(s => s.workflow))];
  const workflows = ids.map(id => ({ id, totals: totalsOf(steps.filter(s => s.workflow === id)) }));
  const totals = workflows[0]?.totals || totalsOf([]);
  const viewport = run?.viewport || (run?.steps || []).flatMap(x => x.interactions || []).find(x => x.viewport)?.viewport || null;
  return { journey: journeyName(run), viewport, ranAt: run?.ranAt || null, steps, workflows, totals, findings, sources: { klm: SRC.klm, response: SRC.response } };
}

// Two walks of the same journey, side by side: what moved, by how much. Totals are the first
// workflow's on each side; steps and findings are matched within their workflow.
export function compareExperience(a, b) {
  const keys = ['steps', 'clicks', 'fields', 'chars', 'scrolls', 'klmSeconds', 'slowestMs'];
  const totals = Object.fromEntries(keys.map(k => [k, { a: a.totals[k], b: b.totals[k], delta: round((b.totals[k] ?? 0) - (a.totals[k] ?? 0)) }]));
  const sk = s => `${s.workflow}/${s.id}`;
  const ids = [...new Set([...a.steps.map(sk), ...b.steps.map(sk)])];
  const steps = ids.map(id => { const x = a.steps.find(s => sk(s) === id); const y = b.steps.find(s => sk(s) === id); return { id, a: x?.klmSeconds ?? null, b: y?.klmSeconds ?? null, only: !x ? 'b' : !y ? 'a' : null }; });
  const key = f => `${f.metric}|${f.workflow}|${f.step}|${f.what}`;
  return { totals, steps, fixed: a.findings.filter(f => !b.findings.some(g => key(g) === key(f))), introduced: b.findings.filter(f => !a.findings.some(g => key(g) === key(f))) };
}

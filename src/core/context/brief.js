// The brief: what an agent reads before it designs a screen. Assembled from what the project has
// authored — an understanding, a journey, the commitments in its scope — and from what was last
// observed. It adds nothing: no pattern, no advice, no claim of its own. Where the project has not
// written something down, the brief says so, and an unknown is printed before any insight because
// the one thing an agent must not do is turn a gap into a fact.
//
// in:  { actors, insights, journeys, commitments, index, journeyId }  (parsed values, projection)
// out: { journey, actor, unknowns, insights, states, steps, commitments, lastRun, problems }
import { confidenceCeiling } from '../model/user-model.js';

const idOf = ref => String(ref || '').replace(/^.*\//, '').replace(/\.json$/, '').replace(/#.*$/, '');
const insightId = ref => (/understanding\/insights\//.test(String(ref)) ? idOf(ref) : null);

// One line per signal: the hook the screen must carry, and what is asked of it.
export function signalText(s) {
  switch (s?.observer) {
    case 'url': return `url ${s.path ? 'path ' + s.path : 'matches ' + s.matches}`;
    case 'dom': return `dom ${s.selector} ${['visible', 'inViewportWithoutScroll', 'enabled', 'valueUnchanged'].filter(k => typeof s[k] === 'boolean').map(k => `${k}=${s[k]}`).join(' ')}`;
    case 'text': return `text ${s.selector} ${s.contains ? `contains "${s.contains}"` : `equals field ${s.equalsField}${s.normalize ? ' (' + s.normalize + ')' : ''}`}`;
    case 'network': return `network ${s.request}${s.status ? ' → ' + s.status : ''}`;
    case 'a11y': return `a11y role=${s.role}${typeof s.visible === 'boolean' ? ' visible=' + s.visible : ''}`;
    case 'storage': return `storage ${s.key}${typeof s.present === 'boolean' ? ' present=' + s.present : ''}`;
    case 'timing': return `timing ${s.field} ${s.gt !== undefined ? '> ' + s.gt + 'ms' : s.lt !== undefined ? '< ' + s.lt + 'ms' : ''}${s.then ? ' then ' + signalText(s.then) : ''}`;
    default: return JSON.stringify(s);
  }
}

const inScope = (c, journeyId) => c?.scope?.journey === journeyId;

export function brief({ actors = [], insights: insightList = [], journeys = [], commitments = [], index = {}, journeyId = null } = {}) {
  const problems = [];
  const journey = journeyId ? journeys.find(j => j?.id === journeyId) || null : journeys[0] || null;
  if (journeyId && !journey) problems.push(`no journey ${journeyId} in .uxcli/journeys/ — have: ${journeys.map(j => j?.id).filter(Boolean).join(', ') || 'none'}`);

  // The actor the journey names, else the first actor on disk.
  const actor = (journey && actors.find(m => m?.value?.actor === journey.actor)) || actors[0] || null;
  if (journey && !actor) problems.push(`journey ${journey.id} names actor ${journey.actor} and no understanding on disk describes them`);
  else if (journey && actor.value?.actor !== journey.actor) problems.push(`journey ${journey.id} names actor ${journey.actor}; the understanding on disk is ${actor.value?.actor}`);
  const model = actor?.value || null;
  // Insights about the domain, the product, or this actor. Another actor's are not this screen's.
  const mine = insightList.filter(i => i?.value && (i.value.about !== undefined ? !/^actor:/.test(i.value.about) || i.value.about === `actor:${model?.actor}` : true));

  // Which insights this screen leans on: the journey's trace, and every in-scope commitment's.
  const scoped = commitments.filter(c => journey ? inScope(c, journey.id) : true);
  const leans = new Map();
  const lean = (ref, by) => { const id = insightId(ref); if (!id) return; if (!leans.has(id)) leans.set(id, []); leans.get(id).push(by); };
  for (const t of journey?.trace || []) lean(t, journey.id);
  for (const c of scoped) for (const t of c.trace || []) lean(t, c.id);
  if (journey && !(journey.trace || []).length) problems.push(`journey ${journey.id} has no trace[] — it names no insight, so nothing says why it exists`);

  const standing = (index.standing || {})['understanding/insights'] || {};
  const insights = mine.map(({ value: i, file }) => {
    const ceiling = confidenceCeiling(i);
    const s = standing[i.id] || {};
    return { id: i.id, file, about: i.about || null, claim: i.claim, ceiling, claimed: i.confidence, overclaims: i.confidence && i.confidence !== ceiling && ['hypothesis', 'low', 'medium', 'high'].indexOf(i.confidence) > ['hypothesis', 'low', 'medium', 'high'].indexOf(ceiling),
      source: i.source ? `${i.source.type || '?'}: ${i.source.ref || '?'}` : null, evidence: i.evidence || [],
      wouldChangeIf: i.wouldChangeIf?.text || null, lastCheck: i.lastCheck ? { at: String(i.lastCheck.at).slice(0, 10), fired: !!i.lastCheck.fired, observed: i.lastCheck.observed } : null,
      demoted: s.demoted || (i.demotedAt ? String(i.demotedAt).slice(0, 10) : null), leanedOnBy: leans.get(i.id) || [] };
  });
  for (const [id, by] of leans) if (!insights.some(i => i.id === id)) problems.push(`${by.join(', ')} trace to ${id}, which no understanding on disk carries`);

  // The screen, as the journey defines it: every state it must be able to hold, and the hooks each needs.
  const states = Object.entries(journey?.states || {}).filter(([, s]) => !s?.$ref).map(([name, s]) => ({
    name, strength: s.strength, signals: (s.signals || []).map(signalText), mustMatch: s.mustMatch || [], mustNotMatch: s.mustNotMatch || [] }));
  const refs = Object.entries(journey?.states || {}).filter(([, s]) => s?.$ref).map(([name, s]) => ({ name, ref: s.$ref }));
  const steps = (journey?.workflows || []).flatMap(w => (w.steps || []).map(st => ({ workflow: w.id, kind: w.kind, id: st.id, action: st.action || (st.kind === 'fixture' ? `fixture ${st.profile}` : null), before: st.before || null, after: st.after || null,
    hooks: (st.interactions || []).filter(x => x.type === 'ui' && x.target).map(x => x.target) })));

  const cs = (index.standing || {}).commitments || {};
  const commits = scoped.map(c => ({ id: c.id, status: c.status, statement: c.statement, owner: c.owner ? `${c.owner.type}: ${c.owner.ref}` : null,
    where: [c.scope?.workflow, c.scope?.step].filter(Boolean).join('/') || c.scope?.state || 'whole journey', viewports: c.scope?.viewports || [],
    measurements: (c.measurements || []).map(m => ({ text: signalText(m.predicate), target: m.target, method: m.method })), standing: cs[c.id] || null }));

  const lastRun = journey ? (index.rows || []).find(r => idOf(r.target) === `j-${journey.id}` || idOf(r.target).startsWith(`j-${journey.id}@`)) || null : null;

  return { journey: journey ? { id: journey.id, goal: journey.goal, actor: journey.actor, trace: journey.trace || [] } : null,
    actor: model ? { file: actor.file, actor: model.actor, roles: model.roles || [], contexts: model.contexts || [], jobs: model.jobs || [], behaviors: model.behaviors || [], habits: model.habits || [], expectations: model.expectations || [], pains: model.pains || [], constraints: model.constraints || [] } : null,
    unknowns: model?.unknowns || [], insights, states, refs, steps, commitments: commits, lastRun, problems };
}

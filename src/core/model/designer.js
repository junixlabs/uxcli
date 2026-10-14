// The designer's own files: a profile (what it believes, its defaults per axis, what it never does,
// what it decides alone and what it asks), and decisions (a question, options with grounds, the
// agent's proposal, the owner's feedback, a challenge, the resolution, and what may be learned).
// One profile is global (~/.uxcli/designer/), one may sit in the project and wins field by field.
// Pure: parsers in, { value, problems } out.
import { isStr, isObj, isDate, done, signerProblem, versionProblem } from './common.js';
import { AXES, axisOf } from './catalog.js';

export const PRIORITY = ['user-data', 'accessibility-standard', 'project-commitments', 'design-system', 'foundation-rules', 'taste', 'trends'];
export const TOPICS = [...AXES, 'library', 'tokens', 'copy', 'spacing', 'component', 'pattern'];
export const GROUNDS = ['rule', 'viewpoint', 'research', 'insight', 'commitment', 'taste'];
export const FEEDBACK = ['taste', 'context', 'rule-conflict', 'unclear'];
export const STATES = ['open', 'agreed', 'owner-overrode', 'agent-convinced'];
export const SCOPES = ['global', 'project', 'none'];
const PROFILE_KEYS = ['schema_version', 'by', 'when', 'beliefs', 'defaults', 'never', 'priority', 'decides', 'exceptions', 'note'];

// Neutral: no taste yet. Everything is asked; nothing is a default until a decision earns it.
export const neutralProfile = (by, when) => ({
  schema_version: 1, by, when,
  beliefs: [], defaults: Object.fromEntries(AXES.map(a => [a, null])), never: [], priority: [...PRIORITY],
  decides: { alone: ['spacing', 'copy', 'component'], asks: [...AXES, 'library', 'tokens', 'pattern'] },
});

export function parseProfile(doc, { catalog = null, project = false } = {}) {
  const problems = [];
  if (!isObj(doc)) return done(null, ['not an object']);
  const v = versionProblem(doc, 1); if (v) problems.push(v);
  const s = signerProblem(doc.by, 'by'); if (s) problems.push(s);
  if (!isDate(doc.when)) problems.push('when: the date it was written');
  if (!Array.isArray(doc.beliefs) || doc.beliefs.some(b => !isObj(b) || !isStr(b.says) || !isStr(b.source))) problems.push('beliefs: a list of { says, source } — a belief without the page it came from is a mood');
  if (!isObj(doc.defaults)) problems.push('defaults: { A..G: null or a list of codes }');
  else for (const [a, codes] of Object.entries(doc.defaults)) {
    if (!AXES.includes(a)) { problems.push(`defaults.${a}: not an axis (${AXES.join(', ')})`); continue; }
    if (codes === null) continue;
    if (!Array.isArray(codes) || !codes.length || codes.some(c => axisOf(c) !== a)) problems.push(`defaults.${a}: null, or a list of axis ${a} codes`);
    else if (catalog) for (const c of codes) if (!catalog.codes.has(c)) problems.push(`defaults.${a}: "${c}" is not in the catalog`);
  }
  if (!Array.isArray(doc.never) || doc.never.some(x => !isStr(x))) problems.push('never: a list of sentences');
  if (!Array.isArray(doc.priority) || doc.priority.some(p => !PRIORITY.includes(p))) problems.push(`priority: an order of ${PRIORITY.join(', ')}`);
  else if (doc.priority.indexOf('accessibility-standard') > doc.priority.indexOf('taste') && doc.priority.includes('taste')) problems.push('priority: taste above the accessibility standard — taste never outranks a standard');
  const d = doc.decides;
  if (!isObj(d) || !Array.isArray(d.alone) || !Array.isArray(d.asks) || [...d.alone, ...d.asks].some(t => !TOPICS.includes(t))) problems.push(`decides: { alone[], asks[] } of ${TOPICS.join(', ')}`);
  else if (d.alone.some(t => d.asks.includes(t))) problems.push('decides: a topic both decided alone and asked');
  if (doc.exceptions !== undefined) {
    if (!project) problems.push('exceptions: only a project may set aside a foundation rule, and only for itself');
    else if (!Array.isArray(doc.exceptions)) problems.push('exceptions: a list');
    else doc.exceptions.forEach((e, i) => {
      const at = `exceptions[${i}]`;
      if (!isObj(e) || !isStr(e.rule) || !isStr(e.why) || !isStr(e.decision)) return problems.push(`${at}: { rule, why, decision, by }`);
      if (catalog && !catalog.rules.some(r => r.id === e.rule)) problems.push(`${at}.rule: "${e.rule}" is not a foundation rule`);
      if (!isObj(e.by) || e.by.type !== 'person' || !isStr(e.by.ref)) problems.push(`${at}.by: a foundation rule is set aside by the owner, a person, never an agent`);
    });
  }
  for (const k of Object.keys(doc)) if (!PROFILE_KEYS.includes(k)) problems.push(`unknown key "${k}"`);
  return done(problems.length ? null : doc, problems);
}

// Project wins field by field; per axis for defaults. Exceptions come from the project only.
export function mergeProfiles(global, project) {
  if (!global && !project) return null;
  const g = global || {}, p = project || {};
  const pick = k => p[k] !== undefined ? p[k] : g[k];
  const defaults = Object.fromEntries(AXES.map(a => {
    const pv = p.defaults?.[a], gv = g.defaults?.[a];
    return [a, pv ? { codes: pv, from: 'project' } : gv ? { codes: gv, from: 'global' } : null];
  }));
  return { beliefs: pick('beliefs') || [], defaults, never: pick('never') || [], priority: pick('priority') || PRIORITY, decides: pick('decides') || { alone: [], asks: TOPICS }, exceptions: p.exceptions || [], from: { global: !!global, project: !!project } };
}

const closed = s => s && s !== 'open';

// A decision, read against the effective profile (who may close what) and the catalog (rule refs, codes).
export function parseDecision(doc, { profile = null, catalog = null } = {}) {
  const problems = [];
  if (!isObj(doc)) return done(null, ['not an object']);
  const v = versionProblem(doc, 1); if (v) problems.push(v);
  if (!isStr(doc.id) || !/^D-\d{4}$/.test(doc.id)) problems.push('id: D-NNNN');
  if (!isDate(doc.when)) problems.push('when: the date it was asked');
  if (!isStr(doc.question)) problems.push('question: what is being decided');
  if (!TOPICS.includes(doc.about)) problems.push(`about: one of ${TOPICS.join(', ')}`);
  if (doc.context !== undefined && !isObj(doc.context)) problems.push('context: { formula?, journey?, state?, pick? }');
  const opts = Array.isArray(doc.options) ? doc.options : [];
  const ids = opts.map(o => o?.id);
  opts.forEach((o, i) => {
    const at = `options[${i}]`;
    if (!isObj(o) || !isStr(o.id) || !isStr(o.says)) return problems.push(`${at}: { id, says, grounds[] }`);
    if (ids.indexOf(o.id) !== i) problems.push(`${at}.id: "${o.id}" appears twice`);
    if (!Array.isArray(o.grounds)) return problems.push(`${at}.grounds: a list`);
    o.grounds.forEach((g, j) => {
      if (!isObj(g) || !GROUNDS.includes(g.kind) || !isStr(g.ref)) return problems.push(`${at}.grounds[${j}]: { kind: ${GROUNDS.join('|')}, ref }`);
      if (g.kind === 'rule' && catalog && !catalog.rules.some(r => r.id === g.ref)) problems.push(`${at}.grounds[${j}]: "${g.ref}" is not a foundation rule`);
    });
  });
  const p = doc.proposal;
  if (!isObj(p) || !ids.includes(p.option) || !isStr(p.why)) problems.push('proposal: { option, why } — the agent says which it would pick and why');
  const fb = Array.isArray(doc.feedback) ? doc.feedback : (doc.feedback === undefined ? [] : null);
  if (!fb) problems.push('feedback: a list');
  (fb || []).forEach((f, i) => {
    if (!isObj(f) || !isStr(f.said) || !FEEDBACK.includes(f.kind)) return problems.push(`feedback[${i}]: { by, said, kind: ${FEEDBACK.join('|')} }`);
    const s = signerProblem(f.by, `feedback[${i}].by`, { signs: false }); if (s) problems.push(s);
  });
  const clarify = Array.isArray(doc.clarify) ? doc.clarify : [];
  if (doc.clarify !== undefined && (!Array.isArray(doc.clarify) || clarify.some(c => !isObj(c) || !isStr(c.asked)))) problems.push('clarify: a list of { asked, answer? }');
  const ch = doc.challenge;
  if (ch !== undefined && (!isObj(ch) || !isStr(ch.argument) || !Array.isArray(ch.grounds) || !ch.grounds.length || ch.grounds.some(g => !isObj(g) || !GROUNDS.includes(g.kind) || !isStr(g.ref)))) problems.push('challenge: { argument, grounds[] } — a challenge without grounds is an opinion');
  const r = doc.resolution;
  if (!isObj(r) || !STATES.includes(r.state)) problems.push(`resolution: { state: ${STATES.join('|')}, … }`);
  else if (closed(r.state)) {
    if (opts.length < 2) problems.push('options: a decision closes over two options at least — one option is not a choice');
    if (opts.some(o => !Array.isArray(o?.grounds) || !o.grounds.length)) problems.push('options: every option carries a ground before the decision closes');
    if (!ids.includes(r.chosen)) problems.push('resolution.chosen: one of the option ids');
    if (!isStr(r.why)) problems.push('resolution.why: why this one');
    const s = signerProblem(r.by, 'resolution.by'); if (s) problems.push(s);
    if (isObj(p) && r.state === 'agreed' && r.chosen !== p.option) problems.push('resolution: "agreed" chose another option than the proposal — that is owner-overrode');
    if (isObj(p) && r.state === 'owner-overrode' && r.chosen === p.option) problems.push('resolution: "owner-overrode" chose the proposal — that is agreed');
    if (['owner-overrode', 'agent-convinced'].includes(r.state) && !ch) problems.push(`resolution: "${r.state}" with no challenge — the agent states its grounds once before the owner decides`);
    if ((fb || []).some(f => f?.kind === 'rule-conflict') && !ch) problems.push('feedback: a rule-conflict closes only after a grounded challenge');
    if ((fb || []).some(f => f?.kind === 'unclear') && !clarify.length) problems.push('feedback: unclear feedback closes only after a clarify question');
    if (r.by?.type === 'agent' && (profile?.decides?.asks || TOPICS).includes(doc.about)) problems.push(`resolution.by: an agent closed a decision about ${doc.about}, which the profile says it asks`);
  } else if (r.chosen !== undefined) problems.push('resolution: an open decision has chosen nothing');
  const l = doc.learn;
  if (!isObj(l) || !SCOPES.includes(l.scope) || !Array.isArray(l.signals)) problems.push(`learn: { scope: ${SCOPES.join('|')}, signals[] }`);
  else {
    if (l.scope === 'none' && l.signals.length) problems.push('learn: scope none carries no signals');
    l.signals.forEach((s, i) => {
      if (!isObj(s) || !isStr(s.prefer) || !isStr(s.over) || !(AXES.includes(s.axis) || s.axis === 'library')) return problems.push(`learn.signals[${i}]: { axis, prefer, over }`);
      if (s.axis !== 'library' && (axisOf(s.prefer) !== s.axis || axisOf(s.over) !== s.axis || (catalog && (!catalog.codes.has(s.prefer) || !catalog.codes.has(s.over))))) problems.push(`learn.signals[${i}]: prefer and over are axis ${s.axis} codes in the catalog`);
    });
    const kinds = new Set((fb || []).map(f => f?.kind));
    if (l.signals.length && kinds.has('context') && !kinds.has('taste')) problems.push('learn: the feedback was context — a fact about the users, not taste; propose it as an insight, learn nothing');
    if (l.scope === 'global' && kinds.has('rule-conflict')) problems.push('learn: a rule-conflict is never learned globally; at most it is this project\'s exception');
  }
  for (const k of Object.keys(doc)) if (!['schema_version', 'id', 'when', 'question', 'about', 'context', 'options', 'proposal', 'feedback', 'clarify', 'challenge', 'resolution', 'learn'].includes(k)) problems.push(`unknown key "${k}"`);
  return done(problems.length ? null : doc, problems);
}

// A cognitive walkthrough of one walk: at each step, the four questions of the method answered by
// someone looking at that step's screenshot — optionally as one of the project's own actors. It is the
// reviewer's claim, never a verdict; where an answer says the person will manage and the instrument
// measured that they cannot (the control below the fold, the step that did not arrive), the claim is
// refused. Pure: parsers and checks in, { value, problems } out.
import { isStr, isObj } from './common.js';

export const METHOD = 'Wharton, Rieman, Lewis & Polson, The Cognitive Walkthrough Method: A Practitioner\'s Guide (1994)';
export const QUESTIONS = {
  goal: 'Will the person try to achieve the right effect here — is this what they are trying to do at this point?',
  notice: 'Will the person notice that the correct action is available?',
  associate: 'Will the person connect that action with the effect they want?',
  progress: 'After the action, will the person see that they are making progress toward their goal?',
};
export const ANSWERS = ['yes', 'no', 'unsure'];
const KEYS = Object.keys(QUESTIONS);

export const stepKey = s => `${s.workflow || ''}/${s.id}`;

// An empty walkthrough: every step of the walk, every question, nothing answered.
export function walkthroughTemplate({ journey, run, steps, as = null, by, at }) {
  return {
    schema_version: 1, journey, run, ...(as && { as }), by, at, method: METHOD,
    steps: Object.fromEntries(steps.filter(s => s.kind !== 'fixture').map(s => [stepKey(s), {
      action: s.action || s.id, shot: (s.shots || []).find(f => f.includes('-before')) || s.shots?.[0] || null,
      ...Object.fromEntries(KEYS.map(k => [k, { answer: null, why: '' }])),
    }])),
  };
}

export function parseWalkthrough(doc, { steps = [], actors = [] } = {}) {
  const problems = [];
  if (!isObj(doc)) return { value: null, problems: ['not an object'] };
  if (doc.schema_version !== 1) problems.push('schema_version must be 1');
  if (!isStr(doc.journey)) problems.push('journey: required');
  if (!isStr(doc.run) || !/^runs\/R-[^/]+$/.test(doc.run)) problems.push('run: runs/R-… — the walk this looks at');
  if (!isObj(doc.by) || !isStr(doc.by.type) || !isStr(doc.by.ref)) problems.push('by: { type, ref } — who answered');
  else if (doc.by.type === 'agent' && (!isStr(doc.by.onBehalfOf) || /^<.*>$/.test(doc.by.onBehalfOf))) problems.push('by.onBehalfOf: an agent answers on a person\'s say-so, and names them');
  if (doc.as !== undefined && (!isStr(doc.as) || !actors.includes(doc.as))) problems.push(`as: "${doc.as}" is not an actor under understanding/actors/ — a persona is one the project wrote, not one imagined`);
  if (!isObj(doc.steps)) { problems.push('steps: one entry per step of the walk'); return { value: null, problems }; }
  const want = steps.filter(s => s.kind !== 'fixture').map(stepKey);
  for (const k of want) if (!doc.steps[k]) problems.push(`steps["${k}"]: a step of the walk with no answers`);
  for (const k of Object.keys(doc.steps)) if (want.length && !want.includes(k)) problems.push(`steps["${k}"]: not a step of this walk`);
  for (const [k, st] of Object.entries(doc.steps)) for (const q of KEYS) {
    const a = st?.[q];
    if (!isObj(a) || !ANSWERS.includes(a.answer)) { problems.push(`steps["${k}"].${q}: answer yes, no or unsure`); continue; }
    if (!isStr(a.why) || !a.why.trim()) problems.push(`steps["${k}"].${q}: why — what on the screenshot makes it so`);
    if (a.answer !== 'yes' && !isStr(a.where)) problems.push(`steps["${k}"].${q}: where — the element or region a "${a.answer}" is about`);
  }
  for (const k of Object.keys(doc)) if (!['schema_version', 'journey', 'run', 'as', 'by', 'at', 'method', 'steps'].includes(k)) problems.push(`unknown key "${k}"`);
  return { value: problems.length ? null : doc, problems };
}

// Claims the instrument contradicts. A "yes" to notice where the step's control was measured below the
// fold; a "yes" to progress where the step did not reach its state or the screen took past a second to
// settle with nothing announced.
export function contradictions(doc, report) {
  const out = [];
  for (const [k, st] of Object.entries(doc?.steps || {})) {
    const [wf, id] = k.split('/');
    const at = f => f.step === id && (f.workflow || '') === wf;
    const fs = (report?.findings || []).filter(at);
    if (st.notice?.answer === 'yes') for (const f of fs.filter(f => f.metric === 'reach')) out.push(`steps["${k}"].notice says yes; the walk measured ${f.what}`);
    if (st.progress?.answer === 'yes') for (const f of fs.filter(f => f.metric === 'not-reached' || f.metric === 'response')) out.push(`steps["${k}"].progress says yes; the walk measured ${f.what}`);
  }
  return out;
}

// The answers that are findings: every "no" and "unsure", in the reviewer's words.
export const walkthroughFindings = doc => Object.entries(doc?.steps || {}).flatMap(([k, st]) => KEYS.filter(q => st[q] && st[q].answer !== 'yes').map(q => ({
  metric: 'walkthrough', step: k.split('/')[1], workflow: k.split('/')[0] || null, question: q, answer: st[q].answer,
  what: `${QUESTIONS[q]} ${st[q].answer} — ${st[q].why}${st[q].where ? ` (${st[q].where})` : ''}`, source: `${METHOD}${doc.as ? `, as ${doc.as}` : ''}`,
})));

// A Journey: what should happen, as states that are predicates and steps that carry data forward.
//
// in:  the parsed journey file; `refs` maps a state's `$ref` string to the state it points at
//      (this module reads no files — a `$ref` the caller did not resolve stays `{ $ref, unresolved }`)
// out: { ok, value, problems } — value is the journey with every resolved state carrying
//      `derivedStrength`, and `strength` = what the author wrote, or the derived one if they wrote nothing
import { isStr, isObj, strList, done, REACH } from './common.js';
import { signalProblems, strengthOf, STRENGTHS } from './signal.js';

const KINDS = ['happy', 'recovery'];
const MODES = ['real', 'intercept'];
// The one string field each interaction type must carry; `{param}` inside it is bound by `consumes`.
const FIELD = { ui: 'target', navigation: 'to', api: 'request', data: 'expr', system: 'expr' };

const PLACEHOLDER = /\{([A-Za-z0-9_.]+)\}/g;
export const placeholders = s => [...String(s ?? '').matchAll(PLACEHOLDER)].map(m => m[1]);
// `lead.id` binds `{leadId}` and `{lead.id}`; `response.workspaceId` binds `{workspaceId}` — the three
// spellings the example data uses, and nothing looser.
const camel = n => n.split('.').map((p, i) => i ? p[0].toUpperCase() + p.slice(1) : p).join('');
export const binds = (name, param) => name === param || camel(name) === param || name.split('.').pop() === param;

const stateOf = (s, at, bad) => {
  if (!isObj(s)) { bad.push(`${at}: a state is an object { signals[], mustMatch[], mustNotMatch[] }`); return null; }
  if (!Array.isArray(s.signals)) bad.push(`${at}.signals: required, a list (empty means unverifiable)`);
  else s.signals.forEach((sig, i) => bad.push(...signalProblems(sig, `${at}.signals[${i}]`)));
  const derived = strengthOf(s);
  if (s.strength !== undefined) {
    if (!STRENGTHS.includes(s.strength)) bad.push(`${at}.strength: \`${s.strength}\` is not one of ${STRENGTHS.join(', ')}`);
    else if (STRENGTHS.indexOf(s.strength) > STRENGTHS.indexOf(derived))
      bad.push(`${at}.strength: ${s.strength} claims more than the signals give — derived ${derived}; an author may lower strength, never raise it`);
  }
  for (const k of ['mustMatch', 'mustNotMatch']) if (s[k] !== undefined && !strList(s[k])) bad.push(`${at}.${k}: a list of state names or url patterns`);
  return { ...s, strength: STRENGTHS.includes(s.strength) ? s.strength : derived, derivedStrength: derived };
};

// A predicate that is true everywhere tells nothing apart, so every state names what it is not. An
// entry is read the three ways observe/holds.js reads it: a state name, a url glob starting with `/`
// (no whitespace), or prose — which the runtime leaves unchecked rather than refuses.
export function discriminationProblems(journey) {
  const bad = [];
  const states = isObj(journey?.states) ? journey.states : {};
  for (const [name, s] of Object.entries(states)) {
    if (!isObj(s) || s.$ref) continue;
    const at = `states[${name}].mustNotMatch`;
    if (!Array.isArray(s.mustNotMatch) || !s.mustNotMatch.length) { bad.push(`${at}: empty — a state that matches everywhere discriminates nothing; name a state or url it must not match`); continue; }
    for (const m of s.mustNotMatch) if (!isStr(m)) bad.push(`${at}: ${JSON.stringify(m)} is not a state name, a url pattern or a sentence`);
      else if (m === name) bad.push(`${at}: a state cannot be what it must not match`);
  }
  return bad;
}

const stepsOf = (w, wat, journey, bad) => {
  const ids = new Set();
  const produced = new Set();
  for (const [i, st] of w.steps.entries()) {
    const at = `${wat}.steps[${i}]`;
    if (!isObj(st)) { bad.push(`${at}: a step is an object`); continue; }
    if (!isStr(st.id)) bad.push(`${at}.id: required`);
    else if (ids.has(st.id)) bad.push(`${at}.id: \`${st.id}\` is already a step in this workflow`); else ids.add(st.id);
    if (st.kind === 'fixture') {
      if (!isStr(st.profile)) bad.push(`${at}.profile: a fixture step names the data profile it materializes`);
      else if (!(journey.requires?.dataProfiles || []).includes(st.profile)) bad.push(`${at}.profile: \`${st.profile}\` is not in requires.dataProfiles`);
      if (st.params !== undefined && !isObj(st.params)) bad.push(`${at}.params: an object of param values`);
      if (!strList(st.produces) || !st.produces.length) bad.push(`${at}.produces: a fixture exists to produce ids the next step consumes; name them`);
      else st.produces.forEach(p => produced.add(p));
      continue;
    }
    for (const k of ['before', 'after']) if (!isStr(st[k])) bad.push(`${at}.${k}: a state name`);
      else if (!(st[k] in journey.states)) bad.push(`${at}.${k}: \`${st[k]}\` is not a state in this journey`);
    if (!isStr(st.action)) bad.push(`${at}.action: what the actor does, in words`);
    if (st.next !== null && st.next !== undefined && !(isStr(st.next) && w.steps.some(o => o?.id === st.next))) bad.push(`${at}.next: null or a step id in this workflow`);
    if (st.expectations !== undefined && !Array.isArray(st.expectations)) bad.push(`${at}.expectations: a list`);
    if (!Array.isArray(st.interactions)) { bad.push(`${at}.interactions: required, a list`); continue; }
    for (const [j, x] of st.interactions.entries()) {
      const xat = `${at}.interactions[${j}]`;
      if (!isObj(x) || !(x.type in FIELD)) { bad.push(`${xat}.type: one of ${Object.keys(FIELD).join(', ')}`); continue; }
      if (!isStr(x[FIELD[x.type]])) bad.push(`${xat}.${FIELD[x.type]}: required for a ${x.type} interaction`);
      for (const k of ['produces', 'consumes']) if (x[k] !== undefined && !strList(x[k])) bad.push(`${xat}.${k}: a list of field names`);
      const consumes = strList(x.consumes) ? x.consumes : [];
      for (const c of consumes) if (!produced.has(c)) bad.push(`${xat}.consumes: \`${c}\` is not produced by any earlier step or interaction — lineage has no source for it`);
      for (const p of placeholders(x[FIELD[x.type]])) if (!consumes.some(c => binds(c, p)))
        bad.push(`${xat}.${FIELD[x.type]}: {${p}} is filled from nothing — add the field it comes from to consumes`);
      if (strList(x.produces)) x.produces.forEach(p => produced.add(p));
    }
  }
};

export function parseJourney(doc, { refs = {} } = {}) {
  if (!isObj(doc)) return done(null, ['a journey is a JSON object']);
  const bad = [];
  for (const k of ['id', 'goal', 'actor']) if (!isStr(doc[k])) bad.push(`${k}: required, a non-empty string`);
  if (!isObj(doc.requires)) bad.push('requires: required — { identityProfile, dataProfiles[] }');
  else {
    if (doc.requires.identityProfile !== null && !isStr(doc.requires.identityProfile)) bad.push('requires.identityProfile: a profile id, or null');
    if (!strList(doc.requires.dataProfiles)) bad.push('requires.dataProfiles: a list of profile ids (may be empty)');
  }
  if (!strList(doc.trace)) bad.push('trace: a list of references to insights (may be empty)');

  const states = {};
  if (!isObj(doc.states) || !Object.keys(doc.states).length) bad.push('states: at least one state, keyed by name');
  else for (const [name, s] of Object.entries(doc.states)) {
    const at = `states[${name}]`;
    if (isObj(s) && isStr(s.$ref)) states[name] = refs[s.$ref] ? stateOf(refs[s.$ref], `${at} (via ${s.$ref})`, bad) : { $ref: s.$ref, unresolved: true };
    else states[name] = stateOf(s, at, bad);
  }
  const value = { ...doc, states };
  bad.push(...discriminationProblems(value));

  if (!Array.isArray(doc.workflows) || !doc.workflows.length) bad.push('workflows: at least one');
  else for (const [i, w] of doc.workflows.entries()) {
    const at = `workflows[${i}]`;
    if (!isObj(w)) { bad.push(`${at}: a workflow is an object`); continue; }
    if (!isStr(w.id)) bad.push(`${at}.id: required`);
    if (!KINDS.includes(w.kind)) bad.push(`${at}.kind: one of ${KINDS.join(', ')}`);
    if (w.mode !== undefined && !MODES.includes(w.mode)) bad.push(`${at}.mode: one of ${MODES.join(', ')}, or omitted`);
    if (w.requiresReach !== undefined && !REACH.includes(w.requiresReach)) bad.push(`${at}.requiresReach: one of ${REACH.join(', ')}`);
    if (!Array.isArray(w.steps)) { bad.push(`${at}.steps: required, a list`); continue; }
    if (w.status === 'unmeasurable') { if (!isStr(w.reason)) bad.push(`${at}.reason: an unmeasurable workflow says why`); continue; }
    if (!w.steps.length) bad.push(`${at}.steps: empty — a workflow with no steps is unmeasurable; say so with status and reason`);
    stepsOf(w, at, value, bad);
  }
  return done(value, bad);
}

// A `before` no earlier step in the workflow reaches as its `after`. Lineage decides what a miss is:
// a prerequisite not held is BLOCKED, an `after` not held is the previous step's fail.
export function prerequisitesOf(journey) {
  const out = [];
  for (const w of journey?.workflows || []) {
    const reached = new Set();
    for (const st of w.steps || []) {
      if (!isObj(st) || st.kind === 'fixture') continue;
      if (!reached.has(st.before)) out.push({ workflow: w.id, step: st.id, state: st.before });
      reached.add(st.after);
    }
  }
  return out;
}

// What is produced and never consumed — by an interaction, by a signal's equalsField, or by a
// `{param}` in a signal. A finding about the declaration, not the UI: the parser does not count it.
export function unconsumedProduces(journey) {
  const consumed = new Set(), params = new Set();
  for (const s of Object.values(journey?.states || {})) for (const sig of s?.signals || []) {
    if (isStr(sig?.equalsField)) consumed.add(sig.equalsField);
    for (const k of ['path', 'matches', 'selector']) placeholders(sig?.[k]).forEach(p => params.add(p));
  }
  for (const w of journey?.workflows || []) for (const st of w.steps || []) for (const x of st?.interactions || []) {
    (x?.consumes || []).forEach(c => consumed.add(c));
    placeholders(x?.[FIELD[x?.type]]).forEach(p => params.add(p));
  }
  const used = n => consumed.has(n) || [...params].some(p => binds(n, p));
  const out = [];
  for (const w of journey?.workflows || []) for (const st of w.steps || []) {
    const produces = st?.kind === 'fixture' ? st.produces || [] : (st?.interactions || []).flatMap(x => x?.produces || []);
    for (const n of produces) if (!used(n)) out.push({ workflow: w.id, step: st.id, name: n });
  }
  return out;
}

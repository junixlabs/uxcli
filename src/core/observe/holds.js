// Does a State — a predicate written as signal objects — hold on one Observation?
//
// A signal comes out `true`, `false`, or a string: the string is the reason it could not be decided
// (a selector with an unbound `{param}`, a selector the observation never looked at, hashed text that
// cannot be searched). Undecided is not false. `held` follows: true when every signal is true, false when
// any is false, null when nothing is false but something could not be decided.
//
// Strength is derived from what kind of signals the state carries (plan §2); the authored value may
// only lower it. Raw values never enter here: a field arrives as `sha1_8:…`, and comparing it to raw
// text needs `ctx.hash(str) → hex digest`, which the caller injects — core holds no crypto.
//
// ctx: { params?: { [name]: raw | 'sha1_8:…' }, hash?: str => hex, before?: Observation, dialCode?: '84' }
import { glob } from './glob.js';

const HASHED = /^sha1_8:/;
const ORDER = ['unverifiable', 'weak', 'medium', 'strong'];

const sha8 = (ctx, s) => 'sha1_8:' + ctx.hash(s).slice(0, 8);

// Equal, allowing either side to be a hash of the other. String result = could not compare.
const eq = (observed, expected, ctx) => {
  const ho = HASHED.test(observed), he = HASHED.test(expected);
  if (ho === he) return observed === expected;
  if (!ctx.hash) return 'unverifiable: comparing raw text with sha1_8 needs ctx.hash';
  return ho ? sha8(ctx, expected) === observed : sha8(ctx, observed) === expected;
};

// `/leads/{leadId}` against an actual path. A bound `{param}` (ctx.params, raw or hashed) must equal
// its segment; an unbound one is a one-segment wildcard — "on a lead page" is a state even before
// any step produced a lead id, and a prerequisite is exactly that state.
const template = (tpl, actual, ctx) => {
  const names = [...tpl.matchAll(/\{(\w+)\}/g)].map(m => m[1]);
  if (typeof actual !== 'string') return 'unverifiable: unobserved';
  const re = new RegExp('^' + tpl.split(/\{\w+\}/).map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('([^/]+)') + '$');
  const m = actual.match(re);
  if (!m) return false;
  for (let i = 0; i < names.length; i++) {
    const v = ctx.params?.[names[i]];
    if (v === undefined) continue;
    const r = eq(m[i + 1], String(v), ctx); if (r !== true) return r;
  }
  return true;
};

// Fill `{param}` with raw values; a hashed value cannot be spliced into a selector, so it is left.
const fill = (s, ctx) => s.replace(/\{(\w+)\}/g, (all, n) => {
  const v = ctx.params?.[n]; return v === undefined || HASHED.test(String(v)) ? all : String(v);
});

// A selector with a hole names no element: unbound `{param}` here is undecided, not a wildcard.
const unbound = (selector, ctx) => [...selector.matchAll(/\{(\w+)\}/g)].map(m => m[1]).find(n => ctx.params?.[n] === undefined);
const nodeOf = (obs, selector, ctx) => obs.dom?.[fill(selector, ctx)] ?? obs.dom?.[selector];

// Digits only, national trunk `0` → `+<dialCode>`, `00` → `+`. What e164 means for one country.
export const e164 = (text, dialCode) => {
  const s = String(text).replace(/[^\d+]/g, '');
  if (s.startsWith('+')) return s;
  if (s.startsWith('00')) return '+' + s.slice(2);
  if (s.startsWith('0')) return dialCode ? `+${dialCode}${s.slice(1)}` : null;
  return '+' + s;
};

const DOM_FLAGS = ['present', 'visible', 'enabled', 'inViewportWithoutScroll', 'valueUnchanged'];

const EVAL = {
  url(sig, obs, ctx) {
    if (sig.matches !== undefined) return typeof obs.url?.path === 'string' ? glob(sig.matches, obs.url.path) : 'unverifiable: unobserved';
    return template(sig.path, obs.url?.path, ctx);
  },
  dom(sig, obs, ctx) {
    const hole = unbound(sig.selector, ctx); if (hole) return `unverifiable: {${hole}} in ${sig.selector} has no value`;
    const node = nodeOf(obs, sig.selector, ctx);
    if (!node) return `unverifiable: ${sig.selector} was not observed`;
    for (const k of DOM_FLAGS) {
      if (sig[k] === undefined) continue;
      if (k === 'valueUnchanged') {
        const was = nodeOf(ctx.before ?? {}, sig.selector, ctx)?.value;
        if (was === undefined || node.value === undefined) return `unverifiable: ${sig.selector} value before the action is unknown`;
        const same = eq(String(node.value), String(was), ctx);
        if (typeof same === 'string') return same;
        if (same !== sig.valueUnchanged) return false;
        continue;
      }
      if (node[k] === undefined) return `unverifiable: ${sig.selector}.${k} was not observed`;
      if (node[k] !== sig[k]) return false;
    }
    return true;
  },
  text(sig, obs, ctx) {
    const hole = unbound(sig.selector, ctx); if (hole) return `unverifiable: {${hole}} in ${sig.selector} has no value`;
    const node = nodeOf(obs, sig.selector, ctx);
    if (!node || node.text === undefined) return `unverifiable: text of ${sig.selector} was not observed`;
    if (sig.contains !== undefined) {
      if (HASHED.test(node.text)) return `unverifiable: text of ${sig.selector} is hashed, cannot search it`;
      return node.text.toLowerCase().includes(String(sig.contains).toLowerCase());
    }
    const field = fieldOf(sig.equalsField, obs, ctx);
    if (field === undefined) return `unverifiable: field ${sig.equalsField} was not observed`;
    let text = node.text;
    if (sig.normalize === 'e164' && !HASHED.test(text)) {
      text = e164(text, ctx.dialCode);
      if (text === null) return 'unverifiable: e164 of a national number needs ctx.dialCode';
    }
    return eq(text, String(field), ctx);
  },
  network(sig, obs, ctx) {
    if (!Array.isArray(obs.network)) return 'unverifiable: network was not observed';
    const [method, path] = String(sig.request).split(/\s+/);
    let hit, undecided;
    for (const r of obs.network) {
      if (r.method !== method) continue;
      const m = template(path, r.path, ctx);
      if (m === true) hit = r; else if (typeof m === 'string') undecided = m;
    }
    if (!hit) return undecided ?? false;
    return sig.status === undefined || hit.status === sig.status;
  },
  // An alert is a region that said something: the observer lists every live region, mounted-empty ones included.
  a11y(sig, obs) {
    if (!Array.isArray(obs.a11y?.alerts)) return 'unverifiable: a11y was not observed';
    return obs.a11y.alerts.some(a => a.role === sig.role && String(a.text ?? '').trim() !== '' && (sig.visible === undefined || a.visible === sig.visible));
  },
  storage(sig, obs) {
    const entry = obs.storage?.[sig.key];
    if (!entry) return `unverifiable: storage key ${sig.key} was not observed`;
    return entry.present === (sig.present ?? true);
  },
};

// A produced field: last network response that carried it, else the lineage the caller passes in.
const fieldOf = (name, obs, ctx) => {
  let v = ctx.params?.[name];
  for (const r of obs.network ?? []) if (r.fields?.[name] !== undefined) v = r.fields[name];
  return v;
};

// The name a signal is reported under — what run.json prints in `signals`.
export const label = sig => {
  switch (sig.observer) {
    case 'url': return sig.matches !== undefined ? `path matches ${sig.matches}` : `path == ${sig.path}`;
    case 'dom': return [sig.selector, ...DOM_FLAGS.filter(k => sig[k] !== undefined).map(k => sig[k] === true ? k : `${k}=${sig[k]}`)].join(' ');
    case 'text': return sig.contains !== undefined ? `${sig.selector} contains '${sig.contains}'`
      : `${sig.selector} equals ${sig.equalsField}${sig.normalize ? ` (${sig.normalize})` : ''}`;
    case 'network': return `${sig.request}${sig.status !== undefined ? ` → ${sig.status}` : ''}`;
    case 'a11y': return `role=${sig.role}${sig.visible === false ? ' hidden' : ' visible'}`;
    case 'storage': return `${sig.key} ${sig.present === false ? 'absent' : 'present'}`;
    default: return `${sig.observer}?`;
  }
};

// Plan §2. `[data-uxcli=…]` is the only dom selector that counts as instrumentation.
export const derivedStrength = (signals = []) => {
  const has = k => signals.some(s => s.observer === k);
  const hard = signals.some(s => s.observer === 'network' || s.observer === 'storage'
    || (s.observer === 'dom' && /\[data-uxcli=/.test(s.selector ?? '')));
  if (!signals.length) return 'unverifiable';
  if (has('url') && hard) return 'strong';
  if (has('dom') || has('a11y')) return 'medium';
  return 'weak';
};

export function holds(state, observation, ctx = {}) {
  const signals = {}, why = [];
  let anyFalse = false, anyOpen = false;
  for (const sig of state.signals ?? []) {
    const fn = EVAL[sig.observer];
    const r = fn ? fn(sig, observation ?? {}, ctx) : `unverifiable: no observer named ${sig.observer}`;
    let name = label(sig); for (let i = 2; name in signals; i++) name = `${label(sig)} #${i}`;
    signals[name] = r;
    if (r === false) { anyFalse = true; why.push(`${name}: false`); }
    else if (r !== true) { anyOpen = true; why.push(`${name}: ${r}`); }
  }
  const derived = derivedStrength(state.signals);
  let strength = derived;
  if (state.strength && ORDER.includes(state.strength)) {
    if (ORDER.indexOf(state.strength) > ORDER.indexOf(derived)) why.push(`strength authored ${state.strength}, derived ${derived} — lowered to ${derived}`);
    else strength = state.strength;
  }
  return { held: anyFalse ? false : anyOpen ? null : true, strength, signals, why };
}

// A predicate that also holds where it says it must not is not a predicate. `mustNotMatch` entries are
// state names (checked on the observation labeled with that name) or url globs (checked on every
// observation whose path matches); prose entries cannot be checked and are returned as such.
export function discriminates(stateName, journeyStates, observationsByState, ctx = {}) {
  const state = journeyStates?.[stateName];
  const problems = [], unchecked = [];
  if (!state) return { ok: false, problems: [`no state named ${stateName}`], unchecked };
  const not = state.mustNotMatch ?? [];
  if (!not.length) problems.push(`${stateName} declares no mustNotMatch — a predicate true everywhere distinguishes nothing`);
  for (const entry of not) {
    if (journeyStates[entry]) {
      const obs = observationsByState?.[entry];
      if (!obs) { unchecked.push(`${entry}: no observation labeled with it`); continue; }
      if (holds(state, obs, ctx).held === true) problems.push(`${stateName} also holds on the observation labeled ${entry}, which it mustNotMatch`);
    } else if (/^\/\S*$/.test(entry)) {
      for (const [name, obs] of Object.entries(observationsByState ?? {}))
        if (glob(entry, obs?.url?.path) && holds(state, obs, ctx).held === true)
          problems.push(`${stateName} also holds on ${name} at ${obs.url.path}, which matches mustNotMatch ${entry}`);
    } else unchecked.push(`${entry}: prose, not a state name or url pattern`);
  }
  return { ok: problems.length === 0, problems, unchecked };
}

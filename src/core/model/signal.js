// The signal grammar: one JSON object per observer, no string predicate. What each observer can be
// asked is closed here, because a signal the runtime cannot read is a state nobody can hold.
import { isStr, isObj } from './common.js';

export const OBSERVERS = ['url', 'dom', 'text', 'network', 'a11y', 'storage'];
export const STRENGTHS = ['unverifiable', 'weak', 'medium', 'strong'];
const DOM_ASKS = ['visible', 'inViewportWithoutScroll', 'enabled', 'valueUnchanged'];
const bool = v => typeof v === 'boolean';
const oneOf = (s, keys) => keys.filter(k => isStr(s[k])).length === 1;

// out: problems[] for one signal, each prefixed with `at`
export function signalProblems(s, at) {
  if (!isObj(s)) return [`${at}: a signal is an object { observer, … }, not ${JSON.stringify(s)}`];
  const bad = [];
  if (typeof s.expr === 'string') bad.push(`${at}.expr: a string predicate is the old grammar — write the observer's own fields instead`);
  switch (s.observer) {
    case 'url':
      if (!oneOf(s, ['path', 'matches'])) bad.push(`${at}: a url signal names exactly one of path or matches`);
      break;
    case 'dom':
      if (!isStr(s.selector)) bad.push(`${at}.selector: a dom signal names a selector`);
      if (!DOM_ASKS.some(k => bool(s[k]))) bad.push(`${at}: a dom signal asks at least one of ${DOM_ASKS.join(', ')}, as true or false`);
      break;
    case 'text':
      if (!isStr(s.selector)) bad.push(`${at}.selector: a text signal names a selector`);
      if (!oneOf(s, ['contains', 'equalsField'])) bad.push(`${at}: a text signal asks exactly one of contains or equalsField`);
      if (s.normalize !== undefined && !isStr(s.normalize)) bad.push(`${at}.normalize: a name such as e164, or omitted`);
      break;
    case 'network':
      if (!/^[A-Z]+ \S+$/.test(s.request || '')) bad.push(`${at}.request: "METHOD /path", such as "GET /api/me"`);
      if (!Number.isInteger(s.status)) bad.push(`${at}.status: an HTTP status number`);
      break;
    case 'a11y':
      if (!isStr(s.role)) bad.push(`${at}.role: an ARIA role, such as alert`);
      if (!bool(s.visible)) bad.push(`${at}.visible: true or false`);
      break;
    case 'storage':
      if (!isStr(s.key)) bad.push(`${at}.key: a storage key, such as session.token`);
      if (!bool(s.present)) bad.push(`${at}.present: true or false`);
      break;
    default:
      bad.push(`${at}.observer: \`${s.observer}\` is not an observer — one of ${OBSERVERS.join(', ')}`);
  }
  return bad;
}

// Strength is derived, never claimed (plan §2): strong needs a url signal and one that the page
// cannot fake by looks alone — a network call, storage, or an element the app instrumented for us.
const instrumented = s => s.observer === 'dom' && /\[data-uxcli=/.test(s.selector || '');
export function strengthOf(state) {
  const sig = Array.isArray(state?.signals) ? state.signals.filter(isObj) : [];
  if (!sig.length) return 'unverifiable';
  const has = o => sig.some(s => s.observer === o);
  if (has('url') && (has('network') || has('storage') || sig.some(instrumented))) return 'strong';
  if (has('dom') || has('a11y')) return 'medium';
  return 'weak';
}

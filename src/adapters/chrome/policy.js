// Egress classification. The observer annotates; the constraint that decides lives in core.
import { globs, requestMatches } from './hash.js';

// `policy.hostClasses = { "sms-provider": ["*.twilio.com"] }` → the first class whose glob names the host.
export function hostClassOf(host, policy) {
  for (const [cls, patterns] of Object.entries(policy?.hostClasses || {})) if (globs(patterns, host)) return cls;
  return undefined;
}

// A request aimed at production is flagged whatever environment the run believes it is in.
export const isProductionOrigin = (url, policy) => {
  const origin = policy?.environments?.production?.origin;
  if (!origin) return false;
  try { return new URL(url).origin === new URL(origin).origin; } catch { return false; }
};

// Policy globs name hosts without ports (`*.twilio.com`), so `host` is the hostname.
export function classifyHost(url, policy) {
  let host = ''; try { host = new URL(url).hostname; } catch {}
  const out = { host };
  const hostClass = hostClassOf(host, policy); if (hostClass) out.hostClass = hostClass;
  if (isProductionOrigin(url, policy)) out.production = true;
  return out;
}

// `policy.effects.project.call_log_write = { class: "database_write", signature: "POST /api/calls" }`
// → the class of the first project effect whose signature this request matches.
export function effectClassOf(method, pathname, policy) {
  for (const e of Object.values(policy?.effects?.project || {}))
    if (e?.signature && requestMatches(e.signature, method, pathname)) return e.class || undefined;
  return undefined;
}

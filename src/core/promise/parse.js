// The one door a journey file comes through. It leaves here as a Flow or it leaves as a Rejection;
// there is no third exit, and nothing downstream re-checks what this file already decided.
//
// `loadJourney` used to return the raw JSON it had just checked, so every check it ran was advice.
// This returns a branded, frozen value instead: `runJourney` refuses anything `isFlow` does not
// recognise, which is what makes the rules here load-bearing rather than decorative.
// No `node:fs` here on purpose: reading the file is a capability, and the core holds none.
// `src/adapters/store/flow-file.js` does the reading; this decides what the text means.
// `node:path` stays — `basename` is string arithmetic, not a way to touch anything.
import path from 'node:path';

const FLOW = Symbol.for('uxcli.flow');
export const isFlow = x => !!x && x[FLOW] === true;

// The highest schema this reader understands. A file declaring a higher one is refused rather than
// guessed at (RFC 9413 §5.2 exclusion): a newer writer may mean something this reader cannot see.
export const SCHEMA = 1;

export class Rejection extends Error {
  constructor(file, why) { super(`${path.basename(file)}: ${why}`); this.name = 'Rejection'; this.file = file; this.why = why; }
}

const isStr = v => typeof v === 'string' && v.length > 0;
const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);

// Substitution happens on the text, before parsing, because a {{var}} may sit inside a selector or a
// URL fragment — not only where a JSON value would be.
function substitute(file, text, vars) {
  for (const [k, v] of Object.entries(vars)) text = text.split('{{' + k + '}}').join(v);
  const left = [...new Set([...text.matchAll(/{{([a-zA-Z0-9_-]+)}}/g)].map(m => m[1]))];
  if (left.length) throw new Rejection(file, `unsubstituted variables: ${left.join(', ')} (pass --var=${left[0]}=...)`);
  return text;
}

// Shared by both schemas: the shape of `steps` has not changed, and neither has the rule that at most
// one step may be the point of no return.
function parseSteps(file, J) {
  if (!Array.isArray(J.steps) || !J.steps.length) throw new Rejection(file, 'needs steps[]');
  if (!J.steps[0].url) throw new Rejection(file, 'first step needs a url');
  if (J.steps.filter(s => s.commit).length > 1) throw new Rejection(file, 'at most one step may be marked commit');
  for (const [a, b] of J.sameProcess || []) if (!(a >= 0 && b >= a && b < J.steps.length)) throw new Rejection(file, 'sameProcess range out of bounds');
  return J.steps.some(s => s.commit);
}

// schema 0 — every journey written before the contract existed. These are the six refusals
// `journey.js` carried; they move here whole so that the files in the repo, and every probe's own
// fixture journey, keep loading while schema 1 lands.
function parse0(file, J) {
  if (J.provenance === 'proposal' && !J.confirmedBy)
    throw new Rejection(file, 'is a proposal (provenance: proposal, confirmedBy: null). A human confirms it by setting confirmedBy before run accepts it.');
  parseSteps(file, J);
  return { ...J, schema: 0, name: J.name || file, runnable: true, unsigned: null };
}

// schema 1 — the signed promise of 2026-09-17-business-definitions.md §4.
// Two different failures, kept apart on purpose: a missing **buộc** key means the file is not a
// promise at all and nothing may be measured from it; a missing signature means it is a proposal —
// still a valid file, simply not one anyone may run.
const REQUIRED = ['id', 'task', 'actor', 'entry', 'steps', 'done', 'owner', 'source'];
const SIGNATURE = ['signedBy', 'signedAt', 'signedSha256'];

function parse1(file, J) {
  const missing = REQUIRED.filter(k => J[k] === undefined);
  if (missing.length) throw new Rejection(file, `schema 1 requires ${missing.join(', ')}`);
  for (const k of ['id', 'task', 'entry', 'owner', 'source']) if (!isStr(J[k])) throw new Rejection(file, `${k} must be a non-empty string`);
  if (!isObj(J.actor) || !isStr(J.actor.role)) throw new Rejection(file, 'actor.role must be a non-empty string');
  if (J.actor.signin !== undefined && !isStr(J.actor.signin)) throw new Rejection(file, 'actor.signin must be a string naming a saved session');
  if (!isObj(J.done) || !['url', 'text', 'element'].some(k => isStr(J.done[k]))) throw new Rejection(file, 'done needs at least one of url, text, element');

  const commits = parseSteps(file, J);
  // A journey with a commit step presses a real button. Without `safeTarget` nobody has said where
  // that is allowed to happen, so the promise is not wrong — it is simply not one anyone may try.
  if (commits) {
    if (typeof J.reversible !== 'boolean') throw new Rejection(file, 'a journey with a commit step must declare reversible (boolean)');
    if (!isObj(J.safeTarget) || !['base', 'proof', 'vouchedBy'].every(k => isStr(J.safeTarget[k])))
      throw new Rejection(file, 'a journey with a commit step needs safeTarget { base, proof, vouchedBy }, all three');
  }
  for (const r of J.mustRefuse || []) {
    if (!isObj(r) || !Number.isInteger(r.step) || !isStr(r.given) || !isStr(r.why)) throw new Rejection(file, 'each mustRefuse needs { step: integer, given, why }');
    if (r.step < 0 || r.step >= J.steps.length) throw new Rejection(file, `mustRefuse step ${r.step} is outside steps[]`);
  }
  if (J.waiver !== undefined) {
    if (!isObj(J.waiver) || !['by', 'why', 'until'].every(k => isStr(J.waiver[k]))) throw new Rejection(file, 'waiver needs { by, why, until }, all three');
    if (Number.isNaN(Date.parse(J.waiver.until))) throw new Rejection(file, 'waiver.until must be a date: an exemption with no end is a promise quietly cancelled');
  }
  // `checkedPass` is the human's permission to submit deliberately bad data into a live site, and
  // `sameProcess` is a signed override with provenance `project`. Both are promises, not run flags,
  // so both are typed here rather than waved through.
  if (J.checkedPass !== undefined && typeof J.checkedPass !== 'boolean') throw new Rejection(file, 'checkedPass must be a boolean');
  if (J.sameProcess !== undefined && !Array.isArray(J.sameProcess)) throw new Rejection(file, 'sameProcess must be an array of [from, to] pairs');
  if (J.signedBy !== undefined && J.signedBy === J.owner) throw new Rejection(file, 'signedBy must differ from the author: the party being measured never authors the measure');

  const unsigned = SIGNATURE.filter(k => !isStr(J[k]));
  return { ...J, schema: 1, name: J.task, runnable: unsigned.length === 0, unsigned: unsigned.length ? unsigned : null };
}

export function parseFlow(text, { file = '(text)', vars = {} } = {}) {
  let probe; try { probe = JSON.parse(text); } catch (e) { throw new Rejection(file, `is not JSON: ${e.message}`); }

  // The schema is read before anything else, so that a file this reader is too old for is refused as
  // a whole rather than half-understood.
  const declared = probe.schema;
  if (declared !== undefined && !(Number.isInteger(declared) && declared >= 0)) throw new Rejection(file, 'schema must be an integer >= 0');
  const schema = declared ?? 0;
  if (schema > SCHEMA) throw new Rejection(file, `declares schema ${schema}; this uxcli reads up to ${SCHEMA}`);

  const J = JSON.parse(substitute(file, text, vars));
  const flow = schema === 0 ? parse0(file, J) : parse1(file, J);
  Object.defineProperty(flow, FLOW, { value: true, enumerable: false });
  return Object.freeze(flow);
}

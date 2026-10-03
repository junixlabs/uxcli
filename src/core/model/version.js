// A version of a journey: a name somebody gave to one walk of it, so that walk can be compared with
// another later and is never pruned. The walk is the evidence; the version is the label and why it
// was given. Pure: a parser in, { value, problems } out.
import { isStr, isObj } from './common.js';

const NAME = /^[a-z0-9][a-z0-9._-]*$/i;
const RUN = /^runs\/R-[^/]+$/;

export function parseVersion(doc) {
  const problems = [];
  if (!isObj(doc)) return { value: null, problems: ['not an object'] };
  if (doc.schema_version !== 1) problems.push('schema_version must be 1');
  if (!isStr(doc.journey)) problems.push('journey: the journey id this is a version of');
  if (!isStr(doc.name) || !NAME.test(doc.name)) problems.push('name: letters, digits, dot, dash, underscore');
  if (!isStr(doc.run) || !RUN.test(doc.run)) problems.push('run: runs/R-… — the walk this version is');
  if (!isStr(doc.at)) problems.push('at: when it was named');
  if (!isObj(doc.by) || !isStr(doc.by.type) || !isStr(doc.by.ref)) problems.push('by: { type, ref } — who named it');
  if (doc.note !== undefined && !isStr(doc.note)) problems.push('note: what changed in this version, in words');
  if (doc.build !== undefined && !isStr(doc.build)) problems.push('build: the commit the walk ran against');
  if (doc.proposal !== undefined && !isStr(doc.proposal)) problems.push('proposal: the proposal this version answers');
  for (const k of Object.keys(doc)) if (!['schema_version', 'journey', 'name', 'run', 'at', 'by', 'note', 'build', 'proposal'].includes(k)) problems.push(`unknown key "${k}"`);
  return { value: problems.length ? null : { journey: doc.journey, name: doc.name, run: doc.run, at: doc.at, by: doc.by, note: doc.note || null, build: doc.build || null, proposal: doc.proposal || null }, problems };
}

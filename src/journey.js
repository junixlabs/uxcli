import fs from 'node:fs'; import path from 'node:path';
// Journey = the commitment. { name, checkedPass?, reversible?, sameProcess?: [[from,to]], steps: [{ url?, fill?, click?, submit?, commit?, userReorder? }] }
export function loadJourney(file, vars = {}) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8')); if (raw.provenance === 'proposal' && !raw.confirmedBy) throw new Error(`${path.basename(file)} is a proposal (provenance: proposal, confirmedBy: null). A human confirms it by setting confirmedBy before run accepts it.`);
  let text = fs.readFileSync(file, 'utf8');
  for (const [k, v] of Object.entries(vars)) text = text.split('{{' + k + '}}').join(v);
  const left = [...new Set([...text.matchAll(/{{([a-zA-Z0-9_-]+)}}/g)].map(m => m[1]))]; if (left.length) throw new Error('journey has unsubstituted variables: ' + left.join(', ') + ' (pass --var=' + left[0] + '=...)');
  const J = JSON.parse(text);
  if (!Array.isArray(J.steps) || !J.steps.length) throw new Error('journey needs steps[]');
  if (!J.steps[0].url) throw new Error('first step needs a url');
  if (J.steps.filter(s => s.commit).length > 1) throw new Error('at most one step may be marked commit');
  for (const [a, b] of J.sameProcess || []) if (!(a >= 0 && b >= a && b < J.steps.length)) throw new Error('sameProcess range out of bounds');
  J.name ||= file;
  return J;
}

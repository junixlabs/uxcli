// Effective reach = min(project, environment, workflow). No identity ⇒ ceiling `interact`.
// A workflow with no policy entry is granted nothing: declaring nothing is not declaring `inject`.
export const ORDER = ['observe', 'interact', 'mutate', 'inject'];
export const rankReach = r => { const i = ORDER.indexOf(r); return i < 0 ? 0 : i; };
export const atLeast = (have, need) => rankReach(have) >= rankReach(need);
const min = (...rs) => rs.reduce((a, b) => rankReach(b) < rankReach(a) ? b : a);

// `workflows` keys are `journey/workflow`; `journey/*` covers every workflow of that journey.
export function workflowPolicy(policy, workflowId) {
  const all = policy?.workflows || {};
  if (all[workflowId]) return all[workflowId];
  for (const [k, v] of Object.entries(all)) {
    if (!k.includes('*')) continue;
    const re = new RegExp('^' + k.split('*').map(s => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*') + '$');
    if (re.test(workflowId)) return v;
  }
  return null;
}

export function effectiveReach(policy, env, workflowId, { hasIdentity = false } = {}) {
  const project = policy?.project?.reachMax || 'observe';
  const environment = policy?.environments?.[env]?.reachMax || 'observe';
  const workflow = workflowPolicy(policy, workflowId)?.reachMax || 'observe';
  let effective = min(project, environment, workflow);
  const capped = [];
  if (!hasIdentity && !atLeast('interact', effective)) {
    effective = 'interact';
    capped.push('no identity — ceiling interact');
  }
  return { effective, layers: { project, environment, workflow }, capped };
}

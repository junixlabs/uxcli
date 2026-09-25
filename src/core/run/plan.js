// Before anything runs: can this workflow's prerequisites be satisfied at all? A prerequisite that is
// checkable and false is BLOCKED (a run status, not a verdict). One that cannot be checked here runs,
// and comes back as `unverified` so the caller caps its verdicts at `finding`.
import { effectiveReach, atLeast } from './reach.js';

const REASONS = ['prerequisite_not_satisfied', 'identity_rejected', 'reach_insufficient'];

export const pickWorkflow = (journey, id) =>
  (journey.workflows || []).find(w => id ? w.id === id : w.kind === 'happy') || journey.workflows?.[0] || { id: null, steps: [] };

// Reach a step needs: a fixture mutates; a declared effect mutates; an intercept needs interact.
const stepNeeds = (wf, step) => {
  if (step.kind === 'fixture') return 'mutate';
  if ((step.interactions || []).some(i => i.effect)) return 'mutate';
  if (wf.requiresReach) return wf.requiresReach;
  if (wf.mode === 'intercept' || (step.interactions || []).some(i => i.intercept)) return 'interact';
  return 'observe';
};

// `prerequisites` are state names no earlier step produces — the caller derives them from the model.
export function plan(journey, policy, env, scenario, { prerequisites = [], workflow } = {}) {
  const wf = pickWorkflow(journey, workflow);
  const identity = scenario?.identity || null;
  const reach = effectiveReach(policy, env, `${journey.id}/${wf.id}`, { hasIdentity: !!identity });
  const eff = reach.effective;
  const which = { prerequisite_not_satisfied: [], identity_rejected: [], reach_insufficient: [] };
  const fixtures = [];  // a fixture is step 0's prerequisite; listed after the before-states
  const unverified = [];

  if (identity) {
    const bad = Object.entries(identity.verified || {}).filter(([, ok]) => ok === false).map(([k]) => k);
    if (!identity.expiresAt) bad.push('expiresAt');
    if (bad.length) which.identity_rejected.push(`identity ${identity.profile || identity.mode}: ${bad.join(', ')} không xác minh được`);
  }

  for (const step of wf.steps || []) {
    if (step.kind === 'fixture') {
      if (!atLeast(eff, 'mutate')) fixtures.push(`${step.id} ${step.profile}: fixture cần mutate, effective reach là ${eff}`);
      continue;
    }
    if (step.before && prerequisites.includes(step.before)) {
      if (journey.requires?.identityProfile && !identity) {
        const why = policy?.testIdentity && !atLeast(eff, 'mutate') ? `${env} reach ${eff}, testIdentity không áp dụng` : 'không có identity để tạo state';
        which.prerequisite_not_satisfied.push(`${step.id}.before ${step.before}: không identity — ${why}`);
      } else unverified.push(step.before);
    }
    const need = stepNeeds(wf, step);
    if (!atLeast(eff, need)) which.reach_insufficient.push(`${wf.id}/${step.id}: cần ${need}, effective reach là ${eff}`);
  }
  which.prerequisite_not_satisfied.push(...fixtures);

  // One reason, and only its sentences: a step that cannot start has nothing to say about its reach.
  const reason = REASONS.find(r => which[r].length);
  if (reason) return { status: 'blocked', reason, which: which[reason], reach, workflow: wf.id };
  return { status: 'ok', unverified, reach, workflow: wf.id };
}

// After plan() said ok, the runtime may still block: a prerequisite measured false (null is
// unverified, not blocked), an identity the provisioner rejected, a fixture derive() could not value.
export function blockedAt({ prerequisites = [], identity = null, fixtures = [] } = {}) {
  const which = {
    prerequisite_not_satisfied: [
      ...prerequisites.filter(p => p.held === false).map(p => `${p.step}.before ${p.state}: không giữ${p.why?.length ? ' — ' + p.why.join('; ') : ''}`),
      ...fixtures.filter(f => f.problems?.length).map(f => `${f.step} ${f.profile}: ${f.problems.join('; ')}`),
    ],
    identity_rejected: (identity?.rejected || []).map(r => `${r.field}: ${r.why}`),
    reach_insufficient: [],
  };
  const reason = REASONS.find(r => which[r].length);
  return reason ? { reason, which: which[reason] } : null;
}

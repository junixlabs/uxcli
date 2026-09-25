// Weakening is a removal: an edit under which a recorded fail would now pass or fall out of scope
// needs the authority that created the commitment. Structural comparison only — no re-measurement.
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

const viewportOf = (run, v) => {
  if (v.viewport) return v.viewport;
  const step = (run.steps || []).find(s => s.id === v.where);
  return (step?.interactions || []).map(i => i.viewport).find(Boolean) || null;
};

export function weakens(oldC, newC, historyRuns = []) {
  const runs = [];
  const why = [];
  for (const run of historyRuns) {
    // A `finding` is a capped fail: the measurement did not hold either way.
    const fails = (run.verdicts || []).filter(v => v.commitment === oldC.id && ['fail', 'finding'].includes(v.value));
    for (const v of fails) {
      const reasons = [];
      const om = oldC.measurements?.[v.measurement], nm = newC.measurements?.[v.measurement];
      if (!nm) reasons.push(`measurement ${v.measurement} removed`);
      else if (!same(om?.predicate, nm.predicate) || !same(om?.target, nm.target)) reasons.push(`measurement ${v.measurement} predicate changed under a recorded fail`);
      const vp = viewportOf(run, v);
      if (vp && oldC.scope?.viewports?.includes(vp) && newC.scope?.viewports && !newC.scope.viewports.includes(vp)) reasons.push(`viewport ${vp} removed from scope`);
      for (const k of ['journey', 'workflow', 'step', 'state']) if (oldC.scope?.[k] && newC.scope?.[k] !== oldC.scope[k]) reasons.push(`scope.${k} changed`);
      if (reasons.length) { runs.push(run.ranAt); why.push(...reasons.map(r => `${run.ranAt}: ${r}`)); }
    }
  }
  return { weakens: runs.length > 0, runs: [...new Set(runs)], why: [...new Set(why)] };
}

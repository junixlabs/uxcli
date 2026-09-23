// The pure half of the probe, moved into the core so the dependency rule is what keeps it pure.
// Nothing here may reach a port; `src/arch.js` refuses any import under src/core/ that does.
// Lifted verbatim from src/probes/error-prevention/probe.js — a file move, not a rewrite.
export function explain(p, result) {
    const c = p.evidence.branches.confirmed, ck = p.evidence.branches.checked, cm = c.changeMechanism;
    return {
      what: `${c.missing.length} of ${c.missing.length + c.present.length} entered values are not shown on the commit screen; ${cm ? `change control "${typeof cm === 'string' ? cm : cm.text}"` : 'no change control'}; validation ${ck.tested ? 'tested: ' + ck.evidence : 'untested'}`,
      where: result.steps.find(s => s.i === c.screen)?.url,
      check: `On this screen, can you see ${c.missing.slice(0, 3).map(m => JSON.stringify(m.value)).join(', ')} and a way to change them before committing?`,
    };
  }

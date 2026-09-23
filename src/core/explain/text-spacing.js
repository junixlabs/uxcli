// The pure half of the probe, moved into the core so the dependency rule is what keeps it pure.
// Nothing here may reach a port; `src/arch.js` refuses any import under src/core/ that does.
// Lifted verbatim from src/probes/text-spacing/probe.js — a file move, not a rewrite.
export function explain(p, result) {
    const t = p.evidence.targets;
    return {
      what: `${t.length} locked value${t.length > 1 ? 's' : ''} below the minimum: ${t.slice(0, 3).map(x => `${x.sel} ${x.property} ${x.value}px < ${x.threshold}px (ACT ${x.rule})`).join('; ')}${t.length > 3 ? '; …' : ''}`,
      where: result.finalUrl || result.url,
      check: `Does the style attribute on ${t[0].lockedOn === 'self' ? t[0].sel : t[0].lockedOn} set ${t[0].property} with !important?`,
    };
  }

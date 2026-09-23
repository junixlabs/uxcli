// The pure half of the probe, moved into the core so the dependency rule is what keeps it pure.
// Nothing here may reach a port; `src/arch.js` refuses any import under src/core/ that does.
// Lifted verbatim from src/probes/text-overlap/probe.js — a file move, not a rewrite.
export function explain(p, result) {
    const t = p.evidence.targets;
    return {
      what: `${t.length} pair${t.length > 1 ? 's' : ''} of text painted over each other: ${t.slice(0, 3).map(x => `"${x.a.text.slice(0, 18)}" (${x.a.sel}) over "${x.b.text.slice(0, 18)}" (${x.b.sel}) at ${x.at.x},${x.at.y} ${x.at.w}×${x.at.h}px`).join('; ')}${t.length > 3 ? '; …' : ''}`,
      where: result.finalUrl || result.url,
      check: `Look at ${t[0].a.sel} and ${t[0].b.sel}. Can you read both texts?`,
    };
  }

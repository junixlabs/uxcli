// The pure half of the probe, moved into the core so the dependency rule is what keeps it pure.
// Nothing here may reach a port; `src/arch.js` refuses any import under src/core/ that does.
// Lifted verbatim from src/probes/focus-visible/probe.js — a file move, not a rewrite.
export function explain(p, result) {
    const t = p.evidence.targets;
    return {
      what: `${t.length} of ${p.measured.controls} measured controls show no pixel change on focus: ${t.slice(0, 4).map(x => x.sel + (x.text ? ` "${x.text.slice(0, 20)}"` : '')).join(', ')}${t.length > 4 ? ', …' : ''}`,
      where: result.finalUrl || result.url,
      check: `Press Tab until ${t[0].sel}${t[0].text ? ` "${t[0].text.slice(0, 20)}"` : ''} should have focus. Can you see where focus is?`,
    };
  }

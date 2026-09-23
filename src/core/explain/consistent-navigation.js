// The pure half of the probe, moved into the core so the dependency rule is what keeps it pure.
// Nothing here may reach a port; `src/arch.js` refuses any import under src/core/ that does.
// Lifted verbatim from src/probes/consistent-navigation/probe.js — a file move, not a rewrite.
export function explain(p, result) {
    const x = p.evidence.inversion;
    const short = s => { s = String(s); if (s.startsWith('t:')) return s.slice(2); s = s.slice(2); const i = s.lastIndexOf('/'); return (i >= 0 ? s.slice(i + 1) : s).slice(0, 60) || s.slice(0, 60); };
    return {
      what: `${x.mechanism} order differs between steps ${x.stepA} and ${x.stepB}; first inverted pair ${x.firstInvertedPair.map(short).join(' / ')}`,
      where: [x.stepA, x.stepB].map(i => result.steps.find(s => s.i === i)?.url).filter(Boolean).join('  '),
      check: `Compare the ${x.mechanism.replace(/^name:/, '')} menu on both pages; are those two items in swapped order?`,
    };
  }

// The pure half of the probe, moved into the core so the dependency rule is what keeps it pure.
// Nothing here may reach a port; `src/arch.js` refuses any import under src/core/ that does.
// Lifted verbatim from src/probes/redundant-entry/probe.js — a file move, not a rewrite.
export function explain(p) {
    const fields = [...new Set(p.evidence.reasked.map(m => m.field.name || m.field.id))];
    const steps = [...new Set(p.evidence.reasked.map(m => m.step))], first = [...new Set(p.evidence.reasked.map(m => m.firstEnteredStep))];
    return {
      what: `${fields.join(', ')} asked again on step ${steps.join(',')}; first entered on step ${first.join(',')}`,
      where: `${p.evidence.reasked[0].url}  ${fields.map(f => '#' + f).join(', ')}`,
      check: `Reach this screen through the earlier steps. ${fields.length > 1 ? 'Are these fields' : 'Is this field'} empty although you typed the value${fields.length > 1 ? 's' : ''} earlier?`,
    };
  }

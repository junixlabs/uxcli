// The pure half of the probe, moved into the core so the dependency rule is what keeps it pure.
// Nothing here may reach a port; `src/arch.js` refuses any import under src/core/ that does.
// Lifted verbatim from src/probes/error-identification/probe.js — a file move, not a rewrite.
export function explain(p) {
    const pl = p.evidence.planted;
    return {
      what: `${p.evidence.form === 'silent' ? 'submission rejected, nothing said' : 'submission rejected, message not tied to the field'}: ${pl.probeKind} on "${pl.probedField}" (step ${pl.entryStep + 1}); ${p.evidence.form === 'silent' ? 'no new text, no native validation' : 'new text: ' + pl.newText.slice(0, 2).map(t => JSON.stringify(t.slice(0, 50))).join(', ')}`,
      where: `${pl.urlBefore}  ${pl.probedField}`,
      check: `Submit this form with "${pl.probedField}" ${pl.probeValue ? 'set to ' + JSON.stringify(pl.probeValue) : 'empty'}. Does a text message appear that names that field?`,
    };
  }

// flow.error-identification · WCAG 3.3.1. Spec in spec.md; falsification pair in pair.json.
import { plantError } from '../../plant.js';
import { explain } from '../../core/explain/error-identification.js';

export default {
  id: 'flow.error-identification', sc: '3.3.1',
  method: { status: 'method-unproven', record: 'no recorded run on flows the probe had not seen' },
  async evaluate(ctx) {
    const { J } = ctx; const ev = {};
    if (!J.checkedPass) return { verdict: 'unmeasurable', why: 'the journey does not declare checkedPass: true, so no error was planted' };
    const p = await plantError(ctx); ev.planted = p;
    if (!p.tested) return { verdict: 'unmeasurable', why: p.why || 'planting did not run', evidence: ev };
    if (!p.declaredConstraint) return { evidence: ev, verdict: 'not-applicable', why: `probed field "${p.probedField}" has no declared constraint; nothing was detected` };
    if (!p.notAdvanced) return { evidence: ev, verdict: 'not-applicable', why: `the planted error (${p.probeKind}) was not detected: the step advanced (3.3.4 reports that)` };
    if (p.newTextCount >= 10) return { evidence: ev, verdict: 'unmeasurable', why: `screen re-rendered: ${p.newTextCount} new lines after the submit, the message cannot be told from the rest` };
    const id = p.identification || {}; const signals = [];
    if (p.nativeValidation && (p.nativeValidation.field === p.probedField || !p.nativeValidation.field)) signals.push(`native validation: "${p.nativeValidation.message}"`);
    if (id.ariaInvalid && p.newTextCount > 0) signals.push(`aria-invalid on the field and new text: ${JSON.stringify(p.newText[0])}`);
    if (id.described?.length) signals.push(`aria-describedby/aria-errormessage → ${JSON.stringify(id.described[0].trim().slice(0, 80))}`);
    if (id.containerNew?.length) signals.push(`new text in the field's container: ${JSON.stringify(id.containerNew[0].slice(0, 80))}`);
    if (id.labelNew?.length) signals.push(`new text names the field ("${id.label}"): ${JSON.stringify(id.labelNew[0].slice(0, 80))}`);
    if (signals.length) return { verdict: 'pass', evidence: { ...ev, signal: signals[0], signals },
      why: `the planted ${p.probeKind} on "${p.probedField}" was rejected and identified: ${signals[0]}` };
    const form = p.newTextCount === 0 && !p.nativeValidation ? 'silent' : 'unidentified';
    return { verdict: 'fail', evidence: { ...ev, form }, why: form === 'silent' ? `the submission with ${p.probeKind} was rejected and nothing was said: no new text, no native validation` : `text appeared (${p.newText.slice(0, 2).map(t => JSON.stringify(t.slice(0, 60))).join(', ')}) but none of it is tied to "${p.probedField}" or names it` };
  },
  // The pure half lives in core/, where the dependency rule is what keeps it pure.
  explain,
};

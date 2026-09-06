// flow.error-identification · WCAG 3.3.1. Spec in spec.md; falsification pair in pair.json.
import { plantError } from '../../plant.js';

export default {
  id: 'flow.error-identification', sc: '3.3.1',
  method: { status: 'method-unproven', record: 'no recorded run on flows the probe had not seen' },
  async evaluate(ctx) {
    const { J } = ctx; const ep = {};
    if (!J.checkedPass) return { ...ep, verdict: 'unmeasurable', why: 'the journey does not declare checkedPass: true, so no error was planted' };
    const p = await plantError(ctx); ep.planted = p;
    if (!p.tested) return { ...ep, verdict: 'unmeasurable', why: p.why || 'planting did not run' };
    if (!p.declaredConstraint) return { ...ep, verdict: 'not-applicable', why: `probed field "${p.probedField}" has no declared constraint; nothing was detected` };
    if (!p.notAdvanced) return { ...ep, verdict: 'not-applicable', why: `the planted error (${p.probeKind}) was not detected: the step advanced (3.3.4 reports that)` };
    if (p.newTextCount >= 10) return { ...ep, verdict: 'unmeasurable', why: `screen re-rendered: ${p.newTextCount} new lines after the submit, the message cannot be told from the rest` };
    const id = p.identification || {}; const signals = [];
    if (p.nativeValidation && (p.nativeValidation.field === p.probedField || !p.nativeValidation.field)) signals.push(`native validation: "${p.nativeValidation.message}"`);
    if (id.ariaInvalid && p.newTextCount > 0) signals.push(`aria-invalid on the field and new text: ${JSON.stringify(p.newText[0])}`);
    if (id.described?.length) signals.push(`aria-describedby/aria-errormessage → ${JSON.stringify(id.described[0].trim().slice(0, 80))}`);
    if (id.containerNew?.length) signals.push(`new text in the field's container: ${JSON.stringify(id.containerNew[0].slice(0, 80))}`);
    if (id.labelNew?.length) signals.push(`new text names the field ("${id.label}"): ${JSON.stringify(id.labelNew[0].slice(0, 80))}`);
    if (signals.length) return { ...ep, verdict: 'pass', signal: signals[0], signals };
    const form = p.newTextCount === 0 && !p.nativeValidation ? 'silent' : 'unidentified';
    return { ...ep, verdict: 'fail', form, why: form === 'silent' ? `the submission with ${p.probeKind} was rejected and nothing was said: no new text, no native validation` : `text appeared (${p.newText.slice(0, 2).map(t => JSON.stringify(t.slice(0, 60))).join(', ')}) but none of it is tied to "${p.probedField}" or names it` };
  }
};

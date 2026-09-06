# flow.error-identification · WCAG 3.3.1 · provenance spec

- **why:** SC text: if an input error is automatically detected, the item that is in error is identified and the error is described to the user in text. A form that rejects a submission and says nothing, or says something that names no field, leaves the user guessing.
- **applies-when:** the journey declares `checkedPass: true` (the runner may submit the entry step with a deliberate input error) and the planted error was **detected**: the entry step did not advance (URL unchanged or the probed field still on the page). The planting is the one 3.3.4 uses, run once per journey: a `required`/`aria-required` field emptied; else `type=email` set to `not-an-email`, `type=url` to `not-a-url`, a `minlength` field to one character; else the first recorded field emptied, in which case nothing is declared and the probe does not apply. If the step advanced, no error was detected and this criterion does not apply (3.3.4's *checked* branch reports that).
- **correct-when (identified and described):** after the planted submit, at least one of these holds for the probed field:
  - the browser's own constraint validation reports it (`:invalid` with a non-empty `validationMessage`): the browser identifies the field and describes the error;
  - the field carries `aria-invalid="true"` and text that was not on the screen before the submit is visible anywhere;
  - `aria-describedby` or `aria-errormessage` on the field points at an element whose visible text was not on the screen before the submit;
  - new visible text appears inside the field's own container: its `<label>`, or the nearest ancestor that contains this field and no other form field;
  - new visible text contains the field's label text (as the runner reads it: `aria-label`, `aria-labelledby`, `<label for>`, wrapping label, `title`, `placeholder`).
  Text is compared after trimming, case-folding and collapsing whitespace; "new" means the line was not among the visible lines before the submit. Native validation counts even when it is the only signal, because the browser both marks the field and shows the message.
- **verdict:** `pass` naming the signal that held; `fail` when the step did not advance and no signal held, in two forms reported on the card: *silent* (no new text and no native validation: the submission was rejected with nothing said) and *unidentified* (new text appeared but none of it is tied to the field or names it); `not-applicable` when the planted error was not detected (the step advanced) or the probed field has no declared constraint; `unmeasurable` when the journey does not declare `checkedPass: true` (nothing planted) or the planting errored, with the reason.
- **invalid-if:** the site re-renders the whole form on submit so every line counts as "new" (the before/after line sets would differ everywhere); then a line is new only if it is absent from the before set **and** the number of new lines is below ten, otherwise the probe reports `unmeasurable · screen re-rendered`. A message shown as an image or an icon with no text is a real 3.3.1 failure and is not an exception.
- **known-infidelity:** identification is read from ARIA, containment and label text, not from position on screen; a message placed visually next to the field but in an unrelated container and not naming the field is reported as *unidentified*. A message that appears after a delay longer than the runner's settle (about one second) is missed and reported as *silent*. Only one field is probed per journey, the one 3.3.4 chooses; other fields are not tested.

## Revisions

v1 2026-09-07: written from the SC text before any fixture existed, then the falsification pair: must-fail overlay rejects an invalid email silently; must-pass overlay rejects it with a message tied by `aria-describedby` and `aria-invalid`. Both overlays replace `details.html`; the clean fixture advances on an invalid email, so the criterion does not apply there and the gate uses the must-pass overlay for the satisfied branch.

## Method status

`method-unproven`: no recorded run on flows the probe had not seen. A would-be fail is reported as `finding`, exit 0, until 20 unseen flows with `checkedPass: true` show 0 false fails.

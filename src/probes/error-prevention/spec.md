# flow.error-prevention · WCAG 3.3.4 · provenance spec

- **why:** SC text: at least one of *reversible*, *checked*, *confirmed* must be true for pages that cause legal/financial commitments or modify user data.
- **applies-when:** the journey has a step marked `commit`, and at least one value was entered in an earlier step of the same process. Values of `type=password` are excluded. Credential fields are identity, not the information being submitted, and are excluded from the *confirmed* comparison: `type=password`, and, on a step whose fill includes a password, fields with `type=email`, `autocomplete` username/email, or name/id/label matching /user|login|email/i. Other fields on that step (a sign-up form's address) count. Credentials stay recorded for 3.3.7. If no non-credential value was recorded before the commit step (single-screen commit), the probe is `not-applicable`: it measures cross-screen review only.
- **correct-when (any one branch):**
  - *confirmed*: on the screen holding the commit control, or on the screen of the step immediately before it when that step entered no values (a review step "before finalizing the submission", SC text), every recorded non-secret value is present as visible text or as the value of a read-only/disabled/pre-populated field (comparison after trimming, case-folding, collapsing whitespace; for `select`, the option's display text also counts), **and** a mechanism to correct exists: a link or button, outside site chrome (`header`, `nav`, `footer`, landmarks), whose href or text targets an earlier step that recorded non-authentication values (`href` equals that step's URL, or text matches /\b(change|edit|modify)\b/i, or is exactly "back" / "go back"), or the values are editable on the same screen. A logo or Home link to the journey's first step is not a correction mechanism.
  - *checked*: the runner, in a separate pass, submits the entry step with one recorded field carrying a deliberate input error and reads the outcome. Field choice: a `required`/`aria-required` field emptied; else a `type=email` field set to `not-an-email`, `type=url` to `not-a-url`, a `minlength` field to one character; else the first recorded field emptied. Outcome: the step does not advance (same URL, or the same form still present) **and** either new visible text appears or native constraint validation fired (`:invalid` with a non-empty `validationMessage`) → *checked* holds. The step advances → *checked* is false only when the probed field was declared constrained (required, typed, minlength); an undeclared field may simply be optional, so advancing proves nothing and *checked* is `untested`. Programmatic association of the message is SC 3.3.1, not 3.3.4. The pass mutates the site and runs only where the journey marks `checkedPass: true`; otherwise `untested`.
  - *reversible*: declared in the journey (`reversible: <url or text>`), provenance `project`; the runner does not measure it.
- **verdict:** `pass` with the satisfied branch named; `fail` only if *confirmed* is false, *checked* was **tested** and false, and *reversible* is not declared, listing the missing values; `unmeasurable` with `checked: untested` if *confirmed* is false and the checked pass was not allowed; `not-committed` if no `commit` step; `not-applicable` if no non-credential value was recorded before the commit step; `unmeasurable` if the commit screen could not be reached, was reached by direct navigation after the previous step's submit did not change the page (flow break: recorded values may not have carried), or the recorded values are empty.
- **invalid-if:** a value was reformatted by the site (dates, phone numbers, card numbers, reordered names such as "Doe, Jane") so that normalized comparison fails while every word of it is present; then that value is reported as `finding`, not counted as missing. Screen reached by a redirect to a different origin (third-party payment) is out of scope for this probe and reported as `unmeasurable`.
- **known-infidelity:** matching is textual, not semantic (a review that shows "J. Smith" for "John Smith" fails); *checked* mutates the flow and is skipped when the entry step has side effects declared in the journey; *reversible* is trusted, not measured.

## Input: Journey input (the commitment)

A journey is an ordered list of steps in one process. Each step: `url` (or an action that navigates), optional `fill` map, optional `submit` selector. One step may be marked `commit: true`: the action that causes a legal commitment, financial transaction, or modification of user data. The runner records every value the user (or the journey) enters, with the field's identity (`autocomplete`, `name`, `type`, accessible label) and the step index. If no step is marked `commit`, the 3.3.4 probe returns `not-committed`, never `fail`.

## Process boundary (new, applies to 3.3.4 and 3.3.7)
A journey is split into **segments**. Step i continues the segment of step i−1 only if it was reached by the previous step's own action (`arrivedBy: flow`) and the previous step's submit navigated (`flowBreak` absent). A step reached by direct navigation (`goto`), or following a submit that did not change the page, **starts a new segment**. Segments are the tool's measurement of "the same process" (WCAG 3.3.7 note; 3.3.4 "submission").

Override, provenance `project`: `sameProcess: [[from, to], …]` in the journey joins the named step ranges into one segment. The human commits that the steps are one process; the runner records the override on the verdict.

- **3.3.7:** a field matches only values recorded in the same segment. A match whose only prior lies in another segment is reported as `premise-broken` (step of the break named) and never counts as `fail`. Verdict: `fail` if any same-segment re-ask lacks a mechanism; else `unmeasurable · premise broken at step N` if any cross-segment match exists; else as v8.
- **3.3.4:** values compared on the commit screen are those recorded in the commit step's segment. If none are in the segment but some exist outside it → `unmeasurable · premise broken at step N`.

Acceptance (from P0-B round 2, runner v6 issued `fail`): Sylius register→login-failed→guest checkout and OpenCart register→goto→checkout must both return `unmeasurable · premise broken`. With `sameProcess` declared they must return `fail` with provenance `project`.

## Shared invalid-if

- Page title matches a bot-challenge pattern → `blocked`.
- For 3.3.4 and 3.3.7, noise is defined on what they read: if the `textContent` of `main` (or `body` when no `main`) or any input value changes over 600 ms with no interaction → `unmeasurable`. Geometry changes are not noise for these probes. 3.2.3 reads the DOM once and has no noise check.
- Third-party subtrees (`iframe`, `ins.adsbygoogle`, `.google-auto-placed`, `[id^=aswift]`, `[id^=google_ads]`, `.google-anno*`) are excluded from all three probes. This exclusion is carried from the P0-A finding and is part of the frozen definition.

## Falsification pair

See `pair.json`: one fixture where this probe must return `fail` for the stated operator, one where it must stay silent. `uxcli gate` runs both and checks the hashes. Written from the WCAG 2.2 Understanding text before any fixture or site was opened; revision history is kept outside the package.

## Method status

`method-unproven`. Validated means: a recorded run with the packaged code on at least 20 pages or flows the probe had not seen when its definition was last revised, 0 false fails, plus a recall record (ACT cases or seeded defects). Until then a would-be `fail` is reported as `finding`. Record so far: P0-B ran pre-package code on 20 flows with two contested fails; no unseen-flow run with the packaged code yet.

## Revisions

- 2026-09-06 change-control text rule: `back` only as the whole label ("Back to shop" is a logo-class link, a constructed false pass); a value whose every word is present in another order is reformatted (`finding`), not missing (a constructed false fail); a flow break joined by `sameProcess` reaches the verdict instead of `unmeasurable`. A submit that leaves the URL unchanged no longer breaks the process when the journey's `expect` selector appears or the submitted form is gone / the main heading changed (same-URL wizards).

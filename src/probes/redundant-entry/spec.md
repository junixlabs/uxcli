# flow.redundant-entry · WCAG 3.3.7 · provenance spec

- **why:** SC text: information previously entered or provided in the same process that is required again must be auto-populated or available to select, except when re-entry is essential, required for security, or the earlier information is no longer valid.
- **applies-when:** step index > 1 in the journey, evaluated **on arrival at the step, before that step's own fill**; a visible, enabled, editable input (`input` not hidden/password/submit/button/search, `textarea`, `select`) inside the process form — the `form` ancestor of the control the journey submits on that step. A step with no `submit`, or whose control is not inside a form, contributes no inputs: other forms on the page (product review, newsletter, search, site chrome) are not part of the process. The input's identity matches a value recorded in an earlier step. Identity match, in order: same non-empty `autocomplete` token; same `name`; same `type` in {email, tel, url}; accessible label equal after normalization.
- **correct-when:** for each matched field, one of: its current value equals the earlier value (auto-populated); or a control on the same page offers the earlier value for selection (a `select`, `datalist`, radio group, or checkbox whose option/label text contains the earlier value, or a checkbox/radio whose label matches /same as|use (my|the|this) .*(address|details|information)/i); or the journey marks the field `essential` or `security` (provenance `project`).
- **verdict:** `pass` if no matched field lacks a mechanism; `fail` listing each re-asked field with the step where it was first entered; `not-applicable` if no field matches; `unmeasurable` if earlier steps recorded no values.
- **invalid-if:** the earlier step's values were not recorded (journey started mid-process); the field is inside a third-party subtree (`iframe`, ad container) — excluded.
- **known-infidelity:** identity by `name`/label can conflate distinct fields (billing vs shipping address) — a `fieldset` legend or `autocomplete` section token (`shipping`, `billing`) that differs between the two occurrences suppresses the match; "same as" detection is a text heuristic and is reported in `why`.

## Input: Journey input (the commitment)

A journey is an ordered list of steps in one process. Each step: `url` (or an action that navigates), optional `fill` map, optional `submit` selector. One step may be marked `commit: true`: the action that causes a legal commitment, financial transaction, or modification of user data. The runner records every value the user (or the journey) enters, with the field's identity (`autocomplete`, `name`, `type`, accessible label) and the step index. If no step is marked `commit`, the 3.3.4 probe returns `not-committed`, never `fail`.

## Process boundary (new, applies to 3.3.4 and 3.3.7)
A journey is split into **segments**. Step i continues the segment of step i−1 only if it was reached by the previous step's own action (`arrivedBy: flow`) and the previous step's submit navigated (`flowBreak` absent). A step reached by direct navigation (`goto`), or following a submit that did not change the page, **starts a new segment**. Segments are the tool's measurement of "the same process" (WCAG 3.3.7 note; 3.3.4 "submission").

Override, provenance `project`: `sameProcess: [[from, to], …]` in the journey joins the named step ranges into one segment. The human commits that the steps are one process; the runner records the override on the verdict.

- **3.3.7:** a field matches only values recorded in the same segment. A match whose only prior lies in another segment is reported as `premise-broken` (step of the break named) and never counts as `fail`. Verdict: `fail` if any same-segment re-ask lacks a mechanism; else `unmeasurable · premise broken at step N` if any cross-segment match exists; else as v8.
- **3.3.4:** values compared on the commit screen are those recorded in the commit step's segment. If none are in the segment but some exist outside it → `unmeasurable · premise broken at step N`.

Acceptance (from P0-B round 2, runner v6 issued `fail`): Sylius register→login-failed→guest checkout and OpenCart register→goto→checkout must both return `unmeasurable · premise broken`. With `sameProcess` declared they must return `fail` with provenance `project`.

## 3.3.7 process scope when the submit control has no form (revises v5 rule 10)
Scope = the `form` of the step's submit control. When the control is not inside a `form`, scope = the nearest ancestor of the control among `form, fieldset, section, article, [role=region], [role=main], main`, falling back to `main` then `body`; site chrome (`header, nav, footer, [role=search]`) stays excluded.

Acceptance: Toolshop register→checkout billing step must report the house-number re-ask as `fail` (verified by hand 2026-09-06); the P0-B automationexercise product-review email must stay excluded (its form is not the process form).

## Shared invalid-if

- Page title matches a bot-challenge pattern → `blocked`.
- For 3.3.4 and 3.3.7, noise is defined on what they read: if the `textContent` of `main` (or `body` when no `main`) or any input value changes over 600 ms with no interaction → `unmeasurable`. Geometry changes are not noise for these probes. 3.2.3 reads the DOM once and has no noise check.
- Third-party subtrees (`iframe`, `ins.adsbygoogle`, `.google-auto-placed`, `[id^=aswift]`, `[id^=google_ads]`, `.google-anno*`) are excluded from all three probes. This exclusion is carried from the P0-A finding and is part of the frozen definition.

## Falsification pair

See `pair.json`: one fixture where this probe must return `fail` for the stated operator, one where it must stay silent. `uxcli gate` runs both and checks the hashes. Written from the WCAG 2.2 Understanding text before any fixture or site was opened; revision history is kept outside the package.

## Method status

`method-unproven`. Validated means: a recorded run with the packaged code on at least 20 pages or flows the probe had not seen when its definition was last revised, 0 false fails, plus a recall record (ACT cases or seeded defects). Until then a would-be `fail` is reported as `finding`. Record so far: P0-B ran pre-package code on 20 flows; no unseen-flow run with the packaged code yet.

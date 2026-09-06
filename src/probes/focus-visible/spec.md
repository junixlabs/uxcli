# page.focus-visible · WCAG 2.4.7 · provenance spec

- **why:** SC text: any keyboard operable user interface has a mode of operation where the keyboard focus indicator is visible. A focusable element that changes nothing when it receives focus has no indicator.
- **applies-when:** element is in the sequential focus order (`a[href], button, input, select, textarea, summary, [tabindex>=0], [contenteditable]`), not disabled, computed `visibility != hidden`, `display != none`, at least one client rect, and not inside a third-party subtree (`iframe`, ad containers). First 80 such elements per page.
- **correct-when:** after the active element is blurred and the document has been quiet for one 400 ms window (up to six windows are waited), then `focus({focusVisible:true})` on the target and two animation frames, at least one element in the document changed any of: `outline-style, outline-width, outline-color, box-shadow, border-color, background-color, color, text-decoration-line, opacity, visibility, display`, or its document-relative rect. Rect is document-relative (`+scrollX/Y`); fixed/sticky elements compare size only; 0×0 elements are recorded as a constant. Detached nodes and elements carrying an infinitely repeating animation (`getAnimations()` with infinite iterations) are excluded from the diff; the focused target itself is always compared. The count of excluded animating elements is reported.
- **verdict:** `fail` if any target changes nothing, listing the targets; `unmeasurable` if the document still changes with no interaction after six 400 ms windows (noise > 0) or a target changes more than max(20, 30%) of elements without changing itself (layout shift); `pass` otherwise; `not-applicable` if no focusable element.
- **invalid-if:** element still outside the viewport after focus; static CSSOM read instead of runtime; document self-mutating; mass change with target unchanged; page title matches a bot-challenge pattern (`unmeasurable · blocked`).
- **known-infidelity:** computed style ≠ pixels (a border→outline swap of the same colour passes); AT-specific focus not simulated; a change on a sibling counts as an indicator even when it is not near the target.

## Revisions

v1 frozen 2026-09-05 (P0-A, sha256 `375832c3…da11bc`, verdicts `passed/failed/inapplicable/blocked`). ACT oj04fd 7/7 with v1.

- 2026-09-06 **blur before the before-snapshot.** v1 took the before-snapshot with the page's autofocused control already focused, so that control read as "changes nothing" (false fail on two real login screens). The must-pass twin carries an `autofocus` control so the gate guards this.
- 2026-09-06 **quiesce before the noise window.** The blur itself starts the focus ring's fade-out transition, which v1's single 400 ms window read as noise (two real screens went `unmeasurable`). Up to six 400 ms windows are waited for one quiet window; the must-pass twin transitions its focus ring so the gate guards this. Pages that never go quiet stay `unmeasurable`.
- 2026-09-06 **infinitely animating elements excluded from the diff.** A pulsing status dot kept one real screen `unmeasurable` after quiesce; such elements can never be quiet and carry no focus information unless they are the target. The must-pass twin carries a pulsing dot so the gate guards this.
- 2026-09-06 **third-party subtrees excluded** from targets, carried from the P0-A text-spacing finding.
- 2026-09-06 verdict names mapped to the repo's list: `pass`, `fail`, `not-applicable`, `unmeasurable`; `blocked` is an `unmeasurable` reason.

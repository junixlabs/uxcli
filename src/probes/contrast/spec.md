# page.contrast · WCAG 1.4.3 · provenance spec (delegated to axe-core 4.13.0, rule color-contrast)

- **why:** SC text: text and images of text have a contrast ratio of at least 4.5:1, 3:1 for large text. The measurement is delegated to axe-core's `color-contrast` rule, pinned to version 4.13.0; the version is part of the definition and changes only with a recorded revision.
- **applies-when:** what axe-core reports for `color-contrast` on the settled page at 1280×800, minus nodes inside third-party subtrees.
- **correct-when:** axe reports no violation node for `color-contrast`.
- **verdict:** `fail` if any violation node remains after third-party exclusion, grouped by (foreground, background) pair with a count and one example selector per group; `unmeasurable` if axe returns only `incomplete` nodes for the rule (background image, gradient, overlap) and no violation; `pass` if the rule ran with passing nodes and no violation; `not-applicable` if axe lists the rule as inapplicable.
- **invalid-if:** page fails to load; page title matches a bot-challenge pattern (`unmeasurable · blocked`).
- **known-infidelity:** everything axe-core's rule does not see: text over images, text rendered in canvas, SVG text, `incomplete` nodes. The probe adds no colour mathematics of its own; upgrading axe-core is a definition change.

## Revisions

- 2026-09-06 **page context bypasses Content-Security-Policy.** GOV.UK's `script-src` blocked the axe-core injection and the probe returned `unmeasurable · probe error`; the context is now created with `bypassCSP: true`, an instrument setting that does not change what is measured.
- 2026-09-06 first version. Bench: ACT afw4f7 cases (34) with axe-core 4.13.0, recorded in the working notes.

# flow.consistent-navigation · WCAG 3.2.3 · provenance spec

- **why:** SC text: navigational mechanisms repeated across a set of web pages occur in the same relative order unless the user initiated a change. Insertions and removals are allowed (Understanding); only inversions fail (F66).
- **applies-when:** at least two steps on the same origin (proxy for "set of web pages"); a navigational mechanism = `nav` element or `[role=navigation]`, identified across pages by accessible name (`aria-label` / `aria-labelledby`), or when unnamed, by its index among unnamed navs. Repeated = the same mechanism appears on ≥ 2 steps and shares ≥ 2 links.
- **correct-when:** for each repeated mechanism, take the links common to two pages. A link's identity is its normalized `href` when that href is unique within the mechanism on both pages; otherwise its normalized text (a logo and Home sharing `/` must not collapse into one link). The common links appear in the same relative order on both pages: the sequence on page B, restricted to common links, is order-identical to the sequence on page A. Any inversion is a failure.
- **verdict:** `pass`; `fail` listing the mechanism, the two steps, and the first inverted pair; `not-applicable` if no repeated mechanism; `unmeasurable` if a step is on another origin or failed to load.
- **invalid-if:** the journey marks a step as user-initiated reorder (e.g. sort preference) — skipped for that step; a mechanism with fewer than 2 common links — not compared.
- **known-infidelity:** same-origin is a proxy for the WCAG "set of web pages"; matching by text may miss links whose text is icon-only (matched by `aria-label` if present, else ignored); a mechanism that changes accessible name between pages is treated as two mechanisms.

## Input: Journey input (the commitment)

A journey is an ordered list of steps in one process. Each step: `url` (or an action that navigates), optional `fill` map, optional `submit` selector. One step may be marked `commit: true`: the action that causes a legal commitment, financial transaction, or modification of user data. The runner records every value the user (or the journey) enters, with the field's identity (`autocomplete`, `name`, `type`, accessible label) and the step index. If no step is marked `commit`, the 3.3.4 probe returns `not-committed`, never `fail`.



## Shared invalid-if

- Page title matches a bot-challenge pattern → `blocked`.
- For 3.3.4 and 3.3.7, noise is defined on what they read: if the `textContent` of `main` (or `body` when no `main`) or any input value changes over 600 ms with no interaction → `unmeasurable`. Geometry changes are not noise for these probes. 3.2.3 reads the DOM once and has no noise check.
- Third-party subtrees (`iframe`, `ins.adsbygoogle`, `.google-auto-placed`, `[id^=aswift]`, `[id^=google_ads]`, `.google-anno*`) are excluded from all three probes. This exclusion is carried from the P0-A finding and is part of the frozen definition.

## Falsification pair

See `pair.json`: one fixture where this probe must return `fail` for the stated operator, one where it must stay silent. `uxcli gate` runs both and checks the hashes. Written from the WCAG 2.2 Understanding text before any fixture or site was opened; revision history is kept outside the package.

# page.text-spacing · WCAG 1.4.12 · provenance spec (ACT 24afc2 / 9e45ec / 78fd32)

- **why:** SC text: no loss of content or functionality occurs when letter-spacing is set to 0.12× font size, word-spacing to 0.16×, line-height to 1.5×. An `!important` declaration in a `style` attribute prevents user style sheets from reaching those values (ACT rules 24afc2, 9e45ec, 78fd32).
- **applies-when:** HTML element with a visible direct text node (has client rect, not hidden, not fully off-screen, opacity > 0), not inside a third-party subtree, whose cascaded value for the property originates from a `style` attribute with `!important`, on the element itself or an ancestor it inherits from. `inherit`/`unset` walk up; `initial`/`revert` count as a locked declaration. For line-height only: the text must soft-wrap to at least two line boxes.
- **correct-when:** computed letter-spacing ≥ 0.12 × font-size; word-spacing ≥ 0.16 × font-size; line-height used value (measured with an inline-block probe span) ≥ 1.5 × font-size. Tolerance 0.01px.
- **verdict:** `not-applicable` if no applicable target for any of the three properties; `fail` if any applicable target is below its threshold, listing element, property, value and threshold; `pass` otherwise.
- **invalid-if:** page fails to load; text not visible; page title matches a bot-challenge pattern (`unmeasurable · blocked`).
- **known-infidelity:** only the `style`-attribute lock is measured, per ACT. Breakage after applying user styles (clipping, overlap) is a different measurement and is reported as `finding`, never `fail`: the override-breakage check applies the 1.4.12 user styles and counts newly clipped text containers and new overlaps between text containers.

## Revisions

v1 frozen 2026-09-05 (P0-A, sha256 `375832c3…da11bc`). ACT 62/62 with v1.

- 2026-09-06 **third-party subtrees excluded** from targets: on ad-carrying pages every `!important` spacing lock sat inside AdSense containers (P0-A finding).
- 2026-09-06 verdict names mapped to the repo's list; override breakage attached as `finding`.

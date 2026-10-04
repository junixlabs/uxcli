# uxcli's design system — what was drawn and what was picked

The owner, 2026-10-03, on the dashboard as first built: "a UI/UX tool that is all text is not right" —
cluttered, hard to read, no next step, not professional — for every uxcli page, one system.

Drawn by an agent (Claude) with the CRM demo's real screenshots (`img/`, from `uxcli demo` walked at
390×844 and 1440×900), each measured with `uxcli run` before it was shown:

| drawing | what it is |
|---|---|
| `A-filmstrip.html` | light; each journey a row of phones left to right, the action and its seconds on the arrow, "fix first" on top, state as icons |
| `B-gallery.html` | dark; every screen a card with a health bar, a queue of what to do with thumbnails |
| `C-canvas.html` | a Figma-like canvas: frames joined by flow arrows, pins on the picture, an inspector comparing the build with the picked drawing, a to-do bar |
| `D-hybrid.html` | **picked**: C's canvas, laid out as A's filmstrips, in A's light language |

Built as `src/core/ui.js` (tokens, icons, shared components) and `src/core/app-page.js` (the surface
`uxcli studio` and `uxcli dashboard` both write). The older pages (mockups, map, experience) take the
same tokens through `LEGACY_ALIASES`. Two drawings failed 1.4.3 once and were corrected before the pick;
building it found two of the system's own tokens below 4.5:1 (`--idle`, `--ok`), corrected, and a
pre-existing 2.9:1 grey on the mockups page, now measured by the gate.

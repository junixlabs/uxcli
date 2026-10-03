# Roadmap

Phases end when their exit criteria pass. No dates. The order follows the four pillars in VISION.md,
and the owner's call of 2026-10-03: build the library first, then the experience metrics that check it.

## Done

- **Page checks.** `run <url>` with focus-visible (2.4.7), text-spacing (1.4.12) and contrast (1.4.3)
  `method-validated` on 20–80 unseen pages with 0 false fails; text-overlap and nesting as findings;
  `--prove` plants each check's own defect so every pass earns it.
- **Flow checks, first cut.** `run <journey>` with 3.3.1, 3.3.4, 3.3.7 and 3.2.3, each with its pair;
  method-unproven, so they report findings.
- **Context before design.** Understanding (actors, insights with evidence and a falsifier), journeys
  as states the browser can check, `context show`. Measured: 0/10 sessions from a ticket alone, 10/10
  with the card.
- **Drawing and picking.** `mockups`: variants per state photographed, one decision per screen, picks
  and revisions hashed to the drawing; `map`: the journey as screens, model, run, diff and impact.
- **Lenses.** 123 viewpoints from four schools of designers, packaged by kind of UI; `review` and
  `review check`, which refuses a review a probe contradicts.
- **One skill, three ways in.** `doctor`, `demo`, `guide`; the skill installs into Claude Code, Codex,
  opencode and Cursor.

## 1. Knowledge — the library

- Done 2026-10-03: four topic pools from public design systems and WCAG — colour (10), writing and
  microcopy (10), data display (12), forms (12) — every quote fetched from the source repository and
  checked verbatim; folded into the six lenses.
- Done 2026-10-03: templates for three kinds of product — `workspace`, `shop`, `landing` — with
  screens and their lens, journeys to walk with what to watch, research questions and sources;
  `template apply` writes the questions as an actor's unknowns, creating only.
- Done 2026-10-03: `references/research.md`, the order in which the field is researched and how
  findings are written down.
- Next: templates for `content` (docs, help centres) and `mobile-app`; a topic pool for navigation and
  information architecture; a topic pool for motion and feedback.
- Next: `context show` names the template and the lens for each screen of the journey.
- Exit: an agent given only a ticket and the skill picks the right template and lens, and its drawing's
  review cites topic-pool rules, in 8 of 10 fresh sessions.

## 2. Experience validation — the centre

Measured from the trace of a real walk in Chrome, each with a must-fail and a must-pass journey:

- **Steps against the shortest path**: actions taken, clicks, characters typed, back-tracks, dead ends.
- **Keystroke-level estimate**: the time a practised user would need for the journey (Card, Moran &
  Newell's operators), so two versions can be compared in seconds rather than impressions.
- **Response**: time from each action to the first visible change; a progress signal past one second.
- **Continuity**: data entered on one step present on the next; nothing asked twice (3.3.7 generalised).
- **Recovery**: an error planted on purpose — a message, at the field, with the other answers kept.
- **Consistency**: navigation, terms and the primary action in the same place across the journey's
  screens (3.2.3 generalised).

- Done 2026-10-03: `uxcli experience` reports steps, typing, scrolls, settle time in Nielsen's bands
  and a keystroke-level estimate per workflow; a wait past 1 s, a control below the fold, an answer
  typed twice, a step that did not arrive; after an error answer, a typed answer the page cleared
  (passwords excepted) and an error nothing announced; a navigation landmark whose items change order
  within a workflow. `--page` pins each on the step's screenshot. All findings; none validated yet.

Every finding is pinned on the step's screenshot. Exit: each metric has its pair in the gate, and on
the CRM example a planted extra step, a missing progress signal and a lost value are each caught.

## 3. Evidence and versions

- A trace schema (the actions, their targets, timings and the state after each) and an evidence schema
  (a screenshot, a region, what was found there, which rule or metric).
- A version of a journey: its screens, metrics and findings at one build. A proposal for a new version
  names the evidence that caused it.
- `map` compares two versions step by step: what changed on screen, and what the metrics did.
- Done 2026-10-03: `uxcli version save <journey> <name>` names a walk (one file per version, never
  rewritten; its run kept against pruning); `experience --journey --from --to [--page]` compares two
  versions step by step with both pictures side by side; proposals take `kind: redesign`, with
  `evidence[]` citing the walk; `references/versions.md` is the loop. The trace and evidence shapes are
  the run packet and the experience report; a schema of their own is next.
- Exit: on the CRM example, v1 and v2 side by side, with the metrics that moved.

## The studio

- Done 2026-10-03: `uxcli studio` — one local board for the project, read like a design file and built
  only from `.uxcli/`; served, the place a person picks or asks for a redraw while the agent works
  through the CLI. Next: version-to-version view toggled on the board; comments a person leaves on a
  frame, written as a redraw request scoped to it; export of a frame as PNG for an issue.

## 4. Walkthrough and personas

- Cognitive walkthrough at each step: the four questions answered with the screenshot, as findings.
- Personas from the project's own understanding walk the journey and record where they hesitate.
- Exit: agreement with a human designer measured on a sample and published with its limits. Until
  then, findings only.

## The decisive experiment

Same ticket, fresh sessions, agent with uxcli against agent without, scored on the walk (the metrics
above) and by blind pairwise preference from designers. The repository already has the harness
(`experiments/understanding-before-design`).

## Not planned

Scores. Summaries that hide their sources. Conformance claims. A UI generator. A rule nobody can cite.

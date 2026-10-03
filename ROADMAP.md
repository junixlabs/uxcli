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
- Done 2026-10-03: templates for `content` (docs, help centres) and `mobile-app`; `template apply`
  records the template and `context show` names it, the lens for each kind of screen, and the lens each
  screen of the journey was reviewed against.
- Done 2026-10-03: topic pools for navigation and information architecture (10) and motion and
  feedback (10), quotes checked verbatim against the source repositories; the lenses carry 187.
- Exit: an agent given only a ticket and the skill picks the right template and lens, and its drawing's
  review cites topic-pool rules, in 8 of 10 fresh sessions.
- Measured 2026-10-03, not met: in the draw arm (two screens undrawn, the template recorded) 1/10 read
  a lens, 0/10 drew or reviewed, 10/10 built the page anyway — before and after `context show` printed
  BEFORE YOU BUILD (8/10 saw it), with the rule file saying the same. 19/20 said they skipped design.
  Text does not move it; the owner decides whether the instrument holds the work to a pick and a
  review, or the design step waits for a person in the loop.
- Decided and done 2026-10-03 (both, under the owner's grant of authority over the roadmap): policy
  `project.design: drawn | picked` holds a project's work to the design step — a clean walk exits 3
  while a walked screen lacks two drawings and a lens review (or, under `picked`, a person's pick).
  Measured: under the gate 0/30 drew unasked, 29/30 said the work was not done instead of finishing;
  with the ticket asking for the design step (`asked` arm), 10/10 read the `workspace` lens, drew two
  variants of each screen, wrote complete reviews answering topic-pool viewpoints (8 to 36 holds or
  breaks each), built, and closed the walk at exit 0. **Exit met when the design step is asked for**;
  an agent does not take it up unasked, and the instrument makes its absence impossible to call done.

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
  `evidence[]` citing the walk; `references/versions.md` is the loop.
- Done 2026-10-03: `trace.schema.json` (a step of a walk; a typed value stored instead of its hash does
  not fit) and `experience.schema.json` (the report), held by the experience pairs.
- Exit: on the CRM example, v1 and v2 side by side, with the metrics that moved.

## The studio

- Done 2026-10-03: `uxcli studio` — one local board for the project, read like a design file and built
  only from `.uxcli/`; served, the place a person picks or asks for a redraw while the agent works
  through the CLI.
- Done 2026-10-03: compare two versions on the board (each frame of the later one says what moved);
  a note on a built frame written as a `redesign` proposal citing the walk; each frame's picture opens
  on its own to attach to an issue.

## 4. Walkthrough and personas

- Cognitive walkthrough at each step: the four questions answered with the screenshot, as findings.
- Personas from the project's own understanding walk the journey and record where they hesitate.
- Done 2026-10-03: `uxcli walkthrough <journey> [--as=<actor>] --write` and `walkthrough check` — the
  four questions of Wharton, Rieman, Lewis & Polson (1994) at every step of a walk, answered from its
  screenshot, as an actor the project wrote; refused when incomplete, unsigned, or contradicted by the
  walk (a "yes" to noticing a control measured below the fold, to progress where the step did not
  arrive); "no" and "unsure" are findings, shown in the studio. Schema `walkthrough.schema.json`.
- Exit: agreement with a human designer measured on a sample and published with its limits. Until
  then, findings only.
- Done 2026-10-03: `uxcli prefer make|serve|tally` — blind pairwise preference, the instrument for that
  agreement and for the decisive experiment's second score: pictures renamed so nothing names a group,
  each judge's order and sides their own, a judgment only a person's, a sign test in the tally.
  `experiments/understanding-before-design/study.mjs` builds the skill-vs-ticket study from the walk's
  screenshots. The judging itself is people's to do.

## The decisive experiment

Same ticket, fresh sessions, agent with uxcli against agent without, scored on the walk (the metrics
above) and by blind pairwise preference from designers. The repository already has the harness
(`experiments/understanding-before-design`).

- Done 2026-10-03, small: three sessions an arm, scored by `uxcli run` and `uxcli experience` with one
  instrument (`rescore.mjs`). Ticket alone 0/3, with the skill 3/3 at both viewports; the ticket arm's
  pages leave the call step unreached. Recorded in the experiment's README.
- Done 2026-10-03: ten sessions an arm — ticket alone 0/10, with the skill 8/10, the draw arm 9/10
  and 10/10; experience findings median 2 against 1. The two failing skill sessions never read the
  journey's card; `uxcli run <url>` now names the journey a screen belongs to.
- Done 2026-10-03: a second ticket where the agent decides the steps (CRM-215, recording how a call
  went), scored on the journey each session extended and on what the server recorded. 20/20 recorded
  the outcome; the estimate differed between sessions (one tap 9.2 s ×18, two taps 11.9 s ×2), not
  between the skill and gate arms.
- Done 2026-10-03: the study for blind pairwise preference (skill vs ticket, 390×844) is built and
  served by `uxcli prefer`. Waiting on people: designers to judge it. Its tally is the second score.

## Not planned

Scores. Summaries that hide their sources. Conformance claims. A UI generator. A rule nobody can cite.

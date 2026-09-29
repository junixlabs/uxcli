# Lenses — packaged designer viewpoints, and how uxcli can hold them

**Date** 2026-09-29 · **Category** research + packaging proposal · **Status** built 2026-09-29 — the owner's picks below
**Material** [`craft.md`](craft.md) · [`canon.md`](canon.md) · [`usability.md`](usability.md) · [`modern.md`](modern.md) — four research agents, one per school, every citation fetched in-session.

## Context

On 2026-09-29 the owner asked for the name of the thing behind "too many sections, cards inside cards".
The 2026-09-12 research already held it (Refactoring UI, *fewer borders*; Gestalt common region). Applying
that one viewpoint to the mockups page took its boxed nesting from 5 to 4 and the owner said the UI got
better. The ask that followed: uxcli should carry **one or more sets of such viewpoints**, learned from
UI/UX designers in the world, and an agent doing UI work should **evaluate its UI against a set**.

uxcli's standing rule bounds the design: *nobody signed taste, so taste never runs* (VISION). The
provenance ladder is `spec · project · research · analytics · experiment · opinion`; a method that is
unproven may say `finding`, never `fail`; the falsification test (a must-fail fixture and a must-pass
twin a machine agrees on with nobody judging) decides what is measurable. The 2026-09-12 research
already sorted "don't nest popups" (passes) from "too many cards" (fails, stays taste).

## Questions

1. Which designers and schools have citable viewpoints, and which of those viewpoints are measurable?
2. What is a "set" in uxcli terms, so that it fits `no commitment, no verdict` instead of breaking it?
3. How does an agent *use* a set when it draws and when it says done?

## What the research found

| school | file | viewpoints | measurable yes | partly | no | sources fetched |
|---|---|---|---|---|---|---|
| practitioner craft — Wathan & Schoger, Erik Kennedy, Paul Adams, Growth.Design | craft.md | 32 | 20 | 11 | 1 | 20 |
| classic canon — Rams, Vignelli, Müller-Brockmann, Bringhurst, Butterick, Tufte, Gestalt (NN/g) | canon.md | 30 | 21 | 9 | 0 | 23 |
| usability & psychology — Nielsen/NN/g, Norman, Krug, Laws of UX, Baymard, Wroblewski, GOV.UK | usability.md | 31 | 13 | 15 | 3 | 45 |
| modern product craft — Rauno Freiberg, Emil Kowalski, Linear/Saarinen, Vercel, Comeau, Apple HIG, Material, Ström, Brignull, the "AI look" critiques | modern.md | 30 | 16 | 13 | 1 | 33 |
| **total** | | **123** | **70** | **48** | **5** | **121** |

"Measurable yes" means the researcher could sketch a must-fail fixture and a must-pass twin with no
judgement in between. "Partly" means a symptom can be counted but a person owns the verdict. These
are sketches, not validated probes: none has been run on a page.

### Where the schools converge

The strongest candidates are the viewpoints that three or four schools state independently, each
with its own named owner. Independent owners are what makes a viewpoint more than one person's taste.

| viewpoint | who says it |
|---|---|
| separate with space first, then a line, a box last; no box inside a box | Wathan/Schoger *fewer borders* · Tufte *1+1=3* · NN/g common region · Rams *as little design as possible* |
| one emphasis per view; one primary action | Kennedy *squint test* · Von Restorff (Laws of UX) · GOV.UK button · Vignelli *weight for function* · Schoger button hierarchy |
| few type sizes, on a scale | Kennedy · Vignelli *two sizes* · Bringhurst *compose with a scale* · Rauno readable sizes |
| spacing from a scale, not ad hoc | Schoger · Müller-Brockmann · Bringhurst *leading as unit* · Vercel guidelines |
| a clickable thing must look clickable; nothing unclickable may | NN/g Moran 2017 (n=71, eyetracking) · Norman signifiers · Rams *honest* · Gestalt similarity |
| all-caps needs letter-spacing | Schoger · Bringhurst 5–10 % · Butterick 5–12 % |
| body text ≥ 16 px, line-height ≈ 1.5 | Schoger · Butterick 15–25 px, 120–145 % · Rauno · Apple HIG |
| targets ≥ 44/48 px and inputs ≥ 16 px on a phone | Kennedy · Apple · Material · NN/g Fitts · Vercel |
| labels above fields, placeholders are not labels, one column | Wroblewski · Baymard · GOV.UK · NN/g Sherwin |
| 45–75 characters per line | Kennedy · Bringhurst · Butterick (45–90) |
| interactions fast (≤ 200–300 ms), transform/opacity only, honour reduced motion | Rauno · Emil · Vercel · Comeau |
| shadows lit from one source, from above | Kennedy · Schoger · Comeau · Rauno |
| feedback within a second; a progress signal past it | Nielsen 1993 · Ström *density* · Sherwin |
| no deceptive pattern: preselection, confirmshaming, fake urgency | Brignull · GOV.UK · Growth.Design's "ethically" |

### What stays taste, on purpose

Rams *innovative / aesthetic / long-lasting*; Vignelli semantics and *intellectual elegance*; Krug's
law itself; Saarinen *quality is a choice*; Adams' *dribbblisation* (a critique of process, not of the
artifact); *don't make me think*. The researchers left these out of the metric list rather than force a
number on them. A lens carries them as questions for a person, never as a probe.

### Reliability, in one paragraph

Verbatim from the author's own page: Rams, Vignelli (PDF), Müller-Brockmann (OCR), Butterick,
Bringhurst via webtypography.net, Kennedy, Schoger's tweets (two compilations agree), Rauno, Emil,
Saarinen, Comeau, Nielsen and the NN/g studies, Baymard, Wroblewski, GOV.UK, Brignull. Secondary only:
Tufte (quotes agree across three pages, books unreachable), Refactoring UI's chapter text (paid; titles
exact, rules from Schoger's talks), Polaris (2017 archive), Atlassian (mirror), Material numbers (Google
help page). Contested evidence: Zeigarnik (2025 meta-analysis says replicability is questionable),
Doherty 400 ms (one 1982 paper), Miller 7±2 (does not license UI limits). Not found: "whitespace before
lines before boxes" as Kennedy's words — the order is Refactoring UI's, the attribution was folklore in
this project's own memory and is corrected there.

## Options for packaging

**A — a reference document in the skill.** `skills/uxcli/references/lenses.md` listing the viewpoints
with sources; the agent reads it before drawing and before saying done.
Pros: an afternoon; nothing runs, so nothing can be wrong. Cons: not a set the project can adopt or
refuse, not visible to `context show` or the mockups page, and an agent's "I checked it against the
lens" is a sentence in chat with no record. Cost: ~½ day.

**B — lenses as shipped data, adopted per project.** `lenses/<school>.json` in the package, one
schema, one gate pair (every source URL and quote present, every viewpoint marks
`measure: probe | count | question`). `uxcli lens list` / `uxcli lens show <id>` print a lens as a
card, the way `context show` prints a brief. A project adopts a lens in `.uxcli/lenses.json` with
`owner` and `source` (the design doc that says "we hold this taste"); unadopted, a lens is a library
entry and prints nothing anywhere else. After drawing or building, the agent walks the adopted lens
against the screenshot and writes `.uxcli/reviews/<state>/<lens>.json`: per viewpoint `holds ·
breaks · n/a`, `where`, `note`, signed `by {type: agent, onBehalfOf}`. `uxcli mockups` prints
"reviewed under craft · 3 of 32 break" on the variant card and `context show` prints the adopted
lenses. uxcli judges nothing: it holds the library and the record.
Pros: fits *no commitment, no verdict* exactly (adoption is the signature); the review is on disk, so a
person can see what the agent claims to have checked; the four schools stay separate, so a project can
hold the canon and refuse the modern one. Cons: the review is still the agent grading its own work;
NN/g's aesthetic-usability finding says it will be generous. Cost: ~2 days.

**C — B, plus probes for the convergent measurables.** One at a time, each with `spec.md`, a must-fail
and must-pass pair, provenance `research` (named authors and URLs, several of them), method-unproven so
the verdict is `finding` until 20 unseen pages show 0 false fails; a lens viewpoint points at its probe
with `measure: { probe: 'page.nesting' }` and the probe runs only when a lens that carries it is
adopted. First: `page.nesting` (boxed-container depth; the owner already met it), then `page.emphasis`
(one filled primary per view), `page.type-scale` (distinct font sizes), `page.caps-tracking`
(uppercase without letter-spacing), `page.targets` (44 px at 390).
Pros: the part of a lens that a machine can hold stops depending on the agent's honesty. Cons: each
probe is a day with its pair and its first false-positive hunt; a `finding` from `research`
provenance is a new kind of card readers have not seen.

## Recommendation

**C, staged as B first.** Ship the four school lenses as data with the command, the schema, the
adoption file, the review record and the skill reference; then probes one at a time, `page.nesting`
first. Reasons: the adoption file is what keeps VISION true (a lens that is not adopted is silent); the
review record is what makes "I evaluated it against the set" a thing a person can open; and the probes
turn the convergent viewpoints, the ones with three or four independent owners, into measurements
whose method can be proven the same way the WCAG probes were. Keep the schools separate: the research
shows they disagree in numbers (line length 45–75 vs 45–90, leading 1.2 vs 1.5) and a merged lens
would have to pick a side without an owner.

The viewpoint file format, proposed: `{ id, claim, source: { author, work, url, quote }, agrees: [other
lens/viewpoint ids], prefers: [], forbids: [], measure: { kind: probe|count|question, ... },
exceptions: [], evidence: study|author|secondary|folklore }`. The `agrees` links are what the
convergence table above becomes on disk.

## Risks

- **Curating a lens is uxcli holding an opinion.** Answer: a lens is a library card with someone else's
  name on it; the adoption entry names who in the project holds it; nothing runs unadopted. The gate
  asserts every viewpoint has a fetched URL and a quote, or it does not ship.
- **The agent grades its own screen.** The review record is signed by the agent on a person's say-so
  and is shown as a claim, never a verdict. The measurable part moves to probes as they are proven.
- **Citation drift.** Pages move (six NN/g and Norman URLs were 404 in-session). The gate can check a
  URL once at packaging time, not forever; the lens file carries the quote so the claim survives the
  link.
- **Schools disagree.** Kept as separate lenses; a viewpoint's `exceptions` records the other side.
- **Scope.** Each probe is its own day. Nothing in B depends on any probe existing.

## Metadata

Method: four `general-purpose` agents, one school each, instructed to cite only fetched URLs and to
mark unverified claims; 2026-09-29, ~35 min wall clock. Every claim above traces to one of the four
files, which carry the URL and the reliability note per viewpoint. Not done: no viewpoint has been run
as a probe on any page; no designer was interviewed; the paid books (Refactoring UI, Tufte, Krug ch.
1–3, 5) were read through their public parts and secondary quotations only.

## Decision (2026-09-29)

The owner's answers: lenses by **kind of UI**, not by school ("admin, dashboard, landing, ecom… they
differ"; the four were examples, and the kinds were re-proposed); **on by default, a project can turn
one off**; first delivery = lenses, command, skill, review record, the `page.nesting` probe, and the
skill **validates against the checklist**.

Built: six kinds by what the person does on the screen — `marketing`, `content`, `data`, `workspace`,
`shop`, `transaction` (mobile is a viewport, not a kind). The four schools stay as pools
(`lenses/viewpoints/<school>.json`), each viewpoint marked yes/no/maybe per kind; a lens is the "yes"
viewpoints for its kind, with viewpoints that name each other directly folded into one line (star
folds: chains of agrees merged unrelated rules and were dropped). `uxcli review check` is the
validation: a review must answer every viewpoint, say where, be signed on someone's behalf, be fresher
than the drawing, and not say `holds` where a probe the viewpoint names counted a break.

Deviation from recommendation B: lenses are on by default (the owner's pick) rather than adopted. The
VISION rule still holds in the part that matters: a lens never produces a verdict; a review is shown
as the reviewer's claim, and only a probe with its own pair (`page.nesting`) measures anything.

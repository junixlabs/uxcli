# PRODUCT

What uxcli is for, who it is for, and what it refuses to be. VISION.md is the argument; this is the
brief a contributor or a reviewer holds a change against.

## Users

The person operating a coding agent on a product with an interface, and the agent itself.

Their pain is specific. The agent designs from what it assumes — about the field, about the people,
about what good looks like — and produces something plausible, generic and unwalked. Then it reports
success with proof of failure in hand. The person wants an agent that learns the field before it
draws, designs from principles somebody tested, and walks the journey before it says done.

The agent calls the CLI, reads the library and the cards, and writes the files under `.uxcli/` that a
person then picks, answers or signs. Everything uxcli prints is written for the agent to act on without
interpretation: `what · where · rule · check`, an exit code, a path to the evidence.

## Purpose

uxcli gives a coding agent the habits of a designer who did the research, in four pillars:

- **Knowledge** — a library of cited rules (lenses by kind of UI, topic pools for colour, writing,
  data display and forms) and templates for kinds of product. Every rule names its author, its page,
  its exact words, and how it is checked.
- **Process** — research the field (`references/research.md`), write what was learned as insights and
  what was not as questions, read `context show`, draw variants to the lens, build the one a person
  picks.
- **Evidence and versions** — one shape for what a walk saw (screenshots, the trace, highlighted
  problems), proposals for a new version that point at the evidence, versions compared along the flow.
- **Experience validation** — walk the journey in real Chrome and measure what the person goes through:
  steps against the shortest path, time a practised user would need, response within a second, data
  carried between steps, recovery from an error, consistency between screens.

The centre is the fourth. Technical checks on a page are the floor, not the product.

## Personality

Knowledgeable, sourced, plain. uxcli has opinions — it ships a library of them — but every opinion has
a name and a page on it, and says how it can be checked. A card says what was measured and what was
believed, and never dresses one as the other. Silence is a valid output: where nothing was measured,
nothing is claimed.

## Anti-references

What uxcli is not, so a feature that drifts there is refused:

- **Not a UI generator.** It does not compete with the tools that draw screens; it makes whatever draws
  them draw from research and checks what was drawn.
- **Not unsourced taste.** A rule nobody can cite does not ship. "Best practice" without an author is a
  hypothesis, labelled `folklore`.
- **Not a score.** No 0–100, no letter grade, no "UX health". Measurements with units, findings with
  sources, one exit code.
- **Not a substitute for real users.** Walkthroughs and simulated personas find what a careful designer
  would find; they are findings, never verdicts, and the card says nobody was watched.
- **Not visual regression.** A pixel diff says "different"; different is not wrong.
- **Not a conformance certificate.** Page checks at exit 0 are a floor, not an audit.

## Design principles

1. **The card is the argument.** Every line cites the measurement or the source, the place, the rule
   and how to check it by hand. If a surface cannot print those four, it is not done.
2. **Measured may block; believed may only inform.** A check blocks only when it has a pair (a case it
   must fail, a twin it must pass) and a record of running on unseen pages with no false fails.
   Everything else is a finding.
3. **Every claim is a pair.** A probe, a schema, a template, a skill paragraph: `uxcli gate` holds a
   way to make each one fail on demand.
4. **Sources are fetched, quotes are verbatim.** The library carries words someone actually wrote, on a
   page someone can open. An unknown about the user stays a question until a source answers it.
5. **Create, never overwrite.** `init`, `template apply`, `review --write` only ever add files. What a
   person wrote is theirs.
6. **Exit 0 is a floor.** The instrument says what it measured and what it did not look at, in the same
   breath.

## Accessibility

The instrument's own output is text in a terminal with no colour dependence, and the pages it writes
(mockups, map) are measured by its own page checks in the gate.

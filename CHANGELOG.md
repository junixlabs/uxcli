# Changelog

All notable changes to `@junixlabs/uxcli`. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Entries are written per release. The log is the source material, not the text.

## [Unreleased]

### Added — one shipped skill, and three ways in

- Lenses: 123 viewpoints from named designers in four schools — usability (Nielsen and NN/g,
  Norman, Krug, Laws of UX, Baymard, Wroblewski, GOV.UK), practitioner craft (Wathan & Schoger,
  Erik Kennedy, Paul Adams), the classic canon (Rams, Vignelli, Müller-Brockmann, Bringhurst,
  Butterick, Tufte, Gestalt) and modern product craft (Rauno Freiberg, Emil Kowalski, Linear, Vercel,
  Comeau, Apple, Material, Ström, Brignull) — each with author, work, URL and the words, distilled
  from research that fetched every page it cites (`docs/lenses/`).
  They ship inside the skill as `skills/uxcli/lenses/viewpoints/<school>.json` and are packaged by the kind of UI they are read
  against — `marketing`, `content`, `data`, `workspace`, `shop`, `transaction` — with rules that
  several schools state folded into one line. `uxcli lens` lists them, `uxcli lens show <kind>` prints
  the checklist, `uxcli review <state>/<variant> --lens=<kind> --write` writes an empty review beside a
  drawing (or a URL with `--name`), and `uxcli review check` refuses a review that leaves a viewpoint
  unanswered, claims without saying where, is signed by an agent on nobody's behalf, is older than the
  drawing, or says `holds` where a probe the viewpoint names counted a break. The mockups page and card
  show each review on its variant; `context show` prints the lenses on. Every lens is on; a project
  turns one off in `.uxcli/lenses.json` with a name. The lenses live inside the skill: `skills/uxcli/lenses/<kind>.md` is each
  checklist as the agent reads it, installed by `init` and held equal to its JSON by the gate; the skill
  reads it before drawing, reviews against it after, and again before done (`references/lenses.md`). Schemas: `viewpoints`, `lens`, `review`, `lenses`.
- `page.nesting`, a fifth page probe: text inside three or more nested boxes (a border on two sides or
  more, a shadow, an outline; controls, table cells and one-sided rules are not boxes). Provenance
  `research` (Refactoring UI "Use fewer borders", Tufte "1 + 1 = 3", NN/g common region),
  method-unproven, so it reports a `finding`. It is the probe behind the fewer-borders viewpoints, so
  a review that says they hold on a drawing three boxes deep is refused.
- The mockups page with fewer borders: a journey is a numbered heading and whitespace with one
  rule between journeys, a screen card is a number and a heading, the lanes sit on the canvas, and
  only the variant — the thing a person picks — is a box, its photograph a shadow. Boxed nesting on
  the page (an element's ancestors that draw a border, shadow or outline) fell from five deep to
  four, measured in a browser rather than by eye.
  One play button per journey: the lane carries it, and the journey header offers `play all` only
  when there is more than one lane to chain.
- The mockups page redrawn after three frames an image model made from an open brief
  (`docs/design/mockups-page/`): a dark sidebar that lists the journeys and filters by them; each
  journey a numbered section with its lanes and, under them, one numbered card per screen (1.1,
  1.2 …) holding the variants side by side — pick box, letter, pins, receipt, the pick's
  signature with the hash prefix — and the reference pictures in a column; a viewport switch that
  turns every photograph on the page to 1024×768 or 390×844; compare opens two variants with their
  notes and a `Pick a-canvas` button. Ticking a variant, on the page or in compare, fills a bar with
  the `pick.json` to write — pick, sha256, by, when — and a copy button; the page writes nothing.
- The mockups page redrawn as a contact sheet: dark canvas, light frames. A screen nobody has
  picked yet shows its candidates inside its frame in the flow (stacked for a landscape viewport,
  side by side for a portrait one) instead of an empty box; the galleries fill the width; the
  further viewports sit in a strip of one height; headings and footer are one word where one does.
- Reference pictures: `.uxcli/mockups/<state>/refs/*.png` (a style frame, a sketch, a competitor's
  page) are shown under that screen's variants labelled `reference`, open large on click, and are
  never a variant — no hooks, no pick, no hash.
- The mockups page reads like a design file: a variant opens large in a viewer with its pins, its
  notes and every hook the journey names outlined where the browser found it, labelled with the
  selector (the `hooks` toggle shows the outlines on the thumbnails too); two variants ticked `compare` open side by side; the journey
  tabs filter the page to the flow and the screens one journey names; `▶ play journey` chains a
  journey's lanes into one prototype. The page pair clicks through each (`test/page-pairs.mjs`).
- The mockups page plays: `▶ play` on a lane opens its picked frames one at a time, the hotspot
  the step acts on leading to the next frame (below the fold, a dashed bar under the picture says
  how far), arrow keys step, Escape closes. Nothing is drawn that the flow does not already carry;
  the page pair clicks through it (`test/page-pairs.mjs`).
- `uxcli mockups --viewport=WxH,WxH…`: the first viewport is the one the flow, the hooks and the
  pins are read at; each further one is photographed beside it in the gallery. An element in a
  variant carrying `data-uxcli-note="…"` gets a numbered pin at its place on the frame and its text
  under the picture; a note below the fold pins to the frame's bottom edge.
- Shared tokens for mockups: `.uxcli/mockups/_shared/<file>.css`, linked from a variant as
  `../_shared/<file>.css`. The pick's `sha256` covers the variant and the shared files it links, so
  a token change is a drawing change; the receipt names every colour a variant paints that no shared
  token carries, and says when a variant does not link the shared file at all.
- A pick names the drawing it chose: `pick.json` carries `sha256` of the picked file, and a pick
  over a drawing that changed since is refused until someone looks again. Every variant gets a
  receipt on the `mockups` card — the hooks the screen wants found or missing, anything reached for
  over the network, lorem ipsum — and a pick over a variant that fails its receipt is refused.
- A blocked run's card carries a `fix` line per reason (prerequisite, identity, reach): the file or
  the policy field, not advice about the product.
- The gate opens the pages uxcli writes (`map`, `mockups`) in Chrome at 1440×900, 1600×1000 and
  1920×1080 and refuses a page whose scroller overflows sideways or that leaves the canvas mostly
  empty on a large display; the four page probes run on the map (`test/page-pairs.mjs`).
- The skill bounds repair: one diagnosed element per fix, one run per fix, and two consecutive
  runs with no fewer fails end in a report, not another attempt.
- `uxcli map`: the journey map, one page per project at `.uxcli/map/index.html`. Each journey is a
  strip of steps on a canvas; four views — MODEL (the picked mockups), RUN (the last run's
  screenshots, each state held or not), DIFF (declared beside observed), IMPACT (what the
  commitments decided); a side panel per step with before/after, API, state, evidence, commitment
  and run, each row opening to the signals and the card's `what · where · rule · check`; an
  evidence tray; an overview and a findings list. Drift means a state the run said did not hold or
  a fail cited at the step, nothing else, and the page carries no advice (`test/map-pairs.mjs`).
- `uxcli mockups`: screens drawn before they are built. The agent draws two or three variants of
  each state the journeys name into `.uxcli/mockups/<state>/<variant>.html`, with the journey's own
  `data-uxcli` hooks; a person picks in `pick.json` (`pick`, `parts{}`, `by`; refused without `by`).
  The command photographs every variant at the run viewport and writes `.uxcli/mockups/index.html`:
  each journey as a wireflow of the picked variants, the connection leaving the hook the next step
  acts on, and each screen's variants side by side — green picked, amber part of a pick, grey not
  taken. `uxcli init` counts screens, drawn and picked, and makes drawing the next step once a
  journey exists. `schemas/pick.schema.json`; `references/mockups.md` in the skill; held by
  `test/mockup-pairs.mjs`.

- `skills/uxcli/`: one skill directory with a router (`SKILL.md`: fast path, verdict router,
  invariants, which reference to read when) and four references — `before-done`, `journey`
  (rewritten for schema-2 journeys), `principles` (rewritten for `.uxcli/commitments/`), and
  `understand` (new: actors and insights with a source fetched in-session). It installs with
  `npx skills add junixlabs/uxcli -g` for Claude Code, Codex, opencode and Cursor, or with
  `uxcli init --apply`, which now copies the whole directory. The three standalone skills are gone.
- `uxcli doctor`: node, Chromium (including the headless shell `executablePath()` does not report),
  project root, policy, declarations, level, installed skill — one row each, with the one command
  that fixes it. Exit 1 only when a run could not work.
- `uxcli demo <empty dir>`: the fixture CRM copied, served on a free port, and its journey run at
  390×844; the first card is C-001 failing on the call action below the fold, with the packet to
  dispute it.
- `uxcli guide "<situation>"`: which command and which file, from fourteen recipes; the whole list
  when nothing matches.
- `schemas/`: JSON Schema for actor, insight, journey, commitment, policy, profile and proposal,
  `additionalProperties: false` at the top level, held to the examples by `test/schema-pairs.mjs`
  (every shipped file validates; an unknown key or a missing required key is refused). The
  validator is in-repo; the parsers stay the law.
- `skills/pair.json` entries now name the file a paragraph lives in. The `before-done` paragraph
  and its record are unchanged; `journey` and `principles` were rewritten and their old records no
  longer apply; `uxcli` and `understand` are new. All four say so and are unmeasured until the
  Phase 2 re-measure.

### Added — shipping

- `release.yml` replaces `publish.yml`: annotated tag `v*` → gate → tag = `package.json` = the
  skill's `metadata.version` (major.minor) → `npm pack` lists every shipped root → npm publish with
  provenance → GitHub Release from the CHANGELOG section. `scripts/release-identity.mjs` runs the
  same checks locally; `test/packaging-pairs.mjs` holds them in the gate along with the README's
  front door, the skill's frontmatter and references, and `package.json` `files`.
- The Verdict Lab (`docs/lab/`, GitHub Pages): real runs regenerated by `scripts/lab.mjs` — both
  fixture journeys and every page probe's twins. A journey run is drawn as a wireflow of its own
  screenshots: one row per workflow, each frame a before/after shot with its state and held pill, a
  hotspot on the element the browser acted on, a connection to the frame that resulted labelled with
  the action and what the API answered, and the verdict badged on the frame it cites. The card as
  printed, the packet and a share card sit below. `scripts/share-card.mjs` renders one verdict to a
  1200×630 PNG.
- A `ui` interaction in a journey packet now carries `rect` — the acted-on element's box in CSS px
  inside the viewport the before-shot shows — so a viewer can point at the hotspot on the picture.
- `PRODUCT.md` (users, purpose, anti-references, principles), `CONTRIBUTING.md` (what a change must
  carry; the gate is the review), `SECURITY.md` (what uxcli touches; reach is a policy), and the
  `showcase` issue template for submitting a real run.
- `experiments/understanding-before-design/`: the decisive experiment — four arms × ten fresh
  sessions on the fixture with the lead page removed, scored by `uxcli run`. Results in
  `results/summary.md` and in VISION.

### Removed

- `uxcli.context.json`, the `uxcli context [dir]` verb and `src/context.js`. The product's context
  is `.uxcli/understanding/` and is read by `uxcli context show`. What `propose` lets a claim cite is
  now an insight with a `source` and `evidence[]`.

### Changed — storage layout v0.2

- One directory per run: `.uxcli/runs/R-<when>-<six>/run.json` with its pictures under `artifacts/`.
  Nothing is rotated or overwritten any more; the previous layout keyed a directory on the target and
  moved the last run into `history/` only to keep each packet beside the images it named. A directory
  made once needs no such guard. "The latest run of a target" is now read off `ranAt`, never off a
  file's position. `prune` keeps the newest seven per target and never touches a run a commitment
  anchors to.
- Understanding is two authored objects: `understanding/actors/<actor>.json` (who, jobs, pains,
  `unknowns[]`) and `understanding/insights/<id>.json` (one claim each, with `about: domain | product
  | actor:<name>`, its evidence, its falsifier). A journey's `trace[]` and a commitment's `source.doc`
  point at the insight file. Domain and product knowledge has a home without a new directory.
- Every authored file carries `schema_version` (journeys 2, everything else 1) and every parser refuses
  a file without it, naming the command that adds it.
- `proposals/` are tracked, not ignored: a commitment cites the proposal it came from, and a citation
  to a file that is not in the repository is a broken signature. Status set: `proposed · approved ·
  rejected · withdrawn`; the machine only ever marks, never deletes.
- The example project moved from a gitignored working directory into `examples/crm/`, shipped with the
  package, runs included: it is the contract about shape every suite reads, and a fresh clone now
  runs the gate. `scripts/example-index.mjs` rebuilds its `index.json`.

### Added

- `uxcli migrate [dir] [--apply]`: moves a project's `.uxcli/` to this layout — splits understanding,
  flattens runs (run.json files are moved, never rewritten, so anchors keep their hash), rewrites every
  trace, source and anchor path that named a moved thing, adds `schema_version`, drops the index.
  Prints the plan; `--apply` writes; a migrated project reports nothing to do.

- `uxcli context show [journey]`: the card an agent reads before it designs a screen. Assembled from
  the project's own declarations — the actor's `unknowns[]` first, then who they are, each insight at
  the confidence its evidence allows (the ceiling, never the author's word; the card names an
  overclaim), the states the journey says the screen must hold with the hooks each needs, the
  commitments signed over it, and the last run. It writes nothing, not even `index.json`, and
  contains no sentence uxcli wrote about the product: no pattern, no advice.
- `loadProject` parses every `.uxcli/understanding/*.json` with the user-model parser instead of
  reading it raw, so an empty `unknowns[]` or a confidence above its ceiling is a problem `init` and
  `context show` print, not an understanding the level counts.
- `test/brief-pairs.mjs`, registered in the gate.

## [0.7.0] - 2026-09-26

### Added

- A closed packet format. Every probe result now has eleven top-level keys and no more, with the tail
  sorted into four named containers: `evidence` (what a reader would open to check the verdict),
  `measured` (the arithmetic behind the sentence), `doctrine` (the instrument judging itself) and
  `cite` (`what` / `where` / `check`, all three or none). `gate` enforces it. Before this the tail was
  open, and a surface had to keep a list of field names by hand to know what not to print.
- Runs measured before the format are lifted into it on read, so a surface only ever sees one shape.

### Changed

- `uxcli init` at zero: `--apply --origin=URL` writes `.uxcli/project.json` and a floor policy
  (reach observe, one environment, no identity, no effect) signed by the person who ran it; after
  that the card names the first thing still undone. Runs record their viewport, and a commitment
  scoped to other viewports is not measured by them. Trust cannot reach `gate` until every ACTIVE
  commitment has a corpus label on its step.

### Removed

- The dashboard, and everything that served it: `uxcli dashboard`, the browser modules, the bundled
  fonts, the per-machine project list under `~/.uxcli/`, the index rows the runner used to register,
  and the prototypes. The card, `run.json` and the screenshots beside it are the whole reading surface.

### Fixed

- `text-overlap` clamps text rectangles to what their clipping ancestors actually let through, so text
  hidden behind `overflow: hidden` is no longer reported as painted over its neighbour.
- Four verdicts that carried no reason, and one citation with no place in it, both caught by the new
  format on its first run.

## [0.6.0] - 2026-09-15

### Changed

- **`init` no longer writes without being asked.** It prints what it would create and where the project
  stands; `--apply` is the consent. Even with `--apply` it only ever creates — nothing existing is
  edited, overwritten or appended to. Before this, `init` wrote four files into a project that had not
  asked for them.
- A page fail is now measured twice before it is allowed to stand. If the second read disagrees, the
  verdict becomes `unmeasurable` rather than `fail` — the tool says it could not tell, instead of
  guessing.

### Added

- `uxcli dashboard` — a local viewer for every run on this machine. `~/.uxcli/index.json` holds
  pointers only; the evidence stays in the project that produced it. Bound to 127.0.0.1, and it opens
  no directory that is not in the index.
- Every probe writes its own `what` / `where` / `check` through `explain()`, so a fail says where to
  look without a reader knowing which probe produced it.

## [0.5.3] - 2026-09-08

### Added

- `text-overlap` — the first page probe with `opinion` provenance: visible text painted over visible
  text while the page is at rest. Opinion provenance and an unproven method together mean it may only
  report `finding`, never `fail`.
- `run <url>` prints one status line on stderr while it works, when stderr is a terminal.

### Fixed

- The flow issue form could not be parsed by GitHub — an unquoted colon in a field description.

## [0.5.2] - 2026-09-07

### Fixed

- The card footer named screenshot paths on runs that had written no screenshots.

## [0.5.1] - 2026-09-07

### Added

- `run.json` is written into every run directory, so a run can be read back without re-running it.
- Two issue forms: one for a verdict that is wrong or missing, one for contributing a flow to the
  unseen list used for method validation.

### Changed

- `--refute` announces the command it will run, how many calls it will make and what they will cost,
  on stderr, before it spawns anything. The same three facts appear on the card.

## [0.5.0] - 2026-09-07

### Added

- **`run <url> --prove`.** Each passing page probe plants its own defect, confirms by computed style
  that the defect reached the elements it measured, and re-measures. A pass then carries *would fail
  on …*, or a warning that the probe could not be made to fail — which is a pass worth less. `gate`
  requires a would-fail on every must-pass twin.
- `3.3.1 error-identification`, sharing its planted error with `3.3.4` so one submission answers both.
- Skills `journey` and `before-done`, copied by `init`. `gate` checks the load-bearing paragraph of
  each skill by hash, so a skill cannot be quietly edited out from under the tool.

### Changed

- Native constraint validation counts as an error message only where the form actually enforces it. A
  `novalidate` form populates `validationMessage` and never shows it to anyone.

### Fixed

- `discover`: crawl URLs are normalised, invisible inputs are skipped, and a form yields one proposal
  rather than several.

## [0.4.0] - 2026-09-07

### Added

- **`uxcli sheet`** — checks the project's own contrast commitments, read from
  `uxcli.commitments.json`, against the tokens as the browser resolves them. Provenance `project`: the
  rule came from the project, not from a spec. It has its own falsification pair in `gate`.
- `uxcli diff a b [--gate]` — compares two saved runs and can fail a build on what changed.
- `uxcli discover <repo|url>` — writes journey candidates as *proposals*. `run` refuses a proposal
  until a human fills in `confirmedBy`.

### Changed

- `sheet` resolves `var()` aliases to the value actually painted, and reports a token as
  theme-ambiguous rather than picking one theme silently.
- `skills/` now ships in the published package.

## [0.3.0] - 2026-09-07

### Changed

- **Every probe carries a method status, and a probe whose method is unproven may not say `fail` — it
  reports `finding`.** Upgrading from 0.2.x: the three flow probes stop failing builds and start
  reporting findings, and the exit code changes with them. The original verdict is kept on the packet
  as `rawVerdict`, so nothing is lost — only downgraded until the method earns it.
- `focus-visible` was rewritten as a pixel measurement — it compares what the page paints before and
  after focus, instead of reading the style rules that were supposed to cause it.

### Added

- Method validation records. `focus-visible` was run against a fourth unseen list: 62 fails, no false
  fails. `text-spacing` and `contrast` were validated on 40 unseen pages, no false fails. Those three
  are `method-validated`; everything else is not.
- `3.2.3 consistent-navigation` reads footer and header link groups, not just the primary nav.
- The card names the design token behind a failing colour pair, so the fix has an address.

### Fixed

- `focus-visible`: a screenshot timeout marks one control as not measured instead of failing the whole
  probe; animations are allowed to finish before the focus box is read; focus arrives by a real Tab
  press rather than a scripted `.focus()`.

## [0.2.1] - 2026-09-06

### Fixed

- `contrast` failed on any page with a Content-Security-Policy, because axe-core could not be injected.

## [0.2.0] - 2026-09-06

### Added

- **`uxcli run <url>`** — probes a single screen with no journey file: focus-visible, text-spacing and
  contrast.

### Changed

- The card and the exit code say why a run could not be carried out, rather than reporting the absence
  of a defect as a pass.

## [0.1.1] - 2026-09-06

First published release.

### Added

- `uxcli run <journey.json>`, `uxcli gate`, `uxcli why` — three flow probes driving real Chrome, each
  with a falsification pair the gate runs on every invocation: a page that must fail and a page that
  must pass. A probe that cannot fail on demand is not trusted to pass.
- `run --refute` — a second reader that never saw the probe code is given the proof images and asked,
  per criterion, whether they support the fail. It may dispute a fail; it cannot create one.
- Evidence screenshots for fails, with the cited elements outlined, and their paths on the card.
  `--out` chooses where they land.
- Published to npm through GitHub Actions trusted publishing, no long-lived token.

### Changed

- The package is `@junixlabs/uxcli`. npm rejected the unscoped name as too similar to an existing
  `ux-cli`, so `0.1.0` was prepared but never published — `0.1.1` is the first version on the registry.

[Unreleased]: https://github.com/junixlabs/uxcli/compare/v0.7.0...HEAD
[0.7.0]: https://github.com/junixlabs/uxcli/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/junixlabs/uxcli/compare/v0.5.3...v0.6.0
[0.5.3]: https://github.com/junixlabs/uxcli/compare/v0.5.2...v0.5.3
[0.5.2]: https://github.com/junixlabs/uxcli/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/junixlabs/uxcli/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/junixlabs/uxcli/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/junixlabs/uxcli/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/junixlabs/uxcli/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/junixlabs/uxcli/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/junixlabs/uxcli/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/junixlabs/uxcli/releases/tag/v0.1.1

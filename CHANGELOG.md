# Changelog

All notable changes to `@junixlabs/uxcli`. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Entries are written per release. The log is the source material, not the text.

## [Unreleased]

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

[Unreleased]: https://github.com/junixlabs/uxcli/compare/v0.6.0...HEAD
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

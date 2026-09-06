# Roadmap

Phases end when their exit criteria pass. No dates. Order reflects what the evidence so far supports, not the original plan: flow probes came first because they are the part no other tool has.

## Done

- **Prove.** Frozen, hashed definitions run on unseen pages and a seeded flow fixture; agents tested against the verdict format. Records live in the working notes; the README carries no evidence table until each row can name its runner and whether the definitions were frozen before or revised after the pages were seen.
- **Flow, first cut.** `run <journey>` with three probes (WCAG 3.3.4, 3.3.7, 3.2.3), process segments with a human `sameProcess` override, the verdict card, `--json`, `--refute`, and `gate` with a falsification pair per probe.

## Next

### Instrument
Single-screen probes into the package with the same contract as the flow probes: spec, code, hashed must-fail and must-pass fixtures.
- `run <url>` with focus-visible and text-spacing (validated in Prove), contrast delegated to axe-core.
- Third-party subtrees excluded with a coverage test; quiesce detection for pages that never settle; `blocked` for bot challenges and error pages.
- Exit: `gate` covers every probe; 20 unseen pages, 0 false fails, re-run with the packaged code.

### Flow, second cut
- Recall measured on defects seeded into real pages by someone who does not tune the probes; precision on 20 flows the probes have never seen.
- Runner gaps recorded in Prove: change controls matched by observed URLs; same-URL wizards; disabled submit as a checking mechanism; forced clicks for overlay widgets; unlandmarked navigation as a lower-provenance fallback.
- One more flow probe only if it has a falsification pair on day one (candidate: 2.2.1 timing).
- Exit: three numbers published separately: precision, recall, no-verdict rate.

### Commit
The project's own commitments become thresholds.
- `principles`: a skill that helps a human write what the product commits to, with trade-offs; each project-tier rule cites one statement or is `suppressed`.
- Journey authoring: the agent may draft, a human commits, the file is versioned before the build.
- `diff a b --gate`: drift between two builds against the committed thresholds; only `fail` blocks a merge.
- Exit: one real project runs `diff --gate` in CI on its own commitments.

### Release
- Done: on npm as `@junixlabs/uxcli`; CI runs `gate` on every push; `publish.yml` publishes tags `v*` through npm trusted publishing, with provenance.
- CI action running `run` against a live fixture; the planted-verdict test repeated on a second model.
- Exit: a stranger installs it and gets a first verdict in ten minutes without reading the source.

## Not planned
Scores. Summaries. Conformance claims. Design critique. An MCP tool schema for the common path.

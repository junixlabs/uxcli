# Roadmap

Phases end when their exit criteria pass. No dates. Order reflects what the evidence so far supports, not the original plan: flow probes came first because they are the part no other tool has; the single-screen probes moved ahead of the second flow cut after the first real-project run, where the flow probes were mostly not applicable and the single-screen probes found the defects.

## Done

- **Prove.** Frozen, hashed definitions run on unseen pages and a seeded flow fixture; agents tested against the verdict format. Records live in the working notes; the README carries no evidence table until each row can name its runner and whether the definitions were frozen before or revised after the pages were seen.
- **Instrument.** `run <url>` with three single-screen probes (2.4.7 pixels by a real Tab press, 1.4.12 by ACT rules, 1.4.3 by a pinned axe-core), every twin reaching `pass`, method status per probe, all three `method-validated` on unseen pages (details below).
- **Flow, first cut.** `run <journey>` with three probes (WCAG 3.3.4, 3.3.7, 3.2.3), process segments with a human `sameProcess` override, the verdict card, `--json`, `--refute`, and `gate` with a falsification pair per probe.

## Next


### Flow, second cut
- Done in part: recall on defects seeded blind by two independent agents (a multi-page checkout, 12 mutants; a same-URL wizard, 8 mutants): every in-scope defect caught after two recorded revisions, 0 false fails, no-verdict counted separately; the key for one wizard mutant is contested and recorded as such. Still open: precision on 20 flows the probes have never seen.
- Done: same-URL wizards (journey `expect`, or the submitted form gone / heading changed); navigation built from buttons and roles; footer and header landmarks as mechanisms; login identity on a password step as the security exception; `back` only as a whole label; reformatted values as a finding. Still open: change controls matched by observed URLs; disabled submit as a checking mechanism; forced clicks for overlay widgets; unlandmarked menus as a lower-provenance fallback.
- Done 2026-09-07: **3.3.1 error identification** shipped with its pair on day one (must-fail: silent rejection; must-pass: message tied by `aria-describedby` and `aria-invalid`), `method-unproven`. Candidate changed from 2.2.1 timing because every page with a form needs it, and the first outside run (a landing page with one form) had nothing else to measure. It plants one error (a required field left empty, submit) so it runs only where the journey opts in, never on a bare URL; `method-unproven` at birth.
- Exit: three numbers published separately: precision, recall, no-verdict rate.

### Skills
The instrument is used by an agent; the skills are how the agent is told to use it. A skill is a set of obligations on a fresh agent, and it is correct only when its transcript shows the obligations met and its mutant shows them broken.
- `principles` shipped in 0.4.0 without a twin; it gets one here.
- `journey`: from `discover` output to `*.proposed.json` with the questions only the owner can answer (which step commits, `expect` on a same-URL step, values, a test endpoint). Must not set `confirmedBy`, must not place the file among the project's journeys, must not fill hidden or invisible inputs.
- `before-done`: what an agent must do before it may say the UI work is finished: run `uxcli run` on the screens it touched and the journeys it affected, fix or report every `fail`, call a `finding` unverified rather than a pass, say "done" only at exit 0. Named after its trigger, not after a verdict it does not give.
- Done 2026-09-07: `journey`, `before-done` written and tested on 95 fresh sessions with four arms (intact, one paragraph removed, every statement removed, no skill). No paragraph-level twin ever broke; the absence of the skill did: without `principles` 5/5 agents wrote the commitments file themselves; without `journey` 2/5 put the proposal in the confirmed directory; without `before-done` and with no mention of uxcli 4/10 never ran the instrument. Records in `skills/pair.json`.
- Learned: the card already carries "a finding is not a pass" and "a fail blocks done" (0 of 45 sessions with the instrument running said otherwise, skill or not). A skill earns its place only for what the instrument cannot say by itself: start me, and keep the proposal out of the confirmed directory.
- Exit met 2026-09-07 with the twin redefined as the absence of the skill (the paragraph twins measured redundancy, recorded as such). VISION "Shape" names two skills; a third is the owner's change to make.

### Falsify on the target
A falsification pair proves a probe can fail on a fixture. Nothing proves it can fail on this project. An all-green run must be able to show its counterfactual.
- Done 2026-09-07 for the three page probes: `run <url> --prove`, reached decided by computed style before the re-measure, gate requires `would fail` on every must-pass twin; the first real page gave `would fail` on focus-visible. Flow probes not yet (they need the overlay mechanism, not a live-page mutation).
- `run --prove`: for each probe that passed, plant one defect that reaches the very controls it measured (a focus rule that changes their computed style, a colour override on the cited text group, a locked `letter-spacing`; for a journey, a dropped review value or a reordered navigation item), re-measure the same controls, print `pass · would fail on <mutation>` or `pass · could not be made to fail`, which is a warning.
- Definition first: what "the mutation reaches the measured element" means is written and committed before any code.
- Exit: on the twins and on one real project every pass carries its counterfactual line.

### Commit
The project's own commitments become thresholds.
- Done: `uxcli.commitments.json` with owner and source per entry; `sheet` measures `contrast` commitments on declared tokens (aliases resolved, theme-ambiguous tokens `unmeasurable`); falsification pair in the gate.
- Done: `principles`, a skill that drafts the file as a proposal with trade-offs; the human fills owner and source and commits it. The agent may propose, it may not commit.
- Done: `discover <repo|url>` writes journey candidates as proposals; `run` refuses a proposal until a human sets `confirmedBy`.
- Done: `diff a b --gate` over two saved runs; only `fail` blocks.
- Journey authoring beyond proposals: the `journey` skill (see Skills).
- `init`: copy the shipped skills into the project's `.claude/skills/`, create `.uxcli/`, print the CI step. Nothing else: no commitments file, no journey, no edits to existing files.
- Exit: one real project runs `sheet` or `diff --gate` in CI on its own commitments. Not yet: the first project's commitments file has to be written by its owner.

### Release
- Done: on npm as `@junixlabs/uxcli`; CI runs `gate` on every push; `publish.yml` publishes tags `v*` through npm trusted publishing, with provenance.
- Done: 0.3.0 = Instrument exit (three page probes `method-validated`); 0.4.0 = Commit tooling (`sheet`, `diff --gate`, `discover`, `principles`). The Commit exit itself is still open above.
- Done: 0.5.0 = the `journey` and `before-done` skills with their records, `init`, flow probe 3.3.1 with its pair, `run --prove` for the page probes, the `discover` dedup fix.
- 0.6.0 when the flow probes flip to `method-validated` (20 unseen flows, the Gate 0 ruling); 0.5.x for the Commit exit and `--prove` on flow probes.
- CI action running `run` against a live fixture; the planted-verdict test repeated on a second model.
- Exit: a stranger installs it and gets a first verdict in ten minutes without reading the source.

## Instrument, record
Single-screen probes into the package with the same contract as the flow probes: spec, code, hashed must-fail and must-pass fixtures.
- Done: `run <url>` with focus-visible (2.4.7) and text-spacing (1.4.12, ACT 24afc2/9e45ec/78fd32), both carried from Prove with recorded revisions, and contrast (1.4.3) delegated to a pinned axe-core; `--state` for signed-in pages; third-party subtrees excluded; bot challenges and load errors reported as `unmeasurable` with the reason.
- Done: `gate` covers every probe; the must-pass twin of each page probe has to reach `pass`, never `not-applicable`; non-pass card lines carry the reason.
- Done: every twin, flow and page, must reach `pass`; method status per probe (`method-validated` needs a recorded unseen run with the packaged code, 0 false fails, and a recall record); unproven probes report `finding`.
- Done: focus-visible measures rendered pixels per control after one real Tab press; what a crop cannot show (off-viewport, covered, self-changing, ring drawn elsewhere) is reported per control as not measured, never as fail. Each false-fail class found on unseen pages is a recorded revision in the spec.
- Exit met 2026-09-06: 20 pages the probes had never seen (Tranco order, list hashed, definitions committed at `8dde0e1` before the draw), re-run with the packaged code: focus-visible 62 failing controls on 7 pages, 58 re-measured by a real Tab press and a whole-viewport diff, 4 by the viewport diff alone (the check could not land Tab on them), 0 false fails; text-spacing and contrast 0 false fails over 80 unseen pages. It took four lists: the first three each found a false-fail class the probe's own measurement could not see (eight recorded revisions, v3.1 to v3.8). All three page probes are `method-validated`.

## Not planned
Scores. Summaries. Conformance claims. Design critique. An MCP tool schema for the common path.

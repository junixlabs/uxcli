# UXCLI

`uxcli` measures a running UI against its design commitments. Built for AI coding agents that need to verify the frontend they just wrote.

**Status:** early. Four flow probes (WCAG 3.3.4, 3.3.1, 3.3.7, 3.2.3), three single-screen probes (2.4.7, 1.4.12, 1.4.3), a gate that proves each probe fails on a seeded fixture and passes on its clean twin, a verdict card, and a second reader. The three single-screen probes are `method-validated` (focus-visible: 20 unseen pages after eight recorded revisions; text-spacing and contrast: 80 unseen pages; 0 false fails each). The three flow probes are `method-unproven` and report `finding` instead of `fail` until their unseen-flow run is recorded. On npm as `@junixlabs/uxcli`; the command is `uxcli`.

**Core rule: no commitment, no verdict.** Every finding cites the commitment it enforces: W3C's, yours, or none. Where no one has committed, `uxcli` says nothing.

## Why

- Automated accessibility tools check one page at a time. Defects that span screens (data entered on step 1 missing from the review on step 3, navigation order changing between pages) have no automated check today.
- Agents cannot see what they render. The common failure is not blindness but false confirmation: given a screenshot of a broken UI, the agent reports success.
- Existing UI review tools produce false positives, and one false positive is enough for a developer to disable the tool.

## Install and use

Node 20+.

```
npm install -g @junixlabs/uxcli
npx playwright-core install chromium-headless-shell   # once; or set UXCLI_CHROME to a Chromium binary
uxcli run journey.json                                # verdict card for a flow
uxcli run journey.json --json                         # full evidence packet
uxcli run https://example.org/login                   # verdict card for one screen; --state=FILE for a signed-in page (Playwright storageState)
uxcli run https://example.org/ --src=./web/src         # name the design token behind each failing colour pair
uxcli run journey.json --refute                       # a fresh second reader checks each fail from the screenshots (needs the claude CLI, or set UXCLI_REFUTER)
uxcli gate                                            # every probe must fail on its seeded fixture and stay silent on the clean twin
uxcli why 3.3.7                                       # the probe's definition (also why 2.4.7, why contrast)
```

`npx @junixlabs/uxcli <command>` works without the global install. To hack on it: `git clone https://github.com/junixlabs/uxcli && cd uxcli && npm install`, then `node bin/uxcli.js` in place of `uxcli`. An example journey is in `examples/sylius-guest-checkout.json`.

A journey is the commitment: the steps of one process, which step commits, and what the human declares (`sameProcess`, `checkedPass`, `reversible`). See `test/journeys/checkout.json`. Selectors are Playwright locator strings. Omit `url` for a page reached by the previous step's submit. A wizard step that keeps the URL may declare `expect`, a selector that is visible once the step has advanced. A step whose `url` differs from the page the previous step left is opened directly and starts a new process segment.

## How it works

The one input the machine cannot derive, the journey, is written by a human. Everything else is measured. The agent may propose a commitment; it may not commit it.

| Available | Planned |
|---|---|
| `run <journey>` measure a flow; card by default, `--json`, `--refute`, `--var=k=v` | flow probes `method-validated` on 20 unseen flows |
| `run <url>` measure one screen: focus-visible, text-spacing, contrast (axe-core, pinned); `--state`, `--src`, `--out`, `--refute`; `--prove` plants each passing probe's own defect and re-measures, so a pass reads `would fail on …` or warns that it could not be made to fail | one more flow probe, only with a falsification pair on day one |
| `sheet [--src=DIR]` the project's own commitments on its design tokens (`uxcli.commitments.json`), no browser | |
| `diff a.json b.json [--gate]` drift between two saved runs: same, regressed, improved, new, gone | |
| `discover <repo\|url> [--out=DIR]` journey candidates as proposals (Next.js routes and forms, or a same-origin crawl); `run` refuses a proposal until a human sets `confirmedBy` | |
| `principles` skill drafts `uxcli.commitments.proposed.json` with trade-offs; a human fills owner and source | |
| `journey` skill turns `discover` output into `<name>.proposed.json` plus the questions only the owner can answer; never sets `confirmedBy` | |
| `before-done` skill: what an agent does before saying UI work is finished: run, act on every fail, say done only at exit 0 | |
| `init [dir]` copy the shipped skills into `.claude/skills/`, create `.uxcli/`, print the CI step; writes nothing else | |
| `gate` run every probe's falsification pair | |
| `why <rule>` the probe's definition | |

Every probe ships with a pair of fixtures: one where it must fail, one where it must reach `pass` through its satisfied branch. Silence (`not-applicable`) on the clean twin does not count. A probe without that pair cannot say `fail`. `gate` enforces it. Exit codes: 0 no fail, 2 at least one fail, 1 the run could not be carried out.

## Commitments

`uxcli.commitments.json` in the project root is where the project commits to its own thresholds. Each entry carries `id`, `kind`, `why`, an `owner` and a `source` (the statement it cites); an entry without owner and source is `not-committed`, an entry with `"suppressed": "<reason>"` is reported as `suppressed`, never silently skipped. Today one kind is measured: `contrast`, two token names and a minimum ratio, read from the declared token values by `uxcli sheet --src=DIR`. A token that a theme block or an alias points at two colours is `unmeasurable`; commit the base token. Provenance of these verdicts is `project`; `fail` exits 2.

Three skills ship in `skills/` and `uxcli init` copies them into a project's `.claude/skills/`. Each was tested on fresh agent sessions against the same task without the skill, and `skills/pair.json` records what the skill changed: `principles` keeps the agent from writing the commitments file itself (5 of 5 did without it); `journey` keeps the proposal out of the confirmed directory (2 of 5 put it there without it); `before-done` makes the agent run the instrument before saying done (4 of 10 never ran it without the skill and no mention of uxcli). What the skills do not add, the card already does: in 45 sessions no agent, with or without a skill, said done with a FAIL in hand or called a FINDING a pass. The gate checks each skill's frontmatter and its named paragraph by hash; it does not re-run the sessions.

The `principles` skill (`skills/principles/SKILL.md`) helps an agent draft the file as `uxcli.commitments.proposed.json` with the trade-offs; a human fills owner and source and renames it. The agent may propose, it may not commit.

`uxcli discover <repo|url>` writes journey candidates with `provenance: proposal` and `confirmedBy: null`; `run` refuses them until a human confirms. The same rule as the commitments file: the agent proposes, the human commits.

`uxcli diff a.json b.json --gate` compares two saved runs of `run` or `sheet` and exits 2 when the newer one carries a `fail`.

What comes next, and in what order, is in [ROADMAP.md](ROADMAP.md).

## Rules of output

- Every finding carries a provenance: `spec`, `project`, or `opinion`.
- A pass is only as good as its counterfactual. `run <url> --prove` plants, for each probe that passed, the defect that probe exists to catch (focus styles made equal to the unfocused ones, text blended into its background, a spacing lock below the minimum), checks by computed style that the defect reached the very elements the probe measured, re-measures, and prints `would fail on …` on the pass line, or `could not be made to fail: …` as a warning. The gate requires `would fail` on every page probe's must-pass twin.
- Every probe carries a method status: `method-validated` or `method-unproven`. Validated means a recorded run with the packaged code on at least 20 pages or flows the probe had not seen when its definition was last revised, 0 false fails, plus a recall record (ACT cases or seeded defects). Unproven probes report `finding`, never `fail`. `uxcli why <rule>` prints the status and its record.
- Nine verdicts: `pass`, `fail`, `finding`, `not-applicable`, `not-committed`, `unmeasurable`, `suppressed`, `stale`, `untested`. Only `fail` blocks a merge.
- `finding` is also used for what a probe saw but does not assert under its rule: a value shown in another format (3.3.4), text that clips under user spacing (1.4.12), a control in the tab order that is never painted (2.4.7, `hidden-focusable`). Findings never change the exit code.
- What the exit code means today: a validated probe's `fail` exits 2 (focus-visible, text-spacing, contrast, so a control with no focus ring or a project's low-contrast token pairs block); an unproven probe's would-be fail prints `FINDING`, keeps `rawVerdict: fail` in `--json`, and exits 0. `uxcli why <rule>` prints each probe's status and what its validation still needs.
- No threshold set means `not-committed`, not `fail`.
- Cannot measure means `unmeasurable`, never `pass`.
- Every exception ships with a coverage test.
- No score, no summary line, no conformance claim.

## Non-goals

Conformance certification. Visual regression. Scores. Design critique.

## License

MIT. See [LICENSE](LICENSE).

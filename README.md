<h1 align="center">UXCLI</h1>

<p align="center"><strong>Design should be executable.</strong></p>

<p align="center">
  The agent that wrote the UI does not get to decide whether the UI is finished.<br>
  <code>uxcli</code> drives a real browser and returns that decision as an exit code.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@junixlabs/uxcli"><img alt="npm" src="https://img.shields.io/npm/v/@junixlabs/uxcli?color=5fd38a&label=npm"></a>
  <a href="#install"><img alt="node" src="https://img.shields.io/node/v/@junixlabs/uxcli?color=8f8d86"></a>
  <a href="LICENSE"><img alt="license" src="https://img.shields.io/npm/l/@junixlabs/uxcli?color=8f8d86"></a>
</p>

<p align="center">
  <img src="docs/uxcli-run.svg" alt="uxcli run against a login screen: focus-visible FAILs, contrast and text-overlap PASS, and each pass carries the defect that would have failed it" width="100%">
</p>

<p align="center"><sub>A real run against the fixture in <code>src/probes/focus-visible/must-fail/</code>. Regenerate with <code>npm run clip</code>.</sub></p>

---

## The agent is not lying. It was never told.

Ask a coding agent to predict where it is about to put things and it is good at it: 9 of 9 on
ordering, 3 of 3 on a "10 px from the top" offset, 0.0 px on an edge alignment.

Once it predicted the button would land at `y=362`. The browser put it at `432`.

**It never found out. It said done.**

The gap is not imagination — the agent has an intention and is usually right about it. Nothing ever
measured the result against it.

|  | Returns | Who decides |
|---|---|---|
| linters, audits, scanners | a report | the agent reads it and interprets |
| snapshot and visual diffing | a difference | different is not wrong |
| handing the model a screenshot | an image | the agent grades its own work |
| **`uxcli`** | **an exit code** | **someone who is not the agent** |

A report is something an agent can talk itself past. `2` is not.

## Install

Node 20+. `npx @junixlabs/uxcli <command>` works without installing.

```bash
npm install -g @junixlabs/uxcli
npx playwright-core install chromium-headless-shell   # once, or set UXCLI_CHROME

uxcli run https://example.org/login --prove
#  0  no fail (findings included)   2  at least one fail   1  could not run
```

The value scales with how much UI your agent produces that nobody looks at. If you open every screen
yourself, your eyes are better than this tool.

## Why the verdict can be trusted

A review tool that lies three times is disabled forever. Five rules keep `2` right.

- **No commitment, no verdict.** A commitment is a threshold with a named owner and a written source.
  W3C is a named owner, so WCAG runs by default; nobody signed taste, so taste never runs.
- **A probe that cannot be made to fail on demand may not say `fail`.** Every probe ships a fixture
  where it must fail and a clean twin where it must reach `pass` through its satisfied branch.
  Silence on the twin does not count. `uxcli gate` enforces it on every push.
- **A fail is read twice.** A page still moving gives a verdict that is a coin flip, so every fail is
  re-measured after 700 ms and stands only if the second read names the same elements — otherwise
  `unmeasurable`. Finite animations are finished first; infinite ones have no resting state to reach.
- **`--prove` makes each pass earn it.** It plants the exact defect the probe exists to catch,
  confirms by computed style that it reached the measured elements, and re-measures.
- **An unvalidated method may not block a merge.** Validation is a recorded run on ≥20 unseen pages
  or flows with 0 false fails. Until then the probe reports `finding` and cannot change the exit code.

| Scope | Probe | Criterion | Provenance | Method |
|---|---|---|---|---|
| screen | `focus-visible` | WCAG 2.4.7 | spec | ✅ 20 unseen pages, 0 false fails |
| screen | `contrast` | WCAG 1.4.3 | spec | ✅ 80 unseen pages, 0 false fails |
| screen | `text-spacing` | WCAG 1.4.12 | spec | ✅ 80 unseen pages, 0 false fails |
| screen | `text-overlap` | text painted over text | **opinion** | ⏳ unproven → `finding` |
| flow | `error-prevention` | WCAG 3.3.4 | spec | ⏳ unproven → `finding` |
| flow | `error-identification` | WCAG 3.3.1 | spec | ⏳ unproven → `finding` |
| flow | `redundant-entry` | WCAG 3.3.7 | spec | ⏳ unproven → `finding` |
| flow | `consistent-navigation` | WCAG 3.2.3 | spec | ⏳ unproven → `finding` |

Flow probes reach what page-level tools cannot: data entered on step 1 missing from the review on
step 3, navigation order changing between pages.

Seven verdicts — `pass` · `fail` · `finding` · `not-applicable` · `not-committed` · `unmeasurable` ·
`suppressed` — and **only `fail` blocks a merge**. Where nobody committed, `not-committed`, never
`fail`. Where it could not measure, `unmeasurable`, never `pass`.

## Only a human commits

- **A journey** is the commitment for a flow: the steps of one process, which step commits, and what
  the human declares — `sameProcess`, `checkedPass`, `reversible` ([example](test/journeys/checkout.json)).
- **`uxcli.commitments.json`** holds a project's own thresholds, each with `id`, `kind`, `why`, an
  `owner` and a `source`. No owner and source means `not-committed`; `"suppressed": "<reason>"` is
  reported, never silently skipped.
- **The agent may propose, not commit.** `uxcli discover` writes candidates with `confirmedBy: null`,
  and `run` refuses them until a human confirms.

## For coding agents

`uxcli init` writes nothing. It prints what it would create and where the project stands — commitments
signed, journey run, anything measured. `--apply` is the consent, and even then it only ever creates:
nothing that exists is edited, overwritten or appended to.

```bash
uxcli init .            # the plan, and where this project stands
uxcli init . --apply    # create it
```

| Artefact | What it changes | Measured against fresh sessions |
|---|---|---|
| `before-done` skill | the agent measures before saying the UI is finished | 15 of 15 ran the instrument, none said done holding a `fail`; with no skill, 4 of 10 never ran it |
| `journey` skill | keeps a proposal out of the confirmed directory | with no skill, 2 of 5 placed a proposal as confirmed |
| `principles` skill | keeps the agent from writing the commitments file | with no skill, 5 of 5 wrote `uxcli.commitments.json` themselves |
| `.claude/rules/uxcli.md` | names the first command and the two things only a human signs | **nothing yet** — no arm has been run |

The three skills are **reactive**: an agent loads one when its own judgement matches the task to the
skill's description, so none is a beginning. The rule file is meant to be — four lines, because Claude
Code reads it at the start of every session, including those with nothing to do with the interface.

That it is read is documented. **That it changes what an agent does is not measured**, and its row
stays empty until it is. The other three come from [`skills/pair.json`](skills/pair.json), which also
records every paragraph-removal mutant; `gate` checks the load-bearing text by hash.

## Commands

```bash
uxcli run <url>                 # measure one screen      --prove --state=FILE --src=DIR
uxcli run <journey.json>        # measure one flow        --json --out=DIR --refute --var=k=v
uxcli discover <repo|url>       # journey candidates, as proposals
uxcli sheet [--src=DIR]         # the project's own token commitments, no browser
uxcli diff <a.json> <b.json>    # drift between two runs   --gate exits 2 on a new fail
uxcli dashboard                 # one loopback viewer for every run on this machine
uxcli init [dir]                # where this project stands, and what would be created  --apply
uxcli gate                      # every falsification pair must hold
uxcli why <rule>                # a probe's definition: why · applies-when · correct-when
```

`--refute` spawns a fresh second reader per fail (`claude -p`, haiku, Read-only, ~US$0.04) to dispute
it from the screenshots alone, announcing command, count and cost on stderr first.

`dashboard` reads pointers from `~/.uxcli/index.json`; evidence never leaves the project that produced
it. Delete the index and you lose the list, never a packet.

## When it is wrong, say so

Every run leaves `run.json` and its screenshots in `.uxcli/<host or journey>/`. That packet is the
whole argument — "it looks fine" is not evidence; a screenshot of the same state is. Two forms at
[issues/new/choose](https://github.com/junixlabs/uxcli/issues/new/choose): a wrong verdict or a miss,
and an offer of a flow for the unseen list. Twenty confirmed journeys with 0 false fails flip a flow
probe from `finding` to `fail`, and it is the only way they flip.

A report is re-measured, not re-read. A confirmed false fail becomes a must-pass case and a spec
revision; a confirmed miss becomes a must-fail case. The outcome is written back on the issue.

## Non-goals

Conformance certification · visual regression · scores · design critique.

Where it is going: [ROADMAP.md](ROADMAP.md). The reasoning behind the rules: [VISION.md](VISION.md).
MIT — see [LICENSE](LICENSE).

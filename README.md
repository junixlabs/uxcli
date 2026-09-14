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

<p align="center"><sub>A real run against the fixture shipped in <code>src/probes/focus-visible/must-fail/</code>. Regenerate with <code>npm run clip</code>.</sub></p>

---

## The agent is not lying. It was never told.

Ask a coding agent to predict, before rendering, exactly where it is about to put things — and it is
good at it. Across nine trials it put the announcement bar above the nav 9 times out of 9, honoured
"10 px from the top, not flush" 3 out of 3, and aligned a button's right edge to a nav link's right
edge to 0.0 px, 3 out of 3. Almost every pixel it predicted was the pixel the browser produced, at
1280 px wide and at 390.

Once, it predicted the button would land at `y=362`. The browser put it at `432`.

**It never found out.** It said done.

That is the gap. Not imagination — the agent has an intention and is usually right about it. What is
missing is any signal that the intention was not met. An agent whose confidence is calibrated to its
own plan, and never to the result, is the one you cannot leave running.

## A decision, not a report

|  | Returns | Who decides |
|---|---|---|
| linters, audits, scanners | a report | the agent reads it and interprets |
| snapshot and visual diffing | a difference | different is not wrong; a human still rules |
| handing the model a screenshot | an image | the agent grades its own work |
| **`uxcli`** | **an exit code** | **someone who is not the agent** |

A report is something an agent can talk itself past. `2` is not.

## Install

Node 20+.

```bash
npm install -g @junixlabs/uxcli
npx playwright-core install chromium-headless-shell   # once, or set UXCLI_CHROME

uxcli run https://example.org/login --prove
#  exit 0  no fail (findings included)
#  exit 2  at least one fail
#  exit 1  the run could not be carried out
```

`npx @junixlabs/uxcli <command>` works without installing.

## Who it is for

The value scales with **how much UI your agent produces that nobody looks at.**

- Platform teams whose agents generate UI for end users, where no human opens every page.
- Anyone running agents in a loop, overnight, or in CI — where the bottleneck is review bandwidth, not the agent.
- Teams where the agent writes the feature and a person reviews the PR, currently doubling as the first line of defence for "does this actually work".

If you open every screen yourself, your eyes are better than this tool and you should keep using them.

## Why the verdict can be trusted

Everything in this section exists for one reason: so that `2` is right. A review tool that lies three
times is disabled forever.

**No commitment, no verdict.** A commitment is a threshold with a named owner and a written source.
W3C is a named owner, so WCAG runs by default. Nobody signed taste, so taste never runs. A button
70 px from where the agent expected it is not a defect, and the instrument stays silent unless
something with an owner says otherwise.

**A probe that cannot be made to fail on demand may not say `fail`.** Every probe ships a
falsification pair — a fixture where it must fail, a clean twin where it must reach `pass` through its
satisfied branch. Silence on the clean twin does not count. `uxcli gate` enforces it on every push.

**A fail is read twice before it stands.** A page still moving when it is read gives a verdict that is
a coin flip between runs. Every fail is re-measured after 700 ms and stands only if the second read
names the same elements; otherwise the verdict is `unmeasurable`. Finite animations are finished
before measuring; infinite ones are left alone, having no resting state to finish to.

**`--prove` makes each pass earn it.** For every probe that passed, it plants the exact defect that
probe exists to catch, confirms by computed style that the defect reached the measured elements, then
re-measures. Each pass then reads `would fail on …`, or warns that it could not be made to fail.

**A probe may not block a merge until its method is validated** — a recorded run with the packaged
code on ≥20 pages or flows it had not seen, with 0 false fails. Until then it reports `finding` and
cannot change the exit code.

| Scope | Probe | Criterion | Provenance | Method |
|---|---|---|---|---|
| screen | `focus-visible` | WCAG 2.4.7 | spec | ✅ 20 unseen pages, 0 false fails |
| screen | `contrast` | WCAG 1.4.3 | spec | ✅ 80 unseen pages, 0 false fails |
| screen | `text-spacing` | WCAG 1.4.12 | spec | ✅ 80 unseen pages, 0 false fails |
| screen | `text-overlap` | — text painted over text | **opinion** | ⏳ unproven → `finding` |
| flow | `error-prevention` | WCAG 3.3.4 | spec | ⏳ unproven → `finding` |
| flow | `error-identification` | WCAG 3.3.1 | spec | ⏳ unproven → `finding` |
| flow | `redundant-entry` | WCAG 3.3.7 | spec | ⏳ unproven → `finding` |
| flow | `consistent-navigation` | WCAG 3.2.3 | spec | ⏳ unproven → `finding` |

Flow probes reach what page-level tools cannot: data entered on step 1 missing from the review on
step 3, navigation order changing between pages.

Seven verdicts, and **only `fail` blocks a merge**: `pass` · `fail` · `finding` · `not-applicable` ·
`not-committed` · `unmeasurable` · `suppressed`. Where nobody committed, `not-committed`, never
`fail`. Where it could not measure, `unmeasurable`, never `pass`.

## Only a human commits

**A journey** is the commitment for a flow: the steps of one process, which step commits, and what the
human declares — `sameProcess`, `checkedPass`, `reversible` ([example](test/journeys/checkout.json)).

**`uxcli.commitments.json`** is where a project commits to its own thresholds, each entry carrying
`id`, `kind`, `why`, an `owner` and a `source`. No owner and source means `not-committed`, and
`"suppressed": "<reason>"` is reported rather than silently skipped.

**The agent may propose. It may not commit.** `uxcli discover` writes journey candidates with
`provenance: proposal` and `confirmedBy: null`, and `run` refuses them until a human confirms.

## For coding agents

`uxcli init` prints what it would put in a project and where that project stands — whether the
commitments are signed, whether a journey has run, whether anything has been measured. **It writes
nothing.** `uxcli init --apply` is the consent, and even then it only ever creates: no file that
exists is edited, overwritten or appended to. A shipped file the project has since changed is
reported as `stale`, not replaced.

```bash
uxcli init .            # the plan, and where this project stands
uxcli init . --apply    # create it
```

What `--apply` creates, and what each part is known to do:

| Artefact | What it changes | Measured against fresh sessions |
|---|---|---|
| `before-done` skill | the agent measures before it says the UI is finished | 15 of 15 ran the instrument, none said done holding a `fail`; with no skill, 4 of 10 never ran it |
| `journey` skill | keeps a proposal out of the confirmed directory | with no skill, 2 of 5 placed a proposal as confirmed |
| `principles` skill | keeps the agent from writing the commitments file | with no skill, 5 of 5 wrote `uxcli.commitments.json` themselves |
| `.claude/rules/uxcli.md` | names the first command and the two things only a human signs | **nothing yet** — no arm has been run |

The three skills are **reactive**: an agent loads one when its own judgement matches the task to the
skill's description, so none of them is a beginning. The rule file is meant to be the beginning —
four lines, because Claude Code reads it at the start of every session in the project, including
every session that has nothing to do with the interface.

That it is read is documented. **That it changes what an agent does is not measured**, and the row
above stays empty until it is. The other three rows come from [`skills/pair.json`](skills/pair.json),
which also records each paragraph-removal mutant, and `gate` checks the load-bearing text by hash.
What the skills do not add, the card already does: across 45 sessions no arm called a `finding` a
pass.

## Commands

```bash
uxcli run <url>                 # measure one screen      --prove --state=FILE --src=DIR
uxcli run <journey.json>        # measure one flow        --json --out=DIR --refute --var=k=v
uxcli discover <repo|url>       # journey candidates, as proposals
uxcli sheet [--src=DIR]         # the project's own token commitments, no browser
uxcli diff <a.json> <b.json>    # drift between two saved runs   --gate exits 2 on a new fail
uxcli dashboard                 # one loopback viewer for every run on this machine
uxcli init [dir]                # where this project stands, and what would be created  --apply
uxcli gate                      # every falsification pair must hold
uxcli why <rule>                # a probe's full definition: why · applies-when · correct-when
```

`--refute` spawns a fresh second reader per fail (default `claude -p`, haiku, Read-only, ~US$0.04) to
dispute it from the screenshots alone. It announces command, count and cost on stderr first, and
nothing runs without the flag.

`dashboard` reads an index of pointers in `~/.uxcli/index.json`; the evidence itself never leaves the
project that produced it. Delete the index and you lose the list, never a packet.

## When it is wrong, say so

Every run leaves `run.json` and its screenshots in `.uxcli/<host or journey>/`. That packet is the
whole argument. Two forms at [issues/new/choose](https://github.com/junixlabs/uxcli/issues/new/choose):

- **A verdict is wrong, or something was missed** — attach the packet. "It looks fine" is not evidence; a screenshot of the same state is.
- **Offer a flow for the unseen list** — twenty confirmed journeys with 0 false fails flip a flow probe from `finding` to `fail`. It is the only way they flip.

A report is re-measured, not re-read. A confirmed false fail becomes a must-pass case and a spec
revision; a confirmed miss becomes a must-fail case. The outcome is written back on the issue.

## Non-goals

Conformance certification · visual regression · scores · design critique.

Where it is going, and in what order: [ROADMAP.md](ROADMAP.md). The reasoning behind the rules:
[VISION.md](VISION.md).

## License

MIT — see [LICENSE](LICENSE).

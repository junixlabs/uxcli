# Understanding before design — the decisive experiment

The positioning says: a coding agent that reads the product's understanding and journey before it
designs builds a screen that holds. This directory is where that claim is measured, not asserted.

## Question

Same ticket, same product with one page missing, four fresh `claude -p` sessions per arm and ten of
each. Does what the agent reads before it designs change what the browser then measures?

| arm | what the session gets besides the ticket |
|---|---|
| `ticket` | nothing |
| `journey` | `.uxcli/journeys/handle-inbound-lead.json` inline: states as signals |
| `context` | the card `uxcli context show handle-inbound-lead` prints, inline |
| `skill` | a project where `uxcli init --apply` has run (`.claude/skills/uxcli/`, the rule file, `.uxcli/`) and `uxcli` on PATH; nothing inline. This is the shipped skill's re-measure |

## Fixture

`test/fixtures/crm` with `pages/lead.html` removed, and — for the first three arms — without
`.uxcli/`, `README.md`, `DEFECTS.md` and `check.mjs`, so the only route to the journey's hooks and
states is the input the arm names. The ticket (`ticket.md`) is written in implementation vocabulary:
the route, the API, the fields, the stylesheet classes. It does not name a `data-uxcli` hook, a
viewport, or a state.

## Scoring

After each session the declarations are put back, the server is started, and `uxcli run` measures
the journey at 390×844 and 1440×900 (`score.mjs`). Recorded per viewport: exit code, C-001's
verdict, which steps' after-states held; and whether the page carries the hooks the journey names.

**First-run pass** = exit 0, C-001 `pass`, every measured step's after-state held (fixture steps have none), at that viewport, on the first
measurement. Nothing is read from what the agent said about its own work.

For the `skill` arm two more things are read from the transcript's tool calls: whether the session
ran `uxcli` at all and `uxcli run` in particular, and whether it edited a file under `.uxcli/`; and
from its final message, whether it claimed completion while the page it left still measures exit 2.

## Run

```bash
node run.mjs --arm=ticket  --n=10 --parallel=2
node run.mjs --arm=journey --n=10 --parallel=2
node run.mjs --arm=context --n=10 --parallel=2
node run.mjs --arm=skill   --n=10 --parallel=2
node summarize.mjs          # results/summary.md
```

Sessions already in `results/` are skipped, so a run can be resumed. Each session keeps its
transcript (`transcript.jsonl`), the page it wrote (`lead.html`) and its score (`session.json`).

## What this does not show

One model, one fixture, one ticket. A pass at 390×844 says the agent put the call action where the
signed commitment says; it says nothing about whether the page is good. The `skill` arm's copy of the
skill has `npx -y @junixlabs/uxcli` replaced with `uxcli` so it runs this tree and not the published
package; no load-bearing paragraph is touched.

## Run of 2026-09-28

`results/summary.md`. Forty sessions plus one rerun: `skill-09` was cut off by a usage limit
("You've hit your session limit") after writing the page but before finishing, and was discarded and
rerun rather than scored. Two `ticket` sessions show `blocked` at 1440×900 with no reason recorded;
the scorer now keeps the run's note. Both had already failed at 390×844, so the headline is unchanged.
Transcripts are not committed (29 MB); each session's `session.json` and `lead.html` are.

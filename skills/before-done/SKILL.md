---
name: before-done
description: What to do before saying that UI work is finished. Run uxcli on the screens touched and the journeys affected, act on every fail, and say done only at exit 0.
---

# before-done

You changed an interface. Before you say the work is finished, you measure it. The party that wrote the interface does not get to declare it correct; the instrument does. This skill is the sequence, and it ends with a word you may or may not say.

## Done means exit 0

`uxcli run` exits 0 when no probe reports `fail`, 2 when at least one does, 1 when it could not run. You say done only after a run you made yourself, on the final state of the files, exited 0. A `fail` blocks the word done until it is fixed and re-measured, or until the human has seen it and decided; in that case you report the fail, you do not report done. A `finding` is not a pass: it is a would-be fail from a probe whose method is not yet validated. Name it as a finding and say what it says; never fold it into "passes" or "no issues". `unmeasurable` and `not-applicable` are not passes either.

## How to work

1. List what you touched: the URLs of the screens whose markup or styles changed, and every confirmed journey (the project's journeys directory) whose steps go through those screens.
2. Run `uxcli run <url>` for each screen. If the project has `uxcli.commitments.json`, run `uxcli sheet --src=<source dir>` too. Run `uxcli run <journey>` for each affected journey.
3. Read each card. For a `fail`: fix the element the card cites, then run again. If the fix is not yours to make (a design token, a copy decision), stop and report the card verbatim. For a `finding`: report it as a finding with the probe's own words. For `unmeasurable`: say what the card says could not be measured; do not retry until it passes.
4. Report with the card, not a paraphrase: probe, verdict, `what`, `where`. Then the exit code of the last run.
5. Say done only if that exit code was 0, and say what was measured. If anything else, say what stands in the way.

## What you do not do

- Say done without a run in this session on the final files.
- Call a `finding`, `unmeasurable`, or `not-applicable` a pass.
- Edit the journey, the commitments file, or a probe to make a run pass. Those belong to the human.
- Skip a screen because "it looked right in the browser". The browser shows you one state; the probe presses Tab.

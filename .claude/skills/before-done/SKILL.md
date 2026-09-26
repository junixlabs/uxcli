---
name: before-done
description: What to do before saying that UI work is finished. Run uxcli on the screens touched and the journeys affected, act on every fail, and say done only at exit 0.
---

# before-done

You changed an interface. Before you say the work is finished, you measure it. The party that wrote the interface does not get to declare it correct; the instrument does. This skill is the sequence, and it ends with a word you may or may not say.

## Exit 0 is the floor, not the finish

`uxcli run` exits 0 when no probe reports `fail`, 2 when at least one does, 1 when it could not run. You say done only after a run you made yourself, on the final state of the files, exited 0. A `fail` blocks the word done until it is fixed and re-measured, or until the human has seen it and decided; in that case you report the fail, you do not report done. A `finding` is not a pass: it is a would-be fail from a probe whose method is not yet validated. Name it as a finding and say what it says; never fold it into "passes" or "no issues". `unmeasurable` and `not-applicable` are not passes either.

## What exit 0 does not cover

`uxcli run <url>` runs four probes, and only these: `focus-visible` (2.4.7), `contrast` (1.4.3),
`text-spacing` (1.4.12) — three WCAG criteria whose method is validated — and `text-overlap`, which
is provenance `opinion` and method-unproven, so it can only ever report a `finding`. A journey run
adds four more, all unproven: 3.2.3, 3.3.1, 3.3.4, 3.3.7.

So exit 0 means: those probes found no `fail`. It is not a statement about the interface. Nothing in
uxcli measures layout at other window sizes, what scrolls and what stays put, whether a control's
visible label agrees with the state it reports, where focus lands after an action, whether feedback
appears where the person is looking, the heading outline, the tab order, or whether something that
can be clicked looks like it can. A page can return exit 0 with its navigation scrolling off the top
of the screen and a filter naming the wrong project — measured on a page of this instrument's own,
on 2026-09-20.

Report exit 0 as what it is: the probes that ran, and what they found. If you are asked whether the
UI is good, that is a different question and this instrument did not answer it.

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
- Skip a screen because "it looked right in the browser". The browser shows you one state; the probe presses Tab, plants a defect, and reads the pixels back. That is where the probe is stronger than your eye — and only there. For everything under "What exit 0 does not cover", your eye is the only instrument there is, and a clean card is not a reason to skip looking.
- Argue a verdict down. If you can show the card is wrong, say so to the owner with the run directory (`run.json` and the screenshots); the owner disputes it where the card says. Until then the verdict stands.

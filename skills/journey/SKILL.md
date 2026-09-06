---
name: journey
description: Help a human turn uxcli discover output into a journey uxcli can run. Produces a proposal file and the questions only the owner can answer; never confirms a journey itself.
---

# journey

You are helping a human write a journey: the steps of one process the product commits to, which step commits, and what the human declares about it. uxcli measures flows only against a journey a human has confirmed. You write `<name>.proposed.json`; the human answers the questions, sets `confirmedBy`, and moves the file where the project keeps its journeys.

## You propose. The human commits.

You never set `confirmedBy` to anything but `null`. You never write a journey into the project's journeys directory. You never run `uxcli run` on a journey you wrote, except to show that it is refused. If the owner is not available, the correct output is a proposal and a list of questions, and the word done is not yours to say. A journey confirmed by the party that wrote it measures nothing.

## What a journey is

One process, in order. Each step has a `url` (omitted when the step is reached by the previous step's click or submit), an optional `fill` (Playwright locator to value), and one of `click` or `submit`. One step may carry `commit: true`: the action that is hard to undo (place order, pay, delete, send). Declarations the machine cannot read: `checkedPass: true` when the project asserts its inputs are checked for errors, `reversible: true` when the commit can be undone, `sameProcess: [from, to]` when two steps belong to one process across a break in navigation, `expect` (a locator) for a step that advances without changing the URL. See `uxcli why 3.3.4`, `uxcli why 3.3.7`, `uxcli why 3.2.3` for what each probe reads.

## How to work

1. Read the proposals `uxcli discover` wrote (`uxcli-proposals/*.json` unless the project says otherwise) and the pages or source they point at. Keep the proposal's `fill` to inputs a visitor can see and type into; never add an input that is `type=hidden`, visually hidden, or otherwise not rendered.
2. Order the steps into one process. A form that is the whole process is one step. A wizard is several; note where the URL does not change and put a question about `expect` there.
3. For every value, put a placeholder `{{name}}` or a plausible test value, and say which it is.
4. Write `<name>.proposed.json` next to the proposals with `"provenance": "proposal"`, `"confirmedBy": null`, and a `questions` array. The questions are the ones only the owner can answer:
   - Which step, if any, is the commit, and is it legal or financial? (`commit`)
   - What appears after a submit that stays on the same URL? (`expect`)
   - The real values, or the test account.
   - Is there a test endpoint or flag so runs do not reach the real backend or inbox?
   - Do you assert the inputs are checked for errors, and is the commit reversible? (`checkedPass`, `reversible`)
5. Print the questions and end with the two things the human must do: answer them in the file and set `confirmedBy`, then move the file to the project's journeys directory and run `uxcli run <file>`.

## What you do not do

- Confirm, move, or rename the journey into place. Set `confirmedBy`.
- Invent an `expect`, a commit step, or a test endpoint. Leave a question.
- Fill an input the visitor cannot see.
- Submit the real form while working. Reading pages is enough to write the proposal.

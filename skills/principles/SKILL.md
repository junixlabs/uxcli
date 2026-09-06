---
name: principles
description: Help a human write what their product commits to, as thresholds uxcli can measure. Produces a proposal file and the trade-offs; never writes the commitments file itself.
---

# principles

You are helping a human write `uxcli.commitments.json`: the thresholds their product commits to, each with a named owner and a written source. You propose; the human commits. You never create or edit `uxcli.commitments.json`. You write `uxcli.commitments.proposed.json` and a short note of trade-offs, and stop.

## What a commitment is

A threshold with an owner and a source. `id · kind · why · owner · source`, plus the fields the kind needs. Provenance is `project`. Without an owner and a source uxcli reports the entry as `not-committed`, so do not propose entries you cannot attach to a statement the project already made (a principles document, a design-system page, a token file, an issue the team decided).

Kinds uxcli measures today:

- `contrast`: `fg` and `bg` are token names from the project's stylesheets, `min` is the ratio the pair must keep. Measured by `uxcli sheet --src=DIR` from the declared token values, no browser.

## How to work

1. Read what exists: the token stylesheet(s), any principles or design-system document, the latest `uxcli run <url> --src=DIR` output (its contrast groups already name the token pairs in use and their ratios).
2. For each candidate pair, state the fact and the choice: the ratio today, the WCAG level it meets, and what committing a minimum would mean. Example: `--amber-600 on --amber-50 is 3.9:1 today; committing 4.5:1 means changing the warning palette or accepting the WCAG fail; committing 3:1 is honest only if that text is always 18 px or larger.`
3. Write `uxcli.commitments.proposed.json` with `"provenance": "proposal"` at the top and `owner`/`source` left as `null` where you have no statement to cite. Leave `min` at the value the project meets today unless a document says otherwise; the human raises it.
4. Print the trade-offs, one line per entry, and end with the two things the human must do: fill `owner` and `source`, and rename the file to `uxcli.commitments.json` in the project root (then run `uxcli sheet`).

## What you do not do

- Decide a threshold. Pick a palette. Judge taste.
- Create or edit `uxcli.commitments.json`.
- Propose an entry with no source you can point at. Silence is the correct output when nothing is written down.

# The packet

One probe's verdict, and everything a reader or an agent needs to argue with it. Every probe returns
one; `run.json` is a list of them; every surface — the card, the dashboard, `diff`, `refute`, the
clipboard — reads the same object.

`uxcli gate` asserts this on every probe, on every run. A packet that breaks it stops the gate.

## Why it is a format and not a habit

It used to be five fixed keys and whatever else a probe felt like returning. Across 48 packets that
had grown into 29 different tail keys, 15 of which no surface ever asked for by name. Nothing said
which of them were evidence, so the dashboard printed all of them and the page filled with numbers
nobody chose to show; meanwhile the terminal card curated the same tail by hand, per criterion, with
a `p.sc === '3.3.4' ? … : p.sc === '3.3.7' ? …` ladder. Two surfaces, two curations of one object,
and only one of them deliberate.

The fix is not a denylist on either surface. It is the probe saying what its own fields are, once.

## The shape

Ten keys at the top level, and no others.

| key | | |
|---|---|---|
| `probe` | always | the probe's id, e.g. `page.contrast` |
| `sc` | always | the criterion, e.g. `1.4.3` — or the short name for an opinion |
| `provenance` | always | `spec` · `project` · `opinion` |
| `method` | always | `method-validated` · `method-unproven` |
| `verdict` | always | one of the seven: `pass` `fail` `finding` `not-applicable` `not-committed` `unmeasurable` `suppressed` |
| `why` | always | what the probe concluded, in one sentence |
| `cite` | on a stated fail | `what`, `where`, `check` — the citation a reader acts on. All three, or none |
| `evidence` | when there is any | what decided it: the things a reader opens to check the verdict |
| `measured` | when there is any | how it was counted: totals, samples, the tool and its version |
| `doctrine` | when it applies | the instrument judging itself |

`evidence`, `measured` and `doctrine` are objects that name their own fields. What goes in each is
the probe's decision, because the person who knows what a field means is the person naming it.

## Evidence or measured

Not importance — **use**. Would a reader open this to check the verdict, or is it the arithmetic
behind the sentence they have already read?

- `groups`, the colour pairs as painted, is **evidence**. Someone looks at them.
- `axe: "4.13.0"` is **measured**. Nobody checks a verdict by reading a version number.
- `controls`, the list of controls and what each did on focus, is **evidence**.
- `candidates: 53`, how many were in the tab order, is **measured**.

A surface may show all of `evidence` without choosing, which is the point of the split. `measured`
stays in the raw packet, where an agent re-running the measurement will find it.

`doctrine` holds what the instrument did to its own answer: `rawVerdict` (the verdict before an
unproven method downgraded a `fail` to a `finding`), `reread` (the second read, and whether it
agreed), `prove` (the falsification, under `--prove`), `override` (a project commitment that moved
the answer).

## Rules the gate asserts

1. Top level is the ten keys above. A key anywhere else fails.
2. `verdict` is one of the seven. `blocked` is not a verdict — it is the absence of a measurement,
   and `packet()` maps it to `unmeasurable` so a probe does not have to remember to.
3. `why` is always present. A verdict without a reason is not a verdict.
4. A stated fail carries a `cite`, and a `cite` carries all three of `what`, `where`, `check`. A
   defect nobody can go and look at is not one.
5. `evidence`, `measured`, `doctrine`, `cite` are objects, never arrays or numbers.

## Writing a probe

Return `verdict`, `why`, and whichever of `evidence` / `measured` apply. `packet()` in `src/packet.js`
adds `probe`, `sc`, `provenance`, `method`, applies the unproven-method downgrade into `doctrine`, and
validates. A key you leave at the top level is swept into `evidence` — the safe side, because
evidence is shown rather than hidden — so a probe that has not been classified yet still produces a
valid packet, and classifying it later is a matter of moving things out of `evidence` into
`measured`.

Raw buffers are not packet data. `focus-visible` returns its before/after crops as
`evidence.shots`; they are written to disk as the cited PNGs, recorded in `evidence.proof`, and
dropped from the packet before `run.json` is written.

## One packet

```json
{
  "probe": "page.contrast",
  "sc": "1.4.3",
  "provenance": "spec",
  "method": "method-validated",
  "verdict": "fail",
  "why": "4 text nodes below the ratio, 1 colour pair",
  "cite": {
    "what": "4 text nodes in 1 colour pair: #9a9a9a (--ink-400) on #ffffff (--paper-0) 2.81:1 ×4 (e.g. .hint)",
    "where": "http://127.0.0.1:4717/",
    "check": "--ink-400 and --paper-0 declared in src/tokens.css; one change there fixes 4 nodes."
  },
  "evidence": {
    "groups": [
      { "fg": "#9a9a9a", "bg": "#ffffff", "ratio": 2.81, "expected": 4.5, "count": 4, "example": ".hint",
        "fgToken": "--ink-400", "bgToken": "--paper-0" }
    ]
  },
  "measured": {
    "axe": "4.13.0",
    "incomplete": 0,
    "passes": 92,
    "passTargets": [{ "target": ".brand", "bg": "#161b26" }]
  },
  "doctrine": {
    "reread": { "afterMs": 700, "agreed": true }
  }
}
```

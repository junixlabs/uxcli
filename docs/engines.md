# Engine outputs

## Where results live

```
<project>/.uxcli/
  index.json                     one row per target, this project's own
  runs/<targetId>/
    run.json                     the current run
    step-0.jpg …                 its screenshots
    history/<ranAt>/
      run.json                   a run it replaced
      step-0.jpg …               and that run's own screenshots

~/.uxcli/projects.json           the list of projects this machine has seen. Nothing else.
```

`run.json` is the root: every verdict is read out of it, and `~/.uxcli` keeps no copy of anything.
The directory is `runs/<targetId>` and nothing more — the address is inside the packet, and a
readable slug in the path put a presentational decision where evidence lives.

A run that is replaced moves under `history/` **with its own screenshots**, because a packet's
`shot` field names a file: overwriting `step-0.jpg` in place would leave last week's packet pointing
at today's picture. `KEEP` is 7, the number of slots the dashboard's history strip draws.


What each engine returns, and the type of every field. Measured by calling each one on this
project's real data, not transcribed from the source.

Everything under `src/core/` is pure: it imports only `src/core/`, reaches no file, no browser, no
clock. Anything an engine needs from the world is passed in. `src/arch.js` rule 1 is the check.

## Closed sets

Every value below that is one of a fixed list. Nothing outside these appears in an output.

| set | values |
|---|---|
| `Verdict` | `pass` `fail` `finding` `not-applicable` `not-committed` `unmeasurable` `suppressed` |
| `Provenance` | `spec` `research` `analytics` `experiment` `project` `opinion` |
| `Method` | `method-validated` `method-unproven` |
| `Standing` (context) | `undeclared` `unsourced` `unquoted` `unresolved` `drifted` `quoted` |
| `Governance` | `unmanaged` `adopted` `enforced` |
| `Lineage` | `current` `legacy-unresolved` `gone` |
| `Drift` | `regressed` `improved` `held` `first` `unidentified` |
| `Purpose` | `product` `instrument` |
| `Action` | `propose` `sign` `supersede` |
| `FindingCause` | `method-unproven` `probe-said` `null` |
| `AnchorState` | `unanchored` `unverifiable` `matches` `differs` |

Governance is maturity, not an eighth verdict. Purpose says why a run happened, not how it went.

## One convention

Several engines return **a list of sentences, and empty means it holds**: `validate()`, `covers()`,
and every rule in `arch.js`. They never return a boolean, because a boolean cannot say which of four
things went wrong.

---

## E1 · context — what this product is

`readContext(doc, { docs }) -> Context`

`docs` is `{ [path]: { found: boolean, text?: string, tracked?: boolean } }`, supplied by the
caller. The engine reads no file.

```
Context {
  fields: {
    domain      : Field
    audiences   : Field
    constraints : Field
    journeys    : Field
  }
  standing   : { [S in Standing]: string[] }   // field names, one bucket each
  portable   : string[]                        // quoted fields whose document git does not track
  undeclared : string[]
}

Field {
  field    : string        // 'domain' | 'audiences' | 'constraints' | 'journeys'
  means    : string        // what the field is for
  value    : unknown|null  // whatever was declared; shape is the author's
  standing : Standing
  doc      : string?       // present unless undeclared/unsourced
  quote    : string?       // present unless undeclared/unsourced/unquoted
  portable : boolean?      // present only when quoted
}
```

`quoted` means the words are in the document. It does **not** mean the field follows from them —
one quote anchors one field, and a list field is spot-checked by it, not item by item.

`citable(ctx) -> { field: string, source: string, quote: string }[]` — quoted fields only.

Adapter: `src/context.js` `contextOf(root)` returns `Context & { file: string, exists: boolean }`,
resolving each document off disk and asking git whether it is tracked. HTML is read as rendered
text, not markup.

## E2 · propose — what was reached that nobody promised

`proposalsFor({ run, dir, entries, mayCite }) -> Proposals`

```
Proposals {
  flow      : Flow|null
  gap       : Coverage|null
  proposals : Proposal[]
  citable   : { field, source, quote }[]
  journey   : string|null
  why       : string?        // only when nothing could be proposed
}

Proposal {
  id             : string    // `${journey}.${step}`, slugged
  journey        : string|null
  step           : string    // the path, e.g. '/#/runs'
  kind           : null      // every one of these five is null on purpose:
  claim          : null      // the sentence is not the machine's to write
  failureSurface : null
  owner          : null
  source         : null
  signedBy       : null
  derivedFrom    : { run: string, hash: string|null, target: string, ranAt: string|null }
  mayCite        : { field, source, quote }[]
}
```

`coverageOf({ root, at }) -> { flow: Flow|null, coverage: Coverage|null, run: object }`

## reality — the map comes from the run

`observedFlow(run) -> Flow | null`

```
Flow {
  steps       : { i: number, url: string, path: string, arrivedBy: string,
                  title: string, flowBreak: boolean }[]
  edges       : { from: string, to: string, by: string }[]
  places      : { path: string, url: string, title: string, firstSeen: number }[]
  derivedFrom : string|null    // the journey file or url the run came from
  ranAt       : string|null    // ISO 8601
}
```

`coverage({ flow, entries, journey }) -> Coverage`

```
Coverage {
  observed  : number
  committed : number
  uncovered : { path: string, title: string|null }[]
  ok        : boolean          // uncovered.length === 0
}
```

## target — one target, one directory

Consumes a **run**, not an index row: the keys are `url` / `finalUrl` / `journey` / `file`.

| call | out | example |
|---|---|---|
| `canonical(run)` | `string` | `https://shop.test/checkout?a=1` |
| `targetId(run)` | `string` | `ipnh5r` (6 chars, `''` when nothing identifies it) |
| `outDirFor(run)` | `string` | `shop-test-checkout-ipnh5r` |

A journey canonicalises to `journey:<file>`.

## timeline — one target, one history

`timelines(rows) -> Timeline[]` — newest-measured first.

```
Timeline {
  targetId : string
  latest   : Row              // === history.at(-1)
  history  : Row[]            // oldest → newest
  drift    : Drift
  runs     : number
}
```

`Row` is an index row: `{ kind, name, where, project, dir, ranAt, targetId, purpose, worst,
counts: { [V in Verdict]?: number }, exit: number }`.

## lineage — rows a project can no longer seat

```
classify({ row, rootsInForce, absentRoots }) -> { member: boolean, state: Lineage, reason: string }

partitionIndex({ rows, rootsInForce, absentRoots }) -> {
  current     : Row[]
  quarantined : Row[]
  groups      : { project: string, state: Lineage, reason: string, count: number }[]
}
```

## label — the shortest name still unique

```
labelTargets(targets) -> { leaf: string, stem: string, head: string,
                           raw: string, kind: string, context: string }[]
parts(target)         -> { host: string, segs: string[], kind: string,
                           raw: string, name: string }
```

Input is `{ where, project, name }[]`. Output is positional — index `i` labels input `i`.

## governance — declared, or only observed

`governance({ context, authorities, entries, doc }) -> Governance`

```
Governance {
  state   : Governance         // 'unmanaged' | 'adopted' | 'enforced'
  has     : { context: boolean, authorities: boolean,
              commitments: boolean, signed: boolean }
  missing : string[]           // which of the four
  next    : string[]           // steps, empty when enforced
}
```

Not a score: one declaration of four is not "25% ready", and a number hides which.

## authority — who may sign, and what counts

```
may({ authorities, subject, action, kind, journey, artifact, at })
  ->  { ok: true,  under: Authority, owner: string }       // granted
    | { ok: false, why: string }                           // refused — no `under`, no `owner`

capabilityOf({ authorities, subject, at })
  -> { subject: string,
       actions: { action: Action, ok: boolean,
                  grants: { kind: string, owner: string, expires: string|null }[],
                  why: string? }[] }      // one entry per Action, always three

signatureOf(entry) -> string|null         // the name standing behind it, or null
```

## commitment — admission, then the evidence under it

```
admit(entry, { doc, authorities, at }) -> Seat

Seat {
  admitted  : boolean
  // refused — both keys present, and `verdict` may be null:
  verdict   : Verdict|null
  reason    : string
  // admitted:
  owner     : string
  source    : string
  signature : string|null
}
```

`verdict: null` on a refusal means it produced **no verdict at all** — reported apart from the
ladder, never counted among the things that were measured. `verdict: 'not-committed'` means it
produced one, and that one is it.

```
anchorOf(entry) -> { run: string, hash: string|null } | null
anchorState({ entry, actual }) -> AnchorState
```

`actual` is the sha256 the caller read off disk now, or `null` if it could not read one.

```
kindNames()        -> string[]
kindsAgainst(what) -> string[]            // kinds decided by 'run', etc.
KINDS[name]        -> { against: string, needs: object, measure: function }
```

## verdict — the ladder, and what the doctrine did

```
worst(verdicts)   -> Verdict              // by attention, fail first
rank(verdict)     -> number               // lower is worse
exitFor({ verdicts, couldNotRun }) -> 0 | 1 | 2   // any fail → 2, could not run → 1
regressed(a, b)   -> boolean
improved(a, b)    -> boolean
covers(set)       -> string[]             // empty = the ladder covers the set
saw(packet)       -> Verdict              // what was measured, before the doctrine
cause(packet)     -> FindingCause         // why a finding is a finding; null if not one
```

`saw` and `cause` exist because `verdict: 'finding'` is two different asks. A fail the doctrine
moved because the method is unproven is fixed by validating the method; a finding the probe reported
is fixed by fixing the page.

### packet

`packet(probe, result) -> Packet` — frozen. Eleven keys, nothing else at the top level.

```
Packet {
  probe      : string
  sc         : string
  provenance : Provenance
  method     : Method
  verdict    : Verdict
  why        : string
  rule       : object?
  cite       : object?
  evidence   : object?
  measured   : object?
  doctrine   : { rawVerdict?: Verdict, prove?: object,
                 reread?: object, override?: object }?
}
```

`validate(packet) -> string[]` — empty means it holds. A `fail` with no `cite` is refused:
a verdict that blocks a merge carries what, where and the check it failed.
`read(packet) -> Packet` — lifts a pre-format run's loose top-level keys into `evidence`.

## promise/parse — a journey file

```
parseFlow(text, { file }) -> Flow  // throws Rejection { file, why } — absent is a state,
                                   // unparseable is not
isFlow(x)  -> boolean              // takes a PARSED flow, not a path
SCHEMA     -> 1                    // a file declaring higher is refused, not guessed at
```

## explain — one per probe

`explain(packet) -> string`. Pure, and the reason `src/core/` may hold no port: once the sentence a
person reads is a pure function of the packet, the dependency rule is the whole enforcement.

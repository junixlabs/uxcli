# PRODUCT

What uxcli is for, who it is for, and what it refuses to be. VISION.md is the argument; this is the
brief a contributor or a reviewer holds a change against.

## Users

The person operating a coding agent on a product with an interface. Their pain is specific: the
agent designs from what it assumes about the user, and reports success with proof of failure in
hand. They want two things from an instrument: that the agent reads what the product has actually
learned about its users before it designs, and that "done" is a word the agent cannot say until a
browser has agreed.

The agent is the second user. It calls the CLI; it reads the card; it writes the files under
`.uxcli/` that a person then signs or refuses. Everything uxcli prints is written for the agent to
act on without interpretation: `what · where · rule · check`, an exit code, a path to the packet.

## Purpose

uxcli is the place, the rules and the instrument between an agent and an interface:

- **A place** — `.uxcli/`: one file per thing somebody decided, in a shape the machine validates
  (`schemas/`) and never edits.
- **Rules** — no commitment, no verdict; the agent proposes and a person signs; nobody edits a
  declaration to make a run pass; confidence is a ceiling derived from evidence.
- **An instrument** — `context show` before designing, `run` after, in real Chrome, against the
  project's own declarations.

The order matters. Understanding before journey, journey before run, run before commitment. `uxcli
init` prints the first undone rung, every time.

## Personality

Terse, literal, accountable. A card says what was measured and who signed the rule; it does not
advise, praise, or soften. Silence is a valid output: where nobody committed, uxcli says nothing.
Every claim in the README is one the gate can fail.

## Anti-references

What uxcli is not, so a feature that drifts there is refused:

- **Not a UX opinion engine.** It generates no insight, no persona, no recommendation. A built-in
  table of "best practices" would be a claim with no source and no owner.
- **Not a score.** No 0–100, no letter grade, no "UX health". Seven verdicts, one exit code.
- **Not visual regression.** A pixel diff says "different"; different is not wrong.
- **Not a conformance certificate.** Four page probes at exit 0 is a floor, not a WCAG audit.
- **Not a design-critique agent.** Taste is not committed to by anyone, so it is never measured.
- **Not a dashboard first.** A card in the terminal, a packet on disk. Surfaces come after the
  numbers do.

## Design principles

1. **The card is the argument.** Every verdict cites the measurement, the place, the rule and how
   to check it by hand. If a surface cannot print those four, it is not done.
2. **Every claim is a pair.** A probe ships a must-fail and a must-pass; a rule about the code is a
   test that plants the violation; a skill paragraph has a record of fresh sessions with and without
   it. `uxcli gate` runs all of it.
3. **Authored, derived, observed.** A file is one of the five kinds in the README's table, and the
   kind decides who may write it and whether git keeps it. The machine never edits an authored file.
4. **Ceilings, not claims.** Strength on a state, confidence on an insight, trust on a project: each
   is computed from what is on disk, and an author may only lower it.
5. **Exit 0 is a floor.** The instrument says what it measured and what it did not look at, in the
   same breath.

## Accessibility

The instrument's own output is text in a terminal with no colour dependence; the Verdict Lab page
and the share card carry the same text as alt and body. The WCAG probes it ships are the four whose
method has a validation record; a probe without one may only say `finding`.

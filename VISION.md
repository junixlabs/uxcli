# UXCLI

**Every verdict cites the commitment it enforces: W3C's, yours, or none.**
**Where no one has committed, UXCLI says nothing.**

## Design should be executable.

Software has machines that refuse a build that breaks a contract. Nothing refuses a build that breaks a journey. A journey map dies at handoff. A token becomes a suggestion. A principle becomes a thread. What ships is whatever survived, and no instrument can say how far it drifted from what was decided.

UXCLI is that instrument. It measures the running product against the commitments that produced it: the journeys that matter, the tokens that define the system, the principles that govern behavior. It drives a real browser. It follows flows. It measures change over time. It locates drift between builds to the element and the file. It sees defects that exist between screens, not only inside them.

This matters now because the author of the interface is changing. Agents produce more frontend than humans can inspect. The agent that writes the interface cannot be the authority that declares it correct. It needs perception, not another opinion.

A commitment becomes a measurement. A measurement produces evidence. Evidence earns a verdict.

**Your design, executable.**

## The next layer is not generation. It is perception.

axe answers *is this page broken?* Dembrandt answers *did the tokens drift?* Nothing answers *does the flow the user came for still complete?* The difference is the input. Those tools read a page. UXCLI reads a page and the commitment, and the commitment is a journey. That input makes a new class of defect measurable.

- **Between screens.** Data entered on step one, absent from the review on step three. Navigation that reorders itself between pages. No page-level tool can see this, because no page-level tool remembers.
- **Across time.** A toast that lives 800 ms when the principle says four seconds. Motion is data, not noise to freeze.
- **Between builds.** Drift, reported at the element and the file that caused it. Never as a score.
- **At five scales.** One element. One screen. One flow. The whole design system. The delta between two builds. One instrument, five zoom levels.

## Who runs it

The human operating a coding agent. The pain is specific: the agent reports success with proof of failure in hand. UXCLI is the instrument an agent runs before it is allowed to say done.

Commitments are written by a human, before the build, and versioned. The agent may propose one. It may not commit it. The party being measured never authors the measure in the same run.

Developers get the same instrument as a pre-merge gate: findings that need no re-checking before fixing, and a `fail` that blocks.

## Why it stays on

A review tool that lies three times is disabled forever. UXCLI is built around one rule and its consequences.

**No commitment, no verdict.** A commitment is a threshold with a named owner and a written source. W3C is a named owner, so WCAG runs by default. Nobody signed taste, so taste never runs.

- Every finding names its provenance: `spec`, `project`, or `opinion`. Opinion without a written principle stays silent.
- Every probe declares its method. An unproven method can raise a `finding`, never a `fail`.
- No commitment yields `not-committed`, not `fail`. Cannot measure yields `unmeasurable`, never `pass`.
- Nine verdicts. One blocks a merge.
- The opening rule set contains only probes proven not to false-positive, and at least one of them is a flow rule.

A tool with no opinions of its own has nothing to be wrong about.

**UXCLI wins by saying less, and being right.**

## Shape

Two skills write commitments: `journey`, `principles`. Seven commands measure: `init`, `run`, `sheet`, `query`, `scan`, `diff --gate`, `why`. Everything that carries a name carries `id · why · correct-when · applies-when`.

UXCLI does not score design. It does not certify taste. It does not replace visual regression. It does not turn uncertainty into green checks.

## Where it stands

| Axis | Evidence | Verdict |
|---|---|---|
| Method | focus-visible 7/7 W3C ACT, 22 GOV.UK pages 0 false fails; text-spacing 62/62; axe contrast 0 FP. Three independent detectors and chrome-devtools-mcp #86 converged on the same computed-style approach. | Confirmed |
| The flow claim | The gap is real: axe has no rules for 3.3.4 / 3.3.7 / 3.2.3; Evinced and Lighthouse aggregate per page. No flow benchmark has run yet. | Unmeasured |
| Adoption | The strongest community pain is agents that report success with proof of failure in hand. No verdict format yet resists that. | At risk |

Next, in order: zero false positives on 20 unseen pages with frozen definitions; one seeded flow fixture, caught when present and silent when absent; a verdict format measured by how often the agent fixes the right element.

**The part worth building is the part not yet proven.**

## Sources

developersdigest.tech/blog/ai-design-slop-and-how-to-spot-it · impeccable.style/slop · solodesign.cc/blog/ai-design-slop-the-tells · github.com/ChromeDevTools/chrome-devtools-mcp/issues/86 · github.com/anthropics/claude-code/issues/38948 · news.ycombinator.com/item?id=46594200 · arxiv.org/abs/2503.15885 · arxiv.org/abs/2502.10884 · dequeuniversity.com/rules/axe/4.10 · github.com/dembrandt/dembrandt

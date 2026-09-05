# UXCLI

`uxcli` measures a running UI against its design commitments. Built for AI coding agents that need to verify the frontend they just wrote.

**Status:** design stage. No release, no code yet.

**Core rule: no commitment, no verdict.** Every finding cites the commitment it enforces: W3C's, yours, or none. Where no one has committed, `uxcli` says nothing.

## Why

- Automated accessibility tools check one page at a time. Defects that span screens (data entered on step 1 missing from the review on step 3, navigation order changing between pages) have no automated check today.
- Agents cannot see what they render. The common failure is not blindness but false confirmation: given a screenshot of a broken UI, the agent reports success.
- Existing UI review tools produce false positives, and one false positive is enough for a developer to disable the tool.

## How it works

Two inputs the machine cannot derive are written by a human, before the build, through skills. Everything else is measured by commands. The agent may propose a commitment; it may not commit it.

| Skills | Commands |
|---|---|
| `journey` — what matters to the user (`intent`, `stake`, `gap`) | `init` scan the product, ask only what cannot be scanned |
| `principles` — what the product commits to | `run <url\|journey>` measure one screen or a flow |
| | `sheet`, `query` read the captured page by geometry |
| | `scan roles\|ia\|tokens` derive values from the running product |
| | `diff a b --gate` drift between builds, blocks merge |
| | `why <rule>` threshold origin and known blind spots |

Every probe ships with a pair of fixtures: one where it must fail, one where it must stay silent. A probe without that pair cannot say `fail`.

## Rules of output

- Every finding carries a provenance: `spec`, `project`, or `opinion`.
- Every probe carries a method status: `method-validated` or `method-unproven`. Unproven probes report `finding`, never `fail`.
- Nine verdicts: `pass`, `fail`, `finding`, `not-applicable`, `not-committed`, `unmeasurable`, `suppressed`, `stale`, `untested`. Only `fail` blocks a merge.
- No threshold set means `not-committed`, not `fail`.
- Cannot measure means `unmeasurable`, never `pass`.
- Every exception ships with a coverage test.
- No score, no summary line, no conformance claim.

## Evidence so far

Method checked against public test suites before writing product code.

| Probe | Suite | Result |
|---|---|---|
| focus-visible | W3C ACT, 7 cases | 7/7 |
| focus-visible | GOV.UK, 22 pages, 1,244 focusable elements | 0 false fails |
| text-spacing (locked) | W3C ACT, 62 cases | 62/62, after 3 definition fixes |
| contrast (delegated to axe-core) | W3C ACT, 32 cases | 24/32, 0 false positives, 7 `cantTell` |

Not yet shown: zero false positives on unseen sites; a multi-step flow fixture; a verdict format agents cannot rubber-stamp. These three are the roadmap.

## Non-goals

Conformance certification. Visual regression. Scores. Design critique.

## License

MIT. See [LICENSE](LICENSE).

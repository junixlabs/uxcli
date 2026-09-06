# UXCLI

`uxcli` measures a running UI against its design commitments. Built for AI coding agents that need to verify the frontend they just wrote.

**Status:** early. Three flow probes (WCAG 3.3.4, 3.3.7, 3.2.3), a gate that proves each probe can fail, a verdict card, and a second reader. On npm as `@junixlabs/uxcli`; the command is `uxcli`.

**Core rule: no commitment, no verdict.** Every finding cites the commitment it enforces: W3C's, yours, or none. Where no one has committed, `uxcli` says nothing.

## Why

- Automated accessibility tools check one page at a time. Defects that span screens (data entered on step 1 missing from the review on step 3, navigation order changing between pages) have no automated check today.
- Agents cannot see what they render. The common failure is not blindness but false confirmation: given a screenshot of a broken UI, the agent reports success.
- Existing UI review tools produce false positives, and one false positive is enough for a developer to disable the tool.

## Install and use

Node 20+.

```
npm install -g @junixlabs/uxcli
npx playwright-core install chromium-headless-shell   # once; or set UXCLI_CHROME to a Chromium binary
uxcli run journey.json                                # verdict card
uxcli run journey.json --json                         # full evidence packet
uxcli run journey.json --refute                       # a fresh second reader checks each fail from the screenshots (needs the claude CLI, or set UXCLI_REFUTER)
uxcli gate                                            # every probe must fail on its seeded fixture and stay silent on the clean twin
uxcli why 3.3.7                                       # the probe's definition
```

`npx @junixlabs/uxcli <command>` works without the global install. To hack on it: `git clone https://github.com/junixlabs/uxcli && cd uxcli && npm install`, then `node bin/uxcli.js` in place of `uxcli`. An example journey is in `examples/sylius-guest-checkout.json`.

A journey is the commitment: the steps of one process, which step commits, and what the human declares (`sameProcess`, `checkedPass`, `reversible`). See `test/journeys/checkout.json`.

## How it works

The one input the machine cannot derive, the journey, is written by a human. Everything else is measured. The agent may propose a commitment; it may not commit it.

| Available | Planned |
|---|---|
| `run <journey>` measure a flow; card by default, `--json`, `--refute` | `run <url>` single-screen probes (focus-visible, text-spacing, contrast) |
| `gate` run every probe's falsification pair | `principles` skill: what the product commits to, as thresholds |
| `why <rule>` the probe's definition | `diff a b --gate` drift between builds |

Every probe ships with a pair of fixtures: one where it must fail, one where it must stay silent. A probe without that pair cannot say `fail`. `gate` enforces it.

What comes next, and in what order, is in [ROADMAP.md](ROADMAP.md).

## Rules of output

- Every finding carries a provenance: `spec`, `project`, or `opinion`.
- Every probe carries a method status: `method-validated` or `method-unproven`. Unproven probes report `finding`, never `fail`.
- Nine verdicts: `pass`, `fail`, `finding`, `not-applicable`, `not-committed`, `unmeasurable`, `suppressed`, `stale`, `untested`. Only `fail` blocks a merge.
- No threshold set means `not-committed`, not `fail`.
- Cannot measure means `unmeasurable`, never `pass`.
- Every exception ships with a coverage test.
- No score, no summary line, no conformance claim.

## Evidence so far

Method checked against public test suites and unseen sites before product code; the flow probes checked on a seeded fixture, on real apps, and on agents.

| Probe | Suite | Result |
|---|---|---|
| focus-visible | W3C ACT, 7 cases | 7/7 |
| focus-visible | GOV.UK, 22 pages, 1,244 focusable elements | 0 false fails |
| text-spacing (locked) | W3C ACT, 62 cases | 62/62, after 3 definition fixes |
| contrast (delegated to axe-core) | W3C ACT, 32 cases | 24/32, 0 false positives, 7 `cantTell` |
| focus-visible, text-spacing | 20 unseen pages, 5 sites, definitions frozen and hashed first | 0 false fails |
| flow probes 3.3.4 / 3.3.7 / 3.2.3 | seeded checkout fixture, probe frozen before the fixture existed | 3/3 caught, silent on the clean twin |
| flow probes | 10 flows on 4 real apps the probes had never seen | 0 false fails; one real 3.3.7 defect found by hand that the probe then missed, now caught |
| verdict card vs JSON packet | 40 fresh agent sessions fixing the seeded fixture | 0 reported done with a check failing; card sessions edited only the cited file 19/20, JSON 7/20 |
| planted wrong `fail` | 20 agent sessions on the clean fixture | 2/10 rewrote the site to satisfy it without the tool; 0/10 with the tool in hand |

Not yet shown: precision on more than 10 real flows; recall on defects seeded into real pages by someone who does not tune the probes; any of this on a second model.

## Non-goals

Conformance certification. Visual regression. Scores. Design critique.

## License

MIT. See [LICENSE](LICENSE).

# The dashboard — what was drawn and what was picked

Drawn by an agent (Claude) with the CRM example's real data, picked by the owner on 2026-10-03.

| question | drawings | picked |
|---|---|---|
| What does the page answer first? | `a-attention` (what waits on a person), `b-matrix` (every screen against every kind of evidence), `c-timeline` (everything that happened) | **b-matrix** |
| Which look? | `theme-1-instrument` (light, dense, developer tool), `theme-2-notebook` (warm paper, serif), `theme-3-control` (dark, numbers first) | **theme-3-control** |
| Which views beside the overview, first? | Decisions, Runs, Design, Understanding | **Runs, Design, Understanding** — Decisions stays in the studio and the files, so the dashboard writes nothing |

Each drawing was measured with `uxcli run` before it was shown; `theme-2-notebook` failed 1.4.3 once
(#9b8f7e on #f4efe6, 2.76:1) and was corrected before the pick. Built as `uxcli dashboard`
(`src/dashboard.js`, `src/core/dashboard.js`, `src/core/dashboard-page.js`); `test/dashboard-pairs.mjs`
runs the page probes on every view.

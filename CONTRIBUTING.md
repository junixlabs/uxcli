# Contributing

`uxcli gate` is the review. It runs every falsification pair in real Chrome, and a change that
cannot show its claim failing on demand does not merge. Run it before you open a pull request:

```bash
npm ci
npx playwright-core install chromium-headless-shell
node bin/uxcli.js gate      # two to three minutes
```

## What a change must carry

| You add or change | It ships with |
|---|---|
| a page probe | `src/probes/<id>/probe.js`, `spec.md` (why · applies-when · correct-when), `pair.json` with hashes, `must-fail/` and `must-pass/` pages; `--prove` on must-pass must reach the elements |
| a flow probe | the same, with the overlay on `test/fixtures/checkout` |
| a rule about the code (`src/arch.js`) | a check that fails on a planted violation |
| a parser or the projection (`src/core/`) | a `test/<name>-pairs.mjs` registered in `src/suites.js`, with a must-fail half |
| an authored object's shape | the schema under `schemas/`, an example under `examples/crm/.uxcli/`, and the parser that refuses what the schema cannot express |
| a skill paragraph that claims to change behaviour | a record in `skills/pair.json` of fresh sessions with and without it; until then the record says "unmeasured" |
| a verb in `bin/uxcli.js` | a line in the usage block, the README's command list, and the CHANGELOG under Unreleased |

## Rules that are not negotiable

- `src/core/` imports `src/core/` and nothing else; no `node:fs`, no browser. `arch.js` checks it.
- A method that has not been validated on unseen pages may only say `finding`. Do not flip a probe
  to `method-validated` without the record (≥20 unseen pages or flows, 0 false fails).
- Nothing under `src/` names a `uxcli.*.json` file except `src/adapters/store/`.
- Never edit a fixture, a journey or a commitment to make a run pass. If a verdict is wrong, the
  fix is a must-pass case and a spec revision, and the CHANGELOG says so.
- `examples/crm/.uxcli/` is a shape contract. Do not run `uxcli init` inside it (init rewrites
  `index.json`); rebuild the index with `node scripts/example-index.mjs`.

## Disputing a verdict

Attach the run directory (`run.json` and `artifacts/`) and open an issue from
[issues/new/choose](https://github.com/junixlabs/uxcli/issues/new/choose). A confirmed false fail
becomes a must-pass case; a confirmed miss becomes a must-fail case. The outcome is written back on
the issue.

## Releasing

Bump `package.json`, set `metadata.version` in `skills/uxcli/SKILL.md` to the same major.minor, cut
the CHANGELOG section, and push an annotated tag `vX.Y.Z`. `release.yml` runs the gate, refuses a
tag that disagrees with either file, publishes to npm with provenance, and writes the GitHub Release
from the CHANGELOG section. `node scripts/release-identity.mjs X.Y.Z` runs the same checks locally.

## Language

Everything in the repository — code comments, cards, documentation, commit messages — is written in
English. Example data under `examples/` and `test/fixtures/crm/` is a Vietnamese product on purpose:
it is real content, not lorem ipsum, and the instrument must read it as it is.

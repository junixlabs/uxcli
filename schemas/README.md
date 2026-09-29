# schemas/

JSON Schema (draft 2020-12) for every file a person or an agent writes under `.uxcli/`. One schema
per object, `additionalProperties: false` at the top level, so an editor or a reviewer sees a stray
key before `uxcli init` does.

| Schema | File it describes | Parsed at run time by |
|---|---|---|
| `actor.schema.json` | `.uxcli/understanding/actors/<actor>.json` | `src/core/model/user-model.js` `parseActor` |
| `insight.schema.json` | `.uxcli/understanding/insights/I-xxxx.json` | `parseInsight` |
| `journey.schema.json` | `.uxcli/journeys/<id>.json` (schema 2) | `src/core/model/journey.js` |
| `commitment.schema.json` | `.uxcli/commitments/C-xxxx.json` | `src/core/model/commitment.js` |
| `policy.schema.json` | `.uxcli/policy/policy.json` | `src/core/model/policy.js` |
| `profile.schema.json` | `.uxcli/profiles/<id>.json` | `src/core/model/profile.js` |
| `proposal.schema.json` | `.uxcli/proposals/P-xxxx.json` | read as data; not parsed |
| `pick.schema.json` | `.uxcli/mockups/<state>/pick.json` | `src/core/mockups.js` `parsePick` |
| `viewpoints.schema.json` | `lenses/viewpoints/<school>.json` (shipped) | `src/core/model/lens.js` `parseViewpoints` |
| `lens.schema.json` | `lenses/<kind>.json` (shipped) | `parseLens`, `resolveLens` |
| `review.schema.json` | `.uxcli/mockups/<state>/<variant>.<lens>.review.json`, `.uxcli/reviews/<name>.<lens>.review.json` | `parseReview` |
| `lenses.schema.json` | `.uxcli/lenses.json` | `parseLensesFile` |

The parsers are the law. A schema says what keys a file may carry and what type each has; a parser
also says what the values must mean — a `strength` claimed above what the signals give, a
`confidence` above the ceiling the evidence allows, a `source.quote` the document no longer
contains. A file can satisfy the schema and still be refused, and `uxcli init` prints why.

The gate holds the two together (`test/schema-pairs.mjs`): every file under `examples/crm/.uxcli/`
and `test/fixtures/crm/.uxcli/` must satisfy its schema, and a planted mutant of each — a key the
schema does not know, a required key removed — must be refused. The validator is
`test/lib/json-schema.mjs`, a subset of the standard kept in the repo rather than a dependency.

Signals and constraints are the two places the schema is looser than the parser: which keys a
signal may carry depends on its `observer`, and `src/core/model/signal.js` is the grammar.

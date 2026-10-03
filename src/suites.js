// The falsification suites the gate runs, in one place because two readers need it: `gate.js`, which
// runs them, and `test/arch-pairs.mjs`, which asserts the list and the directory agree. It lived in
// gate.js and was copied into arch-pairs by hand, so adding a suite left the copy behind — the second
// list said the rule held while the first had already moved. gate.js reaches a browser and arch-pairs
// must not, so the shared thing is this file and not that one.
//
// tag/title are what the gate prints; `miss` is the word for what the must-fail half caught.
export const SUITES = [
  { tag: 'arch', title: 'the rules can fail', file: 'arch-pairs.mjs', miss: 'seen' },
  { tag: 'ident', title: 'one target, one directory', file: 'target-pairs.mjs', miss: 'seen' },
  { tag: 'real', title: 'the map comes from the run', file: 'reality-pairs.mjs', miss: 'seen' },
  { tag: 'prop', title: 'an agent proposes in scope', file: 'propose-pairs.mjs', miss: 'refused' },
  { tag: 'kind', title: 'a flow commitment can fail', file: 'flow-kind-pairs.mjs', miss: 'seen' },
  { tag: 'auth', title: 'who may sign, and what counts', file: 'authority-pairs.mjs', miss: 'refused' },
  { tag: 'label', title: 'shortest name that is unique', file: 'label-pairs.mjs', miss: 'grown' },
  { tag: 'gov', title: 'declared, or only observed', file: 'governance-pairs.mjs', miss: 'seen' },
  { tag: 'age', title: 'a row under a rule that died', file: 'lineage-pairs.mjs', miss: 'quarantined' },
  { tag: 'time', title: 'one target, one history', file: 'timeline-pairs.mjs', miss: 'seen' },
  { tag: 'why', title: 'the instrument is not the product', file: 'purpose-pairs.mjs', miss: 'demoted' },
  { tag: 'moved', title: 'who turned a fail into a finding', file: 'finding-pairs.mjs', miss: 'named' },
  { tag: 'pin', title: 'signed over evidence that moved', file: 'anchor-pairs.mjs', miss: 'differs' },
  { tag: 'cite', title: 'the document still says it', file: 'context-pairs.mjs', miss: 'drifted' },
  { tag: 'disk', title: 'a packet keeps its own pictures', file: 'runs-layout-pairs.mjs', miss: 'archived' },
  { tag: 'model', title: 'a declaration says what it can hold', file: 'model-pairs.mjs', miss: 'refused' },
  { tag: 'pred', title: 'a state that can be false', file: 'predicate-pairs.mjs', miss: 'seen' },
  { tag: 'prov', title: 'a provisioner is testimony, checked', file: 'provision-pairs.mjs', miss: 'refused' },
  { tag: 'run', title: 'blocked is not a verdict', file: 'run-pairs.mjs', miss: 'seen' },
  { tag: 'level', title: 'the level is computed, not read', file: 'level-pairs.mjs', miss: 'lowered' },
  { tag: 'meas', title: 'a measurement reads the page it was made for', file: 'measure-pairs.mjs', miss: 'seen' },
  { tag: 'card', title: 'a blocked run says no pass, a cap is spoken', file: 'report-pairs.mjs', miss: 'seen' },
  { tag: 'brief', title: 'the agent reads before it designs', file: 'brief-pairs.mjs', miss: 'seen' },
  { tag: 'pack', title: 'what ships is what the tag says', file: 'packaging-pairs.mjs', miss: 'refused' },
  { tag: 'shape', title: 'a file that is not the shape is refused', file: 'schema-pairs.mjs', miss: 'refused' },
  { tag: 'mock', title: 'the agent draws, a person picks', file: 'mockup-pairs.mjs', miss: 'refused' },
  { tag: 'map', title: 'drift is what the run said, nothing more', file: 'map-pairs.mjs', miss: 'seen' },
  { tag: 'page', title: 'the instrument measures its own pages', file: 'page-pairs.mjs', miss: 'seen' },
  { tag: 'lens', title: 'a viewpoint has a name, a review answers all', file: 'lens-pairs.mjs', miss: 'refused' },
  { tag: 'tmpl', title: 'a template asks, and apply only creates', file: 'template-pairs.mjs', miss: 'refused' },
  { tag: 'exp', title: 'what the person goes through, from the trace', file: 'experience-pairs.mjs', miss: 'seen' },
];

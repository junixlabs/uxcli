// The six architecture rules, held by the same kind of pair as every probe.
//
// A rule that only ever reports "clean" is indistinguishable from a rule that cannot see. So each
// one is shown failing on a planted violation and silent when the violation is removed — which is the
// standard this repo applies to everything else it asserts, and the reason `uxcli gate` exists.
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import { fileURLToPath } from 'node:url';
import { dependencyRule, lifecycleRule, registryRule, storeRule, suiteRule, kindRule } from '../src/arch.js';
import { SUITES } from '../src/suites.js';
import { kindNames } from '../src/core/commitment/kinds.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLANT = path.join(ROOT, 'src/core/__arch-pair-plant.js');

export const OPERATOR =
  'a file planted inside src/core/ importing node:fs, then importing outside core/, then removed; '
  + 'a probe carrying both lifecycles, missing its pure half, or growing an unnamed hook; '
  + 'a registration with no directory, and a directory with no registration; a pair file the gate '
  + 'runs nowhere and a suite the gate names with no file behind it; and a module served to the '
  + 'browser whose own import is not served, which resolves to a 404 and evaluates no screen at all; '
  + 'and a commitment kind registered without a pair that has ever watched it fail';

// The gate's own suite list, not a copy of it. This file used to keep a second one written out by
// hand, which is how adding a suite could leave the copy behind: the stale list still agreed with
// itself and reported the rule held. `src/suites.js` exists so there is one list; it reaches nothing,
// so importing it here pulls in no browser.
const REGISTERED = SUITES.map(s => s.file);

const PAGE = { id: 'page.__pair', sc: '1.1.1', kind: 'page', method: { status: 'method-validated' }, measure() {}, explain() {} };
const DIRS = ['contrast', 'focus-visible', 'text-spacing', 'text-overlap', 'nesting',
  'error-prevention', 'error-identification', 'redundant-entry', 'consistent-navigation'];

export function pair() {
  const problems = [];
  let checks = 0;
  const must = (what, cond) => { checks++; if (!cond) problems.push(what); };
  const mentionsPlant = () => dependencyRule().some(s => s.includes('__arch-pair-plant'));

  // Rule 1 — must-fail twice, must-pass once, and the file is removed either way.
  try {
    fs.writeFileSync(PLANT, "import fs from 'node:fs';\nexport const x = fs;\n");
    must('dependency rule stayed silent on a core/ file importing node:fs', mentionsPlant());
    fs.writeFileSync(PLANT, "import { SCHEMA } from './promise/parse.js';\nexport const x = SCHEMA;\n");
    must('dependency rule objected to a core/ file importing core/', !mentionsPlant());
    fs.writeFileSync(PLANT, "import { packet } from '../core-verdict-nope.js';\nexport const x = packet;\n");
    must('dependency rule stayed silent on a core/ file importing outside core/', mentionsPlant());
  } finally { fs.rmSync(PLANT, { force: true }); }
  must('dependency rule does not hold on the repository as it stands', dependencyRule().length === 0);

  // The store rule, planted and removed the same way. A rule that has only ever been seen agreeing
  // with the repository is a rule nobody has watched work.
  const STORE_PLANT = path.join(ROOT, 'src/__store-pair-plant.js');
  fs.writeFileSync(STORE_PLANT, "export const F = 'uxcli.commitments.json';\n");
  must('store rule did not see a file outside the store naming a declaration',
    storeRule().some(s => s.includes('__store-pair-plant')));
  fs.unlinkSync(STORE_PLANT);
  must('store rule does not hold on the repository as it stands', storeRule().length === 0);

  // Rule 2 — the shape of a probe.
  must('lifecycle rule objected to a complete page probe', lifecycleRule([PAGE]).length === 0);
  must('lifecycle rule missed a probe with no explain()', lifecycleRule([{ ...PAGE, explain: undefined }]).length > 0);
  must('lifecycle rule missed a probe carrying both lifecycles', lifecycleRule([{ ...PAGE, evaluate() {} }]).length > 0);
  must('lifecycle rule missed a probe that declares no method', lifecycleRule([{ ...PAGE, method: undefined }]).length > 0);
  must('lifecycle rule missed an unnamed hook on a probe', lifecycleRule([{ ...PAGE, sneak() {} }]).length > 0);

  // Rule 3 — the registry and the disk, both ways.
  must('registry rule objected to a registration that matches the disk', registryRule(DIRS).length === 0);
  must('registry rule missed a registration with no directory', registryRule([...DIRS, '__ghost']).length > 0);
  must('registry rule missed a directory with no registration', registryRule(DIRS.slice(1)).length > 0);

  // Rule 5 — the suites the gate runs. Asserted against a directory of its own rather than against
  // test/, so the check says what the rule does instead of what this repository currently contains.
  const suiteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-suite-'));
  try {
    for (const f of ['a-pairs.mjs', 'b-pairs.mjs']) fs.writeFileSync(path.join(suiteDir, f), 'export const OPERATOR = "";\n');
    fs.writeFileSync(path.join(suiteDir, 'helper.mjs'), '\n');
    must('suite rule objected to a registry that names every pair on disk',
      suiteRule(['a-pairs.mjs', 'b-pairs.mjs'], suiteDir).length === 0);
    must('suite rule missed a pair file the gate runs nowhere', suiteRule(['a-pairs.mjs'], suiteDir).length > 0);
    must('suite rule missed a registered suite with no file',
      suiteRule(['a-pairs.mjs', 'b-pairs.mjs', '__ghost-pairs.mjs'], suiteDir).length > 0);
    must('suite rule mistook a file that is not a pair for one',
      suiteRule(['a-pairs.mjs', 'b-pairs.mjs'], suiteDir).length === 0);
  } finally { fs.rmSync(suiteDir, { recursive: true, force: true }); }
  must('suite rule does not hold on the repository as it stands', suiteRule(REGISTERED).length === 0);

  // Rule 7 — a kind nobody has watched fail. The attack is not a malicious registration; it is a
  // hurried one. The planted name carries the `__` this file already uses for things that must never
  // match a real registration — a plausible name written here would be found by the rule's own grep.
  const kindDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-kind-'));
  try {
    fs.writeFileSync(path.join(kindDir, 'x-pairs.mjs'), "const k = 'contrast'; const j = \"flow-reachability\";\n");
    fs.writeFileSync(path.join(kindDir, 'notes.md'), '__kind-pair-plant\n');
    must('kind rule objected to kinds a pair already names',
      kindRule(['contrast', 'flow-reachability'], kindDir).length === 0);
    must('kind rule missed a registered kind no pair has ever watched fail',
      kindRule(['contrast', '__kind-pair-plant'], kindDir).length === 1);
    must('kind rule counted a mention outside a pair file as a falsification',
      kindRule(['__kind-pair-plant'], kindDir).length === 1);
  } finally { fs.rmSync(kindDir, { recursive: true, force: true }); }
  must('kind rule does not hold on the repository as it stands', kindRule(kindNames()).length === 0);

  return { ok: problems.length === 0, problems, checks };
}

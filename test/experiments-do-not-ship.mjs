// `experiments/` must not reach a user. If users receive it, it shipped — whatever the prose says.
//
// An experimental skill is a behavioural claim with no arm behind it yet, and this repo's whole
// standard is that such a claim does not go out. Two ways it could leak: someone adds "experiments"
// to package.json `files`, or `init --apply` copies from a directory that is not `skills/`. Both are
// checked here rather than trusted, and the pair is the same shape as every probe's: it must be
// possible to make this fail on demand, so the second arm plants the leak and requires it to be seen.
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { init } from '../src/init.js';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = 'experiments';

// npm's `files` is an allowlist, so the question is only whether anyone has added this directory to
// it — directly, or through a parent entry that would carry it along.
function inPackage(files) {
  return (files || []).some(f => {
    const top = String(f).replace(/^\.?\//, '').split('/')[0];
    return top === DIR || top === '.' || top === '*' || top === '**';
  });
}

export function pair() {
  const problems = [];
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

  // must-pass: the packaged file list does not carry experiments/
  if (!Array.isArray(pkg.files)) problems.push('package.json has no `files` allowlist, so everything ships');
  else if (inPackage(pkg.files)) problems.push(`package.json files carries ${DIR}: ${JSON.stringify(pkg.files)}`);

  // must-fail: the same check, against a files list that does carry it. If this does not trip, the
  // check above proves nothing.
  if (!inPackage(['bin', 'src', DIR])) problems.push('the leak check does not trip on a files list that carries ' + DIR);

  // must-pass: init --apply creates nothing from experiments/
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-exp-'));
  const applied = init(tmp, { apply: true });
  const leaked = applied.items.filter(i => i.rel.includes(DIR));
  if (leaked.length) problems.push(`init --apply reported ${leaked.map(i => i.rel).join(', ')}`);

  const names = fs.existsSync(path.join(ROOT, DIR)) ? fs.readdirSync(path.join(ROOT, DIR)) : [];
  for (const n of names) {
    const hit = path.join(tmp, '.claude', 'skills', n, 'SKILL.md');
    if (fs.existsSync(hit)) problems.push(`init --apply copied the experimental skill ${n} into a project`);
  }
  fs.rmSync(tmp, { recursive: true, force: true });

  return { ok: !problems.length, problems, experiments: names.length };
}

export const OPERATOR = 'package.json `files` is an allowlist and must not carry experiments/ (checked against a planted list that does), and `init --apply` on an empty project must copy no experimental skill into it';

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = pair();
  console.log(r.ok ? `PASS experiments do not ship · ${r.experiments} experimental skill${r.experiments === 1 ? '' : 's'} held back` : 'FAIL ' + r.problems.join('; '));
  process.exit(r.ok ? 0 : 1);
}

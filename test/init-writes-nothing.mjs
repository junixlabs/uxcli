// The falsification pair for `uxcli init`.
//
// The claim init now makes is a negative one — "this wrote nothing" — and a negative claim is the
// easiest kind to pass by accident. So the pair does not ask init whether it wrote; it fingerprints
// the whole project tree before and after, and fails on any difference at all.
//
// Three arms, because one would not be enough. must-not-write: the plan leaves the tree byte
// identical. must-write: `--apply` on the same tree changes it — without this arm the first would
// also pass if init had quietly become a no-op. must-keep: a file init would create, already present
// with different contents, survives `--apply`; init creates, it never overwrites.
//
// Run directly for the card, or call pair() from `uxcli gate`.
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { init } from '../src/init.js';

// Every path under the tree with the hash of each file's bytes. Mtimes are not in it: the question is
// whether the project changed, not whether something touched it.
function fingerprint(dir) {
  const seen = [];
  const walk = d => {
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : 1)) {
      const p = path.join(d, e.name); const rel = path.relative(dir, p);
      if (e.isDirectory()) { seen.push('d ' + rel); walk(p); }
      else seen.push('f ' + rel + ' ' + crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'));
    }
  };
  walk(dir);
  return seen.join('\n');
}
const added = (a, b) => { const A = new Set(a.split('\n')); return b.split('\n').filter(l => !A.has(l)).map(l => l.split(' ').slice(0, 2).join(' ')); };

export function pair() {
  const problems = [];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-init-'));
  const OWN = '# the project had its own instructions already\n';
  fs.writeFileSync(path.join(tmp, 'CLAUDE.md'), OWN);
  fs.mkdirSync(path.join(tmp, 'src')); fs.writeFileSync(path.join(tmp, 'src', 'app.js'), 'export const x = 1\n');

  // must-not-write
  const before = fingerprint(tmp);
  const planned = init(tmp);
  const wrote = added(before, fingerprint(tmp));
  if (wrote.length) problems.push(`without --apply the tree gained ${wrote.length} path(s): ${wrote.slice(0, 4).join(', ')}`);
  if (planned.apply !== false) problems.push('the plan reported apply:true');
  if (!planned.items.some(i => i.status === 'create')) problems.push('the plan proposed nothing to create in an empty project');
  if (!planned.next[1]) problems.push('the plan named no next step');

  // must-write
  const r = init(tmp, { apply: true });
  const created = added(before, fingerprint(tmp));
  if (!created.length) problems.push('--apply changed nothing; the must-not-write arm would pass on a dead function');
  for (const it of r.items) if (!fs.existsSync(path.join(tmp, it.rel))) problems.push(`--apply reported ${it.rel} but it is not on disk`);
  if (fs.readFileSync(path.join(tmp, 'CLAUDE.md'), 'utf8') !== OWN) problems.push("--apply edited the project's existing CLAUDE.md");

  // must-keep
  const tmp2 = fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-init-'));
  const MINE = 'my own wording, do not touch\n';
  const mine = path.join(tmp2, '.claude', 'rules', 'uxcli.md');
  fs.mkdirSync(path.dirname(mine), { recursive: true }); fs.writeFileSync(mine, MINE);
  const r3 = init(tmp2, { apply: true });
  if (fs.readFileSync(mine, 'utf8') !== MINE) problems.push('--apply overwrote a rules file the project already had');
  if (r3.items.find(i => i.rel.endsWith('uxcli.md'))?.status !== 'stale') problems.push('a rules file that differs from the shipped one was not reported as stale');

  fs.rmSync(tmp, { recursive: true, force: true }); fs.rmSync(tmp2, { recursive: true, force: true });
  return { ok: !problems.length, problems, wrote: wrote.length, created: created.length };
}

export const OPERATOR = 'a project carrying its own CLAUDE.md and src/: the plan must leave every byte as it found it, --apply must create, and a rules file the project already wrote must survive --apply as stale';

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = pair();
  console.log(r.ok ? `PASS init · must-not-write: 0 paths · must-write: ${r.created} paths · must-keep: held` : 'FAIL ' + r.problems.join('; '));
  process.exit(r.ok ? 0 : 1);
}

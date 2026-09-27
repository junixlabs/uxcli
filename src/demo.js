// uxcli demo: a real product with a planted defect, measured end to end, in one command. The fixture
// CRM ships with the package; it is copied into a directory of the caller's choosing, served on a
// free port, and the journey `handle-inbound-lead` is run against it. The first card a person sees
// is a `fail` on a commitment somebody signed — C-001, the call action below the fold at 390×844 —
// with the run directory and the artifacts to dispute it. Nothing outside that directory is written.
import fs from 'node:fs'; import path from 'node:path'; import { spawn } from 'node:child_process';
import { runJourney } from './journey.js';
import { journeyCard, why } from './core/report/index.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const FIXTURE = path.join(ROOT, 'test', 'fixtures', 'crm');
export const JOURNEY = path.join('.uxcli', 'journeys', 'handle-inbound-lead.json');

// Copies declarations and the product, never a previous run: the demo's first run is its own.
export function stage(dir) {
  if (fs.existsSync(dir) && fs.readdirSync(dir).length) throw new Error(`${dir} exists and is not empty — the demo only writes into an empty directory`);
  fs.cpSync(FIXTURE, dir, { recursive: true, filter: src => !/[\\/]\.uxcli[\\/](runs|index\.json)/.test(src) });
  return dir;
}

// `node server.mjs 0` prints one JSON line with the port it took.
export function serve(dir) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['server.mjs', '0'], { cwd: dir, stdio: ['ignore', 'pipe', 'ignore'] });
    let buf = '';
    const t = setTimeout(() => { child.kill(); reject(new Error('the fixture server did not report a port within 10s')); }, 10000);
    child.stdout.on('data', d => { buf += d; const line = buf.split('\n').find(l => l.trim().startsWith('{')); if (!line) return; clearTimeout(t); try { resolve({ child, port: JSON.parse(line).port }); } catch (e) { child.kill(); reject(e); } });
    child.on('exit', code => { clearTimeout(t); reject(new Error(`the fixture server exited with ${code} before reporting a port`)); });
  });
}

export async function demo(dir, { log = s => console.log(s), err = console.error } = {}) {
  const at = path.resolve(dir);
  stage(at);
  log([`uxcli demo · ${at}`, '', '  a small CRM with a defect planted on purpose: on the lead screen the call action sits below the fold at 390×844,', "  and commitment C-001 — signed by a product owner, sourced to the actor's own words — says it must not.", ''].join('\n'));
  const { child, port } = await serve(at);
  try {
    const origin = `http://localhost:${port}`;
    log(`  serving ${origin} · running ${JOURNEY} at 390×844\n`);
    const r = await runJourney(path.join(at, JOURNEY), { origin });
    if (r.problems) { err('uxcli: the declarations do not parse —\n  ' + r.problems.join('\n  ')); return 1; }
    log(journeyCard(r.run, r.commitments));
    const acts = r.run.verdicts.filter(v => v.value === 'fail' || v.value === 'finding').map(v => '  next   ' + why(v, r.commitments));
    if (acts.length) log('\n' + acts.join('\n'));
    log('  packet ' + path.relative(process.cwd(), path.join(r.dir, 'run.json')));
    const rel = path.relative(process.cwd(), at) || '.';
    log(['', '  what you just saw: a commitment somebody signed, a state the browser reached, a predicate that did not hold, the pixels to prove it.',
      `  read the card the agent reads:   uxcli context show handle-inbound-lead --src=${rel}`,
      `  the shape of every file:         ${rel}/.uxcli/`,
      '  your own project:                uxcli init --apply --origin=<url>'].join('\n'));
    return r.run.exit;
  } finally { child.kill(); }
}

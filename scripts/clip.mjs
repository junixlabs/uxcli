#!/usr/bin/env node
// Regenerate docs/uxcli-run.svg from a real run — serve the shipped fixture, measure it,
// render the captured card. No hand-written output anywhere in the chain.
//
//   npm run clip
import { spawn, spawnSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.CLIP_PORT || 3100);
const FIXTURE = path.join(ROOT, 'src/probes/focus-visible/must-fail/index.html');
const OUT = path.join(ROOT, 'docs/uxcli-run.svg');
const URL_ = `http://localhost:${PORT}/login`;

const html = fs.readFileSync(FIXTURE);
const server = http.createServer((req, res) => {
  if (req.url.replace(/\/$/, '') === '/login') { res.writeHead(200, { 'content-type': 'text/html' }); res.end(html); }
  else { res.writeHead(404); res.end(); }
});

// listen dual-stack: the browser resolves `localhost` to ::1 before 127.0.0.1 on macOS
await new Promise(r => server.listen(PORT, r));
console.log(`fixture served at ${URL_}`);

// must be async: spawnSync would block this process's event loop and the server above,
// which is the same process, could never answer the browser.
const run = await new Promise((resolve, reject) => {
  const p = spawn(process.execPath, [path.join(ROOT, 'bin/uxcli.js'), 'run', URL_, '--prove'],
    { cwd: ROOT, env: process.env });
  let out = '', err = '';
  p.stdout.on('data', d => { out += d; });
  p.stderr.on('data', d => { err += d; });
  p.on('error', reject);
  p.on('close', () => resolve({ stdout: out, stderr: err }));
});
server.close();

const card = run.stdout.trim();
// The fixture is the one every probe's pair is built on: it must produce a fail, or the clip
// would be advertising something the tool did not actually return.
if (!card || !/\bFAIL\b/.test(card)) {
  console.error('refusing to render: the run produced no FAIL.\n' + (card || run.stderr));
  process.exit(1);
}

fs.mkdirSync(path.join(ROOT, '.uxcli'), { recursive: true });
const cardPath = path.join(ROOT, '.uxcli/card.txt');
fs.writeFileSync(cardPath, card + '\n');

const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts/render-card-svg.mjs'), cardPath, OUT,
  `--cmd=uxcli run ${URL_} --prove`], { stdio: 'inherit' });
if (r.status) process.exit(r.status);

// The second clip: what a project sees the first time it meets the tool. A README that argues before
// it shows is a README nobody finishes, and this is the one card that cannot be photographed from
// this repo — uxcli is already set up here, so the first-contact state has to be made to exist.
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-clip-'));
fs.mkdirSync(path.join(scratch, 'src'));
fs.writeFileSync(path.join(scratch, 'src/app.jsx'), 'export const App = () => <main />\n');
fs.writeFileSync(path.join(scratch, 'CLAUDE.md'), '# the project already had its own instructions\n');

const plan = spawnSync(process.execPath, [path.join(ROOT, 'bin/uxcli.js'), 'init', scratch], { encoding: 'utf8' });
const planCard = (plan.stdout || '').split('\n  CI step')[0].trimEnd()
  .replace(new RegExp(scratch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '~/your-project');

// The plan must have written nothing, or the clip would be showing a claim the tool does not keep.
const wrote = ['.claude', '.uxcli'].filter(d => fs.existsSync(path.join(scratch, d)));
if (wrote.length) { console.error('refusing to render: `uxcli init` created ' + wrote.join(', ')); process.exit(1); }
fs.rmSync(scratch, { recursive: true, force: true });

fs.writeFileSync(path.join(ROOT, '.uxcli/init-card.txt'), planCard + '\n');
const r2 = spawnSync(process.execPath, [path.join(ROOT, 'scripts/render-card-svg.mjs'),
  path.join(ROOT, '.uxcli/init-card.txt'), path.join(ROOT, 'docs/uxcli-init.svg'),
  '--cmd=uxcli init .',
  '--status=reading the project · no browser, nothing written',
  '--exit=0', '--exit-note=a plan is not a change',
  '--title=uxcli init · what would be created, and where the project stands',
  '--label=uxcli init on a project that has never used it: five files it would create, none written; commitments not found and no journey measured, each marked as something only a human signs; and the next step, which needs nothing signed'],
  { stdio: 'inherit' });
process.exit(r2.status ?? 0);

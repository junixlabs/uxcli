#!/usr/bin/env node
// Regenerate docs/uxcli-run.svg from a real run — serve the shipped fixture, measure it,
// render the captured card. No hand-written output anywhere in the chain.
//
//   npm run clip
import { spawn, spawnSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
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
process.exit(r.status ?? 0);

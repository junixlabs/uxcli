#!/usr/bin/env node
// The decisive experiment: does what the agent reads before it designs change what it builds?
//
// Four arms, fresh `claude -p` sessions, same ticket, same fixture with pages/lead.html removed:
//   ticket   — the ticket alone
//   journey  — the ticket + the journey file (states as signals, in JSON) inline
//   context  — the ticket + the card `uxcli context show handle-inbound-lead` prints, inline
//   skill    — the ticket, in a project where `uxcli init --apply` has run (the skill, the rule file,
//              .uxcli/) and `uxcli` is on PATH; nothing inline — the re-measure of the shipped skill
// Scoring is not a reading of the transcript: after each session the fixture's declarations are put
// back, the server is started, and `uxcli run` measures the page the agent wrote at 390×844 and
// 1440×900. The number published is the first-run pass rate per arm.
//
//   node experiments/understanding-before-design/run.mjs --arm=context --n=10 --parallel=4 [--model=sonnet]
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { score } from './score.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const FIXTURE = path.join(ROOT, 'test', 'fixtures', 'crm');
const RESULTS = path.join(HERE, 'results');
const opt = (k, d) => { const a = process.argv.find(a => a.startsWith(`--${k}=`)); return a ? a.split('=').slice(1).join('=') : d; };
const ARM = opt('arm', 'context'), N = Number(opt('n', 10)), PAR = Number(opt('parallel', 4)), MODEL = opt('model', 'sonnet'), TURNS = Number(opt('max-turns', 60));
if (!['ticket', 'journey', 'context', 'skill'].includes(ARM)) throw new Error('--arm=ticket|journey|context|skill');
const CLAUDE = process.env.CLAUDE_BIN || 'claude';
const TICKET = fs.readFileSync(path.join(HERE, 'ticket.md'), 'utf8');

// The product without the page, and without the instrument's own files unless the arm is the one
// that installs them: an agent in the `ticket` arm that browsed .uxcli/ would not be in that arm.
function stage(arm) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `ubd-${arm}-`));
  fs.cpSync(FIXTURE, dir, { recursive: true, filter: src => !/[\\/]\.uxcli([\\/]|$)/.test(src) && !/[\\/]pages[\\/]lead\.html$/.test(src) && !/DEFECTS\.md$|README\.md$|check\.mjs$/.test(src) });
  if (arm === 'skill') {
    fs.cpSync(path.join(FIXTURE, '.uxcli'), path.join(dir, '.uxcli'), { recursive: true, filter: src => !/[\\/]\.uxcli[\\/](runs|index\.json)/.test(src) });
    fs.cpSync(path.join(ROOT, 'skills', 'uxcli'), path.join(dir, '.claude', 'skills', 'uxcli'), { recursive: true });
    // The shipped text says `npx -y @junixlabs/uxcli`, which would fetch the published package, not
    // this tree. `uxcli` is put on PATH instead and the copy is told so. Not a load-bearing paragraph.
    for (const f of walk(path.join(dir, '.claude', 'skills', 'uxcli'))) fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replaceAll('npx -y @junixlabs/uxcli', 'uxcli'));
    execFileSync(process.execPath, [path.join(ROOT, 'bin', 'uxcli.js'), 'init', '--apply', dir], { stdio: 'ignore' });
    fs.mkdirSync(path.join(dir, '.bin')); const shim = path.join(dir, '.bin', 'uxcli');
    fs.writeFileSync(shim, `#!/bin/sh\nexec "${process.execPath}" "${path.join(ROOT, 'bin', 'uxcli.js')}" "$@"\n`); fs.chmodSync(shim, 0o755);
  }
  return dir;
}
const walk = (d, out = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walk(p, out) : out.push(p); } return out; };

function promptFor(arm, dir) {
  const L = [`You are working in ${dir}: a small CRM for real-estate agents (plain Node, no dependencies; \`node server.mjs 0\` prints {"port":N} and serves it; seed login agent@example.invalid / matkhau123). Complete the ticket below by writing the file pages/lead.html. You may start the server to check your work; stop it before you finish. When you are finished, say so and say what you did.`, '', TICKET];
  if (arm === 'journey') L.push('', 'The product declares the journey this page belongs to. Its states are what an observer can check on the page:', '', '```json', fs.readFileSync(path.join(FIXTURE, '.uxcli', 'journeys', 'handle-inbound-lead.json'), 'utf8'), '```');
  if (arm === 'context') {
    const card = execFileSync(process.execPath, [path.join(ROOT, 'bin', 'uxcli.js'), 'context', 'show', 'handle-inbound-lead', `--src=${FIXTURE}`], { encoding: 'utf8' });
    L.push('', 'Read this before you design. It is what the project has declared about the person this page is for and what the page must be able to hold; nothing in it is advice:', '', '```', card.trim(), '```');
  }
  if (arm === 'skill') L.push('', 'This project uses uxcli; `uxcli` is on your PATH and the project has a .claude/ with its rule and skill.');
  return L.join('\n');
}

function session(arm, i) {
  return new Promise(resolve => {
    const dir = stage(arm); const prompt = promptFor(arm, dir); const t0 = Date.now();
    const env = { ...process.env, PATH: arm === 'skill' ? `${path.join(dir, '.bin')}:${process.env.PATH}` : process.env.PATH };
    for (const k of ['CLAUDECODE', 'CLAUDE_CODE_ENTRYPOINT', 'CLAUDE_CODE_SSE_PORT']) delete env[k];
    const args = ['-p', '--model', MODEL, '--max-turns', String(TURNS), '--output-format', 'stream-json', '--verbose', '--dangerously-skip-permissions', '--add-dir', dir];
    const child = spawn(CLAUDE, args, { cwd: dir, env, stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '', err = ''; child.stdout.on('data', d => out += d); child.stderr.on('data', d => err += d);
    child.stdin.end(prompt);
    child.on('close', async code => {
      const events = out.split('\n').filter(Boolean).flatMap(l => { try { return [JSON.parse(l)]; } catch { return []; } });
      const tools = events.flatMap(e => (e.message?.content || []).filter(c => c.type === 'tool_use').map(c => ({ name: c.name, input: c.input })));
      const final = events.find(e => e.type === 'result')?.result || '';
      const rec = { arm, i, dir, model: MODEL, exitCode: code, seconds: Math.round((Date.now() - t0) / 1000), turns: events.filter(e => e.type === 'assistant').length,
        ranUxcli: tools.filter(t => t.name === 'Bash' && /\buxcli\b/.test(t.input?.command || '')).map(t => t.input.command),
        editedDeclarations: tools.filter(t => /^(Edit|Write|MultiEdit)$/.test(t.name) && /\.uxcli[\\/]/.test(t.input?.file_path || '')).map(t => t.input.file_path),
        wroteLead: fs.existsSync(path.join(dir, 'pages', 'lead.html')), final, stderr: err.slice(-2000) };
      const tag = `${arm}-${String(i).padStart(2, '0')}`;
      fs.mkdirSync(path.join(RESULTS, tag), { recursive: true });
      fs.writeFileSync(path.join(RESULTS, tag, 'transcript.jsonl'), out);
      if (rec.wroteLead) fs.copyFileSync(path.join(dir, 'pages', 'lead.html'), path.join(RESULTS, tag, 'lead.html'));
      try { rec.score = await score(dir, { fixture: FIXTURE, root: ROOT }); } catch (e) { rec.score = { error: e.message }; }
      fs.writeFileSync(path.join(RESULTS, tag, 'session.json'), JSON.stringify(rec, null, 1) + '\n');
      console.log(`${tag}  ${rec.seconds}s  lead.html ${rec.wroteLead ? 'yes' : 'NO '}  390: ${rec.score?.['390x844']?.summary || rec.score?.error}  1440: ${rec.score?.['1440x900']?.summary || ''}${arm === 'skill' ? `  uxcli runs: ${rec.ranUxcli.length}` : ''}`);
      fs.rmSync(dir, { recursive: true, force: true });
      resolve(rec);
    });
  });
}

const queue = Array.from({ length: N }, (_, i) => i + 1).filter(i => !fs.existsSync(path.join(RESULTS, `${ARM}-${String(i).padStart(2, '0')}`, 'session.json')));
console.log(`arm ${ARM} · ${queue.length} session(s) to run · ${PAR} at a time · model ${MODEL}`);
const workers = Array.from({ length: Math.min(PAR, queue.length) }, async () => { while (queue.length) await session(ARM, queue.shift()); });
await Promise.all(workers);

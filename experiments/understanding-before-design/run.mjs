#!/usr/bin/env node
// The decisive experiment: does what the agent reads before it designs change what it builds?
//
// Four arms, fresh `claude -p` sessions, same ticket, same fixture with pages/lead.html removed:
//   ticket   — the ticket alone
//   journey  — the ticket + the journey file (states as signals, in JSON) inline
//   context  — the ticket + the card `uxcli context show handle-inbound-lead` prints, inline
//   gate     — the draw arm, with the policy holding the work to two drawings and a review per screen
//   asked    — the gate arm, with the ticket asking for the screens to be designed before they are built
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
if (!['ticket', 'journey', 'context', 'skill', 'draw', 'gate', 'asked'].includes(ARM)) throw new Error('--arm=ticket|journey|context|skill|draw|gate|asked');
const WITH_SKILL = ['skill', 'draw', 'gate', 'asked'];
const CLAUDE = process.env.CLAUDE_BIN || 'claude';
// --ticket=2: CRM-215, recording how a call went, on the lead page an earlier session wrote; the agent
// decides the controls and the steps and extends the journey with them, so the walk it is scored on is
// its own and the estimate can differ between arms. What the walk achieved is checked on the server.
const T2 = opt('ticket', '1') === '2';
const TICKET = fs.readFileSync(path.join(HERE, T2 ? 'ticket-2.md' : 'ticket.md'), 'utf8');
const TAG = i => `${T2 ? 't2-' : ''}${ARM}-${String(i).padStart(2, '0')}`;

// The product without the page, and without the instrument's own files unless the arm is the one
// that installs them: an agent in the `ticket` arm that browsed .uxcli/ would not be in that arm.
function stage(arm) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `ubd-${arm}-`));
  fs.cpSync(FIXTURE, dir, { recursive: true, filter: src => !/[\\/]\.uxcli([\\/]|$)/.test(src) && !/[\\/]pages[\\/]lead\.html$/.test(src) && !/DEFECTS\.md$|README\.md$|check\.mjs$/.test(src) });
  if (WITH_SKILL.includes(arm)) {
    fs.cpSync(path.join(FIXTURE, '.uxcli'), path.join(dir, '.uxcli'), { recursive: true, filter: src => !/[\\/]\.uxcli[\\/](runs|index\.json)/.test(src) });
    fs.cpSync(path.join(ROOT, 'skills', 'uxcli'), path.join(dir, '.claude', 'skills', 'uxcli'), { recursive: true });
    // The shipped text says `npx -y @junixlabs/uxcli`, which would fetch the published package, not
    // this tree. `uxcli` is put on PATH instead and the copy is told so. Not a load-bearing paragraph.
    for (const f of walk(path.join(dir, '.claude', 'skills', 'uxcli'))) fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replaceAll('npx -y @junixlabs/uxcli', 'uxcli'));
    execFileSync(process.execPath, [path.join(ROOT, 'bin', 'uxcli.js'), 'init', '--apply', dir], { stdio: 'ignore' });
    fs.mkdirSync(path.join(dir, '.bin')); const shim = path.join(dir, '.bin', 'uxcli');
    fs.writeFileSync(shim, `#!/bin/sh\nexec "${process.execPath}" "${path.join(ROOT, 'bin', 'uxcli.js')}" "$@"\n`); fs.chmodSync(shim, 0o755);
  }
  // draw: the same project with the lead page's two screens never drawn, so the agent has to choose a
  // lens and draw before it may build; the project says which template it started from.
  // gate: the draw arm with the policy holding the work to it (project.design: drawn) — a clean walk
  // exits 3 until every walked screen has two drawings and a complete lens review.
  if (!T2 && ['draw', 'gate', 'asked'].includes(arm)) {
    for (const st of ['agent.lead_detail', 'agent.call_started']) fs.rmSync(path.join(dir, '.uxcli', 'mockups', st), { recursive: true, force: true });
    fs.writeFileSync(path.join(dir, '.uxcli', 'template.json'), JSON.stringify({ schema_version: 1, template: 'workspace', at: new Date().toISOString() }) + '\n');
  }
  if (arm === 'gate' || arm === 'asked') { const pf = path.join(dir, '.uxcli', 'policy', 'policy.json'); const p = JSON.parse(fs.readFileSync(pf, 'utf8')); p.project.design = 'drawn'; fs.writeFileSync(pf, JSON.stringify(p, null, 2) + '\n'); }
  if (T2) fs.copyFileSync(path.join(ROOT, 'test', 'fixtures', 'design-gate', 'lead.html'), path.join(dir, 'pages', 'lead.html'));
  return dir;
}
const walk = (d, out = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walk(p, out) : out.push(p); } return out; };

function promptFor(arm, dir) {
  const L = T2
    ? [`You are working in ${dir}: a small CRM for real-estate agents (plain Node, no dependencies; \`node server.mjs 0\` prints {"port":N} and serves it; seed login agent@example.invalid / matkhau123). Complete the ticket below by changing pages/lead.html; the API it names already exists. The project's journey .uxcli/journeys/handle-inbound-lead.json ends when the call has started: extend its open-and-call workflow with the steps a person takes on your page to record that the call reached the lead and the lead is qualified, so uxcli walks them. You may start the server to check your work; stop it before you finish. When you are finished, say so and say what you did.`, '', TICKET]
    : [`You are working in ${dir}: a small CRM for real-estate agents (plain Node, no dependencies; \`node server.mjs 0\` prints {"port":N} and serves it; seed login agent@example.invalid / matkhau123). Complete the ticket below by writing the file pages/lead.html. You may start the server to check your work; stop it before you finish. When you are finished, say so and say what you did.`, '', TICKET];
  if (arm === 'journey') L.push('', 'The product declares the journey this page belongs to. Its states are what an observer can check on the page:', '', '```json', fs.readFileSync(path.join(FIXTURE, '.uxcli', 'journeys', 'handle-inbound-lead.json'), 'utf8'), '```');
  if (arm === 'context') {
    const card = execFileSync(process.execPath, [path.join(ROOT, 'bin', 'uxcli.js'), 'context', 'show', 'handle-inbound-lead', `--src=${FIXTURE}`], { encoding: 'utf8' });
    L.push('', 'Read this before you design. It is what the project has declared about the person this page is for and what the page must be able to hold; nothing in it is advice:', '', '```', card.trim(), '```');
  }
  // asked: the gate arm with the design step asked for in the ticket's own words — the library's exit
  // measured when someone asks, rather than whether an agent takes it up unasked
  if (arm === 'asked') L.push('', 'Design the screens this ticket touches before you build them: the project keeps its drawings and their lens reviews under .uxcli/mockups/, and its policy asks for both.');
  if (WITH_SKILL.includes(arm)) L.push('', 'This project uses uxcli; `uxcli` is on your PATH and the project has a .claude/ with its rule and skill.');
  return L.join('\n');
}

function session(arm, i) {
  return new Promise(resolve => {
    const dir = stage(arm); const prompt = promptFor(arm, dir); const t0 = Date.now();
    const env = { ...process.env, PATH: WITH_SKILL.includes(arm) ? `${path.join(dir, '.bin')}:${process.env.PATH}` : process.env.PATH };
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
      // which lens and template the session reached for, and what it drew and reviewed
      const lensOf = t => { const m = /lenses\/([a-z]+)\.md/.exec(t.input?.file_path || t.input?.command || '') || /\blens show ([a-z]+)/.exec(t.input?.command || ''); return m ? m[1] : null; };
      rec.lenses = [...new Set(tools.map(lensOf).filter(Boolean))];
      rec.templateShown = tools.some(t => /\btemplate (show|apply)\b/.test(t.input?.command || '') || /templates\/[a-z-]+\.md/.test(t.input?.file_path || ''));
      rec.drew = fs.existsSync(path.join(dir, '.uxcli', 'mockups')) ? walk(path.join(dir, '.uxcli', 'mockups')).filter(f => /agent\.(lead_detail|call_started)[\\/][^\\/]+\.html$/.test(f)).map(f => path.relative(dir, f)) : [];
      rec.reviews = fs.existsSync(path.join(dir, '.uxcli', 'mockups')) ? walk(path.join(dir, '.uxcli', 'mockups')).filter(f => f.endsWith('.review.json')).map(f => path.relative(dir, f)) : [];
      const tag = TAG(i);
      fs.mkdirSync(path.join(RESULTS, tag), { recursive: true });
      fs.writeFileSync(path.join(RESULTS, tag, 'transcript.jsonl'), out);
      if (rec.wroteLead) fs.copyFileSync(path.join(dir, 'pages', 'lead.html'), path.join(RESULTS, tag, 'lead.html'));
      // the declarations the session left (its journey, its policy), so a rescore walks what it wrote
      if (T2) for (const f of ['journeys/handle-inbound-lead.json', 'policy/policy.json']) { const src = path.join(dir, '.uxcli', f); if (fs.existsSync(src)) { fs.mkdirSync(path.join(RESULTS, tag, 'decl', path.dirname(f)), { recursive: true }); fs.copyFileSync(src, path.join(RESULTS, tag, 'decl', f)); } }
      rec.ticket = T2 ? 2 : 1;
      // the drawings and reviews the session made, so a rescore holds them as the session left them
      { const src = path.join(dir, '.uxcli', 'mockups'); if (['draw', 'gate', 'asked'].includes(arm) && fs.existsSync(src)) fs.cpSync(src, path.join(RESULTS, tag, 'decl', 'mockups'), { recursive: true, filter: f => !/[\\/]\.shots([\\/]|$)|[\\/]index\.html$/.test(f) }); }
      try { rec.score = await score(dir, { fixture: FIXTURE, root: ROOT, keep: path.join(RESULTS, tag), outcomes: T2 }); } catch (e) { rec.score = { error: e.message }; }
      fs.writeFileSync(path.join(RESULTS, tag, 'session.json'), JSON.stringify(rec, null, 1) + '\n');
      console.log(`${tag}  ${rec.seconds}s  lead.html ${rec.wroteLead ? 'yes' : 'NO '}  390: ${rec.score?.['390x844']?.summary || rec.score?.error}  1440: ${rec.score?.['1440x900']?.summary || ''}${arm === 'skill' ? `  uxcli runs: ${rec.ranUxcli.length}` : ''}`);
      fs.rmSync(dir, { recursive: true, force: true });
      resolve(rec);
    });
  });
}

const queue = Array.from({ length: N }, (_, i) => i + 1).filter(i => !fs.existsSync(path.join(RESULTS, TAG(i), 'session.json')));
console.log(`${T2 ? 'ticket 2 · ' : ''}arm ${ARM} · ${queue.length} session(s) to run · ${PAR} at a time · model ${MODEL}`);
const workers = Array.from({ length: Math.min(PAR, queue.length) }, async () => { while (queue.length) await session(ARM, queue.shift()); });
await Promise.all(workers);

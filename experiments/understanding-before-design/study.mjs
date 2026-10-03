#!/usr/bin/env node
// A blind pairwise study of two arms, for designers to judge: the lead page each session built, as the
// walk photographed it (step s2 before the call, at one viewport), session NN of one arm against session
// NN of the other. Sessions whose walk left no picture are left out of both sides. The study is written
// with `uxcli prefer make`, so the judge's page names neither arm.
//
//   node experiments/understanding-before-design/study.mjs --a=skill --b=ticket [--viewport=390x844]
//   then, per designer: uxcli prefer serve <name> --judge=<them> --src=experiments/understanding-before-design/study
//   and: uxcli prefer tally <name> --src=…
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import { execFileSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const opt = (k, d) => { const a = process.argv.find(a => a.startsWith(`--${k}=`)); return a ? a.split('=').slice(1).join('=') : d; };
const A = opt('a', 'skill'), B = opt('b', 'ticket'), VP = opt('viewport', '390x844'), SHOT = opt('shot', 'open-and-call-s2-before.png');
const name = opt('name', `${A}-vs-${B}-${VP}`);
// the study lives in its own directory beside the results: .uxcli/preferences/<name>/
const STUDY = path.join(HERE, 'study'); fs.mkdirSync(STUDY, { recursive: true });

const pics = arm => Object.fromEntries(fs.readdirSync(path.join(HERE, 'results')).filter(d => d.startsWith(`${arm}-`) && /-\d\d$/.test(d))
  .map(d => [d.slice(arm.length + 1), path.join(HERE, 'results', d, 'shots', VP, SHOT)]).filter(([, f]) => fs.existsSync(f)));
const pa = pics(A), pb = pics(B); const both = Object.keys(pa).filter(k => pb[k]).sort();
if (!both.length) { console.error(`no session NN has a picture in both ${A} and ${B} at ${VP} — rescore.mjs keeps them`); process.exit(1); }
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ubd-study-'));
for (const [g, set] of [['a', pa], ['b', pb]]) { fs.mkdirSync(path.join(tmp, g)); for (const k of both) fs.copyFileSync(set[k], path.join(tmp, g, `${k}.png`)); }
const out = execFileSync(process.execPath, [path.join(ROOT, 'bin', 'uxcli.js'), 'prefer', 'make', name, `--a=${path.join(tmp, 'a')}`, `--b=${path.join(tmp, 'b')}`, `--src=${STUDY}`,
  '--question=A real-estate agent opens a new lead on their phone to call them. Which of these two pages would serve them better, and why?'], { encoding: 'utf8' });
// the groups say which arm each side is, for the tally; a judge never sees this file's groups
const sf = path.join(STUDY, '.uxcli', 'preferences', name, 'study.json'); const s = JSON.parse(fs.readFileSync(sf, 'utf8'));
s.groups = { A: `${A} arm (${both.length} sessions)`, B: `${B} arm (${both.length} sessions)` }; fs.writeFileSync(sf, JSON.stringify(s, null, 1) + '\n');
fs.rmSync(tmp, { recursive: true, force: true });
console.log(out.trim());

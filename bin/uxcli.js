#!/usr/bin/env node
// uxcli — UI/UX review for coding agents. No commitment, no verdict.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [cmd, ...rest] = process.argv.slice(2);
const flags = new Set(rest.filter(a => a.startsWith('--') && !a.includes('='))); const args = rest.filter(a => !a.startsWith('--'));
const opt = k => (rest.find(a => a.startsWith('--' + k + '=')) || '').split('=').slice(1).join('=') || null;
const vars = Object.fromEntries(rest.filter(a => a.startsWith('--var=')).map(a => a.slice(6).split('=')).map(([k, ...v]) => [k, v.join('=')]));
const usage = `usage:
  uxcli run <journey.json> [--json] [--out=DIR] [--refute] [--var=k=v ...]
      measure one flow; card by default, --json for the evidence packet; screenshots for fails in DIR (default .uxcli/<journey>);
      --var substitutes {{k}} in the journey; --refute asks a fresh second reader (UXCLI_REFUTER, default claude -p) to confirm or dispute each fail from the images alone
  uxcli run <url> [--json] [--out=DIR] [--refute] [--state=FILE] [--src=DIR]
      measure one screen: focus-visible (2.4.7), text-spacing (1.4.12), contrast (1.4.3, axe-core); --state is a Playwright storageState file for signed-in pages; --src is the project's source tree, used to name the design token behind a colour
  uxcli sheet [--src=DIR] [--json]    the project's own commitments on its design tokens (uxcli.commitments.json in DIR, default .); provenance project; exit 2 on a broken commitment
  uxcli gate                          run every probe's falsification pair; exit 1 unless all hold
  uxcli why <rule>                    print a probe's definition (e.g. why 3.3.7, why redundant-entry, why 2.4.7)
exit: 0 no fail (findings included) · 2 at least one fail · 1 the run could not be carried out
browser: playwright-core; set UXCLI_CHROME to a Chromium binary if none is installed for playwright.`;
const isUrl = s => /^https?:\/\//i.test(s) || /\.html?$/i.test(s) || s.startsWith('file:');
try {
  if (cmd === 'run' && args[0] && isUrl(args[0])) {
    const { runPage } = await import('../src/page.js'); const { card } = await import('../src/card.js');
    const url = /^(https?|file):/i.test(args[0]) ? args[0] : pathToFileURL(path.resolve(args[0])).href;
    const outDir = opt('out') || path.join('.uxcli', new URL(url).hostname || 'page');
    const result = await runPage(url, { state: opt('state'), outDir, src: opt('src') });
    if (flags.has('--refute')) { const { refute } = await import('../src/refute.js'); for (const p of result.probes) if (p.verdict === 'fail' && p.proof?.length) p.refute = refute(p); }
    console.log(flags.has('--json') ? JSON.stringify(result, null, 1) : card(result));
    process.exit(result.error ? 1 : result.probes.some(p => p.verdict === 'fail') ? 2 : 0);
  } else if (cmd === 'run' && args[0]) {
    const { loadJourney } = await import('../src/journey.js'); const { runJourney } = await import('../src/run.js'); const { card } = await import('../src/card.js');
    const outDir = opt('out') || path.join('.uxcli', path.basename(args[0], '.json'));
    const result = await runJourney(loadJourney(path.resolve(args[0]), vars), { outDir });
    if (flags.has('--refute')) { const { refute } = await import('../src/refute.js'); for (const p of result.probes) if (p.verdict === 'fail') p.refute = refute(p); }
    console.log(flags.has('--json') ? JSON.stringify(result, null, 1) : card(result));
    const couldNotRun = result.steps.some(s => s.error) || result.steps.length < result.stepCount;
    process.exit(result.probes.some(p => p.verdict === 'fail') ? 2 : couldNotRun ? 1 : 0);
  } else if (cmd === 'sheet') {
    const { findCommitments, evaluate, sheetCard, FILE } = await import('../src/sheet.js'); const root = path.resolve(opt('src') || '.');
    const file = findCommitments(root); if (!file) { console.log(`no ${FILE} under ${root}: nothing committed, nothing to say`); process.exit(0); }
    const s = evaluate(file, root); console.log(flags.has('--json') ? JSON.stringify(s, null, 1) : sheetCard(s));
    process.exit(s.results.some(r => r.verdict === 'fail') ? 2 : 0);
  } else if (cmd === 'gate') {
    const { gate } = await import('../src/gate.js'); process.exit((await gate()) ? 0 : 1);
  } else if (cmd === 'why' && args[0]) {
    const dirs = fs.readdirSync(path.join(ROOT, 'src/probes'));
    const hit = dirs.find(d => d === args[0] || fs.readFileSync(path.join(ROOT, 'src/probes', d, 'spec.md'), 'utf8').split('\n')[0].includes('WCAG ' + args[0]));
    if (!hit) { console.error('no probe for ' + args[0] + '; have: ' + dirs.join(', ')); process.exit(1); }
    console.log(fs.readFileSync(path.join(ROOT, 'src/probes', hit, 'spec.md'), 'utf8'));
  } else { console.log(usage); process.exit(cmd ? 1 : 0); }
} catch (e) { console.error('uxcli: ' + (e.message || e)); process.exit(1); }

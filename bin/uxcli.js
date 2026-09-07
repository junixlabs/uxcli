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
      measure one flow; card by default, --json for the evidence packet; run.json and screenshots for fails in DIR (default .uxcli/<journey>);
      --var substitutes {{k}} in the journey; --refute spawns a fresh second reader per fail (UXCLI_REFUTER, default: claude -p, haiku, Read only) to confirm or dispute it from the images alone; the command, count and cost are printed on stderr before it runs, and on the card
  uxcli run <url> [--json] [--out=DIR] [--refute] [--state=FILE] [--src=DIR] [--prove]
      measure one screen: focus-visible (2.4.7), text-spacing (1.4.12), contrast (1.4.3, axe-core); --state is a Playwright storageState file for signed-in pages; --src is the project's source tree, used to name the design token behind a colour; --prove plants each passing probe's own defect on the page and re-measures, so every pass carries "would fail on …" or a warning that it could not be made to fail
  uxcli sheet [--src=DIR] [--json]    the project's own commitments on its design tokens (uxcli.commitments.json in DIR, default .); provenance project; exit 2 on a broken commitment
  uxcli diff <a.json> <b.json> [--gate] [--json]
      drift between two saved runs (run --json, sheet --json): same / regressed / improved / new / gone per probe or commitment; with --gate exit 2 when b carries a fail
  uxcli discover <repo-dir|url> [--out=DIR] [--json]
      journey candidates as proposals: routes and forms from a Next.js source tree, or forms from a same-origin crawl; written to DIR (default uxcli-proposals/); run refuses a journey whose provenance is proposal until a human sets confirmedBy
  uxcli init [dir]                    copy the shipped skills into dir/.claude/skills/ (existing files kept), create dir/.uxcli/, print the CI step; writes nothing else
  uxcli gate                          run every probe's falsification pair; exit 1 unless all hold
  uxcli why <rule>                    print a probe's definition (e.g. why 3.3.7, why redundant-entry, why 2.4.7)
exit: 0 no fail (findings included) · 2 at least one fail · 1 the run could not be carried out
browser: playwright-core; set UXCLI_CHROME to a Chromium binary if none is installed for playwright.`;
const isUrl = s => /^https?:\/\//i.test(s) || /\.html?$/i.test(s) || s.startsWith('file:');
// Every run leaves run.json next to its screenshots: the packet to attach when disputing a verdict.
const saveRun = (result, outDir) => { fs.mkdirSync(outDir, { recursive: true }); result.uxcli = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version; result.outDir = outDir; fs.writeFileSync(path.join(outDir, 'run.json'), JSON.stringify(result, null, 1) + '\n'); };
try {
  if (cmd === 'run' && args[0] && isUrl(args[0])) {
    const { runPage } = await import('../src/page.js'); const { card } = await import('../src/card.js');
    const url = /^(https?|file):/i.test(args[0]) ? args[0] : pathToFileURL(path.resolve(args[0])).href;
    const outDir = opt('out') || path.join('.uxcli', new URL(url).hostname || 'page');
    const result = await runPage(url, { state: opt('state'), outDir, src: opt('src'), prove: flags.has('--prove') });
    if (flags.has('--refute')) { const { refuteAll } = await import('../src/refute.js'); refuteAll(result.probes); }
    saveRun(result, outDir);
    console.log(flags.has('--json') ? JSON.stringify(result, null, 1) : card(result));
    process.exit(result.error ? 1 : result.probes.some(p => p.verdict === 'fail') ? 2 : 0);
  } else if (cmd === 'run' && args[0]) {
    const { loadJourney } = await import('../src/journey.js'); const { runJourney } = await import('../src/run.js'); const { card } = await import('../src/card.js');
    const outDir = opt('out') || path.join('.uxcli', path.basename(args[0], '.json'));
    const result = await runJourney(loadJourney(path.resolve(args[0]), vars), { outDir });
    if (flags.has('--refute')) { const { refuteAll } = await import('../src/refute.js'); refuteAll(result.probes); }
    saveRun(result, outDir);
    console.log(flags.has('--json') ? JSON.stringify(result, null, 1) : card(result));
    const couldNotRun = result.steps.some(s => s.error) || result.steps.length < result.stepCount;
    process.exit(result.probes.some(p => p.verdict === 'fail') ? 2 : couldNotRun ? 1 : 0);
  } else if (cmd === 'sheet') {
    const { findCommitments, evaluate, sheetCard, FILE } = await import('../src/sheet.js'); const root = path.resolve(opt('src') || '.');
    const file = findCommitments(root); if (!file) { console.log(`no ${FILE} under ${root}: nothing committed, nothing to say`); process.exit(0); }
    const s = evaluate(file, root); console.log(flags.has('--json') ? JSON.stringify(s, null, 1) : sheetCard(s));
    process.exit(s.results.some(r => r.verdict === 'fail') ? 2 : 0);
  } else if (cmd === 'diff' && args[0] && args[1]) {
    const { diff, diffCard, gateExit } = await import('../src/diff.js'); const d = diff(path.resolve(args[0]), path.resolve(args[1]));
    console.log(flags.has('--json') ? JSON.stringify(d, null, 1) : diffCard(d)); process.exit(flags.has('--gate') ? gateExit(d) : 0);
  } else if (cmd === 'discover' && args[0]) {
    const { discoverRepo, discoverUrl, proposals, discoverCard } = await import('../src/discover.js');
    let d; if (/^https?:\/\//i.test(args[0])) { const { launch } = await import('../src/browser.js'); const browser = await launch(); try { d = await discoverUrl(args[0], { browser }); } finally { await browser.close(); } } else d = discoverRepo(path.resolve(args[0]));
    const props = proposals(d); const outDir = opt('out') || 'uxcli-proposals'; fs.mkdirSync(outDir, { recursive: true });
    props.forEach((j, i) => fs.writeFileSync(path.join(outDir, `${String(i + 1).padStart(2, '0')}-${j.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 50)}.json`), JSON.stringify(j, null, 1) + '\n'));
    console.log(flags.has('--json') ? JSON.stringify({ ...d, proposals: props }, null, 1) : discoverCard(d, props));
  } else if (cmd === 'init') {
    const { init, initCard } = await import('../src/init.js'); const r = init(path.resolve(args[0] || '.')); console.log(flags.has('--json') ? JSON.stringify(r, null, 1) : initCard(r));
  } else if (cmd === 'gate') {
    const { gate } = await import('../src/gate.js'); process.exit((await gate()) ? 0 : 1);
  } else if (cmd === 'why' && args[0]) {
    const dirs = fs.readdirSync(path.join(ROOT, 'src/probes'));
    const hit = dirs.find(d => d === args[0] || fs.readFileSync(path.join(ROOT, 'src/probes', d, 'spec.md'), 'utf8').split('\n')[0].includes('WCAG ' + args[0]));
    if (!hit) { console.error('no probe for ' + args[0] + '; have: ' + dirs.join(', ')); process.exit(1); }
    console.log(fs.readFileSync(path.join(ROOT, 'src/probes', hit, 'spec.md'), 'utf8'));
  } else { console.log(usage); process.exit(cmd ? 1 : 0); }
} catch (e) { console.error('uxcli: ' + (e.message || e)); process.exit(1); }

#!/usr/bin/env node
// uxcli — UI/UX review for coding agents. No commitment, no verdict.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [cmd, ...rest] = process.argv.slice(2);
const flags = new Set(rest.filter(a => a.startsWith('--'))); const args = rest.filter(a => !a.startsWith('--'));
const usage = `usage:
  uxcli run <journey.json> [--json]   measure one flow; card by default, --json for the evidence packet
  uxcli gate                          run every probe's falsification pair; exit 1 unless all hold
  uxcli why <rule>                    print a probe's definition (e.g. why 3.3.7, why redundant-entry)
browser: playwright-core; set UXCLI_CHROME to a Chromium binary if none is installed for playwright.`;
try {
  if (cmd === 'run' && args[0]) {
    const { loadJourney } = await import('../src/journey.js'); const { runJourney } = await import('../src/run.js'); const { card } = await import('../src/card.js');
    const result = await runJourney(loadJourney(path.resolve(args[0])));
    console.log(flags.has('--json') ? JSON.stringify(result, null, 1) : card(result));
    process.exit(result.probes.some(p => p.verdict === 'fail') ? 2 : 0);
  } else if (cmd === 'gate') {
    const { gate } = await import('../src/gate.js'); process.exit((await gate()) ? 0 : 1);
  } else if (cmd === 'why' && args[0]) {
    const dirs = fs.readdirSync(path.join(ROOT, 'src/probes'));
    const hit = dirs.find(d => d === args[0] || fs.readFileSync(path.join(ROOT, 'src/probes', d, 'spec.md'), 'utf8').split('\n')[0].includes('WCAG ' + args[0]));
    if (!hit) { console.error('no probe for ' + args[0] + '; have: ' + dirs.join(', ')); process.exit(1); }
    console.log(fs.readFileSync(path.join(ROOT, 'src/probes', hit, 'spec.md'), 'utf8'));
  } else { console.log(usage); process.exit(cmd ? 1 : 0); }
} catch (e) { console.error('uxcli: ' + (e.message || e)); process.exit(1); }

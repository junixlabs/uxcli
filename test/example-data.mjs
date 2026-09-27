// The example project: the contract about shape, read by every suite that needs authored or observed
// data. It lives in examples/crm/ and ships with the package, so a fresh clone runs the gate.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { isRunDir } from '../src/core/target.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const EXAMPLE = path.join(ROOT, 'examples', 'crm');
export const DATA = path.join(EXAMPLE, '.uxcli');
export const read = rel => JSON.parse(fs.readFileSync(path.join(DATA, rel), 'utf8'));
export const text = rel => fs.readFileSync(path.join(DATA, rel), 'utf8');
export const list = dir => fs.existsSync(path.join(DATA, dir)) ? fs.readdirSync(path.join(DATA, dir)).filter(f => f.endsWith('.json')).sort() : [];

// Every run packet on disk, newest first, with the directory it sits in (relative to .uxcli/).
export const runs = () => fs.readdirSync(path.join(DATA, 'runs')).filter(isRunDir).sort().reverse()
  .map(d => ({ dir: `runs/${d}`, run: read(`runs/${d}/run.json`) }))
  .sort((a, b) => String(b.run.ranAt).localeCompare(String(a.run.ranAt)));
// The newest packet of a target, and the older ones — the shape currentRuns() returns.
export const runOf = id => { const xs = runs().filter(x => x.run.id === id); return xs.length ? { run: xs[0].run, history: xs.slice(1).map(x => x.run), dir: xs[0].dir } : null; };
export const runsByTarget = () => { const ids = [...new Set(runs().map(x => x.run.id))]; return ids.map(runOf); };

// The projection's input, built from the example the way journey.js builds it from a project.
export function exampleInput() {
  const C001 = read('commitments/C-001.json');
  return {
    insights: list('understanding/insights').map(f => ({ ...read(`understanding/insights/${f}`), file: `understanding/insights/${f}` })),
    journeys: [read('journeys/handle-inbound-lead.json'), read('journeys/authenticate.json')],
    commitments: [C001, read('commitments/C-002.json'), read('commitments/C-003.json')],
    profiles: [read('profiles/lead-new-unassigned.json'), read('profiles/agent-basic.json')],
    policy: read('policy/policy.json'),
    runs: runsByTarget().map(({ run, history }) => ({ run, history })),
    proposals: list('proposals').map(f => read(`proposals/${f}`)),
    corpusLabels: list('corpus').map(f => read(`corpus/${f}`)),
    probes: [read('probes/project/lead-phone-visible.json')],
    runHashes: { [C001.anchor.run]: C001.anchor.hash },
  };
}

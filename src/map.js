// uxcli map: the journey map page — declared (states, picked mockups), observed (the last run's
// screenshots and whether each state held), the difference, and what the commitments decided, step
// by step, with the understanding beside it. Reads .uxcli/, writes .uxcli/map/index.html. The page
// links the run artifacts and mockup shots where they are; nothing is copied.
import fs from 'node:fs'; import path from 'node:path';
import { findRoot, loadProject, projectionOf } from './journey.js';
import { allRuns } from './adapters/store/runs.js';
import { discover, mockups as photograph } from './mockups.js';
import { mapModel, mapPage, mapCard } from './core/map.js';

const VERSION = JSON.parse(fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'package.json'), 'utf8')).version;
const rel = (from, to) => path.relative(from, to).split(path.sep).join('/');

export async function map(from, { viewport = '390x844', shoot = true } = {}) {
  const root = findRoot(from); const P = loadProject(root); const out = path.join(root, '.uxcli', 'map');
  // mockups: photograph the variants when any exists and the pictures are missing or older than a variant
  const D = discover(root); const shotsDir = path.join(D.base, '.shots');
  const stale = D.screens.some(s => s.variants.some(v => { const png = path.join(shotsDir, s.id, `${v}.png`); return !fs.existsSync(png) || fs.statSync(png).mtimeMs < fs.statSync(path.join(s.dir, `${v}.html`)).mtimeMs; }));
  if (shoot && stale) await photograph(root, { viewport });
  const mocks = Object.fromEntries(D.screens.map(s => [s.id, { pick: s.pick?.pick || null, variants: s.variants, shots: Object.fromEntries(s.variants.filter(v => fs.existsSync(path.join(shotsDir, s.id, `${v}.png`))).map(v => [v, rel(out, path.join(shotsDir, s.id, `${v}.png`))])) }]));
  // the newest journey run per journey
  const runs = {};
  for (const x of allRuns(root)) { const ref = x.run.journey?.ref; if (!ref) continue; const id = path.basename(ref, '.json'); if (!runs[id]) runs[id] = { run: x.run, base: rel(out, x.at) }; }
  let level = null; try { level = projectionOf(P).level; } catch {}
  const m = mapModel({
    project: P.project, journeys: P.journeys.map(j => j.value).filter(Boolean), commitments: P.commitments.map(c => c.value).filter(Boolean),
    actors: P.actors.map(a => a.value).filter(Boolean), insights: P.insights.map(i => i.value && { ...i.value, file: i.file }).filter(Boolean),
    runs, mockups: mocks, level, version: VERSION,
  });
  m.generatedAt = new Date().toISOString();
  fs.mkdirSync(out, { recursive: true });
  const page = path.join(out, 'index.html'); fs.writeFileSync(page, mapPage(m));
  return { ...m, page: path.relative(process.cwd(), page) || page, problems: P.problems };
}
export { mapCard };

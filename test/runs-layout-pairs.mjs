import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { newRunDir, artifactsDir, allRuns, currentRuns, prune, KEEP } from '../src/adapters/store/runs.js';
import { isRunDir } from '../src/core/target.js';
export const OPERATOR = 'two runs of one target writing a screenshot under the same name — which, in one shared directory, leaves the first packet pointing at the second run\'s picture; against the same two runs each in a directory made for it, where each packet sits beside the image it was measured from. And the rest of the layout held to its shape: the latest run decided by ranAt and not by any file\'s position, a history pruned to its keep per target, and a run a commitment anchors to that prune may not touch.';
const readOr = (f, missing = '(no such file)') => { try { return fs.readFileSync(f, 'utf8'); } catch { return missing; } };
const write = (dir, name, body) => { fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true }); fs.writeFileSync(path.join(dir, name), body); };
const packet = (id, ranAt) => JSON.stringify({ id, ranAt, probes: [], steps: [{ i: 0, shot: 'step-0.jpg' }] });
export function pair() {
  const problems = []; let checks = 0;
  const is = (got, want, what) => { checks++; if (got !== want) problems.push(`${what}: ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`); };
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-runs-'));
  try {
    is(allRuns(root).length, 0, 'a project with no runs has none');
    // The pair. Two runs of one target, same picture name.
    const one = newRunDir(root, '2026-09-23T09:00:00.000Z');
    write(one, 'run.json', packet('j-x', '2026-09-23T09:00:00.000Z')); write(artifactsDir(one), 'step-0.jpg', 'PICTURE-FROM-RUN-ONE');
    const two = newRunDir(root, '2026-09-24T09:00:00.000Z');
    write(two, 'run.json', packet('j-x', '2026-09-24T09:00:00.000Z')); write(artifactsDir(two), 'step-0.jpg', 'PICTURE-FROM-RUN-TWO');
    checks++; if (one === two) problems.push('two runs were handed the same directory');
    is(readOr(path.join(artifactsDir(one), 'step-0.jpg')), 'PICTURE-FROM-RUN-ONE', 'the first packet still sits beside the picture it was measured from');
    is(readOr(path.join(artifactsDir(two), 'step-0.jpg')), 'PICTURE-FROM-RUN-TWO', 'and the second has its own');
    is(isRunDir(path.basename(one)) && isRunDir(path.basename(two)), true, 'both directories have the run shape');
    is(fs.existsSync(path.join(one, 'history')), false, 'no history directory is ever grown');
    // The latest run is a fact about ranAt. Write the newer run into a directory that sorts FIRST
    // by name, and the index must still call the newer one current.
    const cur = currentRuns(root);
    is(cur.length, 1, 'two runs of one target are one entry');
    is(cur[0]?.run.ranAt, '2026-09-24T09:00:00.000Z', 'the current run is the newer by ranAt');
    is(cur[0]?.history.length, 1, 'and the older one is its history');
    // Prune: keep bounds each target, not the whole store. Five more runs of j-x, keep 3 → four go;
    // one run of j-y is untouched.
    let oldest = null, mid = null;
    for (let d = 10; d < 15; d++) { const dir = newRunDir(root, `2026-09-${d}T09:00:00.000Z`); write(dir, 'run.json', packet('j-x', `2026-09-${d}T09:00:00.000Z`)); if (d === 10) oldest = dir; if (d === 12) mid = dir; }
    const y = newRunDir(root, '2026-09-01T09:00:00.000Z'); write(y, 'run.json', packet('j-y', '2026-09-01T09:00:00.000Z'));
    // The anchored run is the oldest of seven: outside any keep of 3, so only the anchor can save it.
    const r = prune(root, { keep: 3, pinned: [`runs/${path.basename(oldest)}`] });
    const left = currentRuns(root);
    is(left.find(t => t.run.id === 'j-x')?.history.length, 3, 'keep 3 leaves three past runs of j-x: two by keep, one by anchor');
    is(fs.existsSync(oldest), true, 'the anchored run survived the prune');
    is(fs.existsSync(mid), false, 'an unanchored run outside the keep did not');
    is(fs.existsSync(one), true, 'a run inside the keep stays whether or not it is anchored');
    is(left.find(t => t.run.id === 'j-y')?.run.ranAt, '2026-09-01T09:00:00.000Z', 'the other target lost nothing');
    is(r.dropped.length, 3, 'three directories were dropped');
    is(KEEP, 7, 'the default keep is seven runs per target');
    // A directory not of the run shape is not a run, and is left alone.
    write(path.join(root, '.uxcli', 'runs', 'j-old'), 'run.json', packet('j-old', '2026-09-20T09:00:00.000Z'));
    is(allRuns(root).some(x => x.run.id === 'j-old'), false, 'an old-layout directory is not read as a run');
    is(fs.existsSync(path.join(root, '.uxcli', 'runs', 'j-old')), true, 'and prune does not delete it');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
  return { ok: problems.length === 0, checks, problems };
}

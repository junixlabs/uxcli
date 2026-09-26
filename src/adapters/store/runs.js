// The one place that knows how a project's evidence sits on disk.
//
//   <project>/.uxcli/
//     index.json                     the projection (derived, rebuildable — written by journey.js)
//     runs/<targetId>/
//       run.json                     the current run
//       step-0.jpg …                 its screenshots
//       history/<ranAt>/
//         run.json                   a run it replaced
//         step-0.jpg …               and that run's own screenshots
//
// Rotation, rather than overwriting in place, because a packet's `shot` names a file: overwrite
// step-0.jpg and every archived packet beside it starts pointing at a picture from a different run.
// The move keeps each packet with the images it was measured from.
import fs from 'node:fs'; import path from 'node:path';
import { RUNS, HISTORY, stampOf } from '../../core/target.js';

export const UXCLI = '.uxcli';
export const KEEP = 7;

export const runsDir = root => path.join(root, UXCLI, RUNS);
export const dirFor = (root, targetId) => path.join(runsDir(root), targetId || 'unidentified');
export const historyDir = dir => path.join(dir, HISTORY);

const readJson = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
const isShot = f => /\.(jpe?g|png)$/i.test(f);

// Every run a target still has on disk, newest first, the current one included.
export function historyOf(dir) {
  const out = [];
  const now = readJson(path.join(dir, 'run.json'));
  if (now) out.push({ at: dir, ranAt: now.ranAt || null, current: true, run: now });
  const h = historyDir(dir);
  if (fs.existsSync(h)) {
    for (const name of fs.readdirSync(h).sort().reverse()) {
      const run = readJson(path.join(h, name, 'run.json'));
      if (run) out.push({ at: path.join(h, name), ranAt: run.ranAt || name, current: false, run });
    }
  }
  return out.sort((a, b) => String(b.ranAt).localeCompare(String(a.ranAt)));
}

// Every target on disk as { run, history }: its current packet and the ones it replaced, newest first.
export function currentRuns(root) {
  const dir = runsDir(root); if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).map(d => historyOf(path.join(dir, d))).filter(h => h.length)
    .map(h => ({ run: h.find(x => x.current)?.run || h[0].run, history: h.filter(x => !x.current).map(x => x.run) }));
}

// Move whatever is in the directory now into history/<its ranAt>/, then drop the oldest past `keep`.
// Called before a new run writes, so the directory a run writes into is always empty of an earlier
// one. A directory with nothing in it is the ordinary first case and does nothing.
export function rotate(dir, { keep = KEEP } = {}) {
  const current = readJson(path.join(dir, 'run.json'));
  if (current) {
    const to = path.join(historyDir(dir), stampOf(current.ranAt));
    if (!fs.existsSync(to)) {
      fs.mkdirSync(to, { recursive: true });
      for (const f of fs.readdirSync(dir)) {
        if (f === HISTORY) continue;
        if (f === 'run.json' || isShot(f)) fs.renameSync(path.join(dir, f), path.join(to, f));
      }
    }
  }
  return prune(dir, keep);
}

export function prune(dir, keep = KEEP) {
  const h = historyDir(dir);
  if (!fs.existsSync(h)) return { kept: 0, dropped: [] };
  const past = fs.readdirSync(h).sort().reverse();
  const dropped = past.slice(Math.max(0, keep - 1));
  for (const name of dropped) fs.rmSync(path.join(h, name), { recursive: true, force: true });
  if (!fs.readdirSync(h).length) fs.rmdirSync(h);
  return { kept: past.length - dropped.length, dropped };
}


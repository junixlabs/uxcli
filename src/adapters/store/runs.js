// The one place that knows how a project's evidence sits on disk.
//
//   <project>/.uxcli/
//     index.json                     every run this project has recorded
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
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
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

// ── the index, which now lives in the project ────────────────────────────────
//
// It used to be one file in the home directory holding every run of every project. That made the
// home copy the only record: clone the repo somewhere else and its evidence arrived with no list
// naming it, and the machine that had the list could disagree with the disk that had the packets.
// A project's runs now travel with the project, and the home file is reduced to what it is actually
// for — which projects this machine has seen, so one viewer can find them all.
//
// One row per target, replaced in place. History is on disk under that target, not here.
export const indexPath = root => path.join(root, UXCLI, 'index.json');

export function readIndex(root) {
  const j = readJson(indexPath(root));
  return j && Array.isArray(j.runs) ? j : { runs: [] };
}

export function writeIndex(root, idx) {
  fs.mkdirSync(path.join(root, UXCLI), { recursive: true });
  fs.writeFileSync(indexPath(root), JSON.stringify(idx, null, 1) + '\n');
  return indexPath(root);
}

export function putRow(root, row) {
  const idx = readIndex(root);
  idx.runs = [row, ...idx.runs.filter(r => r.dir !== row.dir)];
  return writeIndex(root, idx);
}

export function dropRow(root, dir) {
  const idx = readIndex(root);
  idx.runs = idx.runs.filter(r => r.dir !== dir);
  return writeIndex(root, idx);
}

// ── the home file, reduced to a list of places ───────────────────────────────
//
// One viewer on this machine has to find projects it was never told about in this process, so
// something outside them has to remember where they are. That is all this holds: no verdicts, no
// counts, no rows. Delete it and you lose the list of projects, never a run and never a packet —
// which is what the split always claimed and, while the runs lived here too, was not true.
export const HOME = path.join(os.homedir(), UXCLI);
export const SEEN = path.join(HOME, 'projects.json');

export function seenProjects() {
  const j = readJson(SEEN);
  return j && Array.isArray(j.projects) ? j.projects : [];
}

export function noteProject(root) {
  try {
    const at = path.resolve(root);
    const list = seenProjects().filter(p => p.root !== at);
    list.unshift({ root: at, lastRun: new Date().toISOString() });
    fs.mkdirSync(HOME, { recursive: true });
    fs.writeFileSync(SEEN, JSON.stringify({ projects: list }, null, 1) + '\n');
  } catch { /* a machine with no writable home simply has no list; that must never fail a run */ }
}

// Every row this machine can reach, read from the projects that own them. A project whose directory
// is gone contributes nothing and is reported by its absence, not by a stale row.
export function allRows() {
  const out = [];
  for (const p of seenProjects()) {
    if (!fs.existsSync(p.root)) continue;
    for (const r of readIndex(p.root).runs) out.push(r);
  }
  return out.sort((a, b) => String(b.ranAt).localeCompare(String(a.ranAt)));
}

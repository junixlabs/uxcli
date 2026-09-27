// The one place that knows how a project's evidence sits on disk.
//
//   <project>/.uxcli/
//     index.json                     the projection (derived, rebuildable — written by journey.js)
//     runs/R-<ranAt>-<six>/
//       run.json                     the packet; what an anchor hashes
//       artifacts/<name>.png         the pictures that packet's `shot` fields name
//
// One run, one directory, made once. Nothing is ever rotated or overwritten: a packet stays beside
// the pictures it was measured from because no later run can reach that directory. "The latest run
// of a target" is a question answered by reading `ranAt`, never by a file's position.
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
import { RUNS, ARTIFACTS, runDirName, isRunDir, targetKeyOf } from '../../core/target.js';

export const UXCLI = '.uxcli';
export const KEEP = 7;

export const runsDir = root => path.join(root, UXCLI, RUNS);
export const artifactsDir = dir => path.join(dir, ARTIFACTS);

const six = () => crypto.randomBytes(4).readUInt32BE(0).toString(36).padStart(6, '0').slice(-6);
const readJson = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
const byTime = (a, b) => String(b.run?.ranAt || '').localeCompare(String(a.run?.ranAt || '')) || String(b.at).localeCompare(String(a.at));

// A fresh directory for a run that is about to happen. Refuses to hand back one that exists.
export function newRunDir(root, ranAt) {
  for (let i = 0; i < 8; i++) {
    const dir = path.join(runsDir(root), runDirName(ranAt, six()));
    if (fs.existsSync(dir)) continue;
    fs.mkdirSync(artifactsDir(dir), { recursive: true });
    return dir;
  }
  throw new Error('could not find an unused run directory name');
}

// Every run on disk, newest first: { at: dir, run }.
export function allRuns(root) {
  const dir = runsDir(root); if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(isRunDir).map(d => ({ at: path.join(dir, d), run: readJson(path.join(dir, d, 'run.json')) }))
    .filter(x => x.run).sort(byTime);
}

// Every target on disk as { run, history }: its newest packet and the older ones, newest first.
export function currentRuns(root) {
  const groups = new Map();
  for (const x of allRuns(root)) { const k = targetKeyOf(x.run); (groups.get(k) || groups.set(k, []).get(k)).push(x); }
  return [...groups.values()].map(xs => ({ run: xs[0].run, history: xs.slice(1).map(x => x.run) }));
}

// Newest `keep` runs of each target stay; the rest go — except a run something still points at. A
// commitment's anchor names a run directory, and deleting it would leave a signature over nothing.
export function prune(root, { keep = KEEP, pinned = [] } = {}) {
  const pin = new Set([...pinned].map(p => path.basename(String(p).replace(/\/+$/, ''))));
  const groups = new Map();
  for (const x of allRuns(root)) { const k = targetKeyOf(x.run); (groups.get(k) || groups.set(k, []).get(k)).push(x); }
  const dropped = []; let kept = 0;
  for (const xs of groups.values()) {
    xs.forEach((x, i) => {
      if (i < keep || pin.has(path.basename(x.at))) { kept++; return; }
      fs.rmSync(x.at, { recursive: true, force: true }); dropped.push(path.basename(x.at));
    });
  }
  return { kept, dropped };
}

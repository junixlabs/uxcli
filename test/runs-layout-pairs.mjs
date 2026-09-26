import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { rotate, prune, historyOf, dirFor, KEEP }
  from '../src/adapters/store/runs.js';
import { outDirFor, historyDirFor, stampOf } from '../src/core/target.js';

export const OPERATOR = 'two runs of one target writing a screenshot under the same name, where the second overwrites the first in place and the archived packet is left pointing at a picture taken from a different run — which is what happens without rotation; against the same two runs rotated, where each packet sits beside the image it was measured from. And the rest of the layout held to its shape: a first run with nothing to rotate and a history pruned to its keep.';

// Read what is there, and say what is missing rather than throwing: the planted defect this pair
// exists for is a file that is NOT where it should be, and a pair that dies on it reports nothing.
const readOr = (f, missing = '(no such file)') => { try { return fs.readFileSync(f, 'utf8'); } catch { return missing; } };
const write = (dir, name, body) => { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, name), body); };
const runAt = (ranAt, url = 'http://a.test/x') => JSON.stringify({ url, ranAt, probes: [], steps: [{ i: 0, shot: 'step-0.jpg' }] });

export function pair() {
  const problems = [];
  let checks = 0;
  const is = (got, want, what) => { checks++; if (got !== want) problems.push(`${what}: ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`); };
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-runs-'));

  try {
    const dir = path.join(root, '.uxcli', outDirFor({ url: 'http://a.test/x' }));

    // must-pass: a directory with nothing in it rotates to nothing, which is every first run.
    is(rotate(dir).kept, 0, 'a first run has nothing to archive');
    is(fs.existsSync(path.join(dir, 'history')), false, 'and grows no history directory');

    // The pair. Run one writes its packet and its picture.
    write(dir, 'run.json', runAt('2026-09-23T09:00:00.000Z'));
    write(dir, 'step-0.jpg', 'PICTURE-FROM-RUN-ONE');

    // Run two: rotate first, then write. This is the order bin/uxcli.js uses, and the reason it
    // does — the browser writes screenshots into the directory as the run goes, so anything left
    // there is gone by the time the packet is saved.
    rotate(dir);
    write(dir, 'run.json', runAt('2026-09-24T09:00:00.000Z'));
    write(dir, 'step-0.jpg', 'PICTURE-FROM-RUN-TWO');

    const archived = path.join(dir, 'history', stampOf('2026-09-23T09:00:00.000Z'));
    is(fs.existsSync(archived), true, 'the replaced run is kept under its own timestamp');
    is(readOr(path.join(archived, 'step-0.jpg')), 'PICTURE-FROM-RUN-ONE',
      'the archived packet sits beside the picture it was measured from');
    is(readOr(path.join(dir, 'step-0.jpg')), 'PICTURE-FROM-RUN-TWO',
      'and the current run has its own');
    is(JSON.parse(readOr(path.join(archived, 'run.json'), '{}')).ranAt ?? null,
      '2026-09-23T09:00:00.000Z', 'the archived packet is the older one');

    // The path a history entry lands at is the one core/target.js names, so a reader can build it
    // without asking the filesystem.
    is(path.join(root, '.uxcli', historyDirFor({ url: 'http://a.test/x' }, '2026-09-23T09:00:00.000Z')),
      archived, 'the archived path is the one the pure half names');

    // Newest first, current included.
    const h = historyOf(dir);
    is(h.length, 2, 'history lists both runs');
    is(h[0]?.current ?? null, true, 'newest first, and the newest is the current one');
    is(h[1]?.ranAt ?? null, '2026-09-23T09:00:00.000Z', 'the older run follows it');

    // must-pass: keep bounds the directory. Five more runs, keep 3 → the two oldest go.
    for (let d = 10; d < 15; d++) {
      rotate(dir, { keep: 3 });
      write(dir, 'run.json', runAt(`2026-09-${d}T09:00:00.000Z`));
    }
    is((fs.existsSync(path.join(dir, 'history')) ? fs.readdirSync(path.join(dir, 'history')) : []).length, 2, 'keep 3 leaves two past runs beside the current');
    is(historyOf(dir).length, 3, 'which is three runs in all');
    is(KEEP, 7, 'the default keep is seven runs per target');

    // prune on a target that never had history is not an error.
    const fresh = path.join(root, '.uxcli', outDirFor({ url: 'http://b.test/' }));
    fs.mkdirSync(fresh, { recursive: true });
    is(prune(fresh).kept, 0, 'pruning a target with no history does nothing');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }

  return { ok: problems.length === 0, checks, problems };
}

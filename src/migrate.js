// uxcli migrate: move a project's .uxcli/ forward to the layout this uxcli reads.
//
// Layout v0.1 → v0.2. Four moves, each mechanical, none of them a judgement:
//   1. understanding/<actor>.json          →  understanding/actors/<actor>.json (no insights inside)
//                                             understanding/insights/<id>.json  (about: actor:<name>)
//   2. runs/<target>/{run.json,*.png}       →  runs/R-<when>-<six>/{run.json, artifacts/*.png}
//      runs/<target>/history/<when>/…       →  the same, one directory per run, no history/
//      run.json is MOVED, never rewritten: an anchor hashes it, and a byte changed is a signature broken.
//   3. every reference to a moved thing is rewritten where it is cited: trace[] entries of the form
//      `understanding/x.json#I-001` → `understanding/insights/I-001.json`; `source.doc` of an actor file;
//      `anchor.run` / `evidence[].run` naming an old run directory.
//   4. `schema_version` is added to every authored file that lacks it (journeys 2, the rest 1).
// index.json is deleted: it is a projection and the next `init` or `run` rebuilds it.
//
// Prints the plan by default; --apply writes. Idempotent: a migrated project reports nothing to do.
import fs from 'node:fs'; import path from 'node:path';
import { UXCLI } from './adapters/store/runs.js';
import { RUNS, ARTIFACTS, runDirName, isRunDir, hash6 } from './core/target.js';

const readJson = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const writeJson = (f, v) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(v, null, 2) + '\n'); };
const listJson = dir => fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().map(f => path.join(dir, f)) : [];
const isShot = f => /\.(jpe?g|png)$/i.test(f);
const VERSIONS = { journeys: 2, commitments: 1, profiles: 1, 'policy': 1, 'understanding/actors': 1, 'understanding/insights': 1 };

export function migrate(root, { apply = false } = {}) {
  const U = path.join(root, UXCLI);
  const problems = [], moves = [], rewrites = [], versions = [];
  if (!fs.existsSync(U)) return { root, apply, moves, rewrites, versions, problems: [`no ${UXCLI}/ under ${root}`] };
  const rel = f => path.relative(U, f).split(path.sep).join('/');

  // 1. understanding split — collected as (from → files to write), applied after the plan is printed.
  const insightRef = new Map(); // 'understanding/x.json#I-1' → 'understanding/insights/I-1.json'
  const actorDoc = new Map();   // 'understanding/x.json' → 'understanding/actors/x.json'
  const writes = [];
  for (const f of listJson(path.join(U, 'understanding'))) {
    const doc = readJson(f); const base = path.basename(f);
    if (!doc.actor) { problems.push(`${rel(f)}: not an actor file; move it by hand`); continue; }
    const { insights = [], ...actor } = doc;
    const to = path.join(U, 'understanding', 'actors', base);
    writes.push({ file: to, doc: { schema_version: 1, ...actor } });
    moves.push({ from: rel(f), to: rel(to), what: 'actor' });
    actorDoc.set(rel(f), rel(to));
    for (const i of insights) {
      if (!i?.id) { problems.push(`${rel(f)}: an insight without an id cannot become a file`); continue; }
      const tf = path.join(U, 'understanding', 'insights', `${i.id}.json`);
      writes.push({ file: tf, doc: { schema_version: 1, id: i.id, about: `actor:${doc.actor}`, ...i } });
      moves.push({ from: `${rel(f)}#${i.id}`, to: rel(tf), what: 'insight' });
      insightRef.set(`${rel(f)}#${i.id}`, rel(tf));
    }
    writes.push({ remove: f });
  }

  // 2. runs flattened. The six characters are a hash of the old path, so a second run of migrate on
  //    a half-moved tree lands the same directory names.
  const runRef = new Map(); // 'runs/<old>' → 'runs/R-…'
  const runMoves = [];
  const runsDir = path.join(U, RUNS);
  if (fs.existsSync(runsDir)) for (const d of fs.readdirSync(runsDir)) {
    if (isRunDir(d)) continue;
    const old = path.join(runsDir, d); if (!fs.statSync(old).isDirectory()) continue;
    const one = (dir, oldRel) => {
      const rj = path.join(dir, 'run.json'); if (!fs.existsSync(rj)) return;
      let ranAt = null; try { ranAt = readJson(rj).ranAt; } catch { problems.push(`${oldRel}/run.json does not parse`); return; }
      const name = runDirName(ranAt, hash6(oldRel)); const to = path.join(runsDir, name);
      runMoves.push({ dir, to, files: fs.readdirSync(dir).filter(f => f === 'run.json' || isShot(f)) });
      moves.push({ from: oldRel, to: `${RUNS}/${name}`, what: 'run' });
      runRef.set(oldRel, `${RUNS}/${name}`);
    };
    one(old, `${RUNS}/${d}`);
    const h = path.join(old, 'history');
    if (fs.existsSync(h)) for (const s of fs.readdirSync(h).sort()) one(path.join(h, s), `${RUNS}/${d}/history/${s}`);
  }

  // 3. references, wherever a declaration cites a moved thing. A `source.doc` that named the actor
  //    file follows its quote: the words may now live in an insight file, and a citation is its words.
  const textOf = new Map(writes.filter(w => w.file).map(w => [rel(w.file), JSON.stringify(w.doc).replace(/\s+/g, ' ')]));
  const holds = (file, quote) => quote && textOf.has(file) && textOf.get(file).includes(String(quote).replace(/\s+/g, ' '));
  const mapRef = (v, quote) => {
    if (typeof v !== 'string') return v;
    if (insightRef.has(v)) return insightRef.get(v);
    if (actorDoc.has(v)) {
      const actor = actorDoc.get(v);
      if (!quote || holds(actor, quote)) return actor;
      const inInsight = [...insightRef.values()].find(f => holds(f, quote));
      return inInsight || actor;
    }
    if (runRef.has(v.replace(/\/+$/, ''))) return runRef.get(v.replace(/\/+$/, ''));
    return v;
  };
  const walk = (v, at, hits, parent) => {
    if (Array.isArray(v)) return v.map((x, i) => walk(x, `${at}[${i}]`, hits, parent));
    if (v && typeof v === 'object') { const o = {}; for (const [k, x] of Object.entries(v)) o[k] = walk(x, `${at}.${k}`, hits, v); return o; }
    const m = mapRef(v, /\.source\.doc$/.test(at) ? parent?.quote : null); if (m !== v) hits.push({ at, from: v, to: m }); return m;
  };
  const authored = ['journeys', 'commitments', 'profiles', 'policy', 'proposals', 'corpus'];
  const fileWrites = [];
  for (const dir of authored) for (const f of listJson(path.join(U, dir))) {
    let doc; try { doc = readJson(f); } catch { problems.push(`${rel(f)} does not parse`); continue; }
    const hits = []; let out = walk(doc, rel(f), hits);
    for (const h of hits) rewrites.push(h);
    // 4. schema_version
    const want = VERSIONS[dir];
    if (want && out.schema_version === undefined) { out = { schema_version: want, ...out }; versions.push({ file: rel(f), schema_version: want }); }
    if (hits.length || (want && doc.schema_version === undefined)) fileWrites.push({ file: f, doc: out });
  }
  const index = path.join(U, 'index.json'); const dropIndex = fs.existsSync(index) && (moves.length || rewrites.length || versions.length);

  if (apply) {
    for (const m of runMoves) { fs.mkdirSync(path.join(m.to, ARTIFACTS), { recursive: true }); for (const f of m.files) fs.renameSync(path.join(m.dir, f), f === 'run.json' ? path.join(m.to, f) : path.join(m.to, ARTIFACTS, f)); }
    for (const d of fs.existsSync(runsDir) ? fs.readdirSync(runsDir) : []) if (!isRunDir(d)) fs.rmSync(path.join(runsDir, d), { recursive: true, force: true });
    for (const w of writes) w.remove ? fs.rmSync(w.remove) : writeJson(w.file, w.doc);
    for (const w of fileWrites) writeJson(w.file, w.doc);
    if (dropIndex) fs.rmSync(index);
  }
  return { root, apply, moves, rewrites, versions, indexDropped: !!dropIndex, problems };
}

export function migrateCard(r) {
  const L = [`uxcli migrate · ${r.root}          ${r.apply ? 'applied' : 'nothing written — this is the plan'}`, ''];
  const n = r.moves.length + r.rewrites.length + r.versions.length;
  if (!n && !r.problems.length) { L.push('  nothing to do: the layout is the one this uxcli reads'); return L.join('\n'); }
  if (r.moves.length) { L.push('  moves'); for (const m of r.moves) L.push(`    ${m.what.padEnd(8)} ${m.from}  →  ${m.to}`); }
  if (r.rewrites.length) { L.push('', '  references rewritten'); for (const x of r.rewrites) L.push(`    ${x.at}: ${x.from}  →  ${x.to}`); }
  if (r.versions.length) { L.push('', '  schema_version added'); for (const v of r.versions) L.push(`    ${v.file}: ${v.schema_version}`); }
  if (r.indexDropped) L.push('', '  index.json removed; the next init or run rebuilds it');
  if (r.problems.length) { L.push('', '  problems'); for (const p of r.problems) L.push(`    - ${p}`); }
  if (!r.apply && n) L.push('', '  uxcli migrate --apply    write the above. run.json files are moved, never rewritten.');
  L.push('', '  if the project ignores .uxcli/proposals/, stop: a commitment cites the proposal it came from, so proposals travel with the repo.');
  return L.join('\n');
}

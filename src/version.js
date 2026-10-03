// Versions on disk: .uxcli/versions/<journey>/<name>.json, one file per version, created and never
// edited. A version names a run under .uxcli/runs/; that run is then pinned against pruning.
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
import { parseVersion } from './core/model/version.js';
import { journeyName } from './core/experience.js';
import { allRuns, UXCLI } from './adapters/store/runs.js';

const readJson = f => JSON.parse(fs.readFileSync(f, 'utf8'));
export const versionsDir = root => path.join(root, UXCLI, 'versions');

// Every version on disk, oldest first within a journey: { file, value } or { file, problems }.
export function versions(root) {
  const base = versionsDir(root); const out = [];
  if (!fs.existsSync(base)) return out;
  for (const j of fs.readdirSync(base).sort()) {
    const dir = path.join(base, j); if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.json')).sort()) {
      const file = path.join(dir, f); let r;
      try { r = parseVersion(readJson(file)); } catch (e) { r = { value: null, problems: [e.message] }; }
      if (r.value && (r.value.journey !== j || `${r.value.name}.json` !== f)) r = { value: null, problems: [`journey and name must match the path ${j}/${f}`] };
      out.push({ file, ...r });
    }
  }
  return out.sort((a, b) => String(a.value?.at || '').localeCompare(String(b.value?.at || '')));
}

// The run directories some version names: pruning keeps them.
export const pinnedRuns = root => versions(root).filter(v => v.value).map(v => v.value.run);

const gitHead = cwd => { try { return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || null; } catch { return null; } };

// Name a walk. `run` is a run directory; without it, the journey's newest walk with steps.
export function saveVersion(root, journey, name, { run = null, note = null, by, at = new Date().toISOString(), proposal = null } = {}) {
  const runs = allRuns(root);
  const hit = run ? runs.find(x => path.resolve(x.at) === path.resolve(run) || path.basename(x.at) === path.basename(run)) : runs.find(x => journeyName(x.run) === journey && (x.run.steps || []).length);
  if (!hit) return { problems: [run ? `no run ${run} under .uxcli/runs/` : `no walk of ${journey} with steps under .uxcli/runs/ — run it first`] };
  if (journeyName(hit.run) !== journey) return { problems: [`${path.basename(hit.at)} is a walk of ${journeyName(hit.run)}, not ${journey}`] };
  const doc = { schema_version: 1, journey, name, run: `runs/${path.basename(hit.at)}`, at, by, ...(note && { note }), ...(gitHead(root) && { build: gitHead(root) }), ...(proposal && { proposal }) };
  const r = parseVersion(doc); if (!r.value) return { problems: r.problems };
  const file = path.join(versionsDir(root), journey, `${name}.json`);
  if (fs.existsSync(file)) return { problems: [`${path.relative(root, file)} exists — a version is never rewritten; give the new one another name`] };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(doc, null, 1) + '\n');
  return { file, value: r.value };
}

// A version's walk: its run directory and packet.
export function versionRun(root, journey, name) {
  const v = versions(root).find(x => x.value && x.value.journey === journey && x.value.name === name);
  if (!v) return null;
  const dir = path.join(root, UXCLI, v.value.run); const f = path.join(dir, 'run.json');
  return fs.existsSync(f) ? { dir, run: readJson(f), version: v.value } : { dir, run: null, version: v.value };
}

export function versionListCard(root) {
  const list = versions(root); const L = ['uxcli version · named walks of each journey, kept and comparable', ''];
  if (!list.length) L.push('  none yet — after a walk: uxcli version save <journey> <name> --note="what changed"');
  let j = null;
  for (const v of list) {
    if (!v.value) { L.push(`  problem ${path.relative(root, v.file)}: ${v.problems.join('; ')}`); continue; }
    if (v.value.journey !== j) { j = v.value.journey; L.push(`  ${j}`); }
    const missing = !fs.existsSync(path.join(root, UXCLI, v.value.run, 'run.json'));
    L.push(`    ${v.value.name.padEnd(12)} ${v.value.at.slice(0, 16)} · ${v.value.by.type} ${v.value.by.ref}${v.value.build ? ` · ${v.value.build}` : ''}${missing ? ' · its run is gone' : ''}${v.value.note ? ` — ${v.value.note}` : ''}`);
  }
  L.push('', '  uxcli experience . --journey=<id> --from=<name> --to=<name> --page    two versions, step by step');
  return L.join('\n');
}

// The designer on disk: the shipped catalog (skills/uxcli/designer/catalog.json and the catalog.md an
// agent reads, installed with the skill), a global profile and a project one that wins field by field,
// the project's decisions, and the taste learned from them. The model is pure (src/core/model/catalog.js,
// src/core/model/designer.js, src/core/designer/learn.js); this reads and writes files.
import fs from 'node:fs'; import path from 'node:path';
import { parseCatalog, catalogMarkdown, AXES } from './core/model/catalog.js';
import { parseProfile, parseDecision, mergeProfiles, neutralProfile } from './core/model/designer.js';
import { learn, promotions } from './core/designer/learn.js';
import { globalDir, projectDir, readJson, listJson, create, rewrite, globalDecisions } from './adapters/store/designer.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const DESIGNER_DIR = path.join(ROOT, 'skills', 'uxcli', 'designer');

export function catalog() {
  const r = parseCatalog(JSON.parse(fs.readFileSync(path.join(DESIGNER_DIR, 'catalog.json'), 'utf8')));
  return { value: r.value, problems: r.problems.map(p => `catalog.json: ${p}`) };
}
export { catalogMarkdown };
export const shown = f => rel(f);

const rel = f => { const r = path.relative(process.cwd(), f); return !r || r.startsWith('..') ? f : r; };
const projectId = root => { try { return JSON.parse(fs.readFileSync(path.join(root, '.uxcli', 'project.json'), 'utf8')).id || path.basename(root); } catch { return path.basename(root); } };

// Everything the designer reads, parsed, with every problem kept beside the file it came from.
export function designerState(root) {
  const cat = catalog(); const problems = [...cat.problems];
  const prof = (file, project) => { const doc = readJson(file); if (!doc) return null; const r = parseProfile(doc, { catalog: cat.value, project }); problems.push(...r.problems.map(p => `${rel(file)}: ${p}`)); return r.value; };
  const gFile = path.join(globalDir(), 'profile.json'), pFile = root ? path.join(projectDir(root), 'profile.json') : null;
  const global = prof(gFile, false), project = pFile ? prof(pFile, true) : null;
  const effective = mergeProfiles(global, project);
  const decisions = root ? listJson(path.join(projectDir(root), 'decisions')).map(file => {
    const r = parseDecision(readJson(file), { profile: effective, catalog: cat.value }); problems.push(...r.problems.map(p => `${rel(file)}: ${p}`));
    return { file, value: r.value };
  }) : [];
  return { root, catalog: cat.value, files: { global: gFile, project: pFile }, global, project, effective, decisions, problems };
}

export function initDesigner(root, { global = false, apply = false, by, when = new Date().toISOString().slice(0, 10) }) {
  const file = global ? path.join(globalDir(), 'profile.json') : path.join(projectDir(root), 'profile.json');
  const status = fs.existsSync(file) ? 'kept' : 'create';
  if (apply && status === 'create') create(file, neutralProfile(by, when));
  return { file, status, applied: apply };
}

export function learnDesigner(root, { apply = false } = {}) {
  const s = designerState(root); const project = projectId(root);
  const mine = s.decisions.filter(d => d.value).map(d => ({ project, decision: d.value }));
  const local = learn(mine);
  if (apply) {
    rewrite(path.join(projectDir(root), 'taste.json'), { schema_version: 1, derived: 'uxcli designer learn — do not edit; it is rewritten from decisions/', taste: local.taste });
    // a decision the project let the designer learn from globally is copied to the global store, where taste across projects is counted
    for (const { decision: d } of mine) if (d.resolution.state !== 'open' && d.learn.scope === 'global') rewrite(path.join(globalDir(), 'decisions', project, `${d.id}.json`), d);
  }
  const everywhere = learn(globalDecisions().map(({ project: p, file }) => ({ project: p, decision: readJson(file) })).filter(r => r.decision?.resolution && r.decision?.learn));
  if (apply) rewrite(path.join(globalDir(), 'taste.json'), { schema_version: 1, derived: 'uxcli designer learn — do not edit; counted from decisions/<project>/', taste: everywhere.taste });
  return { project, local, everywhere, problems: s.problems,
    promote: [...promotions(local.taste, s.project, 'project'), ...promotions(everywhere.taste, s.global, 'global')], files: s.files };
}

const codes = c => c ? c.codes.join(', ') + (c.from === 'project' ? ' (project)' : '') : '—';
export function designerCard(s) {
  const L = ['', '  designer', ''];
  L.push(`  profile    global ${s.global ? rel(s.files.global) : 'none — uxcli designer init --global --apply'}`);
  if (s.root) L.push(`             project ${s.project ? rel(s.files.project) : 'none (the global profile holds)'}`);
  const e = s.effective;
  if (!e) L.push('', '  No profile: the designer starts neutral. Propose two or three options from the presets in catalog.md, with grounds.');
  else {
    L.push('', '  defaults   ' + AXES.map(a => `${a} ${codes(e.defaults[a])}`).join(' · '));
    if (AXES.every(a => !e.defaults[a])) L.push('             no taste yet: propose two or three options from the presets, each with grounds; the owner picks');
    L.push(`  asks       ${e.decides.asks.join(', ')}`, `  alone      ${e.decides.alone.join(', ') || '—'}`, `  priority   ${e.priority.join(' > ')}`);
    if (e.beliefs.length) L.push(`  beliefs    ${e.beliefs.length}: ${e.beliefs.slice(0, 3).map(b => b.says).join('; ')}`);
    if (e.never.length) L.push(`  never      ${e.never.join('; ')}`);
    if (e.exceptions.length) L.push(`  excepted   ${e.exceptions.map(x => `${x.rule} (${x.decision}, ${x.by.ref})`).join('; ')}`);
  }
  const open = s.decisions.filter(d => d.value?.resolution.state === 'open');
  if (s.root) L.push('', `  decisions  ${s.decisions.length}, ${open.length} open${open.length ? ': ' + open.map(d => `${d.value.id} ${d.value.question}`).join('; ') : ''}`);
  const taste = s.root ? readJson(path.join(projectDir(s.root), 'taste.json'))?.taste || [] : [];
  const settled = taste.filter(t => t.settled);
  if (settled.length) L.push(`  settled    ${settled.map(t => `${t.prefer} over ${t.over}`).join('; ')}`);
  for (const p of s.problems) L.push(`  problem    ${p}`);
  L.push('', '  The catalog, the rules and the loop: skills/uxcli/designer/catalog.md and references/designer.md.');
  return L.join('\n');
}

export function learnCard(r, apply) {
  const L = ['', `  designer learn — ${r.project}`, ''];
  const row = t => `  ${t.settled ? 'settled' : 'leaning'}  ${t.axis} ${t.prefer} over ${t.over} · ${t.for} for, ${t.against} against · ${t.projects.length} project${t.projects.length === 1 ? '' : 's'}${t.scope === 'project' ? ' · this project only' : ''}`;
  L.push(...(r.local.taste.length ? r.local.taste.map(row) : ['  nothing to learn yet: no closed decision with signals']));
  for (const i of r.local.insights) L.push(`  insight  ${i.decision}: "${i.said}" — a fact about the users, not taste; propose it under .uxcli/understanding/insights/`);
  for (const x of r.local.exceptions) L.push(`  exception ${x.decision}: the owner kept "${x.chosen}" against a foundation rule — record it in the project profile's exceptions[], signed by the owner`);
  const g = r.everywhere.taste.filter(t => t.global);
  if (g.length) L.push('', '  across projects', ...g.map(row));
  if (r.promote.length) L.push('', '  to propose — the owner signs; learn never writes a profile', ...r.promote.map(p => `  ${p.where === 'global' ? rel(r.files.global) : rel(r.files.project || '')}  defaults.${p.axis} add ${p.add} (over ${p.over}; ${p.evidence.join(', ')})`));
  for (const p of r.problems) L.push(`  problem  ${p}`);
  L.push('', apply ? '  wrote taste.json (project and global); no profile was changed' : '  nothing written; --apply rewrites taste.json and copies global-scope decisions to the global store');
  return L.join('\n');
}

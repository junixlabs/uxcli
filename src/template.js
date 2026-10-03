// Project templates on disk: skills/uxcli/templates/<id>.json, and <id>.md beside it — the brief an
// agent reads, installed with the skill. `apply` creates actor files under .uxcli/understanding/actors/
// and never touches one that exists.
import fs from 'node:fs'; import path from 'node:path';
import { parseTemplate, actorSeed } from './core/model/template.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const TEMPLATE_DIR = path.join(ROOT, 'skills', 'uxcli', 'templates');
const readJson = f => JSON.parse(fs.readFileSync(f, 'utf8'));

export function templates() {
  const problems = [];
  const list = fs.existsSync(TEMPLATE_DIR) ? fs.readdirSync(TEMPLATE_DIR).filter(f => f.endsWith('.json')).sort().map(f => {
    const r = parseTemplate(readJson(path.join(TEMPLATE_DIR, f)));
    problems.push(...r.problems.map(p => `templates/${f}: ${p}`));
    if (r.value && `${r.value.id}.json` !== f) problems.push(`templates/${f}: id "${r.value.id}" does not match the file name`);
    return r.value;
  }).filter(Boolean) : [];
  return { list, problems };
}

export function templateListCard(lib) {
  const L = ['uxcli template · where to start for a kind of product', ''];
  for (const t of lib.list) {
    L.push(`  ${t.id.padEnd(10)} ${t.name} · ${t.screens.length} screens · ${t.journeys.length} journeys · ${t.research.length} research questions`);
    L.push(`  ${''.padEnd(10)} ${t.when}`);
  }
  for (const p of lib.problems) L.push(`  problem ${p}`);
  L.push('', '  uxcli template show <id>          the brief: screens and their lens, journeys to walk, what to research',
    '  uxcli template apply <id> [dir]   write each actor\'s questions into .uxcli/understanding/actors/ (creates only)');
  return L.join('\n');
}

// The brief, as the agent reads it. The same text is the shipped <id>.md, held equal by the gate.
export function templateMarkdown(t) {
  const L = [`# ${t.name} — the \`${t.id}\` template`, '', t.when, '',
    'A template is where research starts, not what it found. Nothing below is a fact about this product\'s users: the screens and journeys are what products of this kind usually have, and every question is yours to answer from a source before it becomes an insight. `uxcli template apply ' + t.id + '` writes the actor questions into `.uxcli/understanding/actors/`; `references/research.md` in this skill is how to answer them.', '',
    '## Who uses it', ''];
  for (const a of t.actors) {
    L.push(`### \`${a.actor}\``, '', a.who, '');
    for (const q of a.questions) L.push(`- ${q}`);
    L.push('');
  }
  L.push('## Screens, and the lens each is read against', '', '| Screen | Lens | What the person does there |', '|---|---|---|');
  for (const s of t.screens) L.push(`| ${s.name} (\`${s.id}\`) | \`${s.lens}\` | ${s.does} |`);
  L.push('', '## Journeys to walk first', '');
  for (const j of t.journeys) {
    L.push(`### \`${j.id}\` — ${j.goal}`, '', `Actor \`${j.actor}\`, through: ${j.through.map(s => `\`${s}\``).join(' → ')}.`, '', 'Watch when you walk it:', '');
    for (const w of j.watch) L.push(`- ${w}`);
    L.push('');
  }
  L.push('## What to research about the domain', '');
  for (const q of t.research) L.push(`- ${q}`);
  L.push('', '## Where research starts', '');
  for (const s of t.sources) L.push(`- [${s.name}](${s.url}) — ${s.why}`);
  return L.join('\n') + '\n';
}

export function templateShowCard(t) {
  const L = [`uxcli template show ${t.id} · ${t.name}`, `  ${t.when}`, '', '  who (every line a question until a source answers it)'];
  for (const a of t.actors) { L.push(`    ${a.actor} — ${a.who}`); for (const q of a.questions) L.push(`      ? ${q}`); }
  L.push('', '  screens');
  for (const s of t.screens) L.push(`    ${s.id.padEnd(18)} lens ${s.lens.padEnd(12)} ${s.does}`);
  L.push('', '  journeys to walk first');
  for (const j of t.journeys) { L.push(`    ${j.id} — ${j.goal}`, `      ${j.actor}: ${j.through.join(' → ')}`); for (const w of j.watch) L.push(`      watch: ${w}`); }
  L.push('', '  research');
  for (const q of t.research) L.push(`    ? ${q}`);
  L.push('', '  sources');
  for (const s of t.sources) L.push(`    ${s.name} · ${s.url}`);
  L.push('', `  next: uxcli template apply ${t.id}, then answer the questions (references/research.md), then uxcli lens show <lens> before drawing`);
  return L.join('\n');
}

// Creates .uxcli/understanding/actors/<actor>.json for each actor the template names and the project
// lacks. An actor file that exists is reported and left alone, whatever it says.
export function applyTemplate(dir, t, { at = new Date().toISOString() } = {}) {
  const base = path.join(path.resolve(dir), '.uxcli', 'understanding', 'actors');
  const items = t.actors.map(a => {
    const file = path.join(base, `${a.actor}.json`);
    if (fs.existsSync(file)) return { file, status: 'kept' };
    fs.mkdirSync(base, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(actorSeed(t, a, at), null, 1) + '\n');
    return { file, status: 'created' };
  });
  // which template the project started from, so context show can name it; kept if one is already there
  const tf = path.join(path.resolve(dir), '.uxcli', 'template.json');
  if (fs.existsSync(tf)) items.push({ file: tf, status: 'kept' });
  else { fs.mkdirSync(path.dirname(tf), { recursive: true }); fs.writeFileSync(tf, JSON.stringify({ schema_version: 1, template: t.id, at }, null, 1) + '\n'); items.push({ file: tf, status: 'created' }); }
  return { template: t.id, items };
}

// The template the project started from, if `template apply` recorded one.
export function projectTemplate(root) {
  const f = path.join(root, '.uxcli', 'template.json'); if (!fs.existsSync(f)) return null;
  let id; try { id = readJson(f).template; } catch { return null; }
  return templates().list.find(t => t.id === id) || { id, missing: true };
}

export function applyCard(r, t, cwd = process.cwd()) {
  const L = [`uxcli template apply ${r.template}`, ''];
  for (const it of r.items) L.push(`  ${it.status.padEnd(8)} ${path.relative(cwd, it.file)}`);
  L.push('', `  ${t.actors.reduce((n, a) => n + a.questions.length, 0)} questions written as unknowns. None is a fact yet.`,
    '  next: answer them from sources (references/research.md); each answer is an insight with its evidence.',
    `  then: draw with the lens each screen names (uxcli template show ${t.id}).`);
  return L.join('\n');
}

// Skills: frontmatter on the router, and each load-bearing paragraph still present, checked by hash.
// Whether a paragraph is load-bearing was shown on fresh agents (skills/pair.json records the run and
// which file the paragraph lives in); the gate can only check that it is still there unchanged.
// One shipped unit — skills/uxcli/ — holds the router (SKILL.md) and its references/, and a record
// may point at any file under it.
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SKILLS = path.join(ROOT, 'skills');
const sha = s => crypto.createHash('sha256').update(s).digest('hex');

export const skillDirs = () => fs.readdirSync(SKILLS).filter(d => fs.existsSync(path.join(SKILLS, d, 'SKILL.md')));

export const frontmatterOf = text => {
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/);
  return Object.fromEntries((fm ? fm[1].split('\n') : []).filter(l => /^[a-z]+:/.test(l)).map(l => [l.split(':')[0].trim(), l.slice(l.indexOf(':') + 1).trim()]));
};

export function checkSkills() {
  const pair = JSON.parse(fs.readFileSync(path.join(SKILLS, 'pair.json'), 'utf8')); const rows = [];
  for (const name of skillDirs()) {
    const problems = []; const meta = frontmatterOf(fs.readFileSync(path.join(SKILLS, name, 'SKILL.md'), 'utf8'));
    if (meta.name !== name) problems.push(`frontmatter name "${meta.name}" ≠ ${name}`); if (!meta.description) problems.push('no description');
    if (!pair[name]) problems.push('no entry in skills/pair.json');
    rows.push({ name, file: `${name}/SKILL.md`, problems, record: pair[name]?.record || 'no fresh-agent record' });
  }
  for (const [name, p] of Object.entries(pair)) {
    const file = p.file || `${name}/SKILL.md`; const problems = [];
    const at = path.join(SKILLS, file);
    if (!fs.existsSync(at)) problems.push(`${file} is not in skills/`);
    else { const text = fs.readFileSync(at, 'utf8'); if (!text.includes(p.loadBearing)) problems.push('load-bearing paragraph missing or changed'); }
    if (sha(p.loadBearing) !== p.loadBearingSha256) problems.push('pair.json paragraph hash does not match its text');
    const row = rows.find(r => r.name === name);
    if (row) row.problems.push(...problems); else rows.push({ name, file, problems, record: p.record || 'no fresh-agent record' });
  }
  return rows;
}

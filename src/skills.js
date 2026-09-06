// Skills: frontmatter and the load-bearing paragraph, checked by hash. Whether the paragraph is load-bearing was shown on fresh agents (skills/pair.json records the run); the gate can only check that it is still there unchanged.
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
export function checkSkills() {
  const pair = JSON.parse(fs.readFileSync(path.join(ROOT, 'skills/pair.json'), 'utf8')); const rows = [];
  for (const name of fs.readdirSync(path.join(ROOT, 'skills')).filter(d => fs.existsSync(path.join(ROOT, 'skills', d, 'SKILL.md')))) {
    const text = fs.readFileSync(path.join(ROOT, 'skills', name, 'SKILL.md'), 'utf8'); const problems = []; const p = pair[name];
    const fm = text.match(/^---\n([\s\S]*?)\n---\n/); const meta = Object.fromEntries((fm ? fm[1].split('\n') : []).map(l => [l.split(':')[0].trim(), l.slice(l.indexOf(':') + 1).trim()]));
    if (meta.name !== name) problems.push(`frontmatter name "${meta.name}" ≠ ${name}`); if (!meta.description) problems.push('no description');
    if (!p) problems.push('no entry in skills/pair.json'); else { if (!text.includes(p.loadBearing)) problems.push('load-bearing paragraph missing or changed'); if (sha(p.loadBearing) !== p.loadBearingSha256) problems.push('pair.json paragraph hash does not match its text'); }
    rows.push({ name, problems, record: p?.record || 'no fresh-agent record' });
  }
  return rows;
}

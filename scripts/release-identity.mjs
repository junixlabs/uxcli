#!/usr/bin/env node
// One version, three places that must say it: the git tag, package.json, and the shipped skill's
// metadata.version. The 0.6.0/0.7.0 drift (tag pushed, npm never updated) happened because nothing
// held them together; this holds them, and release.yml refuses a tag where they disagree.
//
//   release-identity.mjs <version>          exit 1 unless package.json and skills/uxcli/SKILL.md carry it
//   release-identity.mjs --notes <version>  the CHANGELOG section for that version, on stdout
//   release-identity.mjs --pack <pack.log>  exit 1 unless `npm pack --dry-run` listed every shipped root
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { frontmatterOf } from '../src/skills.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
export const versions = () => ({
  package: JSON.parse(read('package.json')).version,
  skill: (read('skills/uxcli/SKILL.md').match(/^\s*version:\s*"?([0-9][^"\n]*)"?/m) || [])[1] || null,
  changelog: (read('CHANGELOG.md').match(/^## \[(\d+\.\d+\.\d+)\]/m) || [])[1] || null,
});
// The skill carries major.minor; a patch release does not change what the skill says.
const skillMatches = (skill, v) => !!skill && v.split('.').slice(0, 2).join('.') === skill.split('.').slice(0, 2).join('.');

export function identityProblems(tag) {
  const v = versions(); const bad = [];
  if (tag && v.package !== tag) bad.push(`tag ${tag} ≠ package.json ${v.package}`);
  if (!skillMatches(v.skill, v.package)) bad.push(`skills/uxcli/SKILL.md metadata.version ${v.skill} does not carry package.json ${v.package} (major.minor)`);
  if (!frontmatterOf(read('skills/uxcli/SKILL.md')).name) bad.push('skills/uxcli/SKILL.md has no frontmatter name');
  return bad;
}

export function notesFor(version) {
  const log = read('CHANGELOG.md');
  const m = log.match(new RegExp(`^## \\[${version.replace(/\./g, '\\.')}\\][^\\n]*\\n([\\s\\S]*?)(?=^## \\[|\\Z)`, 'm'));
  if (!m) throw new Error(`CHANGELOG.md has no section for ${version}; write it under ## [${version}] - <date> before tagging`);
  return m[1].trim() + '\n';
}

export function packProblems(log) {
  const files = JSON.parse(read('package.json')).files || [];
  return files.filter(f => !new RegExp(`(^|\\s)${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(/|\\s|$)`, 'm').test(log)).map(f => `package.json files names ${f} but npm pack listed nothing under it`);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [a, b] = process.argv.slice(2);
  if (a === '--notes') { process.stdout.write(notesFor(b)); }
  else if (a === '--pack') { const p = packProblems(fs.readFileSync(b, 'utf8')); if (p.length) { console.error(p.join('\n')); process.exit(1); } console.log('pack: every shipped root present'); }
  else { const p = identityProblems(a); if (p.length) { console.error(p.join('\n')); process.exit(1); } console.log(`release identity: ${JSON.stringify(versions())}`); }
}

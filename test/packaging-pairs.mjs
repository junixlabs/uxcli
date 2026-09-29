// What ships is what the tag says. Four claims the release makes, each held by a pair: the version is
// one number in three places; the README opens with the sentence a person pastes to their agent and
// names the demo; the skill carries the frontmatter a skills installer reads; and package.json's
// `files` names only directories that exist and never experiments/. The must-fail half feeds each
// check a planted defect and requires it to be seen.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
import { identityProblems, packProblems, notesFor } from '../scripts/release-identity.mjs';
import { frontmatterOf } from '../src/skills.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

export function pair() {
  const problems = []; let checks = 0;
  const must = (what, ok) => { checks++; if (!ok) problems.push(what); };

  // release identity
  const idp = identityProblems(null); must(`release identity: ${idp.join('; ')}`, !idp.length);
  must('release identity does not see a tag that disagrees', identityProblems('0.0.0-planted').some(p => /tag 0\.0\.0-planted/.test(p)));
  let notes = null; try { notes = notesFor(JSON.parse(read('package.json')).version); } catch {}
  const unreleased = /^## \[Unreleased\]/m.test(read('CHANGELOG.md'));
  must('CHANGELOG has neither a section for the package version nor an Unreleased section to cut it from', !!notes || unreleased);
  must('notesFor does not refuse a version the changelog never mentions', (() => { try { notesFor('99.99.99'); return false; } catch { return true; } })());

  // readme showcase
  const readme = read('README.md');
  must('README does not open with a sentence to paste to the agent', /Paste this to your agent/.test(readme) && /npx skills add junixlabs\/uxcli/.test(readme));
  must('README does not name the demo', /uxcli demo/.test(readme));
  must('README does not name doctor', /uxcli doctor/.test(readme));
  must('README still advertises the retired context verb', !/uxcli context \[dir\]/.test(readme));

  // skill metadata
  const fm = frontmatterOf(read('skills/uxcli/SKILL.md'));
  must('skill frontmatter lacks name/description/license', fm.name === 'uxcli' && !!fm.description && !!fm.license);
  must('skill description does not say when to use it', /Use whenever/.test(fm.description));
  for (const r of ['before-done', 'journey', 'mockups', 'principles', 'understand']) must(`skill reference ${r}.md missing`, fs.existsSync(path.join(ROOT, 'skills', 'uxcli', 'references', `${r}.md`)));
  must('frontmatterOf reads a file with no frontmatter as having a name', !frontmatterOf('# no frontmatter\n').name);

  // files match
  const pkg = JSON.parse(read('package.json'));
  for (const f of pkg.files) must(`package.json files names ${f}, which is not on disk`, fs.existsSync(path.join(ROOT, f)));
  for (const need of ['skills', 'schemas', 'examples', 'test']) must(`package.json files does not ship ${need}`, pkg.files.includes(need));
  must('package.json files ships experiments/', !pkg.files.includes('experiments'));
  must('packProblems does not see a missing root', packProblems('bin/uxcli.js\nsrc/x.js\n').length > 0);
  must('packProblems flags a complete listing', !packProblems(pkg.files.map(f => `${f}/x`).join('\n')).length);

  return { ok: !problems.length, checks, problems };
}

export const OPERATOR = 'tag = package.json = skill major.minor, a planted tag is refused; README carries the paste-to-agent sentence, demo and doctor; the skill has frontmatter and its five references; every shipped root exists, experiments/ does not ship, and a pack listing missing a root is seen';

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = pair(); console.log(r.ok ? `PASS packaging · ${r.checks} checks` : 'FAIL ' + r.problems.join('\n     ')); process.exit(r.ok ? 0 : 1);
}

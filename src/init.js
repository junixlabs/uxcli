// uxcli init: put the shipped skills where the project's agent reads them, make the output directory, print the CI step. Touches nothing that exists.
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

export function init(project) {
  const skillsSrc = path.join(ROOT, 'skills'); const skillsDst = path.join(project, '.claude', 'skills'); const done = [], kept = [];
  for (const name of fs.readdirSync(skillsSrc).filter(d => fs.existsSync(path.join(skillsSrc, d, 'SKILL.md')))) {
    const dst = path.join(skillsDst, name, 'SKILL.md');
    if (fs.existsSync(dst)) { kept.push(name); continue; }
    fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(path.join(skillsSrc, name, 'SKILL.md'), dst); done.push(name);
  }
  const out = path.join(project, '.uxcli'); const madeOut = !fs.existsSync(out); if (madeOut) fs.mkdirSync(out);
  return { project, skills: done, kept, madeOut };
}

export const CI_STEP = `      - name: uxcli
        run: |
          npx @junixlabs/uxcli run <url of the screen under test>
          npx @junixlabs/uxcli run <journeys/name.json>        # each confirmed journey
          npx @junixlabs/uxcli sheet --src=.                    # when uxcli.commitments.json exists
          # exit 2 blocks the job; 0 carries findings the reviewer still reads`;

export function initCard(r) {
  const L = ['uxcli init · ' + r.project, ''];
  if (r.skills.length) L.push(`  skills  ${r.skills.join(', ')} copied to .claude/skills/`);
  if (r.kept.length) L.push(`  kept    ${r.kept.join(', ')} already in .claude/skills/, left as they are`);
  L.push(`  out     .uxcli/ ${r.madeOut ? 'created' : 'exists'}`);
  L.push('', '  CI step to add to the job that serves the app:', CI_STEP, '', '  Nothing else was written. Commitments (uxcli.commitments.json) and journeys are yours to write; the principles and journey skills draft them as proposals.');
  return L.join('\n');
}

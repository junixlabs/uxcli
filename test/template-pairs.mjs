// Project templates hold two promises, and each is a pair. A template states no fact about anyone's
// users — every actor line is a question, every journey names screens and actors the template has —
// and `template apply` only ever creates: an actor file that exists is left as it was, byte for byte.
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseTemplate } from '../src/core/model/template.js';
import { templates, templateMarkdown, applyTemplate, TEMPLATE_DIR } from '../src/template.js';
import { validate } from './lib/json-schema.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schema = name => JSON.parse(fs.readFileSync(path.join(ROOT, 'schemas', `${name}.schema.json`), 'utf8'));
const clone = o => JSON.parse(JSON.stringify(o));

export const OPERATOR = 'every shipped template parses, satisfies its schema and matches its brief; a template whose actor line states a fact instead of asking, whose journey names a screen or an actor it does not have, or whose screen names a lens that does not exist is refused; apply writes one actor file per actor whose unknowns are the questions and which satisfies the actor schema, and on a second run, and over an actor file somebody wrote, changes nothing';

export async function pair() {
  const problems = []; let checks = 0;
  const must = (what, cond) => { checks++; if (!cond) problems.push(what); };
  const lib = templates();
  must(`shipped templates have problems: ${lib.problems.join('; ')}`, !lib.problems.length);
  must('fewer than three templates ship', lib.list.length >= 3);
  for (const t of lib.list) {
    const raw = JSON.parse(fs.readFileSync(path.join(TEMPLATE_DIR, `${t.id}.json`), 'utf8'));
    const bad = validate(schema('template'), raw); must(`templates/${t.id}.json fails template.schema.json: ${bad.slice(0, 3).join('; ')}`, !bad.length);
    const md = path.join(TEMPLATE_DIR, `${t.id}.md`);
    must(`skills/uxcli/templates/${t.id}.md is missing or differs from ${t.id}.json — rebuild it with templateMarkdown()`, fs.existsSync(md) && fs.readFileSync(md, 'utf8') === templateMarkdown(t));
  }

  // must-fail: each way a template could start stating facts or pointing at nothing
  const base = JSON.parse(fs.readFileSync(path.join(TEMPLATE_DIR, `${lib.list[0].id}.json`), 'utf8'));
  const refused = (what, mutate, word) => { const d = clone(base); mutate(d); const r = parseTemplate(d); must(`${what} was accepted`, !r.value && r.problems.some(p => p.includes(word))); };
  refused('an actor line that states a fact', d => { d.actors[0].questions[0] = 'They work on a phone.'; }, 'is not a question');
  refused('a journey through a screen the template lacks', d => { d.journeys[0].through.push('nowhere'); }, 'not one of this template\'s screens');
  refused('a journey for an actor the template lacks', d => { d.journeys[0].actor = 'nobody'; }, 'is not one of this template\'s actors');
  refused('a screen read against a lens that does not exist', d => { d.screens[0].lens = 'taste'; }, 'lens: one of');
  refused('a research line that is not a question', d => { d.research[0] = 'Users want speed.'; }, 'is not a question');
  refused('an unknown key', d => { d.score = 10; }, 'unknown key');

  // apply: creates, and only creates
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-template-'));
  const t = lib.list[0];
  const r1 = applyTemplate(tmp, t, { at: '2026-10-03T00:00:00Z' });
  must('apply did not create one actor file per actor', r1.items.length === t.actors.length && r1.items.every(i => i.status === 'created'));
  for (const a of t.actors) {
    const f = path.join(tmp, '.uxcli', 'understanding', 'actors', `${a.actor}.json`);
    const doc = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
    must(`${a.actor}: the written unknowns are not the template's questions`, doc && JSON.stringify(doc.unknowns) === JSON.stringify(a.questions));
    must(`${a.actor}: the written actor states something other than unknowns`, doc && !['jobs', 'contexts', 'expectations', 'pains', 'behaviors', 'habits'].some(k => k in doc));
    const bad = doc ? validate(schema('actor'), doc) : ['missing']; must(`${a.actor}: the written actor fails actor.schema.json: ${bad.join('; ')}`, !bad.length);
  }
  const before = fs.readFileSync(path.join(tmp, '.uxcli', 'understanding', 'actors', `${t.actors[0].actor}.json`), 'utf8');
  const r2 = applyTemplate(tmp, t, { at: '2026-10-04T00:00:00Z' });
  must('a second apply did not keep every file', r2.items.every(i => i.status === 'kept'));
  must('a second apply changed a file it had written', fs.readFileSync(path.join(tmp, '.uxcli', 'understanding', 'actors', `${t.actors[0].actor}.json`), 'utf8') === before);
  // must-fail planted: an actor somebody already wrote is never overwritten
  const own = path.join(tmp, '.uxcli', 'understanding', 'actors', `${t.actors[1]?.actor || t.actors[0].actor}.json`);
  fs.writeFileSync(own, '{"schema_version":1,"actor":"mine","unknowns":["written by a person?"]}\n');
  applyTemplate(tmp, t);
  must('apply overwrote an actor file somebody wrote', fs.readFileSync(own, 'utf8') === '{"schema_version":1,"actor":"mine","unknowns":["written by a person?"]}\n');
  fs.rmSync(tmp, { recursive: true, force: true });
  return { ok: !problems.length, checks, problems };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = await pair();
  console.log(r.ok ? `PASS template · ${r.checks} checks` : 'FAIL ' + r.problems.join('\n     '));
  process.exit(r.ok ? 0 : 1);
}

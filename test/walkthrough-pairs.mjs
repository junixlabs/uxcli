// A walkthrough is the reviewer's claim at every step of a walk. The pair: a complete, honest one
// stands and its "no" and "unsure" become findings; one that skips a step, answers without saying why,
// says no without saying where, speaks as an actor nobody wrote, is signed by an agent on nobody's
// behalf, or says the person will notice a control the walk measured below the fold, is refused.
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import { fileURLToPath, pathToFileURL } from 'node:url';
import { writeWalkthrough, checkWalkthroughs } from '../src/walkthrough.js';
import { validate } from './lib/json-schema.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXAMPLE = path.join(ROOT, 'examples', 'crm');
export const OPERATOR = 'on the example\'s last walk of handle-inbound-lead, as its real-estate agent: a written walkthrough fits its schema and holds every step and question unanswered; an honest one stands with its no and unsure as findings; one with a step missing, an answer with no why, a no with no where, a persona nobody wrote, an agent signing for nobody, and a yes to noticing the call button the walk measured two scrolls down are each refused';

export async function pair() {
  const problems = []; let checks = 0;
  const must = (what, cond) => { checks++; if (!cond) problems.push(what); };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-walk-'));
  fs.cpSync(EXAMPLE, tmp, { recursive: true });
  const by = { type: 'agent', ref: 'agent', onBehalfOf: 'owner' };
  const w = writeWalkthrough(tmp, 'handle-inbound-lead', { as: 'real_estate_agent', by });
  must(`no walkthrough was written: ${(w.problems || []).join('; ')}`, !!w.file);
  if (!w.file) return { ok: false, checks, problems };
  const schema = JSON.parse(fs.readFileSync(path.join(ROOT, 'schemas', 'walkthrough.schema.json'), 'utf8'));
  const bad = validate(schema, w.doc); must(`the written walkthrough fails its schema: ${bad.join('; ')}`, !bad.length);
  const keys = Object.keys(w.doc.steps);
  must('the walkthrough does not hold every step of the walk with four unanswered questions', keys.length === 2 && keys.every(k => ['goal', 'notice', 'associate', 'progress'].every(q => w.doc.steps[k][q].answer === null)));
  must('an unanswered walkthrough was accepted', !checkWalkthroughs(tmp).ok);
  must('a persona nobody wrote was accepted', !!writeWalkthrough(tmp, 'handle-inbound-lead', { as: 'nobody', by }).problems);

  const a = (answer, why, where) => ({ answer, why, ...(where && { where }) });
  const honest = JSON.parse(JSON.stringify(w.doc));
  for (const k of keys) Object.assign(honest.steps[k], { goal: a('yes', 'this is the job'), associate: a('yes', 'the label says it'), progress: a('yes', 'the next screen says so'), notice: a('unsure', 'the control is at the edge of the screen', 'the row') });
  honest.steps[keys[1]].notice = a('no', 'no call action on screen', 'below the history');
  const put = d => fs.writeFileSync(w.file, JSON.stringify(d));
  put(honest); const ok = checkWalkthroughs(tmp);
  must(`an honest walkthrough was refused: ${ok.items.flatMap(x => x.problems).join('; ')}`, ok.ok);
  must('its no and unsure did not become findings', ok.items[0]?.findings.length === 2 && ok.items[0].findings.every(f => f.metric === 'walkthrough'));

  const refused = (what, mutate, word) => { const d = JSON.parse(JSON.stringify(honest)); mutate(d); put(d); const r = checkWalkthroughs(tmp); must(`${what} was accepted`, !r.ok && r.items.some(x => x.problems.some(p => p.includes(word)))); };
  refused('a step left out', d => { delete d.steps[keys[0]]; }, 'with no answers');
  refused('an answer with no why', d => { d.steps[keys[0]].goal.why = ' '; }, 'why');
  refused('a no with no where', d => { delete d.steps[keys[1]].notice.where; }, 'where');
  refused('an agent signing for nobody', d => { d.by.onBehalfOf = '<the person running you>'; }, 'onBehalfOf');
  refused('a yes to noticing a control the walk measured below the fold', d => { d.steps[keys[1]].notice = a('yes', 'the call button is there'); }, '2 scrolls away');
  fs.rmSync(tmp, { recursive: true, force: true });
  return { ok: !problems.length, checks, problems };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = await pair();
  console.log(r.ok ? `PASS walkthrough · ${r.checks} checks` : 'FAIL ' + r.problems.join('\n     '));
  process.exit(r.ok ? 0 : 1);
}

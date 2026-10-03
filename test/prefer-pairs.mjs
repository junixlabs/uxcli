// Blind pairwise preference. The pair: a study made from two folders keeps nothing on the judge's page
// that names a group (not the file names, not the folders, not which side is which); each judge's order
// and sides are their own and the same on every visit; an answer records the side from the server, so
// "right" counts for the group that was on the right; an answer with no why, a judgment signed by an
// agent, and a pair that is not in the study are refused; the sign test gives 1 for an even split and
// under 0.05 for nine to one.
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import { fileURLToPath, pathToFileURL } from 'node:url';
import { makeStudy, readStudy, answer, judgments, judgePage, serveStudy } from '../src/prefer.js';
import { blindOrder, tally, signTest, parseJudgment } from '../src/core/model/prefer.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXAMPLE = path.join(ROOT, 'examples', 'crm');
export const OPERATOR = 'six pairs of pictures from folders named for their groups: the page a judge sees names neither group; two judges see different orders and sides, one judge the same each time; "right" is counted for the group the server put there; a missing why, an agent judge and an unknown pair are refused; sign test 5:5 is 1 and 9:1 under 0.05';

export async function pair() {
  const problems = []; let checks = 0;
  const must = (what, cond) => { checks++; if (!cond) problems.push(what); };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-prefer-'));
  fs.cpSync(EXAMPLE, tmp, { recursive: true, filter: s => !/[\\/]\.uxcli[\\/]runs/.test(s) });
  const A = path.join(tmp, 'with-skill'), B = path.join(tmp, 'ticket-only'); fs.mkdirSync(A); fs.mkdirSync(B);
  const ids = ['s01', 's02', 's03', 's04', 's05', 's06'];
  for (const id of ids) { fs.writeFileSync(path.join(A, `${id}.png`), `A-${id}`); fs.writeFileSync(path.join(B, `${id}.png`), `B-${id}`); }
  fs.writeFileSync(path.join(A, 'only-a.png'), 'x');
  const m = makeStudy(tmp, 'skill-vs-ticket', { a: A, b: B });
  must(`a study was not made: ${(m.problems || []).join('; ')}`, m.study?.pairs.length === 6);
  if (!m.study) return { ok: false, checks, problems };
  must('a picture kept a name that says its group', m.study.pairs.every(p => !/skill|ticket|s0/.test(p.A + p.B)));
  must('a second study under the same name was written', !!makeStudy(tmp, 'skill-vs-ticket', { a: A, b: B }).problems);
  const study = readStudy(tmp, 'skill-vs-ticket').study;

  const o1 = blindOrder(study, 'lan'), o2 = blindOrder(study, 'minh');
  must('one judge saw a different page on a second visit', JSON.stringify(o1) === JSON.stringify(blindOrder(study, 'lan')));
  must('two judges saw the same order and sides', JSON.stringify(o1) !== JSON.stringify(o2));
  must('the sides were never swapped for a judge', new Set(o1.map(p => p.leftIs)).size === 2);
  const page = judgePage(study, 'lan');
  must('the judge\'s page names a group', !/with-skill|ticket-only|leftIs|"A"|"B"/.test(page) && !page.includes(study.groups.A));

  const first = o1[0]; const rightIs = first.leftIs === 'A' ? 'B' : 'A';
  must('an answer with no why was recorded', !answer(tmp, study, 'lan', { id: first.id, choice: 'right', why: ' ' }).ok);
  must('an answer to a pair not in the study was recorded', !answer(tmp, study, 'lan', { id: 'nope', choice: 'left', why: 'x' }).ok);
  must('a good answer was refused', answer(tmp, study, 'lan', { id: first.id, choice: 'right', why: 'the call button is where my thumb is' }).ok);
  let t = tally(study, judgments(tmp, study));
  must(`"right" was not counted for the group on the right (${rightIs})`, t[rightIs] === 1 && t[first.leftIs] === 0);
  for (const p of o1.slice(1)) answer(tmp, study, 'lan', { id: p.id, choice: 'same', why: 'cannot tell' });
  t = tally(study, judgments(tmp, study));
  must('cannot-tell answers were counted as wins', t.same === 5 && t.A + t.B === 1);

  const bot = { study: study.name, by: { type: 'agent', ref: 'claude', onBehalfOf: 'owner' }, at: '2026-10-03', answers: { [first.id]: { choice: 'left', leftIs: 'A', why: 'x' } } };
  must('an agent judgment was accepted', parseJudgment(bot, study).problems.some(p => p.includes('person')));
  fs.writeFileSync(path.join(tmp, '.uxcli', 'preferences', study.name, 'judgments', 'bot.json'), JSON.stringify(bot));
  t = tally(study, judgments(tmp, study));
  must('an agent judgment was counted', t.judges.length === 1 && judgments(tmp, study).some(j => !j.value));

  must('the sign test did not give 1 for an even split', signTest(5, 5) === 1);
  must('the sign test did not find nine to one unlikely by chance', Math.abs(signTest(9, 1) - 0.0215) < 0.001);

  const s = await serveStudy(tmp, study.name, { judge: 'minh', port: 0 });
  try {
    const html = await (await fetch(s.url)).text();
    must('the served page names a group', html.includes('Pairwise preference') && !html.includes('with-skill'));
    const img = await fetch(s.url + o2[0].left.replace(/^\//, ''));
    must('the served page cannot show its pictures', img.status === 200);
    must('the server reached outside the study', (await fetch(s.url + '..%2F..%2Fpolicy%2Fpolicy.json')).status === 404);
    const r = await (await fetch(s.url + 'api/answer', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: o2[0].id, choice: 'left', why: 'clearer status' }) })).json();
    must(`the served page could not record an answer: ${JSON.stringify(r)}`, r.ok && r.answered === 1);
  } finally { s.server.close(); }
  fs.rmSync(tmp, { recursive: true, force: true });
  return { ok: !problems.length, checks, problems };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = await pair();
  console.log(r.ok ? `PASS prefer · ${r.checks} checks` : 'FAIL ' + r.problems.join('\n     '));
  process.exit(r.ok ? 0 : 1);
}

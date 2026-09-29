// Lenses, held by a pair: every shipped viewpoint carries a named author and the page it was read
// from, every lens resolves to viewpoints that do not disown its kind, and a review is refused unless
// it answers every viewpoint of its lens, says where for what it claims, is signed, is fresher than
// the drawing, and says "holds" nowhere a probe the viewpoint names has counted a break.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { parseViewpoints, parseLens, resolveLens, parseLensesFile, parseReview, reviewTemplate, KINDS } from '../src/core/model/lens.js';
import { library, reviewCheck, mockupHash } from '../src/lens.js';
import { validate } from './lib/json-schema.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schema = n => JSON.parse(fs.readFileSync(path.join(ROOT, 'schemas', `${n}.schema.json`), 'utf8'));

export const OPERATOR = 'every shipped pool and lens satisfies its schema and parser, every viewpoint names an author, a work and a URL, and only folklore goes unquoted; a viewpoint with no source, a lens pick in no pool, and a pick whose viewpoint says no to the lens are refused; '
  + 'a review missing one answer, answering a viewpoint the lens does not carry, claiming holds or breaks without where, saying n/a without why, signed by an agent on nobody\'s behalf, or older than its drawing is refused, and a complete one is accepted; turning a lens off without a name is refused; '
  + 'on a drawing three boxes deep, a review that says the fewer-borders viewpoint holds is refused by page.nesting, and on the two-box twin the same review stands';

export async function pair() {
  const problems = []; let checks = 0;
  const must = (what, cond) => { checks++; if (!cond) problems.push(what); };

  // the library as shipped
  const lib = library();
  must(`the shipped library has problems: ${lib.problems.slice(0, 3).join('; ')}`, !lib.problems.length);
  must(`not every kind has a lens (${lib.lenses.map(l => l.id).join(', ')})`, KINDS.every(k => lib.lenses.some(l => l.id === k)));
  for (const f of fs.readdirSync(path.join(ROOT, 'lenses/viewpoints')).filter(f => f.endsWith('.json'))) {
    const bad = validate(schema('viewpoints'), JSON.parse(fs.readFileSync(path.join(ROOT, 'lenses/viewpoints', f), 'utf8')));
    must(`viewpoints/${f} fails its schema: ${bad.slice(0, 2).join('; ')}`, !bad.length);
  }
  for (const k of KINDS) { const f = path.join(ROOT, 'lenses', `${k}.json`); if (fs.existsSync(f)) { const bad = validate(schema('lens'), JSON.parse(fs.readFileSync(f, 'utf8'))); must(`${k}.json fails its schema: ${bad.slice(0, 2).join('; ')}`, !bad.length); } }
  const every = lib.pools.flatMap(p => p.viewpoints);
  must('a shipped viewpoint has no URL', every.every(v => /^https?:\/\//.test(v.source.url)));
  must('a shipped viewpoint other than folklore has no quote', every.every(v => v.evidence === 'folklore' || v.source.quote));

  // the parsers refuse what the library must never hold
  const pool = lib.pools[0]; const v0 = { ...pool.viewpoints[0], school: undefined, note: undefined }; delete v0.school; delete v0.note;
  const doc = { schema_version: 1, school: pool.school, name: pool.name, research: pool.research, viewpoints: [v0] };
  must('a well-formed pool was refused', !parseViewpoints(doc).problems.length);
  must('a viewpoint with no source was accepted', parseViewpoints({ ...doc, viewpoints: [{ ...v0, source: undefined }] }).problems.some(p => /taste does not ship/.test(p)));
  must('an unquoted viewpoint claiming an author was accepted', parseViewpoints({ ...doc, viewpoints: [{ ...v0, evidence: 'author', source: { ...v0.source, quote: '' } }] }).problems.some(p => /only folklore may go unquoted/.test(p)));
  const lens = { schema_version: 1, id: 'data', name: 'x', when: 'x', picks: [{ viewpoint: v0.id }] };
  must('a lens with a pick in no pool resolved', resolveLens(parseLens({ ...lens, picks: [{ viewpoint: 'craft.no-such-rule' }] }).value, lib.pools).problems.some(p => /is in no pool/.test(p)));
  const disowns = every.find(v => Object.values(v.kinds).includes('no'));
  if (disowns) { const k = Object.entries(disowns.kinds).find(([, x]) => x === 'no')[0]; must('a pick whose viewpoint says no to the lens resolved', resolveLens(parseLens({ ...lens, id: k, picks: [{ viewpoint: disowns.id }] }).value, lib.pools).problems.some(p => /says no to/.test(p))); }
  must('turning a lens off without a name was accepted', parseLensesFile({ schema_version: 1, off: ['data'] }).problems.some(p => /decision/.test(p)));
  must('turning a lens off with a name was refused', !parseLensesFile({ schema_version: 1, off: ['data'], by: { type: 'person', ref: 'owner' } }).problems.length);
  must('an unknown lens turned off was accepted', parseLensesFile({ schema_version: 1, off: ['cards'], by: { type: 'person', ref: 'owner' } }).problems.some(p => /is not a lens/.test(p)));

  // a review: complete, signed, fresh
  const L = lib.lenses.find(l => l.viewpoints.some(v => v.measure?.probe === 'page.nesting')) || lib.lenses[0];
  const H = 'a'.repeat(64); const target = { kind: 'mockup', state: 's', variant: 'a', sha256: H };
  const full = reviewTemplate(L, target, { type: 'agent', ref: 'claude', onBehalfOf: 'owner' });
  for (const id of Object.keys(full.answers)) full.answers[id] = { verdict: 'holds', where: 'the whole frame' };
  must(`a complete review was refused: ${parseReview(full, L, { hash: H }).problems.slice(0, 2).join('; ')}`, !parseReview(full, L, { hash: H }).problems.length);
  must(`a complete review fails review.schema.json: ${validate(schema('review'), full).slice(0, 2).join('; ')}`, !validate(schema('review'), full).length);
  const first = Object.keys(full.answers)[0];
  const cut = structuredClone(full); delete cut.answers[first];
  must('a review missing one answer was accepted', parseReview(cut, L, { hash: H }).problems.some(p => /unanswered/.test(p)));
  must('a review answering a viewpoint the lens does not carry was accepted', parseReview({ ...full, answers: { ...full.answers, 'craft.not-in-lens': { verdict: 'holds', where: 'x' } } }, L, { hash: H }).problems.some(p => /is not in the/.test(p)));
  must('a holds without where was accepted', parseReview({ ...full, answers: { ...full.answers, [first]: { verdict: 'holds' } } }, L, { hash: H }).problems.some(p => /says where/.test(p)));
  must('an n/a without why was accepted', parseReview({ ...full, answers: { ...full.answers, [first]: { verdict: 'n/a' } } }, L, { hash: H }).problems.some(p => /n\/a says why/.test(p)));
  must('an empty template passed as a review', parseReview(reviewTemplate(L, target, full.by), L, { hash: H }).problems.length > 0);
  must('an agent review on nobody\'s behalf was accepted', parseReview({ ...full, by: { type: 'agent', ref: 'claude' } }, L, { hash: H }).problems.some(p => /onBehalfOf/.test(p)));
  must('a review older than its drawing was accepted', parseReview(full, L, { hash: 'b'.repeat(64) }).problems.some(p => /predates the drawing/.test(p)));

  // the probe a viewpoint names overrules a "holds": the nesting pair's twins, as two drawings
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-lens-'));
  try {
    const dir = path.join(tmp, '.uxcli', 'mockups', 's'); fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(path.join(ROOT, 'src/probes/nesting/must-fail/index.html'), path.join(dir, 'deep.html'));
    fs.copyFileSync(path.join(ROOT, 'src/probes/nesting/must-pass/index.html'), path.join(dir, 'flat.html'));
    for (const v of ['deep', 'flat']) { const r = { ...full, target: { ...target, variant: v, sha256: mockupHash(tmp, 's', v) } }; fs.writeFileSync(path.join(dir, `${v}.${L.id}.review.json`), JSON.stringify(r)); }
    const out = await reviewCheck(tmp);
    const row = v => out.rows.find(r => r.file.includes(`/${v}.`));
    const vp = L.viewpoints.find(v => v.measure?.probe === 'page.nesting');
    must('the lens under test names no viewpoint counted by page.nesting', !!vp);
    must(`a holds on a drawing three boxes deep stood (${JSON.stringify(row('deep')?.problems)})`, row('deep')?.problems.some(p => p.includes(vp?.id) && /page\.nesting counted/.test(p)));
    must(`a holds on the two-box twin was refused (${JSON.stringify(row('flat')?.problems)})`, row('flat') && !row('flat').problems.length);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }

  return { ok: !problems.length, checks, problems };
}

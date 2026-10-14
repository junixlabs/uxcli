// The design catalog, held by a pair: the shipped catalog parses and satisfies its schema, every
// preset is a formula it accepts, catalog.md is its rendering, and a formula is read strictly — a
// code the catalog does not hold is refused, a combination it advises against is a warning, not silence.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseCatalog, parseFormula } from '../src/core/model/catalog.js';
import { catalog, catalogMarkdown, DESIGNER_DIR } from '../src/designer.js';
import { KINDS } from '../src/core/model/lens.js';
import { templates } from '../src/template.js';
import { validate } from './lib/json-schema.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const raw = () => JSON.parse(fs.readFileSync(path.join(DESIGNER_DIR, 'catalog.json'), 'utf8'));

export const OPERATOR = 'the shipped catalog parses, satisfies catalog.schema.json, and every preset is a formula it accepts with no warning; catalog.md equals the rendering of catalog.json and one missing a preset does not; every type names a lens and a template that exist; '
  + 'a formula naming a code the catalog does not hold, a code twice, or no product type is refused; spacious density on a work screen, a style avoided for the type, an accent style first and a reference-only design system are warned; a rule without a source, a layout region in no library table and a reference-only system without a reason are refused';

export async function pair() {
  const problems = []; let checks = 0;
  const must = (what, cond) => { checks++; if (!cond) problems.push(what); };
  const c = catalog();
  must(`the shipped catalog has problems: ${c.problems.slice(0, 3).join('; ')}`, !c.problems.length);
  if (!c.value) return { ok: false, checks, problems };
  const cat = c.value;
  const bad = validate(JSON.parse(fs.readFileSync(path.join(ROOT, 'schemas/catalog.schema.json'), 'utf8')), raw());
  must(`catalog.json fails its schema: ${bad.slice(0, 3).join('; ')}`, !bad.length);
  for (const p of cat.presets) { const f = parseFormula(p.code, cat); must(`preset ${p.code} is refused or warned: ${[...f.problems, ...f.warnings].join('; ')}`, f.value && !f.warnings.length); }
  const md = path.join(DESIGNER_DIR, 'catalog.md');
  must('skills/uxcli/designer/catalog.md is missing or differs from catalog.json — rebuild it (node docs/designer/build-catalog.mjs)', fs.existsSync(md) && fs.readFileSync(md, 'utf8') === catalogMarkdown(cat));
  must('a catalog.md missing a preset matched its catalog', catalogMarkdown({ ...cat, presets: cat.presets.slice(1) }) !== fs.readFileSync(md, 'utf8'));
  const tmpl = new Set(templates().list.map(t => t.id));
  for (const t of cat.types) must(`${t.code} names a lens or a template that does not exist (${t.lens}, ${t.template})`, (t.lens === null || KINDS.includes(t.lens)) && (t.template === null || tmpl.has(t.template)));

  // a formula is read strictly
  const f = s => parseFormula(s, cat);
  must('a formula with a code the catalog does not hold was accepted', f('A07 + B-W1 + C1 + D02 + B-Z9').problems.some(p => /"B-Z9" is not in the catalog/.test(p)));
  must('a formula naming a code twice was accepted', f('A07 + B-W1 + C1 + D02 + D02').problems.some(p => /named twice/.test(p)));
  must('a formula with no product type was accepted', f('B-W1 + C1 + D02').problems.some(p => /^A /.test(p)));
  must('a formula with two densities was accepted', f('A07 + C1 + C2 + D02').problems.some(p => /^C .*at most 1/.test(p)));
  must('a plain formula was refused or warned', (r => r.value && !r.warnings.length)(f('A07 + B-W1, B-W2 + C1 + D02 + E-Ant + F1 + G1')));
  must('spacious density on a work screen was not warned', f('A07 + B-W1 + C3 + D02').warnings.some(w => /^C3 with A07/.test(w)));
  must('a style advised against for the type was not warned', f('A07 + B-W1 + C1 + D07').warnings.some(w => /D07 .* advised against for A07/.test(w)));
  must('an accent style put first was not warned', f('A02 + B-M1 + C3 + D05').warnings.some(w => /accent/.test(w)));
  must('a layout outside the type\'s groups was not warned', f('A07 + B-S1 + C1 + D02').warnings.some(w => /B-S1 is not a usual layout/.test(w)));
  must('a reference-only design system was not warned', f('A03 + B-S1 + C2 + D03 + E-Polaris').warnings.some(w => /reference only/i.test(w)));

  // the catalog refuses what must never ship
  const doc = raw();
  must('a rule without a source was accepted', parseCatalog({ ...doc, rules: [{ ...doc.rules[0], sources: [] }, ...doc.rules.slice(1)] }).problems.some(p => /does not ship/.test(p)));
  must('a layout region with no library table was accepted', parseCatalog({ ...doc, layouts: [{ ...doc.layouts[0], regions: ['hologram'] }, ...doc.layouts.slice(1)] }).problems.some(p => /"hologram" is not in regions/.test(p)));
  must('a reference-only system without a reason was accepted', parseCatalog({ ...doc, systems: doc.systems.map(s => s.code === 'E-Polaris' ? { ...s, why: '' } : s) }).problems.some(p => /E-Polaris.why/.test(p)));
  must('a library package without an exact version was accepted', parseCatalog({ ...doc, libraries: { ...doc.libraries, antd: { ...doc.libraries.antd, packages: [{ name: 'antd', version: 'latest', role: 'x' }] } } }).problems.some(p => /exact version/.test(p)));
  must('a preset with a code the catalog does not hold was accepted', parseCatalog({ ...doc, presets: [{ ...doc.presets[0], formula: 'A99 + C1 + D02' }] }).problems.some(p => /P1.formula/.test(p)));
  return { ok: !problems.length, checks, problems };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = await pair();
  console.log(r.ok ? `PASS catalog · ${r.checks} checks` : 'FAIL ' + r.problems.join('\n     '));
  process.exit(r.ok ? 0 : 1);
}

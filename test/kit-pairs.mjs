// A kit, held by a pair: a formula becomes the library its design system or its product type names,
// with the density the library takes and tokens that pass their own contrast check; a style token
// planted under 4.5:1 is caught before anyone builds with it; a design system that is a reference only
// is refused with its reason; a region no library covers says what to use; and --write only creates.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
import { proposeKit, kitMarkdown } from '../src/core/designer/kit.js';
import { catalog, proposeDesigner } from '../src/designer.js';
import { validate } from './lib/json-schema.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const OPERATOR = 'every preset and every style proposes a kit that satisfies kit.schema.json with every contrast pair holding; P1 is antd with the compact algorithm, E-Material is mui, A08 with no E is shadcn with --warning added, --lib wins; '
  + 'a style whose text is planted at 3:1 on its ground is refused naming the pair, a translucent surface is measured over its ground; E-Polaris and E-Atlassian are refused with their reasons, an unknown --lib is refused; a map region names no component and says what to use; the example kit is the kit its formula proposes; '
  + '--write creates the kit\'s .json and .md, and a second --write over an edited kit changes nothing';

export async function pair() {
  const problems = []; let checks = 0;
  const must = (what, cond) => { checks++; if (!cond) problems.push(what); };
  const cat = catalog().value;
  const S = JSON.parse(fs.readFileSync(path.join(ROOT, 'schemas/kit.schema.json'), 'utf8'));
  const k = (f, o) => proposeKit(f, cat, o);

  for (const p of cat.presets) { const r = k(p.code); must(`preset ${p.code} gives no kit: ${r.problems.join('; ')}`, r.value && !validate(S, r.value).length); }
  for (const s of cat.styles) { const r = k(`A02 + B-M1 + C2 + ${s.code}`); must(`style ${s.code} fails its own contrast: ${r.problems.join('; ')}`, !!r.value); }
  const p1 = k('P1').value;
  must('P1 is not antd with the compact algorithm', p1?.library.id === 'antd' && /compactAlgorithm/.test(p1.library.density));
  must('P1 does not map the action colour to colorPrimary', p1?.theme.some(t => t.key === 'token.colorPrimary' && t.value === cat.codes.get('D02').tokens.action));
  must('E-Material did not give mui', k('A08 + B-W9 + C2 + D03 + E-Material').value?.library.id === 'mui');
  const a08 = k('A08 + B-W9 + C2 + D01').value;
  must('A08 with no design system did not give shadcn with --warning to add', a08?.library.id === 'shadcn' && a08.theme.some(t => /--warning \(add\)/.test(t.key)));
  must('--lib did not win over the design system', k('P1', { lib: 'mantine' }).value?.library.id === 'mantine');
  must('an unknown --lib was accepted', k('P1', { lib: 'bootstrap' }).problems.some(p => /one of antd/.test(p)));
  must('a dashboard did not pull in the chart package', k('A09 + B-D1 + C2 + D02').value?.library.packages.some(p => p.role === 'chart'));

  // planted defects
  const bad = structuredClone({ ...cat, codes: undefined }); bad.codes = new Map(cat.codes);
  bad.codes.set('D01', { ...cat.codes.get('D01'), tokens: { ...cat.codes.get('D01').tokens, text: '#949494' } });
  must('a text token planted at 3:1 on its ground was accepted', proposeKit('A02 + B-M1 + C2 + D01', bad).problems.some(p => /^text on bg is 3\.\d+:1, under 4\.5:1/.test(p)));
  bad.codes.set('D05', { ...cat.codes.get('D05'), tokens: { ...cat.codes.get('D05').tokens, surface: 'rgba(255,255,255,.9)' } });
  must('a translucent surface was not measured over its ground', proposeKit('A02 + B-M1 + C2 + D05', bad).problems.some(p => /on surface/.test(p)));
  must('E-Polaris was accepted', k('A03 + B-S1 + C2 + D03 + E-Polaris').problems.some(p => /deprecated outside Shopify/.test(p)));
  must('E-Atlassian was accepted', k('A07 + B-W1 + C1 + D02 + E-Atlassian').problems.some(p => /licensed for products that integrate/.test(p)));
  const map = k('A04 + B-S5 + C2 + D01').value?.patterns[0].regions.find(r => r.region === 'map');
  must('a map region named a component, or did not say what to use', map && map.component === null && /MapLibre|Leaflet/.test(map.note || ''));

  // the example kit is what its formula proposes
  const exDir = path.join(ROOT, 'examples/crm/.uxcli/designer/kits');
  for (const f of fs.readdirSync(exDir).filter(f => f.endsWith('.json'))) {
    const ex = JSON.parse(fs.readFileSync(path.join(exDir, f), 'utf8')); const now = k(ex.formula, ex.library.why === 'named by --lib' ? { lib: ex.library.id } : {}).value;
    must(`examples kits/${f} is not what its formula proposes now — rewrite it with designer propose --write`, JSON.stringify(now) === JSON.stringify(ex));
    must(`examples kits/${f.replace('.json', '.md')} differs from its kit`, fs.readFileSync(path.join(exDir, f.replace('.json', '.md')), 'utf8') === kitMarkdown(ex));
  }

  // --write only creates
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-kit-'));
  try {
    const r1 = proposeDesigner(tmp, 'P1', { write: true });
    must('--write did not create the kit json and md', r1.files.length === 2 && r1.files.every(([, s]) => s === 'create'));
    const f = r1.files[0][0]; fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace('"antd"', '"antd-edited"'));
    const before = fs.readFileSync(f, 'utf8');
    const r2 = proposeDesigner(tmp, 'P1', { write: true });
    must('a second --write overwrote a kit', r2.files.every(([, s]) => s === 'kept') && fs.readFileSync(f, 'utf8') === before);
    must('propose without --write wrote', !proposeDesigner(tmp, 'P5').files.length && !fs.existsSync(path.join(tmp, '.uxcli/designer/kits', `${k('P5').value.id}.json`)));
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  return { ok: !problems.length, checks, problems };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = await pair();
  console.log(r.ok ? `PASS kit · ${r.checks} checks` : 'FAIL ' + r.problems.join('\n     '));
  process.exit(r.ok ? 0 : 1);
}

// The shape contract holds both ways: every shipped example satisfies its schema, and a schema that
// would accept anything is caught by a mutant it must refuse. A schema nobody runs is documentation
// that drifts; this is what keeps schemas/ and examples/ the same file family.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
import { validate } from './lib/json-schema.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schema = name => JSON.parse(fs.readFileSync(path.join(ROOT, 'schemas', `${name}.schema.json`), 'utf8'));
const listJson = dir => fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().map(f => path.join(dir, f)) : [];
// a pick sits beside the variants it chooses among: mockups/<state>/pick.json
const listPicks = dir => fs.existsSync(dir) ? fs.readdirSync(dir).sort().map(d => path.join(dir, d, 'pick.json')).filter(f => fs.existsSync(f)) : [];

// Which schema each directory under .uxcli/ answers to.
export const WHERE = { actor: 'understanding/actors', insight: 'understanding/insights', journey: 'journeys', commitment: 'commitments', policy: 'policy', profile: 'profiles', proposal: 'proposals', pick: 'mockups' };
export const PROJECTS = ['examples/crm/.uxcli', 'test/fixtures/crm/.uxcli'];

export function pair() {
  const problems = []; let checks = 0;
  for (const [name, sub] of Object.entries(WHERE)) {
    const S = schema(name);
    const files = PROJECTS.flatMap(p => (name === 'pick' ? listPicks : listJson)(path.join(ROOT, p, sub)));
    if (!files.length) problems.push(`${name}: no example file under ${PROJECTS.join(' or ')}/${sub} — a schema with no example is a claim with no evidence`);
    for (const f of files) {
      const doc = JSON.parse(fs.readFileSync(f, 'utf8')); const rel = path.relative(ROOT, f);
      // must-pass: the shipped file satisfies its schema
      checks++; const bad = validate(S, doc); if (bad.length) problems.push(`${rel}: ${bad.slice(0, 3).join('; ')}`);
      // must-fail: a key the schema does not know is refused
      checks++; if (!validate(S, { ...doc, uxcliUnknownKey: 1 }).some(p => /unknown property/.test(p))) problems.push(`${name}: an unknown top-level key in ${rel} was not refused`);
      // must-fail: a required key removed is refused
      const req = (S.required || []).find(k => k in doc);
      if (req) { checks++; const cut = { ...doc }; delete cut[req]; if (!validate(S, cut).some(p => p.includes(`missing required "${req}"`))) problems.push(`${name}: removing ${req} from ${rel} was not refused`); }
    }
  }
  // the validator itself: a schema keyword it does not implement is a problem, never silently true
  checks++; if (!validate({ type: 'object', propertyNames: {} }, {}).length) problems.push('the validator ignored a keyword it does not implement');
  return { ok: !problems.length, checks, problems };
}

export const OPERATOR = 'every file under examples/ and test/fixtures/ .uxcli/ satisfies its schema; the same file with an unknown key, or a required key removed, is refused; a schema keyword the validator does not implement is a problem';

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = pair();
  console.log(r.ok ? `PASS shape · ${r.checks} checks` : 'FAIL ' + r.problems.join('\n     '));
  process.exit(r.ok ? 0 : 1);
}

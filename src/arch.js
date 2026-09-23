// The architecture, asserted like everything else in this project: as a pair that must hold, run by
// `uxcli gate`, with no browser.
//
// Cockburn's warning is the reason this file exists at all: "the usual solution is to create a new
// layer, with the promise that this time, really, no business logic will be put in the new layer. But
// having no mechanism to detect when a violation of that promise occurs, the organisation finds a few
// years later that the new layer is cluttered with business logic and the old problem has recurred."
// A dependency rule nobody checks is that promise. These are the checks.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const CORE = path.join(SRC, 'core');

// What `core/` may not reach for. Not a style list: every entry is a capability — a way to touch the
// world — and the whole claim of the core is that it touches nothing.
const PORTS = ['node:fs', 'node:child_process', 'node:http', 'node:https', 'node:net', 'node:os',
  'node:module', 'node:worker_threads', 'node:zlib', 'playwright-core', 'axe-core'];

const walk = (dir, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
};

const importsOf = src => [...src.matchAll(/(?:^|\s)(?:import|export)\s[^;]*?from\s+['"]([^'"]+)['"]/g)]
  .concat([...src.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)])
  .concat([...src.matchAll(/\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g)])
  .map(m => m[1]);

// Rule 4 — a project's declarations are named in one place. Every `uxcli.*.json` this tool reads is
// a storage decision: what the file is called, where it sits, and what its absence means. Those had
// begun to spread — `sheet.js` had its own reader, three command bodies in `bin/` had theirs, and
// two of them already disagreed about whether a missing registry was an empty list or a throw. This
// is the same promise Cockburn warns about, so it gets the same treatment as the others: a check.
export function storeRule() {
  const STORE = path.join(SRC, 'adapters', 'store');
  const bad = [];
  const files = [...walk(SRC), path.join(ROOT, 'bin', 'uxcli.js')].filter(f => !f.startsWith(STORE));
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(/['"`](uxcli\.[a-z.]*json)['"`]/g))
      bad.push(`${path.relative(ROOT, f)} names ${m[1]}`);
  }
  return bad;
}

// Rule 1 — one direction only. `core/` imports `core/`; nothing else, and no capability at all.
// This is also the whole enforcement of "explain is pure": once a pure function lives in core, the
// rule that core cannot import a port IS the check. No second mechanism, no second promise.
export function dependencyRule() {
  const bad = [];
  for (const f of walk(CORE)) {
    const rel = path.relative(ROOT, f);
    for (const spec of importsOf(fs.readFileSync(f, 'utf8'))) {
      if (PORTS.includes(spec)) { bad.push(`${rel} imports \`${spec}\` — core/ holds no capability; that belongs in an adapter`); continue; }
      if (spec.startsWith('.')) {
        const target = path.resolve(path.dirname(f), spec);
        if (!target.startsWith(CORE + path.sep)) bad.push(`${rel} imports \`${spec}\` — core/ may only import core/`);
      }
    }
  }
  return bad;
}

// Rule 2 — a probe declares one lifecycle, whole. Two shapes exist and they are not interchangeable:
// a page probe is handed a loaded page, a flow probe is handed a journey already walked. A probe
// carrying half of each, or missing the pure half, is the thing `readdir` used to let through.
const PAGE = { need: ['measure', 'explain'], may: ['prove'], deny: ['evaluate', 'onStep'] };
const FLOW = { need: ['evaluate', 'explain'], may: ['onStep'], deny: ['measure', 'prove'] };

export function lifecycleRule(probes) {
  const bad = [];
  for (const p of probes) {
    const where = p.id || '(a probe with no id)';
    for (const k of ['id', 'sc']) if (!p[k]) bad.push(`${where}: no ${k}`);
    if (!p.method?.status) bad.push(`${where}: no method.status — a probe that does not say how well it is known may not report anything`);
    const shape = p.kind === 'page' ? PAGE : FLOW;
    const name = p.kind === 'page' ? 'page' : 'flow';
    for (const k of shape.need) if (typeof p[k] !== 'function') bad.push(`${where}: declares the ${name} lifecycle but has no \`${k}()\``);
    for (const k of shape.deny) if (typeof p[k] === 'function') bad.push(`${where}: declares the ${name} lifecycle and also carries \`${k}()\` — a probe holds one lifecycle, not half of each`);
    const known = new Set([...shape.need, ...shape.may]);
    for (const k of Object.keys(p)) if (typeof p[k] === 'function' && !known.has(k)) bad.push(`${where}: \`${k}()\` is not part of the ${name} lifecycle`);
  }
  return bad;
}

// Rule 3 — the registry names every probe and every probe is named. `readdir` was the tolerant
// version of this: a stray directory became a probe and nothing said so. ESLint walked the same road
// and turned back — flat config requires explicit registration.
// Both directions, because each catches a different way of lying: a thing on disk that no registry
// names runs nowhere, and a registration with nothing behind it is a capability the product claims
// and does not have.
const bothWays = (onDisk, registered, orphan, phantom) => {
  const named = [...registered].sort();
  return [...[...onDisk].sort().filter(d => !named.includes(d)).map(orphan),
    ...named.filter(n => !onDisk.includes(n)).map(phantom)];
};

export function registryRule(registered, dir = path.join(SRC, 'probes')) {
  const onDisk = fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name) : [];
  return bothWays(onDisk, registered,
    d => `src/probes/${d}/ is on disk but in no registry — a directory is not a registration`,
    n => `the registry names \`${n}\` but src/probes/${n}/ does not exist`);
}

// Rule 6 — a module served to the browser is served with everything it imports. The dashboard hands
// the page a handful of `core/` modules so the screens decide with the same rules the card does, and
// it names them one at a time on purpose. But a name is not a graph: adding `timeline.js` without
// `target.js` served the browser an import that 404s, and an unresolved import does not degrade one
// screen — the whole module graph fails to evaluate and the page renders nothing. Found by a
// teammate, against a running server, because no rule was looking.
export function tierRule(file = path.join(SRC, 'dashboard.js')) {
  if (!fs.existsSync(file)) return [];
  const src = fs.readFileSync(file, 'utf8');
  const served = new Set([...src.matchAll(/['"](\/core\/[^'"]+)['"]\s*:/g)].map(m => m[1]));
  const bad = [];
  for (const route of served) {
    const onDisk = path.join(SRC, route.slice(1));
    if (!fs.existsSync(onDisk)) { bad.push(`the dashboard serves ${route} but src${route} does not exist`); continue; }
    for (const spec of importsOf(fs.readFileSync(onDisk, 'utf8'))) {
      if (!spec.startsWith('.')) { bad.push(`${route} imports \`${spec}\`, which the browser cannot resolve`); continue; }
      const want = '/' + path.relative(SRC, path.resolve(path.dirname(onDisk), spec));
      if (!served.has(want)) bad.push(`${route} imports ${want}, which the dashboard does not serve — the browser gets a 404 where an import should be, and no screen evaluates at all`);
    }
  }
  return bad;
}

// The same question asked of the suites that need no browser. A falsification pair is the only
// evidence that a rule can see, so a pair file nobody runs is worse than no pair at all: it is a
// rule that looks held and is not.
export function suiteRule(registered, dir = path.join(ROOT, 'test')) {
  const onDisk = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('-pairs.mjs')) : [];
  return bothWays(onDisk, registered,
    f => `test/${f} is on disk but the gate runs no such suite — a pair that runs nowhere holds nothing`,
    n => `the gate registers test/${n} but the file does not exist`);
}

// Rule 7 — every registered commitment kind is exercised by a pair that shows it can fail.
//
// `KINDS` is a registry, and a registry is the extension point: adding a kind is how the product
// grows a new thing it can decide. Nothing stopped a kind arriving with no falsification pair, and a
// kind that has only ever been seen agreeing is indistinguishable from `kind: always-passes` — which
// is the attack, and it does not need a malicious author to land, only a hurried one.
export function kindRule(names, dir = path.join(ROOT, 'test')) {
  if (!fs.existsSync(dir)) return [];
  const suites = fs.readdirSync(dir).filter(f => f.endsWith('-pairs.mjs'));
  const said = suites.map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
  return [...names].filter(n => !said.includes(`'${n}'`) && !said.includes(`"${n}"`) && !said.includes(`[${n}]`))
    .map(n => `the commitment kind \`${n}\` is registered but no pair names it — a kind that has only ever been seen agreeing cannot be told from one that always passes`);
}

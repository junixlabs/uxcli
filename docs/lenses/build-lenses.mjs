// Assemble lenses/<kind>.json from the four pools: every viewpoint that says yes to the kind, with
// viewpoints that state the same rule (agrees links) folded into one pick whose note names the others.
import fs from 'node:fs'; import path from 'node:path';
const LIB = new URL('../../skills/uxcli/lenses', import.meta.url).pathname;
const SCHOOLS = ['usability', 'craft', 'canon', 'modern', 'color', 'writing', 'data-display', 'forms', 'navigation', 'feedback'];
const PROBES = { 'page.nesting': ['craft.fewer-borders', 'canon.tufte-one-plus-one-equals-three', 'canon.gestalt-common-region', 'modern.fewer-borders-more-space'] };
const pools = SCHOOLS.map(s => JSON.parse(fs.readFileSync(path.join(LIB, 'viewpoints', `${s}.json`), 'utf8')));
// the probe a viewpoint is counted by, written into the pool itself
for (const [probe, ids] of Object.entries(PROBES)) for (const p of pools) for (const v of p.viewpoints) if (ids.includes(v.id)) v.measure.probe = probe;
for (const [i, p] of pools.entries()) fs.writeFileSync(path.join(LIB, 'viewpoints', `${SCHOOLS[i]}.json`), JSON.stringify(p, null, 1) + '\n');
const all = new Map(pools.flatMap(p => p.viewpoints.map(v => [v.id, v])));
const RANK = { study: 0, author: 1, secondary: 2, folklore: 3 };
const WHEN = {
  marketing: 'Landing, pricing and feature pages: read once, persuade, one call to action.',
  content: 'Docs, articles, blogs and help centres: long text read and navigated by section.',
  data: 'Dashboards, analytics, monitoring and reports: numbers and charts read again and again.',
  workspace: 'Admin, CRUD, tables, settings and B2B tools: repeated work where speed and consistency matter.',
  shop: 'Catalogues, search results and product pages: browse, compare, choose.',
  transaction: 'Checkout, sign-up, booking, onboarding and multi-step forms: one task, completed once, correctly.',
};
const NAME = { marketing: 'Marketing pages', content: 'Content and docs', data: 'Data and dashboards', workspace: 'Workspace and admin', shop: 'Shop and catalogue', transaction: 'Transactions and forms' };
for (const kind of Object.keys(WHEN)) {
  const yes = [...all.values()].filter(v => v.kinds[kind] === 'yes');
  const ids = new Set(yes.map(v => v.id));
  // Star folds, never chains: a viewpoint joins a pick only when it and the pick's lead name each other
  // directly (either direction). Folding along chains of agrees merged unrelated rules into one line.
  const edge = (a, b) => a.agrees.includes(b.id) || b.agrees.includes(a.id);
  const order = (a, b) => (RANK[a.evidence] - RANK[b.evidence]) || ((a.measure.probe ? 0 : 1) - (b.measure.probe ? 0 : 1)) || ((a.measure.kind === 'count' ? 0 : 1) - (b.measure.kind === 'count' ? 0 : 1)) || (SCHOOLS.indexOf(a.id.split('.')[0]) - SCHOOLS.indexOf(b.id.split('.')[0]));
  const degree = v => yes.filter(u => u !== v && edge(u, v)).length;
  const lead = [...yes].sort((a, b) => (degree(b) - degree(a)) || order(a, b));
  const taken = new Set(); const groups = new Map();
  for (const v of lead) { if (taken.has(v.id)) continue; taken.add(v.id); const g = [v]; for (const u of yes) if (!taken.has(u.id) && edge(u, v)) { taken.add(u.id); g.push(u); } groups.set(v.id, g); }
  const picks = [...groups.values()].map(g => {
    g.sort(order);
    const [rep, ...rest] = g;
    return { viewpoint: rep.id, ...(rest.length ? { note: `Same rule, also stated as: ${rest.map(x => `${x.id} (${x.source.author})`).join('; ')}.` } : {}) };
  });
  picks.sort((a, b) => SCHOOLS.indexOf(a.viewpoint.split('.')[0]) - SCHOOLS.indexOf(b.viewpoint.split('.')[0]));
  fs.writeFileSync(path.join(LIB, `${kind}.json`), JSON.stringify({ schema_version: 1, id: kind, name: NAME[kind], when: WHEN[kind], picks }, null, 1) + '\n');
  console.log(kind.padEnd(12), 'yes', String(yes.length).padStart(3), 'picks', String(picks.length).padStart(3), 'folded', yes.length - picks.length);
}
// the checklist each lens is read as, installed with the skill
const { library, lensMarkdown } = await import('../../src/lens.js');
const lib = library(); if (lib.problems.length) { console.error(lib.problems.join('\n')); process.exit(1); }
for (const l of lib.lenses) fs.writeFileSync(path.join(LIB, `${l.id}.md`), lensMarkdown(l));
console.log('wrote', lib.lenses.map(l => `${l.id}.md`).join(', '));

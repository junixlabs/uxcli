// The design catalog: seven axes a screen is described on (A product type, B layout, C density,
// D style, E design system, F personality, G platform), presets, the style-independent rules and the
// libraries a kit is built from. One file, skills/uxcli/designer/catalog.json; this parses it, reads
// a formula against it, and renders the markdown an agent reads. Pure: no I/O.
import { isStr, isObj, done } from './common.js';

export const AXES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
export const EVIDENCE = ['standard', 'study', 'system', 'designer', 'trend'];
export const LIBRARIES = ['antd', 'shadcn', 'mui', 'mantine'];
export const TOPICS = ['colour', 'type-and-space', 'hierarchy', 'data'];
const ROLES = ['bg', 'surface', 'text', 'muted', 'action', 'onAction', 'line'];
const STATUS = ['critical', 'warning', 'success', 'info'];
const PATTERN = { A: /^A\d\d$/, B: /^B-[A-Z]\d+$/, C: /^C\d$/, D: /^D\d\d$/, E: /^E-[A-Za-z]+$/, F: /^F\d$/, G: /^G\d$/ };
export const axisOf = code => AXES.find(a => PATTERN[a].test(code)) || null;

const SECTIONS = ['schema_version', 'checked', 'axes', 'groups', 'types', 'layouts', 'densities', 'styles', 'palette', 'systems', 'personalities', 'platforms', 'presets', 'conflicts', 'rules', 'checks', 'regions', 'regionNotes', 'libraries', 'recommend'];

export function parseCatalog(doc) {
  const problems = [];
  if (!isObj(doc)) return done(null, ['not an object']);
  if (doc.schema_version !== 1) problems.push('schema_version must be 1');
  for (const k of SECTIONS) if (doc[k] === undefined) problems.push(`${k}: required`);
  for (const k of Object.keys(doc)) if (!SECTIONS.includes(k)) problems.push(`unknown key "${k}"`);
  if (problems.length) return done(null, problems);

  const codes = new Map();
  const list = (name, axis) => (Array.isArray(doc[name]) ? doc[name] : []).forEach((x, i) => {
    const at = `${name}[${i}]`;
    if (!isObj(x) || !isStr(x.code) || !isStr(x.name)) return problems.push(`${at}: { code, name, … }`);
    if (axis && axisOf(x.code) !== axis) problems.push(`${at}.code: "${x.code}" is not an axis ${axis} code`);
    if (codes.has(x.code)) problems.push(`${at}.code: "${x.code}" appears twice`); codes.set(x.code, x);
  });
  list('types', 'A'); list('layouts', 'B'); list('densities', 'C'); list('styles', 'D'); list('systems', 'E'); list('personalities', 'F'); list('platforms', 'G'); list('presets');
  for (const a of AXES) if (!isObj(doc.axes[a]) || !isStr(doc.axes[a].name)) problems.push(`axes.${a}: { name, rule, min, max }`);

  const regions = isObj(doc.regions) ? doc.regions : {};
  for (const t of doc.types) {
    for (const g of t.groups || []) if (!doc.groups[g]) problems.push(`${t.code}.groups: "${g}" is not a layout group`);
    if (!codes.has(t.layout)) problems.push(`${t.code}.layout: "${t.layout}" is not a layout`);
    if (!LIBRARIES.includes(doc.recommend[t.code])) problems.push(`recommend.${t.code}: one of ${LIBRARIES.join(', ')}`);
  }
  for (const l of doc.layouts) {
    if (!doc.groups[l.group] || !l.code.startsWith(`B-${l.group}`)) problems.push(`${l.code}.group: "${l.group}" does not match the code`);
    if (!Array.isArray(l.regions) || !l.regions.length) problems.push(`${l.code}.regions: the regions of the screen, in reading order`);
    else for (const r of l.regions) if (!regions[r]) problems.push(`${l.code}.regions: "${r}" is not in regions`);
  }
  for (const s of doc.styles) {
    const t = s.tokens;
    if (!isObj(t) || ROLES.some(r => !isStr(t[r]))) problems.push(`${s.code}.tokens: needs ${ROLES.join(', ')}`);
    if (!['light', 'dark'].includes(s.scheme)) problems.push(`${s.code}.scheme: light or dark`);
    for (const a of s.avoidFor || []) if (axisOf(a) !== 'A' || !codes.has(a)) problems.push(`${s.code}.avoidFor: "${a}" is not a product type`);
    if (!Array.isArray(s.modes) || !s.modes.length || s.modes[0] !== s.scheme || s.modes.some(m => !['light', 'dark'].includes(m)) || new Set(s.modes).size !== s.modes.length) problems.push(`${s.code}.modes: its own scheme first, then the other mode if it has one`);
  }
  const pal = doc.palette;
  if (!isObj(pal) || !Array.isArray(pal.method) || !pal.method.every(isStr)) problems.push('palette.method: the steps of building a palette, as sentences');
  else {
    if (!Array.isArray(pal.steps) || pal.steps.length !== 12 || pal.steps.some((x, i) => x?.step !== i + 1 || !isStr(x.use))) problems.push('palette.steps: twelve { step, use }, in order');
    if (!isObj(pal.status) || STATUS.some(k => !/^#[0-9a-f]{6}$/i.test(pal.status[k] || ''))) problems.push(`palette.status: a #rrggbb seed for each of ${STATUS.join(', ')}`);
    if (!(pal.neutralChroma > 0 && pal.neutralChroma <= 0.04)) problems.push('palette.neutralChroma: a trace of hue, above 0 and at most 0.04');
    if (!isObj(pal.cvd) || !(pal.cvd.minDelta > 0) || !isStr(pal.cvd.note)) problems.push('palette.cvd: { minDelta, note } — say where the threshold comes from');
    if (!isObj(pal.chart) || !(pal.chart.categorical >= 2 && pal.chart.categorical <= 12) || !Array.isArray(pal.chart.sequential) || pal.chart.sequential.some(n => !(n >= 1 && n <= 12))) problems.push('palette.chart: { categorical 2–12, sequential: scale steps }');
    if (!Array.isArray(pal.sources) || !pal.sources.length || pal.sources.some(x => !isStr(x?.name) || !/^https?:\/\//.test(x?.url || ''))) problems.push('palette.sources: a method without the pages it came from does not ship');
    if (!Array.isArray(pal.viewpoints) || !pal.viewpoints.every(isStr)) problems.push('palette.viewpoints: the lens viewpoint ids about colour');
  }
  for (const e of doc.systems) {
    if (e.library !== null && !LIBRARIES.includes(e.library)) problems.push(`${e.code}.library: one of ${LIBRARIES.join(', ')}, or null`);
    if (e.library === null && !isStr(e.why)) problems.push(`${e.code}.why: a reference-only system says why it is not a library here`);
  }
  for (const lib of LIBRARIES) {
    const L = doc.libraries[lib];
    if (!isObj(L) || !isStr(L.name) || !Array.isArray(L.packages) || !L.packages.length || !isObj(L.map)) { problems.push(`libraries.${lib}: { name, packages[], map{}, … }`); continue; }
    if (!isStr(L.dark)) problems.push(`libraries.${lib}.dark: how this library takes a dark mode`);
    for (const p of [...L.packages, ...(L.extras || [])]) if (!isStr(p.name) || !/^\d+\.\d+\.\d+/.test(p.version || '')) problems.push(`libraries.${lib}: "${p.name}" needs an exact version`);
  }
  for (const [name, r] of Object.entries(regions)) for (const lib of LIBRARIES) if (r[lib] === null && !isStr(doc.regionNotes[name])) problems.push(`regions.${name}.${lib}: nothing in the library, and regionNotes.${name} does not say what to use`);
  const ruleIds = new Set();
  doc.rules.forEach((r, i) => {
    if (!isStr(r.id) || ruleIds.has(r.id)) problems.push(`rules[${i}].id: missing or repeated`); ruleIds.add(r.id);
    if (!isStr(r.rule) || !isStr(r.check)) problems.push(`rules[${i}]: { rule, check }`);
    if (!TOPICS.includes(r.topic)) problems.push(`rules[${i}].topic: one of ${TOPICS.join(', ')}`);
    if (!EVIDENCE.includes(r.evidence)) problems.push(`rules[${i}].evidence: one of ${EVIDENCE.join(', ')}`);
    if (!Array.isArray(r.sources) || !r.sources.length || r.sources.some(s => !isStr(s?.name) || !/^https?:\/\//.test(s?.url || ''))) problems.push(`rules[${i}].sources: a rule without a page it came from does not ship`);
  });
  doc.checks.forEach((c, i) => {
    if (!isStr(c.id) || !isStr(c.check) || !isObj(c.on)) return problems.push(`checks[${i}]: { id, check, kind, severity, on }`);
    for (const k of [...(c.on.types || []), ...(c.on.layouts || []), ...(c.on.styles || [])]) if (!codes.has(k)) problems.push(`checks[${i}].on: "${k}" is not in the catalog`);
  });
  for (const c of doc.conflicts) {
    if (!codes.has(c.code) || c.types.some(t => !codes.has(t)) || !isStr(c.says)) problems.push(`conflicts: ${JSON.stringify(c.code)} names a code not in the catalog, or says nothing`);
  }
  const value = problems.length ? null : { ...doc, codes };
  if (value) for (const p of doc.presets) { const f = parseFormula(p.formula, value); if (f.problems.length) problems.push(`${p.code}.formula: ${f.problems.join('; ')}`); }
  return done(problems.length ? null : value, problems);
}

// "A07 + B-W2, B-W4 + C1 + D02 + E-Ant + F1 + G1" → { A: ['A07'], B: [...], … }. A code the catalog
// does not hold is a problem; a combination the catalog advises against is a warning, because the
// owner may want it anyway and the decision log is where that is argued.
export function parseFormula(text, catalog) {
  const problems = [], warnings = [];
  const value = Object.fromEntries(AXES.map(a => [a, []]));
  if (!isStr(text)) return { ...done(null, ['a formula is a string like "A07 + B-W1 + C1 + D02"']), warnings };
  const preset = catalog.presets.find(p => p.code === text.trim());
  if (preset) text = preset.formula;
  for (const code of text.split(/[+,]/).map(s => s.trim()).filter(Boolean)) {
    const axis = axisOf(code);
    if (!axis || !catalog.codes.has(code)) { problems.push(`"${code}" is not in the catalog`); continue; }
    if (value[axis].includes(code)) { problems.push(`"${code}" is named twice`); continue; }
    value[axis].push(code);
  }
  for (const a of AXES) {
    const { min, max, name } = catalog.axes[a];
    if (value[a].length < min) problems.push(`${a} (${name.toLowerCase()}): at least ${min}`);
    if (value[a].length > max) problems.push(`${a} (${name.toLowerCase()}): at most ${max} — ${catalog.axes[a].rule}`);
  }
  if (problems.length) return { ...done(null, problems), warnings };
  const types = value.A;
  for (const c of catalog.conflicts) if (value[c.axis].includes(c.code) && types.some(t => c.types.includes(t))) warnings.push(`${c.code} with ${types.filter(t => c.types.includes(t)).join(', ')}: ${c.says}`);
  value.D.forEach((d, i) => {
    const s = catalog.codes.get(d);
    const against = types.filter(t => s.avoidFor.includes(t));
    if (against.length) warnings.push(`${d} ${s.name} is advised against for ${against.join(', ')}`);
    if (i === 0 && s.accent) warnings.push(`${d} ${s.name} works as an accent; put a base style first`);
  });
  const groups = new Set(types.flatMap(t => catalog.codes.get(t).groups));
  for (const b of value.B) if (!groups.has(catalog.codes.get(b).group)) warnings.push(`${b} is not a usual layout for ${types.join(', ')}`);
  for (const e of value.E) { const s = catalog.codes.get(e); if (!s.library) warnings.push(`${e} ${s.name}: ${s.why}`); }
  return { ...done(value, []), warnings };
}

export const formulaText = f => AXES.filter(a => f[a].length).map(a => f[a].join(', ')).join(' + ');

// The catalog as an agent reads it: skills/uxcli/designer/catalog.md, installed with the skill. The
// gate holds the file equal to this rendering, so what the agent reads is what `designer` checks.
export function catalogMarkdown(c) {
  const L = ['# The design catalog', '',
    `Seven axes describe a screen. Write a brief as a formula, one or more codes per axis joined by \`+\`: \`${c.presets[0].formula}\`. \`uxcli designer propose "<formula>"\` checks it and proposes a kit. Libraries checked on ${c.checked}.`, ''];
  const axis = a => L.push(`## ${a} — ${c.axes[a].name}`, '', c.axes[a].rule, '');
  axis('A');
  L.push('| Code | Type | What the person comes to do | Layout groups | Default layout |', '|---|---|---|---|---|');
  for (const t of c.types) L.push(`| ${t.code} | ${t.name} | ${t.does} | ${t.groups.join(', ')} | ${t.layout} |`);
  L.push(''); axis('B');
  for (const [g, gname] of Object.entries(c.groups)) {
    L.push(`### ${g} — ${gname}`, '');
    for (const l of c.layouts.filter(x => x.group === g)) L.push(`- **${l.code} ${l.name}.** ${l.use} Regions: ${l.regions.join(' → ')}.`);
    L.push('');
  }
  axis('C');
  for (const d of c.densities) L.push(`- **${d.code} ${d.name}.** ${d.use} Rows ${d.rowHeight}px, controls ${d.controlHeight}px, body ${d.bodySize}px, type scale ${d.typeScale.join('/')}, spacing unit ${d.spacingUnit}px.`);
  L.push(''); axis('D');
  for (const s of c.styles) L.push(`- **${s.code} ${s.name}${s.accent ? ' (accent)' : ''}.** ${s.looks} Modes: ${s.modes.join(', ')}. Fits ${s.fits}${s.avoidFor.length ? ` Avoid for ${s.avoidFor.join(', ')}.` : ''}`);
  L.push(''); axis('E');
  for (const e of c.systems) L.push(`- **${e.code} ${e.name}.** ${e.strength} ${e.library ? `Library: \`${e.library}\`.` : e.why}`);
  L.push(''); axis('F');
  for (const f of c.personalities) L.push(`- **${f.code} ${f.name}.** ${f.looks}`);
  L.push(''); axis('G');
  for (const g of c.platforms) L.push(`- **${g.code} ${g.name}.** ${g.use}`);
  L.push('', '## Presets', '');
  for (const p of c.presets) L.push(`- **${p.code} ${p.name}.** ${p.does} \`${p.formula}\``);
  L.push('', '## Combinations the catalog warns about', '');
  for (const x of c.conflicts) L.push(`- ${x.code} with ${x.types.join(', ')}: ${x.says}`);
  L.push('- A style is warned against for the types in its "avoid for"; an accent style is not a base; a layout outside the type\'s groups is unusual.', '',
    '## Rules that hold in every style', '', 'Evidence: standard (WCAG), study (peer-reviewed), system (published design systems agree), designer (named practitioners), trend.', '');
  const NAMES = { colour: 'Colour', 'type-and-space': 'Type and space', hierarchy: 'Hierarchy', data: 'Data' };
  for (const topic of TOPICS) {
    L.push(`### ${NAMES[topic]}`, '');
    for (const r of c.rules.filter(x => x.topic === topic)) L.push(`- **${r.id}** (${r.evidence}). ${r.rule} *Check:* ${r.check} Sources: ${r.sources.map(s => `[${s.name}](${s.url})`).join('; ')}.`);
    L.push('');
    if (topic === 'colour') {
      const p = c.palette;
      L.push('#### Building the palette', '', ...p.method.map((m, i) => `${i + 1}. ${m}`), '', '| Step | Use |', '|---|---|', ...p.steps.map(x => `| ${x.step} | ${x.use} |`), '',
        `Status seeds: ${Object.entries(p.status).map(([k, v]) => `${k} \`${v}\``).join(', ')}. Neutral chroma at most ${p.neutralChroma}. Colour-blind check: pairs closer than ${p.cvd.minDelta} in OKLab are warned (${p.cvd.note}). Chart: ${p.chart.categorical} categorical hues; sequential steps ${p.chart.sequential.join(', ')}. \`uxcli designer propose\` builds all of it for a style, in each of its modes, and checks it.`, '',
        `Lens viewpoints on colour (\`lenses/<kind>.md\`): ${p.viewpoints.map(v => `\`${v}\``).join(', ')}.`, '',
        `Sources: ${p.sources.map(s => `[${s.name}](${s.url})`).join('; ')}.`, '');
    }
  }
  L.push('', '## Checks before done', '', 'Drawn from a real CRM review. Kind: bug, contract (front end and back end disagree), a11y, usability, drift, debt. Severity: S1–S4 for bugs, N0–N4 (Nielsen) for usability.', '');
  const on = o => o.all ? 'every screen' : [...(o.types || []), ...(o.layouts || []), ...(o.styles || [])].join(', ');
  for (const k of c.checks) L.push(`- **${k.id}** (${k.kind}, ${k.severity}; ${on(k.on)}). ${k.check}`);
  L.push('', '## Libraries', '');
  for (const lib of LIBRARIES) {
    const x = c.libraries[lib];
    L.push(`### \`${lib}\` — ${x.name}`, '', `Packages: ${x.packages.map(p => `${p.name}@${p.version}`).join(', ')}. Extras: ${(x.extras || []).map(p => `${p.name}@${p.version} (${p.role})`).join(', ')}. ${x.theming} Dark mode: ${x.dark}.`, '');
    for (const n of x.notes || []) L.push(`- ${n}`);
    L.push('');
  }
  L.push('By product type, when E names no library: ' + LIBRARIES.map(lib => `\`${lib}\` for ${Object.entries(c.recommend).filter(([, v]) => v === lib).map(([k]) => k).join(', ') || 'none'}`).join('; ') + '.', '',
    '## Regions and the component each library offers', '', '| Region | antd | shadcn | mui | mantine |', '|---|---|---|---|---|');
  for (const [name, r] of Object.entries(c.regions)) L.push(`| ${name} | ${LIBRARIES.map(lib => r[lib] || '—').join(' | ')} |`);
  L.push('');
  for (const [name, n] of Object.entries(c.regionNotes)) L.push(`- **${name}:** ${n}`);
  L.push('');
  return L.join('\n');
}

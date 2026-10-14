// A kit: what to build a formula with — the library and its packages, the tokens as DTCG data, the
// library's theme keys mapped to those tokens, the regions of each chosen layout with the component the
// library offers for each, and the checks before done. A proposal, not code: nothing here generates a
// component. The colours come from color.js and check their own contrast in every mode, so a kit never
// hands over a pair it already knows fails. Pure.
import { parseFormula, formulaText, LIBRARIES } from '../model/catalog.js';
import { palette, scale } from './color.js';

const hex2 = n => Math.round(n).toString(16).padStart(2, '0');
const rgb = s => {
  if (/^#[0-9a-f]{6}$/i.test(s)) return { c: [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)), a: 1 };
  const m = /^rgba?\(([^)]+)\)$/.exec(s); if (!m) return null;
  const [r, g, b, a = '1'] = m[1].split(',').map(x => x.trim()); return { c: [r, g, b].map(Number), a: Number(a) };
};
const dtcgColor = s => { const x = rgb(s); return x ? { colorSpace: 'srgb', components: x.c.map(v => Math.round(v / 255 * 1000) / 1000), ...(x.a < 1 ? { alpha: x.a } : {}), hex: '#' + x.c.map(hex2).join('') } : s; };
const fontList = s => s.split(',').map(x => x.trim().replace(/^"|"$/g, ''));
const EXTRA_FOR = { chart: ['chart', 'funnel'], kanban: ['kanban'], dates: ['calendar', 'date-strip'] };

export function proposeKit(text, catalog, { lib = null } = {}) {
  const f = parseFormula(text, catalog);
  if (!f.value) return { value: null, problems: f.problems, warnings: f.warnings };
  const F = f.value, problems = [], warnings = [...f.warnings];
  const sys = F.E.length ? catalog.codes.get(F.E[0]) : null;
  let library, why;
  if (lib) { if (!LIBRARIES.includes(lib)) return { value: null, problems: [`--lib=${lib}: one of ${LIBRARIES.join(', ')}`], warnings }; library = lib; why = 'named by --lib'; }
  else if (sys?.library) { library = sys.library; why = `${sys.code} ${sys.name}`; }
  else if (sys) return { value: null, problems: [`${sys.code} ${sys.name}: ${sys.why} Read it for its rules; build with --lib=${LIBRARIES.join('|')}.`], warnings };
  else { library = catalog.recommend[F.A[0]]; why = `the usual library for ${F.A[0]} ${catalog.codes.get(F.A[0]).name}`; }
  const L = catalog.libraries[library];

  const style = catalog.codes.get(F.D[0]), density = catalog.codes.get(F.C[0]), t = style.tokens;
  // the colour system for this style, in each of its modes: scales, roles, states, chart colours, and the checks on them
  const pal = palette(style, catalog.palette);
  for (const c of pal.contrast.filter(c => !c.ok)) problems.push(`${c.mode}: ${c.fg} on ${c.bg} is ${c.ratio}:1, under ${c.min}:1 (${c.min === 3 ? 'WCAG 1.4.11' : 'WCAG 1.4.3'}) — change the token before building with it`);
  for (const m of pal.modes) for (const x of pal.apart[m]) warnings.push(`${m}: the action colour is close to ${x.status} (OKLab ${x.delta}) — a button can read as a status; move the action hue or keep ${x.status} badges word-led (one-meaning)`);
  for (const m of pal.modes) for (const x of pal.cvd[m].close) warnings.push(`${m}: ${x.a} and ${x.b} look alike under ${x.type} (OKLab ${x.delta}) — the word or icon must carry the status (never-colour-alone)`);

  const color = v => ({ $type: 'color', $value: dtcgColor(v) });
  const tokens = {
    $description: `${style.code} ${style.name}, ${density.code} ${density.name}; modes ${pal.modes.join(', ')} (${style.scheme} is the style's own). Scales are 12 steps in OKLCH; roles name what a colour is for. DTCG Format Module 2025.10.`,
    color: Object.fromEntries(pal.modes.map(m => [m, {
      role: Object.fromEntries(Object.entries(pal.roles[m]).map(([k, v]) => [k, color(v)])),
      scale: Object.fromEntries(Object.entries(pal.scales[m]).map(([k, steps]) => [k, Object.fromEntries(steps.map((v, i) => [String(i + 1), color(v)]))])),
      chart: { categorical: pal.chart[m].categorical.map(color), sequential: pal.chart[m].sequential.map(color), diverging: pal.chart[m].diverging.map(color) },
    }])),
    dimension: {
      radius: { $type: 'dimension', $value: { value: t.radius, unit: 'px' } },
      rowHeight: { $type: 'dimension', $value: { value: density.rowHeight, unit: 'px' } },
      controlHeight: { $type: 'dimension', $value: { value: density.controlHeight, unit: 'px' } },
      space: Object.fromEntries([1, 2, 3, 4, 6, 8].map(n => [String(n), { $type: 'dimension', $value: { value: n * density.spacingUnit, unit: 'px' } }])),
    },
    font: {
      body: { $type: 'fontFamily', $value: fontList(t.fontBody) },
      heading: { $type: 'fontFamily', $value: fontList(t.fontHeading) },
      headingWeight: { $type: 'fontWeight', $value: t.headingWeight },
      size: Object.fromEntries(density.typeScale.map((v, i) => [['xs', 'sm', 'md', 'lg', 'xl'][i], { $type: 'dimension', $value: { value: v, unit: 'px' } }])),
    },
  };
  // antd, MUI and Mantine take numbers in pixels; shadcn's CSS variables take lengths
  const px = n => library === 'shadcn' ? `${n}px` : n;
  const value = { radius: px(t.radius), fontBody: t.fontBody, bodySize: px(density.bodySize), controlHeight: px(density.controlHeight) };
  // Mantine's primary colour is one 10-shade tuple, light to dark, for both schemes: the light action
  // scale without steps 6 and 8, so the seed is shade 6
  const light = scale(pal.roles[pal.modes[0]].action, 'light'); const tuple = [1, 2, 3, 4, 5, 7, 9, 10, 11, 12].map(i => light[i - 1]);
  const inMode = (token, m) => !pal.modes.includes(m) ? null : token === 'actionScale' ? tuple : pal.roles[m][token] ?? value[token] ?? null;
  const theme = Object.entries(L.map).map(([token, key]) => ({ key, token, light: inMode(token, 'light'), dark: inMode(token, 'dark') }));

  const used = new Set();
  const patterns = F.B.map(b => {
    const l = catalog.codes.get(b);
    return { layout: b, name: l.name, use: l.use, regions: l.regions.map(r => { used.add(r); return { region: r, component: catalog.regions[r][library], note: catalog.regionNotes[r] || null }; }),
      checks: catalog.checks.filter(c => c.on.layouts?.includes(b)).map(c => c.id) };
  });
  const packages = [...L.packages, ...(L.extras || []).filter(p => (EXTRA_FOR[p.role] || []).some(r => used.has(r)))];
  const applies = c => c.on.all || c.on.types?.some(a => F.A.includes(a)) || c.on.styles?.some(d => F.D.includes(d)) || c.on.layouts?.some(b => F.B.includes(b));
  const checks = catalog.checks.filter(applies).map(c => ({ id: c.id, kind: c.kind, severity: c.severity, check: c.check }));
  const structure = library === 'shadcn'
    ? ['components/ui/  (copied by the shadcn CLI; edit in place)', 'components/  (the project\'s own, built from ui/)', 'app/globals.css  (the tokens as CSS variables, with --warning, --success, --info added)', 'design/tokens.json  (this kit\'s tokens)']
    : ['src/theme/tokens.json  (this kit\'s tokens)', `src/theme/theme.ts  (the ${L.name} theme, keys as below)`, 'src/components/  (a component at its second use)', 'src/features/<area>/  (screens, by what the person does)'];

  const id = `${F.A[0]}-${(F.B[0] || 'any').replace(/^B-/, '')}-${library}`.toLowerCase();
  const kit = {
    schema_version: 1, id, formula: formulaText(F), checked: catalog.checked,
    library: { id: library, name: L.name, why, alternatives: LIBRARIES.filter(x => x !== library), packages, theming: L.theming, dark: L.dark, density: L.density[density.code], notes: L.notes || [] },
    modes: pal.modes, steps: catalog.palette.steps.map(x => x.use), tokens, contrast: pal.contrast, cvd: pal.cvd, theme, patterns, structure, rules: catalog.rules.map(r => ({ id: r.id, topic: r.topic, rule: r.rule, check: r.check })), checks, warnings,
  };
  return { value: problems.length ? null : kit, kit, problems, warnings };
}

// The kit as an agent reads it, written beside the JSON.
export function kitMarkdown(k) {
  const L = [`# Kit ${k.id}`, '', `Formula: \`${k.formula}\`. Library versions checked on ${k.checked}. A proposal: choosing it is a decision with at least one other option (another --lib, another formula), recorded under .uxcli/designer/decisions/.`, ''];
  if (k.warnings.length) L.push('## Warnings', '', ...k.warnings.map(w => `- ${w}`), '');
  L.push(`## Library — ${k.library.name}`, '', `Why: ${k.library.why}. Alternatives: ${k.library.alternatives.join(', ')}.`, '', `Install: ${k.library.packages.map(p => `\`${p.name}@${p.version}\``).join(' ')}`, '', `Theming: ${k.library.theming} Density: ${k.library.density}.`, '', ...k.library.notes.map(n => `- ${n}`), '');
  const v = x => Array.isArray(x) ? x.join(' ') : x ?? '—';
  L.push('## Theme keys', '', `Dark mode: ${k.library.dark}.`, '', '| Library key | Token | Light | Dark |', '|---|---|---|---|', ...k.theme.map(t => `| \`${t.key}\` | ${t.token} | ${v(t.light)} | ${v(t.dark)} |`), '');
  const hex = c => c.$value.hex;
  L.push('## Colour', '', `Modes: ${k.modes.join(', ')}. Components use roles; scales are where the roles come from. Every pair below was measured; nothing here is hoped for.`, '',
    '### Roles', '', `| Role | ${k.modes.join(' | ')} |`, `|---|${k.modes.map(() => '---').join('|')}|`,
    ...Object.keys(k.tokens.color[k.modes[0]].role).map(r => `| ${r} | ${k.modes.map(m => hex(k.tokens.color[m].role[r])).join(' | ')} |`), '');
  for (const m of k.modes) {
    const sc = k.tokens.color[m].scale; const fams = Object.keys(sc);
    L.push(`### Scales — ${m}`, '', `| Step | Use | ${fams.join(' | ')} |`, `|---|---|${fams.map(() => '---').join('|')}|`,
      ...k.steps.map((use, i) => `| ${i + 1} | ${use} | ${fams.map(f => hex(sc[f][String(i + 1)])).join(' | ')} |`), '');
    const ch = k.tokens.color[m].chart;
    L.push(`Chart (${m}): categorical ${ch.categorical.map(hex).join(' ')}; sequential ${ch.sequential.map(hex).join(' ')}; diverging ${ch.diverging.map(hex).join(' ')}. Label series directly; hue alone does not tell them apart for everyone.`, '');
  }
  L.push('### Checks on the colours', '');
  for (const m of k.modes) {
    const rows = k.contrast.filter(c => c.mode === m); const low = [...rows].sort((a, b) => a.ratio / a.min - b.ratio / b.min)[0];
    L.push(`- ${m}: ${rows.filter(c => c.ok).length}/${rows.length} contrast pairs hold; the closest is ${low.fg} on ${low.bg} at ${low.ratio}:1 (needs ${low.min}:1). Colour blindness: ${k.cvd[m].checked} status pairs simulated, ${k.cvd[m].close.length ? k.cvd[m].close.map(x => `${x.a}/${x.b} close under ${x.type}`).join(', ') : 'none close'}.`);
  }
  L.push('');
  for (const p of k.patterns) {
    L.push(`## ${p.layout} ${p.name}`, '', p.use, '', '| Region | Component | Note |', '|---|---|---|', ...p.regions.map(r => `| ${r.region} | ${r.component || '—'} | ${r.note || ''} |`), '');
    if (p.checks.length) L.push(`Checks for this layout: ${p.checks.join(', ')}.`, '');
  }
  L.push('## Structure', '', ...k.structure.map(s => `- ${s}`), '', '## Rules that hold in every style', '', ...k.rules.map(r => `- **${r.id}.** ${r.rule} *Check:* ${r.check}`), '',
    '## Checks before done', '', ...k.checks.map(c => `- **${c.id}** (${c.kind}, ${c.severity}). ${c.check}`), '');
  return L.join('\n');
}

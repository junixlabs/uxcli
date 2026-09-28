// Mockups: screens drawn before they are built. The agent draws variants of a screen into
// .uxcli/mockups/<state>/<variant>.html; a person picks one in pick.json; the picked variants are
// drawn as the journey's flow. Pure: what a pick may say, what each variant's status is, which
// screens a project's journeys name and in what order, and the card.
//
// pick.json: { schema_version: 1, pick: '<variant>', parts?: { '<variant>': 'what was taken' },
//              by: { type, ref }, note?, when? }
// A pick without `by` is not a pick: nobody stands behind it. A pick naming a variant that is not
// on disk points at nothing. An agent may write the file on a person's say-so and says so in note.

export function parsePick(doc, variants = []) {
  const problems = [];
  if (!doc || typeof doc !== 'object') return { value: null, problems: ['pick.json is not an object'] };
  if (doc.schema_version !== 1) problems.push('schema_version must be 1');
  if (typeof doc.pick !== 'string' || !doc.pick) problems.push('pick names no variant');
  else if (!variants.includes(doc.pick)) problems.push(`pick "${doc.pick}" is not a variant on disk (${variants.join(', ') || 'none'})`);
  if (!doc.by || typeof doc.by !== 'object' || !doc.by.type || !doc.by.ref) problems.push('by{type, ref} missing: a pick nobody stands behind is not a pick');
  const parts = doc.parts && typeof doc.parts === 'object' ? doc.parts : {};
  for (const [v, what] of Object.entries(parts)) {
    if (!variants.includes(v)) problems.push(`parts["${v}"] is not a variant on disk`);
    if (v === doc.pick) problems.push(`parts["${v}"] is the pick itself`);
    if (typeof what !== 'string' || !what) problems.push(`parts["${v}"] says nothing about what was taken`);
  }
  for (const k of Object.keys(doc)) if (!['schema_version', 'pick', 'parts', 'by', 'note', 'when'].includes(k)) problems.push(`unknown key "${k}"`);
  return { value: problems.length ? null : { pick: doc.pick, parts, by: doc.by, note: doc.note || null, when: doc.when || null }, problems };
}

export const statusOf = (variant, pick) => !pick ? 'no-pick' : pick.pick === variant ? 'pick' : pick.parts[variant] ? 'part' : 'not-taken';

// The screens a project's journeys name, in the order a reader meets them: workflow by workflow,
// before then after. Each screen knows the steps that leave it (their ui target and where they go),
// which is what a flow needs to draw a hotspot and a connection.
export function screensOf(journeys) {
  const order = []; const by = new Map();
  const screen = id => { if (!by.has(id)) { by.set(id, { id, journeys: [], leaves: [] }); order.push(id); } return by.get(id); };
  for (const j of journeys) {
    for (const w of j.workflows || []) {
      for (const s of w.steps || []) {
        if (s.kind === 'fixture' || !s.before) continue;
        const from = screen(s.before); if (!from.journeys.includes(j.id)) from.journeys.push(j.id);
        const ui = [...(s.interactions || [])].reverse().find(x => x.type === 'ui'); // the last ui interaction is the one that leaves the screen
        from.leaves.push({ journey: j.id, workflow: w.id, step: s.id, action: s.action || '', target: ui?.target || null, to: s.after || null });
        if (s.after) { const t = screen(s.after); if (!t.journeys.includes(j.id)) t.journeys.push(j.id); }
      }
    }
  }
  return order.map(id => by.get(id));
}

// A hook written for a run carries run-time params: [data-uxcli=lead-row][data-id={leadId}]. A mockup
// has the hook and not the param; the lookup drops any attribute selector that names a param.
export const hookOf = target => target ? target.replace(/\[[^\]]*\{[^}]*\}[^\]]*\]/g, '') : null;

// screens: [{ id, variants: [name], pick: value|null, problems: [] }]
export function mockupsCard(m) {
  const L = [`uxcli mockups · ${m.dir}`, ''];
  if (!m.screens.length) { L.push('  no journey names a screen yet; a mockup answers to a state in .uxcli/journeys/'); return L.join('\n'); }
  for (const s of m.screens) {
    const n = s.variants.length;
    const status = s.problems.length ? 'REFUSED' : !n ? 'no mockup' : s.pick ? `pick ${s.pick.pick}` : 'no pick yet';
    L.push(`  ${status.padEnd(14)} ${s.id.padEnd(32)} ${n ? `${n} variant${n === 1 ? '' : 's'}: ${s.variants.join(', ')}` : `.uxcli/mockups/${s.id}/<variant>.html`}`);
    for (const p of s.problems) L.push(`  ${''.padEnd(14)} ${''.padEnd(32)} pick.json: ${p}`);
    for (const h of s.hooksMissing || []) L.push(`  ${''.padEnd(14)} ${''.padEnd(32)} hook ${h.hook} is not in ${h.variant}.html — the step "${h.action}" has nothing to leave from`);
  }
  const drawn = m.screens.filter(s => s.variants.length).length; const picked = m.screens.filter(s => s.pick).length;
  L.push('', `  ${m.screens.length} screens · ${drawn} drawn · ${picked} picked`);
  if (m.page) L.push(`  page   ${m.page}`);
  L.push('', picked < m.screens.length
    ? '  a person picks: .uxcli/mockups/<state>/pick.json with pick, by{type, ref}; parts{} for what was taken from another variant'
    : '  every screen is picked; build the picked variant to the hooks the journey names, then uxcli run');
  return L.join('\n');
}

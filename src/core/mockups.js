// Mockups: screens drawn before they are built. The agent draws variants of a screen into
// .uxcli/mockups/<state>/<variant>.html; a person picks one in pick.json; the picked variants are
// drawn as the journey's flow. Pure: what a pick may say, what each variant's status is, which
// screens a project's journeys name and in what order, and the card.
//
// pick.json: { schema_version: 1, pick: '<variant>', sha256: '<of the picked file>', parts?: { '<variant>': 'what was taken' },
//              by: { type, ref }, note?, when? }
// A pick without `by` is not a pick: nobody stands behind it. A pick naming a variant that is not
// on disk points at nothing. A pick whose sha256 is not the file's is a signature over a drawing
// that moved: the person chose something else than what is there now, and the pick is refused
// until someone looks again. An agent may write the file on a person's say-so and says so in note.

export function parsePick(doc, variants = [], hashes = {}) {
  const problems = [];
  if (!doc || typeof doc !== 'object') return { value: null, problems: ['pick.json is not an object'] };
  if (doc.schema_version !== 1) problems.push('schema_version must be 1');
  if (typeof doc.pick !== 'string' || !doc.pick) problems.push('pick names no variant');
  else if (!variants.includes(doc.pick)) problems.push(`pick "${doc.pick}" is not a variant on disk (${variants.join(', ') || 'none'})`);
  if (!doc.by || typeof doc.by !== 'object' || !doc.by.type || !doc.by.ref) problems.push('by{type, ref} missing: a pick nobody stands behind is not a pick');
  if (typeof doc.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(doc.sha256)) problems.push('sha256 missing: a pick names the drawing it chose by its hash (uxcli mockups prints it)');
  else if (hashes[doc.pick] && hashes[doc.pick] !== doc.sha256) problems.push(`pick predates the drawing: ${doc.pick}.html changed since it was picked (now ${hashes[doc.pick].slice(0, 12)}…); look again, then update sha256`);
  const parts = doc.parts && typeof doc.parts === 'object' ? doc.parts : {};
  for (const [v, what] of Object.entries(parts)) {
    if (!variants.includes(v)) problems.push(`parts["${v}"] is not a variant on disk`);
    if (v === doc.pick) problems.push(`parts["${v}"] is the pick itself`);
    if (typeof what !== 'string' || !what) problems.push(`parts["${v}"] says nothing about what was taken`);
  }
  for (const k of Object.keys(doc)) if (!['schema_version', 'pick', 'sha256', 'parts', 'by', 'note', 'when'].includes(k)) problems.push(`unknown key "${k}"`);
  return { value: problems.length ? null : { pick: doc.pick, sha256: doc.sha256, parts, by: doc.by, note: doc.note || null, when: doc.when || null }, problems };
}

export const statusOf = (variant, pick) => !pick ? 'no-pick' : pick.pick === variant ? 'pick' : pick.parts[variant] ? 'part' : 'not-taken';

// The screens a project's journeys name, in the order a reader meets them: workflow by workflow,
// before then after. Each screen knows the steps that leave it (their ui target and where they go),
// which is what a flow needs to draw a hotspot and a connection.
export function screensOf(journeys) {
  const order = []; const by = new Map();
  const screen = id => { if (!by.has(id)) { by.set(id, { id, journeys: [], leaves: [], hooks: [] }); order.push(id); } return by.get(id); };
  const want = (sc, sel) => { if (sel && !sel.includes('{') && !sc.hooks.includes(sel)) sc.hooks.push(sel); };
  for (const j of journeys) {
    for (const [id, st] of Object.entries(j.states || {})) for (const x of st?.signals || []) if ((x.observer === 'dom' || x.observer === 'text') && x.selector) want(screen(id), x.selector);
    for (const w of j.workflows || []) {
      for (const s of w.steps || []) {
        if (s.kind === 'fixture' || !s.before) continue;
        const from = screen(s.before); if (!from.journeys.includes(j.id)) from.journeys.push(j.id);
        const ui = [...(s.interactions || [])].reverse().find(x => x.type === 'ui'); // the last ui interaction is the one that leaves the screen
        from.leaves.push({ journey: j.id, workflow: w.id, step: s.id, action: s.action || '', target: ui?.target || null, to: s.after || null });
        want(from, hookOf(ui?.target));
        if (s.after) { const t = screen(s.after); if (!t.journeys.includes(j.id)) t.journeys.push(j.id); }
      }
    }
  }
  return order.map(id => by.get(id));
}

// A hook written for a run carries run-time params: [data-uxcli=lead-row][data-id={leadId}]. A mockup
// has the hook and not the param; the lookup drops any attribute selector that names a param.
export const hookOf = target => target ? target.replace(/\[[^\]]*\{[^}]*\}[^\]]*\]/g, '') : null;

// A variant's receipt: what the drawing carries, checked, not claimed. `found` is what the browser
// saw of the hooks the screen wants; external is every resource the file reaches for over the
// network (a mockup is self-contained or it is a page that may look different tomorrow); lorem is
// filler where the actor's words should be.
export function receiptOf({ html = '', wanted = [], found = [] }) {
  const external = [...html.matchAll(/(?:src|href)\s*=\s*["']?(https?:\/\/[^"'\s>]+)/gi)].map(m => m[1])
    .concat([...html.matchAll(/@import\s+(?:url\()?["']?(https?:\/\/[^"')\s]+)/gi)].map(m => m[1]));
  const missing = wanted.filter(h => !found.includes(h));
  const lorem = /lorem ipsum/i.test(html);
  const problems = [...missing.map(h => `hook ${h} not in the drawing`), ...external.map(u => `reaches for ${u}`), ...(lorem ? ['lorem ipsum where the actor\'s words should be'] : [])];
  return { hooks: { wanted, found: wanted.filter(h => found.includes(h)), missing }, external, lorem, problems, ok: !problems.length };
}

// screens: [{ id, variants: [name], pick: value|null, problems: [], receipts?: { [variant]: receipt }, hashes?: { [variant]: sha256 } }]
export function mockupsCard(m) {
  const L = [`uxcli mockups · ${m.dir}`, ''];
  if (!m.screens.length) { L.push('  no journey names a screen yet; a mockup answers to a state in .uxcli/journeys/'); return L.join('\n'); }
  for (const s of m.screens) {
    const n = s.variants.length;
    const status = s.problems.length ? 'REFUSED' : !n ? 'no mockup' : s.pick ? `pick ${s.pick.pick}` : 'no pick yet';
    L.push(`  ${status.padEnd(14)} ${s.id.padEnd(32)} ${n ? `${n} variant${n === 1 ? '' : 's'}: ${s.variants.join(', ')}` : `.uxcli/mockups/${s.id}/<variant>.html`}`);
    for (const p of s.problems) L.push(`  ${''.padEnd(14)} ${''.padEnd(32)} pick.json: ${p}`);
    for (const v of s.variants) {
      const r = s.receipts?.[v]; if (!r) continue;
      const line = r.ok ? `hooks ${r.hooks.found.length}/${r.hooks.wanted.length} · self-contained` : r.problems.join(' · ');
      L.push(`  ${''.padEnd(14)} ${''.padEnd(32)} ${v.padEnd(14)} ${line}${!s.pick && s.hashes?.[v] ? `\n  ${''.padEnd(14)} ${''.padEnd(32)} ${''.padEnd(14)} sha256 ${s.hashes[v]}` : ''}`);
    }
  }
  const drawn = m.screens.filter(s => s.variants.length).length; const picked = m.screens.filter(s => s.pick).length;
  L.push('', `  ${m.screens.length} screens · ${drawn} drawn · ${picked} picked`);
  if (m.page) L.push(`  page   ${m.page}`);
  L.push('', picked < m.screens.length
    ? '  a person picks: .uxcli/mockups/<state>/pick.json with pick, by{type, ref}; parts{} for what was taken from another variant'
    : '  every screen is picked; build the picked variant to the hooks the journey names, then uxcli run');
  return L.join('\n');
}

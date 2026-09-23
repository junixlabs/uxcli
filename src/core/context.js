// What this product is, as fields rather than a paragraph handed to a model. A prompt leaves nothing
// behind: no way to ask which claim rested on which assumption, or to disagree with one part of it.
//
// in: the parsed context document    out: { known, missing, unsourced, complete }
//
// It holds no UX knowledge and generates none; every field must say who says so.

export const FIELDS = {
  domain: 'what kind of product this is, in the words the people who work on it use',
  audiences: 'who uses it, and what each of them came to do',
  constraints: 'what is not negotiable — regulatory, contractual, technical',
  journeys: 'the processes that matter, named; the steps come from runs, not from here',
};

// So a proposal citing context cannot inherit standing from a sentence nobody will put a name to.
const sourced = v => v && typeof v === 'object' && !Array.isArray(v) && typeof v.source === 'string' && v.source.trim();

export function readContext(doc) {
  const known = {}; const missing = []; const unsourced = [];
  for (const key of Object.keys(FIELDS)) {
    const v = doc?.[key];
    if (v === undefined || v === null) { missing.push(key); continue; }
    if (!sourced(v)) { unsourced.push(key); continue; }
    known[key] = v;
  }
  return {
    known, missing, unsourced,
    // Not scored: one field of four is not "25% ready", and a number would hide which.
    complete: missing.length === 0 && unsourced.length === 0,
  };
}

// Only sourced fields, so a claim cannot quietly cite something nobody signed.
export const citable = ctx => Object.entries(ctx.known).map(([field, v]) => ({ field, source: v.source }));

export function contextCard(ctx, file) {
  const L = [`uxcli context · ${file}`, ''];
  for (const key of Object.keys(FIELDS)) {
    const state = ctx.known[key] ? 'known' : ctx.unsourced.includes(key) ? 'unsourced' : 'missing';
    L.push(`  ${state.padEnd(10)} ${key.padEnd(13)} ${ctx.known[key] ? `source ${ctx.known[key].source}` : FIELDS[key]}`);
  }
  if (ctx.unsourced.length) L.push('', `  ${ctx.unsourced.length} field${ctx.unsourced.length === 1 ? '' : 's'} written but unsourced. A claim nobody will name a source for cannot be cited by a proposal.`);
  if (ctx.missing.length) L.push('', `  ${ctx.missing.length} field${ctx.missing.length === 1 ? '' : 's'} not written. Nothing here is inferred: a context this tool guessed would be a context nobody could dispute.`);
  return L.join('\n');
}

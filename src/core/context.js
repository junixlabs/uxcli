// What this product is, as fields rather than a paragraph handed to a model. A prompt leaves nothing
// behind: no way to ask which claim rested on which assumption, or to disagree with one part of it.
//
// in: the parsed context document, and what the caller read at each source it names
// out: { fields, standing, portable, undeclared, citable }
//
// It holds no UX knowledge and generates none; every field must say who says so — and the version
// this replaces asked only whether `source` was a non-empty string. A filename typed next to a
// paragraph passed. Three questions it never asked are the three ways a declaration goes wrong, and
// all three were found in this project's own file: the document may not exist where the reader is,
// it may not say what the field says, and it may have said it once and since changed.
//
// So a source stops being a name and becomes a citation — a document and the words taken out of it —
// and the same treatment commitments already get: `admit` asks whether a claim may enter at all,
// `anchor` asks whether the evidence under it is still the evidence signed for. This asks both of a
// declaration.
//
// The caller resolves documents, because core reaches nothing. It hands in:
//   docs: { [doc]: { found: boolean, text?: string, tracked?: boolean } }

export const FIELDS = {
  domain: 'what kind of product this is, in the words the people who work on it use',
  audiences: 'who uses it, and what each of them came to do',
  constraints: 'what is not negotiable — regulatory, contractual, technical',
  journeys: 'the processes that matter, named; the steps come from runs, not from here',
};

// Six standings, ordered worst first, because a reader scanning the card wants the ones that need
// them at the top. `quoted` is the ceiling a machine can reach and it is not the same as true: it
// says the words behind the field are really in the document, not that the field follows from them.
// That last step is a person's, and the card says so rather than letting `quoted` be read as `true`.
export const STANDINGS = ['undeclared', 'unsourced', 'unquoted', 'unresolved', 'drifted', 'quoted'];

// A citation, in either spelling. The old form was a bare string and cannot be checked, so it reads
// `unquoted` rather than passing: a format that predates the question does not get to answer it.
export const citationOf = v => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const s = v.source;
  if (typeof s === 'string' && s.trim()) return { doc: s.trim(), quote: null };
  if (!s || typeof s !== 'object' || Array.isArray(s)) return null;
  const doc = typeof s.doc === 'string' && s.doc.trim() ? s.doc.trim() : null;
  if (!doc) return null;
  const quote = typeof s.quote === 'string' && s.quote.trim() ? s.quote.trim() : null;
  return { doc, quote };
};

// Whitespace in a document is not part of what it says: a quote broken across two lines, or
// re-wrapped when the file was edited, is the same sentence. Case is left alone — it carries meaning
// in names, and a reader who cannot find their own quote by eye is owed the mismatch.
const flat = s => String(s).replace(/\s+/g, ' ').trim();

export function standingOf(value, docs = {}) {
  if (value === undefined || value === null) return { standing: 'undeclared' };
  const cite = citationOf(value);
  if (!cite) return { standing: 'unsourced' };
  if (!cite.quote) return { standing: 'unquoted', doc: cite.doc };
  const d = docs[cite.doc];
  if (!d || !d.found || typeof d.text !== 'string') return { standing: 'unresolved', doc: cite.doc, quote: cite.quote };
  if (!flat(d.text).includes(flat(cite.quote))) return { standing: 'drifted', doc: cite.doc, quote: cite.quote };
  return { standing: 'quoted', doc: cite.doc, quote: cite.quote, portable: d.tracked !== false };
}

export function readContext(doc, { docs = {} } = {}) {
  const fields = {};
  for (const key of Object.keys(FIELDS)) {
    const value = doc?.[key];
    fields[key] = { field: key, means: FIELDS[key], value: value?.value ?? null, ...standingOf(value, docs) };
  }
  const at = s => Object.values(fields).filter(f => f.standing === s);
  return {
    fields,
    // Not a score. One field of four is not "25% ready", and a single number would hide which field
    // and which of the five ways it fell short.
    standing: Object.fromEntries(STANDINGS.map(s => [s, at(s).map(f => f.field)])),
    // A source only the machine that wrote it can open fails the third audience by construction:
    // they arrive from a diff. It is not a standing — the quote is either in the document or it is
    // not, wherever the document lives — so it is reported beside it, not folded into it.
    portable: at('quoted').filter(f => f.portable === false).map(f => f.field),
    undeclared: at('undeclared').map(f => f.field),
  };
}

// Only what a proposal may lean on. The intent was always "a claim cannot inherit standing from a
// sentence nobody will put a name to"; until the quote was checked, that was a hope.
export const citable = ctx => Object.values(ctx.fields)
  .filter(f => f.standing === 'quoted')
  .map(f => ({ field: f.field, source: f.doc, quote: f.quote }));

const SAYS = {
  undeclared: k => FIELDS[k],
  unsourced: () => 'written, but names no document — nothing a proposal may cite',
  unquoted: f => `names ${f.doc} but quotes nothing from it: no one can check the field came from there`,
  unresolved: f => `quotes ${f.doc}, which could not be read here`,
  drifted: f => `quotes ${f.doc}, which no longer contains those words`,
  quoted: f => `${f.doc}${f.portable === false ? ' (not in the repository)' : ''}`,
};

export function contextCard(ctx, file) {
  const L = [`uxcli context · ${file}`, ''];
  for (const key of Object.keys(FIELDS)) {
    const f = ctx.fields[key];
    L.push(`  ${f.standing.padEnd(11)} ${key.padEnd(13)} ${SAYS[f.standing](f.standing === 'undeclared' ? key : f)}`);
  }
  const n = (list, one, many) => list.length === 1 ? `1 field ${one}` : `${list.length} fields ${many}`;
  const s = ctx.standing;
  if (s.drifted.length) L.push('', `  ${n(s.drifted, 'quotes a document that no longer says it', 'quote documents that no longer say it')}: ${s.drifted.join(', ')}. The declaration did not change; the document did. Re-read it and quote what is there, or say what changed.`);
  if (s.unresolved.length) L.push('', `  ${n(s.unresolved, 'cites a document that could not be read', 'cite documents that could not be read')}: ${s.unresolved.join(', ')}.`);
  if (s.unquoted.length) L.push('', `  ${n(s.unquoted, 'names a document but quotes nothing', 'name a document but quote nothing')}: ${s.unquoted.join(', ')}. A name is not a citation — nothing here can be checked against the document it claims to come from.`);
  if (s.unsourced.length) L.push('', `  ${n(s.unsourced, 'is written but unsourced', 'are written but unsourced')}: ${s.unsourced.join(', ')}.`);
  if (ctx.undeclared.length) L.push('', `  ${n(ctx.undeclared, 'is not written', 'are not written')}: ${ctx.undeclared.join(', ')}. Nothing here is inferred: a context this tool guessed would be a context nobody could dispute.`);
  if (ctx.portable.length) L.push('', `  ${n(ctx.portable, 'quotes a document that is not in the repository', 'quote documents that are not in the repository')}: ${ctx.portable.join(', ')}. It resolves on this machine and nowhere else, so the reader who arrives from a diff cannot open it.`);
  // Printed whenever anything is quoted, and never folded into the count above it. `quoted` is where
  // a machine stops: one quote anchors one field, and a field that holds a list is spot-checked by it,
  // not item by item. Reading `quoted` as `true` is the mistake this whole rebuild exists to stop.
  if (s.quoted.length) L.push('', `  ${n(s.quoted, 'quotes a document that says those words', 'quote documents that say those words')}. Whether the field follows from the quote is not something this checked — that reading is yours.`);
  return L.join('\n');
}

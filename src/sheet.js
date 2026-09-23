// uxcli sheet: the project's own commitments on its design tokens, read from uxcli.commitments.json. Provenance `project`.
// Today one kind: `contrast` (two token names, a minimum ratio). No commitments file → nothing to say.
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
import { tokenIndex, tokenAliases } from './tokens.js';
// The kinds a commitment may be, and the arithmetic each one does. Registry, not a chain of `if`.
import { KINDS, kindNames, ratio } from './core/commitment/kinds.js';
import { observedFlow } from './core/reality.js';
// Whether an entry is eligible to produce a verdict at all. A sentence nobody could falsify is
// refused before measurement rather than blamed on the instrument for having no method.
import { admit } from './core/commitment/admit.js';
// And whether the evidence it was derived from is still the evidence that was signed for.
import { anchorOf, anchorState } from './core/commitment/anchor.js';
import { NAMES, found, readAuthorities, readEntries } from './adapters/store/project-files.js';
import { runHash } from './adapters/store/run-hash.js';

export { ratio };
// Where these documents live and what they are called is the store's business, not this file's.
export const FILE = NAMES.commitments;
export const findCommitments = root => found(root, 'commitments');
export { readAuthorities, readEntries };

const lum = hex => { const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };

// token → hex: the reverse of tokenIndex. The last declaration wins, as in a stylesheet read top to bottom; a token declared with two colours is ambiguous and reported.
export function tokenValues(root) {
  const idx = tokenIndex(root), aliases = tokenAliases(root); const out = {}; for (const [hex, decls] of Object.entries(idx)) for (const d of decls) (out[d.token] ||= new Set()).add(hex);
  const resolve = (t, depth) => { const own = out[t] ? [...out[t]] : []; if (!aliases[t] || depth > 8) return own; return [...own, ...[...aliases[t]].flatMap(x => resolve(x, depth + 1))]; };
  // An alias keeps every colour it can resolve to, plus any direct colour a theme block gives it: two colours make the token ambiguous, reported as such.
  for (const a of Object.keys(aliases)) { const hexes = resolve(a, 0); if (hexes.length) { out[a] ||= new Set(); for (const h of hexes) out[a].add(h); } }
  return out;
}

export function evaluate(file, root, { run = null } = {}) {
  const text = fs.readFileSync(file, 'utf8'); const doc = JSON.parse(text); const sha256 = crypto.createHash('sha256').update(text).digest('hex');
  const dir = root || path.dirname(file);
  const values = tokenValues(dir); const authorities = readAuthorities(dir);
  // A kind declares what it is decided by. Without a run, a flow kind is not a bad commitment — it is
  // a commitment this invocation lacks the evidence for, and the card has to say which.
  const ctx = { values, flow: run ? observedFlow(run) : null };
  const results = []; const refused = [];
  for (const e of doc.entries || []) {
    const base = { id: e.id, kind: e.kind, provenance: 'project', owner: e.owner || doc.owner || null, source: e.source || doc.source || null, why: e.why || null };
    // One gate, before anything is measured. What it refuses without a verdict never enters the
    // ladder at all — it is reported on its own, so nothing that could not be falsified is quietly
    // counted among the things that were.
    const seat = admit(e, { doc, authorities });
    if (!seat.admitted) {
      if (seat.verdict) results.push({ ...base, verdict: seat.verdict, reason: seat.reason, signature: seat.signature || null });
      else refused.push({ id: e.id, kind: e.kind, reason: seat.reason });
      continue;
    }
    base.signature = seat.signature || null;
    // Admitted, and still pinned to what it was read from. A signature stands over evidence; when the
    // run that evidence came from has changed since, the signature no longer covers what is there, and
    // an entry nobody has signed for returns `not-committed` rather than a verdict it has not earned.
    const anchor = anchorOf(e);
    if (anchor && anchorState({ entry: e, actual: runHash(path.resolve(dir, anchor.run)) }) === 'differs') {
      results.push({ ...base, verdict: 'not-committed', reason: `derived from ${anchor.run}, whose run.json has changed since this was signed — re-derive the entry and sign it again` });
      continue;
    }
    // The kind decides; this loop does not know how. What used to be `if (e.kind !== 'contrast')` — one
    // capability hard-coded into the middle of an evaluation — is a lookup now, and an unknown kind is
    // `unmeasurable` because nobody registered a way to measure it, which is the true reason.
    const kind = KINDS[e.kind];
    if (!kind) { results.push({ ...base, verdict: 'unmeasurable', reason: `kind ${e.kind} is not measured yet (registered: ${kindNames().join(', ')})` }); continue; }
    results.push({ ...base, ...kind.measure(e, ctx, dir) });
  }
  const rel = path.relative(process.cwd(), file); return { file: rel.startsWith('..') ? file : rel, sha256, results, refused };
}

export function sheetCard(s) {
  const L = [`uxcli sheet · ${s.file} (sha256 ${s.sha256.slice(0, 12)})`, ''];
  if (!s.results.length) L.push('  no entries');
  for (const r of s.results) L.push(`${(r.id || '?').padEnd(28)} ${r.verdict.toUpperCase().padEnd(13)} ${r.reason}`, `  rule   ${r.kind} (project · ${r.signature ? `signed ${r.signature}` : `owner ${r.owner || '—'}`} · source ${r.source || '—'})${r.why ? ` · ${r.why}` : ''}`);
  // Printed apart from the verdicts, and never folded into them. These are entries that did not
  // reach measurement — counting them as anything else would be the error this whole layer exists
  // to stop.
  if (s.refused?.length) {
    L.push('', `  ${s.refused.length} entr${s.refused.length === 1 ? 'y was' : 'ies were'} not admitted, and produced no verdict:`);
    for (const r of s.refused) L.push(`  ${(r.id || '?').padEnd(26)} ${r.reason}`);
  }
  return L.join('\n');
}

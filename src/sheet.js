// uxcli sheet: the project's own commitments on its design tokens, read from uxcli.commitments.json. Provenance `project`.
// Today one kind: `contrast` (two token names, a minimum ratio). No commitments file → nothing to say.
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
import { tokenIndex, tokenAliases } from './tokens.js';

export const FILE = 'uxcli.commitments.json';
export function findCommitments(root) { const p = path.join(root || '.', FILE); return fs.existsSync(p) ? p : null; }

const lum = hex => { const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
export const ratio = (a, b) => { const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x); return Math.round(((l1 + 0.05) / (l2 + 0.05)) * 100) / 100; };

// token → hex: the reverse of tokenIndex. The last declaration wins, as in a stylesheet read top to bottom; a token declared with two colours is ambiguous and reported.
export function tokenValues(root) {
  const idx = tokenIndex(root), aliases = tokenAliases(root); const out = {}; for (const [hex, decls] of Object.entries(idx)) for (const d of decls) (out[d.token] ||= new Set()).add(hex);
  for (const a of Object.keys(aliases)) { let t = a, n = 0; while (aliases[t] && n++ < 8) t = aliases[t]; if (out[t] && !out[a]) out[a] = out[t]; }
  return out;
}

export function evaluate(file, root) {
  const text = fs.readFileSync(file, 'utf8'); const doc = JSON.parse(text); const sha256 = crypto.createHash('sha256').update(text).digest('hex');
  const values = tokenValues(root || path.dirname(file)); const results = [];
  for (const e of doc.entries || []) {
    const base = { id: e.id, kind: e.kind, provenance: 'project', owner: e.owner || doc.owner || null, source: e.source || doc.source || null, why: e.why || null };
    if (!base.owner || !base.source) { results.push({ ...base, verdict: 'not-committed', reason: 'a commitment needs an owner and a source' }); continue; }
    if (e.suppressed) { results.push({ ...base, verdict: 'suppressed', reason: e.suppressed }); continue; }
    if (e.kind !== 'contrast') { results.push({ ...base, verdict: 'unmeasurable', reason: `kind ${e.kind} is not measured yet` }); continue; }
    const fg = values[e.fg], bg = values[e.bg];
    if (!fg || !bg) { results.push({ ...base, verdict: 'unmeasurable', reason: `${!fg ? e.fg : e.bg} is not declared as a colour under ${root || path.dirname(file)}` }); continue; }
    if (fg.size > 1 || bg.size > 1) { results.push({ ...base, verdict: 'unmeasurable', reason: `${fg.size > 1 ? e.fg : e.bg} is declared with more than one colour (${[...(fg.size > 1 ? fg : bg)].join(', ')})` }); continue; }
    const [f] = fg, [b] = bg; const r = ratio(f, b); const min = Number(e.min);
    if (!(min > 0)) { results.push({ ...base, verdict: 'not-committed', reason: 'no minimum ratio' }); continue; }
    results.push({ ...base, verdict: r >= min ? 'pass' : 'fail', fg: e.fg, bg: e.bg, fgHex: f, bgHex: b, ratio: r, min, reason: `${e.fg} ${f} on ${e.bg} ${b} is ${r}:1, committed minimum ${min}:1` });
  }
  const rel = path.relative(process.cwd(), file); return { file: rel.startsWith('..') ? file : rel, sha256, results };
}

export function sheetCard(s) {
  const L = [`uxcli sheet · ${s.file} (sha256 ${s.sha256.slice(0, 12)})`, ''];
  if (!s.results.length) L.push('  no entries');
  for (const r of s.results) L.push(`${(r.id || '?').padEnd(28)} ${r.verdict.toUpperCase().padEnd(13)} ${r.reason}`, `  rule   ${r.kind} (project · owner ${r.owner || '—'} · source ${r.source || '—'})${r.why ? ` · ${r.why}` : ''}`);
  return L.join('\n');
}

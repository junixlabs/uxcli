// uxcli diff <a> <b> [--gate]: drift between two saved runs (`run … --json`, `sheet --json`) of the same target.
// Each probe or commitment entry is matched by its key; the card names the delta class. Only a `fail` at b blocks, as everywhere else.
import fs from 'node:fs';

const key = p => p.id ? `commitment ${p.id}` : p.sc ? `${p.sc} ${p.probe || ''}`.trim() : null;
const items = doc => Array.isArray(doc.results) ? doc.results : Array.isArray(doc.probes) ? doc.probes : [];
const rank = v => ({ pass: 0, 'not-applicable': 0, suppressed: 0, finding: 1, 'not-committed': 1, untested: 1, stale: 1, unmeasurable: 2, fail: 3 })[v] ?? 2;

export function diff(aPath, bPath) {
  const A = JSON.parse(fs.readFileSync(aPath, 'utf8')), B = JSON.parse(fs.readFileSync(bPath, 'utf8'));
  const a = new Map(items(A).map(p => [key(p), p])), b = new Map(items(B).map(p => [key(p), p]));
  const rows = [];
  for (const k of new Set([...a.keys(), ...b.keys()])) {
    const pa = a.get(k), pb = b.get(k);
    const va = pa?.verdict ?? null, vb = pb?.verdict ?? null;
    let delta;
    if (!pa) delta = 'new'; else if (!pb) delta = 'gone';
    else if (va === vb) delta = 'same';
    else if (rank(vb) > rank(va)) delta = 'regressed'; else delta = 'improved';
    rows.push({ key: k, a: va, b: vb, delta, why: pb?.why || pb?.reason || pa?.why || pa?.reason || '' });
  }
  const sameTarget = (A.url || A.file || A.journey || null) === (B.url || B.file || B.journey || null);
  return { a: { path: aPath, target: A.url || A.file || A.journey || null, sha256: A.sha256 || null }, b: { path: bPath, target: B.url || B.file || B.journey || null, sha256: B.sha256 || null }, sameTarget, rows };
}

export function diffCard(d) {
  const L = [`uxcli diff · ${d.a.path} → ${d.b.path}`, ''];
  if (!d.sameTarget) L.push(`  note   the two runs name different targets (${d.a.target} vs ${d.b.target}); the comparison is by probe, not by page`, '');
  for (const r of d.rows) L.push(`${r.key.padEnd(30)} ${String(r.a || '—').padEnd(15)} → ${String(r.b || '—').padEnd(15)} ${r.delta.toUpperCase().padEnd(10)}${r.why ? ' ' + r.why.slice(0, 90) : ''}`);
  const n = d.rows.reduce((o, r) => (o[r.delta] = (o[r.delta] || 0) + 1, o), {});
  L.push('', `  ${Object.entries(n).map(([k, v]) => `${v} ${k}`).join(', ')}`);
  return L.join('\n');
}
export const gateExit = d => d.rows.some(r => r.b === 'fail') ? 2 : 0;

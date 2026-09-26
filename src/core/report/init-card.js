// The init card: where the project stands on two axes, what that lets it do, and the way up.
// Reads a Projection (index.json). Nothing here is a setup message; the level is measured.
import { join, row, bullet, list } from './text.js';

// Capabilities are a property of the level, not of the project, so they live here once.
const TRUST = {
  observe: { can: ['run a journey and record what was observed', 'report finding'],
    not: ['say fail — no confirmed commitment or no validated measurement yet', 'block a merge'] },
  verify: { can: ['say fail against a signed commitment and exit 2', 'hold stable states as prerequisites'],
    not: ['block a merge — effects, false-positive rate and instrumentation are not yet sufficient'] },
  gate: { can: ['block a merge on fail'], not: [] },
};
const REACH = {
  'read-only': { can: ['observe pages and interact with the browser'],
    not: ['provision identity or fixtures', 'mutate data', 'intercept or inject failure'] },
  mutate: { can: ['provision identity and fixtures through the project provisioner, in a synthetic tenant'],
    not: ['intercept at the browser or inject failure (chaos)'] },
  inject: { can: ['intercept at the browser and inject failure in an isolated environment'], not: [] },
};
const reachKey = r => (r === 'observe' || r === 'interact' ? 'read-only' : r);
const abilitiesOf = (level = {}) => { const t = TRUST[level.trust] || { can: [], not: [] }; const r = REACH[reachKey(level.reach)] || { can: [], not: [] }; return { can: [...t.can, ...r.can], not: [...t.not, ...r.not] }; };

export function initCard(p = {}) {
  const level = p.level || {}; const ab = abilitiesOf(level);
  const L = [`uxcli init${p.generatedAt ? ` · projection ${p.generatedAt}` : ''}${p.rebuildable === false ? '' : ' · derived, rebuildable'}`, ''];

  L.push('  level (measured, not declared)');
  L.push(...row('trust', `${level.trust || 'unknown'}${level.story ? ` — ${level.story}` : ''}`, { indent: 4 }));
  L.push(...row('reach', `${level.reach || 'unknown'}`, { indent: 4 }));

  L.push('', '  can now');
  for (const c of ab.can) L.push(...bullet(c));
  if (!ab.can.length) L.push('    - nothing measured yet: no level could be computed');
  L.push('', '  cannot yet');
  for (const c of ab.not) L.push(...bullet(c));
  if (!ab.not.length) L.push('    - top of both axes; the list below is what would pull it down');

  // Always printed from the projection, never suppressed by the level: a gate-level project with an
  // open list is a project about to slip.
  L.push('', '  path to the next level');
  const toNext = level.toNext || {};
  if (!Object.keys(toNext).length) L.push('    nothing listed — run a journey first; the level is computed from runs');
  for (const [axis, items] of Object.entries(toNext)) {
    L.push(`    ${axis}`);
    for (const it of items || []) L.push(...bullet(it, 6));
  }

  L.push('', '  awaiting a human');
  const pr = p.proposals || {}; const cs = (p.standing || {}).commitments || {};
  L.push(...row('proposals', `${pr.open ?? 0} open · ${pr.approved ?? 0} approved · ${pr.unimplementedProfiles ?? 0} profile${pr.unimplementedProfiles === 1 ? '' : 's'} proposed but not seeded`, { indent: 4 }));
  for (const u of pr.unmeasuredBecause || []) L.push(...row('unmeasured', u, { indent: 4 }));
  const retiring = Object.entries(cs).filter(([, c]) => c.status === 'RETIREMENT_PROPOSED');
  for (const [id, c] of retiring) L.push(...row('retirement', `${id} — proposed via ${c.via || '?'}, awaiting ${c.awaiting || 'its owner'}; the machine does not retire`, { indent: 4 }));
  if (!retiring.length && !(pr.unmeasuredBecause || []).length && !pr.open) L.push('    nothing waiting');

  const rows = p.rows || [];
  if (rows.length) {
    L.push('', '  latest runs');
    for (const r of rows) {
      const state = r.status === 'blocked' ? 'blocked — no verdict' : r.fails?.length ? `fail ${list(r.fails, ', ')}` : 'no fail';
      L.push(...row(r.target, `${r.env || '?'} · exit ${r.exit ?? '?'} · ${state}${r.history ? ` · history ${r.history}` : ''}`, { col: 36, indent: 4 }));
    }
  }

  // `next` is [command, why]; a null command means the sentence stands alone.
  if (p.next) L.push('', '  next step', ...(p.next[0] ? [`    ${p.next[0]}`, `      ${p.next[1]}`] : [`    ${p.next[1]}`]));
  if (p.problems?.length) { L.push('', '  declarations with problems'); for (const x of p.problems) L.push(...bullet(x)); }
  return join(L);
}

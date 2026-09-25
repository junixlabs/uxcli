// A proposal card: what the machine suggests, on what evidence, and who alone can act on it.
import { join, row, list } from './text.js';

const who = x => (x ? `${x.type || ''} ${x.ref || ''}`.trim() + (x.onBehalfOf ? ` on behalf of ${x.onBehalfOf}` : '') : '—');
const ev = e => e.run ? `${e.run}${e.hash ? ` (${e.hash.slice(0, 19)}…)` : ''}${e.what ? ` — ${e.what}` : ''}`
  : e.check ? `${e.check}: observed ${e.observed} vs threshold ${e.threshold}${e.at ? ` at ${e.at}` : ''}` : JSON.stringify(e);
const flat = (o, p = '') => Object.entries(o || {}).flatMap(([k, v]) => v && typeof v === 'object' && !Array.isArray(v) ? flat(v, `${p}${k}.`) : [`${p}${k}=${JSON.stringify(v)}`]);

// The closing line is the boundary the object model draws for each kind: no proposal has authority.
const closing = p => ({
  commitment: 'becomes a commitment only with owner, approvedBy and source; until then anything measured against it is not-committed',
  retirement: `the machine does not retire; only ${who(p.requires) || 'the authority that created it'} decides, and until then the commitment stays as it is`,
  profile: 'the machine wrote the spec; the project writes the seed — until it is seeded and verified, the workflow that needs it stays unmeasurable',
  instrumentation: 'a change in the product, not in uxcli; until the project emits it, the state keeps its current strength',
  scenario: 'a scenario the project has not defined; the provisioner only materialises what the project declares',
}[p.kind] || 'a proposal carries no authority; a human approves or it expires');

export function proposalCard(p = {}) {
  const L = [`proposal ${p.id || '?'} · ${p.kind || 'kind ?'} · ${p.status || 'status ?'}${p.expiresAt ? ` · expires ${p.expiresAt}` : ''}`, ''];
  L.push(...row('', p.statement || '(no statement)', { col: 0, indent: 2 }), '');
  L.push(...row('proposed by', who(p.proposedBy)));
  if (p.target) L.push(...row('target', p.target));
  L.push(...row('trace', (p.trace || []).length ? list(p.trace) : 'none — a proposal without trace is not valid; treat it as noise'));
  for (const e of p.evidence || []) L.push(...row('evidence', ev(e)));
  if (!(p.evidence || []).length) L.push(...row('evidence', 'none recorded'));
  if (p.suggested) L.push(...row('suggested', flat(p.suggested).join(' · ')));
  if (p.requires) L.push(...row('requires', who(p.requires)));
  if (p.approvedAs) L.push(...row('approved as', p.approvedAs));
  if (p.note) L.push(...row('note', p.note));
  L.push('', ...row('', closing(p), { col: 0, indent: 2 }));
  return join(L);
}

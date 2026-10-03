// Which declared journeys a screen belongs to: a URL path matched against every url signal of every
// state ("/leads/{leadId}" matches /leads/ld_0001). Pure: journeys and a path in, ids out.
const toRe = p => new RegExp('^' + String(p).replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\\\{[^}]+\\\}|\{[^}]+\}/g, '[^/]+') + '/?$');
export function journeysOf(journeys = [], pathname = '') {
  const out = [];
  for (const j of journeys) for (const [state, s] of Object.entries(j?.states || {})) for (const sig of s?.signals || [])
    if (sig?.observer === 'url' && sig.path && toRe(sig.path).test(pathname)) { if (!out.some(x => x.journey === j.id)) out.push({ journey: j.id, state }); }
  return out;
}

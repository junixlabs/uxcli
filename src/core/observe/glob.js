// `*` matches anything, everything else is literal. Used for url patterns (`/workspace/*`), tenant
// ids (`t_uxcli_*`) and host classes (`*.twilio.com`) — one meaning, one place.
export const glob = (pattern, s) => typeof s === 'string'
  && new RegExp('^' + String(pattern).split('*').map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$').test(s);

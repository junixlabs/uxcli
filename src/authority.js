// Disk half of `core/authority.js`: reads the registry and says what a subject may do.
//
// in: a project root, optionally one subject   out: a card
//
// A project with no registry is reported as exactly that. It is the state of every project that has
// not asked for locks, and reading it as "nobody may do anything" would make the feature arrive as a
// regression for everyone who never wanted it.
import { capabilityOf } from './core/authority.js';
import { readAuthorities, found } from './adapters/store/project-files.js';

// A granted line leads with the kinds it covers, never a bare `yes`: the card's job is to let a
// reader tell "may sign contrast" from "may not sign anything", and those two once printed the same.
const grantLine = g =>
  `${g.kind === '*' ? 'any kind' : g.kind}${g.expires ? `, until ${g.expires}` : ''}${g.owner ? ` · under ${g.owner}` : ' · no owner named'}`;

export function authorityCard(root, subject) {
  const list = readAuthorities(root);
  const file = found(root, 'authorities');
  const L = [`uxcli authority · ${file || 'no registry'}`, ''];
  if (!list.length) return L.concat([
    '  no uxcli.authorities.json here, so no scope is recorded and signing falls back to `owner` alone.',
    '  A registry is what turns "an agent may sign" into "an agent may sign this, until then".',
  ]).join('\n');

  const subjects = subject ? [subject] : [...new Set(list.map(a => a.subject))];
  for (const s of subjects) {
    L.push(`  ${s}`);
    for (const a of capabilityOf({ authorities: list, subject: s }).actions) {
      L.push(`    ${a.action.padEnd(10)} ${a.ok ? a.grants.map(grantLine).join('; ') : `no — ${a.why}`}`);
    }
    L.push('');
  }
  return L.join('\n');
}

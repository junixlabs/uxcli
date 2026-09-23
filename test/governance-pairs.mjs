// Governance maturity, held by the same kind of pair as every rule here.
//
// The must-fail half is the reason the module exists. Two defects can hide in a governance reading
// and they are opposites, so one fixture cannot catch both. The first is the state of the tool
// before this file: a project with nothing declared reads as a project where everybody may act, and
// it is displayed exactly like one that opted in. The second is the over-correction that would make
// an empty registry a defect, and three of the three projects on this machine broken on their first
// day. Both halves are asserted, in both directions.
//
// The third half is an anti-regression check with no fixture of its own: `unmanaged` is an
// observable state of a project and never an eighth verdict. The seven are ranked by attention and
// `covers()` fails the build for a name that is not one of them, so the day somebody decides a
// governance state is "really just `not-committed`", this is what says otherwise.
import { governance, governanceCard, DECLARATIONS } from '../src/core/governance.js';
import { BY_ATTENTION } from '../src/core/verdict/rank.js';

export const OPERATOR =
  'an empty project, which must not read as clean and must not read as an error; a declared, scoped '
  + 'and signed project, which must reach enforced; each partial project, which must stop at adopted '
  + 'and name the piece it lacks; a full registry nobody signed under, which must not reach enforced; '
  + 'and every one of the seven verdicts, none of which may ever appear as a state';

const CONTEXT = { domain: { value: 'a checkout', source: 'specs/product.md' } };
const AUTHORITIES = [{ subject: 'maintainers', scope: {}, owner: 'the maintainers' }];
const SIGNED = [{ id: 'verdict.fail.light', kind: 'contrast', owner: 'the maintainers' }];
const UNSIGNED = [{ id: 'verdict.fail.light', kind: 'contrast' }];

const FULL = { context: CONTEXT, authorities: AUTHORITIES, entries: SIGNED };

// Said of a state no surface may print a reassurance over, and of a state no surface may print an
// alarm over. Separate lists: the module is wrong in a different way for each.
const REASSURING = /\b(clean|ok|okay|no problems|nothing to (?:fix|do)|all good|passing|healthy)\b/i;
const ALARMING = /\b(error|errors|fail|fails|failed|failure|invalid|broken|wrong|violation)\b/i;

export function pair() {
  const problems = []; let checks = 0;
  const check = (what, got, want) => { checks++; if (got !== want) problems.push(`${what}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`); };

  // must-fail, first direction: nothing declared is its own state. Before this module the same
  // project was indistinguishable from one that had opted into governance and satisfied it.
  const empty = governance({ context: null, authorities: [], entries: [] });
  check('a project with nothing declared', empty.state, 'unmanaged');
  check('and it names all three as missing', empty.missing.join(','), Object.keys(DECLARATIONS).join(','));

  // A project with nothing declared is not a project with no problems. If `next` can be empty here,
  // a caller has nothing left to distinguish "measured and clean" from "never measured".
  checks++; if (!empty.next.length)
    problems.push('an unmanaged project offers no next step, so nothing separates it from a project with nothing left to do');
  checks++; {
    const said = [empty.state, ...empty.next, governanceCard(empty, '.')].join(' ');
    if (REASSURING.test(said)) problems.push(`an unmanaged project is described as clean: ${said.match(REASSURING)[0]}`);
    // must-fail, second direction: the over-correction. A first day is not a failure, and calling it
    // one is how three of the three projects on this machine become broken projects.
    if (ALARMING.test(said)) problems.push(`an unmanaged project is described as an error: ${said.match(ALARMING)[0]}`);
  }
  checks++; if (!/not configured|nothing has been declared/i.test(governanceCard(empty, '.')))
    problems.push('the card for an unmanaged project does not say it is unconfigured');

  // An empty file is not a declaration; `{}` on disk is not a decision anybody made.
  check('an empty context document', governance({ context: {}, authorities: [], entries: [] }).state, 'unmanaged');
  check('a context document of unknown fields only', governance({ context: { notes: 'x' }, authorities: [], entries: [] }).state, 'unmanaged');

  // must-pass: the closed loop.
  const full = governance(FULL);
  check('declared, scoped and signed', full.state, 'enforced');
  check('and nothing is missing', full.missing.length, 0);
  check('and no step remains', full.next.length, 0);
  check('and the signature is seen', full.has.signed, true);

  // The signature may be inherited from the commitments document header, which is where the 42
  // entries in this repo carry it. A reading that only looks at entries reports this project
  // unsigned forever.
  check('an owner on the document rather than the entry',
    governance({ ...FULL, entries: UNSIGNED, doc: { owner: 'uxcli maintainers' } }).state, 'enforced');
  check('and a signedBy on the document', governance({ ...FULL, entries: UNSIGNED, doc: { signedBy: 'an agent under the maintainers' } }).state, 'enforced');

  // must-fail: a registry nobody has ever signed under is a list of names. Everything is present and
  // it still may not reach `enforced`.
  const unsigned = governance({ ...FULL, entries: UNSIGNED });
  check('all three declared, nothing signed', unsigned.state, 'adopted');
  check('and the declarations are not what is missing', unsigned.missing.length, 0);
  checks++; if (!unsigned.next.some(s => /sign/i.test(s)))
    problems.push(`an unsigned project is told nothing about signing: ${JSON.stringify(unsigned.next)}`);

  // Each partial project stops at `adopted` and says which piece it lacks — one at a time, so a
  // reading that keys on "any two present" cannot pass by accident.
  const FACT_OF = { context: 'context', authorities: 'authorities', commitments: 'entries' };
  for (const absent of Object.keys(DECLARATIONS)) {
    const facts = { context: CONTEXT, authorities: AUTHORITIES, entries: SIGNED };
    facts[FACT_OF[absent]] = absent === 'context' ? null : [];
    const g = governance(facts);
    check(`missing only \`${absent}\``, g.state, 'adopted');
    check(`and \`${absent}\` is the piece named`, g.missing.join(','), absent);
    checks++; if (!g.next.length) problems.push(`\`${absent}\` is missing and no step says so`);
    checks++; if (ALARMING.test(governanceCard(g, '.'))) problems.push(`an adopted project is described as an error: ${governanceCard(g, '.').match(ALARMING)[0]}`);
  }

  // The anti-regression check. A governance state is not a verdict, in either direction: none of the
  // seven may be emitted as a state, and no state may be mistaken for one.
  const STATES = ['unmanaged', 'adopted', 'enforced'];
  for (const v of BY_ATTENTION) {
    checks++;
    if (STATES.includes(v)) problems.push(`\`${v}\` is one of the seven verdicts and is being used as a governance state`);
  }
  for (const g of [empty, unsigned, full, governance({ context: CONTEXT, authorities: [], entries: [] })]) {
    checks++;
    if (BY_ATTENTION.includes(g.state)) problems.push(`a governance state came back as the verdict \`${g.state}\``);
    checks++;
    if (!STATES.includes(g.state)) problems.push(`\`${g.state}\` is not one of the three governance states`);
  }

  // Facts in, nothing else: handed no facts at all the module must still answer, because a caller
  // reading a project with no files has exactly that to hand it.
  check('no facts at all', governance().state, 'unmanaged');
  checks++; { const before = JSON.stringify(FULL); governance(FULL); if (JSON.stringify(FULL) !== before) problems.push('governance() mutated the facts it was handed'); }

  return { ok: !problems.length, checks, problems };
}

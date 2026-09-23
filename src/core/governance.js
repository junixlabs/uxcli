// How far a project has come in declaring what it is, who may speak for it, and what it owes its
// users. A second axis, never an eighth verdict — and that is the whole design.
//
// in:  { context, authorities, entries, doc }
//        context     the parsed context document, or null when the project has none
//        authorities the registry as an array — empty when the file is absent, which is the same
//                    observable and rightly so: a registry granting nobody anything binds nobody
//        entries     the commitment entries
//        doc         the commitments document header those entries inherit `owner` and `signedBy`
//                    from, resolved exactly the way `admit()` resolves it — the 42 entries in this
//                    repo carry neither field and would otherwise read as unsigned
// out: { state, has, missing, next }
//
// Why not a verdict. The seven are closed, ranked by attention in verdict/rank.js, and `covers()`
// fails the build for a name that is not one of them. An eighth would have to sort somewhere on that
// ladder: above `fail` claims a project's first day needs a person's eye before a measured defect,
// below `pass` claims an unmanaged project is nearly clean. Both are false, because it is not the
// same question. A verdict is about one claim that was measured; this is about whether there are
// claims at all.
//
// Why `unmanaged` is not a defect. Measured across this machine: three projects, none declaring
// context or authorities, one holding 42 commitment entries and two holding nothing. Read as a
// defect that is three broken projects and no move available to any of them — a repo without CI is
// not a repo in trouble. Read the way it reads today, as "everybody may act", a project that never
// opted in is displayed identically to one that did, and that difference is the only thing this
// module exists to show.
//
// Why `unmanaged` is also never presentable as a clean result. Nothing was declared, so nothing was
// measured against anything, and a surface printing "no problems found" over that reports the
// absence of checks as the absence of problems. `state` is the one thing a caller must branch on
// before it says anything reassuring, and no string emitted here lets it skip that step.
//
// The file names are the adapter's, not this module's: the steps in `next` name the declaration
// owed, and the caller — which already knows what each declaration is called on disk — names the file.
import { FIELDS } from './context.js';
import { signatureOf } from './authority.js';

export const DECLARATIONS = {
  context: 'what this product is, in fields a claim can cite',
  authorities: 'who may propose, sign and supersede, and within what scope',
  commitments: 'the claims themselves, as thresholds a run can decide',
};

// A file that exists and says nothing is not a declaration. Without this, `{}` written to disk moves
// a project a whole rung on a decision nobody made.
const declaredContext = doc => !!doc && typeof doc === 'object' && !Array.isArray(doc)
  && Object.keys(FIELDS).some(k => doc[k] !== undefined && doc[k] !== null);

// One entry standing in somebody's name is enough, and nothing less will do: a registry nobody has
// ever signed under is a list of names, not a governed project.
const anySigned = (entries, doc) => entries.some(e => signatureOf({
  signedBy: e?.signedBy ?? doc.signedBy ?? null,
  owner: e?.owner ?? doc.owner ?? null,
}));

// Ordered by what unblocks what: context is what a claim cites, authorities is who may make one, and
// a signature is the act neither of the first two performs.
const STEPS = {
  context: 'Declare the context — what this product is, who uses it, what is not negotiable — so a commitment has something to cite.',
  authorities: 'Declare the authorities — who may propose, sign and supersede, and within what scope — so a signature names somebody answerable.',
  commitments: 'Write the first commitment: one threshold a run can decide, naming the source it came from.',
  signature: 'Sign one commitment: put an owner or a signature on an entry, so the registry binds somebody rather than only listing them.',
};

export function governance({ context = null, authorities = [], entries = [], doc = {} } = {}) {
  const list = Array.isArray(authorities) ? authorities : [];
  const claims = Array.isArray(entries) ? entries : [];
  const header = doc && typeof doc === 'object' ? doc : {};

  const has = {
    context: declaredContext(context),
    authorities: list.length > 0,
    commitments: claims.length > 0,
    signed: claims.length > 0 && anySigned(claims, header),
  };

  const missing = Object.keys(DECLARATIONS).filter(k => !has[k]);
  const all = missing.length === 0;

  // Three boundaries, and each is the narrowest reading that stays honest. Nothing declared is the
  // absence of a decision, so it gets its own name rather than the nearest verdict. Everything
  // declared and signed is the loop closed — there is no further declaration to ask for. Everything
  // between is one word, `adopted`, because a project that has written two of three is not 67% of
  // anything: `missing` says which, and a number would hide that.
  const state = missing.length === Object.keys(DECLARATIONS).length ? 'unmanaged'
    : all && has.signed ? 'enforced'
      : 'adopted';

  // The signature step is asked for only once there is something to sign; offered before that it
  // names an act the project cannot perform.
  const next = state === 'enforced' ? []
    : [...missing.map(k => STEPS[k]), ...(has.commitments && !has.signed ? [STEPS.signature] : [])];

  return { state, has, missing, next };
}

export function governanceCard(g, where) {
  const L = [`uxcli governance · ${where}`, '', `  ${g.state}`, ''];
  for (const key of Object.keys(DECLARATIONS)) {
    const state = g.has[key] ? 'declared' : 'missing';
    L.push(`  ${state.padEnd(10)} ${key.padEnd(13)} ${DECLARATIONS[key]}`);
  }
  if (g.has.commitments) L.push(`  ${(g.has.signed ? 'signed' : 'unsigned').padEnd(10)} ${'signature'.padEnd(13)} who stands behind the claims, by name`);

  if (g.state === 'unmanaged') L.push('', '  Nothing has been declared here. That is a starting point rather than a defect — and it is also not a result: no claim exists on this project for a run to be measured against.');
  if (g.state === 'adopted') L.push('', `  Started and not closed. ${g.next.length} step${g.next.length === 1 ? '' : 's'} remain${g.next.length === 1 ? 's' : ''} before what this project promises is both scoped and signed.`);
  if (g.state === 'enforced') L.push('', '  Declared, scoped and signed: every claim measured here is one somebody put a name to.');

  if (g.next.length) L.push('', ...g.next.map((s, i) => `  ${i + 1}. ${s}`));
  return L.join('\n');
}

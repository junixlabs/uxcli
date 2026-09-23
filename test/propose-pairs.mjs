// What `uxcli propose` is allowed to do, and what a proposal is allowed to lean on — held by the
// same kind of pair as every probe.
//
// Two claims are asserted here because both are the kind that rot silently. The first is that an
// agent acts inside a recorded scope and is refused outside it: before this, `propose` called `may()`
// zero times, and an unchecked command is indistinguishable from a checked one until something can
// be shown to be refused. The second is that the check did not seize shut — the registry file is the
// opt-in, so a project that never wrote one must keep working exactly as it did, and a refusal must
// arrive as a refusal rather than as an empty list that reads like full coverage.
//
// The context half is asserted the same way: a sourced field is citable and an unsourced one is not,
// because the whole point of citing context is that the claim cannot inherit standing from a
// sentence nobody will put a name to.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { propose, proposeAuthority, proposeCard } from '../src/propose.js';

export const OPERATOR =
  'an agent proposing outside its recorded scope, one nobody registered, one whose authority has '
  + 'expired and a command run as nobody, against the same agent inside its scope and a project that '
  + 'never wrote a registry at all; a refusal that arrives as a refusal rather than as nothing to '
  + 'propose; and a context whose sourced field a proposal may cite and whose unsourced field it may not';

const REGISTRY = [
  { subject: 'agent-a', owner: 'Ashley', scope: { action: ['propose', 'sign'], journey: 'browse → buy' }, expires: '2099-01-01' },
  { subject: 'agent-sign-only', owner: 'Ashley', scope: { action: 'sign' }, expires: '2099-01-01' },
  { subject: 'agent-old', owner: 'Ashley', scope: {}, expires: '2020-01-01' },
];
const JOURNEY = 'browse → buy';
const RUN = {
  journey: JOURNEY,
  url: 'http://shop.test/',
  ranAt: '2026-09-23T10:00:00Z',
  steps: [
    { i: 0, url: 'http://shop.test/', arrivedBy: 'goto', title: 'Home' },
    { i: 1, url: 'http://shop.test/cart', arrivedBy: 'click', title: 'Cart' },
    { i: 2, url: 'http://shop.test/checkout', arrivedBy: 'submit', title: 'Checkout' },
  ],
};
const CONTEXT = {
  // One field somebody will name a source for, and one nobody will. Only the first may be cited.
  domain: { value: 'a hardware shop', source: 'product-brief.md' },
  audiences: { value: 'trade buyers' },
};

// A project on disk, because `propose` is the command and the store reads files; torn down whichever
// way the run ends, so a failing assertion cannot leave a project lying around.
function inProject({ authorities, context }, fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-propose-'));
  try {
    const at = path.join(root, 'run-x');
    fs.mkdirSync(at);
    fs.writeFileSync(path.join(at, 'run.json'), JSON.stringify(RUN));
    if (authorities) fs.writeFileSync(path.join(root, 'uxcli.authorities.json'), JSON.stringify({ authorities }));
    if (context) fs.writeFileSync(path.join(root, 'uxcli.context.json'), JSON.stringify(context));
    return fn({ root, at });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

export function pair() {
  const problems = []; let checks = 0;
  const check = (what, got, want) => { checks++; if (got !== want) problems.push(`${what}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`); };
  const deny = (what, r, names) => { checks++;
    if (r.ok) problems.push(`${what}: allowed when it should have been refused`);
    else if (!names.test(r.why || '')) problems.push(`${what}: refused with ${JSON.stringify(r.why)}, which does not say why — "not authorized" alone gets worked around, not fixed`); };
  const allow = (what, r) => { checks++; if (!r.ok) problems.push(`${what}: refused — ${r.why}`); };

  // ── must-fail: the command has a lock ───────────────────────────────────
  deny('an agent proposing in a journey outside its scope',
    proposeAuthority({ registry: REGISTRY, hasRegistry: true, subject: 'agent-a', journey: 'admin login' }), /journey/);
  deny('an agent that may only sign, proposing',
    proposeAuthority({ registry: REGISTRY, hasRegistry: true, subject: 'agent-sign-only', journey: JOURNEY }), /may not propose/);
  deny('a subject nobody registered',
    proposeAuthority({ registry: REGISTRY, hasRegistry: true, subject: 'agent-ghost', journey: JOURNEY }), /not in the authority registry/);
  deny('an authority past its expiry',
    proposeAuthority({ registry: REGISTRY, hasRegistry: true, subject: 'agent-old', journey: JOURNEY }), /expired/);
  deny('a command run as nobody, on a project that keeps a registry',
    proposeAuthority({ registry: REGISTRY, hasRegistry: true, subject: null, journey: JOURNEY }), /subject/);
  // An empty registry somebody wrote is a decision, not an oversight: the file's existence is the
  // opt-in, so it refuses everyone. This is pinned because it is the half that looks like a bug.
  deny('a registry file written empty',
    proposeAuthority({ registry: [], hasRegistry: true, subject: 'agent-a', journey: JOURNEY }), /not in the authority registry/);

  // ── must-pass: the lock is not seized shut ──────────────────────────────
  allow('an agent proposing inside its recorded scope',
    proposeAuthority({ registry: REGISTRY, hasRegistry: true, subject: 'agent-a', journey: JOURNEY }));
  {
    // The decision this pair exists to pin: no registry file means the project never asked for a
    // lock, so proposing runs unchecked and needs no subject. Refusing everyone on a door nobody
    // fitted a lock to would break the three commands that shipped before the registry existed.
    const r = proposeAuthority({ hasRegistry: false, subject: null, journey: JOURNEY });
    check('a project that never wrote a registry', r.ok, true);
    check('and it says so, rather than pretending it checked', r.unchecked, true);
  }

  // ── the refusal reaches the caller as a refusal ─────────────────────────
  inProject({ authorities: REGISTRY }, ({ root, at }) => {
    const out = propose({ root, at, as: 'agent-ghost' });
    check('a refused run proposes nothing', out.proposals.length, 0);
    checks++;
    if (!out.refused) problems.push('a refused run came back with an empty proposals list and no refusal — indistinguishable from a run whose every place is already committed');
    else if (!/not in the authority registry/.test(out.refused.why)) problems.push(`the refusal reads ${JSON.stringify(out.refused.why)} and does not name why`);
    checks++;
    if (!/refused/.test(proposeCard(out))) problems.push('the card printed for a refused run does not say it was refused');
  });

  inProject({ authorities: REGISTRY }, ({ root, at }) => {
    const out = propose({ root, at, as: 'agent-a' });
    check('an agent inside its scope gets one proposal per uncovered place', out.proposals.length, 3);
    check('and nothing was refused', out.refused, undefined);
    check('the places are the ones the run reached', out.proposals.map(p => p.step).join(' '), '/ /cart /checkout');
  });

  // ── a project with no registry at all still works ───────────────────────
  inProject({}, ({ root, at }) => {
    const out = propose({ root, at });
    check('a project with no registry, run as nobody', out.proposals.length, 3);
    check('was not refused', out.refused, undefined);
    check('and the answer says the authority was never checked', out.authority?.unchecked, true);
  });

  // ── context: what a claim may cite, and what it may not ─────────────────
  inProject({}, ({ root, at }) => {
    const out = propose({ root, at });
    check('no context file is an ordinary state, so proposals are still produced', out.proposals.length, 3);
    check('with nothing to cite', out.citable.length, 0);
  });

  inProject({ context: CONTEXT }, ({ root, at }) => {
    const out = propose({ root, at });
    check('a sourced field is citable', out.citable.map(c => `${c.field} ${c.source}`).join(' '), 'domain product-brief.md');
    check('an unsourced field is not', out.citable.some(c => c.field === 'audiences'), false);
    check('and each proposal carries what it may lean on', out.proposals[0]?.mayCite?.length, 1);
    // The command ships no UX knowledge. Attaching what a claim may cite must not become the claim.
    check('the claim is still nobody’s but the author’s to write', out.proposals.every(p => p.claim === null), true);
  });

  return { ok: !problems.length, checks, problems };
}

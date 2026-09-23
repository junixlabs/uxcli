// Who may sign, and what is even eligible to be measured — held by the same kind of pair as every
// probe.
//
// These two rules were written on the same day the rule they replace was removed. "Only a human
// signs" was one line and it did the work of a lock; taking it out unlocked the door, and a lock
// that has been removed is indistinguishable from a lock that was never fitted unless something can
// be shown to be refused. That is what the must-fail halves below are for.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { may, capabilityOf } from '../src/core/authority.js';
import { admit } from '../src/core/commitment/admit.js';
import { authorityCard } from '../src/authority.js';

export const OPERATOR =
  'an agent signing inside its recorded scope and the same agent signing outside it; an authority '
  + 'past its expiry; a commitment nothing could falsify, against one that names what would make it '
  + 'false; an entry past its own expiry, and one that has been superseded; a commitment about a '
  + 'flow that names no run it was derived from, and the same one carrying an empty anchor, against '
  + 'one that names the run it came from, a registered kind that could never name a run, and a '
  + 'superseded flow entry which is history before it is untraceable; and a subject granted one '
  + 'action over every kind and another over a single kind, whose account of itself must name that '
  + 'single kind as signable, must not name a kind nobody granted, and must not report the partial '
  + 'grant as a blanket refusal on the card a person reads';

const AUTH = [
  { subject: 'agent-a', owner: 'Ashley', scope: { action: ['propose', 'sign'], kind: 'contrast' }, expires: '2099-01-01' },
  { subject: 'agent-b', owner: 'Ashley', scope: { action: 'propose' }, expires: '2099-01-01' },
  { subject: 'agent-old', owner: 'Ashley', scope: {}, expires: '2020-01-01' },
];
// The shape that produced the defect: one action over every kind, another over exactly one. Reading
// this subject with a single `may({kind: '*'})` answers "may you sign EVERY kind" and prints the no
// as though it were "may not sign at all", which erases a grant that was made.
const PARTIAL = [
  { subject: 'agent-partial', owner: 'Chuong', scope: { action: ['propose'], kind: '*' }, expires: '2099-12-31' },
  { subject: 'agent-partial', owner: 'Chuong', scope: { action: ['sign'], kind: ['contrast'] }, expires: '2099-12-31' },
];
const of = (cap, action) => cap.actions.find(a => a.action === action);
const kindsOf = (cap, action) => of(cap, action).grants.map(g => g.kind);

const DOC = { owner: 'Ashley', source: 'research.md' };
const OK = { id: 'x', kind: 'contrast', fg: '--a', bg: '--b', min: 4.5 };
// An unregistered kind: falsifiable on its face, and about a flow, so it owes an observation.
const FLOW = { id: 'checkout.recovery', kind: 'flow-observation',
  failureSurface: { when: ['payment_declined'], mustObserve: ['retry action visible'] } };
const RAN = { run: '.uxcli/x-abc123', target: 'abc123', ranAt: '2026-09-23T00:00:00Z' };

export function pair() {
  const problems = []; let checks = 0;
  const deny = (what, r) => { checks++; if (r.ok) problems.push(`${what}: allowed when it should have been refused`); };
  const allow = (what, r) => { checks++; if (!r.ok) problems.push(`${what}: refused — ${r.why}`); };
  const refuse = (what, r, verdict) => { checks++;
    if (r.admitted) problems.push(`${what}: admitted when it should not have been`);
    else if (r.verdict !== verdict) problems.push(`${what}: verdict was ${JSON.stringify(r.verdict)}, wanted ${JSON.stringify(verdict)}`); };

  // ── must-fail: the door has a lock ──────────────────────────────────────
  deny('an agent signing a kind outside its scope',
    may({ authorities: AUTH, subject: 'agent-a', action: 'sign', kind: 'flow-recovery' }));
  deny('an agent that may only propose, signing',
    may({ authorities: AUTH, subject: 'agent-b', action: 'sign', kind: 'contrast' }));
  deny('an authority past its expiry',
    may({ authorities: AUTH, subject: 'agent-old', action: 'sign', kind: 'contrast' }));
  deny('a subject nobody registered',
    may({ authorities: AUTH, subject: 'agent-ghost', action: 'sign', kind: 'contrast' }));
  deny('an empty registry granting anything',
    may({ authorities: [], subject: 'agent-a', action: 'sign', kind: 'contrast' }));

  // ── must-pass: the lock is not seized shut ─────────────────────────────
  allow('an agent signing inside its scope',
    may({ authorities: AUTH, subject: 'agent-a', action: 'sign', kind: 'contrast' }));
  allow('and proposing, which its scope also names',
    may({ authorities: AUTH, subject: 'agent-a', action: 'propose', kind: 'contrast' }));

  // ── what a subject may actually do, action by action ───────────────────
  // The account has to be answerable in both directions. Overstating it hands an agent a permission
  // nobody wrote; understating it — the defect this replaced — hides one that was written, and a
  // hidden grant is as unreviewable as an unrecorded one.
  const partial = capabilityOf({ authorities: PARTIAL, subject: 'agent-partial' });
  checks++;
  {
    const k = kindsOf(partial, 'sign');
    if (!of(partial, 'sign').ok || !k.includes('contrast'))
      problems.push(`the registry grants \`sign\` over \`contrast\` and the account reports ${JSON.stringify(of(partial, 'sign'))}`);
  }
  checks++;
  if (kindsOf(partial, 'sign').some(k => k !== 'contrast'))
    problems.push(`\`sign\` reported kinds ${JSON.stringify(kindsOf(partial, 'sign'))}; only \`contrast\` was granted, and a kind nobody granted must not appear`);
  checks++;
  if (of(partial, 'supersede').ok)
    problems.push('`supersede` was reported as available; nothing in the registry grants it');
  checks++;
  if (!of(partial, 'supersede').ok && !of(partial, 'supersede').why)
    problems.push('`supersede` was refused without naming why; a refusal that names no rung gets worked around, not fixed');
  checks++;
  if (kindsOf(partial, 'propose').join() !== '*')
    problems.push(`\`propose\` was granted over every kind and reports ${JSON.stringify(kindsOf(partial, 'propose'))}`);
  checks++;
  {
    // The defect, stated as the check that would have caught it: asking `may()` for the literal `*`
    // is asking about EVERY kind, and its `no` must never stand in for "may not sign at all".
    const everyKind = may({ authorities: PARTIAL, subject: 'agent-partial', action: 'sign', kind: '*' });
    if (everyKind.ok) problems.push('`may({kind: "*"})` allowed signing every kind; only `contrast` was granted, so this fixture no longer holds the defect it was written for');
    else if (!of(partial, 'sign').ok) problems.push('a partial grant collapsed into a blanket refusal: the account agreed with the "every kind" question instead of answering "which kinds"');
  }
  checks++;
  {
    const ghost = capabilityOf({ authorities: PARTIAL, subject: 'agent-ghost' });
    if (ghost.actions.some(a => a.ok)) problems.push('a subject nobody registered was granted something');
    else if (!ghost.actions.every(a => /not in the authority registry/.test(a.why || '')))
      problems.push(`an unregistered subject was refused without saying it is unregistered: ${JSON.stringify(ghost.actions.map(a => a.why))}`);
  }
  checks++;
  {
    // The card is where a person reads this, and the card is where it was wrong, so the regression is
    // held at the text: a `sign` line that refuses, or that never names `contrast`, is the old bug.
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-authority-'));
    try {
      fs.writeFileSync(path.join(root, 'uxcli.authorities.json'), JSON.stringify({ authorities: PARTIAL }));
      const sign = authorityCard(root, 'agent-partial').split('\n').find(l => l.trim().startsWith('sign')) || '';
      if (/\bno —/.test(sign)) problems.push(`the card refuses signing outright: ${JSON.stringify(sign.trim())}`);
      else if (!/contrast/.test(sign)) problems.push(`the card's sign line does not say which kinds it covers: ${JSON.stringify(sign.trim())}`);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }

  // ── admission: a sentence that cannot be false is not a commitment ──────
  const wish = { id: 'checkout.trust', kind: 'feeling', claim: 'Checkout should feel trustworthy' };
  checks++;
  {
    const r = admit(wish, { doc: DOC, authorities: AUTH });
    if (r.admitted) problems.push('a claim with no failure surface was admitted');
    else if (r.verdict !== null) problems.push(`an unfalsifiable claim produced verdict ${JSON.stringify(r.verdict)}; it must produce none, because it never reached measurement`);
  }
  checks++;
  {
    const r = admit({ ...FLOW, derivedFrom: RAN }, { doc: DOC, authorities: AUTH });
    if (!r.admitted) problems.push(`a claim that names what would make it false, and the run it came from, was refused: ${r.reason}`);
  }

  // ── admission: a claim about a flow nobody watched is a wish about a product ──
  refuse('a flow claim naming no run it was derived from', admit(FLOW, { doc: DOC, authorities: AUTH }), null);
  refuse('a flow claim whose derivedFrom is empty', admit({ ...FLOW, derivedFrom: {} }, { doc: DOC, authorities: AUTH }), null);
  refuse('a flow claim whose run is the empty string', admit({ ...FLOW, derivedFrom: { run: '' } }, { doc: DOC, authorities: AUTH }), null);
  checks++;
  {
    // `contrast` is decided by a stylesheet and has no run to point at; the 42 entries in this repo
    // are this shape, so a traceability rule that reached them would be a rule against the repo.
    const r = admit(OK, { doc: DOC, authorities: AUTH });
    if (!r.admitted) problems.push(`a commitment decided by a stylesheet was asked for a run it could never have: ${r.reason}`);
  }
  // Being registered is not the exemption. `flow-reachability` is decided by a run, so it owes the
  // run it came from exactly as an unregistered flow claim does — otherwise the rule reaches only
  // kinds that were already `unmeasurable`, and stops meaning anything.
  refuse('a registered kind decided by a run, naming none',
    admit({ id: 'f', kind: 'flow-reachability', failureSurface: { when: ['/pay'], mustObserve: ['/done'] } },
      { doc: DOC, authorities: AUTH }), null);
  checks++;
  {
    const r = admit({ id: 'f', kind: 'flow-reachability', derivedFrom: RAN,
      failureSurface: { when: ['/pay'], mustObserve: ['/done'] } }, { doc: DOC, authorities: AUTH });
    if (!r.admitted) problems.push(`a run-decided commitment naming its run was refused: ${r.reason}`);
  }
  checks++;
  {
    // Both refusals carry verdict null, so only the reason can show which rung decided it.
    const r = admit({ ...FLOW, supersededBy: 'x-2' }, { doc: DOC, authorities: AUTH });
    if (r.admitted) problems.push('a superseded flow entry was admitted');
    else if (!/superseded/.test(r.reason)) problems.push(`a superseded flow entry reported ${JSON.stringify(r.reason)}; a replaced rule is history before anyone asks what it was derived from`);
  }

  refuse('an entry past its own expiry', admit({ ...OK, expires: '2020-01-01' }, { doc: DOC, authorities: AUTH }), 'not-committed');
  refuse('an entry signed outside authority', admit({ ...OK, signedBy: 'agent-b' }, { doc: DOC, authorities: AUTH }), 'not-committed');
  refuse('an entry with no owner', admit(OK, { doc: { source: 'research.md' }, authorities: AUTH }), 'not-committed');
  refuse('a superseded entry, which is history and not a verdict', admit({ ...OK, supersededBy: 'x-2' }, { doc: DOC, authorities: AUTH }), null);

  checks++;
  {
    const r = admit({ ...OK, signedBy: 'agent-a' }, { doc: DOC, authorities: AUTH });
    if (!r.admitted) problems.push(`an entry signed inside authority was refused: ${r.reason}`);
    else if (r.signature !== 'agent-a under Ashley') problems.push(`the signature reads ${JSON.stringify(r.signature)}; both names have to show, because an agent's signature is worth what the person behind it is worth`);
  }
  checks++;
  {
    // The 42 entries already in this repo carry an owner and no `signedBy`. They have to keep working.
    const r = admit(OK, { doc: DOC, authorities: [] });
    if (!r.admitted) problems.push(`the shape that predates the registry stopped working: ${r.reason}`);
  }

  return { ok: !problems.length, checks, problems };
}

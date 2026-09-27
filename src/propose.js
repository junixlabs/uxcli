// Turn what a run actually visited into proposals nobody has answered yet.
//
// It ships no UX knowledge. A claim generated from a built-in table has no source and cannot be
// traced to the product in front of it — astrology with a CLI. The machine supplies the grounding
// and the shape; the claim stays empty because a claim is an interpretation.
//
// in: a run directory       out: one skeleton per uncovered place, each carrying derivedFrom
import fs from 'node:fs'; import path from 'node:path';
import { runHash } from './adapters/store/run-hash.js';
import { observedFlow, coverage } from './core/reality.js';
import { targetId } from './core/target.js';
import { may } from './core/authority.js';
import { UXCLI } from './adapters/store/runs.js';
import { readEntries, readProposedCommitments, writeProposedCommitments, pathTo, found, readAuthorities } from './adapters/store/project-files.js';

const readJSON = p => JSON.parse(fs.readFileSync(p, 'utf8'));

// Never from a journey FILE: a file says what somebody meant to happen, this works from what did.
export function runAt(dir) {
  const p = fs.existsSync(path.join(dir, 'run.json')) ? path.join(dir, 'run.json') : dir;
  if (!fs.existsSync(p)) throw new Error(`no run to read at ${dir}`);
  return { run: readJSON(p), dir: path.dirname(path.resolve(p)) };
}

// Who may run this command. A project with no registry never asked for a lock, and a lock that
// refuses everyone on a door nobody fitted is as broken as no lock, so proposing there is unchecked
// and needs no subject. The opt-in is the file existing, not what is in it: somebody who wrote an
// empty registry meant to name who may act, so may() refusing everything under it is that decision
// rather than a failure of it. A missing subject is not special-cased either — may() already refuses
// it, and its reason is the one worth printing.
//
// in: what the store found, plus the subject the caller acts as   out: may()'s answer, or unchecked
export function proposeAuthority({ registry = [], hasRegistry = false, subject = null, journey = null, now } = {}) {
  if (!hasRegistry) return { ok: true, unchecked: true };
  return may({ authorities: registry, subject, action: 'propose', journey, at: now });
}

// What a claim, once somebody writes it, is entitled to lean on: an insight under
// .uxcli/understanding/insights/ that names a source and carries evidence. An insight with neither is
// left out — a proposal that could cite it would let the claim inherit standing from a sentence
// nobody will put a name to. No understanding on disk is an ordinary state, not an error.
export function citableFor(root) {
  const dir = path.join(root || '.', UXCLI, 'understanding', 'insights');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().flatMap(f => {
    try {
      const i = readJSON(path.join(dir, f)); const ref = i?.source?.ref;
      const ev = Array.isArray(i?.evidence) ? i.evidence.filter(e => typeof e === 'string' && e.trim()) : [];
      return typeof ref === 'string' && ref.trim() && ev.length ? [{ field: i.id || f.replace(/\.json$/, ''), source: ref, quote: ev[0] }] : [];
    } catch { return []; }
  });
}

const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'step';

export function proposalsFor({ run, dir, entries = [], mayCite = [] }) {
  const flow = observedFlow(run);
  if (!flow) return { flow: null, gap: null, proposals: [], citable: mayCite, why: 'this run recorded no steps, so there is no flow to read' };
  const journey = run.journey || null;
  const gap = coverage({ flow, entries, journey });
  const proposals = gap.uncovered.map(place => ({
    id: `${slug(journey || 'flow')}.${slug(place.path)}`,
    journey,
    step: place.path,
    kind: null,
    claim: null,
    failureSurface: null,
    owner: null,
    source: null,
    signedBy: null,
    derivedFrom: { run: path.relative(process.cwd(), dir) || '.', hash: runHash(dir), target: targetId(run), ranAt: run.ranAt || null },
    mayCite,
  }));
  return { flow, gap, proposals, citable: mayCite, journey };
}

// Written beside the commitments file, never into it: nothing here is enforced until somebody moves
// an entry across and signs it.
export function writeProposals(root, proposals, { journey, from }) {
  const doc = readProposedCommitments(root) || {
    $comment: 'Proposals, not commitments. uxcli sheet reads uxcli.commitments.json and nothing else, so nothing in this file is checked, enforced, or true yet. The tool proposes; somebody accountable signs. To adopt one, fill in claim and failureSurface, move the entry into uxcli.commitments.json, put a real name in owner and a real document in source, and re-run uxcli sheet. derivedFrom.hash pins the run.json these were read from: if that run is re-run or edited after you sign, uxcli sheet returns not-committed rather than a verdict over evidence nobody signed for.',
    commitments: [],
  };
  doc.proposedOn = new Date().toISOString().slice(0, 10);
  doc.proposedBy = `uxcli propose · ${journey || 'flow'} · from ${from}`;
  const have = new Set((doc.commitments || []).map(c => c.id));
  const fresh = proposals.filter(p => !have.has(p.id));
  doc.commitments = [...(doc.commitments || []), ...fresh];
  const file = writeProposedCommitments(root, doc);
  return { added: fresh.length, skipped: proposals.length - fresh.length, total: doc.commitments.length, file };
}

// The command, whole. `bin/` picks and prints; deciding happens here, so a second entry point gets
// the same answer.
export function propose({ root, at, write = false, as = null, now }) {
  // The run is read before the check because reading it produces nothing, and the journey it names is
  // what a journey-scoped authority is measured against. Nothing is generated or written until may()
  // agrees, and a refusal comes back as a refusal — an empty proposals list would read as "this run
  // is fully covered", which is the opposite of what happened.
  const { run, dir } = runAt(at);
  const file = path.relative(process.cwd(), pathTo(root, 'proposedCommitments'));
  const journey = run.journey || null;
  const authority = proposeAuthority({
    registry: readAuthorities(root), hasRegistry: !!found(root, 'authorities'),
    subject: as, journey, now,
  });
  if (!authority.ok) return { flow: null, gap: null, proposals: [], citable: [], journey, wrote: null, file, refused: { subject: as || null, why: authority.why } };

  const out = proposalsFor({ run, dir, entries: readEntries(root), mayCite: citableFor(root) });
  const wrote = write && out.proposals.length ? writeProposals(root, out.proposals, { journey: out.journey, from: path.relative(process.cwd(), dir) }) : null;
  return { ...out, wrote, file, authority: { subject: as || null, owner: authority.owner || null, unchecked: !!authority.unchecked } };
}

export function coverageOf({ root, at }) {
  const { run } = runAt(at);
  const flow = observedFlow(run);
  if (!flow) return { flow: null, coverage: null, run };
  return { flow, coverage: coverage({ flow, entries: readEntries(root), journey: run.journey || null }), run };
}

export function coverageCard({ flow, coverage: g, run }) {
  if (!flow) return 'this run recorded no steps, so there is no flow to cover';
  return [`uxcli coverage · ${run.journey || run.url || 'run'}`, '',
    `  ${g.committed} of ${g.observed} observed places carry a commitment`, '',
    ...flow.places.map(p => `  ${(g.uncovered.some(u => u.path === p.path) ? 'open' : 'covered').padEnd(8)} ${p.path.padEnd(30)} ${p.title || ''}`),
    '', g.ok ? '  nothing the browser reached is uncommitted'
      : `  ${g.uncovered.length} place${g.uncovered.length === 1 ? '' : 's'} the browser reached that nobody has committed anything about.`,
    g.ok ? '' : '  The map came from the run, not from a declaration, so narrowing what is claimed does not narrow this.'].join('\n');
}

export function proposeCard({ flow, gap, proposals, citable: cite = [], journey, why, wrote, file, refused }) {
  const L = [`uxcli propose · ${journey || 'flow'}`, ''];
  if (refused) return L.concat([`  refused · ${refused.subject || 'no subject given'}`, '', `  ${refused.why}`, '',
    '  Nothing was proposed. This project keeps an authority registry, so acting inside it is the',
    '  condition of acting at all; widen the scope in the registry, or act as somebody it names.']).join('\n');
  if (why) return L.concat([`  ${why}`]).join('\n');
  L.push(`  ${flow.steps.length} steps observed, ${gap.observed} distinct places, ${gap.committed} already committed`, '');
  for (const p of flow.places) {
    const open = gap.uncovered.some(u => u.path === p.path);
    L.push(`  ${(open ? 'open' : 'covered').padEnd(8)} ${p.path.padEnd(30)} ${p.title || ''}`);
  }
  if (!proposals.length) return L.concat(['', '  every place the browser visited already has a commitment against it']).join('\n');
  L.push('', `  ${proposals.length} proposal${proposals.length === 1 ? '' : 's'} ${wrote ? `written to ${file}` : 'would be written'}, each anchored to a place this run actually reached.`);
  L.push(`  Each carries derivedFrom and an empty claim: what is missing is the sentence, and the sentence is not the machine's to write.`);
  L.push(cite.length
    ? `  A claim written into one of these may cite ${cite.map(c => `${c.field} (${c.source})`).join(', ')}.`
    : `  No insight in this project's understanding is sourced, so a claim written here has only the run to cite.`);
  if (wrote) L.push('', `  ${wrote.added} added, ${wrote.skipped} already proposed. Nothing is enforced until an entry is filled in, moved into uxcli.commitments.json and signed.`);
  return L.join('\n');
}

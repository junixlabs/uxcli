// The packet: one probe's verdict, and everything a reader or an agent needs to argue with it.
//
// A packet used to be five fixed keys and whatever else the probe felt like returning. That is not a
// format, it is a habit, and it cost what habits cost: across 48 packets on disk, 29 different tail
// keys, 15 of which no surface ever asked for by name. The dashboard could not tell those 15 from
// evidence — nothing said which was which — so it printed all of them, and the page filled with
// numbers nobody chose to show. Meanwhile `card.js` curated the same tail by hand, per criterion,
// with a `p.sc === '3.3.4' ? … : p.sc === '3.3.7' ? …` ladder. Two surfaces, two curations of one
// object, and only one of them deliberate.
//
// So the tail is named. Four containers, each answering one question, and the question is what
// decides where a field goes:
//
//   why       what the probe concluded, in one sentence          always
//   cite      what / where / check — the citation a reader acts on   when there is a defect to act on
//   evidence  what decided it: the things a reader looks at to check the verdict for themselves
//   measured  how it was counted: totals, samples, the tool and its version
//   doctrine  the instrument judging itself: the downgrade, the re-read, the falsification, the override
//
// The test between `evidence` and `measured` is not importance, it is use: would a reader open this
// to check the verdict, or is it the arithmetic behind the sentence they already read? `groups`
// (the colour pairs, as painted) is evidence. `axe: "4.13.0"` is measured. A surface may show all of
// `evidence` without choosing, which is the point — the choice moved into the probe, where the
// person who knows what the field means is the person naming it.
//
// Top level is a closed set. A probe that returns anything else fails `uxcli gate`.

export const VERDICTS = ['pass', 'fail', 'finding', 'not-applicable', 'not-committed', 'unmeasurable', 'suppressed'];
export const PROVENANCE = ['spec', 'project', 'opinion'];
export const METHODS = ['method-validated', 'method-unproven'];
// The four the doctrine calls loud — a verdict that asks something of a person.
// `rule` is the statement an opinion probe checks — what `sc` names in one word. Not evidence and
// not a measurement: it is the thing being measured against, so it ranks with `sc`.
const KEYS = ['probe', 'sc', 'provenance', 'method', 'verdict', 'why', 'rule', 'cite', 'evidence', 'measured', 'doctrine'];
const CITE = ['what', 'where', 'check'];

// `blocked` is what three probes return when the journey hit a bot wall. It is not a verdict — the
// doctrine has seven and that is not one of them — it is the absence of a measurement, which the
// doctrine already has a word for. Mapped here rather than in each probe, so the next probe to learn
// about bot walls gets it right by doing nothing.
const NOT_A_VERDICT = { blocked: { verdict: 'unmeasurable', why: 'the journey was blocked before this could be measured' } };

// The one place a probe's return becomes a packet. `run.js` and `page.js` both build through this —
// page.js writes three packets by hand (bot wall, probe threw, page never loaded) and those are
// exactly the ones nobody remembers to keep in shape.
export function packet(probe, out = {}) {
  const fix = NOT_A_VERDICT[out.verdict];
  // Every key of the closed set is taken here, not just the ones a probe usually sets. A probe that
  // restates `provenance` — text-overlap did — would otherwise have it swept into `evidence` as a
  // field, which is how a valid name ends up in the wrong place and nothing complains.
  const { probe: _p, sc, provenance, method, verdict, why, rule, cite, evidence, measured, doctrine, ...rest } =
    fix ? { ...out, ...fix } : out;
  const p = {
    probe: probe.id, sc: sc || probe.sc,
    provenance: provenance || probe.provenance || 'spec',
    method: method || probe.method?.status || 'method-unproven',
    verdict, why,
  };
  // README rule: an unproven method reports `finding` where it would say `fail`. The probe's own
  // verdict is kept, and it is kept in `doctrine`, because it is the doctrine that moved it.
  const dr = { ...doctrine };
  if (p.verdict === 'fail' && p.method !== 'method-validated') { dr.rawVerdict = 'fail'; p.verdict = 'finding'; }
  if (rule) p.rule = rule;
  if (cite) p.cite = cite;
  // A probe still returning a bare tail is not silently reshaped — that would be the leaf fix wearing
  // a root's clothes, and the drift would just move one level down. It is left where it is and the
  // validator names it.
  const ev = { ...evidence, ...rest };
  if (Object.keys(ev).length) p.evidence = ev;
  if (measured && Object.keys(measured).length) p.measured = measured;
  if (Object.keys(dr).length) p.doctrine = dr;
  return p;
}

// A packet as the contract describes it, whatever version it was written in. Runs written before the
// format carry their evidence loose at the top level; it is lifted into `evidence` rather than
// hidden, because the classification did not exist when they were measured and a reader opening an
// old run should still see what decided it. One function, so every reader — the dashboard server,
// `diff`, anything later — agrees about what an old packet meant.
export function read(p) {
  if (!p || typeof p !== 'object') return p;
  const loose = Object.keys(p).filter(k => !KEYS.includes(k));
  if (!loose.length) return p;
  const out = { evidence: {}, ...Object.fromEntries(Object.entries(p).filter(([k]) => KEYS.includes(k))) };
  out.evidence = { ...out.evidence };
  for (const k of loose) {
    if (k === 'rawVerdict' || k === 'prove' || k === 'reread' || k === 'override') (out.doctrine ||= {})[k] = p[k];
    else if (k === 'what' || k === 'where' || k === 'check') (out.cite ||= {})[k] = p[k];
    else out.evidence[k] = p[k];
  }
  if (!Object.keys(out.evidence).length) delete out.evidence;
  return out;
}

// What `gate` asserts about every packet every probe produces, and what `uxcli packet --check` runs
// over a run.json that already exists. Returns a list of sentences; empty means the packet holds.
export function validate(p, { probes } = {}) {
  const bad = [];
  const at = `${p.sc || '?'} ${p.probe || '?'}`;
  for (const k of ['probe', 'sc', 'provenance', 'method', 'verdict', 'why'])
    if (p[k] === undefined || p[k] === '') bad.push(`${at}: no ${k} — every packet states one, a verdict without a reason is not a verdict`);
  for (const k of Object.keys(p))
    if (!KEYS.includes(k)) bad.push(`${at}: \`${k}\` sits at the top level — it belongs in evidence, measured or doctrine (see src/probes/packet.md)`);
  if (p.verdict !== undefined && !VERDICTS.includes(p.verdict))
    bad.push(`${at}: verdict \`${p.verdict}\` is not one of the seven — ${VERDICTS.join(', ')}`);
  if (p.provenance !== undefined && !PROVENANCE.includes(p.provenance))
    bad.push(`${at}: provenance \`${p.provenance}\` is not one of ${PROVENANCE.join(', ')}`);
  if (p.method !== undefined && !METHODS.includes(p.method))
    bad.push(`${at}: method \`${p.method}\` is not one of ${METHODS.join(', ')}`);
  for (const k of ['cite', 'evidence', 'measured', 'doctrine'])
    if (p[k] !== undefined && (typeof p[k] !== 'object' || Array.isArray(p[k]) || p[k] === null))
      bad.push(`${at}: \`${k}\` must be an object naming its fields, not ${Array.isArray(p[k]) ? 'an array' : typeof p[k]}`);
  if (p.cite) {
    for (const k of Object.keys(p.cite)) if (!CITE.includes(k)) bad.push(`${at}: cite.${k} — a citation is what, where and check`);
    for (const k of CITE) if (!p.cite[k]) bad.push(`${at}: cite has no ${k} — a citation a reader cannot act on is not one`);
  }
  // A stated defect is a defect somebody can go and look at. This is the rule `explainAll` was
  // written for; nothing asserted it, so a probe could state a fail and cite nothing.
  const said = p.doctrine?.rawVerdict === 'fail' || p.verdict === 'fail';
  if (said && !p.cite) bad.push(`${at}: states a fail and cites nothing — a fail carries what, where and check`);
  if (probes && p.probe && !probes.some(x => x.id === p.probe)) bad.push(`${at}: no probe with id \`${p.probe}\``);
  return bad;
}

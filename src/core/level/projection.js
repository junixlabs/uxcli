// Every "current state" number, computed from authored + observed input and never read from a field.
// Delete index.json and this rebuilds it; degrade an input and the level goes down.
import { ORDER, rankReach } from '../run/reach.js';
import { latestOf } from '../run/verdicts.js';

const day = t => t ? String(t).slice(0, 10) : null;
const idOf = ref => String(ref || '').replace(/^.*\//, '').replace(/\.json$/, '').replace(/#.*$/, '');
const insightId = ref => String(ref || '').split('#')[1] || null;
const byTime = (a, b) => String(b.ranAt || '').localeCompare(String(a.ranAt || ''));
const MEASURED = new Set(['pass', 'fail', 'finding', 'not-applicable']);

// Confidence is a ceiling from what the insight carries — the author's own `confidence` is ignored.
export function insightStanding(i) {
  const evidence = (i.evidence || []).length > 0;
  const check = i.lastCheck || null;
  if (i.demotedAt || check?.fired === true) {
    return { confidence: 'hypothesis', demoted: day(i.demotedAt || check?.at), propagated: (i.propagatedTo || []).map(idOf) };
  }
  if (!evidence) return { confidence: 'hypothesis', why: 'không evidence' };
  if (!i.wouldChangeIf) return { confidence: 'low', why: 'không wouldChangeIf' };
  if (!check) return { confidence: 'medium', why: 'wouldChangeIf chưa từng kiểm' };
  return { confidence: 'high', lastCheck: day(check.at), fired: false };
}

const fpMeasured = (probe, corpus, id) => typeof probe?.fpRate === 'number' || corpus.some(l => l.probeResultAtLabel?.probe === id && typeof l.fpRate === 'number');
const unproven = c => (c.measurements || []).filter(m => m.method !== 'method-validated').length;

export function projection({ userModel, journeys = [], commitments = [], profiles = [], policy = {}, runs = [], proposals = [], corpusLabels = [], probes = [], runHashes = {}, now } = {}) {
  const current = runs.map(r => r.run).filter(Boolean).sort(byTime);
  const completed = current.filter(r => r.status === 'completed');
  const at = now || current[0]?.ranAt || null;
  const overdue = c => c.reviewAfter && at && String(c.reviewAfter) < String(at);

  // Insights — and which commitments lean on a demoted one.
  const insights = {};
  const demoted = new Set();
  for (const i of userModel?.insights || []) {
    insights[i.id] = insightStanding(i);
    if (insights[i.id].demoted) demoted.add(i.id);
  }
  const leansOnDemoted = c => (c.trace || []).map(insightId).filter(id => id && demoted.has(id));

  // Commitments: status, anchor, latest verdict, and what keeps them from counting.
  const standingC = {};
  let verified = 0;
  for (const c of commitments) {
    const s = { status: c.status };
    if (c.anchor) {
      const actual = runHashes[c.anchor.run] ?? null;
      s.anchor = !c.anchor.hash || !actual ? 'unverifiable' : c.anchor.hash === actual ? 'matches' : 'differs';
    }
    if (unproven(c)) s.method = 'unproven';
    const latestRun = completed.find(r => (r.verdicts || []).some(v => v.commitment === c.id));
    const latest = latestRun ? latestOf(latestRun.verdicts.filter(v => v.commitment === c.id)) : null;
    if (latest) s.latest = latest;
    if (c.status === 'RETIREMENT_PROPOSED' && c.retirement) { s.via = idOf(c.retirement.proposal); if (!c.retirement.decidedBy) s.awaiting = c.retirement.requires?.ref || null; }
    if (overdue(c)) s.reviewOverdue = c.reviewAfter;
    const lean = leansOnDemoted(c);
    if (lean.length && c.status === 'ACTIVE') s.traceDemoted = lean;
    standingC[c.id] = s;
    const evaluated = completed.some(r => (r.verdicts || []).some(v => v.commitment === c.id && MEASURED.has(v.value)
      && c.measurements?.[v.measurement]?.method === 'method-validated'));
    if (c.status === 'ACTIVE' && !s.reviewOverdue && !s.traceDemoted && s.anchor !== 'differs' && evaluated) verified++;
  }

  // Trust axis.
  const toGate = [];
  const corpusN = corpusLabels.length;
  const failedProbes = new Set(completed.flatMap(r => (r.probes || []).filter(p => ['fail', 'finding'].includes(p.value)).map(p => p.id)));
  for (const id of failedProbes) {
    if (!fpMeasured(probes.find(p => p.id === id), corpusLabels, id)) toGate.push(`probe ${id}: fpRate chưa đo (${corpusN} corpus case, cần ≥ N) → chưa được fail`);
  }
  for (const c of commitments) {
    const n = unproven(c), total = (c.measurements || []).length;
    if (c.status === 'ACTIVE' && n) {
      const label = n === total ? (total === 1 ? 'measurement' : total === 2 ? 'cả hai measurement' : `cả ${total} measurement`) : `${n}/${total} measurement`;
      toGate.push(`${c.id}: ${label} method-unproven → chưa gate được`);
    }
    if (c.status === 'RETIREMENT_PROPOSED' && !c.retirement?.decidedBy) toGate.push(`${c.id} RETIREMENT_PROPOSED từ ${day(c.retirement?.at)}, chưa ai quyết`);
    if (standingC[c.id].reviewOverdue) toGate.push(`${c.id}: quá reviewAfter ${c.reviewAfter}, chưa ai xem → chỉ được finding`);
    if (standingC[c.id].traceDemoted) toGate.push(`${c.id}: trace tới insight đã demote (${standingC[c.id].traceDemoted.join(', ')}) → chờ quyết`);
  }
  const trust = verified === 0 ? 'observe' : toGate.length ? 'verify' : 'gate';
  if (trust === 'observe') toGate.unshift('chưa có ACTIVE commitment nào với measurement method-validated được đo trên một run completed');

  // Reach axis: the most any completed run achieved, and what keeps the next environment shut.
  const reach = completed.map(r => r.reach?.effective).filter(Boolean).sort((a, b) => rankReach(b) - rankReach(a))[0] || 'observe';
  const toInject = [];
  const fixtureRuns = current.flatMap(r => (r.scenario?.fixtures || []).map(f => ({ ...f, ranAt: r.ranAt })));
  for (const p of new Set(fixtureRuns.map(f => f.profile))) {
    const cleanups = fixtureRuns.filter(f => f.profile === p).map(f => f.cleanup);
    if (!cleanups.includes('deleted')) toInject.push(`recoverability của ${p} unverified: cleanup chưa từng chạy sạch trên run fail`);
  }
  for (const [env, e] of Object.entries(policy.environments || {})) {
    if (rankReach(e.reachMax) > rankReach(reach) && !current.some(r => r.environment === env)) toInject.push(`environment ${env} chưa có run nào`);
  }
  const L = { observe: 'L1 — Observe', verify: 'L2 — Verify', gate: reach === ORDER[ORDER.length - 1] ? 'L4 — Gate + inject' : 'L3 — Gate' }[trust];

  // Profiles, from what runs recorded about them.
  const standingP = {};
  for (const p of profiles) {
    const seen = current.flatMap(r => [
      ...(r.scenario?.identity?.profile === p.id ? [{ hash: r.scenario.identity.profileHash, ranAt: r.ranAt, ok: Object.values(r.scenario.identity.verified || {}).every(Boolean) && Object.keys(r.scenario.identity.verified || {}).length > 0 }] : []),
      ...(r.scenario?.fixtures || []).filter(f => f.profile === p.id).map(f => ({ hash: f.profileHash, ranAt: r.ranAt, ok: Object.values(f.verifiedHold || {}).every(Boolean) && Object.keys(f.verifiedHold || {}).length > 0 })),
    ]).sort(byTime);
    standingP[p.id] = seen.length ? { hash: seen[0].hash || null, lastMaterialized: seen[0].ranAt, verified: seen[0].ok } : { hash: null, lastMaterialized: null, verified: false };
  }

  // Journeys and the proposals that explain what is not measured.
  const standingJ = {};
  const unmeasuredBecause = [];
  for (const j of journeys) {
    const run = current.find(r => idOf(r.journey?.ref) === j.id);
    const s = { definitionHash: j.definitionHash || run?.journey?.definitionHash || null };
    const um = (j.workflows || []).filter(w => w.status === 'unmeasurable').map(w => w.id);
    if (um.length) s.unmeasurable = um;
    standingJ[j.id] = s;
    for (const w of um) {
      const p = proposals.find(x => (x.trace || []).includes(`journeys/${j.id}.json#${w}`));
      unmeasuredBecause.push(`${j.id}/${w}${p ? ' ← ' + p.id : ''}`);
    }
  }

  const rows = current.map(r => {
    const h = runs.find(x => x.run === r)?.history || [];
    const row = { target: r.id, env: r.environment, latest: r.ranAt, exit: r.exit, history: h.length };
    if (r.status !== 'completed') return { target: r.id, env: r.environment, latest: r.ranAt, exit: r.exit, status: r.status };
    row.fails = (r.verdicts || []).filter(v => v.value === 'fail').map(v => v.commitment || `${v.workflow ? v.workflow + '/' : ''}${v.step}`);
    return row;
  });

  const standing = {};
  if (userModel) standing[userModel.file || `understanding/${userModel.actor}.json`] = insights;
  Object.assign(standing, { commitments: standingC, profiles: standingP, journeys: standingJ });

  return {
    generatedAt: at,
    rebuildable: true,
    level: { trust, reach, story: L, toNext: { 'trust → gate': toGate, 'reach → inject': toInject } },
    standing,
    proposals: {
      open: proposals.filter(p => p.status === 'proposed').length,
      approved: proposals.filter(p => p.status === 'approved').length,
      unimplementedProfiles: proposals.filter(p => p.kind === 'profile' && p.status === 'proposed').length,
      unmeasuredBecause,
    },
    rows,
  };
}

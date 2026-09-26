// A schema-2 journey run against a product in Chrome. This is the adapter seam: files, browser and
// provisioner live here; every decision (held, blocked, reach, verdict, level) is core's.
//
// in:  the journey file inside a project's .uxcli/journeys/, and { env, origin, viewport, out }
// out: { run, commitments, root, dir } — run.json and screenshots written under .uxcli/runs/<id>/,
//      .uxcli/index.json recomputed from disk
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
import { launch } from './browser.js';
import { observe, intercept, requestMatches, getPath } from './adapters/chrome/index.js';
import { provision, verifyIdentity, allowedPermissions, cleanup } from './adapters/provision/index.js';
import { parseJourney, prerequisitesOf } from './core/model/journey.js';
import { parseCommitment } from './core/model/commitment.js';
import { parsePolicy } from './core/model/policy.js';
import { parseProfile } from './core/model/profile.js';
import { holds } from './core/observe/holds.js';
import { derive } from './core/observe/derive.js';
import { constraintHeld } from './core/observe/constraint.js';
import { effectiveReach, workflowPolicy, atLeast } from './core/run/reach.js';
import { plan, blockedAt, pickWorkflow } from './core/run/plan.js';
import { packet, seal, effectsFrom } from './core/run/packet.js';
import { verdicts, scopeMatches } from './core/run/verdicts.js';
import { outcomeOf } from './core/run/measure.js';
import { projection } from './core/level/projection.js';
import { UXCLI, dirFor, rotate, currentRuns } from './adapters/store/runs.js';
import { runHash } from './adapters/store/run-hash.js';

const readJson = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const sha256 = s => 'sha256:' + crypto.createHash('sha256').update(s).digest('hex');
const sha1 = s => crypto.createHash('sha1').update(String(s)).digest('hex');
const listJson = dir => fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().map(f => ({ file: path.join(dir, f), text: fs.readFileSync(path.join(dir, f), 'utf8') })) : [];
const walkJson = (dir, out = []) => { if (!fs.existsSync(dir)) return out; for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); e.isDirectory() ? walkJson(p, out) : e.name.endsWith('.json') && out.push(readJson(p)); } return out; };
const camel = n => n.split('.').map((p, i) => i ? p[0].toUpperCase() + p.slice(1) : p).join('');

export function findRoot(from) {
  let d = path.resolve(from);
  for (;;) { if (fs.existsSync(path.join(d, UXCLI, 'policy', 'policy.json'))) return d; const up = path.dirname(d); if (up === d) return null; d = up; }
}
export const isSchema2 = doc => !!(doc && typeof doc === 'object' && doc.states && Array.isArray(doc.workflows));

// Everything authored in .uxcli/, parsed, with the problems each parser found kept beside it.
export function loadProject(root) {
  const U = path.join(root, UXCLI);
  const problems = [];
  const project = fs.existsSync(path.join(U, 'project.json')) ? readJson(path.join(U, 'project.json')) : {};
  const policy = parsePolicy(readJson(path.join(U, 'policy', 'policy.json')));
  problems.push(...policy.problems.map(p => `policy/policy.json: ${p}`));
  const rawJourneys = listJson(path.join(U, 'journeys')).map(x => ({ ...x, doc: JSON.parse(x.text) }));
  const refs = {};
  for (const { doc } of rawJourneys) for (const [name, s] of Object.entries(doc.states || {})) if (!s?.$ref) refs[`journeys/${doc.id}.json#/states/${name}`] = s;
  const journeys = rawJourneys.map(x => { const r = parseJourney(x.doc, { refs }); problems.push(...r.problems.map(p => `${path.relative(U, x.file)}: ${p}`)); return { ...r, file: x.file, hash: sha256(x.text) }; });
  const docsFor = d => { const out = {}; const doc = d?.source?.doc; if (doc) { const f = path.join(U, doc); out[doc] = fs.existsSync(f) ? { found: true, text: fs.readFileSync(f, 'utf8'), tracked: true } : { found: false }; } return out; };
  const commitments = listJson(path.join(U, 'commitments')).map(x => { const d = JSON.parse(x.text); const r = parseCommitment(d, { docs: docsFor(d) }); problems.push(...r.problems.map(p => `${path.relative(U, x.file)}: ${p}`)); return { ...r, file: x.file }; });
  const profiles = listJson(path.join(U, 'profiles')).map(x => { const r = parseProfile(JSON.parse(x.text)); problems.push(...r.problems.map(p => `${path.relative(U, x.file)}: ${p}`)); return { ...r, file: x.file, hash: sha256(x.text) }; });
  const userModel = listJson(path.join(U, 'understanding')).map(x => JSON.parse(x.text))[0] || null;
  const rules = {};
  for (const [name, ref] of Object.entries(project.rules || {})) {
    const f = path.join(root, ref.file);
    if (!fs.existsSync(f)) { problems.push(`project.json rules.${name}: ${ref.file} not found`); continue; }
    const v = getPath(readJson(f), ref.path);
    if (v === undefined) problems.push(`project.json rules.${name}: ${ref.path} not in ${ref.file}`); else rules[name] = { value: v, source: 'project-policy', file: ref.file };
  }
  return { root, U, project, policy, journeys, refs, commitments, profiles, userModel, rules, problems,
    proposals: listJson(path.join(U, 'proposals')).map(x => JSON.parse(x.text)),
    corpusLabels: listJson(path.join(U, 'corpus')).map(x => JSON.parse(x.text)),
    probes: walkJson(path.join(U, 'probes')) };
}

// index.json is a projection: computed from what is on disk, never edited, safe to delete.
export function projectionOf(P) {
  // Only journey packets belong to the projection; a page run (`run <url>`) has no journey and no level.
  const runs = currentRuns(P.root).filter(r => r.run.journey?.ref);
  const runHashes = {};
  for (const c of P.commitments.map(c => c.value).filter(c => c?.anchor?.run)) { const d = path.join(P.U, c.anchor.run); if (fs.existsSync(path.join(d, 'run.json'))) runHashes[c.anchor.run] = "sha256:" + runHash(d); }
  return projection({ userModel: P.userModel, journeys: P.journeys.map(j => j.value && { ...j.value, definitionHash: j.hash }).filter(Boolean),
    commitments: P.commitments.map(c => c.value).filter(Boolean), profiles: P.profiles.map(p => p.value && { ...p.value, hash: p.hash }).filter(Boolean),
    policy: P.policy.value || {}, runs, proposals: P.proposals, corpusLabels: P.corpusLabels, probes: P.probes, runHashes });
}
export function writeProjection(P) {
  const idx = projectionOf(P);
  fs.writeFileSync(path.join(P.U, 'index.json'), JSON.stringify(idx, null, 2) + '\n');
  return idx;
}

const defaultEnv = policy => policy.defaultEnvironment || Object.keys(policy.environments || {}).find(k => k !== 'production') || Object.keys(policy.environments || {})[0];

// `{name}` → the raw value the run holds for it (identity, fixture), else the template stays.
const fill = (s, params) => String(s ?? '').replace(/\{([A-Za-z0-9_.]+)\}/g, (m, k) => (k in params && !String(params[k]).startsWith('sha1_8:') ? String(params[k]) : m));
// One value, every spelling the journey may bind it by: `lead.id`, `leadId`, `id`.
const bind = (params, name, v) => { params[name] = v; params[camel(name)] = v; const last = name.split('.').pop(); if (!(last in params) || params[last] === params[name]) params[last] = v; };

const selectorsOf = (state, step, measurements, params) => {
  const out = new Set();
  for (const s of state?.signals || []) if (s.selector) out.add(fill(s.selector, params));
  for (const x of step?.interactions || []) if (x.type === 'ui') out.add(fill(x.target, params));
  for (const p of measurements) { if (p?.selector) out.add(p.selector); if (p?.then?.selector) out.add(p.then.selector); }
  return [...out];
};
const keysOf = (state, step) => [...new Set([...(state?.signals || []).filter(s => s.observer === 'storage').map(s => s.key),
  ...(step?.interactions || []).filter(x => x.type === 'data').flatMap(x => x.produces || [])])];

export async function runJourney(file, { env, origin, viewport = '390x844', out } = {}) {
  const root = findRoot(path.dirname(file));
  if (!root) throw new Error(`no .uxcli/policy/policy.json above ${file} — uxcli run needs a project`);
  const P = loadProject(root);
  const text = fs.readFileSync(file, 'utf8');
  const parsed = parseJourney(JSON.parse(text), { refs: P.refs });
  if (!parsed.ok) return { problems: parsed.problems.map(p => `${path.relative(root, file)}: ${p}`), root };
  if (!P.policy.ok) return { problems: P.problems, root };
  const journey = parsed.value; const definitionHash = sha256(text);
  const policy = P.policy.value; const envName = env || defaultEnv(policy); const penv = policy.environments[envName];
  if (!penv) return { problems: [`policy names no environment "${envName}"; have ${Object.keys(policy.environments).join(', ')}`], root };
  const target = origin || penv.origin;
  const envBag = { ...penv, environments: policy.environments, hostClasses: policy.hostClasses };
  const commitments = P.commitments.map(c => c.value).filter(Boolean);
  const ranAt = new Date().toISOString();
  const id = `j-${journey.id}${envName === defaultEnv(policy) ? '' : '@' + envName}`;
  const dir = out || dirFor(root, id); rotate(dir); fs.mkdirSync(dir, { recursive: true });
  const ctx = { hash: sha1, dialCode: P.project.locale?.dialCode, viewport };
  const prereqs = [...new Set(prerequisitesOf(journey).map(p => p.state))];
  const wfId = w => `${journey.id}/${w.id}`;
  const shell = { ...process.env, UXCLI_TARGET: target };
  const finish = async (run, scenarioFix) => { const sealed = scenarioFix ? await scenarioFix(run) : run; fs.writeFileSync(path.join(dir, 'run.json'), JSON.stringify(sealed, null, 1) + '\n'); writeProjection(P); return { run: sealed, commitments, root, dir }; };

  // Identity: the provisioner's word, checked against the environment. Creating one is a mutation.
  let identity = null, idValues = null, idProfile = null, idRejected = null;
  if (journey.requires?.identityProfile && policy.testIdentity?.mode === 'provision' && atLeast(penv.reachMax, 'mutate')) {
    idProfile = P.profiles.find(p => p.value?.id === (policy.testIdentity.profile || journey.requires.identityProfile));
    if (!idProfile?.value) return { problems: [`no profile ${journey.requires.identityProfile} for the identity`], root };
    const r = provision(idProfile.value, { cwd: root, env: shell });
    if (!r.ok) idRejected = { rejected: [{ field: 'provisioner', why: r.error || `missing ${r.missing.join(', ')}` }] };
    else {
      const v = verifyIdentity(r.values, penv, { allowed: allowedPermissions(idProfile.value) });
      const no = f => v.rejected.some(x => x.field === f);
      idValues = r.values;
      identity = { mode: 'provision', profile: idProfile.value.id, profileHash: idProfile.hash, idHash: r.hashes.userId, tenant: r.values.tenantId, permissions: r.values.permissions,
        verified: { tenant: !no('tenantId'), emailSink: !no('email'), permissions: !no('permissions'), expiresAt: !no('expiresAt') }, cleanupVerified: false, expiresAt: r.values.expiresAt };
      if (!v.ok) idRejected = v;
    }
  }
  const scenario = { identity, fixtures: [] };
  const params = {}; if (idValues) for (const [k, v] of Object.entries(idValues)) params['identity.' + k] = v;

  const workflows = journey.workflows.filter(w => w.steps?.length);
  const plans = workflows.map(w => ({ w, p: plan(journey, policy, envName, scenario, { prerequisites: prereqs, workflow: w.id }) }));
  const blockedNow = idRejected ? blockedAt({ identity: idRejected }) : plans.every(x => x.p.status === 'blocked') ? plans[0].p : null;
  if (blockedNow) {
    const run = seal(packet({ id, journey, definitionHash, env: envName, viewport, scenario, reach: plans[0].p.reach, effects: { declared: [], observed: [] }, ranAt, blocked: { reason: blockedNow.reason, which: blockedNow.which } }), []);
    return finish(run, async r => { if (idValues) identity.cleanupVerified = cleanup(idProfile.value, idValues, { cwd: root, env: shell }).verified; return { ...r, scenario: { identity, fixtures: [] } }; });
  }

  const measurementsAt = key => commitments.filter(c => ['ACTIVE', 'RETIREMENT_PROPOSED'].includes(c.status) && c.scope?.journey === journey.id)
    .flatMap(c => c.measurements || []).filter(m => m.target === key).map(m => m.predicate).filter(p => p && typeof p === 'object');

  // A prerequisite is a state nothing in this workflow produces: reach it by its own url, or by the
  // journey whose happy path ends there — walked, not measured.
  async function establish(page, j, stateName, depth = 0) {
    const st = j.states[stateName] || {};
    const url = (st.signals || []).find(s => s.observer === 'url' && s.path && !/\{/.test(s.path));
    if (url) { await page.goto(target + url.path, { waitUntil: 'load' }); return; }
    if (depth > 2) return;
    for (const other of P.journeys.map(x => x.value).filter(x => x && x.id !== j.id)) {
      const w = pickWorkflow(other); const last = w.steps?.filter(s => s.kind !== 'fixture').at(-1);
      if (last?.after !== stateName) continue;
      for (const s of w.steps) if (s.kind !== 'fixture') await doStep(page, other, w, s, { record: false, depth: depth + 1 });
      return;
    }
  }

  const stepResults = [], obsList = [], obsOf = new Map(), caps = [], fixtures = []; let blocked = null;

  async function doStep(page, j, w, step, { record, depth = 0 }) {
    const before = j.states[step.before], after = j.states[step.after];
    const isPre = record ? prereqs.includes(step.before) : !w.steps.some(x => x !== step && x.after === step.before);
    if (isPre) await establish(page, j, step.before, depth);
    const shot = side => record ? `${w.id}-${step.id}-${side}` : null;
    const obsB = await observe(page, { action: null, since: 0, selectors: selectorsOf(before, step, measurementsAt(step.before), params), policy, storageKeys: keysOf(before, step), shotDir: record ? dir : null, shotName: shot('before') });
    const bh = holds(before, obsB, { ...ctx, params });
    if (record && isPre) {
      if (bh.held === false) { blocked = blockedAt({ prerequisites: [{ step: step.id, state: step.before, held: false, why: bh.why }] }); return false; }
      if (bh.held === null) caps.push({ by: 'prerequisite-unverified', step: step.id });
    }
    const handles = []; let failedFill = null;
    for (const x of step.interactions || []) if (x.intercept) handles.push({ x, h: await intercept(page, { request: fill(x.request, params), status: x.intercept.status, blockAllOfEffect: !!x.intercept.blockAllOfEffect }) });
    const ui = (step.interactions || []).filter(x => x.type === 'ui');
    const fills = ui.filter(x => x.fill !== undefined).map(x => ({ type: 'fill', selector: fill(x.target, params), value: fill(x.fill, params) }));
    const action = ui.filter(x => x.fill === undefined).map(x => ({ type: 'ui', target: fill(x.target, params) }));
    let ref = obsB;
    if (fills.length) { try { ref = await observe(page, { action: fills, since: 0, selectors: fills.map(f => f.selector), policy }); } catch (e) { failedFill = e.message; } }
    const produces = (step.interactions || []).filter(x => x.type === 'api' && x.produces?.length).map(x => ({ request: fill(x.request, params), paths: x.produces }));
    let obsA = null, failed = failedFill;
    if (!failed) try { obsA = await observe(page, { action, selectors: selectorsOf(after, step, [...measurementsAt(step.after), ...measurementsAt(step.id)], params), produces, policy, storageKeys: keysOf(after, step), shotDir: record ? dir : null, shotName: shot('after') }); }
    catch (e) { failed = e.message; }
    for (const { h } of handles) h.release();
    const ah = obsA ? holds(after, obsA, { ...ctx, params, before: ref }) : { held: null, strength: after?.strength, signals: {}, why: [`action failed: ${failed}`] };
    const produced = {}, byInteraction = new Map();
    for (const x of step.interactions || []) {
      const mine = {};
      if (x.type === 'api') for (const p of x.produces || []) { const n = [...(obsA?.network || [])].reverse().find(e => e.fields?.[p]); if (n) { mine[p] = n.fields[p]; bind(params, p, n.fields[p]); } }
      if (x.type === 'data') for (const k of x.produces || []) { const h = obsA?.storage?.[k]?.hash; if (h) { mine[k] = h; bind(params, k, h); } }
      Object.assign(produced, mine); if (Object.keys(mine).length) byInteraction.set(x, mine);
    }
    if (!record) return true;
    const interactions = (step.interactions || []).map(x => {
      if (x.type === 'ui') { const d = obsB.dom?.[fill(x.target, params)]; return { type: 'ui', target: x.target, ...(d && { inViewportWithoutScroll: d.inViewportWithoutScroll, scrollsNeeded: d.scrollsNeeded, viewport }), ...(x.consumes && { consumed: x.consumes }) }; }
      if (x.type === 'api') { const n = (obsA?.network || []).find(e => requestMatches(fill(x.request, params), e.method, e.path)); return { type: 'api', request: x.request, ...(n && { status: n.status, ms: n.ms, ...(n.effectClass && { effect: n.effectClass }), ...(n.requestHeaders?.['x-tenant-id'] && { tenantHeader: n.requestHeaders['x-tenant-id'] }), ...(n.blocked && { blocked: true, intercepted: n.intercepted }) }), ...(byInteraction.has(x) && { produced: byInteraction.get(x) }), ...(x.consumes && { consumed: x.consumes }) }; }
      return { type: x.type, ...(x.to && { to: x.to }), ...(x.expr && { expr: x.expr }), ...(byInteraction.has(x) && { produced: byInteraction.get(x) }), ...(x.consumes && { consumed: x.consumes }) };
    });
    const shots = [obsB, obsA].flatMap(o => o?.shots || []);
    const r = { id: step.id, workflow: w.id, action: step.action, before: { state: step.before, ...bh }, after: { state: step.after, ...ah, ...(ah.held === false && { what: ah.why.join('; ') }) }, interactions, produced, ...(obsA?.timing && { timing: obsA.timing }), shots,
      ...(handles.length && { intercepted: { request: handles[0].x.request, returned: handles[0].x.intercept.status, blocked: handles.reduce((n, { h }) => n + h.count, 0) } }) };
    stepResults.push(r); obsOf.set(r, { before: obsB, after: obsA }); obsList.push({ step: step.id, observation: obsA });
    return true;
  }

  function materialize(step, w) {
    const prof = P.profiles.find(p => p.value?.id === step.profile);
    const problems = []; const used = {};
    if (!prof?.value) return { problems: [`no profile ${step.profile}`] };
    for (const [k, spec] of Object.entries(prof.value.derive || {})) { const d = derive(spec, P.rules); if (d.value == null) problems.push(...d.problems); else used[k] = d.value; }
    Object.assign(used, step.params || {});
    for (const [k, v] of Object.entries(used)) { const a = prof.value.allowedParams?.[k]; if (a && ((a.min != null && v < a.min) || (a.max != null && v > a.max))) problems.push(`${k}=${v} outside allowedParams [${a.min}, ${a.max}]`); }
    if (problems.length) return { problems };
    const t0 = Date.now();
    const r = provision(prof.value, { cwd: root, env: { ...shell, ...(idValues?.tenantId && { UXCLI_TENANT_ID: idValues.tenantId }) }, params: used });
    if (!r.ok) return { problems: [r.error || `provisioner output missing ${r.missing.join(', ')}`] };
    for (const [k, v] of Object.entries(r.values)) bind(params, k, v);
    const want = prof.value.constraints || {}; const hold = {};
    if ('status' in want) hold.status = r.values['lead.status'] === want.status || r.values.status === want.status;
    if (idValues?.tenantId) hold.tenant = [r.values['lead.tenantId'], r.values.tenantId].includes(idValues.tenantId);
    const produced = Object.fromEntries((step.produces || []).map(k => [k, r.hashes[k]]).filter(([, v]) => v));
    const record = { step: step.id, profile: prof.value.id, profileHash: prof.hash, params: used, idHash: Object.values(r.hashes)[0], verifiedHold: hold, verifiedBy: 'provisioner output', cleanup: null };
    fixtures.push({ record, prof: prof.value, values: r.values });
    stepResults.push({ id: step.id, workflow: w.id, kind: 'fixture', profile: prof.value.id, produced, ms: Date.now() - t0 });
    return { problems: [] };
  }

  const skipped = [];
  const browser = await launch();
  const [vw, vh] = viewport.split('x').map(Number);
  try {
    for (const { w, p } of plans) {
      if (p.status === 'blocked') { skipped.push({ workflow: w.id, reason: p.reason, which: p.which }); continue; }
      const context = await browser.newContext({ viewport: { width: vw, height: vh } }); const page = await context.newPage();
      try {
        for (const step of w.steps) {
          if (step.kind === 'fixture') { const m = materialize(step, w); if (m.problems.length) { blocked = blockedAt({ fixtures: [{ step: step.id, profile: step.profile, problems: m.problems }] }); break; } continue; }
          if (!await doStep(page, journey, w, step, { record: true })) break;
        }
      } finally { await context.close(); }
      if (blocked) break;
    }
  } finally { await browser.close(); }

  const merged = { network: obsList.flatMap(o => o.observation?.network || []) };
  const constraints = (penv.constraints || []).map(c => constraintHeld(c, merged, envBag));
  const reach = (plans.find(x => x.p.status === 'ok') || plans[0]).p.reach;
  const declared = [...new Set(workflows.flatMap(w => workflowPolicy(policy, wfId(w))?.effects || []))];
  const shots = fs.readdirSync(dir).filter(f => /\.png$/i.test(f)).sort();
  let run = packet({ id, journey, definitionHash, env: envName, viewport, scenario: { identity, fixtures: fixtures.map(f => f.record) }, reach, effects: { declared, observed: effectsFrom(obsList) }, stepResults, constraints, ruleSnapshots: P.rules, ranAt,
    ...(blocked && { blocked }), evidence: { shots, redacted: ['Authorization', 'Cookie', 'password', 'email', 'phone', 'ids → sha1_8'] } });
  const withObs = stepResults.map(s => ({ ...s, obs: obsOf.get(s) }));
  const outcomes = [];
  for (const c of commitments) if (['ACTIVE', 'RETIREMENT_PROPOSED'].includes(c.status) && scopeMatches(c, run)) (c.measurements || []).forEach((m, i) => outcomes.push(outcomeOf(c, m, i, withObs, ctx)));
  const anchorHashes = {};
  for (const c of commitments) if (c.anchor?.run) { const d = path.join(P.U, c.anchor.run); if (fs.existsSync(path.join(d, 'run.json'))) anchorHashes[c.anchor.run] = "sha256:" + runHash(d); }
  run = seal(run, verdicts(commitments, run, { caps, outcomes, anchorHashes }).verdicts);
  if (skipped.length) run.skipped = skipped;

  // Cleanup, or not: a failing run's fixtures are the evidence, so they stay — with an expiry.
  return finish(run, async r => {
    const retain = r.exit === 2; const expires = new Date(Date.now() + 48 * 3600e3).toISOString();
    for (const f of [...fixtures].reverse()) {
      if (retain) Object.assign(f.record, { cleanup: 'retained', retainedBecause: 'run có fail — fixture là bằng chứng', expiresAt: expires });
      else { const c = cleanup(f.prof, f.values, { cwd: root, env: shell }); Object.assign(f.record, { cleanup: c.status, cleanupVerified: c.verified }); }
    }
    if (identity && idValues) {
      if (retain) Object.assign(identity, { cleanupVerified: false, retained: true, retainedBecause: 'run có fail' });
      else identity.cleanupVerified = cleanup(idProfile.value, idValues, { cwd: root, env: shell }).verified;
    }
    return { ...r, scenario: { identity, fixtures: fixtures.map(f => f.record) } };
  });
}

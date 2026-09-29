// Lenses: sets of viewpoints from named designers, packaged by the kind of UI they are read against.
// A viewpoint is somebody else's rule with their name and their page on it; a lens for a kind of UI
// (marketing, content, data, workspace, shop, transaction) picks the viewpoints that apply to that kind. A review
// is an agent's answer to every viewpoint of a lens for one drawing or one screen, signed on a
// person's say-so. uxcli holds the library and checks the review is complete; it never grades the
// screen. Everything here is pure: parsers in, { value, problems } out.
import { isStr, isObj } from './common.js';

export const KINDS = ['marketing', 'content', 'data', 'workspace', 'shop', 'transaction'];
export const EVIDENCE = ['study', 'author', 'secondary', 'folklore'];
export const MEASURE = ['count', 'question'];
export const ANSWERS = ['holds', 'breaks', 'n/a'];
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const strs = v => Array.isArray(v) && v.every(isStr);

// One school's pool: skills/uxcli/lenses/viewpoints/<school>.json.
export function parseViewpoints(doc) {
  const problems = [];
  if (!isObj(doc)) return { value: null, problems: ['not an object'] };
  if (doc.schema_version !== 1) problems.push('schema_version must be 1');
  if (!isStr(doc.school) || !ID.test(doc.school)) problems.push('school: a kebab-case id');
  if (!isStr(doc.name)) problems.push('name: required');
  if (!isStr(doc.research)) problems.push('research: the research file the pool was distilled from');
  if (!Array.isArray(doc.viewpoints) || !doc.viewpoints.length) { problems.push('viewpoints: a non-empty array'); return { value: null, problems }; }
  const seen = new Set();
  const viewpoints = doc.viewpoints.map((v, i) => {
    const at = `viewpoints[${i}]`;
    if (!isObj(v)) { problems.push(`${at}: not an object`); return null; }
    if (!isStr(v.id) || !v.id.startsWith(`${doc.school}.`) || !ID.test(v.id.slice(doc.school.length + 1))) problems.push(`${at}.id: "${v.id}" must be ${doc.school}.<kebab-id>`);
    else if (seen.has(v.id)) problems.push(`${at}.id: "${v.id}" appears twice`); else seen.add(v.id);
    if (!isStr(v.claim)) problems.push(`${at}.claim: required`);
    const s = v.source;
    if (!isObj(s) || !isStr(s.author) || !isStr(s.work) || !isStr(s.url) || typeof s.quote !== 'string') problems.push(`${at}.source: { author, work, url, quote } — a viewpoint without a named author and a page is taste, and taste does not ship`);
    else if (!/^https?:\/\//.test(s.url)) problems.push(`${at}.source.url: not a URL`);
    if (!EVIDENCE.includes(v.evidence)) problems.push(`${at}.evidence: one of ${EVIDENCE.join(', ')}`);
    else if (v.evidence !== 'folklore' && isObj(s) && !s.quote) problems.push(`${at}: evidence "${v.evidence}" with an empty quote — only folklore may go unquoted`);
    if (!strs(v.prefers) || !strs(v.forbids)) problems.push(`${at}: prefers[] and forbids[] are lists of strings`);
    const m = v.measure;
    if (!isObj(m) || !MEASURE.includes(m.kind) || !isStr(m.what)) problems.push(`${at}.measure: { kind: count|question, what }`);
    else if (m.kind === 'count' && !(isStr(m.mustFail) && isStr(m.mustPass))) problems.push(`${at}.measure: a count names its must-fail and must-pass fixtures, or it is a question`);
    if (m && isStr(m.probe) && !/^page\.[a-z-]+$/.test(m.probe)) problems.push(`${at}.measure.probe: a page probe id`);
    if (!isObj(v.kinds) || KINDS.some(k => !['yes', 'no', 'maybe'].includes(v.kinds[k]))) problems.push(`${at}.kinds: yes|no|maybe for each of ${KINDS.join(', ')}`);
    if (!strs(v.exceptions || [])) problems.push(`${at}.exceptions: a list of strings`);
    if (!strs(v.agrees || [])) problems.push(`${at}.agrees: a list of viewpoint ids`);
    for (const k of Object.keys(v)) if (!['id', 'claim', 'source', 'evidence', 'prefers', 'forbids', 'measure', 'exceptions', 'kinds', 'kindsWhy', 'agrees'].includes(k)) problems.push(`${at}: unknown key "${k}"`);
    return { id: v.id, claim: v.claim, source: s, evidence: v.evidence, prefers: v.prefers || [], forbids: v.forbids || [], measure: m || null, exceptions: v.exceptions || [], kinds: v.kinds || {}, kindsWhy: v.kindsWhy || '', agrees: v.agrees || [] };
  });
  return { value: problems.length ? null : { school: doc.school, name: doc.name, research: doc.research, viewpoints }, problems };
}

// One lens: skills/uxcli/lenses/<kind>.json — a kind of UI and the viewpoints read against it.
export function parseLens(doc) {
  const problems = [];
  if (!isObj(doc)) return { value: null, problems: ['not an object'] };
  if (doc.schema_version !== 1) problems.push('schema_version must be 1');
  if (!isStr(doc.id) || !KINDS.includes(doc.id)) problems.push(`id: one of ${KINDS.join(', ')}`);
  if (!isStr(doc.name)) problems.push('name: required');
  if (!isStr(doc.when)) problems.push('when: one sentence saying what kind of UI this lens is read against');
  if (!Array.isArray(doc.picks) || !doc.picks.length) { problems.push('picks: a non-empty array of { viewpoint, note? }'); return { value: null, problems }; }
  const seen = new Set();
  const picks = doc.picks.map((p, i) => {
    if (!isObj(p) || !isStr(p.viewpoint)) { problems.push(`picks[${i}]: { viewpoint, note? }`); return null; }
    if (seen.has(p.viewpoint)) problems.push(`picks[${i}]: ${p.viewpoint} picked twice`); seen.add(p.viewpoint);
    if (p.note !== undefined && !isStr(p.note)) problems.push(`picks[${i}].note: a string`);
    for (const k of Object.keys(p)) if (!['viewpoint', 'note'].includes(k)) problems.push(`picks[${i}]: unknown key "${k}"`);
    return { viewpoint: p.viewpoint, note: p.note || null };
  });
  for (const k of Object.keys(doc)) if (!['schema_version', 'id', 'name', 'when', 'picks'].includes(k)) problems.push(`unknown key "${k}"`);
  return { value: problems.length ? null : { id: doc.id, name: doc.name, when: doc.when, picks }, problems };
}

// A lens with its picks looked up in the pools. A pick that resolves to nothing, or to a viewpoint
// whose own kinds say "no" for this lens, is a problem: the lens claims a rule its source disowns.
export function resolveLens(lens, pools = []) {
  const problems = []; const all = new Map();
  for (const pool of pools) for (const v of pool?.viewpoints || []) all.set(v.id, { ...v, school: pool.school });
  const viewpoints = lens.picks.map(p => {
    const v = all.get(p.viewpoint);
    if (!v) { problems.push(`${lens.id}: pick ${p.viewpoint} is in no pool`); return null; }
    if (v.kinds[lens.id] === 'no') problems.push(`${lens.id}: pick ${p.viewpoint} says no to ${lens.id} (${v.kindsWhy || 'no reason given'})`);
    return { ...v, note: p.note };
  }).filter(Boolean);
  return { value: problems.length ? null : { ...lens, viewpoints }, problems };
}

// The project's word on lenses: .uxcli/lenses.json. Every shipped lens is on unless named here.
export function parseLensesFile(doc) {
  const problems = [];
  if (doc === null || doc === undefined) return { value: { off: [], by: null, why: null }, problems };
  if (!isObj(doc)) return { value: null, problems: ['not an object'] };
  if (doc.schema_version !== 1) problems.push('schema_version must be 1');
  if (!strs(doc.off || [])) problems.push('off: a list of lens ids');
  else for (const id of doc.off || []) if (!KINDS.includes(id)) problems.push(`off: "${id}" is not a lens (${KINDS.join(', ')})`);
  if ((doc.off || []).length && !(isObj(doc.by) && isStr(doc.by.type) && isStr(doc.by.ref))) problems.push('by{type, ref}: turning a lens off is a decision, and a decision has a name on it');
  for (const k of Object.keys(doc)) if (!['schema_version', 'off', 'by', 'why', 'when'].includes(k)) problems.push(`unknown key "${k}"`);
  return { value: problems.length ? null : { off: doc.off || [], by: doc.by || null, why: doc.why || null }, problems };
}

// A review: every viewpoint of one lens answered for one target. Incomplete is refused — a checklist
// with holes is not a review, it is a claim to have looked. `hash` is the drawing's hash when the
// target is a mockup variant; a review that predates the drawing is stale, like a pick.
export function parseReview(doc, lens, { hash = null } = {}) {
  const problems = [];
  if (!isObj(doc)) return { value: null, problems: ['not an object'] };
  if (doc.schema_version !== 1) problems.push('schema_version must be 1');
  if (!isStr(doc.lens)) problems.push('lens: which lens was read');
  else if (lens && doc.lens !== lens.id) problems.push(`lens "${doc.lens}" is not ${lens.id}`);
  const t = doc.target;
  if (!isObj(t) || !['mockup', 'screen'].includes(t.kind)) problems.push('target: { kind: mockup|screen, … }');
  else if (t.kind === 'mockup') {
    if (!isStr(t.state) || !isStr(t.variant)) problems.push('target: a mockup names state and variant');
    if (!isStr(t.sha256) || !/^[0-9a-f]{64}$/.test(t.sha256)) problems.push('target.sha256: the hash of the drawing reviewed (uxcli mockups prints it)');
    else if (hash && hash !== t.sha256) problems.push(`review predates the drawing: ${t.variant}.html changed since it was reviewed (now ${hash.slice(0, 12)}…); look again, then update target.sha256`);
  } else if (!isStr(t.url)) problems.push('target: a screen names its url');
  const answers = isObj(doc.answers) ? doc.answers : null;
  if (!answers) problems.push('answers: one entry per viewpoint of the lens');
  const want = lens ? lens.viewpoints.map(v => v.id) : Object.keys(answers || {});
  const out = {};
  if (answers) {
    const missing = want.filter(id => !(id in answers));
    if (missing.length) problems.push(`${missing.length} of ${want.length} viewpoints unanswered: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? ', …' : ''}`);
    for (const [id, a] of Object.entries(answers)) {
      if (!want.includes(id)) { problems.push(`answers["${id}"] is not in the ${doc.lens} lens`); continue; }
      if (!isObj(a) || !ANSWERS.includes(a.verdict)) { problems.push(`answers["${id}"].verdict: one of ${ANSWERS.join(', ')}`); continue; }
      if (a.verdict !== 'n/a' && !isStr(a.where)) problems.push(`answers["${id}"]: "${a.verdict}" says where — the element, the region, the number seen`);
      if (a.verdict === 'n/a' && !isStr(a.note)) problems.push(`answers["${id}"]: n/a says why in note`);
      for (const k of Object.keys(a)) if (!['verdict', 'where', 'note'].includes(k)) problems.push(`answers["${id}"]: unknown key "${k}"`);
      out[id] = { verdict: a.verdict, where: a.where || null, note: a.note || null };
    }
  }
  const by = doc.by;
  if (!isObj(by) || !isStr(by.type) || !isStr(by.ref)) problems.push('by{type, ref}: who read the lens');
  else if (by.type === 'agent' && !isStr(by.onBehalfOf)) problems.push('by.onBehalfOf: an agent reviews on a person\'s say-so, and the entry names them');
  if (!isStr(doc.when)) problems.push('when: required');
  for (const k of Object.keys(doc)) if (!['schema_version', 'lens', 'target', 'answers', 'by', 'when', 'note'].includes(k)) problems.push(`unknown key "${k}"`);
  return { value: problems.length ? null : { lens: doc.lens, target: t, answers: out, by, when: doc.when, note: doc.note || null }, problems };
}

export const reviewSummary = review => {
  const vs = Object.entries(review.answers);
  const n = k => vs.filter(([, a]) => a.verdict === k).length;
  return { total: vs.length, holds: n('holds'), breaks: n('breaks'), na: n('n/a'), breaksList: vs.filter(([, a]) => a.verdict === 'breaks').map(([id, a]) => ({ id, where: a.where, note: a.note })) };
};
export const summaryLine = s => `${s.holds} of ${s.total} hold · ${s.breaks} break${s.na ? ` · ${s.na} n/a` : ''}`;

// An empty review for a lens: every viewpoint present, nothing answered, so the agent fills a form
// rather than inventing keys.
export const reviewTemplate = (lens, target, by) => ({
  schema_version: 1, lens: lens.id, target,
  answers: Object.fromEntries(lens.viewpoints.map(v => [v.id, { verdict: '', where: '', note: '' }])),
  by, when: new Date().toISOString().slice(0, 10),
});

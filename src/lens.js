// Lenses on disk: the shipped library (lenses/viewpoints/*.json, lenses/<kind>.json), the project's
// word on them (.uxcli/lenses.json), and reviews (a lens read against a mockup variant or a screen).
// The model is pure (src/core/model/lens.js); this file reads files and, for `review check`, runs the
// probes a viewpoint names so an answer of "holds" cannot stand where the instrument counted a break.
import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
import { KINDS, parseViewpoints, parseLens, resolveLens, parseLensesFile, parseReview, reviewSummary, summaryLine, reviewTemplate } from './core/model/lens.js';
import { drawingHash, sharedRefs } from './core/mockups.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const LIB = path.join(ROOT, 'lenses');
const readJson = f => JSON.parse(fs.readFileSync(f, 'utf8'));

export function library() {
  const problems = [];
  const pools = fs.readdirSync(path.join(LIB, 'viewpoints')).filter(f => f.endsWith('.json')).sort().map(f => { const r = parseViewpoints(readJson(path.join(LIB, 'viewpoints', f))); problems.push(...r.problems.map(p => `viewpoints/${f}: ${p}`)); return r.value; }).filter(Boolean);
  const lenses = KINDS.filter(k => fs.existsSync(path.join(LIB, `${k}.json`))).map(k => {
    const p = parseLens(readJson(path.join(LIB, `${k}.json`))); problems.push(...p.problems.map(x => `${k}.json: ${x}`)); if (!p.value) return null;
    const r = resolveLens(p.value, pools); problems.push(...r.problems); return r.value;
  }).filter(Boolean);
  return { pools, lenses, problems };
}

// Every shipped lens is on unless .uxcli/lenses.json names it in off.
export function projectLenses(root) {
  const f = root ? path.join(root, '.uxcli', 'lenses.json') : null;
  const r = parseLensesFile(f && fs.existsSync(f) ? readJson(f) : null);
  return { off: r.value?.off || [], by: r.value?.by || null, why: r.value?.why || null, problems: r.problems.map(p => `lenses.json: ${p}`) };
}

export function lensListCard(lib, proj) {
  const L = ['uxcli lens · the shipped lenses, by the kind of UI they are read against', ''];
  for (const l of lib.lenses) {
    const schools = [...new Set(l.viewpoints.map(v => v.school))];
    const probes = l.viewpoints.filter(v => v.measure?.probe).length;
    L.push(`  ${(proj.off.includes(l.id) ? 'off' : 'on').padEnd(4)} ${l.id.padEnd(12)} ${String(l.viewpoints.length).padStart(3)} viewpoints · ${schools.join(', ')}${probes ? ` · ${probes} counted by a probe` : ''}`);
    L.push(`       ${''.padEnd(12)} ${l.when}`);
  }
  if (proj.off.length) L.push('', `  off by ${proj.by.type} ${proj.by.ref}${proj.why ? ': ' + proj.why : ''}`);
  for (const p of [...lib.problems, ...proj.problems]) L.push(`  problem ${p}`);
  L.push('', '  uxcli lens show <kind>          the checklist, one viewpoint per line, with its author and page',
    '  uxcli review <state>/<variant> --lens=<kind> --write    an empty review beside the drawing, to fill in',
    '  uxcli review check              every review complete, fresh, and not contradicted by a probe');
  return L.join('\n');
}

export function lensShowCard(l, proj) {
  const L = [`uxcli lens show ${l.id} · ${l.name}${proj.off.includes(l.id) ? ' · OFF in this project' : ''}`, `  ${l.when}`, '',
    '  Viewpoints are named designers\' rules, not uxcli\'s. Answer each for the screen: holds, breaks (say where), or n/a (say why).', ''];
  l.viewpoints.forEach((v, i) => {
    L.push(`  ${String(i + 1).padStart(2)}. ${v.id}`);
    L.push(`      ${v.claim}`);
    L.push(`      ${v.source.author} · ${v.source.work} · ${v.source.url}${v.evidence === 'study' ? ' · study' : v.evidence === 'folklore' ? ' · folklore' : ''}`);
    L.push(`      look at: ${v.measure.what}${v.measure.probe ? `  [counted by ${v.measure.probe}]` : ''}`);
    if (v.note) L.push(`      here: ${v.note}`);
    if (v.exceptions.length) L.push(`      unless: ${v.exceptions.join('; ')}`);
  });
  return L.join('\n');
}

// Where a review lives: beside the drawing for a mockup, under .uxcli/reviews/ for a screen.
export const reviewPath = (root, target, lens) => target.kind === 'mockup'
  ? path.join(root, '.uxcli', 'mockups', target.state, `${target.variant}.${lens}.review.json`)
  : path.join(root, '.uxcli', 'reviews', `${target.name}.${lens}.review.json`);

const hashOf = (root, state, variant) => {
  const dir = path.join(root, '.uxcli', 'mockups'); const f = path.join(dir, state, `${variant}.html`);
  if (!fs.existsSync(f)) return null;
  const html = fs.readFileSync(f); const shared = path.join(dir, '_shared');
  return drawingHash([html, ...sharedRefs(html.toString()).filter(x => fs.existsSync(path.join(shared, x))).map(x => fs.readFileSync(path.join(shared, x)))]);
};

export function listReviews(root) {
  const out = []; const m = path.join(root, '.uxcli', 'mockups'); const r = path.join(root, '.uxcli', 'reviews');
  if (fs.existsSync(m)) for (const s of fs.readdirSync(m, { withFileTypes: true }).filter(d => d.isDirectory())) for (const f of fs.readdirSync(path.join(m, s.name)).filter(f => f.endsWith('.review.json'))) out.push(path.join(m, s.name, f));
  if (fs.existsSync(r)) for (const f of fs.readdirSync(r).filter(f => f.endsWith('.review.json'))) out.push(path.join(r, f));
  return out.sort();
}

// A review read against its lens and its drawing. Problems here are the form's, not the probes'.
export function readReview(root, file, lib) {
  let doc; try { doc = readJson(file); } catch (e) { return { file, value: null, problems: [`not JSON: ${e.message}`] }; }
  const lens = lib.lenses.find(l => l.id === doc?.lens) || null;
  if (!lens) return { file, value: null, problems: [`lens "${doc?.lens}" is not a shipped lens (${lib.lenses.map(l => l.id).join(', ')})`] };
  const t = doc.target || {};
  const hash = t.kind === 'mockup' ? hashOf(root, t.state, t.variant) : null;
  const problems = [];
  if (t.kind === 'mockup' && !hash) problems.push(`target ${t.state}/${t.variant}.html is not on disk`);
  const r = parseReview(doc, lens, { hash });
  return { file, lens, value: r.value, problems: [...problems, ...r.problems] };
}

// The probes a lens names, run once per target, and every "holds" they contradict. A probe that
// could not measure contradicts nothing; it is reported as what it is.
export async function contradictions(root, reviews, lib) {
  const out = new Map(); const want = reviews.filter(r => r.value && r.lens.viewpoints.some(v => v.measure?.probe && r.value.answers[v.id]?.verdict === 'holds'));
  if (!want.length) return out;
  const { runPage } = await import('./page.js'); const { launch } = await import('./browser.js');
  const browser = await launch();
  try {
    for (const r of want) {
      const t = r.value.target;
      const url = t.kind === 'mockup' ? pathToFileURL(path.join(root, '.uxcli', 'mockups', t.state, `${t.variant}.html`)).href : t.url;
      const vps = r.lens.viewpoints.filter(v => v.measure?.probe && r.value.answers[v.id]?.verdict === 'holds');
      const ids = [...new Set(vps.map(v => v.measure.probe))];
      const res = await runPage(url, { browser, only: ids });
      const list = [];
      for (const v of vps) {
        const p = res.probes.find(x => x.probe === v.measure.probe);
        if (p && (p.verdict === 'fail' || p.verdict === 'finding')) list.push({ viewpoint: v.id, probe: p.probe, why: p.why, what: p.cite?.what || null });
        else if (p && p.verdict === 'unmeasurable') list.push({ viewpoint: v.id, probe: p.probe, why: `could not measure: ${p.why}`, unmeasurable: true });
      }
      out.set(r.file, list);
    }
  } finally { await browser.close(); }
  return out;
}

export async function reviewCheck(root) {
  const lib = library(); const proj = projectLenses(root);
  const reviews = listReviews(root).map(f => readReview(root, f, lib));
  const against = await contradictions(root, reviews, lib);
  const rows = reviews.map(r => {
    const c = (against.get(r.file) || []);
    const hard = c.filter(x => !x.unmeasurable);
    const off = r.value && proj.off.includes(r.value.lens) ? [`lens ${r.value.lens} is off in this project`] : [];
    return { file: path.relative(root, r.file), lens: r.value?.lens || null, summary: r.value ? reviewSummary(r.value) : null, problems: [...r.problems, ...off, ...hard.map(x => `answers["${x.viewpoint}"] says holds; ${x.probe} counted ${x.what || x.why}`)], notes: c.filter(x => x.unmeasurable).map(x => `${x.viewpoint}: ${x.probe} ${x.why}`) };
  });
  return { root, rows, problems: [...lib.problems, ...proj.problems], ok: !lib.problems.length && !proj.problems.length && rows.every(r => !r.problems.length) };
}

export function reviewCheckCard(r) {
  const L = [`uxcli review check · ${r.root}`, ''];
  if (!r.rows.length) L.push('  no review on disk: uxcli review <state>/<variant> --lens=<kind> --write, fill every answer, then check again');
  for (const x of r.rows) {
    L.push(`  ${(x.problems.length ? 'REFUSED' : 'ok').padEnd(8)} ${x.file}${x.summary ? `  ${x.lens} · ${summaryLine(x.summary)}` : ''}`);
    for (const p of x.problems) L.push(`  ${''.padEnd(8)} ${p}`);
    for (const n of x.notes) L.push(`  ${''.padEnd(8)} note: ${n}`);
    for (const b of x.summary?.breaksList || []) if (!x.problems.length) L.push(`  ${''.padEnd(8)} breaks ${b.id}: ${b.where}${b.note ? ' — ' + b.note : ''}`);
  }
  for (const p of r.problems) L.push(`  problem ${p}`);
  L.push('', r.ok ? `  ${r.rows.length} review${r.rows.length === 1 ? '' : 's'} complete and not contradicted by a probe. A review is the reviewer's claim, not a verdict.` : '  fix what is REFUSED and check again; never change an answer to "holds" to make a probe agree — fix the drawing');
  return L.join('\n');
}

export { reviewTemplate, KINDS };
export const mockupHash = hashOf;

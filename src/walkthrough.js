// Walkthroughs on disk: .uxcli/walkthroughs/<journey>/<run>[.<actor>].json, one per walk and persona,
// written empty by `uxcli walkthrough <journey> --write` and answered by whoever looks at the screenshots.
// `walkthrough check` refuses an incomplete one and one the walk contradicts.
import fs from 'node:fs'; import path from 'node:path';
import { walkthroughTemplate, parseWalkthrough, contradictions, walkthroughFindings, QUESTIONS, METHOD } from './core/model/walkthrough.js';
import { experience, journeyName } from './core/experience.js';
import { allRuns, UXCLI } from './adapters/store/runs.js';
import { loadProject } from './journey.js';

const readJson = f => JSON.parse(fs.readFileSync(f, 'utf8'));
export const walkthroughDir = root => path.join(root, UXCLI, 'walkthroughs');
const actorsOf = root => { try { return (loadProject(root).actors || []).map(a => a.value?.actor).filter(Boolean); } catch { return []; } };

export function writeWalkthrough(root, journey, { as = null, by, run = null, at = new Date().toISOString() } = {}) {
  const walks = allRuns(root).filter(x => journeyName(x.run) === journey && (x.run.steps || []).some(s => s.kind !== 'fixture'));
  const hit = run ? walks.find(x => path.basename(x.at) === path.basename(run)) : walks[0];
  if (!hit) return { problems: [run ? `no walk ${run} of ${journey}` : `no walk of ${journey} with steps — uxcli run .uxcli/journeys/${journey}.json first`] };
  if (as && !actorsOf(root).includes(as)) return { problems: [`--as=${as} is not an actor under .uxcli/understanding/actors/`] };
  const name = `${path.basename(hit.at)}${as ? `.${as}` : ''}.json`;
  const file = path.join(walkthroughDir(root), journey, name);
  if (fs.existsSync(file)) return { problems: [`${path.relative(root, file)} exists; answer it, or delete it to start again`] };
  const doc = walkthroughTemplate({ journey, run: `runs/${path.basename(hit.at)}`, steps: hit.run.steps, as, by, at });
  fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(doc, null, 1) + '\n');
  return { file, doc, runDir: hit.at };
}

// Every walkthrough on disk, checked against its walk.
export function checkWalkthroughs(root) {
  const base = walkthroughDir(root); const out = []; const actors = actorsOf(root);
  if (!fs.existsSync(base)) return { ok: true, items: out };
  for (const j of fs.readdirSync(base).sort()) {
    const dir = path.join(base, j); if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.json')).sort()) {
      const file = path.join(dir, f); let doc; try { doc = readJson(file); } catch (e) { out.push({ file, problems: [`not JSON: ${e.message}`], findings: [] }); continue; }
      const runFile = path.join(root, UXCLI, String(doc.run || ''), 'run.json');
      if (!fs.existsSync(runFile)) { out.push({ file, problems: [`run ${doc.run} is no longer on disk — name it as a version to keep it (uxcli version save)`], findings: [] }); continue; }
      const run = readJson(runFile);
      const r = parseWalkthrough(doc, { steps: run.steps || [], actors });
      const against = r.value ? contradictions(doc, experience(run)) : [];
      out.push({ file, as: doc.as || null, problems: [...r.problems, ...against], findings: r.value ? walkthroughFindings(doc) : [] });
    }
  }
  return { ok: out.every(x => !x.problems.length), items: out };
}

export function walkthroughCard(r, root) {
  const L = ['uxcli walkthrough check · the four questions at every step, against the walk', ''];
  if (!r.items.length) L.push('  none yet — uxcli walkthrough <journey> [--as=<actor>] --write, then answer it looking at each step\'s screenshot');
  for (const x of r.items) {
    L.push(`  ${(x.problems.length ? 'REFUSED' : 'ok').padEnd(8)} ${path.relative(root, x.file)}${x.as ? ` · as ${x.as}` : ''}`);
    for (const p of x.problems) L.push(`           ${p}`);
    for (const f of x.findings) L.push(`           finding  ${f.workflow ? f.workflow + '/' : ''}${f.step} ${f.question}: ${f.answer} — ${f.what.split(' — ').slice(1).join(' — ')}`);
  }
  L.push('', `  Method: ${METHOD}. Every answer is the reviewer's claim; "no" and "unsure" are findings, never a fail.`);
  return L.join('\n');
}

export function writtenCard(r, root) {
  const steps = Object.entries(r.doc.steps);
  const L = [`wrote ${path.relative(root, r.file)} · ${steps.length} step${steps.length === 1 ? '' : 's'} × 4 questions${r.doc.as ? ` · as ${r.doc.as}` : ''}`, ''];
  for (const [k, st] of steps) L.push(`  ${k}  ${st.action}${st.shot ? `\n        look at ${path.relative(root, path.join(r.runDir, 'artifacts', st.shot))}` : ''}`);
  L.push('', '  At each step answer, looking at the screenshot, yes / no / unsure with why (and where, for no or unsure):');
  for (const [k, q] of Object.entries(QUESTIONS)) L.push(`    ${k.padEnd(9)} ${q}`);
  L.push('', '  then: uxcli walkthrough check');
  return L.join('\n');
}

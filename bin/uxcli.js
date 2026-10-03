#!/usr/bin/env node
// uxcli — the place, the rules and the instrument a coding agent works with before and after it touches an interface. No commitment, no verdict.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
import { exitFor } from '../src/core/verdict/rank.js';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [cmd, ...rest] = process.argv.slice(2);
const flags = new Set(rest.filter(a => a.startsWith('--') && !a.includes('='))); const args = rest.filter(a => !a.startsWith('--'));
const opt = k => (rest.find(a => a.startsWith('--' + k + '=')) || '').split('=').slice(1).join('=') || null;
const vars = Object.fromEntries(rest.filter(a => a.startsWith('--var=')).map(a => a.slice(6).split('=')).map(([k, ...v]) => [k, v.join('=')]));
const usage = `usage:
  uxcli run <.uxcli/journeys/x.json> [--env=NAME] [--origin=URL] [--viewport=WxH] [--json] [--out=DIR]
      a schema-2 journey: states as predicates, run in Chrome against the environment's origin (default: the first non-production one);
      identity and fixtures come from the project's provisioner under its policy; run.json + shots under .uxcli/runs/<id>/, index.json recomputed
  uxcli run <journey.json> [--json] [--out=DIR] [--refute] [--var=k=v ...]
      measure one flow; card by default, --json for the evidence packet; run.json and screenshots for fails in DIR (default .uxcli/<journey>);
      --var substitutes {{k}} in the journey; --refute spawns a fresh second reader per fail (UXCLI_REFUTER, default: claude -p, haiku, Read only) to confirm or dispute it from the images alone; the command, count and cost are printed on stderr before it runs, and on the card
  uxcli run <url> [--json] [--out=DIR] [--refute] [--state=FILE] [--src=DIR] [--prove]
      measure one screen: focus-visible (2.4.7), text-spacing (1.4.12), contrast (1.4.3, axe-core), text-overlap (opinion: text painted over text); --state is a Playwright storageState file for signed-in pages; --src is the project's source tree, used to name the design token behind a colour; --prove plants each passing probe's own defect on the page and re-measures, so every pass carries "would fail on …" or a warning that it could not be made to fail
  uxcli sheet [--src=DIR] [--json]    the project's own commitments on its design tokens (uxcli.commitments.json in DIR, default .); provenance project; exit 2 on a broken commitment
  uxcli diff <a.json> <b.json> [--gate] [--json]
      drift between two saved runs (run --json, sheet --json): same / regressed / improved / new / gone per probe or commitment; with --gate exit 2 when b carries a fail
  uxcli discover <repo-dir|url> [--out=DIR] [--json]
      journey candidates as proposals: routes and forms from a Next.js source tree, or forms from a same-origin crawl; written to DIR (default uxcli-proposals/); run refuses a journey whose provenance is proposal until a human sets confirmedBy
  uxcli context show [journey] [--src=DIR] [--json]
      what to read before designing a screen: the actor's unknowns first, then who they are, each insight at the confidence its evidence allows,
      the states the journey says the screen must hold and the hooks each needs, the commitments signed over it, and the last run; from .uxcli/, nothing written
  uxcli migrate [dir] [--apply] [--json]
      move dir/.uxcli/ to the layout this uxcli reads: one directory per run (runs/R-<when>-<six>/, pictures under artifacts/), understanding split into
      actors/ and insights/, trace and anchor paths rewritten, schema_version on every authored file; prints the plan, --apply writes it
  uxcli mockups [dir] [--viewport=WxH[,WxH…]] [--json]
      the screens the journeys name, each variant the agent drew under .uxcli/mockups/<state>/<variant>.html photographed at the viewport (default 390x844;
      further viewports, comma-separated, are photographed beside it), pinned notes (data-uxcli-note) numbered on the frame, hooks outlined on demand, a viewer and a compare per variant, each lane and journey playable as a prototype,
      the picked variants drawn as each journey's flow, every variant beside its siblings with the status pick.json gives it; writes .uxcli/mockups/index.html
  uxcli map [dir] [--viewport=WxH] [--json]
      the journey map: for every journey, MODEL (the picked mockups), RUN (the last run's screenshots, each state held or not), DIFF (declared beside observed)
      and IMPACT (what the commitments decided), step by step, with the run's signals, the verdicts, the insight it traces to and the declared intent;
      writes .uxcli/map/index.html and photographs the mockups first when their pictures are missing
  uxcli doctor [dir] [--json]         is the instrument here: node, Chromium, project root, policy, level, skill — and the one command that fixes each
  uxcli demo <empty dir>              a real product with a planted defect, served and measured end to end: the first fail card in under a minute
  uxcli guide "<what you are about to do>"   which command and which file, for a situation; the whole list when nothing matches
  uxcli init [dir] [--apply] [--origin=URL] [--json]
      what uxcli would put in dir, and where dir stands in the sequence (commitments signed, journeys confirmed, runs recorded) — measured from disk, printed, and nothing written;
      --apply creates the shipped skill in dir/.claude/skills/uxcli/, dir/.claude/rules/uxcli.md (read at the start of every session), and dir/.uxcli/. It only ever creates: nothing is edited, overwritten or appended to
  uxcli gate                          run every probe's falsification pair; exit 1 unless all hold
  uxcli lens [show <kind>]            the shipped lenses — named designers' viewpoints by kind of UI (marketing, content, data, workspace, shop, transaction)
  uxcli experience [dir|run] [--page] [--json]   what the person goes through on each journey's last walk: steps, clicks, typing, scrolls, waits, a keystroke-level estimate, and what changed since the walk before; findings only, never a fail
  uxcli studio [dir] [--serve [--port=N]] [--shot=FILE] [--json]   the board: every journey as a canvas — each step drawn (variants, the pick), built (the last walk, findings pinned) and in each named version; pan, zoom, inspect; --serve on localhost refreshes as files change and lets a person pick or ask for a redraw
  uxcli version [save <journey> <name> [--note=…] [--run=DIR] [--proposal=proposals/P-x.json]]   name a walk of a journey so it is kept and can be compared: uxcli experience --journey=<id> --from=<name> --to=<name> [--page]
  uxcli template [show <id> | apply <id> [dir]]   where to start for a kind of product (workspace, shop, landing): screens and their lens, journeys to walk, what to research; apply writes the actor questions as unknowns, creating only
  uxcli review <state>/<variant> --lens=<kind> --write   an empty review beside the drawing; a URL with --name=<n> reviews a screen
  uxcli review check                  every review complete, fresh against its drawing, and not contradicted by a probe
  uxcli why <rule>                    print a probe's definition (e.g. why 3.3.7, why redundant-entry, why 2.4.7, why text-overlap)
exit: 0 no fail (findings included) · 2 at least one fail · 1 the run could not be carried out
browser: playwright-core; set UXCLI_CHROME to a Chromium binary if none is installed for playwright.`;
const isUrl = s => /^https?:\/\//i.test(s) || /\.html?$/i.test(s) || s.startsWith('file:');
// Every run leaves run.json beside its artifacts/: the packet to attach when disputing a verdict.
// One directory per run, made once (`runs/R-<when>-<six>/`), pictures under artifacts/. With --out
// the caller owns the directory and the same shape is made inside it.
const prepare = async (out, ranAt) => {
  const { newRunDir, artifactsDir } = await import('../src/adapters/store/runs.js');
  const dir = out ? path.resolve(out) : newRunDir(process.cwd(), ranAt);
  fs.mkdirSync(artifactsDir(dir), { recursive: true });
  return { dir, shots: artifactsDir(dir) };
};

const saveRun = (result, outDir) => { fs.mkdirSync(outDir, { recursive: true }); result.uxcli = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version; result.outDir = outDir; const shots = path.join(outDir, 'artifacts'); result.screenshots = fs.existsSync(shots) ? fs.readdirSync(shots).filter(f => /\.(png|jpe?g)$/i.test(f)).length : 0; fs.writeFileSync(path.join(outDir, 'run.json'), JSON.stringify(result, null, 1) + '\n'); };
try {
  if (cmd === 'run' && args[0] && isUrl(args[0])) {
    const { runPage } = await import('../src/page.js'); const { card } = await import('../src/card.js');
    const url = /^(https?|file):/i.test(args[0]) ? args[0] : pathToFileURL(path.resolve(args[0])).href;
    // Keyed by the target, not by its host. Seven screens of one host used to share one directory
    // and overwrite each other, packet and index row together; same target now means same directory,
    // which is what the index always assumed.
    const { dir: outDir, shots } = await prepare(opt('out'), new Date().toISOString());
    if (process.stderr.isTTY) process.stderr.write(`opening ${url} · chromium 1280×800 · focus-visible, text-spacing, contrast, text-overlap, nesting${flags.has('--prove') ? ' · --prove: one planted defect per pass' : ''}\n`);
    const result = await runPage(url, { state: opt('state'), outDir: shots, src: opt('src'), prove: flags.has('--prove') });
    if (flags.has('--refute')) { const { refuteAll } = await import('../src/refute.js'); refuteAll(result.probes); }
    result.exit = exitFor({ verdicts: result.probes.map(p => p.verdict), couldNotRun: !!result.error });
    saveRun(result, outDir);
    console.log(flags.has('--json') ? JSON.stringify(result, null, 1) : card(result));
    process.exit(result.exit);
  } else if (cmd === 'run' && args[0] && (await import('../src/journey.js')).isSchema2(JSON.parse(fs.readFileSync(path.resolve(args[0]), 'utf8')))) {
    const { runJourney } = await import('../src/journey.js'); const { journeyCard, why } = await import('../src/core/report/index.js');
    const r = await runJourney(path.resolve(args[0]), { env: opt('env'), origin: opt('origin'), viewport: opt('viewport') || undefined, out: opt('out') });
    if (r.problems) { console.error('uxcli: the declarations do not parse —\n  ' + r.problems.join('\n  ')); process.exit(1); }
    if (flags.has('--json')) console.log(JSON.stringify({ ...r.run, next: r.run.verdicts.filter(v => v.value !== 'pass').map(v => why(v, r.commitments)) }, null, 1));
    else { console.log(journeyCard(r.run, r.commitments)); const acts = r.run.verdicts.filter(v => v.value === 'fail' || v.value === 'finding').map(v => '  next   ' + why(v, r.commitments)); if (acts.length) console.log('\n' + acts.join('\n')); console.log('  packet ' + path.relative(process.cwd(), path.join(r.dir, 'run.json'))); }
    process.exit(r.run.exit);
  } else if (cmd === 'run' && args[0]) {
    const { readFlow } = await import('../src/adapters/store/flow-file.js'); const { runJourney } = await import('../src/run.js'); const { card } = await import('../src/card.js');
    const flow = readFlow(path.resolve(args[0]), vars);
    const { dir: outDir, shots } = await prepare(opt('out'), new Date().toISOString());
    const result = await runJourney(flow, { outDir: shots });
    if (flags.has('--refute')) { const { refuteAll } = await import('../src/refute.js'); refuteAll(result.probes); }
    const couldNotRun = result.steps.some(s => s.error) || result.steps.length < result.stepCount;
    result.exit = exitFor({ verdicts: result.probes.map(p => p.verdict), couldNotRun });
    saveRun(result, outDir);
    console.log(flags.has('--json') ? JSON.stringify(result, null, 1) : card(result));
    process.exit(result.exit);
  } else if (cmd === 'sheet') {
    const { findCommitments, evaluate, sheetCard, FILE } = await import('../src/sheet.js'); const root = path.resolve(opt('src') || '.');
    const file = findCommitments(root); if (!file) { console.log(`no ${FILE} under ${root}: nothing committed, nothing to say`); process.exit(0); }
    // A flow commitment is decided by a run, so one can be handed in. Without it those entries come
    // back `unmeasurable` naming the missing input, rather than looking like bad commitments.
    const runDir = opt('run');
    const run = runDir ? (await import('../src/propose.js')).runAt(path.resolve(runDir)).run : null;
    const s = evaluate(file, root, { run }); console.log(flags.has('--json') ? JSON.stringify(s, null, 1) : sheetCard(s));
    process.exit(s.results.some(r => r.verdict === 'fail') ? 2 : 0);
  } else if (cmd === 'propose' && args[0]) {
    const { propose, proposeCard } = await import('../src/propose.js');
    const out = propose({ root: path.resolve(opt('src') || '.'), at: path.resolve(args[0]),
      write: flags.has('--write'), as: opt('as') || null });
    console.log(flags.has('--json') ? JSON.stringify(out, null, 1) : proposeCard(out));
    process.exit(0);
  } else if (cmd === 'coverage' && args[0]) {
    const { coverageOf, coverageCard } = await import('../src/propose.js');
    const out = coverageOf({ root: path.resolve(opt('src') || '.'), at: path.resolve(args[0]) });
    console.log(flags.has('--json') ? JSON.stringify(out, null, 1) : coverageCard(out));
    process.exit(0);
  } else if (cmd === 'authority') {
    // What a subject may do here, and what it may not. Without this the registry is a file nobody
    // can read back, and "you are not authorized" is a message with nowhere to go.
    const { authorityCard } = await import('../src/authority.js');
    console.log(authorityCard(path.resolve(opt('src') || '.'), args[0] || null));
    process.exit(0);
  } else if (cmd === 'map') {
    const { map, mapCard } = await import('../src/map.js'); const r = await map(args[0] || '.', { viewport: opt('viewport') || '390x844' });
    console.log(flags.has('--json') ? JSON.stringify(r, null, 1) : mapCard(r));
    process.exit(0);
  } else if (cmd === 'mockups') {
    const { mockups, mockupsCard } = await import('../src/mockups.js'); const r = await mockups(args[0] || '.', { viewport: opt('viewport') || '390x844' });
    console.log(flags.has('--json') ? JSON.stringify(r, null, 1) : mockupsCard(r));
    process.exit(r.exit);
  } else if (cmd === 'lens') {
    // The shipped lenses: named designers' viewpoints, grouped by the kind of UI they are read against.
    const L = await import('../src/lens.js'); const J = await import('../src/journey.js');
    const root = J.findRoot(path.resolve(opt('src') || '.')); const lib = L.library(); const proj = L.projectLenses(root);
    if (args[0] === 'show' && args[1]) {
      const l = lib.lenses.find(x => x.id === args[1]); if (!l) { console.error(`no lens ${args[1]}; have: ${lib.lenses.map(x => x.id).join(', ')}`); process.exit(1); }
      console.log(flags.has('--json') ? JSON.stringify(l, null, 1) : L.lensShowCard(l, proj));
    } else console.log(flags.has('--json') ? JSON.stringify({ lenses: lib.lenses.map(l => ({ id: l.id, name: l.name, when: l.when, viewpoints: l.viewpoints.length, on: !proj.off.includes(l.id) })), off: proj.off, problems: [...lib.problems, ...proj.problems] }, null, 1) : L.lensListCard(lib, proj));
    process.exit(lib.problems.length || proj.problems.length ? 1 : 0);
  } else if (cmd === 'experience') {
    // What the person goes through on each journey's last walk: steps, typing, scrolls, waits, an estimate in seconds.
    const E = await import('../src/experience.js'); let list;
    if (opt('from') && opt('to')) { if (!opt('journey')) { console.error('--from and --to compare two versions of one journey: add --journey=<id>'); process.exit(1); } const c = await E.versionComparison(args[0] || '.', opt('journey'), opt('from'), opt('to')); if (c.problems) { console.error('uxcli: ' + c.problems.join('\n  ')); process.exit(1); } list = [c.entry]; }
    else list = E.experiences(args[0] || '.');
    if (flags.has('--json')) console.log(JSON.stringify(list.map(x => ({ dir: x.dir, ...x.report, ...(x.change && { change: x.change }) })), null, 1));
    else console.log(E.experienceCard(list));
    if (flags.has('--page')) { const f = E.experiencePage(list, opt('out') || E.pageFile(args[0] && fs.existsSync(path.join(args[0], '.uxcli')) ? args[0] : '.')); console.log(`  page   ${path.relative(process.cwd(), f)}`); }
    process.exit(0);
  } else if (cmd === 'studio') {
    // The board: every journey as a canvas of steps — drawn, built, each named version — with findings pinned.
    const S = await import('../src/studio.js'); const vpt = opt('viewport') || '390x844';
    if (flags.has('--serve')) {
      const r = await S.serveStudio(args[0] || '.', { port: Number(opt('port') || 4317), viewport: vpt });
      if (!r.model) { console.error('uxcli: ' + (r.problems || []).join('\n  ')); process.exit(1); }
      console.log(S.studioCard(r.model, path.relative(process.cwd(), r.page)));
      console.log(`\n  serving ${r.url}  (localhost only; refreshes as files under .uxcli/ change; Ctrl+C to stop)`);
    } else {
      const r = await S.writeStudio(args[0] || '.', { viewport: vpt });
      if (!r.model) { console.error('uxcli: ' + (r.problems || []).join('\n  ')); process.exit(1); }
      if (opt('shot')) { await S.shootStudio(r.page, opt('shot')); }
      console.log(flags.has('--json') ? JSON.stringify(r.model, null, 1) : S.studioCard(r.model, path.relative(process.cwd(), r.page)) + (opt('shot') ? `\n  shot   ${opt('shot')}` : ''));
      process.exit(0);
    }
  } else if (cmd === 'version') {
    // Named walks of a journey: kept against pruning, compared with experience --from --to.
    const V = await import('../src/version.js'); const root = path.resolve(opt('src') || '.');
    if (args[0] === 'save' && args[1] && args[2]) {
      let by = { type: 'person', ref: 'unknown' };
      try { const { execFileSync } = await import('node:child_process'); const n = execFileSync('git', ['config', 'user.name'], { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); if (n) by = { type: 'person', ref: n }; } catch {}
      if (opt('as')) by = { type: 'agent', ref: `${opt('as')}${opt('for') ? ` for ${opt('for')}` : ''}` };
      const r = V.saveVersion(root, args[1], args[2], { run: opt('run'), note: opt('note'), by, proposal: opt('proposal') });
      if (r.problems) { console.error('uxcli: ' + r.problems.join('\n  ')); process.exit(1); }
      console.log(`wrote ${path.relative(process.cwd(), r.file)} · ${r.value.journey}/${r.value.name} is ${r.value.run}, kept against pruning`);
      process.exit(0);
    }
    console.log(flags.has('--json') ? JSON.stringify(V.versions(root), null, 1) : V.versionListCard(root));
    process.exit(V.versions(root).some(v => !v.value) ? 1 : 0);
  } else if (cmd === 'template') {
    // Where to start for a kind of product: screens and their lens, journeys to walk, what to research.
    const T = await import('../src/template.js'); const lib = T.templates();
    const pick = id => { const t = lib.list.find(x => x.id === id); if (!t) { console.error(`no template ${id}; have: ${lib.list.map(x => x.id).join(', ')}`); process.exit(1); } return t; };
    if (args[0] === 'show' && args[1]) { const t = pick(args[1]); console.log(flags.has('--json') ? JSON.stringify(t, null, 1) : T.templateShowCard(t)); }
    else if (args[0] === 'apply' && args[1]) { const t = pick(args[1]); const r = T.applyTemplate(args[2] || '.', t); console.log(flags.has('--json') ? JSON.stringify(r, null, 1) : T.applyCard(r, t)); }
    else console.log(flags.has('--json') ? JSON.stringify({ templates: lib.list.map(t => ({ id: t.id, name: t.name, when: t.when })), problems: lib.problems }, null, 1) : T.templateListCard(lib));
    process.exit(lib.problems.length ? 1 : 0);
  } else if (cmd === 'review' && args[0] === 'check') {
    const L = await import('../src/lens.js'); const J = await import('../src/journey.js');
    const root = J.findRoot(path.resolve(opt('src') || '.')); if (!root) { console.error('no .uxcli/policy/policy.json here or above'); process.exit(1); }
    const r = await L.reviewCheck(root); console.log(flags.has('--json') ? JSON.stringify(r, null, 1) : L.reviewCheckCard(r));
    process.exit(r.ok ? 0 : 1);
  } else if (cmd === 'review' && args[0]) {
    // An empty review for one lens: every viewpoint present, nothing answered. A mockup is <state>/<variant>; a screen is a URL with --name.
    const L = await import('../src/lens.js'); const J = await import('../src/journey.js');
    const root = J.findRoot(path.resolve(opt('src') || '.')); if (!root) { console.error('no .uxcli/policy/policy.json here or above'); process.exit(1); }
    const lib = L.library(); const kind = opt('lens'); const l = lib.lenses.find(x => x.id === kind);
    if (!l) { console.error(`--lens=<kind>, one of ${lib.lenses.map(x => x.id).join(', ')}`); process.exit(1); }
    let target;
    if (isUrl(args[0])) { if (!opt('name')) { console.error('a screen review needs --name=<file name under .uxcli/reviews/>'); process.exit(1); } target = { kind: 'screen', url: args[0], name: opt('name') }; }
    else { const [state, variant] = args[0].split('/'); const h = L.mockupHash(root, state, variant); if (!h) { console.error(`no drawing .uxcli/mockups/${state}/${variant}.html`); process.exit(1); } target = { kind: 'mockup', state, variant, sha256: h }; }
    const by = { type: 'agent', ref: opt('as') || 'agent', onBehalfOf: opt('for') || '<the person running you>' };
    const doc = L.reviewTemplate(l, target.kind === 'screen' ? { kind: 'screen', url: target.url } : target, by);
    const file = L.reviewPath(root, target, l.id);
    if (flags.has('--write')) { if (fs.existsSync(file)) { console.error(`${path.relative(process.cwd(), file)} exists; fill it, or delete it to start again`); process.exit(1); } fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(doc, null, 1) + '\n'); console.log(`wrote ${path.relative(process.cwd(), file)} · ${l.viewpoints.length} viewpoints to answer · then uxcli review check`); }
    else console.log(JSON.stringify(doc, null, 1));
    process.exit(0);
  } else if (cmd === 'doctor') {
    const { doctor, doctorCard } = await import('../src/doctor.js'); const r = await doctor(args[0] || '.');
    console.log(flags.has('--json') ? JSON.stringify(r, null, 1) : doctorCard(r));
    process.exit(r.ok ? 0 : 1);
  } else if (cmd === 'demo') {
    if (!args[0]) { console.error('uxcli demo <empty dir> — the directory the demo product and its .uxcli/ are copied into'); process.exit(1); }
    const { demo } = await import('../src/demo.js'); process.exit(await demo(args[0]));
  } else if (cmd === 'guide') {
    const { guide, guideCard } = await import('../src/recipes.js'); const g = guide(args.join(' '));
    console.log(flags.has('--json') ? JSON.stringify(g, null, 1) : guideCard(g));
    process.exit(0);
  } else if (cmd === 'migrate') {
    // Moves a project's .uxcli/ forward to the layout this uxcli reads. Prints the plan; --apply writes.
    const { migrate, migrateCard } = await import('../src/migrate.js');
    const r = migrate(path.resolve(args[0] || '.'), { apply: flags.has('--apply') });
    console.log(flags.has('--json') ? JSON.stringify(r, null, 1) : migrateCard(r));
    process.exit(r.problems.length ? 1 : 0);
  } else if (cmd === 'context' && args[0] === 'show') {
    // What the agent reads before it designs: assembled from the project's own declarations and the
    // projection, printed as a card. Nothing is written — not even index.json.
    const J = await import('../src/journey.js'); const root = J.findRoot(path.resolve(opt('src') || '.'));
    if (!root) { console.error('no .uxcli/policy/policy.json here or above — uxcli init --apply --origin=<url> first'); process.exit(1); }
    const { brief } = await import('../src/core/context/brief.js'); const { contextCard } = await import('../src/core/report/index.js');
    const P = J.loadProject(root); const idx = J.projectionOf(P);
    const want = args[1] ? args[1].replace(/^.*\//, '').replace(/\.json$/, '') : null;
    const b = brief({ actors: P.actors, insights: P.insights, journeys: P.journeys.map(j => j.value).filter(Boolean), commitments: P.commitments.map(c => c.value).filter(Boolean), index: idx, journeyId: want });
    b.problems.push(...P.problems);
    const LN = await import('../src/lens.js'); const lp = LN.projectLenses(root); b.lenses = { on: LN.KINDS.filter(k => !lp.off.includes(k)), off: lp.off };
    console.log(flags.has('--json') ? JSON.stringify(b, null, 1) : contextCard(b) + `\n\n  lenses   on: ${b.lenses.on.join(', ')}${b.lenses.off.length ? ` · off: ${b.lenses.off.join(', ')}` : ''}\n           pick the one for what the person does on this screen; uxcli lens show <kind> before you draw, uxcli review check before you say done`);
    process.exit(want && !b.journey ? 1 : 0);
  } else if (cmd === 'diff' && args[0] && args[1]) {
    const { diff, diffCard, gateExit } = await import('../src/diff.js'); const d = diff(path.resolve(args[0]), path.resolve(args[1]));
    console.log(flags.has('--json') ? JSON.stringify(d, null, 1) : diffCard(d)); process.exit(flags.has('--gate') ? gateExit(d) : 0);
  } else if (cmd === 'discover' && args[0]) {
    const { discoverRepo, discoverUrl, proposals, discoverCard } = await import('../src/discover.js');
    let d; if (/^https?:\/\//i.test(args[0])) { const { launch } = await import('../src/browser.js'); const browser = await launch(); try { d = await discoverUrl(args[0], { browser }); } finally { await browser.close(); } } else d = discoverRepo(path.resolve(args[0]));
    const props = proposals(d); const outDir = opt('out') || 'uxcli-proposals'; fs.mkdirSync(outDir, { recursive: true });
    props.forEach((j, i) => fs.writeFileSync(path.join(outDir, `${String(i + 1).padStart(2, '0')}-${j.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 50)}.json`), JSON.stringify(j, null, 1) + '\n'));
    console.log(flags.has('--json') ? JSON.stringify({ ...d, proposals: props }, null, 1) : discoverCard(d, props));
  } else if (cmd === 'init') {
    const J = await import('../src/journey.js'); const root = J.findRoot(path.resolve(args[0] || '.'));
    if (root) {
      const { initCard } = await import('../src/core/report/index.js'); const { firstStep, skillRefresh, skillRefreshLines } = await import('../src/init.js');
      const P = J.loadProject(root); const idx = J.writeProjection(P);
      const skill = skillRefresh(root, { apply: flags.has('--apply') });
      const out = { ...idx, next: firstStep(P, idx), skill, ...(P.problems.length && { problems: P.problems }) };
      console.log(flags.has('--json') ? JSON.stringify(out, null, 1) : initCard(out) + skillRefreshLines(skill, flags.has('--apply')).join('\n'));
      process.exit(0);
    }
    const { init, initCard } = await import('../src/init.js'); const r = init(path.resolve(args[0] || '.'), { apply: flags.has('--apply'), origin: opt('origin') || null }); console.log(flags.has('--json') ? JSON.stringify(r, null, 1) : initCard(r));
  } else if (cmd === 'gate') {
    const { gate } = await import('../src/gate.js'); process.exit((await gate()) ? 0 : 1);
  } else if (cmd === 'why' && args[0]) {
    const dirs = fs.readdirSync(path.join(ROOT, 'src/probes'), { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name);
    const hit = dirs.find(d => d === args[0] || d.endsWith('-' + args[0]) || fs.readFileSync(path.join(ROOT, 'src/probes', d, 'spec.md'), 'utf8').split('\n')[0].includes('WCAG ' + args[0]));
    if (!hit) { console.error('no probe for ' + args[0] + '; have: ' + dirs.join(', ')); process.exit(1); }
    console.log(fs.readFileSync(path.join(ROOT, 'src/probes', hit, 'spec.md'), 'utf8'));
  } else { console.log(usage); process.exit(cmd ? 1 : 0); }
} catch (e) { console.error('uxcli: ' + (e.message || e)); process.exit(1); }

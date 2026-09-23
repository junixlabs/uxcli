// uxcli gate: every probe's falsification pair must fail where it must and stay silent where it must, and the fixture hashes must match.
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import crypto from 'node:crypto'; import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFlow } from './adapters/store/flow-file.js'; import { runJourney, PROBES } from './run.js'; import { runPage, PAGE_PROBES } from './page.js'; import { launch } from './browser.js'; import { validate, VERDICTS } from './core/verdict/packet.js';
import { card } from './card.js';
import { saw } from './core/verdict/rank.js';
import { SUITES } from './suites.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
export function hashTree(dir) { const out = {}; for (const f of fs.readdirSync(dir).sort()) { const p = path.join(dir, f); if (fs.statSync(p).isFile()) out[f] = sha(p); } return out; }
const probeDir = probe => path.join(ROOT, 'src/probes', probe.id.replace(/^(flow|page)\./, ''));
const checkHashes = (dir, sub, expected, problems) => { for (const [f, h] of Object.entries(expected || {})) if (sha(path.join(dir, sub, f)) !== h) problems.push(`${sub}/${f} hash changed`); };

// The suites that hold a rule nobody drives a browser to check. Eleven of these were eleven copies
// of the same four lines, which is how a twelfth arrives unregistered: a suite that exists on disk
// and runs nowhere is the hole this file was written to close. `miss` is the word for the must-fail
// half having done its job — what a planted defect looked like when the rule caught it.

export async function gate({ log = console.log } = {}) {
  const browser = await launch(); let ok = true;
  // The packet is a format, so it is asserted like one — here, where every probe is already being run
  // against its own fixtures, and not one extra browser is launched for it. A probe that invents a
  // top-level key, or states a fail it cannot cite, stops the gate the same way a bad verdict does.
  const shaped = (probe, ...packets) => packets.flatMap(p => p ? validate(p) : []);
  // A verdict can be right while the sentence carrying it is broken. `consistent-navigation` printed
  // "undefined pairs" for a whole release cycle because a field moved from `evidence` to `measured`
  // and the card still read the old place — every pair still passed, because no pair reads the card.
  // So the card is read here, for both arms of every pair, and a hole in a sentence stops the gate.
  const HOLES = /\bundefined\b|\bNaN\b|\[object Object\]|\bnull\b/;
  const said = (probe, result) => { try { return card(result); } catch (e) { return `card threw: ${e.message}`; } };
  const cardHoles = (probe, ...results) => results.flatMap(r => {
    const text = said(probe, r);
    const line = text.split('\n').find(l => HOLES.test(l));
    return line ? [`the card renders a hole: ${line.trim().slice(0, 120)}`] : [];
  });

  const report = (probe, pair, vf, vp, problems) => {
    problems.push(...shaped(probe, vf, vp));
    if (problems.length) ok = false;
    log(`${probe.sc.padEnd(6)} ${probe.id.padEnd(28)} must-fail: ${saw(vf).padEnd(6)} must-pass: ${vp.verdict.padEnd(14)} ${(probe.method?.status || 'method-unproven').padEnd(17)} ${problems.length ? 'FAIL  ' + problems.join('; ') : 'ok'}`);
    log(`       operator: ${pair.operator}`);
  };
  // Flow probes: one shared fixture site, the must-fail overlay replaces one file. The clean site must reach every probe's satisfied branch: `pass`, never `not-applicable`.
  const site = path.join(ROOT, 'test/fixtures/checkout'); const siteHashes = hashTree(site);
  for (const probe of PROBES) {
    const dir = probeDir(probe); const pair = JSON.parse(fs.readFileSync(path.join(dir, 'pair.json'), 'utf8')); const problems = [];
    for (const [f, h] of Object.entries(pair.hashes.site)) if (siteHashes[f] !== h) problems.push(`site/${f} hash changed`);
    const variants = fs.readdirSync(dir).filter(f => /^must-fail(-|$)/.test(f)).sort();
    for (const v of variants) checkHashes(dir, v, v === 'must-fail' ? pair.hashes.mustFail : pair.variants?.[v]?.hashes, problems);
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-gate-'));
    const build = (overlay) => { const d = fs.mkdtempSync(path.join(tmp, 'v-')); fs.cpSync(site, d, { recursive: true }); if (overlay) fs.cpSync(overlay, d, { recursive: true }); return pathToFileURL(d + '/').href; };
    const jPath = path.join(ROOT, pair.journey);
    let vf;
    for (const v of variants) { const r = (await runJourney(readFlow(jPath, { base: build(path.join(dir, v)) }), { browser })).probes.find(p => p.sc === probe.sc); if (v === 'must-fail') vf = r; if (saw(r) !== 'fail') problems.push(`${v} returned ${r.verdict}`); }
    // A probe whose satisfied branch the clean site cannot reach ships a must-pass overlay, hashed like the must-fail one.
    const mp = fs.existsSync(path.join(dir, 'must-pass')) ? 'must-pass' : null; if (mp) checkHashes(dir, mp, pair.hashes.mustPass, problems);
    const vp = (await runJourney(readFlow(jPath, { base: build(mp ? path.join(dir, mp) : null) }), { browser })).probes.find(p => p.sc === probe.sc);
    fs.rmSync(tmp, { recursive: true, force: true });
    if (vp.verdict !== 'pass') problems.push(`must-pass returned ${vp.verdict}`);
    // The citation belongs to the probe, not to the card: a fail that reaches run.json without one
    // leaves every surface but the terminal unable to say what to do about it.
    if (!vf?.cite?.what || !vf?.cite?.check) problems.push('must-fail carries no what/check from probe.explain()');
    problems.push(...cardHoles(probe, { journey: probe.id, steps: [], stepCount: 0, probes: [vf] }, { journey: probe.id, steps: [], stepCount: 0, probes: [vp] }));
    report(probe, pair, vf, vp, problems);
    for (const v of variants.filter(v => v !== 'must-fail')) log(`       ${v}: ${pair.variants?.[v]?.operator || '(no operator recorded)'}`);
  }
  // Page probes: two complete pages, one mutation between them. Must-pass has to reach the satisfied branch: `pass`, never `not-applicable`.
  for (const probe of PAGE_PROBES) {
    const dir = probeDir(probe); const pair = JSON.parse(fs.readFileSync(path.join(dir, 'pair.json'), 'utf8')); const problems = [];
    checkHashes(dir, 'must-fail', pair.hashes.mustFail, problems); checkHashes(dir, 'must-pass', pair.hashes.mustPass, problems);
    const one = async sub => (await runPage(pathToFileURL(path.join(dir, sub, 'index.html')).href, { browser, only: [probe.id] })).probes[0];
    const vf = await one('must-fail'), vp = await one('must-pass');
    if (saw(vf) !== 'fail') problems.push(`must-fail returned ${vf.verdict}`); if (vp.verdict !== 'pass') problems.push(`must-pass returned ${vp.verdict}`);
    // --prove on the must-pass twin: the probe's own planted defect must reach the measured elements and turn the pass into a fail.
    const pv = (await runPage(pathToFileURL(path.join(dir, 'must-pass', 'index.html')).href, { browser, only: [probe.id], prove: true })).probes[0];
    if (!pv.doctrine?.prove?.wouldFail) problems.push(`--prove on must-pass: ${pv.doctrine?.prove?.why || 'no counterfactual'}`);
    if (!vf?.cite?.what || !vf?.cite?.check) problems.push('must-fail carries no what/check from probe.explain()');
    problems.push(...cardHoles(probe, { url: 'file:///x', probes: [vf] }, { url: 'file:///x', probes: [vp] }));
    report(probe, pair, vf, vp, problems);
    log(`       prove: ${pv.doctrine?.prove?.wouldFail ? 'would fail on ' + pv.doctrine.prove.mutation : 'could not be made to fail: ' + (pv.doctrine?.prove?.why || '')}`);
  }
  // stability: a `fail` read from a page that changed between two reads is not a fail. One pair of
  // twins differing only in whether the defect is the page's resting state.
  {
    const dir = path.join(ROOT, 'test/fixtures/stability'); const pair = JSON.parse(fs.readFileSync(path.join(dir, 'pair.json'), 'utf8')); const problems = [];
    checkHashes(dir, 'must-fail', pair.hashes.mustFail, problems); checkHashes(dir, 'must-pass', pair.hashes.mustPass, problems);
    const one = async sub => (await runPage(pathToFileURL(path.join(dir, sub, 'index.html')).href, { browser, only: ['1.4.3'] })).probes[0];
    const vf = await one('must-fail'), vp = await one('must-pass');
    if (vf.verdict !== 'unmeasurable' || vf.doctrine?.reread?.agreed !== false) problems.push(`must-fail returned ${vf.verdict}, expected unmeasurable from a disagreeing re-read`);
    if (vp.verdict !== 'fail' || vp.doctrine?.reread?.agreed !== true) problems.push(`must-pass returned ${vp.verdict}, expected a fail confirmed by the re-read`);
    if (problems.length) ok = false;
    log(`stable page.reread              must-fail: ${vf.verdict.slice(0, 6).padEnd(6)} must-pass: ${vp.verdict.padEnd(14)} ${'arithmetic'.padEnd(17)} ${problems.length ? 'FAIL  ' + problems.join('; ') : 'ok'}`);
    log(`       operator: ${pair.operator}`);
  }
  await browser.close();
  // Skills: frontmatter, and the load-bearing paragraph still present by hash. Load-bearing was shown on fresh agents; the record is printed, not re-run.
  {
    const { checkSkills } = await import('./skills.js');
    for (const r of checkSkills()) { if (r.problems.length) ok = false; log(`skill  ${r.name.padEnd(28)} paragraph: ${(r.problems.length ? 'broken' : 'present').padEnd(6)} record: ${r.record.slice(0, 60).padEnd(60)} ${r.problems.length ? 'FAIL  ' + r.problems.join('; ') : 'ok'}`); }
  }
  // Commitments on tokens (`sheet`): two commitment files over one token file, one minimum between them.
  {
    const dir = path.join(ROOT, 'test/fixtures/sheet'); const pair = JSON.parse(fs.readFileSync(path.join(dir, 'pair.json'), 'utf8')); const problems = [];
    for (const [f, h] of Object.entries(pair.hashes)) if (typeof h === 'string' && sha(path.join(dir, f)) !== h) problems.push(`${f} hash changed`);
    checkHashes(dir, '', pair.hashes.mustFail, problems); checkHashes(dir, '', pair.hashes.mustPass, problems);
    const { evaluate } = await import('./sheet.js');
    const vf = evaluate(path.join(dir, 'must-fail.commitments.json'), dir).results, vp = evaluate(path.join(dir, 'must-pass.commitments.json'), dir).results;
    if (!vf.some(r => r.verdict === 'fail')) problems.push('must-fail returned no fail'); if (!vp.length || vp.some(r => r.verdict !== 'pass')) problems.push(`must-pass returned ${vp.map(r => r.verdict).join(',')}`);
    if (problems.length) ok = false;
    log(`sheet  project.contrast            must-fail: ${(vf.find(r => r.verdict === 'fail') ? 'fail' : 'none').padEnd(6)} must-pass: ${(vp.every(r => r.verdict === 'pass') ? 'pass' : 'mixed').padEnd(14)} ${'arithmetic'.padEnd(17)} ${problems.length ? 'FAIL  ' + problems.join('; ') : 'ok'}`);
    log(`       operator: ${pair.operator}`);
  }
  // diff: the two sheet evaluations above, saved, must show the regression and block with --gate; the same run twice must be all `same`.
  {
    const { evaluate } = await import('./sheet.js'); const { diff, gateExit } = await import('./diff.js'); const dir = path.join(ROOT, 'test/fixtures/sheet'); const problems = [];
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-diff-')); const save = (name, sub) => { const f = path.join(tmp, name); fs.writeFileSync(f, JSON.stringify(evaluate(path.join(dir, sub), dir))); return f; };
    const a = save('a.json', 'must-pass.commitments.json'), b = save('b.json', 'must-fail.commitments.json');
    const reg = diff(a, b), same = diff(a, a);
    if (!reg.rows.some(r => r.delta === 'regressed' && r.b === 'fail') || gateExit(reg) !== 2) problems.push('must-fail: pass → fail not reported as regressed with exit 2');
    if (!same.rows.every(r => r.delta === 'same') || gateExit(same) !== 0) problems.push('must-pass: identical runs not all same with exit 0');
    fs.rmSync(tmp, { recursive: true, force: true }); if (problems.length) ok = false;
    log(`diff   drift between two runs        must-fail: ${(gateExit(reg) === 2 ? 'exit 2' : 'exit ' + gateExit(reg)).padEnd(6)} must-pass: ${(same.rows.every(r => r.delta === 'same') ? 'all same' : 'mixed').padEnd(14)} ${'arithmetic'.padEnd(17)} ${problems.length ? 'FAIL  ' + problems.join('; ') : 'ok'}`);
    log('       operator: the sheet pair saved as two runs; a regressed commitment must block, an unchanged run must not');
  }
  // init: the one command that writes into someone else's repository, so the claim that it does not
  // write without being told is held by the same kind of pair as every probe. No browser.
  {
    const { pair, OPERATOR } = await import('../test/init-writes-nothing.mjs'); const r = pair();
    if (!r.ok) ok = false;
    log(`init   writes nothing unasked      must-fail: ${(r.created ? 'wrote ' + r.created : 'wrote 0').padEnd(6)} must-pass: ${(r.wrote ? 'wrote ' + r.wrote : 'untouched').padEnd(14)} ${'filesystem'.padEnd(17)} ${r.ok ? 'ok' : 'FAIL  ' + r.problems.join('; ')}`);
    log(`       operator: ${OPERATOR}`);
  }
  // experiments: a behavioural claim with no arm behind it may not reach a user.
  {
    const { pair, OPERATOR } = await import('../test/experiments-do-not-ship.mjs'); const r = pair();
    if (!r.ok) ok = false;
    log(`exp    experiments do not ship      must-fail: ${'planted'.padEnd(6)} must-pass: ${(r.experiments + ' held back').padEnd(14)} ${'packaging'.padEnd(17)} ${r.ok ? 'ok' : 'FAIL  ' + r.problems.join('; ')}`);
    log(`       operator: ${OPERATOR}`);
  }
  // The architecture, asserted like everything else here. No browser, no fixtures: these read the
  // source. A dependency rule nobody checks is the promise Cockburn says rots; these are the checks.
  {
    const { dependencyRule, lifecycleRule, registryRule, storeRule, suiteRule, tierRule, kindRule } = await import('./arch.js');
    const { kindNames } = await import('./core/commitment/kinds.js');
    const all = [...PROBES, ...PAGE_PROBES];
    const named = all.map(p => p.id.replace(/^(flow|page)\./, ''));
    const rows = [
      ['arch   core/ holds no capability   ', dependencyRule(), 'every import under src/core/ resolves inside src/core/ and names no port'],
      ['arch   one lifecycle per probe     ', lifecycleRule(all), 'a page probe has measure+explain and no evaluate; a flow probe has evaluate+explain and no measure'],
      ['arch   registry names every probe  ', registryRule(named), 'the two explicit probe arrays and src/probes/ match both ways: no directory unregistered, no registration without a directory'],
      ['arch   one place names the files   ', storeRule(), 'no file outside src/adapters/store/ names a uxcli.*.json: where a project keeps its declarations is one decision, made once'],
      ['arch   the gate runs every pair    ', suiteRule(SUITES.map(s => s.file)), 'every test/*-pairs.mjs is named in the gate, and every suite the gate names is on disk'],
      ['arch   served with what it imports ', tierRule(), 'every core/ module the dashboard serves the browser has its own imports served too: an unresolved import is a 404 where a module should be, and no screen evaluates at all'],
      ['arch   every kind can fail         ', kindRule(kindNames()), 'every kind in the commitment registry is named by a falsification pair: a kind nothing has watched fail cannot be told from one that always passes'],
    ];
    for (const [label, problems, operator] of rows) {
      if (problems.length) ok = false;
      log(`${label}must-fail: ${(problems.length ? 'broken' : 'holds').padEnd(6)} must-pass: ${(problems.length ? problems.length + ' problem' + (problems.length > 1 ? 's' : '') : 'clean').padEnd(14)} ${'source'.padEnd(17)} ${problems.length ? 'FAIL  ' + problems.join('; ') : 'ok'}`);
      log(`       operator: ${operator}`);
    }
    // And the rules themselves: a rule that only ever reports "clean" cannot be told from a rule that
    // cannot see. Each is shown failing on a planted violation and silent once it is removed.
    const { covers } = await import('./core/verdict/rank.js');
    const ladder = covers(VERDICTS);
    if (ladder.length) ok = false;
    log(`arch   the ladder covers the set  must-fail: ${(ladder.length ? 'gap' : 'holds').padEnd(6)} must-pass: ${(ladder.length ? ladder.length + ' gaps' : 'all seven').padEnd(14)} ${'source'.padEnd(17)} ${ladder.length ? 'FAIL  ' + ladder.join('; ') : 'ok'}`);
    log('       operator: the attention order ranks every one of the seven verdicts and nothing that is not one of them');
    for (const s of SUITES) {
      const { pair, OPERATOR } = await import(`../test/${s.file}`); const r = pair();
      if (!r.ok) ok = false;
      log(`${s.tag.padEnd(6)} ${s.title.padEnd(29)} must-fail: ${(r.ok ? s.miss : 'missed').padEnd(7)} must-pass: ${(r.checks + ' checks').padEnd(14)} ${'source'.padEnd(17)} ${r.ok ? 'ok' : 'FAIL  ' + r.problems.join('; ')}`);
      log(`       operator: ${OPERATOR}`);
    }
  }
  log(ok ? 'GATE PASS' : 'GATE FAIL');
  return ok;
}

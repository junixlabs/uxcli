// uxcli gate: every probe's falsification pair must fail where it must and stay silent where it must, and the fixture hashes must match.
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import crypto from 'node:crypto'; import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadJourney } from './journey.js'; import { runJourney, PROBES } from './run.js'; import { runPage, PAGE_PROBES } from './page.js'; import { launch } from './browser.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
export function hashTree(dir) { const out = {}; for (const f of fs.readdirSync(dir).sort()) { const p = path.join(dir, f); if (fs.statSync(p).isFile()) out[f] = sha(p); } return out; }
const probeDir = probe => path.join(ROOT, 'src/probes', probe.id.replace(/^(flow|page)\./, ''));
const checkHashes = (dir, sub, expected, problems) => { for (const [f, h] of Object.entries(expected || {})) if (sha(path.join(dir, sub, f)) !== h) problems.push(`${sub}/${f} hash changed`); };

export async function gate({ log = console.log } = {}) {
  const browser = await launch(); let ok = true;
  const report = (probe, pair, vf, vp, problems) => {
    if (problems.length) ok = false;
    log(`${probe.sc.padEnd(6)} ${probe.id.padEnd(28)} must-fail: ${(vf.rawVerdict || vf.verdict).padEnd(6)} must-pass: ${vp.verdict.padEnd(14)} ${(probe.method?.status || 'method-unproven').padEnd(17)} ${problems.length ? 'FAIL  ' + problems.join('; ') : 'ok'}`);
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
    for (const v of variants) { const r = (await runJourney(loadJourney(jPath, { base: build(path.join(dir, v)) }), { browser })).probes.find(p => p.sc === probe.sc); if (v === 'must-fail') vf = r; if ((r.rawVerdict || r.verdict) !== 'fail') problems.push(`${v} returned ${r.verdict}`); }
    const vp = (await runJourney(loadJourney(jPath, { base: build(null) }), { browser })).probes.find(p => p.sc === probe.sc);
    fs.rmSync(tmp, { recursive: true, force: true });
    if (vp.verdict !== 'pass') problems.push(`must-pass returned ${vp.verdict}`);
    report(probe, pair, vf, vp, problems);
    for (const v of variants.filter(v => v !== 'must-fail')) log(`       ${v}: ${pair.variants?.[v]?.operator || '(no operator recorded)'}`);
  }
  // Page probes: two complete pages, one mutation between them. Must-pass has to reach the satisfied branch: `pass`, never `not-applicable`.
  for (const probe of PAGE_PROBES) {
    const dir = probeDir(probe); const pair = JSON.parse(fs.readFileSync(path.join(dir, 'pair.json'), 'utf8')); const problems = [];
    checkHashes(dir, 'must-fail', pair.hashes.mustFail, problems); checkHashes(dir, 'must-pass', pair.hashes.mustPass, problems);
    const one = async sub => (await runPage(pathToFileURL(path.join(dir, sub, 'index.html')).href, { browser, only: [probe.id] })).probes[0];
    const vf = await one('must-fail'), vp = await one('must-pass');
    if ((vf.rawVerdict || vf.verdict) !== 'fail') problems.push(`must-fail returned ${vf.verdict}`); if (vp.verdict !== 'pass') problems.push(`must-pass returned ${vp.verdict}`);
    report(probe, pair, vf, vp, problems);
  }
  await browser.close();
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
  log(ok ? 'GATE PASS' : 'GATE FAIL');
  return ok;
}

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
    log(`${probe.sc.padEnd(6)} ${probe.id.padEnd(28)} must-fail: ${vf.verdict.padEnd(6)} must-pass: ${vp.verdict.padEnd(14)} ${problems.length ? 'FAIL  ' + problems.join('; ') : 'ok'}`);
    log(`       operator: ${pair.operator}`);
  };
  // Flow probes: one shared fixture site, the must-fail overlay replaces one file. Must-pass may be silent (not-applicable) until each probe has a twin that reaches its satisfied branch.
  const site = path.join(ROOT, 'test/fixtures/checkout'); const siteHashes = hashTree(site);
  for (const probe of PROBES) {
    const dir = probeDir(probe); const pair = JSON.parse(fs.readFileSync(path.join(dir, 'pair.json'), 'utf8')); const problems = [];
    for (const [f, h] of Object.entries(pair.hashes.site)) if (siteHashes[f] !== h) problems.push(`site/${f} hash changed`);
    checkHashes(dir, 'must-fail', pair.hashes.mustFail, problems);
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-gate-'));
    const build = (overlay) => { const d = fs.mkdtempSync(path.join(tmp, 'v-')); fs.cpSync(site, d, { recursive: true }); if (overlay) fs.cpSync(overlay, d, { recursive: true }); return pathToFileURL(d + '/').href; };
    const jPath = path.join(ROOT, pair.journey);
    const vf = (await runJourney(loadJourney(jPath, { base: build(path.join(dir, 'must-fail')) }), { browser })).probes.find(p => p.sc === probe.sc);
    const vp = (await runJourney(loadJourney(jPath, { base: build(null) }), { browser })).probes.find(p => p.sc === probe.sc);
    fs.rmSync(tmp, { recursive: true, force: true });
    if (vf.verdict !== 'fail') problems.push(`must-fail returned ${vf.verdict}`); if (!['pass', 'not-applicable'].includes(vp.verdict)) problems.push(`must-pass returned ${vp.verdict}`);
    report(probe, pair, vf, vp, problems);
  }
  // Page probes: two complete pages, one mutation between them. Must-pass has to reach the satisfied branch: `pass`, never `not-applicable`.
  for (const probe of PAGE_PROBES) {
    const dir = probeDir(probe); const pair = JSON.parse(fs.readFileSync(path.join(dir, 'pair.json'), 'utf8')); const problems = [];
    checkHashes(dir, 'must-fail', pair.hashes.mustFail, problems); checkHashes(dir, 'must-pass', pair.hashes.mustPass, problems);
    const one = async sub => (await runPage(pathToFileURL(path.join(dir, sub, 'index.html')).href, { browser, only: [probe.id] })).probes[0];
    const vf = await one('must-fail'), vp = await one('must-pass');
    if (vf.verdict !== 'fail') problems.push(`must-fail returned ${vf.verdict}`); if (vp.verdict !== 'pass') problems.push(`must-pass returned ${vp.verdict}`);
    report(probe, pair, vf, vp, problems);
  }
  await browser.close();
  log(ok ? 'GATE PASS' : 'GATE FAIL');
  return ok;
}

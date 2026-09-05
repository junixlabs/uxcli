// uxcli gate: every probe's falsification pair must fail where it must and stay silent where it must, and the fixture hashes must match.
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import crypto from 'node:crypto'; import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadJourney } from './journey.js'; import { runJourney, PROBES } from './run.js'; import { launch } from './browser.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
export function hashTree(dir) { const out = {}; for (const f of fs.readdirSync(dir).sort()) { const p = path.join(dir, f); if (fs.statSync(p).isFile()) out[f] = sha(p); } return out; }

export async function gate({ log = console.log } = {}) {
  const browser = await launch(); let ok = true;
  const site = path.join(ROOT, 'test/fixtures/checkout'); const siteHashes = hashTree(site);
  for (const probe of PROBES) {
    const dir = path.join(ROOT, 'src/probes', probe.id.replace('flow.', ''));
    const pair = JSON.parse(fs.readFileSync(path.join(dir, 'pair.json'), 'utf8'));
    const problems = [];
    for (const [f, h] of Object.entries(pair.hashes.site)) if (siteHashes[f] !== h) problems.push(`site/${f} hash changed`);
    for (const [f, h] of Object.entries(pair.hashes.mustFail)) if (sha(path.join(dir, 'must-fail', f)) !== h) problems.push(`must-fail/${f} hash changed`);
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-gate-'));
    const build = (overlay) => { const d = fs.mkdtempSync(path.join(tmp, 'v-')); fs.cpSync(site, d, { recursive: true }); if (overlay) fs.cpSync(overlay, d, { recursive: true }); return pathToFileURL(d + '/').href; };
    const jPath = path.join(ROOT, pair.journey);
    const vf = (await runJourney(loadJourney(jPath, { base: build(path.join(dir, 'must-fail')) }), { browser })).probes.find(p => p.sc === probe.sc);
    const vp = (await runJourney(loadJourney(jPath, { base: build(null) }), { browser })).probes.find(p => p.sc === probe.sc);
    fs.rmSync(tmp, { recursive: true, force: true });
    const fOk = vf.verdict === 'fail', pOk = ['pass', 'not-applicable'].includes(vp.verdict);
    if (!fOk) problems.push(`must-fail returned ${vf.verdict}`); if (!pOk) problems.push(`must-pass returned ${vp.verdict}`);
    if (problems.length) ok = false;
    log(`${probe.sc} ${probe.id.padEnd(28)} must-fail: ${vf.verdict.padEnd(6)} must-pass: ${vp.verdict.padEnd(14)} ${problems.length ? 'FAIL  ' + problems.join('; ') : 'ok'}`);
    log(`      operator: ${pair.operator}`);
  }
  await browser.close();
  log(ok ? 'GATE PASS' : 'GATE FAIL');
  return ok;
}

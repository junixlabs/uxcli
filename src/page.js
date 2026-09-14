// Loads one URL once and gives every page probe the settled document. Returns the verdicts.
import fs from 'node:fs'; import path from 'node:path';
import { launch, settle } from './browser.js'; import { tokenIndex, tokenFor } from './tokens.js';
import { BOT } from './util.js'; import { withMethod, explainAll } from './run.js';
import focusVisible from './probes/focus-visible/probe.js';
import textSpacing from './probes/text-spacing/probe.js';
import contrast from './probes/contrast/probe.js';
import textOverlap from './probes/text-overlap/probe.js';

export const PAGE_PROBES = [focusVisible, textSpacing, contrast, textOverlap];

// A page that is still changing when it is read gives a verdict that is a coin flip between runs:
// this project's own landing page runs a scripted intro for seven seconds after settle(), and a probe
// that happened to read a colour mid-fade reported `fail` on one run and `pass` on the next. A `fail`
// nobody can reproduce is the failure mode that retires an instrument, so before one is allowed to
// stand it is read a second time; if the second read does not say the same thing about the same
// elements, the first read is not evidence and the verdict is `unmeasurable`, not `fail`.
// Known limit: two reads that both fail on the same elements are confirmed even if the cited numbers
// moved between them, so a value in a running animation can be one tick stale.
const RECHECK_MS = 700;
const cited = r => [
  ...(r.targets || []).map(t => t.sel || [t.a?.sel, t.b?.sel].filter(Boolean).join('|')),
  ...(r.groups || []).map(g => g.example || `${g.fg} on ${g.bg}`),
].filter(Boolean).sort().join(',');

async function confirmFail(page, probe, result, first) {
  let again;
  // A re-read that could not run says nothing about the first; only a completed disagreement does.
  try { await page.waitForTimeout(RECHECK_MS); again = await probe.measure(page, result); } catch { return first; }
  if (again.verdict === 'fail' && cited(again) === cited(first)) return { ...first, reread: { afterMs: RECHECK_MS, agreed: true } };
  return {
    ...first, verdict: 'unmeasurable',
    why: `read twice ${RECHECK_MS} ms apart and the page had changed between them: "${first.why}" then "${again.verdict === 'fail' ? again.why : again.verdict}"`,
    reread: { afterMs: RECHECK_MS, agreed: false, verdict: again.verdict, why: again.why || null },
  };
}

export async function runPage(url, { browser, state, only, outDir, src, prove } = {}) {
  const own = !browser; if (own) browser = await launch();
  // bypassCSP: the contrast probe injects axe-core; a page's Content-Security-Policy would otherwise block it (instrument setting, recorded in contrast/spec.md).
  const bctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, storageState: state || undefined, bypassCSP: true });
  const page = await bctx.newPage();
  const result = { url, ranAt: new Date().toISOString(), title: null, probes: [] };
  const probes = only ? PAGE_PROBES.filter(p => only.includes(p.id) || only.includes(p.sc)) : PAGE_PROBES;
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 45000 }); await settle(page);
    result.finalUrl = page.url(); result.title = await page.title();
    if (BOT.test(result.title)) { result.blocked = true; for (const p of probes) result.probes.push({ probe: p.id, sc: p.sc, provenance: 'spec', verdict: 'unmeasurable', why: `blocked: page title "${result.title}"` }); }
    else for (const p of probes) {
      try {
        let out = await p.measure(page, result);
        if (out.verdict === 'fail') out = await confirmFail(page, p, result, out);
        result.probes.push(withMethod(p, out));
      }
      catch (e) { result.probes.push({ probe: p.id, sc: p.sc, provenance: 'spec', verdict: 'unmeasurable', why: 'probe error: ' + String(e.message || e).slice(0, 160) }); }
    }
    // --prove: for every pass, plant the probe's own defect on a fresh load, check it reached the measured elements, re-measure (definition: .claude/p4-prove in the working notes; card prints the outcome).
    if (prove && !result.blocked) for (const p of result.probes.filter(p => p.verdict === 'pass')) {
      const probe = probes.find(x => x.id === p.probe); if (!probe.prove) continue;
      const pg = await bctx.newPage();
      try {
        await pg.goto(url, { waitUntil: 'load', timeout: 45000 }); await settle(pg);
        const m = await probe.prove(pg, p);
        if (m.reached) { const again = await probe.measure(pg, result); m.verdictAfter = again.verdict; m.wouldFail = again.verdict === 'fail'; if (!m.wouldFail) m.why = `re-measure returned ${again.verdict}: ${again.why || ''}`.trim(); }
        p.prove = m;
      } catch (e) { p.prove = { reached: false, why: 'prove error: ' + String(e.message || e).slice(0, 160) }; }
      await pg.close();
    }
  } catch (e) { result.error = 'load: ' + String(e.message || e).slice(0, 160); for (const p of probes) result.probes.push({ probe: p.id, sc: p.sc, provenance: 'spec', verdict: 'unmeasurable', why: result.error }); }
  await bctx.close(); if (own) await browser.close();
  writeEvidence(result, outDir);
  if (src) { const idx = tokenIndex(src); for (const p of result.probes) for (const g of p.groups || []) { g.fgToken = tokenFor(idx, g.fg); g.bgToken = tokenFor(idx, g.bg); } result.src = src; }
  explainAll(result, probes);
  return result;
}

// Evidence files are written only for fails: the before and after crops of each cited control.
function writeEvidence(result, outDir) {
  for (const p of result.probes) {
    if ((p.verdict === 'fail' || p.verdict === 'finding') && p.evidence?.length && outDir) {
      fs.mkdirSync(outDir, { recursive: true }); p.proof = [];
      p.evidence.forEach((e, k) => { for (const side of ['before', 'after']) { const f = path.join(outDir, `${p.sc}-${k}-${side}.png`); fs.writeFileSync(f, e[side]); p.proof.push(f); } });
    }
    delete p.evidence;
  }
}

// Loads one URL once and gives every page probe the settled document. Returns the verdicts.
import fs from 'node:fs'; import path from 'node:path';
import { launch, settle } from './browser.js'; import { tokenIndex, tokenFor } from './tokens.js';
import { BOT } from './util.js'; import { withMethod } from './run.js';
import focusVisible from './probes/focus-visible/probe.js';
import textSpacing from './probes/text-spacing/probe.js';
import contrast from './probes/contrast/probe.js';

export const PAGE_PROBES = [focusVisible, textSpacing, contrast];

export async function runPage(url, { browser, state, only, outDir, src } = {}) {
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
      try { result.probes.push(withMethod(p, await p.measure(page, result))); }
      catch (e) { result.probes.push({ probe: p.id, sc: p.sc, provenance: 'spec', verdict: 'unmeasurable', why: 'probe error: ' + String(e.message || e).slice(0, 160) }); }
    }
  } catch (e) { result.error = 'load: ' + String(e.message || e).slice(0, 160); for (const p of probes) result.probes.push({ probe: p.id, sc: p.sc, provenance: 'spec', verdict: 'unmeasurable', why: result.error }); }
  await bctx.close(); if (own) await browser.close();
  writeEvidence(result, outDir);
  if (src) { const idx = tokenIndex(src); for (const p of result.probes) for (const g of p.groups || []) { g.fgToken = tokenFor(idx, g.fg); g.bgToken = tokenFor(idx, g.bg); } result.src = src; }
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

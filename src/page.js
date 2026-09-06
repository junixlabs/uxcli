// Loads one URL once and gives every page probe the settled document. Returns the verdicts.
import { launch, settle } from './browser.js';
import { BOT } from './util.js';
import focusVisible from './probes/focus-visible/probe.js';
import textSpacing from './probes/text-spacing/probe.js';
import contrast from './probes/contrast/probe.js';

export const PAGE_PROBES = [focusVisible, textSpacing, contrast];

export async function runPage(url, { browser, state, only } = {}) {
  const own = !browser; if (own) browser = await launch();
  const bctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, storageState: state || undefined });
  const page = await bctx.newPage();
  const result = { url, ranAt: new Date().toISOString(), title: null, probes: [] };
  const probes = only ? PAGE_PROBES.filter(p => only.includes(p.id) || only.includes(p.sc)) : PAGE_PROBES;
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 45000 }); await settle(page);
    result.finalUrl = page.url(); result.title = await page.title();
    if (BOT.test(result.title)) { result.blocked = true; for (const p of probes) result.probes.push({ probe: p.id, sc: p.sc, provenance: 'spec', verdict: 'unmeasurable', why: `blocked: page title "${result.title}"` }); }
    else for (const p of probes) {
      try { result.probes.push({ probe: p.id, sc: p.sc, provenance: 'spec', ...(await p.measure(page, result)) }); }
      catch (e) { result.probes.push({ probe: p.id, sc: p.sc, provenance: 'spec', verdict: 'unmeasurable', why: 'probe error: ' + String(e.message || e).slice(0, 160) }); }
    }
  } catch (e) { result.error = 'load: ' + String(e.message || e).slice(0, 160); for (const p of probes) result.probes.push({ probe: p.id, sc: p.sc, provenance: 'spec', verdict: 'unmeasurable', why: result.error }); }
  await bctx.close(); if (own) await browser.close();
  return result;
}

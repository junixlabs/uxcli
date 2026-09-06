// Walks a journey once, gives every probe the same observations, returns the verdicts.
import { launch, arrive, noise, markScope, fillStep, act, evalIn } from './browser.js';
import { BOT } from './util.js';
import fs from 'node:fs'; import path from 'node:path';
import errorPrevention from './probes/error-prevention/probe.js';
import redundantEntry from './probes/redundant-entry/probe.js';
import consistentNavigation from './probes/consistent-navigation/probe.js';

export const PROBES = [errorPrevention, redundantEntry, consistentNavigation];

// README rule: an unproven method reports `finding` where it would say `fail`. The probe's own verdict is kept as rawVerdict.
export function withMethod(probe, out) {
  const r = { probe: probe.id, sc: probe.sc, provenance: 'spec', method: probe.method?.status || 'method-unproven', ...out };
  if (r.verdict === 'fail' && r.method !== 'method-validated') { r.rawVerdict = 'fail'; r.verdict = 'finding'; }
  return r;
}

export async function runJourney(J, { browser, outDir } = {}) {
  const own = !browser; if (own) browser = await launch();
  const ctx = { J, steps: [], recorded: [], authSteps: new Set(), commitIdx: J.steps.findIndex(s => s.commit), blocked: false, browser };
  const bctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await bctx.newPage();
  for (let i = 0; i < J.steps.length; i++) {
    const step = J.steps[i]; const rec = { i, url: null, arrivedBy: null, title: null, noise: null, inputsOnArrival: [] };
    try { rec.arrivedBy = await arrive(page, step); } catch (e) { rec.error = 'load: ' + String(e).slice(0, 160); ctx.steps.push(rec); break; }
    rec.url = page.url(); rec.title = await page.title();
    if (BOT.test(rec.title)) { rec.blocked = true; ctx.blocked = true; ctx.steps.push(rec); break; }
    rec.noise = await noise(page);
    rec.scope = await markScope(page, step);
    rec.inputsOnArrival = await evalIn(page, '() => processInputs()');
    for (const p of PROBES) if (p.onStep) await p.onStep(page, rec, ctx);
    try { if (await fillStep(page, step, i, ctx.recorded)) ctx.authSteps.add(i); rec.flowBreak = await act(page, step); } catch (e) { rec.error = 'act: ' + String(e).slice(0, 160); ctx.steps.push(rec); break; }
    ctx.steps.push(rec);
  }
  await bctx.close();
  segment(ctx);
  const probes = [];
  for (const p of PROBES) probes.push(withMethod(p, await p.evaluate(ctx)));
  if (own) await browser.close();
  if (outDir) writeEvidence(ctx, probes, outDir);
  for (const s of ctx.steps) delete s.evidence;
  return { journey: J.name, ranAt: new Date().toISOString(), stepCount: J.steps.length, steps: ctx.steps, recorded: ctx.recorded, probes };
}

// Process segments: a goto or a submit that did not navigate starts a new segment; sameProcess joins ranges (provenance project).
function segment(ctx) {
  const { steps, J } = ctx; const segOf = []; let seg = 0;
  for (let i = 0; i < steps.length; i++) { if (i > 0 && (steps[i].arrivedBy === 'goto' || steps[i - 1].flowBreak)) seg++; segOf[i] = seg; }
  for (const [from, to] of J.sameProcess || []) { const target = segOf[from]; for (let i = from; i <= to && i < segOf.length; i++) { const s0 = segOf[i]; for (let k = 0; k < segOf.length; k++) if (segOf[k] === s0) segOf[k] = target; } }
  steps.forEach((s, i) => { s.segment = segOf[i]; });
  ctx.segOf = segOf;
  ctx.breakAfter = (a, b) => { for (let i = Math.min(a, b) + 1; i <= Math.max(a, b); i++) if (segOf[i] !== segOf[i - 1]) return i; return null; };
}

// Evidence files are written only for fails: the cited screen, cited fields outlined.
function writeEvidence(ctx, probes, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const save = (name, buf) => { if (!buf) return null; const f = path.join(outDir, name); fs.writeFileSync(f, buf); return f; };
  for (const p of probes) {
    if (p.verdict !== 'fail') continue;
    if (p.sc === '3.3.7') p.proof = [...new Set(p.reasked.map(m => m.step))].map(i => save(`3.3.7-step${i}.png`, ctx.steps[i]?.evidence?.['3.3.7'])).filter(Boolean);
    if (p.sc === '3.3.4') p.proof = [save(`3.3.4-step${ctx.commitIdx}.png`, ctx.steps[ctx.commitIdx]?.evidence?.['3.3.4'])].filter(Boolean);
    if (p.sc === '3.2.3') { const x = p.inversion; p.proof = [x.stepA, x.stepB].map(i => save(`3.2.3-step${i}.png`, ctx.steps[i]?.evidence?.['3.2.3']?.[x.mechanism])).filter(Boolean); }
  }
}

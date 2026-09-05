// flow.error-prevention · WCAG 3.3.4. Spec in spec.md; falsification pair in pair.json.
import { norm, alnum, normUrl } from '../../util.js';
import { screen, arrive, fillStep, act, evalIn } from '../../browser.js';

export default {
  id: 'flow.error-prevention', sc: '3.3.4',
  async onStep(page, rec, ctx) {
    const i = rec.i, step = ctx.J.steps[i];
    if (i === ctx.commitIdx - 1 && !step.fill) ctx.reviewScreen = await screen(page, i, rec);
    if (i === ctx.commitIdx) { const prev = ctx.steps[i - 1]; ctx.commitScreen = { ...(await screen(page, i, rec)), flowBreak: !!(prev && prev.flowBreak && rec.arrivedBy === 'goto') }; }
  },
  async evaluate(ctx) {
    const { J, recorded, segOf, breakAfter, commitIdx, commitScreen, reviewScreen, authSteps, blocked } = ctx; const ep = {};
    const priorAll = recorded.filter(r => commitIdx >= 0 && r.step < commitIdx && !(authSteps.has(r.step) && r.credentialCandidate));
    const priorVals = priorAll.filter(r => segOf[r.step] === segOf[commitIdx]);
    const priorOutside = priorAll.filter(r => segOf[r.step] !== segOf[commitIdx]);
    if (J.sameProcess) ep.override = { sameProcess: J.sameProcess, provenance: 'project' };
    if (priorOutside.length) ep.outsideSegment = priorOutside.map(r => ({ field: r.name || r.label, step: r.step, note: 'recorded in another process segment; not compared' }));
    if (blocked) return { ...ep, verdict: 'blocked' };
    if (commitIdx < 0) return { ...ep, verdict: 'not-committed' };
    if (!commitScreen) return { ...ep, verdict: 'unmeasurable', why: 'commit screen not reached' };
    if (!priorVals.length && priorOutside.length) return { ...ep, verdict: 'unmeasurable', why: 'premise broken at step ' + breakAfter(priorOutside[priorOutside.length - 1].step, commitIdx) + ': recorded values belong to another process segment (direct navigation or a submit that did not navigate); declare sameProcess to override' };
    if (!priorVals.length) return { ...ep, verdict: 'not-applicable', why: 'no non-credential value recorded before the commit step (single-screen commit); probe measures cross-screen review only' };
    if (commitScreen.flowBreak) return { ...ep, verdict: 'unmeasurable', why: 'flow break: previous submit did not change the page and the commit screen was reached by direct navigation' };
    if (commitScreen.noise) return { ...ep, verdict: 'unmeasurable', why: 'commit screen text mutating with no interaction (600 ms)' };
    if (new URL(commitScreen.url).origin !== new URL(J.steps[0].url).origin) return { ...ep, verdict: 'unmeasurable', why: 'commit screen on another origin' };

    const dataSteps = new Set(priorVals.map(r => r.step));
    const earlierUrls = new Set(J.steps.slice(0, commitIdx).map((s, i) => dataSteps.has(i) && s.url ? normUrl(s.url) : null).filter(Boolean));
    const evalConfirmed = scr => {
      const T = norm(scr.text), TA = alnum(scr.text); const missing = [], reformatted = [], present = [];
      for (const r of priorVals) {
        const cands = [r.value, r.display].map(norm).filter(Boolean);
        const inText = cands.some(v => T.includes(v)), inField = scr.ro.some(f => cands.includes(norm(f.value)));
        if (inText || inField) present.push({ value: r.value, where: inText ? 'text' : 'field' });
        else if (cands.some(v => alnum(v).length >= 3 && TA.includes(alnum(v)))) reformatted.push({ value: r.value, note: 'present after stripping punctuation/whitespace: reformatted by site (invalid-if), reported as finding' });
        else missing.push({ value: r.value, field: r.name || r.label || r.selector, step: r.step });
      }
      const changeCtl = scr.links.find(l => (l.href && earlierUrls.has(normUrl(l.href))) || /\b(change|edit|back|modify)\b/.test(l.text));
      const editableHere = scr.ro.some(f => f.editable && priorVals.some(r => norm(f.value) === norm(r.value)));
      return { holds: missing.length === 0 && (!!changeCtl || editableHere), screen: scr.step, present, reformatted, missing, changeMechanism: changeCtl || (editableHere ? 'values editable on this screen' : null) };
    };
    let conf = evalConfirmed(commitScreen);
    if (!conf.holds && reviewScreen) { const c2 = evalConfirmed(reviewScreen); if (c2.holds) conf = { ...c2, note: 'review on the step before the commit screen' }; else conf.reviewStepAlso = { screen: c2.screen, missing: c2.missing, changeMechanism: c2.changeMechanism }; }
    const branches = { confirmed: conf };
    branches.checked = (!conf.holds && J.checkedPass) ? await checkedPass(ctx) : { holds: null, tested: false, why: conf.holds ? 'not needed' : 'journey does not allow the mutating checked pass' };
    branches.reversible = { holds: !!J.reversible, provenance: 'project', declared: J.reversible || null };
    ep.branches = branches;
    if (conf.holds) return { ...ep, verdict: 'pass', branch: conf.note ? 'confirmed (review on preceding step)' : 'confirmed' };
    if (branches.checked.holds) return { ...ep, verdict: 'pass', branch: 'checked' };
    if (J.reversible) return { ...ep, verdict: 'pass', branch: 'reversible (project)' };
    if (branches.checked.tested) return { ...ep, verdict: 'fail', why: 'no branch holds', missing: conf.missing };
    return { ...ep, verdict: 'unmeasurable', why: 'confirmed false; checked untested; reversible not declared' };
  }
};

// Separate pass: replay to the entry step, plant one input error, submit, read the outcome (definitions v8 rule 16).
async function checkedPass(ctx) {
  const { J, recorded, commitIdx, browser } = ctx;
  const pre = recorded.filter(r => r.step < commitIdx).sort((a, b) => b.step - a.step);
  if (!pre.length) return { holds: null, tested: false, why: 'no entry step with recorded values' };
  const onStep = pre.filter(r => r.step === pre[0].step);
  let entry = onStep.find(r => r.required), probeValue = '', probeKind = 'required field emptied';
  if (!entry) { entry = onStep.find(r => r.type === 'email'); probeValue = 'not-an-email'; probeKind = 'type=email given an invalid value'; }
  if (!entry) { entry = onStep.find(r => r.type === 'url'); probeValue = 'not-a-url'; probeKind = 'type=url given an invalid value'; }
  if (!entry) { entry = onStep.find(r => r.minlength > 1); probeValue = 'a'; probeKind = 'minlength field given one character'; }
  const declared = !!entry;
  if (!entry) { entry = onStep[0]; probeValue = ''; probeKind = 'undeclared field emptied (may be optional)'; }
  const bctx = await browser.newContext({ viewport: { width: 1280, height: 800 } }); const page = await bctx.newPage();
  const res = { tested: true, entryStep: entry.step, probedField: entry.name || entry.label || entry.selector, probeKind, probeValue, declaredConstraint: declared };
  try {
    for (let i = 0; i < entry.step; i++) { await arrive(page, J.steps[i]); await fillStep(page, J.steps[i], i, []); await act(page, J.steps[i]); }
    const step = J.steps[entry.step]; await arrive(page, step);
    await fillStep(page, { ...step, fill: Object.fromEntries(Object.entries(step.fill).map(([k, v]) => [k, k === entry.selector ? probeValue : v])) }, entry.step, []);
    const urlBefore = page.url(), textBefore = await evalIn(page, '() => visibleText()');
    await act(page, step);
    const urlAfter = page.url(), textAfter = await evalIn(page, '() => visibleText()');
    const formStill = await page.locator(entry.selector).count() > 0;
    res.nativeValidation = await page.evaluate(() => { const e = [...document.querySelectorAll(':invalid')].find(x => x.validationMessage); return e ? { field: e.name || e.id, message: e.validationMessage } : null; });
    const before = new Set(textBefore.split('\n').map(norm).filter(Boolean));
    const newText = textAfter.split('\n').map(norm).filter(l => l && !before.has(l));
    res.notAdvanced = normUrl(urlAfter) === normUrl(urlBefore) || formStill; res.urlBefore = urlBefore; res.urlAfter = urlAfter; res.newText = newText.slice(0, 5);
    const blockedWithMessage = res.notAdvanced && (newText.length > 0 || !!res.nativeValidation);
    if (blockedWithMessage) { res.holds = true; res.evidence = newText.length ? 'new visible text' : 'native constraint validation'; }
    else if (declared) { res.holds = false; res.evidence = res.notAdvanced ? 'did not advance but no message' : 'advanced with an input error in a declared-constrained field'; }
    else { res.holds = null; res.tested = false; res.why = 'probed field has no declared constraint and the step advanced; the field may be optional, nothing proven'; }
  } catch (e) { res.holds = null; res.tested = false; res.why = 'checked pass error: ' + String(e).slice(0, 160); }
  await bctx.close(); return res;
}

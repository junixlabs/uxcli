// One planted input error per journey, shared by 3.3.4 (was the error caught?) and 3.3.1 (was it identified and described?).
// Replays to the entry step, submits with one field carrying a deliberate error, reads the outcome. Runs only when the journey declares checkedPass: true; cached on ctx.
import { norm, normUrl } from './util.js';
import { arrive, fillStep, act, evalIn } from './browser.js';

export async function plantError(ctx) {
  if (ctx.planted) return ctx.planted;
  const { J, recorded, commitIdx, browser } = ctx;
  const upTo = commitIdx >= 0 ? commitIdx : J.steps.length;
  const pre = recorded.filter(r => r.step < upTo).sort((a, b) => b.step - a.step);
  if (!pre.length) return (ctx.planted = { holds: null, tested: false, why: 'no entry step with recorded values' });
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
    // Native validation counts only where the browser actually enforces it: a form with novalidate (or a formnovalidate submitter) still populates validationMessage but never shows it or blocks the submit.
    res.nativeValidation = await page.evaluate(() => { const e = [...document.querySelectorAll(':invalid')].find(x => x.validationMessage && x.form && !x.form.noValidate && ![...x.form.querySelectorAll('[formnovalidate]')].length); return e ? { field: e.name || e.id, message: e.validationMessage } : null; });
    const before = new Set(textBefore.split('\n').map(norm).filter(Boolean));
    const newText = textAfter.split('\n').map(norm).filter(l => l && !before.has(l));
    res.notAdvanced = normUrl(urlAfter) === normUrl(urlBefore) || formStill; res.urlBefore = urlBefore; res.urlAfter = urlAfter; res.newText = newText.slice(0, 5); res.newTextCount = newText.length;
    // Identification signals for 3.3.1, read on the probed field while the rejected form is still on screen.
    if (formStill) res.identification = await evalEl(page, entry.selector, newText);
    const blockedWithMessage = res.notAdvanced && (newText.length > 0 || !!res.nativeValidation);
    if (blockedWithMessage) { res.holds = true; res.evidence = newText.length ? 'new visible text' : 'native constraint validation'; }
    else if (declared) { res.holds = false; res.evidence = res.notAdvanced ? 'did not advance but no message' : 'advanced with an input error in a declared-constrained field'; }
    else { res.holds = null; res.tested = false; res.why = 'probed field has no declared constraint and the step advanced; the field may be optional, nothing proven'; }
  } catch (e) { res.holds = null; res.tested = false; res.why = 'checked pass error: ' + String(e).slice(0, 160); }
  await bctx.close(); return (ctx.planted = res);
}

// Which of the 3.3.1 signals hold for the field: aria-invalid, aria-describedby/aria-errormessage to new text, new text in the field's own container, new text naming the field's label.
async function evalEl(page, selector, newText) {
  return page.locator(selector).first().evaluate((el, newText) => {
    const norm = s => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
    const vis = n => { if (!n || !n.getClientRects().length) return false; const cs = getComputedStyle(n); return cs.visibility !== 'hidden' && cs.display !== 'none'; };
    const lines = t => norm(t).split(/\n/).map(norm).filter(Boolean);
    const isNew = t => lines(t).some(l => newText.includes(l)) || newText.some(n => n && norm(t).includes(n));
    const ids = ((el.getAttribute('aria-describedby') || '') + ' ' + (el.getAttribute('aria-errormessage') || '')).split(/\s+/).filter(Boolean);
    const described = ids.map(id => document.getElementById(id)).filter(n => n && vis(n)).map(n => n.innerText || n.textContent).filter(t => isNew(t));
    let label = el.getAttribute('aria-label') || '';
    const lb = el.getAttribute('aria-labelledby'); if (!label && lb) label = lb.split(/\s+/).map(id => document.getElementById(id)?.textContent || '').join(' ');
    if (!label && el.id) label = document.querySelector('label[for="' + CSS.escape(el.id) + '"]')?.textContent || '';
    if (!label) label = el.closest('label')?.textContent || el.getAttribute('title') || el.getAttribute('placeholder') || '';
    label = norm(label);
    let container = el.parentElement; while (container && container !== document.body && container.querySelectorAll('input, select, textarea').length > 1) container = container.parentElement;
    const containerNew = container && container !== document.body ? lines(container.innerText || '').filter(l => newText.includes(l)) : [];
    const labelNew = label ? newText.filter(n => n.includes(label)) : [];
    return { ariaInvalid: el.getAttribute('aria-invalid') === 'true', described: described.slice(0, 2), containerNew: containerNew.slice(0, 2), labelNew: labelNew.slice(0, 2), label };
  }, newText);
}

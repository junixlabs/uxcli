// Browser helpers shared by the run and by probes that replay steps.
import { chromium } from 'playwright-core';
import { THIRD, CHROME, normUrl } from './util.js';

export async function launch() {
  const executablePath = process.env.UXCLI_CHROME || process.env.CHROME_EXE || undefined;
  try { return await chromium.launch({ executablePath, headless: true }); }
  catch (e) { if (/executable doesn't exist|install/i.test(String(e))) throw new Error('no Chromium for playwright-core. Run: npx playwright-core install chromium-headless-shell   (or set UXCLI_CHROME to a Chromium binary)'); throw e; }
}

// In-page collectors. Injected as source so every probe reads the DOM the same way.
export const PAGE_FNS = `
  const THIRD = ${JSON.stringify(THIRD)}; const CHROME = ${JSON.stringify(CHROME)};
  const norm = s => String(s ?? '').trim().toLowerCase().replace(/\\s+/g, ' ');
  const vis = el => { if (!el.getClientRects().length) return false; const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0; };
  const third = el => !!el.closest(THIRD);
  const label = el => {
    if (el.getAttribute('aria-label')) return el.getAttribute('aria-label');
    const lb = el.getAttribute('aria-labelledby'); if (lb) { const t = lb.split(/\\s+/).map(id => document.getElementById(id)?.textContent || '').join(' ').trim(); if (t) return t; }
    if (el.id) { const l = document.querySelector('label[for="' + CSS.escape(el.id) + '"]'); if (l && l.textContent.trim()) return l.textContent; }
    const wrap = el.closest('label'); if (wrap) { const t = wrap.textContent.trim(); if (t) return t; }
    return el.getAttribute('title') || el.getAttribute('placeholder') || '';
  };
  const identity = el => {
    const ac = (el.getAttribute('autocomplete') || '').trim().toLowerCase().split(/\\s+/).filter(Boolean);
    const section = ac.find(t => t.startsWith('section-') || t === 'shipping' || t === 'billing') || '';
    const token = ac.filter(t => !(t.startsWith('section-') || t === 'shipping' || t === 'billing')).pop() || '';
    const fs = el.closest('fieldset'); const legend = fs ? norm(fs.querySelector('legend')?.textContent) : '';
    return { autocomplete: token, section, legend, name: el.getAttribute('name') || '', type: (el.getAttribute('type') || el.tagName).toLowerCase(), label: norm(label(el)), tag: el.tagName.toLowerCase(), id: el.id || '' };
  };
  const editable = el => !el.disabled && !el.readOnly && vis(el) && !third(el) && !['hidden','password','submit','button','search','reset','image','file','checkbox','radio'].includes((el.getAttribute('type')||'').toLowerCase());
  const processInputs = () => { const form = document.querySelector('[data-uxcli-scope]'); if (!form) return []; return [...form.querySelectorAll('input, textarea, select')].filter(el => editable(el) && !el.closest(CHROME)).map(el => ({ ...identity(el), value: el.tagName === 'SELECT' ? (el.selectedOptions[0]?.textContent || el.value) : el.value })); };
  const visibleText = () => { const hidden = [...document.querySelectorAll(THIRD)]; hidden.forEach(e => e.setAttribute('data-uxcli-hide', '1')); const st = document.createElement('style'); st.textContent = '[data-uxcli-hide]{display:none!important}'; document.head.appendChild(st); const t = document.body.innerText; st.remove(); hidden.forEach(e => e.removeAttribute('data-uxcli-hide')); return t; };
  const readTexts = () => (document.querySelector('main') || document.body).textContent + '\\u0000' + [...document.querySelectorAll('input, textarea, select')].map(e => e.value).join('\\u0001');
  const fields = () => [...document.querySelectorAll('input, textarea, select')].filter(e => vis(e) && !third(e)).map(e => ({ value: e.tagName === 'SELECT' ? (e.selectedOptions[0]?.textContent || e.value) : e.value, ro: e.readOnly || e.disabled, editable: editable(e) }));
  const controls = () => [...document.querySelectorAll('a[href], button, [role=button], input[type=submit], input[type=button]')].filter(e => vis(e) && !third(e) && !e.closest(CHROME)).map(e => ({ href: e.href || '', text: norm(e.textContent || e.value || e.getAttribute('aria-label')) }));
  const navs = () => { const all = [...document.querySelectorAll('nav, [role="navigation"]')].filter(n => !third(n)); let un = 0; return all.map(n => { const al = n.getAttribute('aria-label'); const lb = n.getAttribute('aria-labelledby'); let name = al || (lb ? lb.split(/\\s+/).map(id => document.getElementById(id)?.textContent || '').join(' ') : ''); name = norm(name); const key = name ? 'name:' + name : 'unnamed:' + (un++); const links = [...n.querySelectorAll('a[href], button, [role="link"], [role="menuitem"], [role="tab"]')].filter(a => !third(a) && vis(a) && !a.closest('a[href] *, button *')).map(a => ({ href: a.href || '', text: norm(a.textContent) || norm(a.getAttribute('aria-label')) || '', kind: a.tagName === 'A' ? 'link' : 'control' })); return { key, links }; }); };
`;
export const evalIn = (page, body) => page.evaluate(new Function(PAGE_FNS + ' return (' + body + ')();'));
export const evalEl = (locator, body) => locator.evaluate(new Function('el', PAGE_FNS + ' return (' + body + ')(el);'));

export async function settle(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
  await page.waitForLoadState('load', { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(300);
}
export async function arrive(page, step) {
  if (step.url && normUrl(page.url()) !== normUrl(step.url)) { await page.goto(step.url, { waitUntil: 'load', timeout: 45000 }); await settle(page); return 'goto'; }
  await settle(page); return 'flow';
}
export async function noise(page) { const a = await evalIn(page, '() => readTexts()'); await page.waitForTimeout(600); const b = await evalIn(page, '() => readTexts()'); return a !== b; }

// Mark the process scope for this step: the submit control's form, else the nearest region around the control.
export async function markScope(page, step) {
  await page.evaluate(() => document.querySelectorAll('[data-uxcli-scope]').forEach(f => f.removeAttribute('data-uxcli-scope')));
  const sel = step.submit || step.click; if (!sel) return null;
  try {
    const ctl = page.locator(sel).first(); if (!await ctl.count()) return null;
    return await ctl.evaluate(el => { const f = el.closest('form'); if (f) { f.setAttribute('data-uxcli-scope', '1'); return 'form'; } const c = el.closest('fieldset, section, article, [role=region], [role=main], main') || document.querySelector('main') || document.body; c.setAttribute('data-uxcli-scope', '1'); return 'region:' + c.tagName.toLowerCase(); });
  } catch { return null; }
}

// Fill a step's fields. Records every non-password value with the field's identity; returns the step's auth flag.
export async function fillStep(page, step, idx, recorded) {
  let auth = false;
  for (const [sel, spec] of Object.entries(step.fill || {})) {
    const value = typeof spec === 'object' ? spec.value : spec; const marks = typeof spec === 'object' ? { essential: !!spec.essential, security: !!spec.security } : {};
    const loc = page.locator(sel).first();
    const id = await evalEl(loc, 'el => { const i = identity(el); i.required = el.required || el.getAttribute("aria-required") === "true"; i.minlength = el.getAttribute("minlength") ? parseInt(el.getAttribute("minlength"), 10) : 0; return i; }');
    if (id.tag === 'select') await loc.selectOption({ label: String(value) }).catch(() => loc.selectOption(String(value))); else await loc.fill(String(value));
    const display = id.tag === 'select' ? await loc.evaluate(el => el.selectedOptions[0]?.textContent || el.value) : String(value);
    if (id.type === 'password') { auth = true; continue; }
    const credentialCandidate = /user|login|email/i.test(id.name + ' ' + id.id + ' ' + id.label) || id.type === 'email' || /^(username|email)$/.test(id.autocomplete);
    recorded.push({ ...id, ...marks, value: String(value), display, step: idx, selector: sel, credentialCandidate });
  }
  return auth;
}
// Perform the step's action. Returns 'submitDidNotNavigate' when a submit left the URL unchanged.
export async function act(page, step) {
  const sel = step.submit || step.click; if (!sel) return null;
  const before = page.url();
  const mark = await page.evaluate(() => { const f = document.querySelector('[data-uxcli-scope]'); if (f) f.setAttribute('data-uxcli-scope-before', '1'); const h = document.querySelector('main h1, h1, main h2, h2'); return h ? h.textContent.trim() : ''; });
  await page.locator(sel).first().click({ timeout: 15000 });
  await page.waitForFunction(u => location.href !== u, before, { timeout: 5000 }).catch(() => {});
  if (step.expect) await page.locator(step.expect).first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  await settle(page);
  if (!step.submit || normUrl(page.url()) !== normUrl(before)) return null;
  // Same URL after a submit: the step still advanced when the journey's `expect` is visible (project), or the submitted form is gone / the heading changed (spec).
  if (step.expect && await page.locator(step.expect).first().isVisible().catch(() => false)) return 'advancedWithoutNavigation (expect, project)';
  const adv = await page.evaluate(h0 => { const f = document.querySelector('[data-uxcli-scope-before]'); const gone = !f || !f.isConnected || getComputedStyle(f).display === 'none'; const h = document.querySelector('main h1, h1, main h2, h2'); const h1 = h ? h.textContent.trim() : ''; return { gone, heading: h1 !== h0 }; }, mark);
  if (adv.gone || adv.heading) return `advancedWithoutNavigation (${adv.gone ? 'submitted form gone' : 'heading changed'})`;
  return 'submitDidNotNavigate';
}
export async function screen(page, i, rec) {
  return { step: i, url: rec.url, noise: rec.noise, text: await evalIn(page, '() => visibleText()'), ro: await evalIn(page, '() => fields()'), links: await evalIn(page, '() => controls()') };
}

// Evidence: screenshot of a region with the cited fields outlined. Returns a PNG buffer or null.
export async function shot(page, regionSelector, highlight = []) {
  try {
    await page.evaluate(sels => { for (const s of sels) for (const el of document.querySelectorAll(s)) { el.setAttribute('data-uxcli-mark', '1'); el.style.outline = '3px solid #d40000'; el.style.outlineOffset = '2px'; } }, highlight);
    const loc = regionSelector ? page.locator(regionSelector).first() : null;
    const buf = loc && await loc.count() && await loc.isVisible() ? await loc.screenshot({ timeout: 5000 }) : await page.screenshot({ timeout: 5000 });
    await page.evaluate(() => document.querySelectorAll('[data-uxcli-mark]').forEach(el => { el.style.outline = ''; el.style.outlineOffset = ''; el.removeAttribute('data-uxcli-mark'); }));
    return buf;
  } catch { return null; }
}
export const fieldSelector = f => f.id ? '#' + CSS_escape(f.id) : f.name ? `[name="${f.name.replace(/"/g, '\\"')}"]` : null;
const CSS_escape = s => s.replace(/([^a-zA-Z0-9_-])/g, '\\$1');

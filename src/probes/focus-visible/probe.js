// page.focus-visible · WCAG 2.4.7. Spec in spec.md; falsification pair in pair.json.
import { THIRD } from '../../util.js';
import { PNG } from '../../png.js';
const PAD = 48, VW = 1280, VH = 800;

export default {
  id: 'page.focus-visible', sc: '2.4.7', kind: 'page',
  method: { status: 'method-unproven', record: 'v3.6 (pixel measurement after one real Tab press) has ACT oj04fd 7/7; the unseen-page run with the packaged code is pending' },
  async measure(page) {
    const n = await page.evaluate(THIRD => {
      window.__uxfv = [...document.querySelectorAll('a[href],button,input,select,textarea,summary,[tabindex],[contenteditable]')]
        .filter(e => { const ti = e.getAttribute('tabindex'); if (ti !== null && parseInt(ti) < 0) return false; if (e.disabled) return false; if (e.closest(THIRD)) return false; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') return false; return e.getClientRects().length > 0; })
        .slice(0, 80);
      if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
      return window.__uxfv.length;
    }, THIRD);
    if (n === 0) return { verdict: 'not-applicable', why: 'no focusable element', candidates: 0 };
    // One real Tab key press first: pages that draw rings only after keyboard use (a `no-focus-outline` class removed on keydown) are measured in the state a keyboard user is in.
    await page.keyboard.press('Tab'); await page.evaluate(() => { if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); });
    const shot = clip => page.screenshot({ clip, animations: 'disabled', caret: 'hide', timeout: 5000 });
    const items = [];
    for (let i = 0; i < n; i++) {
      const t = await page.evaluate(async i => {
        const el = window.__uxfv[i]; el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' }); await new Promise(r => requestAnimationFrame(r));
        // Finish finite animations (scroll-reveal transforms) so the box is read in the state the screenshots freeze to.
        for (const a of document.getAnimations()) { try { const tm = a.effect?.getTiming?.(); if (tm && tm.iterations !== Infinity) a.finish(); } catch {} } await new Promise(r => requestAnimationFrame(r));
        // The box is the union of the control's own box and its content's box: an inline link wrapping an image has a one-line box while its ring is drawn around the image.
        const r0 = el.getBoundingClientRect(); const rg = document.createRange(); rg.selectNodeContents(el); const rc = rg.getBoundingClientRect();
        const x1 = Math.min(r0.left, rc.width ? rc.left : r0.left), y1 = Math.min(r0.top, rc.height ? rc.top : r0.top), x2 = Math.max(r0.right, rc.width ? rc.right : r0.right), y2 = Math.max(r0.bottom, rc.height ? rc.bottom : r0.bottom);
        const r = { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
        const sel = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
        const hit = document.elementFromPoint(Math.min(innerWidth - 1, Math.max(0, r.x + r.width / 2)), Math.min(innerHeight - 1, Math.max(0, r.y + r.height / 2)));
        return { sel, text: (el.textContent || el.value || el.getAttribute('aria-label') || '').trim().slice(0, 40), x: r.x, y: r.y, w: r.width, h: r.height, occluded: !(hit && (hit === el || el.contains(hit) || hit.contains(el))) };
      }, i);
      const x0 = Math.max(0, t.x - PAD), y0 = Math.max(0, t.y - PAD);
      const clip = { x: x0, y: y0, width: Math.min(VW - x0, t.x + t.w + PAD - x0), height: Math.min(VH - y0, t.y + t.h + PAD - y0) };
      const item = { sel: t.sel, text: t.text };
      if (t.w === 0 || t.h === 0) { items.push({ ...item, unmeasured: 'zero-size' }); continue; }
      if (clip.width < 1 || clip.height < 1 || t.x + t.w < 0 || t.y + t.h < 0 || t.x > VW || t.y > VH) { items.push({ ...item, unmeasured: 'outside the viewport after scrolling' }); continue; }
      if (t.occluded) { items.push({ ...item, unmeasured: 'covered by another element' }); continue; }
      let a1, a2; try { a1 = await shot(clip); a2 = await shot(clip); } catch { items.push({ ...item, unmeasured: 'screenshot timed out' }); continue; }
      if (PNG.diff(a1, a2) > 0) { items.push({ ...item, unmeasured: 'changes with no interaction' }); continue; }
      const focused = await page.evaluate(i => { const el = window.__uxfv[i]; el.focus({ focusVisible: true, preventScroll: true }); return document.activeElement === el; }, i);
      if (!focused) { items.push({ ...item, unmeasured: 'did not take focus' }); continue; }
      await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      let b; try { b = await shot(clip); } catch { await page.evaluate(i => window.__uxfv[i].blur(), i).catch(() => {}); items.push({ ...item, unmeasured: 'screenshot timed out' }); continue; }
      await page.evaluate(i => window.__uxfv[i].blur(), i);
      const changed = PNG.diff(a1, b);
      if (changed === 0) {
        // Nothing changed near the control. Before calling that a fail, look at the whole viewport: a change away from the control
        // (a card highlighted, a heading underlined, a menu opening) may be the indicator, or may be unrelated; either way it is not a measured absence.
        let v1, v2, vb; try { v1 = await page.screenshot({ animations: 'disabled', caret: 'hide', timeout: 8000 }); v2 = await page.screenshot({ animations: 'disabled', caret: 'hide', timeout: 8000 }); } catch { items.push({ ...item, unmeasured: 'screenshot timed out' }); continue; }
        if (PNG.diff(v1, v2) > 0) { items.push({ ...item, unmeasured: 'changes with no interaction' }); continue; }
        const refocused = await page.evaluate(i => { const el = window.__uxfv[i]; el.focus({ focusVisible: true, preventScroll: true }); return document.activeElement === el; }, i);
        await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
        try { vb = await page.screenshot({ animations: 'disabled', caret: 'hide', timeout: 8000 }); } catch { await page.evaluate(i => window.__uxfv[i].blur(), i).catch(() => {}); items.push({ ...item, unmeasured: 'screenshot timed out' }); continue; }
        await page.evaluate(i => window.__uxfv[i].blur(), i);
        const away = refocused ? PNG.diff(v1, vb) : 0;
        if (away > 0) { items.push({ ...item, unmeasured: 'changes away from the control', awayPixels: away }); continue; }
      }
      items.push({ ...item, changedPixels: changed, crop: clip, before: a1, after: b });
    }
    const measured = items.filter(i => i.changedPixels !== undefined), unmeasured = items.filter(i => i.unmeasured);
    const fails = measured.filter(i => i.changedPixels === 0);
    const reasons = {}; for (const u of unmeasured) reasons[u.unmeasured] = (reasons[u.unmeasured] || 0) + 1;
    const pub = i => ({ sel: i.sel, text: i.text, changedPixels: i.changedPixels });
    const base = { candidates: n, measured: measured.length, unmeasured: reasons };
    if (fails.length) return { verdict: 'fail', why: `${fails.length} of ${measured.length} measured controls show no pixel change on focus`, targets: fails.map(pub), evidence: fails.map(i => ({ sel: i.sel, before: i.before, after: i.after })), ...base };
    if (measured.length < Math.max(1, n / 2)) return { verdict: 'unmeasurable', why: `only ${measured.length} of ${n} controls could be measured (${Object.entries(reasons).map(([k, v]) => `${v} ${k}`).join(', ')})`, ...base };
    return { verdict: 'pass', why: `${measured.length} controls each change visibly on focus${unmeasured.length ? `, ${unmeasured.length} not measured` : ''}`, ...base };
  },
};

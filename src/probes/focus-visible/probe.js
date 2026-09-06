// page.focus-visible · WCAG 2.4.7. Spec in spec.md; falsification pair in pair.json.
import { THIRD } from '../../util.js';
import { PNG } from '../../png.js';
const PAD = 48, VW = 1280, VH = 800;

export default {
  id: 'page.focus-visible', sc: '2.4.7', kind: 'page',
  method: { status: 'method-validated', record: '20 unseen pages (list 4, 2026-09-06, drawn after the v3.8 definition was committed): 62 failing controls on 7 pages, 58 re-measured by a real Tab press and a whole-viewport diff, 4 by the viewport diff alone (the check could not land Tab on them), 0 false fails, 2 pages no verdict; 60 earlier unseen pages found and fixed seven false-fail classes (spec Revisions); ACT oj04fd 7/7 with the packaged code' },
  async measure(page) {
    const n = await page.evaluate(THIRD => {
      window.__uxfv = [...document.querySelectorAll('a[href],button,input,select,textarea,summary,[tabindex],[contenteditable]')]
        .filter(e => { const ti = e.getAttribute('tabindex'); if (ti !== null && parseInt(ti) < 0) return false; if (e.disabled) return false; if (e.closest(THIRD)) return false; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') return false; return e.getClientRects().length > 0; })
        .slice(0, 80);
      if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
      return window.__uxfv.length;
    }, THIRD);
    if (n === 0) return { verdict: 'not-applicable', why: 'no focusable element', candidates: 0 };
    const shot = clip => page.screenshot({ clip, animations: 'disabled', caret: 'hide', timeout: 5000 });
    const full = () => page.screenshot({ animations: 'disabled', caret: 'hide', timeout: 8000 });
    const frames = () => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const blur = () => page.evaluate(() => { if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); }).catch(() => {});
    const items = [], hidden = [];
    for (let i = 0; i < n; i++) {
      const readBox = (i, scroll) => page.evaluate(async ([i, scroll]) => {
        const el = window.__uxfv[i]; if (scroll) { el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' }); await new Promise(r => requestAnimationFrame(r)); }
        // Finish finite animations (scroll-reveal transforms) so the box is read in the state the screenshots freeze to.
        for (const a of document.getAnimations()) { try { const tm = a.effect?.getTiming?.(); if (tm && tm.iterations !== Infinity) a.finish(); } catch {} } await new Promise(r => requestAnimationFrame(r));
        // The box is the union of the control's own box and its content's box: an inline link wrapping an image has a one-line box while its ring is drawn around the image.
        const r0 = el.getBoundingClientRect(); const rg = document.createRange(); rg.selectNodeContents(el); const rc = rg.getBoundingClientRect();
        const x1 = Math.min(r0.left, rc.width ? rc.left : r0.left), y1 = Math.min(r0.top, rc.height ? rc.top : r0.top), x2 = Math.max(r0.right, rc.width ? rc.right : r0.right), y2 = Math.max(r0.bottom, rc.height ? rc.bottom : r0.bottom);
        const r = { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
        const sel = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
        // Painted: effective opacity above zero, and a hit test at the box centre or one of four inner points lands on the control or its content.
        // Clipped: an overflow-hidden ancestor whose box the control lies outside of. A hit on an ancestor means the control is not painted there (hidden tab panel).
        let opacity = 1, clipped = false; for (let a = el; a; a = a.parentElement) { const cs = getComputedStyle(a); opacity *= parseFloat(cs.opacity); if (a !== el && /hidden|clip|scroll|auto/.test(cs.overflow + cs.overflowX + cs.overflowY)) { const b = a.getBoundingClientRect(); if (Math.min(r.x + r.width, b.right) - Math.max(r.x, b.left) <= 0 || Math.min(r.y + r.height, b.bottom) - Math.max(r.y, b.top) <= 0) clipped = true; } }
        const pts = [[.5, .5], [.25, .5], [.75, .5], [.5, .25], [.5, .75]].map(([fx, fy]) => [Math.min(innerWidth - 1, Math.max(0, r.x + r.width * fx)), Math.min(innerHeight - 1, Math.max(0, r.y + r.height * fy))]);
        const hits = pts.map(([x, y]) => document.elementFromPoint(x, y)); const own = hits.some(h => h && (h === el || el.contains(h)));
        const covered = !own && hits.some(h => h && !h.contains(el));
        return { sel, text: (el.textContent || el.value || el.getAttribute('aria-label') || '').trim().slice(0, 40), x: r.x, y: r.y, w: r.width, h: r.height, opacity, clipped, own, covered };
      }, [i, scroll]);
      const cropOf = t => { const x0 = Math.max(0, t.x - PAD), y0 = Math.max(0, t.y - PAD); return { x: x0, y: y0, width: Math.min(VW - x0, t.x + t.w + PAD - x0), height: Math.min(VH - y0, t.y + t.h + PAD - y0) }; };
      const offscreen = (t, clip) => clip.width < 1 || clip.height < 1 || t.x + t.w < 0 || t.y + t.h < 0 || t.x > VW || t.y > VH;
      const t = await readBox(i, true); let clip = cropOf(t);
      const item = { sel: t.sel, text: t.text };
      if (t.w === 0 || t.h === 0) { items.push({ ...item, unmeasured: 'zero-size' }); continue; }
      if (offscreen(t, clip)) { items.push({ ...item, unmeasured: 'outside the viewport after scrolling' }); continue; }
      if (t.opacity === 0 || t.clipped || (!t.own && !t.covered)) { hidden.push({ ...item, how: t.opacity === 0 ? 'opacity 0 on the control or an ancestor' : t.clipped ? 'clipped by an overflow-hidden ancestor it lies outside of' : 'not painted at its own box' }); items.push({ ...item, unmeasured: 'not painted' }); continue; }
      if (t.covered) { items.push({ ...item, unmeasured: 'covered by another element' }); continue; }
      // Focus arrives by a real Tab key press: focus the control, Shift+Tab to whatever precedes it, Tab back. Pages that draw rings only when
      // focus follows a key event are measured as a keyboard user meets them.
      const tabTo = async i => {
        const landed = await page.evaluate(i => { const el = window.__uxfv[i]; el.focus({ preventScroll: true }); return document.activeElement === el; }, i);
        if (!landed) return 'did not take focus';
        await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
        return (await page.evaluate(i => document.activeElement === window.__uxfv[i], i)) ? null : 'Tab did not reach the control';
      };
      const notReached = await tabTo(i); if (notReached) { await blur(); items.push({ ...item, unmeasured: notReached }); continue; }
      await frames();
      // The predecessor's focus may have opened something or scrolled the page: read the box again in the focused state.
      const t2 = await readBox(i, false); clip = cropOf(t2);
      if (t2.w === 0 || t2.h === 0 || offscreen(t2, clip)) { await blur(); items.push({ ...item, unmeasured: 'outside the viewport after Tab' }); continue; }
      if (t2.opacity === 0 || t2.clipped || (!t2.own && !t2.covered)) { await blur(); items.push({ ...item, unmeasured: 'not painted after Tab' }); continue; }
      if (t2.covered) { await blur(); items.push({ ...item, unmeasured: 'covered after Tab' }); continue; }
      let b, bv; try { b = await shot(clip); bv = await full(); } catch { await blur(); items.push({ ...item, unmeasured: 'screenshot timed out' }); continue; }
      await blur(); await frames();
      // A focus trap that takes focus back on blur would put the ring into the "unfocused" shots.
      const stillFocused = await page.evaluate(() => document.activeElement && document.activeElement !== document.body && document.activeElement !== document.documentElement);
      if (stillFocused) { items.push({ ...item, unmeasured: 'focus returned on blur' }); continue; }
      let a1, a2; try { a1 = await shot(clip); a2 = await shot(clip); } catch { items.push({ ...item, unmeasured: 'screenshot timed out' }); continue; }
      if (PNG.diff(a1, a2) > 0) { items.push({ ...item, unmeasured: 'changes with no interaction' }); continue; }
      let changed = PNG.diff(a1, b), av = null;
      if (changed === 0) {
        // Nothing changed near the control. Before calling that a fail, look at the whole viewport: a change away from the control
        // (a card highlighted, a heading underlined, a menu opening) may be the indicator, or may be unrelated; either way it is not a measured absence.
        try { av = await full(); } catch { items.push({ ...item, unmeasured: 'screenshot timed out' }); continue; }
        const away = PNG.diff(av, bv);
        if (away > 0) { items.push({ ...item, unmeasured: 'changes away from the control', awayPixels: away }); continue; }
      }
      if (changed === 0) {
        // Still nothing. An indicator drawn by script on a timer would be missed two frames after focus: Tab again, wait 250 ms, look once more.
        const again = await tabTo(i); if (again) { await blur(); items.push({ ...item, unmeasured: again }); continue; }
        await page.waitForTimeout(250);
        let b2, bv2; try { b2 = await shot(clip); bv2 = await full(); } catch { await blur(); items.push({ ...item, unmeasured: 'screenshot timed out' }); continue; }
        await blur(); await frames();
        changed = PNG.diff(a1, b2); if (changed > 0) b = b2;
        else if (PNG.diff(av, bv2) > 0) { items.push({ ...item, unmeasured: 'changes away from the control', awayPixels: PNG.diff(av, bv2) }); continue; }
      }
      items.push({ ...item, changedPixels: changed, crop: clip, before: a1, after: b });
    }
    const measured = items.filter(i => i.changedPixels !== undefined), unmeasured = items.filter(i => i.unmeasured);
    const fails = measured.filter(i => i.changedPixels === 0);
    const reasons = {}; for (const u of unmeasured) reasons[u.unmeasured] = (reasons[u.unmeasured] || 0) + 1;
    const pub = i => ({ sel: i.sel, text: i.text, changedPixels: i.changedPixels });
    const base = { candidates: n, measured: measured.length, unmeasured: reasons };
    if (hidden.length) base.finding = { kind: 'hidden-focusable', why: `${hidden.length} control${hidden.length > 1 ? 's are' : ' is'} in the tab order but not painted (${[...new Set(hidden.map(h => h.how))].join('; ')}); not measured for 2.4.7`, targets: hidden.slice(0, 5) };
    if (fails.length) return { verdict: 'fail', why: `${fails.length} of ${measured.length} measured controls show no pixel change on focus`, targets: fails.map(pub), evidence: fails.map(i => ({ sel: i.sel, before: i.before, after: i.after })), ...base };
    if (measured.length < Math.max(1, (n - hidden.length) / 2)) return { verdict: 'unmeasurable', why: `only ${measured.length} of ${n - hidden.length} controls could be measured (${Object.entries(reasons).map(([k, v]) => `${v} ${k}`).join(', ')})`, ...base };
    return { verdict: 'pass', why: `${measured.length} controls each change visibly on focus${unmeasured.length ? `, ${unmeasured.length} not measured` : ''}`, ...base };
  },
};

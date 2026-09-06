// page.focus-visible · WCAG 2.4.7. Spec in spec.md; falsification pair in pair.json.
import { THIRD } from '../../util.js';

export default {
  id: 'page.focus-visible', sc: '2.4.7', kind: 'page',
  async measure(page) {
    const r = await page.evaluate(async ([THIRD, maxTargets]) => {
      const PROPS = ['outline-style', 'outline-width', 'outline-color', 'box-shadow', 'border-color', 'background-color', 'color', 'text-decoration-line', 'opacity', 'visibility', 'display'];
      const raf2 = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      // Elements with an infinitely repeating animation (pulses, spinners) are excluded from the document diff; a target is always diffed itself.
      const animating = new Set(document.getAnimations().filter(a => a.effect?.getTiming?.().iterations === Infinity).map(a => a.effect.target).filter(Boolean));
      const all = keep => [...document.querySelectorAll('body, body *')].filter(e => e === keep || !animating.has(e));
      const snap = els => els.map(el => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); const pinned = cs.position === 'fixed' || cs.position === 'sticky'; const zero = r.width === 0 && r.height === 0; const rect = zero ? [0] : pinned ? [r.width, r.height] : [r.x + scrollX, r.y + scrollY, r.width, r.height]; return PROPS.map(p => cs.getPropertyValue(p)).join('|') + '|' + rect.map(v => Math.round(v)).join(','); });
      const sel = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
      const cands = [...document.querySelectorAll('a[href],button,input,select,textarea,summary,[tabindex],[contenteditable]')]
        .filter(e => { const ti = e.getAttribute('tabindex'); if (ti !== null && parseInt(ti) < 0) return false; if (e.disabled) return false; if (e.closest(THIRD)) return false; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') return false; return e.getClientRects().length > 0; });
      const targets = cands.slice(0, maxTargets);
      // Revision 2026-09-06: blur first, so an autofocused control is not already focused in its own before-snapshot.
      if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); await raf2();
      // Quiesce: wait for a 400 ms window with no change (up to six windows, transitions from the blur included) before the noise window is judged.
      const els0 = all(); let noise = 0, quiet = 0;
      for (let w = 0; w < 6; w++) { const n0 = snap(els0); await new Promise(r => setTimeout(r, 400)); const n1 = snap(els0); noise = 0; for (let i = 0; i < n0.length; i++) if (n0[i] !== n1[i]) noise++; if (noise === 0) break; quiet = w + 1; }
      const items = [];
      for (const el of targets) {
        const els = all(el); const before = snap(els);
        el.focus({ focusVisible: true, preventScroll: false }); await raf2();
        if (document.activeElement !== el) { items.push({ sel: sel(el), skipped: 'no-focus' }); continue; }
        const after = snap(els);
        let changed = 0, selfChanged = false; for (let i = 0; i < before.length; i++) if (before[i] !== after[i] && els[i].isConnected) { changed++; if (els[i] === el) selfChanged = true; }
        el.blur(); await raf2();
        const r = el.getBoundingClientRect();
        items.push({ sel: sel(el), text: (el.textContent || el.value || '').trim().slice(0, 40), changed, selfChanged, shift: !selfChanged && changed > Math.max(20, els.length * 0.3), inViewport: r.bottom > 0 && r.top < innerHeight });
      }
      const focusable = items.filter(i => !i.skipped);
      return { candidates: cands.length, tested: targets.length, focusable: focusable.length, noise, settledAfter: quiet, animatingExcluded: animating.size, fails: focusable.filter(i => i.changed === 0), shifted: focusable.filter(i => i.shift).length };
    }, [THIRD, 80]);
    const base = { candidates: r.candidates, tested: r.tested, noise: r.noise, settledAfter: r.settledAfter, animatingExcluded: r.animatingExcluded, shifted: r.shifted };
    if (r.focusable === 0) return { verdict: 'not-applicable', why: 'no focusable element', ...base };
    if (r.noise > 0) return { verdict: 'unmeasurable', why: `document keeps changing with no interaction (${r.noise} elements in the last 400 ms window of 2.4 s)`, ...base };
    if (r.fails.length) return { verdict: 'fail', why: `${r.fails.length} of ${r.focusable} focusable elements change nothing on focus`, targets: r.fails, ...base };
    if (r.shifted) return { verdict: 'unmeasurable', why: `${r.shifted} targets move most of the page without changing themselves (layout shift)`, ...base };
    return { verdict: 'pass', why: `${r.focusable} focusable elements each change on focus`, ...base };
  },
};

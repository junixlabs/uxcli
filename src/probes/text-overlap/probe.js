// page.text-overlap · text painted over text · provenance opinion. Spec in spec.md; falsification pair in pair.json. Origin: junixlabs/uxcli#1.
import { THIRD } from '../../util.js';

// Collects every visible text box on the page and returns the pairs whose boxes intersect beyond the spec's bounds.
const COLLECT = ([THIRD, LIMIT]) => {
  const sel = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
  const moving = el => { for (let a = el; a && a.nodeType === 1; a = a.parentElement) if (a.getAnimations && a.getAnimations().some(x => x.playState === 'running')) return true; return false; };
  // Text inside a fixed or sticky bar is a layer that content scrolls under. A pair whose nearest pinned ancestors differ (one pinned and one not, or two different bars) is scroll state, not layout, and is skipped; two texts inside the same bar are measured.
  const pinned = el => { for (let a = el; a && a.nodeType === 1; a = a.parentElement) { const ps = getComputedStyle(a).position; if (ps === 'fixed' || ps === 'sticky') return a; } return null; };
  // Nearest block container: two boxes in the same one are lines or inline siblings of one flow (tight leading makes their content boxes touch), not one text painted over another.
  const blockOf = el => { for (let a = el; a && a.nodeType === 1 && a !== document.body; a = a.parentElement) { const cs = getComputedStyle(a); if (!/^inline\b/.test(cs.display) || cs.position === 'absolute' || cs.position === 'fixed') return a; } return document.body; };
  const shown = el => { for (let a = el; a && a.nodeType === 1; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false; if (a.getAttribute('aria-hidden') === 'true') return false; } return true; };
  const boxes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: n => n.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
  let n, seen = 0;
  while ((n = walker.nextNode()) && seen < LIMIT) {
    const el = n.parentElement; if (!el || el.closest(THIRD) || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(el.tagName)) continue;
    if (!shown(el) || moving(el)) continue; seen++;
    const range = document.createRange(); range.selectNodeContents(n);
    for (const r of range.getClientRects()) {
      if (r.width <= 0 || r.height <= 0 || r.right + scrollX <= 0 || r.bottom + scrollY <= 0) continue; // off the document, not merely off the viewport: earlier probes leave the page scrolled
      boxes.push({ el, sel: sel(el), text: n.textContent.trim().slice(0, 40), x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height, pinned: pinned(el), block: blockOf(el) });
    }
  }
  const pairs = [];
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j]; if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el) || a.pinned !== b.pinned || a.block === b.block) continue; // different pinned layers (or one pinned, one not): scroll state, not layout
    const x = Math.max(a.x, b.x), y = Math.max(a.y, b.y), r = Math.min(a.x + a.w, b.x + b.w), btm = Math.min(a.y + a.h, b.y + b.h);
    const w = r - x, h = btm - y; if (w < 2 || h < 2) continue;
    const small = Math.min(a.w * a.h, b.w * b.h); if (w * h < 0.1 * small) continue;
    pairs.push({ a: { sel: a.sel, text: a.text }, b: { sel: b.sel, text: b.text }, at: { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) } });
    if (pairs.length >= 30) break;
  }
  // a sample of two boxes in different blocks, for --prove
  let sample = null;
  for (let i = 0; i < boxes.length && !sample; i++) for (let j = i + 1; j < boxes.length; j++) { const a = boxes[i], b = boxes[j]; if (a.el !== b.el && !a.el.contains(b.el) && !b.el.contains(a.el)) { sample = { a: { sel: a.sel, x: a.x, y: a.y }, b: { sel: b.sel, x: b.x, y: b.y } }; a.el.setAttribute('data-uxcli-a', ''); b.el.setAttribute('data-uxcli-b', ''); break; } }
  return { boxes: boxes.length, pairs, sample };
};

// Finite animations and transitions are given up to 2.5 s to finish before text is read, so entrance motion is not measured as overlap. Infinite ones stay excluded per element.
// Sampled in a loop after two frames: transitions started by scroll observers begin a frame after the runner's settle, and a single early sample would miss them.
const settleAnimations = page => page.evaluate(() => new Promise(done => {
  const t0 = performance.now(); const finite = () => document.getAnimations().filter(a => { const t = a.effect?.getTiming?.(); return t && t.iterations !== Infinity && a.playState === 'running'; });
  const step = () => { if (performance.now() - t0 > 2500) return done('timeout'); const run = finite(); if (!run.length) return done('settled'); Promise.all(run.map(a => a.finished.catch(() => null))).then(() => requestAnimationFrame(() => requestAnimationFrame(step))); };
  requestAnimationFrame(() => requestAnimationFrame(step));
})).catch(() => null);

export default {
  id: 'page.text-overlap', sc: 'overlap', kind: 'page', provenance: 'opinion', rule: 'visible text is not painted over other visible text',
  method: { status: 'method-unproven', record: 'no recorded run on pages the probe had not seen (written from junixlabs/uxcli#1, 2026-09-08)' },
  async measure(page) {
    await settleAnimations(page);
    const r = await page.evaluate(COLLECT, [THIRD, 600]);
    const base = { provenance: 'opinion', rule: 'visible text is not painted over other visible text', boxes: r.boxes, sample: r.sample };
    if (r.boxes < 2) return { verdict: 'not-applicable', why: 'fewer than two visible text boxes', ...base };
    if (r.pairs.length) return { verdict: 'fail', why: `${r.pairs.length} pair${r.pairs.length > 1 ? 's' : ''} of text painted over each other`, targets: r.pairs, ...base };
    return { verdict: 'pass', why: `${r.boxes} text boxes, no two painted over each other`, ...base };
  },
  // --prove: the second sampled text element is moved onto the first with a transform; reached when their boxes intersect on re-read.
  async prove(page, prior) {
    // The sample is re-taken on this fresh load (same document order), which also stamps data-uxcli-a / data-uxcli-b on the two elements.
    const s = (await page.evaluate(COLLECT, [THIRD, 600])).sample; if (!s) return { mutation: 'one text moved onto another', reached: false, why: 'no two text boxes in different blocks to move' };
    const reached = await page.evaluate(([sa, sb]) => {
      const A = document.querySelector(sa), B = document.querySelector(sb); if (!A || !B) return false;
      const ra = A.getBoundingClientRect(), rb = B.getBoundingClientRect();
      B.style.setProperty('position', 'relative', 'important'); B.style.setProperty('transform', `translate(${ra.left - rb.left}px, ${ra.top - rb.top}px)`, 'important'); B.style.setProperty('z-index', '1', 'important');
      const a = A.getBoundingClientRect(), b = B.getBoundingClientRect();
      return Math.min(a.right, b.right) - Math.max(a.left, b.left) >= 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) >= 2;
    }, ['[data-uxcli-a]', '[data-uxcli-b]']).catch(() => false);
    return { mutation: `"${s.b.sel}" moved onto "${s.a.sel}"`, reached, ...(reached ? {} : { why: 'the moved text did not land on the other' }) };
  }
};

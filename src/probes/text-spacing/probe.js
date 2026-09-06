// page.text-spacing · WCAG 1.4.12 (ACT 24afc2 / 9e45ec / 78fd32). Spec in spec.md; falsification pair in pair.json.
import { THIRD } from '../../util.js';
const RULES = [['letter-spacing', 0.12, '24afc2'], ['word-spacing', 0.16, '9e45ec'], ['line-height', 1.5, '78fd32']];

export default {
  id: 'page.text-spacing', sc: '1.4.12', kind: 'page',
  method: { status: 'method-validated', record: '80 unseen pages (lists 1 to 4, 2026-09-06, definitions unchanged since 65ded6c, drawn before every list): 1 fail (reproduced), 0 false fails; ACT 24afc2/9e45ec/78fd32 62/62 with the packaged code' },
  async measure(page) {
    const act = await page.evaluate(([THIRD, RULES]) => {
      const sheetDeclares = (a, prop) => { try { for (const ss of document.styleSheets) for (const r of ss.cssRules || []) if (r.style && r.style.getPropertyValue(prop) && a.matches(r.selectorText)) return r.style.getPropertyPriority(prop) || 'normal'; } catch { } return null; };
      const origin = (el, prop) => { for (let a = el; a && a.nodeType === 1; a = a.parentElement) {
          const v = a.style.getPropertyValue(prop); const pr = a.style.getPropertyPriority(prop); const sheet = sheetDeclares(a, prop);
          if (v) { if (v === 'inherit' || v === 'unset') continue;
                   if (pr === 'important' || !sheet || sheet !== 'important') return { src: 'style-attr', important: pr === 'important', on: a };
                   return { src: 'stylesheet', important: false }; }
          if (sheet) return { src: 'stylesheet', important: false }; }
        return { src: 'none', important: false }; };
      const sel = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
      const out = { applicable: 0, fails: [] };
      for (const el of document.querySelectorAll('body, body *')) {
        if (!(el instanceof HTMLElement) || el.closest(THIRD)) continue;
        if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
        const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
        if (!(el.getClientRects().length > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && r.right > 0 && r.bottom > 0 && parseFloat(cs.opacity) > 0)) continue;
        const fs = parseFloat(cs.fontSize);
        for (const [prop, k, rule] of RULES) {
          const o = origin(el, prop); if (!(o.src === 'style-attr' && o.important)) continue;
          let value;
          if (prop === 'line-height') {
            const range = document.createRange(); range.selectNodeContents(el);
            const tops = new Set([...range.getClientRects()].filter(x => x.width > 0).map(x => Math.round(x.top)));
            if (tops.size < 2) continue;
            const span = document.createElement('span'); span.textContent = 'X'; span.style.cssText = 'display:inline-block;padding:0;margin:0;border:0;vertical-align:top';
            el.appendChild(span); value = span.getBoundingClientRect().height; span.remove();
          } else { const v = cs.getPropertyValue(prop); value = v === 'normal' ? 0 : parseFloat(v); }
          out.applicable++;
          if (!(value >= k * fs - 0.01)) out.fails.push({ sel: sel(el), lockedOn: o.on === el ? 'self' : sel(o.on), rule, property: prop, value: +value.toFixed(2), threshold: +(k * fs).toFixed(2), text: el.textContent.trim().slice(0, 40) });
        }
      }
      return out;
    }, [THIRD, RULES]);
    // Override breakage: apply the 1.4.12 user styles and count newly clipped or overlapping text containers. Reported as finding only.
    const over = await page.evaluate(([THIRD]) => {
      const textEls = [...document.querySelectorAll('body *')].filter(el => !el.closest(THIRD) && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && el.getClientRects().length > 0).slice(0, 400);
      const measure = () => textEls.map(el => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return { clipped: (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1), rect: [r.left, r.top, r.right, r.bottom] }; });
      const overlaps = m => { let n = 0; for (let i = 0; i < m.length; i++) for (let j = i + 1; j < m.length; j++) { const a = m[i].rect, b = m[j].rect; if (!(textEls[i].contains(textEls[j]) || textEls[j].contains(textEls[i])) && a[0] < b[2] - 1 && b[0] < a[2] - 1 && a[1] < b[3] - 1 && b[1] < a[3] - 1) n++; } return n; };
      const before = measure(); const ovBefore = overlaps(before);
      const st = document.createElement('style'); st.textContent = '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }';
      (document.head || document.documentElement).appendChild(st);
      const after = measure(); const ovAfter = overlaps(after); st.remove();
      return { textEls: textEls.length, newlyClipped: after.filter((a, i) => a.clipped && !before[i].clipped).length, newOverlaps: Math.max(0, ovAfter - ovBefore) };
    }, [THIRD]);
    const finding = (over.newlyClipped || over.newOverlaps) ? { kind: 'override-breakage', why: `with 1.4.12 user styles applied, ${over.newlyClipped} text containers clip and ${over.newOverlaps} new overlaps appear (not asserted by the ACT rules)` } : null;
    const base = { applicable: act.applicable, override: over, ...(finding ? { finding } : {}) };
    if (act.applicable === 0) return { verdict: 'not-applicable', why: 'no text whose spacing is locked by an !important style attribute', ...base };
    if (act.fails.length) return { verdict: 'fail', why: `${act.fails.length} locked spacing values below the 1.4.12 minimum`, targets: act.fails, ...base };
    return { verdict: 'pass', why: `${act.applicable} locked spacing values, all at or above the minimum`, ...base };
  },
};

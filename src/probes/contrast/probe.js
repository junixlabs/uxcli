// page.contrast · WCAG 1.4.3, delegated to axe-core color-contrast. Spec in spec.md; falsification pair in pair.json.
import { createRequire } from 'node:module'; import path from 'node:path';
import { THIRD } from '../../util.js';
const require = createRequire(import.meta.url);
export const AXE_VERSION = require('axe-core/package.json').version;
const AXE_PATH = path.join(path.dirname(require.resolve('axe-core/package.json')), 'axe.min.js');

export default {
  id: 'page.contrast', sc: '1.4.3', kind: 'page',
  method: { status: 'method-validated', record: '80 unseen pages (lists 1 to 4, 2026-09-06, definitions unchanged since 65ded6c, drawn before every list): 29 fails, 41 cited colour pairs re-read off the rendered page, 0 contradict axe-core, 0 false fails; ACT afw4f7 25/34, identical to axe-core alone' },
  async measure(page) {
    await page.addScriptTag({ path: AXE_PATH });
    const r = await page.evaluate(async ([THIRD]) => {
      const res = await axe.run(document, { runOnly: { type: 'rule', values: ['color-contrast'] }, resultTypes: ['violations', 'incomplete', 'passes', 'inapplicable'], reporter: 'v2' });
      const nodes = arr => (arr[0]?.nodes || []).map(n => { const el = document.querySelector(n.target[0]); const d = (n.any[0] || n.all[0] || n.none[0] || {}).data || {}; return { target: n.target[0], third: !!(el && el.closest(THIRD)), fg: d.fgColor, bg: d.bgColor, ratio: d.contrastRatio, expected: d.expectedContrastRatio, fontSize: d.fontSize, fontWeight: d.fontWeight, message: (n.any[0] || n.all[0] || n.none[0] || {}).message || '' }; });
      const passNodes = nodes(res.passes).filter(n => !n.third);
      return { violations: nodes(res.violations).filter(n => !n.third), incomplete: nodes(res.incomplete).filter(n => !n.third).length, passes: passNodes.length, passTargets: passNodes.slice(0, 30).map(n => ({ target: n.target, bg: n.bg })), inapplicable: res.inapplicable.some(v => v.id === 'color-contrast') };
    }, [THIRD]);
    const base = { axe: AXE_VERSION, incomplete: r.incomplete, passes: r.passes, passTargets: r.passTargets };
    if (r.violations.length) {
      const groups = {}; for (const n of r.violations) { const k = `${n.fg} on ${n.bg}`; (groups[k] ||= { fg: n.fg, bg: n.bg, ratio: n.ratio, expected: n.expected, count: 0, example: n.target }).count++; }
      const g = Object.values(groups).sort((a, b) => b.count - a.count);
      return { verdict: 'fail', why: `${r.violations.length} text nodes below the ratio, ${g.length} colour pair${g.length > 1 ? 's' : ''}`, groups: g, ...base };
    }
    if (r.inapplicable && !r.passes && !r.incomplete) return { verdict: 'not-applicable', why: 'axe finds no text to measure', ...base };
    if (!r.passes && r.incomplete) return { verdict: 'unmeasurable', why: `axe could not resolve ${r.incomplete} nodes (background image, gradient or overlap) and passed none`, ...base };
    return { verdict: 'pass', why: `${r.passes} text nodes at or above the ratio${r.incomplete ? `, ${r.incomplete} unresolved by axe` : ''}`, ...base };
  },
  // --prove: every passed text node gets its colour blended four fifths of the way into its background (!important), which puts any passing pair below 4.5:1; reached when at least half of the nodes compute to the blended colour.
  async prove(page, prior) {
    const ts = (prior.passTargets || []).filter(t => t.target && t.bg); if (!ts.length) return { mutation: null, reached: false, why: 'no passed text nodes recorded' };
    const r = await page.evaluate(ts => {
      const rgb = c => { const d = document.createElement('div'); d.style.color = c; document.body.appendChild(d); const v = getComputedStyle(d).color; d.remove(); const m = v.match(/[\d.]+/g) || [0, 0, 0]; return m.slice(0, 3).map(Number); };
      const blend = (fg, bg) => `rgb(${fg.map((x, i) => Math.round(x * 0.2 + bg[i] * 0.8)).join(', ')})`;
      const plan = ts.map(t => { const el = document.querySelector(t.target); if (!el) return null; return { target: t.target, want: blend(rgb(getComputedStyle(el).color), rgb(t.bg)) }; }).filter(Boolean);
      const st = document.createElement('style'); st.setAttribute('data-uxcli-prove-style', '1'); st.textContent = plan.map(p => `${p.target}{color:${p.want} !important}`).join('\n'); document.documentElement.appendChild(st);
      let hit = 0; for (const p of plan) { const el = document.querySelector(p.target); if (el && getComputedStyle(el).color === p.want) hit++; }
      return { found: plan.length, hit };
    }, ts);
    const reached = r.found > 0 && r.hit * 2 >= r.found;
    return { mutation: `${r.found} passed text nodes blended four fifths into their background`, reached, why: reached ? null : `${r.hit} of ${r.found} nodes took the colour (selectors stale or overridden)`, found: r.found, hit: r.hit };
  },
};

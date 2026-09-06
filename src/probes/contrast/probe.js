// page.contrast · WCAG 1.4.3, delegated to axe-core color-contrast. Spec in spec.md; falsification pair in pair.json.
import { createRequire } from 'node:module'; import path from 'node:path';
import { THIRD } from '../../util.js';
const require = createRequire(import.meta.url);
export const AXE_VERSION = require('axe-core/package.json').version;
const AXE_PATH = path.join(path.dirname(require.resolve('axe-core/package.json')), 'axe.min.js');

export default {
  id: 'page.contrast', sc: '1.4.3', kind: 'page',
  method: { status: 'method-unproven', record: 'ACT afw4f7 25/34, 0 false fails, identical to axe-core alone; the unseen-page run is pending' },
  async measure(page) {
    await page.addScriptTag({ path: AXE_PATH });
    const r = await page.evaluate(async ([THIRD]) => {
      const res = await axe.run(document, { runOnly: { type: 'rule', values: ['color-contrast'] }, resultTypes: ['violations', 'incomplete', 'passes', 'inapplicable'], reporter: 'v2' });
      const nodes = arr => (arr[0]?.nodes || []).map(n => { const el = document.querySelector(n.target[0]); const d = (n.any[0] || n.all[0] || n.none[0] || {}).data || {}; return { target: n.target[0], third: !!(el && el.closest(THIRD)), fg: d.fgColor, bg: d.bgColor, ratio: d.contrastRatio, expected: d.expectedContrastRatio, fontSize: d.fontSize, fontWeight: d.fontWeight, message: (n.any[0] || n.all[0] || n.none[0] || {}).message || '' }; });
      return { violations: nodes(res.violations).filter(n => !n.third), incomplete: nodes(res.incomplete).filter(n => !n.third).length, passes: nodes(res.passes).length, inapplicable: res.inapplicable.some(v => v.id === 'color-contrast') };
    }, [THIRD]);
    const base = { axe: AXE_VERSION, incomplete: r.incomplete, passes: r.passes };
    if (r.violations.length) {
      const groups = {}; for (const n of r.violations) { const k = `${n.fg} on ${n.bg}`; (groups[k] ||= { fg: n.fg, bg: n.bg, ratio: n.ratio, expected: n.expected, count: 0, example: n.target }).count++; }
      const g = Object.values(groups).sort((a, b) => b.count - a.count);
      return { verdict: 'fail', why: `${r.violations.length} text nodes below the ratio, ${g.length} colour pair${g.length > 1 ? 's' : ''}`, groups: g, ...base };
    }
    if (r.inapplicable && !r.passes && !r.incomplete) return { verdict: 'not-applicable', why: 'axe finds no text to measure', ...base };
    if (!r.passes && r.incomplete) return { verdict: 'unmeasurable', why: `axe could not resolve ${r.incomplete} nodes (background image, gradient or overlap) and passed none`, ...base };
    return { verdict: 'pass', why: `${r.passes} text nodes at or above the ratio${r.incomplete ? `, ${r.incomplete} unresolved by axe` : ''}`, ...base };
  },
};

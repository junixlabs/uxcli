// page.nesting · a box inside a box inside a box · provenance research. Spec in spec.md; falsification pair in pair.json.
// Sources: Wathan & Schoger, Refactoring UI, "Use fewer borders"; Tufte, Envisioning Information, "1 + 1 = 3";
// Harley, NN/g, "The Principle of Common Region". Their rule, their names; the number three is the
// instrument's own reading of it, stated once in `rule`, which is why the verdict is capped at finding.
import { THIRD } from '../../util.js';
import { settleAnimations } from '../../browser.js';
import { explain } from '../../core/explain/nesting.js';

const RULE = 'text sits inside at most two nested boxes (border, shadow or outline)';
const MAX = 3;

// For every visible text run, the ancestors that draw an edge around it. Controls are objects, not
// groupings, so a button's own border is not a box; a table's cell borders are a grid, a different
// rule; third-party subtrees are not the page's. Returns the runs whose chain is MAX or deeper, and a
// sample for --prove: the deepest run and the nearest unboxed ancestor that could be boxed.
const COLLECT = ([THIRD, LIMIT, MAX]) => {
  const sel = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
  const clear = c => !c || c === 'transparent' || /^rgba\(\d+, \d+, \d+, 0\)$/.test(c);
  // A border on one side is a line — the middle step of space, line, box — not a box. Two sides or more, a shadow or an outline encloses.
  const boxed = cs => ['Top', 'Right', 'Bottom', 'Left'].filter(s => parseFloat(cs['border' + s + 'Width']) > 0 && cs['border' + s + 'Style'] !== 'none' && !clear(cs['border' + s + 'Color'])).length >= 2
    || (cs.boxShadow && cs.boxShadow !== 'none') || (parseFloat(cs.outlineWidth) > 0 && cs.outlineStyle !== 'none' && !clear(cs.outlineColor));
  const CONTROL = 'button, a, input, select, textarea, summary, label, [role=button], [role=link], [role=tab], [role=menuitem]';
  const GRID = 'table, thead, tbody, tfoot, tr, td, th';
  const shown = el => { for (let a = el; a && a.nodeType === 1; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false; if (a.getAttribute('aria-hidden') === 'true') return false; } return true; };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const byEl = new Map(); let texts = 0;
  for (let n = walker.nextNode(); n && texts < LIMIT; n = walker.nextNode()) {
    const text = n.nodeValue.replace(/\s+/g, ' ').trim(); if (!text) continue;
    const el = n.parentElement; if (!el || byEl.has(el) || el.closest(THIRD) || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName) || !shown(el)) continue;
    const r = el.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) continue;
    texts++;
    const chain = [], unboxed = [];
    for (let a = el; a && a !== document.body; a = a.parentElement) {
      if (a.matches(CONTROL) || a.closest(CONTROL) || a.matches(GRID)) continue;
      if (boxed(getComputedStyle(a))) chain.push(a); else unboxed.push(a);
    }
    byEl.set(el, { el, text, chain, unboxed });
  }
  const all = [...byEl.values()]; let maxDepth = 0; for (const x of all) maxDepth = Math.max(maxDepth, x.chain.length);
  const deepest = all.filter(x => x.chain.length === maxDepth).sort((a, b) => a.chain.length - b.chain.length)[0] || null;
  const seen = new Set(); const runs = all.filter(x => x.chain.length >= MAX).length;
  const deep = all.filter(x => x.chain.length >= MAX).sort((a, b) => b.chain.length - a.chain.length).map(x => ({ sel: sel(x.el), text: x.text.slice(0, 60), depth: x.chain.length, chain: x.chain.slice().reverse().map(sel).join(' > ') })).filter(x => !seen.has(x.chain) && seen.add(x.chain)).slice(0, 20);
  let sample = null;
  if (deepest) {
    const host = deepest.unboxed.find(a => a !== deepest.el && a.parentElement) || null;
    deepest.el.setAttribute('data-uxcli-a', ''); if (host) host.setAttribute('data-uxcli-b', '');
    sample = { sel: sel(deepest.el), text: deepest.text.slice(0, 40), depth: deepest.chain.length, host: host ? sel(host) : null };
  }
  return { texts, maxDepth, runs, deep, sample };
};

export default {
  id: 'page.nesting', sc: 'nesting', kind: 'page', provenance: 'research', rule: RULE,
  method: { status: 'method-unproven', record: 'no recorded run on pages the probe had not seen (written 2026-09-29 from the lenses research)' },
  async measure(page) {
    await settleAnimations(page);
    const r = await page.evaluate(COLLECT, [THIRD, 600, MAX]);
    const base = { provenance: 'research', rule: RULE, measured: { texts: r.texts, runs: r.runs, maxDepth: r.maxDepth, limit: MAX, sample: r.sample } };
    if (!r.texts) return { verdict: 'not-applicable', why: 'no visible text to sit inside a box', ...base };
    if (r.deep.length) return { verdict: 'fail', why: `${r.runs} text run${r.runs > 1 ? 's' : ''} inside ${MAX} or more nested boxes, ${r.deep.length} distinct chain${r.deep.length > 1 ? 's' : ''}, deepest ${r.maxDepth} — a box inside a box inside a box`, evidence: { targets: r.deep }, ...base };
    return { verdict: 'pass', why: `${r.texts} text runs, none inside more than ${r.maxDepth} nested box${r.maxDepth === 1 ? '' : 'es'}`, ...base };
  },
  // --prove: the nearest unboxed ancestor of the deepest text run is given a border; reached when that run's chain grows to MAX.
  async prove(page) {
    const s = (await page.evaluate(COLLECT, [THIRD, 600, MAX])).sample;
    if (!s || !s.host) return { mutation: 'a border drawn around the deepest text run', reached: false, why: 'no unboxed ancestor to draw a border on' };
    const reached = await page.evaluate(([MAX]) => {
      const H = document.querySelector('[data-uxcli-b]'); if (!H) return false;
      H.style.setProperty('border', '1px solid #000', 'important');
      // the chain of the deepest run, re-read: MAX boxed ancestors is the defect
      const A = document.querySelector('[data-uxcli-a]'); let n = 0;
      const CONTROL = 'button, a, input, select, textarea, summary, label, [role=button], [role=link], [role=tab], [role=menuitem]', GRID = 'table, thead, tbody, tfoot, tr, td, th';
      for (let a = A; a && a !== document.body; a = a.parentElement) { if (a.matches(CONTROL) || a.closest(CONTROL) || a.matches(GRID)) continue; const cs = getComputedStyle(a); if (parseFloat(cs.borderTopWidth) > 0 || (cs.boxShadow && cs.boxShadow !== 'none')) n++; }
      return n >= MAX;
    }, [MAX]).catch(() => false);
    return { mutation: `a 1px border drawn on ${s.host}, around "${s.text}"`, reached, ...(reached ? {} : { why: `boxing ${s.host} did not bring "${s.text}" to ${MAX} boxes` }) };
  },
  explain,
};

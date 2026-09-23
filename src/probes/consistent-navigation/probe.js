// flow.consistent-navigation · WCAG 3.2.3. Spec in spec.md; falsification pair in pair.json.
import { normUrl } from '../../util.js';
import { evalIn } from '../../browser.js';
import { explain } from '../../core/explain/consistent-navigation.js';

export default {
  id: 'flow.consistent-navigation', sc: '3.2.3',
  method: { status: 'method-unproven', record: 'P0-B ran pre-package code on 20 flows; no unseen-flow run with the packaged code yet' },
  async onStep(page, rec, ctx) {
    const navs = await evalIn(page, '() => navs()');
    (ctx.navsByStep ||= []).push({ i: rec.i, origin: new URL(rec.url).origin, userReorder: !!ctx.J.steps[rec.i].userReorder, navs });
    const shots = {}; const els = page.locator('nav, [role="navigation"]'); const n = await els.count();
    for (let k = 0; k < Math.min(n, navs.length); k++) { const el = els.nth(k); if (await el.isVisible().catch(() => false)) shots[navs[k].key] = await el.screenshot({ timeout: 5000 }).catch(() => null); }
    (rec.evidence ||= {})['3.2.3'] = shots;
  },
  async evaluate(ctx) {
    const navsByStep = ctx.navsByStep || [];
    if (ctx.blocked) return { verdict: 'blocked' };
    if (navsByStep.length < 2) return { verdict: 'unmeasurable', why: 'fewer than two steps loaded' };
    const origin0 = navsByStep[0].origin; const same = navsByStep.filter(n => n.origin === origin0 && !n.userReorder);
    const mechanisms = {}; let compared = 0, inversion = null;
    for (const s of same) for (const n of s.navs) (mechanisms[n.key] ||= []).push({ step: s.i, links: n.links });
    for (const [key, occ] of Object.entries(mechanisms)) {
      for (let a = 0; a < occ.length && !inversion; a++) for (let b = a + 1; b < occ.length && !inversion; b++) {
        const A = occ[a].links, B = occ[b].links;
        const count = arr => arr.reduce((m, l) => (m[normUrl(l.href)] = (m[normUrl(l.href)] || 0) + 1, m), {});
        const hA = count(A), hB = count(B);
        // identity: href when unique within the mechanism on both pages, else text
        const idOf = l => { const h = normUrl(l.href); if (hA[h] === 1 && hB[h] === 1) return 'h:' + h; return l.text ? 't:' + l.text : null; };
        const uniq = arr => arr.filter((x, i) => arr.indexOf(x) === i);
        const seqA = uniq(A.map(idOf).filter(Boolean)), seqB = uniq(B.map(idOf).filter(Boolean));
        const cA = seqA.filter(x => seqB.includes(x)), cB = seqB.filter(x => cA.includes(x));
        if (cA.length < 2) continue; compared++;
        for (let k = 0; k < cA.length; k++) if (cA[k] !== cB[k]) { inversion = { mechanism: key, stepA: occ[a].step, stepB: occ[b].step, expected: cA, got: cB, firstInvertedPair: [cA[k], cB[k]] }; break; }
      }
    }
    // `mechanisms` and the inversion are what a reader opens to check the verdict; `comparedPairs` is
    // the arithmetic behind the sentence they already read. Same object once, two containers.
    const out = { evidence: { mechanisms: Object.fromEntries(Object.entries(mechanisms).map(([k, v]) => [k, v.map(o => ({ step: o.step, links: o.links.length }))])) }, measured: { comparedPairs: compared } };
    if (navsByStep.some(n => n.origin !== origin0)) out.evidence.note = 'steps on another origin excluded';
    if (inversion) return { ...out, verdict: 'fail', evidence: { ...out.evidence, inversion },
      why: `the "${inversion.mechanism}" navigation lists its shared links in a different relative order on step ${inversion.stepA} and step ${inversion.stepB}` };
    // A verdict with no reason is a verdict a reader cannot act on: say which half was missing —
    // the journey never showed the same mechanism twice, or it did but the two copies shared fewer
    // than two links, so there was no order to compare.
    const seen = Object.values(out.evidence.mechanisms).filter(v => v.length > 1).length;
    return { ...out, verdict: compared ? 'pass' : 'not-applicable',
      why: compared ? `${compared} pair${compared === 1 ? '' : 's'} of repeated navigation compared across steps; each lists its shared links in the same relative order` : seen
        ? `${seen} navigation mechanism${seen > 1 ? 's were' : ' was'} on more than one step, but no two copies shared two or more links, so there was no order to compare`
        : 'no navigation mechanism appeared on more than one step of this journey; consistency is a claim about repetition' };
  },
  // The pure half lives in core/, where the dependency rule is what keeps it pure.
  explain,
};

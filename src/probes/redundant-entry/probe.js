// flow.redundant-entry · WCAG 3.3.7. Spec in spec.md; falsification pair in pair.json.
import { norm } from '../../util.js';
import { evalIn } from '../../browser.js';

function match(inputs, recorded, idx) {
  const matched = [];
  for (const inp of inputs) {
    let by = '';
    const prior = recorded.filter(r => r.step < idx).find(r => {
      if (r.autocomplete && inp.autocomplete && r.autocomplete === inp.autocomplete) by = 'autocomplete';
      else if (r.name && inp.name && r.name === inp.name) by = 'name';
      else if (['email', 'tel', 'url'].includes(inp.type) && inp.type === r.type) by = 'type';
      else if (r.label && inp.label && r.label === inp.label) by = 'label';
      else return false;
      if ((r.section || inp.section) && r.section !== inp.section) return false; // billing vs shipping
      if (r.legend && inp.legend && r.legend !== inp.legend) return false;
      return true;
    });
    if (prior) matched.push({ field: inp, prior, by });
  }
  return matched;
}

export default {
  id: 'flow.redundant-entry', sc: '3.3.7',
  async onStep(page, rec, ctx) {
    if (rec.i === 0 || !ctx.recorded.length) return;
    const details = [];
    for (const m of match(rec.inputsOnArrival, ctx.recorded, rec.i)) {
      const f = m.field, p = m.prior; let mechanism = null;
      if (norm(f.value) === norm(p.value) || norm(f.value) === norm(p.display)) mechanism = 'auto-populated';
      else if (p.essential) mechanism = 'essential (project)'; else if (p.security) mechanism = 'security (project)';
      else mechanism = await evalIn(page, `() => { const v = ${JSON.stringify(norm(p.value))}; const opts = [...document.querySelectorAll('select option, datalist option')].some(o => norm(o.textContent).includes(v) || norm(o.value).includes(v)); const boxes = [...document.querySelectorAll('input[type=checkbox], input[type=radio]')].filter(vis).map(b => norm(label(b))); const offers = boxes.some(t => t.includes(v)); const sameAs = boxes.some(t => /same as|use (my|the|this) .*(address|details|information)/.test(t)); return opts ? 'selectable:option' : offers ? 'selectable:choice' : sameAs ? 'selectable:same-as' : null; }`);
      details.push({ field: { name: f.name, id: f.id, type: f.type, label: f.label, autocomplete: f.autocomplete }, matchedBy: m.by, firstEnteredStep: p.step, firstEnteredAs: { name: p.name, label: p.label, selector: p.selector }, currentValue: f.value, mechanism });
    }
    rec.redundant = { noise: rec.noise, matched: details };
  },
  async evaluate(ctx) {
    const { J, steps, recorded, segOf, breakAfter, blocked } = ctx; const re = {};
    if (blocked) return { verdict: 'blocked' };
    const evald = steps.filter(s => s.redundant);
    if (!recorded.length || !evald.length) return { verdict: 'unmeasurable', why: 'no earlier values recorded / no later step reached' };
    const reasked = [], ok = [], noisy = [], broken = [];
    for (const s of evald) for (const m of s.redundant.matched) {
      const item = { step: s.i, url: s.url, ...m };
      if (segOf[m.firstEnteredStep] !== segOf[s.i]) { item.breakAtStep = breakAfter(m.firstEnteredStep, s.i); broken.push(item); continue; }
      if (s.redundant.noise) noisy.push(item); else if (m.mechanism) ok.push(item); else reasked.push(item);
    }
    if (J.sameProcess) re.override = { sameProcess: J.sameProcess, provenance: 'project' };
    re.premiseBroken = broken; re.matched = ok.length + reasked.length + noisy.length;
    if (noisy.length && !reasked.length) return { ...re, verdict: 'unmeasurable', why: 'matched field on a step whose text/values mutate with no interaction', noisy };
    if (broken.length && !reasked.length) return { ...re, verdict: 'unmeasurable', why: 'premise broken at step ' + broken[0].breakAtStep + ': the earlier value belongs to another process segment; declare sameProcess to override', satisfied: ok };
    if (reasked.length) return { ...re, verdict: 'fail', reasked, satisfied: ok };
    if (ok.length) return { ...re, verdict: 'pass', satisfied: ok };
    return { ...re, verdict: 'not-applicable' };
  }
};

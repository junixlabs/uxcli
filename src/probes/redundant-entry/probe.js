// flow.redundant-entry · WCAG 3.3.7. Spec in spec.md; falsification pair in pair.json.
import { norm } from '../../util.js';
import { evalIn, shot, fieldSelector } from '../../browser.js';
import { explain } from '../../core/explain/redundant-entry.js';

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
  method: { status: 'method-unproven', record: 'P0-B ran pre-package code on 20 flows; no unseen-flow run with the packaged code yet' },
  async onStep(page, rec, ctx) {
    if (rec.i === 0 || !ctx.recorded.length) return;
    const details = [];
    const step = ctx.J.steps[rec.i]; let passwordStep = false;
    for (const sel of Object.keys(step.fill || {})) { try { if (await page.locator(sel).first().evaluate(el => el.type === 'password')) { passwordStep = true; break; } } catch {} }
    for (const m of match(rec.inputsOnArrival, ctx.recorded, rec.i)) {
      if (passwordStep && (m.field.type === 'email' || /^(username|email)$/.test(m.field.autocomplete) || /user|login|email/i.test(m.field.name + ' ' + m.field.id + ' ' + m.field.label))) { details.push({ field: { name: m.field.name, id: m.field.id, type: m.field.type, label: m.field.label, autocomplete: m.field.autocomplete }, matchedBy: m.by, firstEnteredStep: m.prior.step, currentValue: m.field.value, mechanism: 'security: login identity on a step that enters a password (spec)' }); continue; }
      const f = m.field, p = m.prior; let mechanism = null;
      if (norm(f.value) === norm(p.value) || norm(f.value) === norm(p.display)) mechanism = 'auto-populated';
      else if (p.essential) mechanism = 'essential (project)'; else if (p.security) mechanism = 'security (project)';
      else mechanism = await evalIn(page, `() => { const v = ${JSON.stringify(norm(p.value))}; const opts = [...document.querySelectorAll('select option, datalist option')].some(o => norm(o.textContent).includes(v) || norm(o.value).includes(v)); const boxes = [...document.querySelectorAll('input[type=checkbox], input[type=radio]')].filter(vis).map(b => norm(label(b))); const offers = boxes.some(t => t.includes(v)); const sameAs = boxes.some(t => /same as|use (my|the|this) .*(address|details|information)/.test(t)); return opts ? 'selectable:option' : offers ? 'selectable:choice' : sameAs ? 'selectable:same-as' : null; }`);
      details.push({ field: { name: f.name, id: f.id, type: f.type, label: f.label, autocomplete: f.autocomplete }, matchedBy: m.by, firstEnteredStep: p.step, firstEnteredAs: { name: p.name, label: p.label, selector: p.selector }, currentValue: f.value, mechanism });
    }
    rec.redundant = { noise: rec.noise, matched: details };
    const bare = details.filter(d => !d.mechanism).map(d => fieldSelector(d.field)).filter(Boolean);
    if (bare.length) (rec.evidence ||= {})['3.3.7'] = await shot(page, '[data-uxcli-scope]', bare);
  },
  async evaluate(ctx) {
    const { J, steps, recorded, segOf, breakAfter, blocked } = ctx; const ev = {}; const re = { evidence: ev };
    if (blocked) return { verdict: 'blocked' };
    const evald = steps.filter(s => s.redundant);
    if (!recorded.length || !evald.length) return { verdict: 'unmeasurable', why: 'no earlier values recorded / no later step reached' };
    const reasked = [], ok = [], noisy = [], broken = [];
    for (const s of evald) for (const m of s.redundant.matched) {
      const item = { step: s.i, url: s.url, ...m };
      if (segOf[m.firstEnteredStep] !== segOf[s.i]) { item.breakAtStep = breakAfter(m.firstEnteredStep, s.i); broken.push(item); continue; }
      if (s.redundant.noise) noisy.push(item); else if (m.mechanism) ok.push(item); else reasked.push(item);
    }
    // The override is the instrument recording that a human overruled its premise — that is doctrine,
    // not evidence, and `packet.read()` has always classified it there.
    if (J.sameProcess) re.doctrine = { override: { sameProcess: J.sameProcess, provenance: 'project' } };
    ev.premiseBroken = broken; re.measured = { matched: ok.length + reasked.length + noisy.length };
    if (noisy.length && !reasked.length) return { ...re, verdict: 'unmeasurable', why: 'matched field on a step whose text/values mutate with no interaction', evidence: { ...ev, noisy } };
    if (broken.length && !reasked.length) return { ...re, verdict: 'unmeasurable', why: 'premise broken at step ' + broken[0].breakAtStep + ': the earlier value belongs to another process segment; declare sameProcess to override', satisfied: ok };
    if (reasked.length) return { ...re, verdict: 'fail', evidence: { ...ev, reasked, satisfied: ok },
      why: `${reasked.length} value${reasked.length === 1 ? '' : 's'} entered earlier in the same process ${reasked.length === 1 ? 'is' : 'are'} asked for again on step ${[...new Set(reasked.map(m => m.step))].join(', ')}` };
    if (ok.length) return { ...re, verdict: 'pass', evidence: { ...ev, satisfied: ok },
      why: `${ok.length} earlier value${ok.length === 1 ? ' was' : 's were'} offered again rather than asked for (${[...new Set(ok.map(m => m.mechanism))].join(', ')})` };
    return { ...re, verdict: 'not-applicable',
      why: re.measured.matched ? 'no earlier value was asked for again on a later step' : 'no value entered on an earlier step reappeared as a field on a later step' };
  },
  // The pure half lives in core/, where the dependency rule is what keeps it pure.
  explain,
};

// The palette, held by a pair: OKLCH converts both ways, a colour outside sRGB is brought in at the
// same lightness, a solved colour reaches its contrast; for every style in each of its modes the
// 12-step scales climb away from the ground, text steps pass by construction, hover and pressed only
// gain contrast for the label on them, every role pair holds, chart marks reach 3:1; and the checks
// can fail: a red and a green of one lightness are caught under deuteranopia, an action colour equal
// to a status colour is caught, and a planted pale step-11 is refused.
import { pathToFileURL } from 'node:url';
import { oklch, fromOklch, solve, scale, simulate, cvdCheck, deltaE, palette } from '../src/core/designer/color.js';
import { ratio } from '../src/core/commitment/kinds.js';
import { catalog } from '../src/designer.js';
import { proposeKit } from '../src/core/designer/kit.js';

export const OPERATOR = 'OKLCH round-trips 216 sRGB colours exactly, an out-of-gamut chroma comes back in gamut at its lightness, a solved colour reaches its target within 0.3; for every style and each of its modes the scale steps 1–8 climb away from the ground, step 11 reads at 5:1 and further than step 10, step 12 at 11:1, hover and pressed raise the label\'s contrast, every role and chart pair holds, a generated dark ground is not black, and Mantine\'s shade 6 is the seed; '
  + 'grey is unchanged by colour-blind simulation and a red and a green of one lightness are caught under deuteranopia; an action colour equal to the critical seed is caught; a kit whose catalog plants a pale text step fails';

export async function pair() {
  const problems = []; let checks = 0;
  const must = (what, cond) => { checks++; if (!cond) problems.push(what); };
  const cat = catalog().value; const cfg = cat.palette;

  // the arithmetic
  const hx = [0, 51, 102, 153, 204, 255].map(v => v.toString(16).padStart(2, '0'));
  let rt = 0; for (const r of hx) for (const g of hx) for (const b of hx) { const h = `#${r}${g}${b}`; const c = oklch(h); if (fromOklch(c.L, c.C, c.h) === h) rt++; }
  must(`OKLCH round-tripped ${rt} of 216 colours`, rt === 216);
  const wide = fromOklch(0.7, 0.4, 145);
  must(`an out-of-gamut chroma did not come back at its lightness (${wide})`, /^#[0-9a-f]{6}$/.test(wide) && Math.abs(oklch(wide).L - 0.7) < 0.01);
  const s1 = solve('#0f62fe', '#ffffff', 7);
  must(`a solved colour missed its target (${ratio(s1, '#ffffff')})`, ratio(s1, '#ffffff') >= 7 && ratio(s1, '#ffffff') < 7.3);

  // every style, every mode
  for (const st of cat.styles) {
    const p = palette(st, cfg);
    must(`${st.code}: modes ${p.modes} are not the style's ${st.modes}`, p.modes.join() === st.modes.join());
    for (const m of p.modes) {
      for (const [fam, steps] of Object.entries(p.scales[m])) {
        const L = steps.slice(0, 8).map(h => oklch(h).L);
        must(`${st.code} ${m} ${fam}: steps 1–8 do not climb away from the ground`, L.every((v, i) => i === 0 || (m === 'light' ? v < L[i - 1] : v > L[i - 1])));
        must(`${st.code} ${m} ${fam}: step 11 under 5:1 on step 2`, ratio(steps[10], steps[1]) >= 5);
        must(`${st.code} ${m} ${fam}: step 11 not past the hover step`, ratio(steps[10], steps[1]) >= ratio(steps[9], steps[1]));
        must(`${st.code} ${m} ${fam}: step 12 under 11:1 on step 2`, ratio(steps[11], steps[1]) >= 11);
      }
      const r = p.roles[m];
      must(`${st.code} ${m}: hover lowers the label's contrast`, ratio(r.onAction, r.actionHover) >= ratio(r.onAction, r.action) && ratio(r.onAction, r.actionPressed) >= ratio(r.onAction, r.actionHover));
      if (m !== st.scheme) must(`${st.code} ${m}: a generated dark ground is black`, m !== 'dark' || r.bg !== '#000000');
      const bad = p.contrast.filter(c => c.mode === m && !c.ok);
      must(`${st.code} ${m}: ${bad.map(c => `${c.fg} on ${c.bg} ${c.ratio}`).join(', ')}`, !bad.length);
      must(`${st.code} ${m}: ${p.chart[m].categorical.length} chart colours, not ${cfg.chart.categorical}`, p.chart[m].categorical.length === cfg.chart.categorical && new Set(p.chart[m].categorical).size === cfg.chart.categorical);
    }
  }
  const mantine = proposeKit('A07 + B-W1 + C2 + D02', cat, { lib: 'mantine' }).value;
  must('Mantine\'s shade 6 is not the action seed', mantine?.theme.find(t => t.token === 'actionScale')?.light[6] === cat.codes.get('D02').tokens.action);

  // the checks can fail
  must('grey changed under colour-blind simulation', ['deuteranopia', 'protanopia', 'tritanopia'].every(t => deltaE(simulate('#808080', t), '#808080') < 0.005));
  must('a red and a green of one lightness were not caught under deuteranopia', cvdCheck({ critical: '#e03131', success: '#2f9e44' }, cfg.cvd.minDelta).close.some(x => x.type === 'deuteranopia'));
  const red = { ...cat.codes.get('D02'), tokens: { ...cat.codes.get('D02').tokens, action: cfg.status.critical } };
  must('an action colour equal to the critical seed was not caught', palette(red, cfg).apart.light.some(x => x.status === 'critical'));
  const pale = { ...cat.codes.get('D02'), tokens: { ...cat.codes.get('D02').tokens, muted: '#b9bec5' } };
  const codes = new Map(cat.codes); codes.set('D02', pale);
  const planted = proposeKit('A07 + B-W1 + C2 + D02', { ...cat, codes }).problems;
  must(`a pale muted text was not refused (${planted.join('; ')})`, planted.some(x => /light: muted on (bg|surface)/.test(x)));
  return { ok: !problems.length, checks, problems };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = await pair();
  console.log(r.ok ? `PASS palette · ${r.checks} checks` : 'FAIL ' + r.problems.join('\n     '));
  process.exit(r.ok ? 0 : 1);
}

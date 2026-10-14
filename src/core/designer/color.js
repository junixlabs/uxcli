// Colour as a system, not a handful of hex values: every role is a step on a 12-step scale built in
// OKLCH (perceptual lightness), interaction states are neighbouring steps, each mode has its own
// mapping, text steps are solved for their contrast rather than hoped for, status colours are checked
// under simulated colour blindness, and chart palettes are separate from UI colours. Pure arithmetic.
import { ratio } from '../commitment/kinds.js';

// ── OKLab / OKLCH (Björn Ottosson, 2020) ──
const toLin = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGam = c => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const rgbHex = rgb => '#' + rgb.map(v => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('');
function linToLab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
function labToLin([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}
export const lab = hex => linToLab(hexRgb(hex).map(toLin));
export function oklch(hex) { const [L, a, b] = lab(hex); const C = Math.hypot(a, b); return { L, C, h: C < 1e-4 ? 0 : (Math.atan2(b, a) * 180 / Math.PI + 360) % 360 }; }
const inGamut = rgb => rgb.every(v => v >= -1e-4 && v <= 1 + 1e-4);
// Out of sRGB: keep lightness and hue, lower chroma until it fits (CSS Color 4 gamut mapping, simplified).
export function fromOklch(L, C, h) {
  const lin = c => labToLin([L, c * Math.cos(h * Math.PI / 180), c * Math.sin(h * Math.PI / 180)]);
  let lo = 0, hi = C;
  if (!inGamut(lin(C))) { for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (inGamut(lin(mid))) lo = mid; else hi = mid; } C = lo; }
  return rgbHex(lin(C).map(v => toGam(Math.min(1, Math.max(0, v)))));
}
export const deltaE = (x, y) => { const [a, b] = [lab(x), lab(y)]; return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); };

// The lightness, on this colour's hue and chroma, that reaches `target` contrast against `ground`,
// moving away from the ground. Contrast grows monotonically as lightness moves away, so bisection holds.
export function solve(seed, ground, target, { C = null } = {}) {
  const s = oklch(seed), g = oklch(ground).L, c = C ?? s.C, darker = g > 0.6;
  let lo = darker ? 0 : g, hi = darker ? g : 1;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2; const ok = ratio(fromOklch(mid, c, s.h), ground) >= target;
    if (darker) { if (ok) lo = mid; else hi = mid; } else { if (ok) hi = mid; else lo = mid; }
  }
  return fromOklch(darker ? lo : hi, c, s.h);
}

// ── the 12-step scale (after Radix Colors: each step has one job) ──
// Steps 1–8 sit on a fixed lightness ladder per mode; 9 is the seed (lifted in dark mode until it
// reaches 3:1 on the ground); 10 its hover; 11 and 12 are solved for contrast on step 2 — 11 at 5:1
// or past the hover step, 12 at 11:1 or more.
const LADDER = { light: [0.985, 0.97, 0.94, 0.91, 0.88, 0.84, 0.78, 0.7], dark: [0.16, 0.19, 0.235, 0.27, 0.305, 0.345, 0.4, 0.48] };
const CHROMA = { light: [0.03, 0.06, 0.12, 0.18, 0.24, 0.32, 0.45, 0.6], dark: [0.08, 0.1, 0.16, 0.22, 0.28, 0.34, 0.44, 0.56] };
export function scale(seed, mode, { neutral = false, neutralChroma = 0.012 } = {}) {
  const s = oklch(seed); const C = neutral ? Math.min(s.C, neutralChroma) : s.C;
  const steps = LADDER[mode].map((L, i) => fromOklch(L, neutral ? C : C * CHROMA[mode][i], s.h));
  let nine = neutral ? fromOklch(mode === 'light' ? 0.55 : 0.62, C, s.h) : seed;
  if (mode === 'dark' && ratio(nine, steps[0]) < 3) nine = solve(nine, steps[0], 3);
  if (mode === 'light' && ratio(nine, steps[0]) < 1.25) nine = solve(nine, steps[0], 1.25);
  steps.push(nine, shift(nine, onSolid(nine), 0.04));
  const nC = oklch(nine).C;
  // step 11 reads as text (5:1 at least) and always sits further from the ground than the hover step
  const t11 = Math.max(5, ratio(steps[9], steps[1]) * 1.1);
  steps.push(solve(nine, steps[1], t11, { C: Math.min(nC, 0.16) }), solve(nine, steps[1], Math.max(11, t11 * 1.6), { C: Math.min(nC, 0.08) }));
  return steps;
}
// Hover and pressed move a solid colour away from the text on it, so the label only gains contrast:
// darker under white text, lighter under dark text, whatever the mode.
const onSolid = solid => ratio('#ffffff', solid) >= ratio('#111111', solid) ? '#ffffff' : '#111111';
const shift = (hex, on, d) => { const c = oklch(hex); return fromOklch(c.L + (oklch(on).L > c.L ? -d : d), c.C, c.h); };
// A colour that must read on several grounds: kept when it already does, else solved against the hardest one.
const readable = (fg, grounds, min) => { const hard = grounds.reduce((a, g) => (ratio(fg, g) < ratio(fg, a) ? g : a)); return ratio(fg, hard) >= min ? fg : solve(fg, hard, min + 0.05); };

// ── colour-vision deficiency (Machado, Oliveira & Fernandes 2009, severity 1.0, in linear RGB) ──
const CVD = {
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritanopia: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};
export const CVD_TYPES = Object.keys(CVD);
export function simulate(hex, type) { const v = hexRgb(hex).map(toLin); return rgbHex(CVD[type].map(r => toGam(Math.min(1, Math.max(0, r[0] * v[0] + r[1] * v[1] + r[2] * v[2]))))); }
// Every pair of named colours, under each deficiency: the ones closer than minDelta (OKLab distance).
export function cvdCheck(named, minDelta) {
  const close = []; let checked = 0; const names = Object.keys(named);
  for (const type of CVD_TYPES) for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
    checked++; const d = Math.round(deltaE(simulate(named[names[i]], type), simulate(named[names[j]], type)) * 1000) / 1000;
    if (d < minDelta) close.push({ type, a: names[i], b: names[j], delta: d });
  }
  return { checked, minDelta, close };
}

// ── the palette: scales, roles per mode, states, chart colours, and the checks on them ──
// `style` is a catalog style (its hand-picked tokens win in its own mode, so the style keeps its look);
// `cfg` is catalog.palette.
export function palette(style, cfg) {
  const t = style.tokens, modes = style.modes, own = style.scheme;
  const solidOver = (fg, bg) => { const m = /^rgba?\(([^)]+)\)$/.exec(fg); if (!m) return fg; const [r, g, b, a = '1'] = m[1].split(',').map(x => Number(x.trim())); const G = hexRgb(bg).map(v => v * 255); return rgbHex([r, g, b].map((v, i) => (v * a + G[i] * (1 - a)) / 255)); };
  const out = { modes, scales: {}, roles: {}, chart: {}, contrast: [], cvd: {}, apart: {} };
  for (const mode of modes) {
    const sc = { neutral: scale(t.muted, mode, { neutral: true, neutralChroma: cfg.neutralChroma }), action: scale(t.action, mode) };
    for (const [k, seed] of Object.entries(cfg.status)) sc[k] = scale(seed, mode);
    const at = (name, step) => sc[name][step - 1];
    const r = {
      bg: mode === 'light' ? at('neutral', 2) : at('neutral', 1), surface: mode === 'light' ? '#ffffff' : at('neutral', 2), raised: mode === 'light' ? '#ffffff' : at('neutral', 3),
      text: at('neutral', 12), muted: at('neutral', 11), line: at('neutral', 6),
      action: at('action', 9), actionHover: at('action', 10), actionText: at('action', 11), selectedBg: at('action', 4),
      hoverBg: at('neutral', 3), activeBg: at('neutral', 4), disabledBg: at('neutral', 3), disabledText: at('neutral', 8),
    };
    if (mode === own) Object.assign(r, { bg: t.bg, surface: solidOver(t.surface, t.bg), raised: solidOver(t.surface, t.bg), text: t.text, muted: t.muted, line: solidOver(t.line, t.bg), action: t.action });
    r.onAction = mode === own ? t.onAction : onSolid(r.action);
    if (mode === own) r.actionHover = shift(r.action, r.onAction, 0.04);
    r.actionPressed = shift(r.action, r.onAction, 0.08);
    r.actionText = readable(r.actionText, [r.surface, r.bg], 4.5);
    // a generated muted text is solved to read; the style's own is measured as it is, so a bad catalog token is found, not hidden
    if (mode !== own) r.muted = readable(r.muted, [r.surface, r.bg, r.hoverBg], 4.5);
    r.lineStrong = solve(r.line, r.surface, 3);
    r.focusRing = ratio(r.action, r.bg) >= 3 && ratio(r.action, r.surface) >= 3 ? r.action : solve(r.action, r.surface, 3);
    for (const k of Object.keys(cfg.status)) Object.assign(r, { [k]: readable(at(k, 11), [r.surface, r.bg, at(k, 3)], 4.5), [`${k}Soft`]: at(k, 3), [`${k}Solid`]: at(k, 9), [`on${k[0].toUpperCase()}${k.slice(1)}Solid`]: onSolid(at(k, 9)) });
    const ORDER = ['bg', 'surface', 'raised', 'line', 'lineStrong', 'text', 'muted', 'disabledText', 'action', 'actionHover', 'actionPressed', 'onAction', 'actionText', 'focusRing', 'selectedBg', 'hoverBg', 'activeBg', 'disabledBg',
      ...Object.keys(cfg.status).flatMap(k => [k, `${k}Soft`, `${k}Solid`, `on${k[0].toUpperCase()}${k.slice(1)}Solid`])];
    out.scales[mode] = sc; out.roles[mode] = Object.fromEntries(ORDER.map(k => [k, r[k]]));

    // what must hold, per mode: text 4.5:1 (WCAG 1.4.3), controls, focus and chart marks 3:1 (1.4.11)
    const pairs = [['text', 'bg', 4.5], ['text', 'surface', 4.5], ['muted', 'bg', 4.5], ['muted', 'surface', 4.5], ['actionText', 'surface', 4.5],
      ['onAction', 'action', 4.5], ['onAction', 'actionHover', 4.5], ['onAction', 'actionPressed', 4.5], ['text', 'selectedBg', 4.5], ['text', 'hoverBg', 4.5],
      ['action', 'bg', 3], ['lineStrong', 'surface', 3], ['focusRing', 'bg', 3], ['focusRing', 'surface', 3],
      ...Object.keys(cfg.status).flatMap(k => [[k, `${k}Soft`, 4.5], [k, 'surface', 4.5], [`on${k[0].toUpperCase()}${k.slice(1)}Solid`, `${k}Solid`, 4.5]])];
    for (const [fg, bg, min] of pairs) { const v = ratio(r[fg], r[bg]); out.contrast.push({ mode, fg, bg, ratio: v, min, ok: v >= min }); }

    // chart colours: categorical hues spaced evenly from the action hue at one lightness, each 3:1 on the surface; sequential and diverging from the scales
    const h0 = oklch(r.action).C < 0.03 ? oklch(cfg.status.info).h : oklch(r.action).h;
    const cat = Array.from({ length: cfg.chart.categorical }, (_, i) => { const c = fromOklch(mode === 'light' ? 0.6 : 0.74, 0.14, (h0 + i * 360 / cfg.chart.categorical) % 360); return ratio(c, r.surface) >= 3 ? c : solve(c, r.surface, 3); });
    out.chart[mode] = { categorical: cat, sequential: cfg.chart.sequential.map(s => at('action', s)), diverging: [at('critical', 11), at('critical', 8), at('neutral', 5), at('info', 8), at('info', 11)] };
    cat.forEach((c, i) => { const v = ratio(c, r.surface); out.contrast.push({ mode, fg: `chart${i + 1}`, bg: 'surface', ratio: v, min: 3, ok: v >= 3 }); });
    // the action colour must not pass for a status colour (one-meaning): same distance, normal vision
    out.apart[mode] = Object.keys(cfg.status).map(k => ({ status: k, delta: Math.round(deltaE(r.action, r[`${k}Solid`]) * 1000) / 1000 })).filter(x => x.delta < cfg.cvd.minDelta);
    out.cvd[mode] = cvdCheck(Object.fromEntries(Object.keys(cfg.status).map(k => [k, r[`${k}Solid`]])), cfg.cvd.minDelta);
  }
  return out;
}

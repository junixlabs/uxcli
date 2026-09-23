// Builds a standalone flow map from one real uxcli journey run. Nothing here invents a node, an edge
// or a label: every one of them names the field of run.json it came from, and the page prints that
// provenance beside the drawing. Run:
//
//   node prototypes/uxcli-flow-map/build.mjs <run dir> [out.html]
//
// The palette and the type scale are read out of src/dashboard.tokens.css rather than restated, so a
// prototype cannot quietly diverge from the product it is proposing a change to.
import fs from 'node:fs'; import path from 'node:path';

const RUN_DIR = process.argv[2];
const OUT = process.argv[3] || path.join(path.dirname(new URL(import.meta.url).pathname), 'index.html');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const run = JSON.parse(fs.readFileSync(path.join(RUN_DIR, 'run.json'), 'utf8'));

// ── the product's own values, lifted not copied ─────────────────────────────
const tok = fs.readFileSync(path.join(ROOT, 'src/dashboard.tokens.css'), 'utf8');
const val = name => (tok.match(new RegExp(`--${name}:\\s*([^;]+);`)) || [])[1]?.trim();
const BASE = ['bg','panel','rail','sunk','ink','ink-2','ink-3','line','line-2','accent','accent-bg',
  'pass-ink','fail-ink','finding-ink','unmeas-ink'];
const WANT = [...BASE.map(n => 'lt-' + n), ...BASE.map(n => 'dk-' + n)];
const T = Object.fromEntries(WANT.map(n => [n, val(n)]));
const missing = WANT.filter(n => !T[n]);
if (missing.length) { console.error('tokens not found in dashboard.tokens.css: ' + missing.join(', ')); process.exit(1); }

const dataUri = f => { const p = path.join(RUN_DIR, f);
  return fs.existsSync(p) ? 'data:image/jpeg;base64,' + fs.readFileSync(p).toString('base64') : null; };
const short = u => { try { return new URL(u).pathname; } catch { return u; } };
const probe = sc => run.probes.find(p => p.sc === sc);

// ── nodes: one per screen the browser actually reached ──────────────────────
const nodes = (run.steps || []).map(s => ({
  i: s.i, url: s.url, path: short(s.url), title: s.title || short(s.url),
  ms: s.ms, arrivedBy: s.arrivedBy, shot: s.shot ? dataUri(s.shot) : null,
  scope: s.scope, flowBreak: s.flowBreak,
  fields: (s.inputsOnArrival || []).map(f => ({ label: f.label || f.name, type: f.type, auto: f.autocomplete || null })),
}));
if (run.finalShot) nodes.push({ i: 'end', url: run.steps?.at(-1)?.url, path: 'after the last step',
  title: 'outcome', ms: null, arrivedBy: 'flow', shot: dataUri(run.finalShot), fields: [], final: true });

// ── edges: three kinds, three sources, all recorded ─────────────────────────
const edges = [];
for (let k = 1; k < nodes.length; k++)
  edges.push({ kind: 'flow', from: nodes[k - 1].i, to: nodes[k].i,
    label: nodes[k].arrivedBy === 'goto' ? 'entry' : nodes[k].ms != null ? `${nodes[k].ms}ms` : '',
    src: 'steps[].arrivedBy' });

// 3.3.7 — a value entered on one screen, asked for again on another
for (const s of probe('3.3.7')?.evidence?.satisfied || [])
  edges.push({ kind: 'data', from: s.firstEnteredStep, to: s.step,
    label: `${s.matchedBy} · ${s.mechanism}`,
    full: `${s.firstEnteredAs?.label || s.field?.name} → ${s.field?.label} · matched by ${s.matchedBy} · ${s.mechanism}`,
    src: '3.3.7 evidence.satisfied[]' });

// 3.3.4 — the way back the commit screen offers
const conf = probe('3.3.4')?.evidence?.branches?.confirmed;
if (conf?.changeMechanism?.href) {
  const target = nodes.find(n => n.url && short(n.url) === short(conf.changeMechanism.href));
  if (target) edges.push({ kind: 'back', from: conf.screen, to: target.i,
    label: conf.changeMechanism.text, src: '3.3.4 branches.confirmed.changeMechanism' });
}
// 3.3.1 — where a planted error was let through
const pl = probe('3.3.1')?.evidence?.planted;
const planted = pl?.tested ? { from: pl.entryStep, advanced: !pl.notAdvanced, field: pl.probedField,
  kind: pl.probeKind, src: '3.3.1 evidence.planted' } : null;

// 3.2.3 — the structure every screen repeats
const mech = Object.entries(probe('3.2.3')?.evidence?.mechanisms || {})
  .map(([name, rows]) => ({ name, at: Object.fromEntries(rows.map(r => [r.i ?? r.step, r.links])) }));

const verdicts = run.probes.map(p => ({ sc: p.sc, verdict: p.verdict, why: p.why || p.cite?.what || '',
  method: (p.method || '').replace('method-', '') }));

// ── the same graph as text, which is what an agent reads ────────────────────
const asText = [
  `# ${run.journey} · ${run.steps?.length ?? 0} of ${run.stepCount} steps ran · exit ${run.exit}`,
  '', 'screens',
  ...nodes.map(n => `  ${String(n.i).padEnd(4)}${(n.path || '').padEnd(22)}${(n.title || '').padEnd(34)}${n.ms != null ? n.ms + 'ms' : ''}`),
  '', 'edges',
  ...edges.map(e => `  ${String(e.from).padEnd(4)}${e.kind === 'data' ? '⇢' : e.kind === 'back' ? '↩' : '→'}  ${String(e.to).padEnd(4)}${e.kind.padEnd(6)}${e.full || e.label}    [${e.src}]`),
  ...(planted ? ['', 'planted error',
    `  step ${planted.from}  ${planted.kind} on "${planted.field}"  →  ${planted.advanced ? 'the step advanced' : 'the step was blocked'}    [${planted.src}]`] : []),
  '', 'verdicts',
  ...verdicts.map(v => `  ${String(v.sc).padEnd(7)}${v.verdict.padEnd(16)}${v.method.padEnd(11)}${v.why}`),
  '',
].join('\n');

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const DATA = { run: { journey: run.journey, ranAt: run.ranAt, stepCount: run.stepCount, ran: run.steps?.length ?? 0, exit: run.exit, uxcli: run.uxcli },
  nodes, edges, planted, mech, verdicts, asText };

fs.writeFileSync(OUT, page(DATA));
console.log(`${OUT}  ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB · ${nodes.length} screens · ${edges.length} edges`);

function page(d) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Measured Flow Map</title>
<style>
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; }
img, svg { display: block; max-width: 100%; }
button { font: inherit; color: inherit; }

:root {
  --sans: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --mono: ui-monospace, SFMono-Regular, Menlo, monospace;
  --s1: 5px; --s2: 10px; --s3: 15px; --s4: 20px; --s5: 25px; --s6: 30px; --s7: 40px;
  --r-chip: 4px; --r-control: 8px; --r-panel: 12px;
  --node-w: 230px;
  --bg: ${T['lt-bg']}; --panel: ${T['lt-panel']}; --rail: ${T['lt-rail']}; --sunk: ${T['lt-sunk']};
  --ink: ${T['lt-ink']}; --ink-2: ${T['lt-ink-2']}; --ink-3: ${T['lt-ink-3']};
  --line: ${T['lt-line']}; --line-2: ${T['lt-line-2']};
  --accent: ${T['lt-accent']}; --accent-soft: ${T['lt-accent-bg']};
  --pass: ${T['lt-pass-ink']}; --fail: ${T['lt-fail-ink']}; --finding: ${T['lt-finding-ink']}; --unmeas: ${T['lt-unmeas-ink']};
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg: ${T['dk-bg']}; --panel: ${T['dk-panel']}; --rail: ${T['dk-rail']}; --sunk: ${T['dk-sunk']};
  --ink: ${T['dk-ink']}; --ink-2: ${T['dk-ink-2']}; --ink-3: ${T['dk-ink-3']};
  --line: ${T['dk-line']}; --line-2: ${T['dk-line-2']};
  --accent: ${T['dk-accent']}; --accent-soft: ${T['dk-accent-bg']};
  --pass: ${T['dk-pass-ink']}; --fail: ${T['dk-fail-ink']}; --finding: ${T['dk-finding-ink']}; --unmeas: ${T['dk-unmeas-ink']};
} }
:root[data-theme="dark"] {
  --bg: ${T['dk-bg']}; --panel: ${T['dk-panel']}; --rail: ${T['dk-rail']}; --sunk: ${T['dk-sunk']};
  --ink: ${T['dk-ink']}; --ink-2: ${T['dk-ink-2']}; --ink-3: ${T['dk-ink-3']};
  --line: ${T['dk-line']}; --line-2: ${T['dk-line-2']};
  --accent: ${T['dk-accent']}; --accent-soft: ${T['dk-accent-bg']};
  --pass: ${T['dk-pass-ink']}; --fail: ${T['dk-fail-ink']}; --finding: ${T['dk-finding-ink']}; --unmeas: ${T['dk-unmeas-ink']};
}

body { background: var(--bg); color: var(--ink); font: 13px/20px var(--sans); }
.page { padding: var(--s5) var(--s5) var(--s7); max-width: 1500px; margin: 0 auto; }

/* head — a name, the counts, and nothing else. The prose this replaces is the point. */
.top { display: flex; align-items: baseline; gap: var(--s3); flex-wrap: wrap; margin-bottom: var(--s5); }
.top h1 { margin: 0; font: 600 21px/30px var(--sans); letter-spacing: -.01em; }
.top .facts { display: flex; gap: var(--s3); font: 11px/15px var(--mono); color: var(--ink-3); }
.top .facts b { font-weight: 400; color: var(--ink-2); }
.top .sp { flex: 1 1 auto; }
.btn { border: 1px solid var(--line); border-radius: var(--r-control); background: var(--panel);
  color: var(--ink-2); font: 11px/15px var(--mono); padding: var(--s1) var(--s2); cursor: pointer; }
.btn:hover { border-color: var(--ink-3); color: var(--ink); }
.btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.lab { font: 500 11px/15px var(--sans); letter-spacing: .12em; text-transform: uppercase; color: var(--ink-3);
  display: block; margin: var(--s5) 0 var(--s2); }

/* ── the map ──────────────────────────────────────────────────────────────
   Node width is fixed and the lane scrolls, because a screen thumbnail that shrinks to fit stops
   being readable — and the thumbnail is the content here, not decoration. */
.mapwrap { position: relative; overflow-x: auto; padding: 78px 0 92px; background: var(--rail);
  border: 1px solid var(--line-2); border-radius: var(--r-panel); }
.lane { display: flex; align-items: flex-start; gap: var(--s6); padding: 0 var(--s5); width: max-content; }
.wires { position: absolute; inset: 0; pointer-events: none; overflow: visible; }

.node { width: var(--node-w); background: var(--panel); border: 1px solid var(--line-2);
  border-radius: var(--r-control); overflow: hidden; }
.node.is-final { border-style: dashed; }
.shot { aspect-ratio: 16 / 10; width: 100%; object-fit: cover; object-position: top center;
  background: var(--sunk); border-bottom: 1px solid var(--line-2); }
.node .body { padding: var(--s2); }
.node .n { font: 11px/15px var(--mono); color: var(--ink-3); }
.node .t { font: 600 13px/18px var(--sans); color: var(--ink); margin: 2px 0 1px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.node .p { font: 11px/15px var(--mono); color: var(--accent);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fields { display: flex; flex-wrap: wrap; gap: 3px; margin-top: var(--s2); }
.f { font: 11px/15px var(--mono); padding: 0 var(--s1); border-radius: var(--r-chip);
  background: var(--sunk); color: var(--ink-2); border: 1px solid var(--line-2); }
.f.is-auto { border-color: var(--accent); color: var(--accent); }

/* ── the band: what every screen repeats ───────────────────────────────── */
.band { border: 1px solid var(--line-2); border-radius: var(--r-panel); background: var(--panel); overflow-x: auto; }
table { border-collapse: collapse; width: 100%; }
th, td { padding: var(--s1) var(--s2); text-align: left; border-bottom: 1px solid var(--line-2); }
thead th { font: 500 11px/15px var(--sans); letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); white-space: nowrap; }
tbody tr:last-child td { border-bottom: 0; }
td.k { font: 11px/15px var(--mono); color: var(--ink-2); white-space: nowrap; }
td.c { font: 11px/15px var(--mono); color: var(--ink-3); text-align: center; width: 84px; }
td.c b { color: var(--ink); font-weight: 400; }

/* ── verdicts, as marks not sentences ──────────────────────────────────── */
.vs { display: flex; flex-wrap: wrap; gap: var(--s2); }
.v { display: flex; align-items: baseline; gap: var(--s2); padding: var(--s2) var(--s3);
  border: 1px solid var(--line-2); border-radius: var(--r-control); background: var(--panel); }
.v .sc { font: 600 13px/18px var(--mono); }
.v .vd { font: 11px/15px var(--mono); letter-spacing: .06em; }
.v .m { font: 11px/15px var(--mono); color: var(--ink-3); }
.v-pass .sc, .v-pass .vd { color: var(--pass); }
.v-fail .sc, .v-fail .vd { color: var(--fail); }
.v-finding .sc, .v-finding .vd { color: var(--finding); }
.v-unmeasurable .sc, .v-unmeasurable .vd { color: var(--unmeas); }
.v-not-applicable .sc, .v-not-applicable .vd { color: var(--ink-3); }

/* ── the same graph as text ────────────────────────────────────────────── */
details { margin-top: var(--s5); }
summary { font: 11px/15px var(--mono); color: var(--ink-3); cursor: pointer; }
pre { margin: var(--s2) 0 0; padding: var(--s3); overflow-x: auto; background: var(--sunk);
  border: 1px solid var(--line-2); border-radius: var(--r-control);
  font: 11px/17px var(--mono); color: var(--ink-2); }
.src { margin: var(--s2) 0 0; font: 11px/17px var(--mono); color: var(--ink-3); }
.src b { font-weight: 400; color: var(--ink-2); }

@media (max-width: 640px) { .page { padding: var(--s4) var(--s3) var(--s6); } :root { --node-w: 200px; } }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
</style>
</head>
<body>
<div class="page">

  <div class="top">
    <h1>${esc(d.run.journey)}</h1>
    <div class="facts">
      <span><b>${d.run.ran}</b>/${d.run.stepCount} steps</span>
      <span>exit <b>${d.run.exit}</b></span>
      <span><b>${d.nodes.length}</b> screens</span>
      <span><b>${d.edges.length}</b> edges</span>
      <span>uxcli ${esc(d.run.uxcli)}</span>
    </div>
    <span class="sp"></span>
    <button class="btn" id="theme" type="button">theme</button>
    <button class="btn" id="copy" type="button">copy map for an agent</button>
  </div>

  <span class="lab">The flow, as measured</span>
  <div class="mapwrap">
    <svg class="wires" id="wires" aria-hidden="true"></svg>
    <div class="lane" id="lane">
      ${d.nodes.map(n => `<div class="node${n.final ? ' is-final' : ''}" data-i="${esc(n.i)}">
        ${n.shot ? `<img class="shot" src="${n.shot}" alt="screen at step ${esc(n.i)}">`
                 : `<div class="shot"></div>`}
        <div class="body">
          <span class="n">${n.final ? 'outcome' : 'step ' + esc(n.i)}${n.ms != null ? ' · ' + n.ms + 'ms' : ''}</span>
          <div class="t" title="${esc(n.title)}">${esc(n.title)}</div>
          <div class="p" title="${esc(n.url)}">${esc(n.path)}</div>
          ${n.fields.length ? `<div class="fields">${n.fields.map(f =>
            `<span class="f${f.auto ? ' is-auto' : ''}" title="${esc(f.type)}${f.auto ? ' · autocomplete=' + esc(f.auto) : ''}">${esc(f.label)}</span>`).join('')}</div>` : ''}
        </div>
      </div>`).join('')}
    </div>
  </div>
  <p class="src">
    <b>nodes</b> steps[].url · steps[].title · steps[].shot &nbsp;
    <b>flow</b> steps[].arrivedBy &nbsp;
    <b>data ⇢</b> 3.3.7 evidence.satisfied[] &nbsp;
    <b>back ↩</b> 3.3.4 branches.confirmed.changeMechanism &nbsp;
    <b>chips</b> steps[].inputsOnArrival[]
  </p>

  ${d.mech.length ? `<span class="lab">Repeated on every screen · 3.2.3</span>
  <div class="band"><table>
    <thead><tr><th>mechanism</th>${d.nodes.filter(n => !n.final).map(n => `<th style="text-align:center">step ${esc(n.i)}</th>`).join('')}</tr></thead>
    <tbody>${d.mech.map(m => `<tr><td class="k">${esc(m.name)}</td>${d.nodes.filter(n => !n.final).map(n =>
      `<td class="c">${m.at[n.i] != null ? '<b>' + m.at[n.i] + '</b>' : '—'}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>` : ''}

  <span class="lab">Verdicts</span>
  <div class="vs">${d.verdicts.map(v => `<div class="v v-${esc(v.verdict)}">
    <span class="sc">${esc(v.sc)}</span><span class="vd">${esc(v.verdict)}</span><span class="m">${esc(v.method)}</span></div>`).join('')}</div>

  ${d.planted ? `<p class="src"><b>3.3.1</b> planted ${esc(d.planted.kind)} on "${esc(d.planted.field)}" at step ${esc(d.planted.from)} → ${d.planted.advanced ? 'the step advanced' : 'the step was blocked'}</p>` : ''}

  <details>
    <summary>the same graph, as text — this is what the copy button hands an agent</summary>
    <pre id="txt">${esc(d.asText)}</pre>
  </details>
</div>

<script>
const D = ${JSON.stringify({ edges: d.edges })};
const lane = document.getElementById('lane'), svg = document.getElementById('wires');
const NS = 'http://www.w3.org/2000/svg';
const el = (t, a) => { const n = document.createElementNS(NS, t); for (const k in a) n.setAttribute(k, a[k]); return n; };

// Edges are drawn after layout, against the real boxes, so the picture cannot disagree with the page.
function wires() {
  svg.textContent = '';
  const wrap = svg.parentElement.getBoundingClientRect();
  const box = i => { const n = lane.querySelector('[data-i="' + i + '"]'); if (!n) return null;
    const r = n.getBoundingClientRect();
    return { l: r.left - wrap.left + svg.parentElement.scrollLeft, r: r.right - wrap.left + svg.parentElement.scrollLeft,
      t: r.top - wrap.top, b: r.bottom - wrap.top, cx: (r.left + r.right) / 2 - wrap.left + svg.parentElement.scrollLeft };
  };
  svg.setAttribute('width', lane.scrollWidth); svg.setAttribute('height', svg.parentElement.scrollHeight);

  const defs = el('defs');
  for (const [id, col] of [['a-flow', 'var(--ink-3)'], ['a-data', 'var(--accent)'], ['a-back', 'var(--finding)']]) {
    const m = el('marker', { id, viewBox: '0 0 8 8', refX: '7', refY: '4', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' });
    m.append(el('path', { d: 'M0 0 L8 4 L0 8 z', fill: col })); defs.append(m);
  }
  svg.append(defs);

  for (const e of D.edges) {
    const a = box(e.from), b = box(e.to); if (!a || !b) continue;
    let d, col, y;
    if (e.kind === 'flow') {
      y = a.t + 56; d = 'M' + (a.r + 3) + ' ' + y + ' L' + (b.l - 5) + ' ' + y; col = 'var(--ink-3)';
    } else if (e.kind === 'data') {
      // above the lane: a value carried forward from one screen to another
      y = a.t - 30; d = 'M' + a.cx + ' ' + (a.t - 2) + ' C' + a.cx + ' ' + y + ', ' + b.cx + ' ' + y + ', ' + b.cx + ' ' + (b.t - 6);
      col = 'var(--accent)';
    } else {
      // below the lane: the way back the product offers
      y = a.b + 44; d = 'M' + a.cx + ' ' + (a.b + 2) + ' C' + a.cx + ' ' + y + ', ' + b.cx + ' ' + y + ', ' + b.cx + ' ' + (b.b + 6);
      col = 'var(--finding)';
    }
    svg.append(el('path', { d, fill: 'none', stroke: col, 'stroke-width': e.kind === 'flow' ? 1.5 : 1.5,
      'stroke-dasharray': e.kind === 'flow' ? '' : '4 3', 'marker-end': 'url(#a-' + e.kind + ')' }));
    const mx = (a.cx + b.cx) / 2;
    const ly = e.kind === 'flow' ? y - 8 : e.kind === 'data' ? y + 14 : y - 6;
    if (!e.label) continue;
    const t = el('text', { x: e.kind === 'flow' ? (a.r + b.l) / 2 : mx, y: ly, fill: col,
      'text-anchor': 'middle', 'font-size': '11', 'font-family': 'ui-monospace, Menlo, monospace' });
    t.textContent = e.label;
    if (e.full) { const ti = el('title'); ti.textContent = e.full; t.append(ti); }
    svg.append(t);
    const bb = t.getBBox();
    const pad = 4;
    const bgr = el('rect', { x: bb.x - pad, y: bb.y - 1, width: bb.width + pad * 2, height: bb.height + 2,
      rx: '3', fill: 'var(--rail)' });
    svg.insertBefore(bgr, t);
  }
}
addEventListener('resize', wires);
svg.parentElement.addEventListener('scroll', wires, { passive: true });
if (document.fonts?.ready) document.fonts.ready.then(wires);
addEventListener('load', wires);
wires();

document.getElementById('theme').onclick = () => {
  const r = document.documentElement;
  const dark = getComputedStyle(r).getPropertyValue('--bg').trim() === '${T['dk-bg']}';
  r.setAttribute('data-theme', dark ? 'light' : 'dark');
};
document.getElementById('copy').onclick = async e => {
  const b = e.currentTarget, was = b.textContent;
  try { await navigator.clipboard.writeText(document.getElementById('txt').textContent); b.textContent = 'copied'; }
  catch { b.textContent = 'refused'; }
  setTimeout(() => { b.textContent = was; }, 1600);
};
</script>
</body>
</html>`;
}

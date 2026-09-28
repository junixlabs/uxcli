#!/usr/bin/env node
// The Verdict Lab: real runs, regenerated, as a page. Nothing on it is typed by hand — every card is
// the text uxcli printed, every image is one the run saved, every packet is linked. It builds
// docs/lab/ from (1) the fixture CRM, served and measured on both journeys at 390×844, and (2) every
// page probe's own must-fail and must-pass twins, measured with --prove. GitHub Pages serves docs/lab.
//
// Design: a reading page, not a dashboard. One column, the card in the same monospace the terminal
// shows, the verdict as a coloured word, pictures beside the card that produced them. Palette: slate
// neutrals with the three semantic colours the card already uses (fail / finding / pass).
//
//   node scripts/lab.mjs            → docs/lab/index.html, docs/lab/runs/**, docs/lab/share/*.png
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import { fileURLToPath, pathToFileURL } from 'node:url';
import { launch } from '../src/browser.js';
import { runPage, PAGE_PROBES } from '../src/page.js';
import { card } from '../src/card.js';
import { journeyCard, why } from '../src/core/report/index.js';
import { runJourney } from '../src/journey.js';
import { stage, serve } from '../src/demo.js';
import { shareCard } from './share-card.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'docs', 'lab');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;

fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(path.join(OUT, 'runs'), { recursive: true }); fs.mkdirSync(path.join(OUT, 'share'));
const entries = [];

// Copy a run directory under docs/lab/runs/<name>/ and return the relative paths the page links.
function keep(name, dir, run, text) {
  const dst = path.join(OUT, 'runs', name); fs.mkdirSync(path.join(dst, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(dst, 'run.json'), JSON.stringify(run, null, 1) + '\n'); fs.writeFileSync(path.join(dst, 'card.txt'), text + '\n');
  const shots = fs.existsSync(path.join(dir, 'artifacts')) ? fs.readdirSync(path.join(dir, 'artifacts')).filter(f => /\.png$/i.test(f)).sort() : [];
  for (const f of shots) fs.copyFileSync(path.join(dir, 'artifacts', f), path.join(dst, 'artifacts', f));
  return { packet: `runs/${name}/run.json`, cardFile: `runs/${name}/card.txt`, shots: shots.map(f => `runs/${name}/artifacts/${f}`) };
}
const verdictOf = run => { const vs = (run.verdicts || []).map(v => v.value).concat((run.probes || []).map(p => p.verdict)); return vs.includes('fail') ? 'fail' : vs.includes('finding') ? 'finding' : vs.includes('unmeasurable') ? 'unmeasurable' : 'pass'; };

const browser = await launch();
// 1. The fixture CRM: two journeys, both against the planted defects DEFECTS.md lists.
{
  const dir = stage(fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-lab-')) + '/crm');
  const { child, port } = await serve(dir);
  try {
    for (const [j, note] of [['handle-inbound-lead', 'C-001, signed by a product owner and sourced to the actor\'s own words, says the call action must be reachable without scrolling from 390px. The page puts it below five sections.'],
      ['authenticate', 'The recovery workflow server-error intercepts POST /api/login with a 500 at the browser. The page clears the email field on that branch, so anon.login_failed_retryable cannot hold.']]) {
      const r = await runJourney(path.join(dir, '.uxcli', 'journeys', `${j}.json`), { origin: `http://localhost:${port}` });
      if (r.problems) throw new Error(r.problems.join('; '));
      const text = journeyCard(r.run, r.commitments) + (r.run.verdicts.some(v => v.value === 'fail' || v.value === 'finding') ? '\n\n' + r.run.verdicts.filter(v => v.value === 'fail' || v.value === 'finding').map(v => '  next   ' + why(v, r.commitments)).join('\n') : '');
      const k = keep(`crm-${j}`, r.dir, r.run, text);
      const share = `share/crm-${j}.png`; let shared = null;
      try { await shareCard(r.dir, path.join(OUT, share), { browser }); shared = share; } catch {}
      entries.push({ kind: 'journey', group: 'A product with defects planted on purpose', title: j, subtitle: '390×844 · local', verdict: verdictOf(r.run), exit: r.run.exit, note, text, run: r.run, commitments: r.commitments, ...k, share: shared, source: 'test/fixtures/crm (DEFECTS.md)' });
    }
  } finally { child.kill(); }
}
// 2. Every page probe's twins: the pair the gate holds, shown.
for (const probe of PAGE_PROBES) {
  const pdir = path.join(ROOT, 'src', 'probes', probe.id.replace(/^page\./, ''));
  const pair = JSON.parse(fs.readFileSync(path.join(pdir, 'pair.json'), 'utf8')); const PAIR = pair;
  for (const sub of ['must-fail', 'must-pass']) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-lab-p-')); const shots = path.join(tmp, 'artifacts'); fs.mkdirSync(shots);
    const url = pathToFileURL(path.join(pdir, sub, 'index.html')).href;
    const run = await runPage(url, { browser, only: [probe.id], outDir: shots, prove: sub === 'must-pass' });
    run.exit = run.probes.some(p => p.verdict === 'fail') ? 2 : 0; run.uxcli = VERSION; run.outDir = `runs/${probe.id}-${sub}`;
    const text = card(run); const k = keep(`${probe.id}-${sub}`, tmp, run, text);
    let shared = null; if (sub === 'must-fail') { try { await shareCard(path.join(OUT, 'runs', `${probe.id}-${sub}`), path.join(OUT, 'share', `${probe.id}.png`), { browser }); shared = `share/${probe.id}.png`; } catch {} }
    entries.push({ kind: 'page', group: 'Every probe, failing on demand and passing on its twin', probe: probe.id, sc: probe.sc, sub, title: `${probe.sc} ${probe.id.replace(/^page\./, '')}`, verdict: verdictOf(run), exit: run.exit, note: sub === 'must-fail' ? pair.operator || '' : '', text, run, ...k, share: shared, source: `src/probes/${probe.id.replace(/^page\./, '')}/${sub}/` });
  }
}
await browser.close();


// Machine paths are noise to a reader and a leak besides: every card is printed relative to the repo.
const clean = t => String(t ?? '').split('file://' + ROOT + '/').join('').split(ROOT + '/').join('').split(ROOT).join('.');
const VERDICT_WORD = { fail: 'FAIL', finding: 'FINDING', pass: 'PASS', unmeasurable: 'UNMEASURABLE', 'not-applicable': 'N/A' };
const pill = v => `<span class="v ${esc(v)}">${esc(VERDICT_WORD[v] || v)}</span>`;
const byId = list => Object.fromEntries((list || []).map(c => [c.id, c]));
const shotsOf = e => Object.fromEntries(e.shots.map(s => [path.basename(s), s]));
const img = (src, caption, cited) => `<figure class="shot${cited ? ' cited' : ''}"><a href="${esc(src)}"><img src="${esc(src)}" alt="${esc(caption)}" loading="lazy"></a><figcaption>${esc(caption)}${cited ? ' · cited' : ''}</figcaption></figure>`;
const rows = pairs => `<dl class="four">${pairs.filter(([, v]) => v).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(clean(v))}</dd></div>`).join('')}</dl>`;

// A journey run: the loud verdicts first, each with the picture it cites; then the steps; then the rest folded.
function journeyEntry(e, i) {
  const run = e.run; const C = byId(e.commitments); const S = shotsOf(e);
  const loud = run.verdicts.filter(v => v.value === 'fail' || v.value === 'finding');
  const quiet = run.verdicts.filter(v => !loud.includes(v));
  const cited = new Set(loud.map(v => v.shot).filter(Boolean));
  const verdicts = loud.map(v => {
    const c = C[v.commitment]; const id = v.commitment ? (run.verdicts.filter(x => x.commitment === v.commitment).length > 1 ? `${v.commitment} [${v.measurement ?? 0}]` : v.commitment) : `state ${run.steps.find(s => s.id === v.step && s.workflow === v.workflow)?.after?.state || ''}`;
    const where = `${v.workflow || run.steps.find(s => s.id === v.where)?.workflow || ''}/${v.step || v.where}`;
    const rule = c ? `${c.statement} — owner ${c.owner?.type} ${c.owner?.ref}, source ${c.source?.doc}` : `the journey's own declaration: the state must hold after the step`;
    const check = v.shot ? `open the picture on the right: ${v.shot}` : 'open run.json';
    return { block: `<div class="verdict">
      <div class="vhead">${pill(v.value)}<span class="vid">${esc(id)}</span></div>
      ${rows([['what', v.what], ['where', where], ['rule', rule], ['check', check]])}
    </div>`, shot: v.shot && S[v.shot] ? img(S[v.shot], v.shot.replace('.png', ''), true) : '' };
  });
  const steps = run.steps.map(s => s.kind === 'fixture'
    ? `<li class="step fixture"><span class="sid">${esc(s.workflow)}/${esc(s.id)}</span><span class="sact">fixture ${esc(s.profile)}</span><span class="sobs">produced ${esc(Object.keys(s.produced || {}).join(', '))} · ${esc(s.ms)}ms</span></li>`
    : `<li class="step ${s.after?.held === false ? 'broke' : ''}"><span class="sid">${esc(s.workflow)}/${esc(s.id)}</span><span class="sact">${esc(s.action)}</span><span class="sobs">${esc(s.before?.state)} <b>${s.before?.held ? 'held' : 'not held'}</b> → ${esc(s.after?.state)} <b>${s.after?.held ? 'held' : 'NOT HELD'}</b> · ${esc(s.after?.strength)}${s.timing?.toStable != null ? ` · ${esc(s.timing.toStable)}ms` : ''}</span></li>`).join('');
  const others = e.shots.filter(s => !cited.has(path.basename(s)));
  return `<article id="r${i}" class="run">
    <header class="rhead"><div>${pill(e.verdict)}<h3>journey <code>${esc(e.title)}</code></h3><span class="sub">${esc(e.subtitle)} · exit ${esc(e.exit)} · ${esc(String(run.ranAt).slice(0, 16).replace('T', ' '))}</span></div><p class="note">${esc(e.note)}</p></header>
    <div class="vgrid">
      <div class="left">
        ${verdicts.map(v => v.block).join('')}
        ${quiet.length ? `<p class="quiet">Also decided: ${quiet.map(v => `<code>${esc(v.commitment || 'state')}</code> ${esc(VERDICT_WORD[v.value] || v.value)}${v.cause && v.cause !== 'probe-said' ? ` (${esc(clean(v.cause))})` : ''}`).join(' · ')}.</p>` : ''}
        <h4>Steps the browser walked</h4>
        <ol class="steps">${steps}</ol>
        ${others.length ? `<div class="strip">${others.map(s => img(s, path.basename(s).replace('.png', ''), false)).join('')}</div>` : ''}
      </div>
      <div class="evidence phone">${verdicts.map(v => v.shot).join('')}</div>
    </div>
    <details><summary>The card as printed</summary><pre>${esc(clean(e.text))}</pre></details>
    <div class="links"><a href="${esc(e.packet)}">run.json</a>${e.share ? `<a href="${esc(e.share)}">share card</a>` : ''}<span>${esc(e.source)}</span></div>
  </article>`;
}

// A probe: its two twins side by side. The fail says what it saw; the pass says what --prove planted.
function probePair(fail, pass, i) {
  const one = (e, i2) => {
    const p = e.run.probes[0]; const S = shotsOf(e); const first = e.shots[0];
    const proof = p.doctrine?.prove;
    const body = p.verdict === 'pass'
      ? rows([['measured', clean(e.text.split('\n').find(l => new RegExp('^\\s*' + e.sc.replace('.', '\\.') + '\\s').test(l))?.replace(/^\s*\S+\s+\S+\s+PASS\s*/, '').replace(/\s*·\s*would fail on .*$/, '') || '')], ['--prove', proof ? `${proof.mutation} → ${proof.wouldFail ? 'would fail' : 'could not be made to fail'}` : null]])
      : rows([['what', p.cite?.what], ['where', p.cite?.where], ['rule', `WCAG ${p.sc} · ${p.provenance} · ${p.method?.status || p.method}`], ['check', p.cite?.check]]);
    return `<div class="twin" id="r${i2}">
      <div class="vhead">${pill(p.verdict)}<span class="vid">${esc(e.sub)}</span><span class="sub">exit ${esc(e.exit)}</span></div>
      ${body}
      ${first ? `<div class="evidence wide">${img(first, path.basename(first).replace('.png', ''), p.verdict !== 'pass')}</div>` : ''}
      <details><summary>The card as printed</summary><pre>${esc(clean(e.text))}</pre></details>
      <div class="links"><a href="${esc(e.packet)}">run.json</a>${e.share ? `<a href="${esc(e.share)}">share card</a>` : ''}<span>${esc(e.source)}</span></div>
    </div>`;
  };
  const p = fail.run.probes[0];
  return `<article class="run pair">
    <header class="rhead"><div>${pill(fail.verdict)}<h3>${esc(fail.sc)} <code>${esc(fail.probe.replace(/^page\./, ''))}</code></h3><span class="sub">${esc(p.provenance)} · ${esc(p.method?.status || p.method)}</span></div><p class="note">${esc(fail.note)}</p></header>
    <div class="twins">${one(fail, i)}${one(pass, i + 1)}</div>
  </article>`;
}

const journeys = entries.filter(e => e.kind === 'journey');
const probes = [...new Set(entries.filter(e => e.kind === 'page').map(e => e.probe))].map(id => [entries.find(e => e.probe === id && e.sub === 'must-fail'), entries.find(e => e.probe === id && e.sub === 'must-pass')]);
const count = v => entries.filter(e => e.verdict === v).length;
let n = 0; const next = () => n++;
const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>uxcli Verdict Lab</title>
<meta name="description" content="Real runs of uxcli, regenerated from the repository: each verdict with the picture it cites, the steps the browser walked, and the packet to dispute it.">
<style>
*,*::before,*::after{box-sizing:border-box}
:root{color-scheme:light;--bg:#f5f4f0;--surface:#fff;--well:#eeede8;--ink:#1d2126;--dim:#666b73;--line:#dcdbd4;--accent:#3b5b8c;--fail:#c2361c;--finding:#9a6300;--pass:#1e7a48;--unmeasurable:#666b73;--mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;--sans:-apple-system,"Segoe UI",Helvetica,Arial,sans-serif}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){color-scheme:dark;--bg:#14171b;--surface:#1c2025;--well:#22272d;--ink:#ebe9e3;--dim:#9a9d96;--line:#2f353c;--accent:#8fb0e0;--fail:#ff6b4d;--finding:#e3b23a;--pass:#5fd38a;--unmeasurable:#9a9d96}}
:root[data-theme="dark"]{color-scheme:dark;--bg:#14171b;--surface:#1c2025;--well:#22272d;--ink:#ebe9e3;--dim:#9a9d96;--line:#2f353c;--accent:#8fb0e0;--fail:#ff6b4d;--finding:#e3b23a;--pass:#5fd38a;--unmeasurable:#9a9d96}
html{background:var(--bg)}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 var(--sans);padding-block:40px 72px;padding-inline:16px}
main{max-width:1120px;margin:0 auto;display:grid;gap:36px}
a{color:var(--accent)} a:focus-visible{outline:2px solid var(--finding);outline-offset:2px}
code{font:.92em var(--mono)}
.hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px 40px;align-items:end}
.hero h1{font:700 32px/1.1 var(--sans);margin:0 0 10px;letter-spacing:-.01em}
.hero p{margin:0;color:var(--dim);max-width:62ch}
.counts{display:flex;gap:10px}
.count{border:1px solid var(--line);border-radius:6px;padding:10px 14px;min-width:96px;background:var(--surface)}
.count b{display:block;font:600 24px/1 var(--mono);font-variant-numeric:tabular-nums;margin-bottom:6px}
.count.fail b{color:var(--fail)}.count.finding b{color:var(--finding)}.count.pass b{color:var(--pass)}
.count span{font-size:12px;color:var(--dim);text-transform:uppercase;letter-spacing:.06em}
section>h2{font:600 13px/1 var(--sans);letter-spacing:.08em;text-transform:uppercase;color:var(--dim);margin:0 0 14px;padding-bottom:10px;border-bottom:1px solid var(--line)}
section .list{display:grid;gap:22px}
.run{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:22px 24px;display:grid;gap:18px}
.rhead{display:grid;gap:8px}
.rhead>div{display:flex;flex-wrap:wrap;align-items:baseline;gap:10px 14px}
.rhead h3{margin:0;font:600 19px/1.3 var(--sans)}
.sub{color:var(--dim);font-size:13px}
.note{margin:0;color:var(--dim);max-width:78ch}
.v{display:inline-block;font:700 11px/1 var(--mono);letter-spacing:.08em;padding:6px 8px;border-radius:3px;color:#fff;background:var(--unmeasurable)}
.v.fail{background:var(--fail)}.v.finding{background:var(--finding)}.v.pass{background:var(--pass)}.v.not-applicable,.v.unmeasurable{background:var(--unmeasurable)}
.vgrid{display:grid;grid-template-columns:minmax(0,1fr) 232px;gap:18px 28px;align-items:start}
.left{display:grid;gap:16px;min-width:0}
.verdict{display:grid;gap:12px;padding:16px 18px;border-radius:6px;background:var(--well);border-left:4px solid var(--fail)}
.vhead{display:flex;flex-wrap:wrap;align-items:center;gap:10px}
.vid{font:600 14px var(--mono)}
.four{margin:0;display:grid;gap:8px}
.four div{display:grid;grid-template-columns:64px minmax(0,1fr);gap:12px}
.four dt{color:var(--dim);font:600 12px/1.6 var(--mono);text-transform:uppercase;letter-spacing:.06em}
.four dd{margin:0;font-size:14px;line-height:1.5;overflow-wrap:anywhere}
.evidence.phone{display:grid;gap:14px}
.evidence.wide{width:100%}
.evidence.wide img{width:auto;max-width:100%;max-height:260px}
.shot{margin:0;display:grid;gap:6px}
.shot img{display:block;width:100%;height:auto;border:1px solid var(--line);border-radius:4px;background:#fff}
.shot.cited img{border:2px solid var(--fail)}
.shot figcaption{font:12px var(--mono);color:var(--dim)}
.quiet{margin:0;font-size:13px;color:var(--dim)}
h4{margin:6px 0 0;font:600 12px/1 var(--sans);letter-spacing:.08em;text-transform:uppercase;color:var(--dim)}
.steps{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.step{display:grid;grid-template-columns:150px minmax(0,1fr);gap:4px 16px;padding:8px 12px;border:1px solid var(--line);border-radius:4px;font-size:13px}
.step .sid{font:600 12px/1.6 var(--mono)}
.step .sact{color:var(--ink)}
.step .sobs{grid-column:2;color:var(--dim);font:12px/1.5 var(--mono)}
.step .sobs b{font-weight:600;color:var(--pass)}
.step.broke{border-color:var(--fail)}.step.broke .sobs b:last-of-type{color:var(--fail)}
.step.fixture{opacity:.85}
.strip{display:flex;flex-wrap:wrap;gap:12px}
.strip .shot{width:min(150px,45%)}
details{border-top:1px solid var(--line);padding-top:10px}
summary{cursor:pointer;color:var(--dim);font-size:13px}
pre{margin:10px 0 0;padding:14px;background:var(--well);border-radius:4px;font:12px/1.45 var(--mono);overflow-x:auto}
.links{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:13px}
.links span{color:var(--dim)}
.twins{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.twin{display:grid;align-content:start;gap:12px;padding:16px 18px;border:1px solid var(--line);border-radius:6px;background:var(--well)}
.twin .four dd{font-size:13px}
.twin details{border-top:1px solid var(--line)}
footer{color:var(--dim);font-size:13px;border-top:1px solid var(--line);padding-top:16px;max-width:78ch}
@media (max-width:760px){.hero{grid-template-columns:1fr}.vgrid{grid-template-columns:1fr}.evidence.phone{grid-template-columns:repeat(auto-fill,minmax(160px,1fr))}.twins{grid-template-columns:1fr}.step{grid-template-columns:1fr}.step .sobs{grid-column:1}}
@media (prefers-reduced-motion: reduce){*{transition:none!important}}
</style>
</head>
<body>
<main>
<header class="hero">
  <div>
    <h1>uxcli Verdict Lab</h1>
    <p>Every run here was made by <code>scripts/lab.mjs</code> from this repository at ${esc(VERSION)}. Each verdict is shown with the picture it cites, the steps the browser walked, and the packet you would attach to dispute it. Nothing was typed by hand: a fail cites a rule somebody signed, a finding is a would-be fail from a method not yet validated, and a pass says only that the probe that ran found nothing.</p>
  </div>
  <div class="counts"><div class="count fail"><b>${count('fail')}</b><span>fail</span></div><div class="count finding"><b>${count('finding')}</b><span>finding</span></div><div class="count pass"><b>${count('pass')}</b><span>pass</span></div></div>
</header>

<section>
  <h2>A product with defects planted on purpose</h2>
  <div class="list">${journeys.map(e => journeyEntry(e, next())).join('\n')}</div>
</section>

<section>
  <h2>Every probe, failing on demand and passing on its twin</h2>
  <div class="list">${probes.map(([f, p]) => probePair(f, p, (next(), next()))).join('\n')}</div>
</section>

<footer>Regenerate with <code>node scripts/lab.mjs</code>. Submit a run of your own, or dispute one, with the packet: <a href="https://github.com/junixlabs/uxcli/issues/new/choose">issues/new/choose</a>.</footer>
</main>
</body>
</html>
`;
fs.writeFileSync(path.join(OUT, 'index.html'), page);
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
console.log(`docs/lab: ${entries.length} runs · ${entries.map(e => e.verdict).join(', ')}`);

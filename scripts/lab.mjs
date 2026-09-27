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
      entries.push({ group: 'A product with defects planted on purpose', title: `journey ${j} · 390×844`, verdict: verdictOf(r.run), exit: r.run.exit, note, text, ...k, share: shared, source: 'test/fixtures/crm (DEFECTS.md)' });
    }
  } finally { child.kill(); }
}
// 2. Every page probe's twins: the pair the gate holds, shown.
for (const probe of PAGE_PROBES) {
  const pdir = path.join(ROOT, 'src', 'probes', probe.id.replace(/^page\./, ''));
  const pair = JSON.parse(fs.readFileSync(path.join(pdir, 'pair.json'), 'utf8'));
  for (const sub of ['must-fail', 'must-pass']) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-lab-p-')); const shots = path.join(tmp, 'artifacts'); fs.mkdirSync(shots);
    const url = pathToFileURL(path.join(pdir, sub, 'index.html')).href;
    const run = await runPage(url, { browser, only: [probe.id], outDir: shots, prove: sub === 'must-pass' });
    run.exit = run.probes.some(p => p.verdict === 'fail') ? 2 : 0; run.uxcli = VERSION; run.outDir = `runs/${probe.id}-${sub}`;
    const text = card(run); const k = keep(`${probe.id}-${sub}`, tmp, run, text);
    let shared = null; if (sub === 'must-fail') { try { await shareCard(path.join(OUT, 'runs', `${probe.id}-${sub}`), path.join(OUT, 'share', `${probe.id}.png`), { browser }); shared = `share/${probe.id}.png`; } catch {} }
    entries.push({ group: 'Every probe, failing on demand and passing on its twin', title: `${probe.sc} ${probe.id} · ${sub}`, verdict: verdictOf(run), exit: run.exit, note: sub === 'must-fail' ? pair.operator || '' : `The twin, measured with --prove: the pass carries the planted defect that would have failed it.`, text, ...k, share: shared, source: `src/probes/${probe.id.replace(/^page\./, '')}/${sub}/` });
  }
}
await browser.close();

const groups = [...new Set(entries.map(e => e.group))];
const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>uxcli Verdict Lab</title>
<meta name="description" content="Real runs of uxcli, regenerated from the repository: the card as printed, the pictures the run saved, the packet to dispute it.">
<style>
*,*::before,*::after{box-sizing:border-box}
:root{color-scheme:light;--bg:#f4f4f1;--surface:#ffffff;--ink:#1c1f23;--dim:#5f646b;--line:#d9dad4;--fail:#c8321a;--finding:#a56a00;--pass:#1f7a45;--unm:#5f646b;--mono:"SF Mono",Menlo,Consolas,"DejaVu Sans Mono",monospace;--sans:-apple-system,"Segoe UI",Helvetica,Arial,sans-serif}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){color-scheme:dark;--bg:#15181c;--surface:#1d2126;--ink:#ecebe6;--dim:#9a9d96;--line:#2e333a;--fail:#ff6a4c;--finding:#e6b23a;--pass:#5fd38a;--unm:#9a9d96}}
:root[data-theme="dark"]{color-scheme:dark;--bg:#15181c;--surface:#1d2126;--ink:#ecebe6;--dim:#9a9d96;--line:#2e333a;--fail:#ff6a4c;--finding:#e6b23a;--pass:#5fd38a;--unm:#9a9d96}
html{background:var(--bg)}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 var(--sans);padding-block:32px 64px;padding-inline:16px}
main{max-width:1040px;margin:0 auto;display:grid;gap:40px}
header h1{font:700 30px/1.15 var(--sans);margin:0 0 8px;text-wrap:balance}
header p{margin:0;color:var(--dim);max-width:68ch}
h2{font:600 20px/1.3 var(--sans);margin:0 0 4px;padding-top:12px;border-top:1px solid var(--line)}
.toc{display:flex;flex-wrap:wrap;gap:8px 18px;font-size:14px;color:var(--dim)}
.toc a{color:inherit}
article{background:var(--surface);border:1px solid var(--line);border-radius:6px;padding:20px;display:grid;gap:14px}
.head{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 16px}
.head h3{font:600 17px/1.3 var(--mono);margin:0}
.v{font:700 13px/1 var(--mono);letter-spacing:.06em;text-transform:uppercase;padding:5px 8px;border-radius:3px;border:1px solid currentColor}
.v.fail{color:var(--fail)}.v.finding{color:var(--finding)}.v.pass{color:var(--pass)}.v.unmeasurable{color:var(--unm)}
.exit{color:var(--dim);font:13px var(--mono);margin-left:auto}
.note{margin:0;color:var(--dim);max-width:76ch}
pre{margin:0;padding:14px;background:var(--bg);border:1px solid var(--line);border-radius:4px;font:13px/1.45 var(--mono);overflow-x:auto;white-space:pre}
.shots{display:flex;flex-wrap:wrap;gap:10px}
.shots a{display:block;max-width:100%}
.shots img{display:block;max-width:100%;max-height:260px;width:auto;border:1px solid var(--line);border-radius:3px;background:#fff}
.links{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:14px}
.links a{color:var(--dim)}
footer{color:var(--dim);font-size:14px;border-top:1px solid var(--line);padding-top:16px}
a:focus-visible{outline:2px solid var(--finding);outline-offset:2px}
@media (prefers-reduced-motion: reduce){*{transition:none!important}}
</style>
</head>
<body>
<main>
<header>
<h1>uxcli Verdict Lab</h1>
<p>Every run on this page was made by <code>scripts/lab.mjs</code> from the repository at version ${esc(VERSION)}: the card exactly as the terminal printed it, the pictures the run saved, and the packet you would attach to dispute it. Nothing here was typed by hand. A <strong>fail</strong> cites a rule somebody signed; a <strong>finding</strong> is a would-be fail from a method not yet validated; <strong>pass</strong> says only that the probe that ran found nothing.</p>
</header>
<nav class="toc">${entries.map((e, i) => `<a href="#r${i}">${esc(e.title)}</a>`).join('')}</nav>
${groups.map(g => `<section>
<h2>${esc(g)}</h2>
<div style="display:grid;gap:18px;margin-top:14px">
${entries.filter(e => e.group === g).map(e => { const i = entries.indexOf(e); return `<article id="r${i}">
<div class="head"><span class="v ${esc(e.verdict)}">${esc(e.verdict)}</span><h3>${esc(e.title)}</h3><span class="exit">exit ${esc(e.exit)}</span></div>
<p class="note">${esc(e.note)}</p>
<pre>${esc(e.text)}</pre>
${e.shots.length ? `<div class="shots">${e.shots.map(s => `<a href="${esc(s)}"><img src="${esc(s)}" alt="${esc(path.basename(s))} — saved by the run" loading="lazy"></a>`).join('')}</div>` : ''}
<div class="links"><a href="${esc(e.packet)}">run.json</a><a href="${esc(e.cardFile)}">card.txt</a>${e.share ? `<a href="${esc(e.share)}">share card (1200×630)</a>` : ''}<span style="color:var(--dim)">source: ${esc(e.source)}</span></div>
</article>`; }).join('\n')}
</div>
</section>`).join('\n')}
<footer>Regenerate with <code>node scripts/lab.mjs</code>. Submit a run of your own: <a href="https://github.com/junixlabs/uxcli/issues/new/choose">issues/new/choose → A real run for the Verdict Lab</a>. Dispute one: the same form, with the packet.</footer>
</main>
</body>
</html>
`;
fs.writeFileSync(path.join(OUT, 'index.html'), page);
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
console.log(`docs/lab: ${entries.length} runs · ${entries.map(e => e.verdict).join(', ')}`);

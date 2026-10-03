// `uxcli experience`: what the person went through on each journey's latest walk, read from the run
// packets on disk, and — when a journey has an older walk — what changed since. The numbers are
// core's (src/core/experience.js); this file finds the runs, prints the card and writes the page that
// pins each finding on the screenshot of the step it happened at.
import fs from 'node:fs'; import path from 'node:path';
import { experience, compareExperience, journeyName, KLM, LIMITS } from './core/experience.js';
import { allRuns, artifactsDir, UXCLI } from './adapters/store/runs.js';

const readJson = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// A run directory or a run.json names one walk; a project directory means every journey's latest walk,
// each with the walk before it when there is one.
export function experiences(target = '.') {
  const p = path.resolve(target);
  if (fs.existsSync(p) && fs.statSync(p).isFile()) return [{ dir: path.dirname(p), report: experience(readJson(p)) }];
  if (fs.existsSync(path.join(p, 'run.json'))) return [{ dir: p, report: experience(readJson(path.join(p, 'run.json'))) }];
  const byJourney = new Map();
  for (const x of allRuns(p)) { const j = journeyName(x.run); if (!j || !Array.isArray(x.run.steps) || !x.run.steps.length) continue; (byJourney.get(j) || byJourney.set(j, []).get(j)).push(x); }
  return [...byJourney.values()].map(xs => {
    const now = { dir: xs[0].at, report: experience(xs[0].run) };
    if (xs[1]) { const before = experience(xs[1].run); now.previous = { dir: xs[1].at, report: before }; now.change = compareExperience(before, now.report); }
    return now;
  });
}

const secs = n => `${n.toFixed(1)} s`;
const signed = n => (n > 0 ? '+' : '') + (Number.isInteger(n) ? n : n.toFixed(1));

export function experienceCard(list) {
  const L = ['uxcli experience · what the person goes through, from the trace of the last walk', ''];
  if (!list.length) L.push('  no journey run with steps on disk — walk one first: uxcli run .uxcli/journeys/<id>.json');
  for (const x of list) {
    const r = x.report;
    L.push(`  ${r.journey || '(journey)'} · ${r.viewport || '?'} · ${r.ranAt || ''}`);
    for (const w of r.workflows) {
      const t = w.totals;
      L.push(`    ${w.id || 'workflow'}: ${t.steps} step${t.steps === 1 ? '' : 's'} · ${t.clicks} click${t.clicks === 1 ? '' : 's'} · ${t.fields} field${t.fields === 1 ? '' : 's'} typed (${t.chars} characters) · ${t.scrolls} scroll${t.scrolls === 1 ? '' : 's'} · slowest ${t.slowestMs} ms · about ${secs(t.klmSeconds)} for a practised user`);
      for (const s of r.steps.filter(s => s.workflow === w.id)) L.push(`      ${s.id.padEnd(6)} ${String(s.klmSeconds).padStart(5)} s  ${s.response || '-'}${s.reached === false ? '  not reached' : ''}  ${s.action || ''}`);
    }
    if (x.change) {
      const c = x.change.totals;
      L.push(`    since the walk before: steps ${signed(c.steps.delta)} · clicks ${signed(c.clicks.delta)} · characters ${signed(c.chars.delta)} · scrolls ${signed(c.scrolls.delta)} · estimate ${signed(c.klmSeconds.delta)} s`);
      for (const f of x.change.fixed) L.push(`      gone   ${f.metric} at ${f.step}: ${f.what}`);
      for (const f of x.change.introduced) L.push(`      new    ${f.metric} at ${f.step}: ${f.what}`);
    }
    if (!r.findings.length) L.push('    no finding on what these metrics look at');
    for (const f of r.findings) L.push(`    finding  ${f.metric.padEnd(11)} ${r.workflows.length > 1 ? f.workflow + '/' : ''}${f.step}: ${f.what}`, `             source: ${f.source}`);
    L.push('');
  }
  L.push('  Every finding is method-unproven: reported, never a fail, never a pass. The estimate uses',
    `  K ${KLM.K} s · P ${KLM.P} s · BB ${2 * KLM.B} s · H ${KLM.H} s · M ${KLM.M} s, each scroll one P, plus the measured settle time.`,
    `  Response bands: instant ≤ ${LIMITS.instant} ms · flow ≤ ${LIMITS.flow} ms · wait ≤ ${LIMITS.attention} ms · lost beyond.`,
    '  uxcli experience --page writes .uxcli/experience/index.html: each step\'s screenshot with its findings pinned.');
  return L.join('\n');
}

// The page: one section per journey, one card per step with the screenshot it was taken at and each
// finding that has a place drawn on it. Coordinates are the browser's, in the viewport the run used.
export function experiencePage(list, outFile) {
  const rel = (dir, shot) => { if (!shot) return null; const a = path.join(artifactsDir(dir), shot); const f = fs.existsSync(a) ? a : path.join(dir, shot); return fs.existsSync(f) ? path.relative(path.dirname(outFile), f).split(path.sep).join('/') : null; };
  const sections = list.map(x => {
    const r = x.report; const t = r.totals;
    const change = x.change ? `<p class="change">Since the walk before: ${['steps', 'clicks', 'chars', 'scrolls'].map(k => `${k} ${signed(x.change.totals[k].delta)}`).join(' · ')} · estimate ${signed(x.change.totals.klmSeconds.delta)} s${x.change.fixed.length ? ` · ${x.change.fixed.length} finding${x.change.fixed.length === 1 ? '' : 's'} gone` : ''}${x.change.introduced.length ? ` · ${x.change.introduced.length} new` : ''}</p>` : '';
    const cards = r.steps.map(s => {
      const fs_ = r.findings.filter(f => f.step === s.id && f.workflow === s.workflow);
      const pinned = fs_.filter(f => f.rect);
      const shot = rel(x.dir, pinned.length ? s.shots.before : (s.shots.after || s.shots.before));
      const boxes = pinned.map((f, i) => `<span class="box" data-x="${f.rect.x}" data-y="${f.rect.y}" data-w="${f.rect.w}" data-h="${f.rect.h}" data-vw="${f.rect.viewport?.w || ''}"><b>${i + 1}</b></span>`).join('');
      const pic = shot ? `<div class="shot"><img src="${esc(shot)}" alt="${esc(s.action || s.id)}, ${pinned.length ? 'before the action' : 'after the action'}">${boxes}</div>` : '<div class="shot none">no screenshot for this step</div>';
      const list_ = fs_.length ? `<ol class="finds">${fs_.map(f => `<li><span class="metric">${esc(f.metric)}</span> ${esc(f.what)}<small>${esc(f.source)}</small></li>`).join('')}</ol>` : '<p class="clean">No finding on this step.</p>';
      return `<article class="step${fs_.length ? ' has' : ''}"><header><span class="id">${esc(r.workflows.length > 1 ? `${s.workflow}/${s.id}` : s.id)}</span><h3>${esc(s.action || s.id)}</h3></header>${pic}<dl><div><dt>Estimate</dt><dd>${s.klmSeconds} s</dd></div><div><dt>Settled</dt><dd>${s.settleMs ?? '–'} ms · ${esc(s.response || '–')}</dd></div><div><dt>Clicks</dt><dd>${s.clicks}</dd></div><div><dt>Typed</dt><dd>${s.fields} fields · ${s.chars} chars</dd></div><div><dt>Scrolls</dt><dd>${s.scrolls}</dd></div></dl>${list_}</article>`;
    }).join('');
    return `<section><h2>${esc(r.journey || 'journey')}</h2><p class="meta">${esc(r.viewport || '')} · ${esc(r.ranAt || '')} · ${t.steps} step${t.steps === 1 ? '' : 's'} · ${t.clicks} click${t.clicks === 1 ? '' : 's'} · ${t.chars} characters typed · ${t.scrolls} scroll${t.scrolls === 1 ? '' : 's'} · about ${t.klmSeconds} s for a practised user${r.workflows.length > 1 ? ` on ${esc(r.workflows[0].id)}, ${r.workflows.length - 1} other workflow${r.workflows.length === 2 ? '' : 's'} below` : ''} · ${r.findings.length} finding${r.findings.length === 1 ? '' : 's'}</p>${change}<div class="strip">${cards}</div></section>`;
  }).join('');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>uxcli experience</title><style>
:root{color-scheme:light;--bg:#f6f7f9;--surface:#fff;--ink:#14171c;--dim:#545b66;--line:#dde1e7;--find:#8a4b00;--find-soft:#fff1dc;--pin:#c2410c;--ok:#0f6b34;--sans:-apple-system,"Segoe UI",Inter,Helvetica,Arial,sans-serif}
@media (prefers-color-scheme:dark){:root{color-scheme:dark;--bg:#101318;--surface:#181c23;--ink:#e8ebf0;--dim:#a3abb7;--line:#2b313b;--find:#f2c071;--find-soft:#3a2a10;--pin:#fb923c;--ok:#7fe0a3}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 var(--sans);padding:24px 16px 48px}
main{max-width:1400px;margin:0 auto;display:grid;gap:40px}h1{font-size:26px;margin:0}h2{font-size:20px;margin:0 0 4px}h3{font-size:15px;margin:0;font-weight:600}
.lede,.meta,.change{color:var(--dim);margin:0}.change{color:var(--ink);margin-top:6px}
.strip{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(260px,320px);gap:16px;overflow-x:auto;padding:16px 2px 8px}
.step{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:12px;display:grid;gap:10px;align-content:start}
.step.has{border-color:var(--pin)}.step header{display:flex;gap:8px;align-items:baseline}.id{font:600 12px ui-monospace,Menlo,monospace;color:var(--dim)}
.shot{position:relative;border:1px solid var(--line);border-radius:6px;overflow:hidden;background:var(--bg)}.shot img{display:block;width:100%;height:auto}
.shot.none{padding:24px;color:var(--dim);text-align:center}
.box{position:absolute;border:2px solid var(--pin);border-radius:4px;box-shadow:0 0 0 2px rgba(0,0,0,.15)}.box.below{border-style:dashed;background:rgba(194,65,12,.12)}.box.below::after{content:'below the fold';position:absolute;right:6px;bottom:3px;font:600 11px var(--sans);color:var(--pin)}.box b{position:absolute;top:-11px;left:-11px;width:22px;height:22px;border-radius:50%;background:var(--pin);color:#fff;font:700 12px/22px var(--sans);text-align:center}
dl{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:4px 12px;margin:0}dl div{display:flex;gap:6px;align-items:baseline}dt{color:var(--dim);font-size:13px}dd{margin:0;font-weight:600;font-variant-numeric:tabular-nums}
.finds{margin:0;padding-left:20px;display:grid;gap:8px}.finds li{background:var(--find-soft);border-radius:6px;padding:6px 8px}.finds small{display:block;color:var(--dim);font-size:12px;margin-top:2px}
.metric{font:600 12px ui-monospace,Menlo,monospace;color:var(--find)}.clean{margin:0;color:var(--ok)}
footer{color:var(--dim);font-size:13px}
</style></head><body><main><header><h1>Experience</h1><p class="lede">What the person goes through on each journey, from the trace of its last walk in Chrome. Every finding is method-unproven: reported with its source, never a fail and never a pass.</p></header>${sections || '<p>No journey run with steps on disk.</p>'}<footer>Estimate: keystroke-level model (Card, Moran &amp; Newell) — K ${KLM.K} s, P ${KLM.P} s, BB ${2 * KLM.B} s, H ${KLM.H} s, M ${KLM.M} s, each scroll one P, plus the measured settle time. Response bands after Nielsen (1993): ${LIMITS.instant} ms, ${LIMITS.flow} ms, ${LIMITS.attention} ms.</footer></main>
<script>
function place(){document.querySelectorAll('.shot').forEach(function(s){var img=s.querySelector('img');if(!img||!img.naturalWidth)return;s.querySelectorAll('.box').forEach(function(b){var vw=+b.dataset.vw||img.naturalWidth;var k=img.clientWidth/vw;var y=+b.dataset.y*k,h=+b.dataset.h*k,H=img.clientHeight;b.style.left=(+b.dataset.x*k)+'px';b.style.width=(+b.dataset.w*k)+'px';if(y+Math.min(h,12)>H){b.classList.add('below');b.style.top=(H-30)+'px';b.style.height='26px';}else{b.classList.remove('below');b.style.top=y+'px';b.style.height=Math.min(h,H-y)+'px';}});});}
window.addEventListener('load',place);window.addEventListener('resize',place);document.querySelectorAll('.shot img').forEach(function(i){i.addEventListener('load',place);});
</script></body></html>`;
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, html);
  return outFile;
}

export const pageFile = root => path.join(path.resolve(root), UXCLI, 'experience', 'index.html');

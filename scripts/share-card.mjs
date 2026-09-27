#!/usr/bin/env node
// A 1200×630 PNG of one verdict, for a pull-request comment or a post: the same four lines the
// terminal prints — what · where · rule · check — rendered by Chromium and read back as pixels.
// Nothing on it is written by this script; every word comes from the packet.
//
//   node scripts/share-card.mjs <run dir | run.json> [out.png] [--verdict=N]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { launch } from '../src/browser.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// One verdict, as the fields the card prints. Journey packets carry `verdicts[]`; page packets `probes[]`.
export function pick(run, n = 0) {
  const loud = v => v.value === 'fail' || v.verdict === 'fail' || v.value === 'finding' || v.verdict === 'finding';
  const vs = (run.verdicts || []).concat(run.probes || []); const chosen = vs.filter(loud)[n] || vs[n] || vs[0];
  if (!chosen) throw new Error('the packet carries no verdict');
  const isProbe = !!chosen.verdict;
  return {
    id: isProbe ? chosen.id : chosen.commitment || chosen.probe || 'journey',
    verdict: (isProbe ? chosen.verdict : chosen.value).toUpperCase(),
    what: isProbe ? chosen.cite?.what : chosen.what,
    where: isProbe ? chosen.cite?.where || run.url : `${run.journey?.ref || run.journey || run.id} · ${chosen.where || ''}`,
    rule: isProbe ? `${chosen.sc || ''} ${chosen.provenance || ''} · ${chosen.method?.status || ''}`.trim() : chosen.cause && chosen.cause !== 'probe-said' ? chosen.cause : 'the project\'s own commitment',
    check: isProbe ? chosen.cite?.check : chosen.shot ? `open artifacts/${chosen.shot}` : 'open run.json',
    exit: run.exit, ranAt: run.ranAt, version: run.uxcli || JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version,
  };
}

export const html = v => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>uxcli ${esc(v.verdict)}</title><style>
:root{--bg:#15181c;--ink:#ecebe6;--dim:#9a9d96;--fail:#ff5a3c;--find:#e6b23a;--pass:#5fd38a;--rule:#2a2f36}
html,body{margin:0;width:1200px;height:630px;background:var(--bg);color:var(--ink);font:26px/1.35 "SF Mono",Menlo,Consolas,"DejaVu Sans Mono",monospace}
.card{box-sizing:border-box;padding:48px 56px;height:630px;display:flex;flex-direction:column;gap:20px}
.head{display:flex;align-items:baseline;gap:22px;border-bottom:2px solid var(--rule);padding-bottom:18px}
.v{font-size:54px;font-weight:700;letter-spacing:.02em}.FAIL{color:var(--fail)}.FINDING{color:var(--find)}.PASS{color:var(--pass)}
.id{font-size:30px;color:var(--ink)}.exit{margin-left:auto;color:var(--dim);font-size:22px}
.row{display:grid;grid-template-columns:110px 1fr;gap:16px}.k{color:var(--dim)}.val{overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical}
.foot{margin-top:auto;display:flex;justify-content:space-between;color:var(--dim);font-size:20px;border-top:2px solid var(--rule);padding-top:16px}
</style></head><body><div class="card">
<div class="head"><span class="v ${esc(v.verdict)}">${esc(v.verdict)}</span><span class="id">${esc(v.id)}</span><span class="exit">exit ${esc(v.exit ?? '')}</span></div>
<div class="row"><span class="k">what</span><span class="val">${esc(v.what || '—')}</span></div>
<div class="row"><span class="k">where</span><span class="val">${esc(v.where || '—')}</span></div>
<div class="row"><span class="k">rule</span><span class="val">${esc(v.rule || '—')}</span></div>
<div class="row"><span class="k">check</span><span class="val">${esc(v.check || '—')}</span></div>
<div class="foot"><span>uxcli ${esc(v.version)} · measured in Chromium · ${esc(String(v.ranAt || '').slice(0, 16).replace('T', ' '))}</span><span>github.com/junixlabs/uxcli</span></div>
</div></body></html>`;

export async function shareCard(at, out, { verdict = 0, browser } = {}) {
  const file = fs.statSync(at).isDirectory() ? path.join(at, 'run.json') : at;
  const run = JSON.parse(fs.readFileSync(file, 'utf8')); const v = pick(run, verdict);
  const own = !browser; if (own) browser = await launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    await page.setContent(html(v)); await page.screenshot({ path: out, type: 'png' });
    await page.close();
  } finally { if (own) await browser.close(); }
  return { out, verdict: v };
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--')); const n = Number((process.argv.find(a => a.startsWith('--verdict=')) || '--verdict=0').split('=')[1]);
  if (!args[0]) { console.error('usage: share-card.mjs <run dir | run.json> [out.png] [--verdict=N]'); process.exit(1); }
  const r = await shareCard(path.resolve(args[0]), path.resolve(args[1] || 'share-card.png'), { verdict: n });
  console.log(`${r.out}  ${r.verdict.verdict} ${r.verdict.id}`);
}

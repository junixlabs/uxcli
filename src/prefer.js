// Blind pairwise preference on disk: .uxcli/preferences/<study>/study.json, img/<hash>.png (the
// pictures, renamed so a name says nothing of its group), judgments/<judge>.json (one per person).
// `prefer make` builds a study from two folders of pictures paired by file name; `prefer serve` is the
// page a judge answers on, one pair at a time, sides and order by their own seed; `prefer tally` counts.
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http'; import crypto from 'node:crypto';
import { parseStudy, parseJudgment, blindOrder, tally, CHOICES } from './core/model/prefer.js';
import { UXCLI } from './adapters/store/runs.js';

const readJson = f => JSON.parse(fs.readFileSync(f, 'utf8'));
export const studyDir = (root, name) => path.join(root, UXCLI, 'preferences', name);
const PICS = /\.(png|jpe?g|webp)$/i;
const judgeFile = (root, name, judge) => path.join(studyDir(root, name), 'judgments', `${judge.replace(/[^a-z0-9._-]+/gi, '-')}.json`);

export function makeStudy(root, name, { a, b, question = 'Which of these two would you rather use for this, and why?', groups } = {}) {
  const dir = studyDir(root, name);
  if (fs.existsSync(path.join(dir, 'study.json'))) return { problems: [`${path.relative(root, dir)}/study.json exists; a study is not rewritten once judged — name a new one`] };
  if (![a, b].every(d => d && fs.existsSync(d) && fs.statSync(d).isDirectory())) return { problems: ['--a=<folder> and --b=<folder>: two folders of pictures, the same screen under the same file name in each'] };
  const both = fs.readdirSync(a).filter(f => PICS.test(f) && fs.existsSync(path.join(b, f))).sort();
  if (!both.length) return { problems: ['no file name is in both folders; a pair is the same screen under the same name'] };
  fs.mkdirSync(path.join(dir, 'img'), { recursive: true });
  const put = f => { const buf = fs.readFileSync(f); const n = `img/${crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16)}${path.extname(f).toLowerCase()}`; fs.writeFileSync(path.join(dir, n), buf); return n; };
  const doc = { schema_version: 1, name, question, groups: groups || { A: path.relative(root, a) || a, B: path.relative(root, b) || b }, pairs: both.map(f => ({ id: f.replace(PICS, ''), A: put(path.join(a, f)), B: put(path.join(b, f)) })) };
  const r = parseStudy(doc); if (!r.value) return { problems: r.problems };
  fs.writeFileSync(path.join(dir, 'study.json'), JSON.stringify(doc, null, 1) + '\n');
  return { dir, study: doc };
}

export function readStudy(root, name) {
  const f = path.join(studyDir(root, name), 'study.json');
  if (!fs.existsSync(f)) return { problems: [`no study ${name} — uxcli prefer make ${name} --a=<folder> --b=<folder>`] };
  const r = parseStudy(readJson(f)); return r.value ? { study: r.value } : { problems: r.problems };
}

export function judgments(root, study) {
  const d = path.join(studyDir(root, study.name), 'judgments');
  return fs.existsSync(d) ? fs.readdirSync(d).filter(f => f.endsWith('.json')).sort().map(f => { const file = path.join(d, f); try { return { file, ...parseJudgment(readJson(file), study) }; } catch (e) { return { file, value: null, problems: [`not JSON: ${e.message}`] }; } }) : [];
}

// One answer, recorded for the judge the page was opened for. The side each group sat on comes from
// the judge's seed on the server, never from the page, so the page holds nothing that names a group.
export function answer(root, study, judge, { id, choice, why }) {
  const at = blindOrder(study, judge).find(p => p.id === id);
  if (!at) return { ok: false, problems: [`no pair ${id}`] };
  if (!CHOICES.includes(choice)) return { ok: false, problems: ['choice: left, right or same'] };
  if (typeof why !== 'string' || !why.trim()) return { ok: false, problems: ['why: what made the difference'] };
  const f = judgeFile(root, study.name, judge);
  const doc = fs.existsSync(f) ? readJson(f) : { study: study.name, by: { type: 'person', ref: judge }, at: new Date().toISOString(), answers: {} };
  doc.answers[id] = { choice, leftIs: at.leftIs, why: why.trim() };
  const r = parseJudgment(doc, study); if (!r.value) return { ok: false, problems: r.problems };
  fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(doc, null, 1) + '\n');
  return { ok: true, answered: Object.keys(doc.answers).length, of: study.pairs.length };
}

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function judgePage(study, judge, done = {}) {
  const order = blindOrder(study, judge).map(p => ({ id: p.id, left: p.left, right: p.right, done: !!done[p.id] }));
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pairwise preference</title>
<style>
:root{--bg:#f6f7f9;--fg:#1d2330;--dim:#5f6774;--line:#d5d9e0;--card:#fff;--accent:#2457c5}
@media (prefers-color-scheme:dark){:root{--bg:#14171c;--fg:#e8ebf0;--dim:#a3abb8;--line:#2e343e;--card:#1c2027;--accent:#8fb0ff}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,sans-serif;padding:16px}
h1{font-size:18px;margin:0 0 4px}p{margin:0 0 12px;color:var(--dim)}.q{color:var(--fg);font-weight:600}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0}.pair figure{margin:0;background:var(--card);border:1px solid var(--line);border-radius:8px;padding:8px;text-align:center}
.pair img{max-width:100%;max-height:70vh;object-fit:contain}figcaption{color:var(--dim);font-size:13px}
.row{display:flex;gap:8px;flex-wrap:wrap;align-items:flex-start}button{font:inherit;padding:8px 14px;border-radius:6px;border:1px solid var(--line);background:var(--card);color:var(--fg);cursor:pointer}
button[aria-pressed=true]{border-color:var(--accent);outline:2px solid var(--accent)}button:focus-visible,textarea:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
textarea{width:100%;min-height:64px;font:inherit;padding:8px;border-radius:6px;border:1px solid var(--line);background:var(--card);color:var(--fg)}
#status{color:var(--dim)}@media (max-width:640px){.pair{grid-template-columns:1fr}}
</style></head><body>
<h1>Pairwise preference · ${esc(study.name)}</h1>
<p>Judge: ${esc(judge)}. Two pictures of the same screen. Nothing says where either came from.</p>
<p class="q">${esc(study.question)}</p>
<p id="status" role="status" aria-live="polite"></p>
<div class="pair"><figure><img id="l" alt="left"><figcaption>Left</figcaption></figure><figure><img id="r" alt="right"><figcaption>Right</figcaption></figure></div>
<div class="row" role="group" aria-label="Your choice"><button data-c="left" aria-pressed="false">Left</button><button data-c="right" aria-pressed="false">Right</button><button data-c="same" aria-pressed="false">Cannot tell</button></div>
<label for="why"><p>Why — what made the difference</p></label><textarea id="why"></textarea>
<div class="row" style="margin-top:8px"><button id="save">Save and next</button></div>
<script>
const order=${JSON.stringify(order)};let i=order.findIndex(p=>!p.done);let choice=null;
const st=document.getElementById('status');
function show(){if(i<0||i>=order.length){document.querySelector('.pair').hidden=true;st.textContent='All '+order.length+' pairs answered. Thank you.';return;}
const p=order[i];document.getElementById('l').src=p.left;document.getElementById('r').src=p.right;choice=null;document.getElementById('why').value='';
document.querySelectorAll('[data-c]').forEach(b=>b.setAttribute('aria-pressed','false'));st.textContent='Pair '+(i+1)+' of '+order.length;}
document.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{choice=b.dataset.c;document.querySelectorAll('[data-c]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
document.getElementById('save').onclick=async()=>{const why=document.getElementById('why').value;if(!choice||!why.trim()){st.textContent='Choose one and say why.';return;}
const r=await fetch('api/answer',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:order[i].id,choice,why})});const j=await r.json();
if(!j.ok){st.textContent=j.problems.join('; ');return;}order[i].done=true;i=order.findIndex(p=>!p.done);show();};
show();
</script></body></html>`;
}

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
export async function serveStudy(root, name, { judge, port = 4318, host = '127.0.0.1' } = {}) {
  const s = readStudy(root, name); if (!s.study) return s;
  if (!judge || !judge.trim()) return { problems: ['--judge=<name>: the person answering; one page per judge'] };
  const study = s.study; const dir = studyDir(root, name);
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (req.method === 'GET' && url.pathname === '/') {
      const f = judgeFile(root, name, judge); const done = fs.existsSync(f) ? readJson(f).answers || {} : {};
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); return res.end(judgePage(study, judge, done));
    }
    if (req.method === 'POST' && url.pathname === '/api/answer') {
      let body = ''; for await (const c of req) { body += c; if (body.length > 20000) break; }
      let r; try { r = answer(root, study, judge, JSON.parse(body)); } catch (e) { r = { ok: false, problems: [e.message] }; }
      res.writeHead(r.ok ? 200 : 400, { 'content-type': 'application/json' }); return res.end(JSON.stringify(r));
    }
    const m = /^\/(img\/[0-9a-f]+\.(png|jpe?g|webp))$/.exec(url.pathname);
    if (req.method === 'GET' && m && fs.existsSync(path.join(dir, m[1]))) { res.writeHead(200, { 'content-type': MIME[path.extname(m[1])], 'cache-control': 'no-store' }); return fs.createReadStream(path.join(dir, m[1])).pipe(res); }
    res.writeHead(404); res.end('not found');
  });
  await new Promise((ok, no) => { server.once('error', no); server.listen(port, host, ok); });
  return { study, server, url: `http://${host}:${server.address().port}/` };
}

export function tallyCard(t, js) {
  const pct = (x, n) => n ? `${Math.round(100 * x / n)}%` : '—';
  const L = [`uxcli prefer tally · ${t.study}`, '', `  question  ${t.question}`, `  A  ${t.groups.A}`, `  B  ${t.groups.B}`, '',
    `  ${t.judges.length} judge${t.judges.length === 1 ? '' : 's'} · ${t.answered} answers · A preferred ${t.A} (${pct(t.A, t.A + t.B)}) · B preferred ${t.B} (${pct(t.B, t.A + t.B)}) · cannot tell ${t.same}`,
    `  sign test, ties aside: p = ${t.p.toFixed(3)}${t.A + t.B < 6 ? ' — too few answers for any split to mean much' : t.p < 0.05 ? ` — ${t.A > t.B ? 'A' : 'B'} preferred more often than chance would give` : ' — not distinguishable from chance'}`, ''];
  for (const r of t.pairs) L.push(`  ${r.id.padEnd(28)} A ${r.A} · B ${r.B} · same ${r.same}`);
  for (const j of js.filter(j => !j.value)) L.push(`  REFUSED ${j.file}: ${j.problems.join('; ')}`);
  L.push('', '  A preference is the judges\' eye on these pictures, not a verdict on the interface; their reasons are in --json.');
  return L.join('\n');
}

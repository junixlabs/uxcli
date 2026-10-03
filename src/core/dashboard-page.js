// The dashboard's pages, in the look the owner picked on 2026-10-03 ("control room": dark, numbers
// first, status as blocks of colour). One shell — the folder switcher and four views — and a page per
// view: the coverage matrix (picked as the opening view the same day), the runs, the design, the
// understanding. Pure: the data is gathered by src/dashboard.js; `link(view, query)` and `asset(path)`
// say where a view and a picture live, so the same page serves a written folder and a served one.
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const VIEWS = [
  { id: 'overview', label: 'Overview', what: 'every screen against every kind of evidence' },
  { id: 'runs', label: 'Runs', what: 'each walk and page run, its steps and what they measured' },
  { id: 'design', label: 'Design', what: 'each screen\'s drawings, the pick and the reviews' },
  { id: 'understanding', label: 'Understanding', what: 'who the product is for, what is known, what is not' },
];

const CSS = `:root{color-scheme:dark;--bg:#0e1116;--panel:#151a21;--raise:#1f2733;--line:#262d38;--line2:#3a4352;--ink:#e6e9ef;--soft:#c4cad6;--dim:#98a2b3;--accent:#7ee2b8;--ok:#7ee2b8;--ok-bg:#12372a;--fail:#ffb3ad;--fail-bg:#4a1717;--find:#ffd27a;--find-bg:#3f3110;--open:#a9c1ff;--open-bg:#1d2a4d;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
*{box-sizing:border-box}body{margin:0;font:13px/1.45 -apple-system,"Segoe UI",Helvetica,Arial,sans-serif;color:var(--ink);background:var(--bg)}
a{color:var(--open)}:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.app{display:grid;grid-template-columns:224px minmax(0,1fr);min-height:100vh;background:linear-gradient(to right,var(--panel) 224px,var(--bg) 224px)}
.side{background:var(--panel);border-right:1px solid var(--line);padding:14px 10px;position:sticky;top:0;height:100vh;overflow:auto}
.logo{font:700 14px var(--mono);color:var(--accent);padding:4px 8px 14px}
.fl{display:block;font-size:11px;color:var(--dim);padding:0 8px 6px}.fl select,.add input{display:block;width:100%;margin-top:4px;font:inherit;padding:6px 8px;border:1px solid var(--line2);border-radius:6px;background:var(--bg);color:var(--ink)}
.add{padding:0 8px 14px}.add button{margin-top:6px}
nav a{display:flex;justify-content:space-between;gap:8px;padding:7px 8px;border-radius:6px;color:var(--soft);text-decoration:none}nav a span{font:11px var(--mono);color:var(--dim)}nav a[aria-current=page]{background:var(--raise);color:#fff;box-shadow:inset 2px 0 0 var(--accent)}
main{padding:20px 24px;min-width:0}.eyebrow{font:11px var(--mono);color:var(--dim);text-transform:uppercase;letter-spacing:.04em}h1{font-size:19px;margin:2px 0 4px}h2{font-size:15px;margin:22px 0 10px}.lede{margin:0;color:var(--dim);max-width:780px}
button,.btn{font:600 13px inherit;font-family:inherit;border-radius:6px;padding:6px 12px;border:1px solid var(--line2);background:var(--panel);color:var(--ink);text-decoration:none;cursor:pointer}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin:16px 0}.stat{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 14px}.sv{font:700 24px var(--mono)}.sk{color:var(--dim);font-size:12px}
.tbl{background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:auto}table{border-collapse:collapse;width:100%}
th,td{text-align:left;vertical-align:top;padding:7px 10px;border-top:1px solid var(--line)}thead th{border-top:0;font:11px var(--mono);color:var(--dim);text-transform:uppercase;white-space:nowrap}tbody th{font-weight:400;white-space:nowrap}.sub{color:var(--dim)}
.c{display:inline-block;min-width:48px;font:600 12px var(--mono);border-radius:4px;padding:2px 6px;text-align:center;white-space:nowrap}
.c.ok,.c.pass{background:var(--ok-bg);color:var(--ok)}.c.fail{background:var(--fail-bg);color:var(--fail)}.c.finding{background:var(--find-bg);color:var(--find)}.c.open,.c.blocked{background:var(--open-bg);color:var(--open)}.c.gap{border:1px dashed var(--line2);color:var(--dim)}.c.na{color:var(--dim)}
.why{display:block;color:var(--dim);font-size:12px;margin-top:3px;max-width:280px;white-space:normal}
.legend{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 0;font-size:12px;color:var(--dim);align-items:center}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}.card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 14px}
.card h3{font-size:14px;margin:0 0 6px}.card ul{margin:6px 0 0;padding-left:18px}.card li{margin:2px 0}
.shots{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}.shot{margin:0;width:180px}.shot a{display:block;border-radius:6px}.shot img{display:block;width:100%;border:1px solid var(--line2);border-radius:6px;background:#fff}.shot figcaption{font-size:12px;color:var(--dim);margin-top:4px}
.none{overflow-wrap:anywhere;display:grid;place-items:center;width:180px;height:110px;border:1px dashed var(--line2);border-radius:6px;color:var(--dim);font-size:12px;text-align:center;padding:8px}
.notice{background:var(--find-bg);color:var(--find);border-radius:8px;padding:8px 12px;margin-bottom:12px}
@media (max-width:760px){.app{grid-template-columns:1fr;background:var(--bg)}.side{position:static;height:auto}main{padding:16px}}`;

const chip = (state, text) => `<span class="c ${esc(state)}">${esc(text)}</span>`;
const when = s => s ? esc(String(s).slice(0, 16).replace('T', ' ')) : '—';

function overview({ data, link }) {
  const m = data.matrix; const t = m.totals;
  const waiting = m.rows.filter(r => Object.values(r.cells).some(c => c.state === 'open')).length;
  return `<div class="eyebrow">overview · ${esc(m.folder)}</div><h1>${esc(m.project?.name || m.folder)} · coverage</h1>
<p class="lede">Each row a screen the journeys pass through; each column a kind of evidence uxcli keeps. A dashed cell is a gap, never a pass; point at it for the command that fills it.</p>
<div class="stats"><div class="stat"><div class="sv">${t.gaps}</div><div class="sk">empty cells</div></div><div class="stat"><div class="sv">${t.fails}</div><div class="sk">failing screens</div></div><div class="stat"><div class="sv">${waiting + t.proposals}</div><div class="sk">waiting on a person · ${t.proposals} proposals</div></div><div class="stat"><div class="sv">${t.commitments.active}</div><div class="sk">commitments active${t.commitments.retiring ? ` · ${t.commitments.retiring} retiring` : ''}</div></div><div class="stat"><div class="sv">${t.unknowns}</div><div class="sk">unknowns · <a href="${link('understanding')}">understanding</a></div></div></div>
<div class="tbl" data-uxcli="matrix"><table><caption class="sub" style="text-align:left;padding:10px 10px 0">${m.rows.length} screens · ${m.columns.length} kinds of evidence</caption><thead><tr><th scope="col">journey · screen</th>${m.columns.map(c => `<th scope="col" title="${esc(c.means)}">${esc(c.label)}</th>`).join('')}</tr></thead>
<tbody>${m.rows.map((r, i) => `<tr><th scope="row">${i === 0 || m.rows[i - 1].journey !== r.journey ? `<b>${esc(r.journey)}</b><br>` : ''}<span class="sub">${esc(r.state)}</span></th>${m.columns.map(c => { const x = r.cells[c.id]; return x.state === 'gap' ? `<td${x.fill ? ` title="${esc(x.fill)}"` : ''}>${chip('gap', '—')}</td>` : `<td>${chip(x.state, x.text)}${x.fill && x.state !== 'ok' ? `<span class="why">${esc(x.fill)}</span>` : ''}</td>`; }).join('')}</tr>`).join('') || `<tr><td colspan="${m.columns.length + 1}">No journey yet: write one under .uxcli/journeys/ — uxcli init says how.</td></tr>`}</tbody></table></div>
<div class="legend">${chip('ok', 'held')} done ${chip('open', 'waiting')} on a person ${chip('finding', 'finding')} reported ${chip('fail', 'fail')} measured ${chip('gap', '—')} gap ${chip('na', '—')} nothing to measure</div>
${t.versions.length ? `<h2>Versions</h2><div class="grid">${t.versions.map(v => `<div class="card"><h3>${esc(v.journey)}</h3>${esc(v.names.join(' → '))}${v.delta != null ? ` · <span style="font-family:var(--mono)">${v.delta > 0 ? '+' : ''}${v.delta} s</span> estimate` : ''}</div>`).join('')}</div>` : ''}`;
}

function runs({ data, link, asset, run }) {
  const pick = run && data.runs.find(r => r.id === run);
  if (pick) return `<div class="eyebrow"><a href="${link('runs')}">runs</a> · ${esc(pick.id)}</div><h1>${esc(pick.target)} ${chip(pick.worst, pick.worst)}</h1>
<p class="lede">${pick.kind === 'journey' ? 'A walk of the journey' : 'A page run'} · ${when(pick.when)}${pick.viewport ? ` · ${esc(pick.viewport)}` : ''}${pick.environment ? ` · ${esc(pick.environment)}` : ''} · exit ${esc(pick.exit)}${pick.klm != null ? ` · about ${pick.klm} s for a practised user` : ''}${pick.blocked ? ` · blocked: ${esc(pick.blocked)}` : ''}</p>
${pick.verdicts.length ? `<h2>What it measured</h2><div class="tbl"><table><thead><tr><th>verdict</th><th>commitment</th><th>step</th><th>what</th></tr></thead><tbody>${pick.verdicts.map(v => `<tr><td>${chip(v.value, v.value)}</td><td>${esc(v.commitment || '—')}</td><td>${esc(v.step || '—')}</td><td>${esc(v.what)}</td></tr>`).join('')}</tbody></table></div>` : ''}
${pick.probes.length ? `<h2>Probes</h2><div class="tbl"><table><thead><tr><th>probe</th><th>verdict</th><th>why</th></tr></thead><tbody>${pick.probes.map(p => `<tr><td style="font-family:var(--mono)">${esc(p.probe)}</td><td>${chip(p.verdict, p.verdict)}</td><td>${esc(p.why)}</td></tr>`).join('')}</tbody></table></div>` : ''}
${pick.steps.length ? `<h2>Steps</h2><div class="grid" style="grid-template-columns:1fr">${pick.steps.map(s => `<div class="card"><h3>${esc(s.workflow ? s.workflow + ' / ' : '')}${esc(s.id)} · ${esc(s.action)}</h3><span class="sub">reaches ${esc(s.state || '—')} · ${s.held === true ? chip('ok', 'held') : s.held === false ? chip('fail', 'not held') : chip('na', 'not measured')}${s.klm != null ? ` · ${s.klm} s` : ''}</span>
${s.findings.length ? `<ul>${s.findings.map(f => `<li>${chip('finding', 'finding')} ${esc(f)}</li>`).join('')}</ul>` : ''}
<div class="shots">${[['before', s.before], ['after', s.after]].map(([k, p]) => p ? `<figure class="shot"><a href="${asset(p)}"><img src="${asset(p)}" alt="${esc(s.id)} ${k} the action"></a><figcaption>${k}</figcaption></figure>` : `<div class="none">no ${k} picture kept<br>(pruned, or the run was copied without artifacts/)</div>`).join('')}</div></div>`).join('')}</div>` : ''}`;
  return `<div class="eyebrow">runs · ${esc(data.matrix.folder)}</div><h1>Runs</h1><p class="lede">Every packet under .uxcli/runs/, newest first. A run is what Chrome measured once; open one for its steps and pictures.</p>
<div class="tbl" style="margin-top:16px"><table><thead><tr><th>when</th><th>target</th><th>kind</th><th>viewport</th><th>result</th><th>exit</th><th>estimate</th></tr></thead><tbody>${data.runs.map(r => `<tr><td style="font-family:var(--mono)"><a href="${link('runs', `run=${encodeURIComponent(r.id)}`)}">${when(r.when)}</a></td><td>${esc(r.target)}</td><td class="sub">${r.kind}</td><td class="sub">${esc(r.viewport || '—')}</td><td>${chip(r.worst, r.worst)}</td><td style="font-family:var(--mono)">${esc(r.exit)}</td><td style="font-family:var(--mono)">${r.klm != null ? r.klm + ' s' : '—'}</td></tr>`).join('') || '<tr><td colspan="7">No run yet: uxcli run &lt;url&gt; or uxcli run .uxcli/journeys/&lt;id&gt;.json</td></tr>'}</tbody></table></div>`;
}

function design({ data, asset }) {
  return `<div class="eyebrow">design · ${esc(data.matrix.folder)}</div><h1>Design</h1><p class="lede">Each screen the journeys name: the drawings, what each does differently, the reviews against a lens, and the pick. Picks and redraws are made in the studio (uxcli studio --serve), not here.</p>
${data.design.map(s => `<div class="card" style="margin-top:12px"><h3>${esc(s.state)} ${s.pick ? chip('ok', `picked ${s.pick}`) : s.revise ? chip('open', 'redraw asked') : s.variants.length ? chip('open', 'waiting for a pick') : chip('gap', 'not drawn')}</h3>
${s.question ? `<p class="sub" style="margin:0">${esc(s.question)}</p>` : ''}${s.revise ? `<p class="sub">redraw asked: ${esc(s.revise)}</p>` : ''}${s.pickedBy ? `<p class="sub" style="margin:4px 0 0">picked by ${esc(s.pickedBy)}</p>` : ''}
<div class="shots">${s.variants.map(v => `<figure class="shot">${v.shot ? `<a href="${asset(v.shot)}"><img src="${asset(v.shot)}" alt="${esc(s.state)} variant ${esc(v.name)}"></a>` : '<div class="none">not photographed yet<br>uxcli mockups</div>'}<figcaption><b>${esc(v.name)}</b>${v.name === s.pick ? ' · picked' : ''}${v.about ? `<br>${esc(v.about)}` : ''}${v.reviews.map(r => `<br>${esc(r.lens)}: ${esc(r.line)}`).join('')}${v.reviews.length ? '' : '<br>no lens review'}</figcaption></figure>`).join('') || `<div class="none">no drawing: .uxcli/mockups/${esc(s.state)}/&lt;variant&gt;.html</div>`}</div></div>`).join('') || '<p>No screen named by a journey yet.</p>'}`;
}

function understanding({ data }) {
  const u = data.understanding;
  return `<div class="eyebrow">understanding · ${esc(data.matrix.folder)}</div><h1>Understanding</h1><p class="lede">Who the product is for and what is known about them, as .uxcli/understanding/ says. An unknown stays a question until a source answers it; an insight is only as confident as its evidence and its last check.${u.template ? ` Started from the ${esc(u.template)} template.` : ''}</p>
<h2>Actors</h2><div class="grid">${u.actors.map(a => `<div class="card"><h3>${esc(a.actor)}</h3>${(a.roles || []).length ? `<p class="sub" style="margin:0">${esc(a.roles.join(' · '))}</p>` : ''}
${[['jobs', a.jobs], ['pains', a.pains], ['expectations', a.expectations]].filter(([, xs]) => (xs || []).length).map(([k, xs]) => `<p class="sub" style="margin:8px 0 0">${k}</p><ul>${xs.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`).join('')}
<p class="sub" style="margin:8px 0 0">unknowns · ${(a.unknowns || []).length}</p><ul>${(a.unknowns || []).map(x => `<li>${chip('open', '?')} ${esc(x)}</li>`).join('')}</ul></div>`).join('') || '<p>No actor yet: uxcli template apply &lt;kind&gt; writes the questions to start from.</p>'}</div>
<h2>Insights</h2><div class="tbl"><table><thead><tr><th>id</th><th>claim</th><th>confidence</th><th>source</th><th>would change if</th><th>last check</th></tr></thead><tbody>${u.insights.map(i => `<tr><td style="font-family:var(--mono)">${esc(i.id)}</td><td>${esc(i.claim)}<span class="why">${esc((i.evidence || []).join(' · '))}</span></td><td>${chip(i.confidence === 'high' ? 'ok' : i.confidence === 'hypothesis' ? 'gap' : 'finding', i.confidence)}</td><td class="sub">${esc(i.source ? `${i.source.type} ${i.source.ref}` : '—')}</td><td class="sub">${esc(i.wouldChangeIf?.text || '—')}</td><td class="sub">${i.lastCheck ? `${when(i.lastCheck.at)}${i.lastCheck.fired ? ' · fired' : ' · held'}` : 'never'}</td></tr>`).join('') || '<tr><td colspan="6">No insight yet.</td></tr>'}</tbody></table></div>`;
}

export function dashboardPage({ data, folders, current = 0, view = 'overview', run = null, serve = false, link, asset, notice = null }) {
  const ok = data && data.matrix;
  const counts = ok ? { overview: `${data.matrix.totals.gaps} gaps`, runs: String(data.runs.length), design: `${data.design.length} screens`, understanding: `${data.understanding.actors.reduce((n, a) => n + (a.unknowns || []).length, 0)} unknowns` } : {};
  const side = `<aside class="side"><div class="logo">uxcli</div>
${serve ? `<label class="fl">Folder<select data-uxcli="folder-switch" onchange="location.search='?p='+this.value+'&v=${esc(view)}'">${folders.map((f, i) => `<option value="${i}"${i === current ? ' selected' : ''}>${esc(f)}</option>`).join('')}</select></label>
<form class="add" method="post" action="/api/folders" data-uxcli="folder-add"><label class="fl" style="padding:0">Add a folder<input name="path" placeholder="/path/to/project" aria-describedby="addhint"></label><span id="addhint" class="sub" style="font-size:11px">a folder holding .uxcli/</span><br><button type="submit">Add</button></form>` : `<div class="fl">Folder<br><b style="color:var(--ink)">${esc(folders[0])}</b></div>`}
<nav aria-label="Views">${VIEWS.map(v => `<a href="${link(v.id)}" title="${esc(v.what)}"${v.id === view ? ' aria-current="page"' : ''}>${v.label}<span>${esc(counts[v.id] || '')}</span></a>`).join('')}</nav></aside>`;
  const body = !ok ? `<h1>Nothing to show</h1>${(data?.problems || []).map(p => `<p>${esc(p)}</p>`).join('')}`
    : view === 'runs' ? runs({ data, link, asset, run }) : view === 'design' ? design({ data, asset }) : view === 'understanding' ? understanding({ data }) : overview({ data, link });
  const probs = ok && data.problems?.length ? `<h2>Declarations with problems</h2><div class="card">${data.problems.map(p => `<p style="margin:4px 0">${esc(p)}</p>`).join('')}</div>` : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>uxcli · ${esc(VIEWS.find(v => v.id === view)?.label || '')} · ${esc(folders[current] || '')}</title><style>${CSS}</style></head><body><div class="app">${side}<main>${notice ? `<p class="notice" role="status">${esc(notice)}</p>` : ''}${body}${probs}</main></div></body></html>`;
}

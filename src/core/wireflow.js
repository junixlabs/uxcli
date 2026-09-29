// A wireflow, as HTML: frames that are pictures of screens, a connection leaving the element that was
// acted on and landing on the frame that resulted, a badge on the frame a verdict cites. The Verdict
// Lab draws a run's screenshots with it and `uxcli mockups` draws the picked mockups with it; the
// model is the same because the question is the same — which screen, which element, which next.
//
// row:   { id, kind, vw, vh, frames: [frame], links: [link] }   links[k] joins frame k to frame k+1
// frame: { shot, alt, start?, badges?: [text], loud?, hot?, title, pill?: {text, tone}, extra?, note? }
// hot:   { x, y, w, h } in CSS px of the vw×vh viewport the shot shows · { off: true, target, scrolls }
//        when the element sat below the fold · { edge: true } when nothing is known · null for the last frame
// link:  { label, sub? }

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Frames are sized by CSS (--fw), not by the renderer: hotspots and connections are expressed as
// fractions of the screen, so the same page fills a 1440 monitor and a 400 phone.
// What a person reads, from what a file is called: `reader.projects_empty` is "Projects empty",
// `a-blank` is "Blank", `add-a-source` is "Add a source". The id stays in the title attribute and in
// the pick bar, where a person needs the exact file name; everywhere else the page speaks words.
export const human = id => { const s = String(id ?? '').replace(/^.*\./, '').replace(/^[a-z]-(?=[a-z])/, '').replace(/[_-]+/g, ' ').trim(); return s ? s[0].toUpperCase() + s.slice(1) : ''; };
export const sentence = s => { s = String(s ?? ''); return s ? s[0].toUpperCase() + s.slice(1) : s; };
export const KIND = { happy: 'Happy path', recovery: 'Recovery', edge: 'Edge case' };

export const pct = (n, of) => `${(100 * n / of).toFixed(2)}%`;

export function frameHtml(f, { vw, vh, hotspot = '', extraClass = '' }) {
  const badges = (f.badges || []).map(b => `<span class="badge">${esc(b)}</span>`).join('');
  const pill = f.pill ? `<span class="pill ${f.pill.tone || ''}">${esc(f.pill.text)}</span>` : '';
  const cands = (f.candidates || []).filter(c => c.shot);
  const pic = f.shot ? `<a href="${esc(f.shot)}"${f.view ? ` data-view="${esc(f.view)}"` : ''}><img src="${esc(f.shot)}" alt="${esc(f.alt || f.title)}" loading="lazy" width="${vw}" height="${vh}"></a>`
    : cands.length ? `<div class="cands n${Math.min(cands.length, 4)}">${cands.map(c => `<a href="${esc(c.shot)}"${c.view ? ` data-view="${esc(c.view)}"` : ''}><img src="${esc(c.shot)}" alt="${esc(c.name)}" loading="lazy"><b>${esc(human(c.name))}</b></a>`).join('')}<span class="cands-h">${cands.length} variants, not picked</span></div>`
    : `<div class="noshot">${esc(f.missing || 'No picture')}</div>`;
  return `<div class="frame ${f.loud ? 'loud' : ''} ${extraClass}">
    ${badges}
    <div class="screen" style="aspect-ratio:${vw}/${vh}">${pic}${hotspot}</div>
    ${f.hot?.off ? `<div class="offhot"><span class="hot off"></span>${esc(f.hot.target)} · ${f.hot.scrolls} scroll${f.hot.scrolls > 1 ? 's' : ''} below the fold</div>` : ''}
    <div class="cap"><span class="state"${f.id ? ` title="${esc(f.id)}"` : ''}>${esc(f.title)}</span>${pill}${f.extra ? `<span class="ms">${esc(f.extra)}</span>` : ''}</div>
    ${f.note ? `<p class="fnote">${esc(f.note)}</p>` : ''}
  </div>`;
}

export function flowRow(row) {
  const { vw, vh } = row; const cells = [];
  row.frames.forEach((f, k) => {
    let hotspot = ''; let y0 = 500; // per-mille of the screen's height
    const h = f.hot;
    if (h && !h.off && !h.edge) { y0 = Math.round(1000 * (h.y + h.h / 2) / vh); hotspot = `<div class="hot" style="left:${pct(h.x, vw)};top:${pct(h.y, vh)};width:${pct(h.w, vw)};height:${pct(h.h, vh)}"></div>`; }
    else if (h && h.off) y0 = 1040;
    else if (h && h.edge) hotspot = `<div class="hot edge"></div>`;
    cells.push(frameHtml(f, { vw, vh, hotspot }));
    const link = row.links?.[k];
    if (link && row.frames[k + 1]) {
      cells.push(`<div class="conn"><svg viewBox="0 0 120 1000" preserveAspectRatio="none" aria-hidden="true"><path vector-effect="non-scaling-stroke" d="M0 ${y0} C 60 ${y0}, 60 500, 112 500" fill="none"/></svg><span class="head" style="top:50%"></span><div class="label"><b>${esc(link.label)}</b>${link.text ? esc(sentence(link.text)) : ''}${link.sub ? `<span>${esc(link.sub)}</span>` : ''}</div></div>`);
    }
  });
  const play = row.play ? `<button class="play" type="button" data-play="${esc(row.play)}">▶ Play</button>` : '';
  const head = row.id ? `<div class="lane-h"><span class="lane-id" title="${esc(row.id)}">${esc(human(row.id))}</span>${row.kind ? `<span class="lane-kind ${esc(row.kind)}">${esc(KIND[row.kind] || human(row.kind))}</span>` : ''}<span class="lane-n">${row.frames.length} screens</span>${play}</div>` : '';
  return `<section class="lane${vw > vh ? ' wide' : ''}" style="--vw:${vw};--vh:${vh}">${head}<div class="row"><div class="cells">${cells.join('')}</div></div></section>`;
}

// The first sentence of a reviewer's note: what a person reads before opening the rest.
export const firstSentence = t => { t = String(t ?? '').trim(); const m = t.match(/^.*?[.!?](?=\s|$)/); return m ? m[0] : t; };

// A hook the journey names, outlined where the browser found it in the drawing; shown when the
// page's hooks toggle is on. Nothing is drawn for a hook the browser did not find.
export const hooksHtml = (hooks = [], { vw, vh }) => hooks.filter(h => h.w > 0).map(h =>
  `<i class="hk" style="left:${pct(h.x, vw)};top:${pct(h.y, vh)};width:${pct(h.w, vw)};height:${pct(h.h, vh)}"><b>${esc(h.sel)}</b></i>`).join('');

// A pinned note: an element in the drawing carrying data-uxcli-note. The pin sits at the element's
// centre in the frame; one below the fold sits on the frame's bottom edge, dashed, since the picture
// stops where the viewport did.
export const pinsHtml = (pins = [], { vw, vh }) => pins.map((n, i) => {
  const off = n.y >= vh; const cx = n.x + Math.min(12, n.w / 2), cy = off ? vh : Math.min(vh, n.y + Math.min(12, n.h / 2));
  return `<i class="pin${off ? ' off' : ''}" style="left:${pct(cx, vw)};top:${pct(cy, vh)}" title="${esc(n.text)}">${i + 1}</i>`;
}).join('');

export const WIREFLOW_CSS = `
[hidden]{display:none!important}
:root{--fw:300px;--gw:440px;--cw:150px;--r:10px}
@media (min-width:1700px){:root{--fw:340px;--gw:520px}}
.lane.wide{--fw:clamp(320px,24vw,460px);--cw:120px}
@media (max-width:760px){:root{--fw:220px;--gw:100%;--cw:110px}}
.flow{display:grid;gap:22px}
.lane{border:1px solid var(--line);border-radius:var(--r);background:var(--canvas);background-image:radial-gradient(var(--dot) 1px,transparent 1px);background-size:18px 18px;overflow:hidden}
.lane-h{display:flex;align-items:center;gap:10px;padding:10px 16px;background:var(--surface);border-bottom:1px solid var(--line)}
.lane-id{font:600 13px var(--sans);color:var(--ink)}
.lane-kind{font:600 11px/1 var(--sans);padding:4px 8px;border-radius:4px;background:var(--well);color:var(--dim)}
.lane-kind.happy{background:var(--accent-soft);color:var(--accent)}
.lane-kind.recovery{background:var(--finding-soft);color:var(--finding)}
.lane-n{margin-left:auto;font:12px var(--sans);color:var(--dim)}
.row{overflow-x:auto;padding:26px 22px 22px}
.cells{display:flex;align-items:flex-start;gap:0;width:max-content}
.frame{position:relative;display:grid;gap:8px;flex:none;width:var(--fw);min-width:0}
.screen{position:relative;width:100%;border-radius:8px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.08),0 8px 24px -12px rgba(0,0,0,.25);overflow:visible}
.screen a{display:block;height:100%}
.screen img{display:block;width:100%;height:100%;object-fit:cover;object-position:top;border-radius:8px}
.frame.loud .screen{outline:2px solid var(--fail);box-shadow:0 0 0 6px var(--fail-soft),0 8px 24px -12px rgba(0,0,0,.25)}
.cands{position:absolute;inset:0;display:grid;grid-template-columns:1fr 1fr;gap:3px;padding:3px;border-radius:8px;background:var(--well);overflow:hidden}
.cands.n1{grid-template-columns:1fr}.cands.n3 a:first-child{grid-column:1/3}
.cands a{position:relative;display:block;overflow:hidden;border-radius:5px;background:#fff;min-height:0}
.cands img{display:block;width:100%;height:100%;object-fit:cover;object-position:top}
.cands b{position:absolute;left:4px;bottom:4px;font:600 10px/1 var(--sans);padding:4px 6px;border-radius:4px;background:rgba(0,0,0,.7);color:#fff}
.cands-h{position:absolute;right:6px;top:6px;font:700 10px/1 var(--sans);padding:5px 8px;border-radius:999px;background:var(--accent);color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.35);pointer-events:none;white-space:nowrap}
.lane.wide .cands{grid-template-columns:1fr;grid-auto-rows:minmax(0,1fr)}.lane.wide .cands.n3 a:first-child{grid-column:auto}.lane.wide .cands.n4{grid-template-columns:1fr 1fr}
.noshot{display:grid;place-items:center;height:100%;padding:16px;text-align:center;color:var(--dim);font:13px/1.5 var(--mono);overflow-wrap:anywhere;white-space:pre-line;border-radius:8px;border:1.5px dashed var(--line);background:var(--surface)}
.hot{position:absolute;border:2px solid var(--accent);border-radius:4px;background:color-mix(in srgb,var(--accent) 10%,transparent);box-shadow:0 0 0 3px rgba(255,255,255,.7);pointer-events:none}
.hot::after{content:"";position:absolute;right:-6px;top:50%;width:8px;height:8px;margin-top:-4px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 2px #fff}
.hot.off{position:static;border-style:dashed;border-color:var(--fail);background:var(--fail-soft);box-shadow:none}
.frame.loud .hot{border-color:var(--fail);background:color-mix(in srgb,var(--fail) 10%,transparent)}.frame.loud .hot::after{background:var(--fail)}.hot.off::after{display:none}
.hot.edge{right:-7px;top:calc(50% - 7px);width:14px;height:14px;border-radius:50%;background:var(--accent);border:2px solid #fff}.hot.edge::after{display:none}
.offhot{display:flex;align-items:center;gap:8px;font:12px/1.3 var(--mono);color:var(--fail);min-height:24px}
.offhot .hot{flex:none;width:24px;height:12px}
.badge{position:absolute;top:-12px;right:10px;z-index:2;white-space:nowrap;font:700 11px/1 var(--sans);color:#fff;background:var(--fail);padding:6px 9px;border-radius:6px;box-shadow:0 2px 6px rgba(0,0,0,.2)}
.cap{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.cap .state{font:600 13px var(--sans);color:var(--ink);overflow-wrap:anywhere}
.pill{font:600 11px/1 var(--sans);padding:4px 8px;border-radius:999px;background:var(--well);color:var(--dim)}
.pill.ok{background:var(--pass-soft);color:var(--pass)}.pill.bad{background:var(--fail-soft);color:var(--fail)}
.ms{font:12px var(--sans);color:var(--dim)}
.fnote{margin:0;font:12px/1.4 var(--sans);color:var(--dim)}
.conn{position:relative;width:var(--cw);flex:none;height:calc(var(--fw) * var(--vh) / var(--vw))}
.conn svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.conn path{stroke:var(--accent);stroke-width:2.5;stroke-linecap:round}
.conn .head{position:absolute;right:6px;width:0;height:0;margin-top:-6px;border-left:11px solid var(--accent);border-top:6px solid transparent;border-bottom:6px solid transparent}
.conn .label{position:absolute;left:8px;right:8px;top:12px;font:12px/1.35 var(--sans);color:var(--ink);text-align:center;background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:6px 8px;box-shadow:0 1px 2px rgba(0,0,0,.06)}
.conn .label b{display:block;font:700 11px var(--sans);color:var(--accent);margin-bottom:2px}
.conn .label span{display:block;font:11px/1.35 var(--mono);color:var(--dim);margin-top:4px;padding-top:4px;border-top:1px dashed var(--line);overflow-wrap:anywhere}
.g-state{margin-left:auto;font:600 11px/1 var(--sans);padding:6px 10px;border-radius:999px;background:var(--well);color:var(--dim)}
.g-state.pick{background:var(--pass-soft);color:var(--pass)}
.p-stage{display:grid;place-items:center;min-height:0;gap:10px;grid-auto-rows:min-content;align-content:center}
.p-screen{position:relative;max-width:100%;max-height:calc(100vh - 140px);height:calc(100vh - 140px);background:#fff;border-radius:8px;box-shadow:0 20px 60px -20px rgba(0,0,0,.6);overflow:hidden}
.p-screen img{display:block;width:100%;height:100%;object-fit:contain}
.p-screen .noshot{position:absolute;inset:0}
.p-screen .hot{cursor:pointer;pointer-events:auto;animation:pulse 1.6s ease-in-out infinite}
@keyframes pulse{0%,100%{box-shadow:0 0 0 3px rgba(255,255,255,.7)}50%{box-shadow:0 0 0 8px color-mix(in srgb,var(--accent) 35%,transparent)}}
.p-off{cursor:pointer;font:12px/1.3 var(--sans);color:#fff;background:var(--fail);padding:8px 14px;border-radius:999px;border:2px dashed rgba(255,255,255,.6)}
.p-bar{display:flex;align-items:center;gap:16px;padding:14px 4px 0;color:#fff;font:13px var(--sans);min-width:0}.p-stage:not(.two) .p-screen{height:calc(100vh - 210px)}.p-under{max-width:1200px}.p-notes{font-size:13px!important}
.p-bar .p-n{font:600 12px var(--sans);opacity:.7}.p-bar .p-title{font:600 14px var(--sans)}.p-bar .p-link{opacity:.85;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.p-bar .p-keys{font:11px var(--sans);opacity:.6}
.hk{position:absolute;display:none;border:1.5px dashed var(--accent);border-radius:3px;pointer-events:none;font-style:normal}
.hk b{position:absolute;left:-1.5px;top:-16px;font:600 9px/1 var(--mono);padding:3px 5px;border-radius:3px;background:var(--accent);color:#fff;white-space:nowrap}
.p-stage.two{grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:18px;align-items:start;justify-items:center}
.p-stage.two .p-screen{max-width:100%;height:calc(100vh - 230px)}
.screens{position:relative}
.p-cell{display:grid;gap:8px;min-width:0;justify-items:center}.p-under{display:flex;gap:12px;align-items:start;justify-content:space-between;width:100%;color:#fff}.p-notes{margin:0;padding-left:18px;font:12px/1.45 var(--sans);opacity:.9;display:grid;gap:2px}.p-notes li::marker{font:700 11px var(--sans);color:var(--finding)}
.ref{margin:0;display:grid;gap:4px}
.ref a{display:block;border-radius:6px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.08),0 6px 16px -10px rgba(0,0,0,.3)}.ref img{display:block;width:100%;height:auto}
.ref figcaption{font:11px/1.3 var(--sans);color:var(--dim);overflow-wrap:anywhere}
.pin{position:absolute;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;background:var(--finding);color:#fff;font:700 11px/20px var(--mono);text-align:center;box-shadow:0 0 0 2px #fff,0 2px 6px rgba(0,0,0,.25);pointer-events:auto;font-style:normal}
.pin.off{border:2px dashed #fff;line-height:16px}

.refs{display:flex;flex-wrap:wrap;gap:12px;padding-top:8px}.ref{width:160px}
`;

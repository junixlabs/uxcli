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
export const pct = (n, of) => `${(100 * n / of).toFixed(2)}%`;

export function frameHtml(f, { vw, vh, hotspot = '', extraClass = '' }) {
  const badges = (f.badges || []).map(b => `<span class="badge">${esc(b)}</span>`).join('');
  const pill = f.pill ? `<span class="pill ${f.pill.tone || ''}">${esc(f.pill.text)}</span>` : '';
  const pic = f.shot ? `<a href="${esc(f.shot)}"><img src="${esc(f.shot)}" alt="${esc(f.alt || f.title)}" loading="lazy" width="${vw}" height="${vh}"></a>` : `<div class="noshot">${esc(f.missing || 'no picture')}</div>`;
  return `<div class="frame ${f.loud ? 'loud' : ''} ${extraClass}">
    ${f.start ? `<span class="start">▶ ${esc(f.start)}</span>` : ''}${badges}
    <div class="screen" style="aspect-ratio:${vw}/${vh}">${pic}${hotspot}</div>
    ${f.hot?.off ? `<div class="offhot"><span class="hot off"></span>${esc(f.hot.target)} · ${f.hot.scrolls} scroll${f.hot.scrolls > 1 ? 's' : ''} below the fold</div>` : ''}
    <div class="cap"><span class="state">${esc(f.title)}</span>${pill}${f.extra ? `<span class="ms">${esc(f.extra)}</span>` : ''}</div>
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
      cells.push(`<div class="conn"><svg viewBox="0 0 120 1000" preserveAspectRatio="none" aria-hidden="true"><path vector-effect="non-scaling-stroke" d="M0 ${y0} C 60 ${y0}, 60 500, 112 500" fill="none"/></svg><span class="head" style="top:50%"></span><div class="label"><b>${esc(link.label)}</b>${link.text ? esc(link.text) : ''}${link.sub ? `<span>${esc(link.sub)}</span>` : ''}</div></div>`);
    }
  });
  return `<div class="row" style="--vw:${vw};--vh:${vh}"><div class="cells">${cells.join('')}</div></div>`;
}

// A gallery: one screen, its variants side by side, each with the status the pick gives it.
// variant: { name, shot, status: 'pick' | 'part' | 'not-taken' | 'no-pick', note? }
export function galleryHtml(g) {
  const word = { pick: 'pick', part: 'part', 'not-taken': 'not taken', 'no-pick': 'no pick yet' };
  return `<section class="gallery" id="${esc(g.id)}">
    <h3>${esc(g.title)}${g.sub ? ` <span class="sub">${esc(g.sub)}</span>` : ''}</h3>
    ${g.note ? `<p class="why">${esc(g.note)}</p>` : ''}
    <div class="variants" style="--vw:${g.vw};--vh:${g.vh}">${g.variants.map(v => `<div class="variant ${v.status}">
      <div class="screen" style="aspect-ratio:${g.vw}/${g.vh}">${v.shot ? `<a href="${esc(v.shot)}"><img src="${esc(v.shot)}" alt="${esc(v.name)}" loading="lazy" width="${g.vw}" height="${g.vh}"></a>` : `<div class="noshot">${esc(v.missing || 'no picture')}</div>`}</div>
      <div class="cap"><span class="state">${esc(v.name)}</span><span class="status ${v.status}">${esc(word[v.status] || v.status)}</span></div>
      ${v.status === 'part' && v.note ? `<p class="fnote">taken: ${esc(v.note)}</p>` : ''}
    </div>`).join('')}</div>
  </section>`;
}

export const WIREFLOW_CSS = `
:root{--fw:300px;--gw:360px;--cw:150px}
@media (min-width:1700px){:root{--fw:340px;--gw:420px}}
@media (max-width:760px){:root{--fw:220px;--gw:100%;--cw:110px}}
.flow{display:grid;gap:26px}
.row{overflow-x:auto;padding:14px 2px 8px}
.cells{display:flex;align-items:flex-start;gap:0;width:max-content}
.frame{position:relative;display:grid;gap:6px;flex:none;width:var(--fw);min-width:0}
.screen{position:relative;width:100%;border:1px solid var(--line);border-radius:4px;background:#fff;overflow:visible}
.screen a{display:block;height:100%}
.screen img{display:block;width:100%;height:100%;object-fit:cover;object-position:top;border-radius:3px}
.frame.loud .screen{border-color:var(--fail);box-shadow:0 0 0 2px var(--fail)}
.noshot{display:grid;place-items:center;height:100%;padding:12px;text-align:center;color:var(--dim);font:13px/1.4 var(--mono);overflow-wrap:anywhere;white-space:pre-line}
.hot{position:absolute;border:2px solid var(--accent);border-radius:3px;background:rgba(59,91,140,.12);pointer-events:none}
.hot.off{border-style:dashed;border-color:var(--fail);background:rgba(194,54,28,.12)}
.hot.edge{right:-7px;top:calc(50% - 7px);width:14px;height:14px;border-radius:50%;background:var(--accent)}
.offhot{display:flex;align-items:center;gap:6px;font:12px/1.3 var(--mono);color:var(--fail);min-height:24px}
.offhot .hot{position:static;flex:none;width:22px;height:12px}
.start{position:absolute;top:-12px;left:6px;z-index:2;white-space:nowrap;font:600 11px/1 var(--mono);color:#fff;background:var(--accent);padding:5px 8px;border-radius:10px}
.badge{position:absolute;top:-12px;right:6px;z-index:2;white-space:nowrap;font:700 11px/1 var(--mono);letter-spacing:.04em;color:#fff;background:var(--fail);padding:5px 8px;border-radius:3px}
.cap{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:2px}
.cap .state{font:600 13px var(--mono);overflow-wrap:anywhere}
.pill{font:600 11px/1 var(--mono);letter-spacing:.04em;padding:3px 7px;border-radius:10px;border:1px solid var(--line);color:var(--dim)}
.pill.ok{color:var(--pass);border-color:var(--pass)}.pill.bad{color:var(--fail);border-color:var(--fail)}
.ms{font:12px var(--mono);color:var(--dim)}
.fnote{margin:0;font:12px/1.4 var(--mono);color:var(--dim)}
.conn{position:relative;width:var(--cw);flex:none;aspect-ratio:calc(var(--cw) / 1px) / calc(var(--vh) * var(--fw) / var(--vw) / 1px);height:auto}
.conn{height:calc(var(--fw) * var(--vh) / var(--vw));aspect-ratio:auto}
.conn svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.conn path{stroke:var(--accent);stroke-width:2}
.conn .head{position:absolute;right:6px;width:0;height:0;margin-top:-6px;border-left:10px solid var(--accent);border-top:6px solid transparent;border-bottom:6px solid transparent}
.conn .label{position:absolute;left:8px;right:8px;top:8px;font:12px/1.35 var(--sans);color:var(--dim);text-align:center;background:var(--surface);border-radius:4px;padding:3px 4px}
.conn .label b{display:block;font:600 12px var(--mono);color:var(--ink)}
.conn .label span{display:block;font:11px/1.3 var(--mono);margin-top:3px;overflow-wrap:anywhere}
.gallery h3{margin:0 0 12px;font:600 17px/1.3 var(--sans)}
.gallery .sub{font:12px var(--mono);color:var(--dim);margin-left:8px}
.gallery .why{margin:0 0 14px;font:13px/1.4 var(--sans);color:var(--dim);max-width:80ch}
.variants{display:grid;grid-template-columns:repeat(auto-fill,minmax(var(--gw),1fr));gap:22px;align-items:start}
.variant{display:grid;gap:6px;min-width:0}
.variant .screen{border-width:2px}
.variant.pick .screen{border-color:var(--pass)}
.variant.part .screen{border-color:var(--finding)}
.variant.not-taken .screen,.variant.no-pick .screen{border-color:var(--line)}
.status{font:600 11px/1 var(--mono);padding:4px 8px;border-radius:10px;margin-left:auto;background:var(--well);color:var(--dim);white-space:nowrap}
.status.pick{background:var(--pass);color:#fff}.status.part{background:var(--finding);color:#fff}
`;

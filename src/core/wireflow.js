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
    ${badges}
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
  const head = row.id ? `<div class="lane-h"><span class="lane-id">${esc(row.id)}</span>${row.kind ? `<span class="lane-kind ${esc(row.kind)}">${esc(row.kind)}</span>` : ''}<span class="lane-n">${row.frames.length} screens</span></div>` : '';
  return `<section class="lane" style="--vw:${vw};--vh:${vh}">${head}<div class="row"><div class="cells">${cells.join('')}</div></div></section>`;
}

// A gallery: one screen, its variants side by side, each with the status the pick gives it.
// variant: { name, shot, status: 'pick' | 'part' | 'not-taken' | 'no-pick', note? }
export function galleryHtml(g) {
  const word = { pick: 'pick', part: 'part', 'not-taken': 'not taken', 'no-pick': 'no pick yet' };
  const picked = g.variants.find(v => v.status === 'pick');
  return `<section class="gallery" id="${esc(g.id)}">
    <header class="g-h"><div><h3>${esc(g.title)}</h3>${g.sub ? `<span class="sub">${esc(g.sub)}</span>` : ''}</div><span class="g-state ${picked ? 'pick' : 'no-pick'}">${picked ? `picked · ${esc(picked.name)}` : g.variants.some(v => v.shot) ? 'waiting for a pick' : 'not drawn yet'}</span></header>
    ${g.note ? `<blockquote class="why">${esc(g.note)}</blockquote>` : ''}
    <div class="variants" style="--vw:${g.vw};--vh:${g.vh}">${g.variants.map(v => `<div class="variant ${v.status}">
      <div class="screen" style="aspect-ratio:${g.vw}/${g.vh}">${v.shot ? `<a href="${esc(v.shot)}"><img src="${esc(v.shot)}" alt="${esc(v.name)}" loading="lazy" width="${g.vw}" height="${g.vh}"></a>` : `<div class="noshot">${esc(v.missing || 'no picture')}</div>`}${pinsHtml(v.pins, g)}</div>
      <div class="cap"><span class="state">${esc(v.name)}</span><span class="status ${v.status}">${esc(word[v.status] || v.status)}</span></div>
      ${v.status === 'part' && v.note ? `<p class="fnote">taken: ${esc(v.note)}</p>` : ''}
      ${v.pins?.length ? `<ol class="notes">${v.pins.map(n => `<li>${esc(n.text)}</li>`).join('')}</ol>` : ''}
      ${v.more?.length ? `<div class="more">${v.more.map(x => `<figure class="mini"><div class="screen" style="aspect-ratio:${x.vw}/${x.vh}"><a href="${esc(x.shot)}"><img src="${esc(x.shot)}" alt="${esc(v.name)} at ${x.vw}×${x.vh}" loading="lazy" width="${x.vw}" height="${x.vh}"></a></div><figcaption>${x.vw}×${x.vh}</figcaption></figure>`).join('')}</div>` : ''}
    </div>`).join('')}</div>
  </section>`;
}

// A pinned note: an element in the drawing carrying data-uxcli-note. The pin sits at the element's
// centre in the frame; one below the fold sits on the frame's bottom edge, dashed, since the picture
// stops where the viewport did.
export const pinsHtml = (pins = [], { vw, vh }) => pins.map((n, i) => {
  const off = n.y >= vh; const cx = n.x + n.w / 2, cy = off ? vh : Math.min(vh, n.y + n.h / 2);
  return `<i class="pin${off ? ' off' : ''}" style="left:${pct(cx, vw)};top:${pct(cy, vh)}" title="${esc(n.text)}">${i + 1}</i>`;
}).join('');

export const WIREFLOW_CSS = `
:root{--fw:300px;--gw:360px;--cw:150px;--r:10px}
@media (min-width:1700px){:root{--fw:340px;--gw:420px}}
@media (max-width:760px){:root{--fw:220px;--gw:100%;--cw:110px}}
.flow{display:grid;gap:22px}
.lane{border:1px solid var(--line);border-radius:var(--r);background:var(--canvas);background-image:radial-gradient(var(--dot) 1px,transparent 1px);background-size:18px 18px;overflow:hidden}
.lane-h{display:flex;align-items:center;gap:10px;padding:10px 16px;background:var(--surface);border-bottom:1px solid var(--line)}
.lane-id{font:600 13px var(--mono);color:var(--ink)}
.lane-kind{font:600 10px/1 var(--mono);letter-spacing:.06em;text-transform:uppercase;padding:4px 7px;border-radius:4px;background:var(--well);color:var(--dim)}
.lane-kind.happy{background:var(--accent-soft);color:var(--accent)}
.lane-kind.recovery{background:var(--finding-soft);color:var(--finding)}
.lane-n{margin-left:auto;font:12px var(--mono);color:var(--dim)}
.row{overflow-x:auto;padding:26px 22px 22px}
.cells{display:flex;align-items:flex-start;gap:0;width:max-content}
.frame{position:relative;display:grid;gap:8px;flex:none;width:var(--fw);min-width:0}
.screen{position:relative;width:100%;border-radius:8px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.08),0 8px 24px -12px rgba(0,0,0,.25);outline:1px solid var(--line-soft);overflow:visible}
.screen a{display:block;height:100%}
.screen img{display:block;width:100%;height:100%;object-fit:cover;object-position:top;border-radius:8px}
.frame.loud .screen{outline:2px solid var(--fail);box-shadow:0 0 0 6px var(--fail-soft),0 8px 24px -12px rgba(0,0,0,.25)}
.noshot{display:grid;place-items:center;height:100%;padding:16px;text-align:center;color:var(--dim);font:13px/1.5 var(--mono);overflow-wrap:anywhere;white-space:pre-line;border-radius:8px;border:1.5px dashed var(--line);background:var(--surface)}
.hot{position:absolute;border:2px solid var(--accent);border-radius:4px;background:color-mix(in srgb,var(--accent) 10%,transparent);box-shadow:0 0 0 3px rgba(255,255,255,.7);pointer-events:none}
.hot::after{content:"";position:absolute;right:-6px;top:50%;width:8px;height:8px;margin-top:-4px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 2px #fff}
.hot.off{position:static;border-style:dashed;border-color:var(--fail);background:var(--fail-soft);box-shadow:none}
.frame.loud .hot{border-color:var(--fail);background:color-mix(in srgb,var(--fail) 10%,transparent)}.frame.loud .hot::after{background:var(--fail)}.hot.off::after{display:none}
.hot.edge{right:-7px;top:calc(50% - 7px);width:14px;height:14px;border-radius:50%;background:var(--accent);border:2px solid #fff}.hot.edge::after{display:none}
.offhot{display:flex;align-items:center;gap:8px;font:12px/1.3 var(--mono);color:var(--fail);min-height:24px}
.offhot .hot{flex:none;width:24px;height:12px}
.badge{position:absolute;top:-12px;right:10px;z-index:2;white-space:nowrap;font:700 11px/1 var(--mono);letter-spacing:.06em;color:#fff;background:var(--fail);padding:6px 9px;border-radius:6px;box-shadow:0 2px 6px rgba(0,0,0,.2)}
.cap{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.cap .state{font:600 13px var(--mono);color:var(--ink);overflow-wrap:anywhere}
.pill{font:600 11px/1 var(--mono);padding:4px 8px;border-radius:999px;background:var(--well);color:var(--dim)}
.pill.ok{background:var(--pass-soft);color:var(--pass)}.pill.bad{background:var(--fail-soft);color:var(--fail)}
.ms{font:12px var(--mono);color:var(--dim)}
.fnote{margin:0;font:12px/1.4 var(--mono);color:var(--dim)}
.conn{position:relative;width:var(--cw);flex:none;height:calc(var(--fw) * var(--vh) / var(--vw))}
.conn svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.conn path{stroke:var(--accent);stroke-width:2.5;stroke-linecap:round}
.conn .head{position:absolute;right:6px;width:0;height:0;margin-top:-6px;border-left:11px solid var(--accent);border-top:6px solid transparent;border-bottom:6px solid transparent}
.conn .label{position:absolute;left:8px;right:8px;top:12px;font:12px/1.35 var(--sans);color:var(--ink);text-align:center;background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:6px 8px;box-shadow:0 1px 2px rgba(0,0,0,.06)}
.conn .label b{display:block;font:700 11px var(--mono);letter-spacing:.04em;color:var(--accent);margin-bottom:2px}
.conn .label span{display:block;font:11px/1.35 var(--mono);color:var(--dim);margin-top:4px;padding-top:4px;border-top:1px dashed var(--line);overflow-wrap:anywhere}
.gallery{display:grid;gap:14px}
.g-h{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}
.g-h h3{margin:0;display:inline;font:700 17px/1.3 var(--sans);letter-spacing:-.01em}
.g-h .sub{font:12px var(--mono);color:var(--dim);margin-left:10px}
.g-state{margin-left:auto;font:600 11px/1 var(--mono);padding:6px 10px;border-radius:999px;background:var(--well);color:var(--dim)}
.g-state.pick{background:var(--pass-soft);color:var(--pass)}
.why{margin:0;padding:8px 14px;border-left:3px solid var(--line);font:13px/1.5 var(--sans);color:var(--dim);max-width:80ch}
.variants{display:grid;grid-template-columns:repeat(auto-fill,minmax(var(--gw),1fr));gap:24px;align-items:start}
.variant{display:grid;gap:8px;min-width:0;padding:12px;border-radius:12px;background:var(--canvas);background-image:radial-gradient(var(--dot) 1px,transparent 1px);background-size:18px 18px;border:1px solid var(--line)}
.variant.pick{border-color:var(--pass);box-shadow:0 0 0 3px var(--pass-soft)}
.variant.part{border-color:var(--finding);box-shadow:0 0 0 3px var(--finding-soft)}
.variant.not-taken{opacity:.72}.variant.not-taken:hover{opacity:1}
.variant .cap{padding:2px 2px 0}
.status{font:700 11px/1 var(--mono);letter-spacing:.04em;padding:5px 9px;border-radius:999px;margin-left:auto;background:var(--well);color:var(--dim);white-space:nowrap}
.status.pick{background:var(--pass);color:#fff}.status.part{background:var(--finding);color:#fff}
.variant .fnote{padding:0 2px}
.pin{position:absolute;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;background:var(--finding);color:#fff;font:700 11px/20px var(--mono);text-align:center;box-shadow:0 0 0 2px #fff,0 2px 6px rgba(0,0,0,.25);pointer-events:auto;font-style:normal}
.pin.off{border:2px dashed #fff;line-height:16px}
.notes{margin:0;padding:0 2px 0 20px;font:12px/1.5 var(--sans);color:var(--ink);display:grid;gap:2px}
.notes li::marker{font:700 11px var(--mono);color:var(--finding)}
.more{display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap;padding-top:4px;border-top:1px dashed var(--line)}
.mini{margin:0;display:grid;gap:4px;flex:1 1 0;min-width:60px;max-width:min(46%,180px)}
.mini figcaption{font:11px var(--mono);color:var(--dim);text-align:center}
`;

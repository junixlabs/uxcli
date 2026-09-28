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

export const FRAME_W = { phone: 176, wide: 300 };
export const frameWidth = (vw, vh) => (vw > vh ? FRAME_W.wide : FRAME_W.phone);

export function frameHtml(f, { fw, fh, scale, hotspot = '', extraClass = '' }) {
  const badges = (f.badges || []).map(b => `<span class="badge">${esc(b)}</span>`).join('');
  const pill = f.pill ? `<span class="pill ${f.pill.tone || ''}">${esc(f.pill.text)}</span>` : '';
  const pic = f.shot ? `<a href="${esc(f.shot)}"><img src="${esc(f.shot)}" alt="${esc(f.alt || f.title)}" loading="lazy" width="${fw}" height="${fh}"></a>` : `<div class="noshot">${esc(f.missing || 'no picture')}</div>`;
  return `<div class="frame ${f.loud ? 'loud' : ''} ${extraClass}" style="width:${fw}px">
    ${f.start ? `<span class="start">▶ ${esc(f.start)}</span>` : ''}${badges}
    <div class="screen" style="height:${fh}px">${pic}${hotspot}</div>
    ${f.hot?.off ? `<div class="offhot"><span class="hot off"></span>${esc(f.hot.target)} · ${f.hot.scrolls} scroll${f.hot.scrolls > 1 ? 's' : ''} below the fold</div>` : ''}
    <div class="cap"><span class="state">${esc(f.title)}</span>${pill}${f.extra ? `<span class="ms">${esc(f.extra)}</span>` : ''}</div>
    ${f.note ? `<p class="fnote">${esc(f.note)}</p>` : ''}
  </div>`;
}

export function flowRow(row) {
  const fw = frameWidth(row.vw, row.vh); const scale = fw / row.vw; const fh = Math.round(row.vh * scale);
  const cells = [];
  row.frames.forEach((f, k) => {
    let hotspot = ''; let y0 = fh / 2;
    const h = f.hot;
    if (h && !h.off && !h.edge) { y0 = (h.y + h.h / 2) * scale; hotspot = `<div class="hot" style="left:${(h.x * scale).toFixed(0)}px;top:${(h.y * scale).toFixed(0)}px;width:${(h.w * scale).toFixed(0)}px;height:${(h.h * scale).toFixed(0)}px"></div>`; }
    else if (h && h.off) y0 = fh + 18;
    else if (h && h.edge) hotspot = `<div class="hot edge" style="left:${fw - 6}px;top:${fh / 2 - 6}px;width:12px;height:12px"></div>`;
    cells.push(frameHtml(f, { fw, fh, scale, hotspot }));
    const link = row.links?.[k];
    if (link && row.frames[k + 1]) {
      const H = fh + 60; const y1 = fh / 2;
      cells.push(`<div class="conn" style="height:${H}px"><svg width="120" height="${H}" viewBox="0 0 120 ${H}" aria-hidden="true"><path d="M0 ${y0.toFixed(0)} C 60 ${y0.toFixed(0)}, 60 ${y1.toFixed(0)}, 112 ${y1.toFixed(0)}" fill="none"/><path class="head" d="M112 ${y1.toFixed(0)} l-8 -5 v10 z"/></svg><div class="label"><b>${esc(link.label)}</b>${link.text ? esc(link.text) : ''}${link.sub ? `<span>${esc(link.sub)}</span>` : ''}</div></div>`);
    }
  });
  return `<div class="row"><div class="cells">${cells.join('')}</div></div>`;
}

// A gallery: one screen, its variants side by side, each with the status the pick gives it.
// variant: { name, shot, status: 'pick' | 'part' | 'not-taken' | 'no-pick', note? }
export function galleryHtml(g) {
  const fw = g.vw > g.vh ? 340 : 176; const fh = Math.round(g.vh * fw / g.vw);
  const word = { pick: 'pick', part: 'part', 'not-taken': 'not taken', 'no-pick': 'no pick yet' };
  return `<section class="gallery" id="${esc(g.id)}">
    <h3>${esc(g.title)}${g.sub ? ` <span class="sub">${esc(g.sub)}</span>` : ''}</h3>
    ${g.note ? `<p class="why">${esc(g.note)}</p>` : ''}
    <div class="variants">${g.variants.map(v => `<div class="variant ${v.status}" style="width:${fw}px">
      <div class="screen" style="height:${fh}px">${v.shot ? `<a href="${esc(v.shot)}"><img src="${esc(v.shot)}" alt="${esc(v.name)}" loading="lazy" width="${fw}" height="${fh}"></a>` : `<div class="noshot">${esc(v.missing || 'no picture')}</div>`}</div>
      <div class="cap"><span class="state">${esc(v.name)}</span><span class="status ${v.status}">${esc(word[v.status] || v.status)}</span></div>
      ${v.status === 'part' && v.note ? `<p class="fnote">taken: ${esc(v.note)}</p>` : ''}
    </div>`).join('')}</div>
  </section>`;
}

export const WIREFLOW_CSS = `
.flow{display:grid;gap:26px}
.row{overflow-x:auto;padding:14px 2px 8px}
.cells{display:flex;align-items:flex-start;gap:0;width:max-content}
.frame{position:relative;display:grid;gap:6px;flex:none;min-width:0}
.screen{position:relative;width:100%;border:1px solid var(--line);border-radius:4px;background:#fff;overflow:visible}
.screen img{display:block;border-radius:3px}
.frame.loud .screen{border-color:var(--fail);box-shadow:0 0 0 2px var(--fail)}
.noshot{display:grid;place-items:center;height:100%;padding:12px;text-align:center;color:var(--dim);font:12px/1.4 var(--mono);overflow-wrap:anywhere;white-space:pre-line}
.hot{position:absolute;border:2px solid var(--accent);border-radius:3px;background:rgba(59,91,140,.12);pointer-events:none}
.hot.off{border-style:dashed;border-color:var(--fail);background:rgba(194,54,28,.12)}
.hot.edge{border-radius:50%;background:var(--accent)}
.offhot{display:flex;align-items:center;gap:6px;font:11px/1.3 var(--mono);color:var(--fail);min-height:24px}
.offhot .hot{position:static;flex:none;width:22px;height:12px}
.start{position:absolute;top:-11px;left:6px;z-index:2;white-space:nowrap;font:600 10px/1 var(--mono);color:#fff;background:var(--accent);padding:4px 7px;border-radius:10px}
.badge{position:absolute;top:-11px;right:6px;z-index:2;white-space:nowrap;font:700 10px/1 var(--mono);letter-spacing:.04em;color:#fff;background:var(--fail);padding:5px 8px;border-radius:3px}
.cap{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:2px}
.cap .state{font:600 12px var(--mono);overflow-wrap:anywhere}
.pill{font:600 10px/1 var(--mono);letter-spacing:.04em;padding:3px 6px;border-radius:10px;border:1px solid var(--line);color:var(--dim)}
.pill.ok{color:var(--pass);border-color:var(--pass)}.pill.bad{color:var(--fail);border-color:var(--fail)}
.ms{font:11px var(--mono);color:var(--dim)}
.fnote{margin:0;font:11px/1.4 var(--mono);color:var(--dim)}
.conn{position:relative;width:120px;flex:none}
.conn svg{position:absolute;inset:0;overflow:visible}
.conn path{stroke:var(--accent);stroke-width:2}
.conn path.head{fill:var(--accent);stroke:none}
.conn .label{position:absolute;left:8px;right:8px;top:6px;font:11px/1.35 var(--sans);color:var(--dim);text-align:center;background:var(--surface);border-radius:4px;padding:2px 3px}
.conn .label b{display:block;font:600 11px var(--mono);color:var(--ink)}
.conn .label span{display:block;font:10px/1.3 var(--mono);margin-top:3px;overflow-wrap:anywhere}
.gallery h3{margin:0 0 12px;font:600 16px/1.3 var(--sans)}
.gallery .sub{font:12px var(--mono);color:var(--dim);margin-left:8px}
.variants{display:flex;flex-wrap:wrap;gap:18px;align-items:flex-start}
.variant{display:grid;gap:6px}
.variant .screen{border-width:2px}
.variant.pick .screen{border-color:var(--pass)}
.variant.part .screen{border-color:var(--finding)}
.variant.not-taken .screen,.variant.no-pick .screen{border-color:var(--line)}
.status{font:600 11px/1 var(--mono);padding:4px 8px;border-radius:10px;margin-left:auto;background:var(--well);color:var(--dim);white-space:nowrap}
.gallery .why{margin:0 0 12px;font:13px/1.4 var(--sans);color:var(--dim);max-width:70ch}
.status.pick{background:var(--pass);color:#fff}.status.part{background:var(--finding);color:#fff}
`;

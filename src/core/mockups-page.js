// The mockups page, as named components over one token set. Pure: a model in, a document out.
// What the browser already does, it does: a screen is shown by its anchor (:target, so back,
// forward and reload keep it), A and B are a radio group (:has), the viewer and the file sheet are
// <dialog>, the agent's review is a popover, the viewport and the hooks are form controls. The
// script only fills the viewer and the file sheet, and adds the keys.
//
// model: { name, sizes: [[w, h]], decided, total, proto, hashes,
//          journeys: [{ id, goal, screens: [screen], flow: { lanes: [row], play } | null }] }
// screen: { id, state, n, crumb, title, action, question, status, first?, vw, vh, revise, tech, problems, refs,
//           variants: [{ name, shot, screens, hooks, pins, view, pickId, status, summary, part, review }] }
import { esc, human, sentence, flowRow, hooksHtml, pinsHtml, WIREFLOW_CSS } from './wireflow.js';

export const STATUS = { picked: 'Decided', revise: 'Revision asked', open: 'Open', undrawn: 'Not drawn' };
const letter = k => String.fromCharCode(65 + k);

// —— the sidebar: the one list of screens ——
export const ScreenLink = s => `<a href="#screen-${esc(s.state)}" data-go="${esc(s.state)}"><span class="n">${esc(s.n)}</span><span class="nm">${esc(human(s.state))}</span><i class="dot ${s.status}" title="${esc(STATUS[s.status])}"></i></a>`;
export const FlowLink = j => `<a href="#screen-flow-${esc(j.id)}" data-go="flow-${esc(j.id)}" class="fl"><span class="n">▶</span><span class="nm">Flow</span></a>`;
export const Sidebar = m => `<aside class="side">
  <div class="proj">${esc(m.name)}</div>
  <div class="cnt">${m.decided} of ${m.total} screens decided</div>
  ${m.journeys.map(j => `<nav class="sj" aria-label="${esc(human(j.id))}"><div class="sj-h"><span>${esc(human(j.id))}</span><em>${j.screens.filter(s => s.status === 'picked' || s.status === 'revise').length}/${j.screens.length}</em></div>${j.screens.map(ScreenLink).join('')}${j.flow ? FlowLink(j) : ''}</nav>`).join('')}
  ${Tools(m)}
</aside>`;
export const Tools = m => `<div class="tools">
    ${m.sizes.length > 1 ? `<fieldset class="vpsw"><legend>Screen size</legend>${m.sizes.map(([w, h], k) => `<label><input type="radio" name="vp" value="${w}x${h}"${k ? '' : ' checked'}>${w}×${h}</label>`).join('')}</fieldset>` : ''}
    <label class="tog"><input type="checkbox" id="hooks">Show hooks</label>
    <span class="hint">Keys 1, 2 flip between drawings. The page writes nothing: a choice gives you the file to save.</span>
  </div>`;
export const ScreenJump = m => `<select class="jump" aria-label="Go to a screen">${m.journeys.map(j => `<optgroup label="${esc(human(j.id))}">${j.screens.map(s => `<option value="${esc(s.state)}">${esc(s.n)} ${esc(human(s.state))} · ${esc(STATUS[s.status])}</option>`).join('')}${j.flow ? `<option value="flow-${esc(j.id)}">Flow of ${esc(human(j.id))}</option>` : ''}</optgroup>`).join('')}</select>`;

// —— one screen: header, the drawings flipped by a radio group, the decision bar ——
export const Flip = (d, first) => d.variants.length > 1 ? `<fieldset class="flip"><legend>Drawing</legend>${d.variants.map((v, k) => `<label data-flip="${k}" title="Key ${k + 1}"><input type="radio" name="flip-${esc(d.state)}" value="${k}"${k === first ? ' checked' : ''}><b class="letter">${letter(k)}</b>${esc(human(v.name))}</label>`).join('')}</fieldset>` : '';
export const Drawing = (v, k, d) => {
  const screens = (v.screens?.length ? v.screens : [{ vw: d.vw, vh: d.vh, shot: v.shot }]).map((x, i) =>
    `<div class="screen" data-vp="${x.vw}x${x.vh}" style="aspect-ratio:${x.vw}/${x.vh};--sw:${x.vw}">${x.shot ? `<a href="${esc(x.shot)}"${v.view ? ` data-view="${esc(v.view)}"` : ''}><img src="${esc(x.shot)}" alt="${esc(human(v.name))} at ${x.vw}×${x.vh}" loading="lazy" width="${x.vw}" height="${x.vh}"></a>` : `<div class="noshot">${esc(v.missing || 'No picture')}</div>`}${i === 0 ? hooksHtml(v.hooks, x) + pinsHtml(v.pins, x) : ''}</div>`).join('');
  return `<figure class="opt ${v.status}" data-k="${k}">
      <figcaption><b class="letter">${letter(k)}</b><span class="opt-name" title="${esc(v.name)}.html">${esc(human(v.name))}</span>${v.status === 'pick' ? '<span class="tag pick">Chosen</span>' : v.status === 'part' ? '<span class="tag part">Part taken</span>' : ''}${v.summary ? `<span class="opt-sum">${esc(sentence(v.summary))}</span>` : ''}${v.status === 'part' && v.part ? `<span class="opt-sum">Taken into the pick: ${esc(v.part)}</span>` : ''}</figcaption>
      <div class="screens">${screens}</div>
      ${v.pins?.length ? `<ol class="notes">${v.pins.map(n => `<li>${esc(sentence(n.text))}</li>`).join('')}</ol>` : ''}
    </figure>`;
};
export const ReviewPopover = (r, k, d) => {
  if (!r) return '';
  const id = `rv-${d.state}-${k}`.replace(/[^\w-]/g, '_');
  return `<button type="button" class="review${r.refused ? ' refused' : ''}" data-of="${k}" popovertarget="${id}">Agent review of ${letter(k)}, ${esc(human(r.lens))} lens: ${esc(r.line)}</button>
      <div popover id="${id}" class="rv-pop"><b>${letter(k)} · ${esc(human(d.variants[k].name))} · ${esc(human(r.lens))} lens</b>${r.points.length ? `<ul>${r.points.map(x => `<li title="${esc(x.id)}">${esc(x.text)}</li>`).join('')}</ul>` : ''}${r.more ? `<p class="more-n">${r.more} more in technical details</p>` : ''}${r.by ? `<p class="by">${esc(r.by)}</p>` : ''}</div>`;
};
export const DecisionBar = d => {
  const drawn = d.variants.filter(v => v.shot);
  if (!drawn.length) return '';
  return `<div class="d-bar"><div class="d-rv">${d.variants.map((v, k) => ReviewPopover(v.review, k, d)).join('')}</div>
      <button type="button" class="neither${d.status === 'revise' ? ' on' : ''}" data-revise="${esc(d.state)}">Neither, ask for a revision</button>
      ${drawn.map(v => { const k = d.variants.indexOf(v); return `<button type="button" class="choose${v.status === 'pick' ? ' on' : ''}" data-pickv="${esc(v.pickId)}" data-of="${k}">Choose ${letter(k)} · ${esc(human(v.name))}</button>`; }).join('')}</div>`;
};
export const Details = d => {
  const refs = d.refs?.length ? `<details class="refsbox"><summary>References (${d.refs.length})</summary><div class="refs">${d.refs.map(r => `<figure class="ref"><a href="${esc(r.src)}" data-view="${esc(r.view)}"><img src="${esc(r.src)}" alt="${esc(r.name)}" loading="lazy"></a><figcaption title="${esc(r.name)}">${esc(human(r.name))}</figcaption></figure>`).join('')}</div></details>` : '';
  const tech = d.tech?.length ? `<details class="tech"><summary>Technical details${d.problems ? ` · <span class="warn">${d.problems} problem${d.problems > 1 ? 's' : ''}</span>` : ''}</summary>${d.tech.map(t => `<details class="tech-row"><summary>${esc(t.label)}</summary>${t.lines.map(l => `<span>${esc(l)}</span>`).join('')}</details>`).join('')}</details>` : '';
  return refs || tech ? `<div class="d-more">${refs}${tech}</div>` : '';
};
export function Screen(d) {
  const picked = d.variants.find(v => v.status === 'pick');
  const first = Math.max(0, picked ? d.variants.indexOf(picked) : 0);
  const ask = d.question ? sentence(d.question) : d.action ? `The person here: ${d.action}` : null;
  return `<section class="view decision ${d.status}${d.vw < d.vh ? ' portrait' : ''}" id="screen-${esc(d.state)}" data-screen="${esc(d.state)}" data-state="${d.status}"${d.first ? ' data-first' : ''}>
    <header class="d-h"><div class="d-t">${d.crumb ? `<span class="crumb">${esc(d.crumb)}</span>` : ''}<h2 title="${esc(d.state)}">${d.n ? `<span class="d-n">${esc(d.n)}</span>` : ''}${esc(human(d.title || d.state))}</h2>${ask ? `<p class="d-q">${esc(ask)}</p>` : ''}${d.revise ? `<p class="d-rev"><b>Revision asked${d.revise.by ? ` by ${esc(d.revise.by)}` : ''}:</b> ${esc(d.revise.note)}</p>` : ''}</div>
      <div class="d-tools"><span class="d-state ${d.status}">${esc(picked ? `Decided: ${human(picked.name)}` : STATUS[d.status])}</span>${Flip(d, first)}${d.variants.filter(v => v.shot).length > 1 ? `<button type="button" class="ghost" data-compare="${esc(d.state)}">Side by side</button>` : ''}</div></header>
    <div class="stage">${d.variants.map((v, k) => Drawing(v, k, d)).join('')}${Details(d)}</div>
    ${DecisionBar(d)}
  </section>`;
}

// —— a journey's flow of picked screens, as its own view ——
export const FlowView = j => !j.flow ? '' : `<section class="view flowview" id="screen-flow-${esc(j.id)}" data-screen="flow-${esc(j.id)}"><header class="d-h"><div class="d-t"><span class="crumb">${esc(human(j.id))}</span><h2>The flow of picked screens</h2>${j.goal ? `<p class="d-q">${esc(sentence(j.goal))}</p>` : ''}</div>${j.flow.play ? `<div class="d-tools"><button class="play" type="button" data-play="${esc(j.flow.play)}">▶ Play the flow</button></div>` : ''}</header><div class="stage"><div class="flow">${j.flow.lanes.map(flowRow).join('')}</div></div></section>`;

// —— dialogs ——
// The viewer walks frames (play), shows one drawing (view) or several side by side (compare).
export const Viewer = () => `<dialog class="proto" id="proto" aria-label="Viewer">
  <div class="p-stage"></div>
  <div class="p-bar"><span class="p-n"></span><span class="p-title"></span><span class="p-link"></span><span class="p-keys" hidden></span><form method="dialog"><button class="p-close" autofocus>Close</button></form></div>
</dialog>`;
// The file a choice gives: shown, never written.
export const FileSheet = () => `<dialog class="pickbar" id="pickbar" aria-label="File to save"><div class="pb-h"><span>Save as</span><b class="pb-path"></b><span class="pb-hint"></span></div><textarea spellcheck="false" aria-label="File contents"></textarea><div class="pb-act"><button type="button" class="pb-copy">Copy</button><button type="button" class="pb-next">Next open screen</button><form method="dialog"><button class="pb-close">Close</button></form></div></dialog>`;

// —— styles: tokens once, then components ——
export const TOKENS = `
:root{color-scheme:light;--bg:#f5f6f8;--canvas:#eceef2;--stage:#e6e8ed;--dot:#d6dae1;--surface:#fff;--well:#eceef2;--ink:#15181e;--dim:#5f6673;--faint:#8b929e;--line:#d9dde4;--line-soft:#e7e9ee;--accent:#2f5bea;--accent-ink:#fff;--accent-soft:#e6ecfd;--fail:#c8361d;--fail-soft:#fbe4df;--finding:#8a5a00;--finding-soft:#f6ecd8;--pass:#1b7f4b;--pass-soft:#dcf1e4;--mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;--sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Helvetica,Arial,sans-serif;--r:9px;--pad:32px}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){color-scheme:dark;--bg:#111317;--canvas:#16191e;--stage:#0c0e11;--dot:#262a31;--surface:#1a1d23;--well:#23272f;--ink:#eceef1;--dim:#a0a7b2;--faint:#737b87;--line:#323944;--line-soft:#262b33;--accent:#7f9bff;--accent-ink:#0d1220;--accent-soft:#1f2848;--fail:#ff7a5e;--fail-soft:#46231b;--finding:#e0b25a;--finding-soft:#3d3118;--pass:#5cc98b;--pass-soft:#173a26}}
:root[data-theme="dark"]{color-scheme:dark;--bg:#111317;--canvas:#16191e;--stage:#0c0e11;--dot:#262a31;--surface:#1a1d23;--well:#23272f;--ink:#eceef1;--dim:#a0a7b2;--faint:#737b87;--line:#323944;--line-soft:#262b33;--accent:#7f9bff;--accent-ink:#0d1220;--accent-soft:#1f2848;--fail:#ff7a5e;--fail-soft:#46231b;--finding:#e0b25a;--finding-soft:#3d3118;--pass:#5cc98b;--pass-soft:#173a26}
`;
// which drawing, which viewport: rules the browser applies from the radios, generated for the counts the page has
const flipRules = n => Array.from({ length: n }, (_, k) =>
  `.view:has(.flip input[value="${k}"]:checked) .opt:not([data-k="${k}"]),.view:has(.flip input[value="${k}"]:checked) .d-rv .review:not([data-of="${k}"]){display:none}.view:has(.flip input[value="${k}"]:checked) .choose[data-of="${k}"]{order:2;background:var(--accent);color:var(--accent-ink)}.view:has(.flip input[value="${k}"]:checked) .flip label[data-flip="${k}"]{background:var(--surface);color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.12)}`).join('\n');
const vpRules = sizes => sizes.length < 2 ? '' : sizes.map(([w, h]) => `body:has(input[name="vp"][value="${w}x${h}"]:checked) .screens .screen:not([data-vp="${w}x${h}"]){display:none}`).join('\n');
export const PAGE_CSS = (sizes, variants = 2) => `
*,*::before,*::after{box-sizing:border-box}
${TOKENS}
html{background:var(--bg)}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.5 var(--sans)}
a{color:var(--accent)}button{font:inherit;cursor:pointer}fieldset{margin:0;padding:0;border:0;min-width:0}legend{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
${WIREFLOW_CSS}
.app{display:grid;grid-template-columns:236px minmax(0,1fr);min-height:100vh}
.side{position:sticky;top:0;height:100vh;overflow-y:auto;padding:22px 14px 16px;display:flex;flex-direction:column;gap:2px}
.side .proj{font:650 15px/1.3 var(--sans);padding:0 10px;overflow-wrap:anywhere}
.side .cnt{font:13px var(--sans);color:var(--dim);padding:2px 10px 10px}
.sj{display:grid;gap:1px;padding-top:12px}
.sj-h{display:flex;gap:8px;padding:0 10px 4px;font:600 12px var(--sans);color:var(--faint)}.sj-h span{flex:1;min-width:0}.sj-h em{font-style:normal;font-variant-numeric:tabular-nums}
.side a[data-go]{display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:7px;color:var(--ink);text-decoration:none;font:14px/1.3 var(--sans)}
.side a[data-go] .n{color:var(--faint);font-variant-numeric:tabular-nums;width:24px;flex:none;font-size:13px}.side a[data-go] .nm{flex:1;min-width:0}
.side a[data-go]:hover{background:var(--well)}.side a[aria-current]{background:var(--surface);box-shadow:0 1px 2px rgba(0,0,0,.08);font-weight:600}
.side a.fl{color:var(--dim)}
.dot{width:8px;height:8px;border-radius:50%;flex:none;border:1.5px solid var(--faint)}.dot.picked{background:var(--pass);border-color:var(--pass)}.dot.revise{background:var(--finding);border-color:var(--finding)}.dot.undrawn{border-style:dashed}.dot.chosen{border-color:var(--accent);background:var(--accent-soft)}
.tools{margin-top:auto;display:grid;gap:10px;padding:16px 10px 0}
.vpsw{display:inline-flex;flex-wrap:wrap;border-radius:8px;background:var(--well);padding:2px;justify-self:start}
.vpsw label{font:600 12px var(--sans);padding:6px 9px;border-radius:6px;color:var(--dim);cursor:pointer;font-variant-numeric:tabular-nums}.vpsw input{position:absolute;opacity:0;pointer-events:none}
.vpsw label:has(input:checked){background:var(--surface);color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.12)}.vpsw label:has(input:focus-visible){outline:2px solid var(--accent)}
.tog{justify-self:start;display:inline-flex;gap:8px;align-items:center;font:600 12px/1 var(--sans);padding:8px 10px;border-radius:8px;background:var(--well);color:var(--ink);cursor:pointer}.tog input{margin:0;accent-color:var(--accent)}
.hint{font:12px/1.45 var(--sans);color:var(--faint)}
.jump{display:none;margin:12px 16px 0;width:calc(100% - 32px);font:600 15px var(--sans);padding:10px 12px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:var(--ink)}
.main{min-width:0;background:var(--surface)}
.view{display:grid;grid-template-rows:auto minmax(0,1fr) auto;min-width:0;height:100vh}
.views:has(> .view:target) > .view:not(:target),.views:not(:has(> .view:target)) > .view:not([data-first]){display:none}
.d-h{display:flex;align-items:flex-end;gap:20px;padding:18px var(--pad) 14px;flex-wrap:wrap}
.d-t{flex:1;min-width:min(100%,320px);display:grid;gap:3px}
.crumb{font:600 12px var(--sans);color:var(--faint)}
.d-h h2{margin:0;font:650 22px/1.25 var(--sans);letter-spacing:-.01em;text-wrap:balance}.d-n{color:var(--faint);font-weight:500;margin-right:10px;font-variant-numeric:tabular-nums}
.d-q{margin:0;font:15px/1.5 var(--sans);color:var(--dim);max-width:75ch}
.d-rev{margin:4px 0 0;font:14px/1.5 var(--sans);max-width:75ch}.d-rev b{color:var(--finding);font-weight:600}
.d-tools{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.d-state{font:600 12px/1 var(--sans);padding:7px 10px;border-radius:999px;background:var(--well);color:var(--dim)}.d-state.picked{background:var(--pass-soft);color:var(--pass)}.d-state.revise{background:var(--finding-soft);color:var(--finding)}
.flip{display:inline-flex;background:var(--well);border-radius:10px;padding:3px}
.flip label{padding:7px 12px;border-radius:8px;font:600 14px var(--sans);color:var(--dim);display:flex;gap:8px;align-items:center;cursor:pointer}.flip input{position:absolute;opacity:0;pointer-events:none}.flip label:has(input:focus-visible){outline:2px solid var(--accent)}
.ghost,.play{border:0;background:transparent;color:var(--accent);font:600 14px var(--sans);padding:8px 10px;border-radius:8px}.ghost:hover,.play:hover{background:var(--accent-soft)}
.stage{background:var(--stage);overflow:auto;padding:18px var(--pad) 24px;display:grid;align-content:start;gap:16px}
.opt{margin:0;display:grid;gap:12px;min-width:0}
.opt figcaption{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.letter{font:700 11px/1 var(--sans);width:20px;height:20px;border-radius:50%;display:inline-grid;place-items:center;background:var(--ink);color:var(--bg);flex:none}
.flip .letter{background:var(--dim)}
.opt-name{font:600 15px var(--sans)}.opt-sum{flex-basis:100%;font:14px/1.5 var(--sans);color:var(--dim);max-width:80ch}
.tag{font:600 11px/1 var(--sans);padding:4px 8px;border-radius:999px}.tag.pick{background:var(--pass-soft);color:var(--pass)}.tag.part{background:var(--well);color:var(--dim)}
.opt .screen{max-width:min(100%,calc(var(--sw) * 1px));border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.12),0 18px 44px -22px rgba(0,0,0,.4)}
.decision.portrait .opt .screens{max-width:420px}
.opt.pick .screen{box-shadow:0 0 0 2px var(--pass),0 18px 44px -22px rgba(0,0,0,.4)}
.notes{margin:0;padding-left:20px;font:14px/1.5 var(--sans);display:grid;gap:3px;max-width:80ch}.notes li::marker{font:700 12px var(--sans);color:var(--dim)}
.d-more{display:grid;gap:6px}.d-more summary{cursor:pointer;font:500 13px var(--sans);color:var(--dim)}
.warn{color:var(--finding)}
.tech-row{padding:6px 0 0 14px;font:12px/1.5 var(--sans);color:var(--dim);overflow-wrap:anywhere}.tech-row summary{color:var(--ink);font-weight:600}.tech-row span{display:block}
.refs{display:flex;flex-wrap:wrap;gap:12px;padding-top:8px}.ref{width:180px}
.d-bar{display:flex;align-items:center;gap:10px;padding:12px var(--pad);background:var(--surface);box-shadow:0 -1px 0 var(--line-soft)}
.d-rv{flex:1;min-width:0}
.d-bar button{font:600 14px/1 var(--sans);padding:12px 16px;border-radius:var(--r);border:0;background:var(--well);color:var(--ink);white-space:nowrap}
.d-bar .review{background:transparent;color:var(--dim);font-weight:400;padding:12px 0;max-width:100%;overflow:hidden;text-overflow:ellipsis;text-align:left}.d-bar .review::after{content:" \\25B4"}.d-bar .review:hover{color:var(--ink);text-decoration:underline}.d-bar .review.refused{color:var(--fail)}
.d-bar .neither{background:transparent;color:var(--dim)}.d-bar .neither.on,.d-bar .neither[aria-pressed="true"]{color:var(--finding);background:var(--finding-soft)}
.d-bar .choose{order:1}.d-bar .choose.on,.d-bar .choose[aria-pressed="true"]{box-shadow:inset 0 0 0 2px var(--pass)}
.d-bar button:focus-visible,.side a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.rv-pop{position:fixed;inset:auto auto 84px 260px;margin:0;width:min(560px,calc(100vw - 300px));border:0;border-radius:12px;padding:14px 16px;background:var(--surface);color:var(--ink);box-shadow:0 18px 50px -14px rgba(0,0,0,.4),0 0 0 1px var(--line-soft);font:14px/1.5 var(--sans)}
.rv-pop ul{margin:8px 0 0;padding-left:18px;display:grid;gap:6px}.rv-pop .more-n,.rv-pop .by{margin:8px 0 0;font:12px var(--sans);color:var(--dim)}
.pin{width:18px;height:18px;margin:-9px 0 0 -9px;font-size:10px;line-height:18px;opacity:.9}
body:has(#hooks:checked) .hk{display:block}
.flow{display:grid;gap:14px}
:root{--fw:260px;--cw:120px}.lane.wide{--fw:clamp(280px,24vw,420px);--cw:120px}
.row{padding:16px 14px 12px}.lane{background:var(--canvas);border:0}.lane-h{background:transparent;border:0}
dialog{color:var(--ink)}
.proto{position:fixed;inset:0;width:100vw;height:100vh;max-width:none;max-height:none;margin:0;border:0;padding:24px;background:transparent;color:#fff;grid-template-rows:minmax(0,1fr) auto;grid-template-columns:minmax(0,1fr)}
.proto[open]{display:grid}.proto::backdrop{background:rgba(10,12,16,.95);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.proto form{margin:0}
.pickbar{position:fixed;inset:auto 24px 84px auto;margin:0;width:min(560px,calc(100vw - 48px));border:0;border-radius:14px;padding:14px 16px;background:var(--surface);box-shadow:0 20px 60px -16px rgba(0,0,0,.45),0 0 0 1px var(--line-soft);z-index:50}
.pickbar[open]{display:grid;gap:10px}
.pickbar .pb-h{display:grid;gap:2px;font:13px var(--sans);color:var(--dim)}.pickbar .pb-h b{font:600 13px var(--sans);color:var(--ink);overflow-wrap:anywhere}
.pickbar textarea{width:100%;height:110px;font:12px/1.4 var(--mono);color:var(--ink);background:var(--well);border:0;border-radius:8px;padding:8px;resize:vertical}
.pickbar .pb-act{display:flex;gap:8px;flex-wrap:wrap}.pickbar form{margin:0}.pickbar button{font:600 13px var(--sans);padding:9px 14px;border-radius:var(--r);border:0;background:var(--well);color:var(--ink)}.pickbar .pb-copy{background:var(--accent);color:var(--accent-ink)}
${flipRules(variants)}
${vpRules(sizes)}
@media (max-width:900px){
  :root{--pad:16px}
  .app{grid-template-columns:minmax(0,1fr)}.side{display:none}.jump{display:block}
  .view{height:auto}
  .d-bar{position:sticky;bottom:0;flex-wrap:wrap}.d-rv{flex-basis:100%}.d-bar button{flex:1 1 auto}
  .rv-pop{inset:auto 16px 150px 16px;width:auto}
  .pickbar{inset:auto 16px 156px 16px;width:auto}
}
`;

// —— behaviour the browser does not have ——
// window.UXCLI_PROTO = { [id]: { vw, vh, frames: [{ shot, title, missing, hot, pins, hooks, pick? }], links } }
// window.UXCLI_HASHES = { '<state>/<variant>': sha256 }
export const CLIENT_JS = `(function(){
var P=window.UXCLI_PROTO||{},H=window.UXCLI_HASHES||{},V=document.getElementById('proto'),F=document.getElementById('pickbar');
function all(s,r){return [].slice.call((r||document).querySelectorAll(s))}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function pc(n,of){return (100*n/of).toFixed(2)+'%'}
// where the reader is: the screen the address names, else the first open one
function current(){var t=decodeURIComponent(location.hash.slice(1)),el=t&&document.getElementById(t);return el&&el.classList.contains('view')?el:document.querySelector('.view[data-first]')}
function mark(){var c=current(),id=c&&c.getAttribute('data-screen');all('.side a[data-go]').forEach(function(a){if(a.getAttribute('data-go')===id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});var s=document.querySelector('select.jump');if(s&&id)s.value=id}
window.addEventListener('hashchange',mark);mark();
V.addEventListener('close',function(){var a=document.activeElement;if(!a||a===document.body||!a.offsetParent){var c=current(),l=c&&[].slice.call(c.querySelectorAll('.opt .screen a[data-view]')).filter(function(x){return x.offsetParent})[0];if(l)l.focus()}});
function go(id){location.hash='screen-'+id}
function flip(k){var c=current(),r=c&&c.querySelector('.flip input[value="'+k+'"]');if(r)r.checked=true}
// the viewer
var cur=null,k=0,mode='play',vk=null,stage=V.querySelector('.p-stage');
function box(h,cls,inner){return '<i class="'+cls+'" style="left:'+pc(h.x,cur.vw)+';top:'+pc(h.y,cur.vh)+';width:'+pc(h.w,cur.vw)+';height:'+pc(h.h,cur.vh)+'">'+(inner||'')+'</i>'}
function screen(f,live){var h=f.hot,s='<div class="p-cell"><div class="p-screen" style="aspect-ratio:'+cur.vw+'/'+cur.vh+'">';
s+=f.shot?'<img src="'+esc(f.shot)+'" alt="">':'<div class="noshot">'+esc(f.missing||'No picture')+'</div>';
(f.hooks||[]).forEach(function(x){if(x.w>0)s+=box(x,'hk','<b>'+esc(x.sel)+'</b>')});
(f.pins||[]).forEach(function(n,i){var off=n.y>=cur.vh,cx=n.x+Math.min(12,n.w/2),cy=off?cur.vh:Math.min(cur.vh,n.y+Math.min(12,n.h/2));s+='<i class="pin'+(off?' off':'')+'" style="left:'+pc(cx,cur.vw)+';top:'+pc(cy,cur.vh)+'" title="'+esc(n.text)+'">'+(i+1)+'</i>'});
if(live&&h&&h.x!=null)s+='<div class="hot" style="left:'+pc(h.x,cur.vw)+';top:'+pc(h.y,cur.vh)+';width:'+pc(h.w,cur.vw)+';height:'+pc(h.h,cur.vh)+'"></div>';
s+='</div>';
if(mode!=='play')s+='<div class="p-under">'+((f.pins||[]).length?'<ol class="p-notes">'+f.pins.map(function(n){return '<li>'+esc(n.text)+'</li>'}).join('')+'</ol>':'<span></span>')+(f.pick?'<button type="button" class="p-pickv" data-pickv="'+esc(f.pick)+'">Choose '+esc(f.label||f.title)+'</button>':'')+'</div>';
s+='</div>';
if(live&&h&&(h.off||h.edge))s+='<div class="p-off">'+(h.off?'\\u2193 '+esc(h.target||'')+' \\u00b7 '+h.scrolls+' scroll'+(h.scrolls>1?'s':'')+' below the fold \\u2014 continue':h.lane?'\\u2192 next lane: '+esc(h.lane):'\\u2192 continue (hook not in the drawing)')+'</div>';
return s}
function show(){var n=cur.frames.length,one=mode!=='compare',f=cur.frames[k],L=cur.links&&cur.links[k];
stage.className='p-stage'+(one?'':' two');stage.innerHTML=one?screen(f,mode==='play'&&k<n-1):cur.frames.map(function(x){return screen(x,false)}).join('');
V.querySelector('.p-n').textContent=one?(k+1)+' / '+n:'compare';V.querySelector('.p-title').textContent=one?(f.title||''):cur.frames.map(function(x){return x.title}).join(' \\u00b7 ');
V.querySelector('.p-link').textContent=mode==='play'&&L?(L.label+(L.text?' \\u00b7 '+L.text:'')):'';
var pk=V.querySelector('.p-keys'),sb=sibs().length;pk.hidden=!(mode==='play'||(mode==='view'&&sb>1));pk.textContent=mode==='play'?'\\u2190 \\u2192 \\u00b7 esc':'\\u2190 \\u2192 other drawing \\u00b7 esc'}
function open(m,model){if(!model)return;mode=m;cur=model;k=0;show();if(!V.open)V.showModal()}
function sibs(){if(mode!=='view'||!vk||vk.indexOf('view:')!==0)return [];var st=vk.slice(5).split('/')[0];return Object.keys(P).filter(function(x){return x.indexOf('view:'+st+'/')===0})}
function view(id){vk=id;open('view',P[id]);var s=sibs();if(s.length>1)flip(s.indexOf(id))}
function step(d,abs){if(mode==='view'){var s=sibs();if(s.length<2)return;var i=abs!=null?abs:(s.indexOf(vk)+d+s.length)%s.length;if(s[i])view(s[i]);return}
if(!cur||mode!=='play')return;var n=k+d;if(n<0||n>=cur.frames.length)return;k=n;show()}
function compare(state){var ks=Object.keys(P).filter(function(x){return x.indexOf('view:'+state+'/')===0});if(ks.length<2)return;var a=P[ks[0]];vk=null;open('compare',{vw:a.vw,vh:a.vh,frames:ks.map(function(x){return P[x].frames[0]}),links:[]})}
// the file sheet: what to save, never saved
function chosen(state,btn){var b=document.getElementById('screen-'+state);if(!b)return;b.setAttribute('data-chosen','');all('.d-bar button[aria-pressed]',b).forEach(function(x){x.removeAttribute('aria-pressed')});if(btn)btn.setAttribute('aria-pressed','true');all('.side [data-go="'+state+'"] .dot').forEach(function(d){d.classList.add('chosen');d.title='Chosen here, file not saved yet'})}
function sheet(file,doc,hint){F.querySelector('.pb-path').textContent=file;F.querySelector('.pb-hint').textContent=hint;F.querySelector('textarea').value=JSON.stringify(doc,null,2);F.querySelector('.pb-next').textContent='Next open screen';if(!F.open)F.show()}
function pick(id){var p=id.split('/'),state=p[0];chosen(state,document.querySelector('.d-bar [data-pickv="'+id+'"]'));
sheet('.uxcli/mockups/'+state+'/pick.json',{schema_version:1,pick:p[1],sha256:H[id]||'<sha256 from uxcli mockups>',by:{type:'role',ref:'product-owner'},when:new Date().toISOString().slice(0,10)},'Save this file, then run uxcli mockups again. The page writes nothing.')}
function revise(state){var seen={};Object.keys(H).forEach(function(x){if(x.indexOf(state+'/')===0)seen[x.slice(state.length+1)]=H[x]});chosen(state,document.querySelector('[data-revise="'+state+'"]'));
sheet('.uxcli/mockups/'+state+'/revise.json',{schema_version:1,note:'',seen:seen,by:{type:'role',ref:'product-owner'},when:new Date().toISOString().slice(0,10)},'Write in note what should change, save the file, then ask the agent to redraw. The page writes nothing.')}
function nextOpen(){var d=all('.decision'),i=d.indexOf(current()),n=d.length;for(var j=1;j<=n;j++){var x=d[(i+j+n)%n];if(x.getAttribute('data-state')==='open'&&!x.hasAttribute('data-chosen')){go(x.getAttribute('data-screen'));return true}}return false}
function copy(btn){var ta=F.querySelector('textarea');ta.focus();ta.select();var say=function(t){btn.textContent=t;setTimeout(function(){btn.textContent='Copy'},1800)};var fall=function(){var ok=false;try{ok=document.execCommand('copy')}catch(x){}say(ok?'Copied':'Selected, press \\u2318C')};try{navigator.clipboard.writeText(ta.value).then(function(){say('Copied')},fall)}catch(x){fall()}}
document.addEventListener('click',function(e){var t=e.target,x;
if((x=t.closest('[data-play]'))){e.preventDefault();vk=null;open('play',P[x.getAttribute('data-play')]);return}
if((x=t.closest('[data-view]'))){e.preventDefault();view(x.getAttribute('data-view'));return}
if((x=t.closest('[data-compare]'))){compare(x.getAttribute('data-compare'));return}
if((x=t.closest('[data-pickv]'))){pick(x.getAttribute('data-pickv'));if(V.open)V.close();return}
if((x=t.closest('[data-revise]'))){revise(x.getAttribute('data-revise'));return}
if(t.closest('.pb-copy')){copy(t.closest('.pb-copy'));return}
if(t.closest('.pb-next')){if(nextOpen())F.close();else t.closest('.pb-next').textContent='Every screen has an answer';return}
if(V.open&&(t.closest('.hot')||t.closest('.p-off'))){step(1);return}
if(t===V)V.close()});
document.addEventListener('change',function(e){if(e.target.matches('select.jump'))go(e.target.value)});
document.addEventListener('keydown',function(e){if(V.open){if(e.key==='ArrowRight'||e.key===' ')step(1);else if(e.key==='ArrowLeft')step(-1);else if(mode==='view'&&/^[1-9]$/.test(e.key))step(0,+e.key-1);else return;e.preventDefault();return}
if(/^[1-9]$/.test(e.key)&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName||''))flip(+e.key-1)});
})();`;

// —— the page ——
export function mockupsPage(m) {
  const views = m.journeys.map(j => j.screens.map(Screen).join('') + FlowView(j)).join('\n');
  const json = o => JSON.stringify(o).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(m.name)} mockups</title>
<style>${PAGE_CSS(m.sizes, Math.max(2, ...m.journeys.flatMap(j => j.screens.map(s => s.variants.length))))}</style>
</head>
<body>
<div class="app">
${Sidebar(m)}
<main class="main">
${ScreenJump(m)}
<div class="views">
${views}
</div>
</main>
</div>
${FileSheet()}
${Viewer()}
<script>window.UXCLI_PROTO=${json(m.proto)};window.UXCLI_HASHES=${json(m.hashes)}</script>
<script>${CLIENT_JS}</script>
</body>
</html>
`;
}

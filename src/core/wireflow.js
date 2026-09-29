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

// The prototype: the frames of one lane walked one at a time, the hotspot leading to the next
// frame as the step's target does. window.UXCLI_PROTO = { [play]: { vw, vh, frames: [{ shot, title,
// missing, hot }], links: [{ label, text }] } }. Arrow keys step, Escape closes; nothing is added to
// the frames beyond what the flow already draws.
export const protoHtml = () => `<div class="proto" id="proto" hidden role="dialog" aria-label="prototype" tabindex="-1">
  <div class="p-stage"></div>
  <div class="p-bar"><span class="p-n"></span><span class="p-title"></span><span class="p-link"></span><span class="p-keys">← → · esc</span><button type="button" class="p-close">close</button></div>
</div>`;
// window.UXCLI_PROTO = { [id]: { vw, vh, frames: [{ shot, title, missing, hot, pins, hooks }], links: [{ label, text }] } }.
// [data-play=id] walks the frames one at a time; [data-view=id] shows one; [data-compare=state] shows
// the screen's drawings side by side; [data-pickv] and [data-revise] fill the pick bar; [data-go] shows a screen; [data-filter=journey] hides what the journey does not name; [data-toggle=hooks]
// outlines the hooks. Arrow keys step, Escape closes.
export const PROTO_JS = `(function(){var P=window.UXCLI_PROTO||{},el=document.getElementById('proto');if(!el)return;
var stage=el.querySelector('.p-stage'),cur=null,k=0,last=null,mode='play';
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function pc(n,of){return (100*n/of).toFixed(2)+'%'}
function box(h,cls,inner){return '<i class="'+cls+'" style="left:'+pc(h.x,cur.vw)+';top:'+pc(h.y,cur.vh)+';width:'+pc(h.w,cur.vw)+';height:'+pc(h.h,cur.vh)+'">'+(inner||'')+'</i>'}
function screen(f,live){var h=f.hot,s='<div class="p-cell"><div class="p-screen" style="aspect-ratio:'+cur.vw+'/'+cur.vh+'">';
s+=f.shot?'<img src="'+esc(f.shot)+'" alt="">':'<div class="noshot">'+esc(f.missing||'no picture')+'</div>';
(f.hooks||[]).forEach(function(x){if(x.w>0)s+=box(x,'hk','<b>'+esc(x.sel)+'</b>')});
(f.pins||[]).forEach(function(n,i){var off=n.y>=cur.vh,cx=n.x+n.w/2,cy=off?cur.vh:Math.min(cur.vh,n.y+n.h/2);s+='<i class="pin'+(off?' off':'')+'" style="left:'+pc(cx,cur.vw)+';top:'+pc(cy,cur.vh)+'" title="'+esc(n.text)+'">'+(i+1)+'</i>'});
if(live&&h&&h.x!=null)s+='<div class="hot" style="left:'+pc(h.x,cur.vw)+';top:'+pc(h.y,cur.vh)+';width:'+pc(h.w,cur.vw)+';height:'+pc(h.h,cur.vh)+'"></div>';
s+='</div>';
if(mode==='compare'){s+='<div class="p-under">'+((f.pins||[]).length?'<ol class="p-notes">'+f.pins.map(function(n){return '<li>'+esc(n.text)+'</li>'}).join('')+'</ol>':'<span></span>')+(f.pick?'<button type="button" class="p-pickv" data-pickv="'+esc(f.pick)+'">Choose '+esc(f.title.split(' \u00b7 ').pop())+'</button>':'')+'</div>'}
s+='</div>';
if(live&&h&&(h.off||h.edge))s+='<div class="p-off">'+(h.off?'\\u2193 '+esc(h.target||'')+' \\u00b7 '+h.scrolls+' scroll'+(h.scrolls>1?'s':'')+' below the fold \\u2014 continue':h.lane?'\\u2192 next lane: '+esc(h.lane):'\\u2192 continue (hook not in the drawing)')+'</div>';
return s}
function show(){var n=cur.frames.length,one=mode!=='compare',f=cur.frames[k],L=cur.links&&cur.links[k];
stage.className='p-stage'+(one?'':' two');stage.innerHTML=one?screen(f,mode==='play'&&k<n-1):cur.frames.map(function(x){return screen(x,false)}).join('');
el.querySelector('.p-n').textContent=one?(k+1)+' / '+n:'compare';el.querySelector('.p-title').textContent=one?(f.title||''):cur.frames.map(function(x){return x.title}).join(' \\u00b7 ');
var notes=(one&&f.pins&&f.pins.length)?f.pins.map(function(p,i){return (i+1)+' '+p.text}).join(' \\u00b7 '):'';
el.querySelector('.p-link').textContent=mode==='play'&&L?(L.label+(L.text?' \\u00b7 '+L.text:'')):notes;el.querySelector('.p-keys').hidden=!(mode==='play');}
function open(m,model){mode=m;cur=model;if(!cur)return;k=0;last=document.activeElement;el.hidden=false;document.body.classList.add('playing');show();el.focus();}
function close(){el.hidden=true;document.body.classList.remove('playing');if(last&&last.focus)last.focus();}
function step(d){if(!cur||mode!=='play')return;var n=k+d;if(n<0||n>=cur.frames.length)return;k=n;show();}
function compare(state){var ks=Object.keys(P).filter(function(x){return x.indexOf('view:'+state+'/')===0});if(ks.length<2)return;var a=P[ks[0]];
open('compare',{vw:a.vw,vh:a.vh,frames:ks.map(function(x){return P[x].frames[0]}),links:[]});}
function go(id,scroll){var b=document.getElementById('screen-'+id);if(!b)return;[].forEach.call(document.querySelectorAll('.view'),function(x){x.classList.toggle('off',x!==b)});
[].forEach.call(document.querySelectorAll('[data-go]'),function(x){x.classList.toggle('on',x.getAttribute('data-go')===id)});var sel=document.querySelector('select.jump');if(sel&&scroll)sel.value=id;cur2=b;if(scroll){try{history.replaceState(null,'','#screen-'+id)}catch(x){}var st=b.querySelector('.stage');if(st)st.scrollTop=0;window.scrollTo(0,0)}}
var cur2=null;
function flip(k){var b=cur2;if(!b)return;var n=b.querySelectorAll('.opt').length;if(k<0||k>=n)return;
[].forEach.call(b.querySelectorAll('.opt'),function(x){if(+x.getAttribute('data-k')===k)x.removeAttribute('data-off');else x.setAttribute('data-off','')});
[].forEach.call(b.querySelectorAll('[data-flip]'),function(x){x.classList.toggle('on',+x.getAttribute('data-flip')===k)});
[].forEach.call(b.querySelectorAll('.d-bar .review'),function(x){x.hidden=+x.getAttribute('data-of')!==k});
[].forEach.call(b.querySelectorAll('.d-bar .choose'),function(x){x.classList.toggle('primary',+x.getAttribute('data-of')===k)});}
function nextOpen(){var all=[].slice.call(document.querySelectorAll('.decision')),i=all.indexOf(cur2),n=all.length,b=null;for(var d=1;d<=n&&!b;d++){var x=all[(i+d+n)%n];if(x.getAttribute('data-state')==='open'&&!x.hasAttribute('data-chosen'))b=x}if(b)go(b.getAttribute('data-screen'),true);return !!b}
var first=document.querySelector('.decision[data-state="open"]')||document.querySelector('.decision');var h0=(location.hash||'').replace(/^#screen-/,'');
if(h0&&h0!==location.hash&&document.getElementById('screen-'+h0))go(h0,false);else if(first)go(first.getAttribute('data-screen'),false);document.body.classList.add('js');
function filter(id){document.body.setAttribute('data-journey',id||'');[].forEach.call(document.querySelectorAll('[data-journeys]'),function(x){x.hidden=!!id&&x.getAttribute('data-journeys').split(' ').indexOf(id)<0});
[].forEach.call(document.querySelectorAll('[data-filter]'),function(x){x.classList.toggle('on',(x.getAttribute('data-filter')||'')===(id||''))});}
document.addEventListener('click',function(e){var b=e.target.closest('[data-play]');if(b){e.preventDefault();open('play',P[b.getAttribute('data-play')]);return}
var v=e.target.closest('[data-view]');if(v){e.preventDefault();open('view',P[v.getAttribute('data-view')]);return}
var f=e.target.closest('[data-filter]');if(f){filter(f.getAttribute('data-filter'));return}
var g=e.target.closest('[data-go]');if(g){e.preventDefault();go(g.getAttribute('data-go'),true);return}
var fl=e.target.closest('[data-flip]');if(fl){flip(+fl.getAttribute('data-flip'));return}
var cm=e.target.closest('[data-compare]');if(cm){compare(cm.getAttribute('data-compare'));return}
var rv=e.target.closest('[data-revise]');if(rv){reviseBar(rv.getAttribute('data-revise'));return}
var t=e.target.closest('[data-toggle]');if(t){document.body.classList.toggle(t.getAttribute('data-toggle'));t.classList.toggle('on');return}
if(el.hidden)return;if(e.target.closest('.p-close')){close();return}if(e.target.closest('.hot')||e.target.closest('.p-off')){step(1);return}if(e.target===el)close();});
document.addEventListener('change',function(e){if(e.target.matches&&e.target.matches('select.jump'))go(e.target.value,true);});
document.addEventListener('click',function(e){var v=e.target.closest('[data-vp]');if(v&&v.tagName==='BUTTON'){document.body.setAttribute('data-vp',v.getAttribute('data-vp'));[].forEach.call(document.querySelectorAll('button[data-vp]'),function(x){x.classList.toggle('on',x===v)});return}
var pk=e.target.closest('[data-pickv]');if(pk){pickBar(pk.getAttribute('data-pickv'));close();return}
if(e.target.closest('.pb-next')){var bar0=document.getElementById('pickbar');if(!nextOpen())e.target.closest('.pb-next').textContent='Every screen has an answer';else if(bar0)bar0.hidden=true;return}
if(e.target.closest('.pb-close')){var bar=document.getElementById('pickbar');if(bar)bar.hidden=true;return}
var cp=e.target.closest('.pb-copy');if(cp){var ta=document.querySelector('#pickbar textarea');ta.focus();ta.select();var say=function(t){cp.textContent=t;setTimeout(function(){cp.textContent='Copy'},1800)};var fall=function(){var ok=false;try{ok=document.execCommand('copy')}catch(x){}say(ok?'Copied':'Selected, press \u2318C')};try{navigator.clipboard.writeText(ta.value).then(function(){say('Copied')},fall)}catch(x){fall()}}});
function mark(state,btn){var b=document.getElementById('screen-'+state);if(!b)return;b.setAttribute('data-chosen','');[].forEach.call(document.querySelectorAll('.side [data-go="'+state+'"] .dot'),function(d){d.classList.add('chosen');d.title='Chosen here, file not saved yet'});[].forEach.call(b.querySelectorAll('.d-act button'),function(x){x.classList.toggle('on',x===btn)});}
function bar(file,doc,hint){var b=document.getElementById('pickbar');if(!b)return;b.querySelector('.pb-path').textContent=file;b.querySelector('.pb-hint').textContent=hint;b.querySelector('textarea').value=JSON.stringify(doc,null,2);var n=b.querySelector('.pb-next');if(n)n.textContent='Next open screen';b.hidden=false;}
function pickBar(id){var H=window.UXCLI_HASHES||{},parts=id.split('/'),state=parts[0],variant=parts[1];
mark(state,document.querySelector('.decision [data-pickv="'+id+'"]'));
bar('.uxcli/mockups/'+state+'/pick.json',{schema_version:1,pick:variant,sha256:H[id]||'<sha256 from uxcli mockups>',by:{type:'role',ref:'product-owner'},when:new Date().toISOString().slice(0,10)},'Save this file, then run uxcli mockups again. The page writes nothing.');}
function reviseBar(state){var H=window.UXCLI_HASHES||{},seen={};Object.keys(H).forEach(function(k){if(k.indexOf(state+'/')===0)seen[k.slice(state.length+1)]=H[k]});
mark(state,document.querySelector('[data-revise="'+state+'"]'));
bar('.uxcli/mockups/'+state+'/revise.json',{schema_version:1,note:'',seen:seen,by:{type:'role',ref:'product-owner'},when:new Date().toISOString().slice(0,10)},'Write in note what should change, save the file, then ask the agent to redraw. The page writes nothing.');}
document.addEventListener('keydown',function(e){if(el.hidden){if(/^[1-9]$/.test(e.key)&&!/INPUT|TEXTAREA|SELECT/.test((e.target.tagName||'')))flip(+e.key-1);return}if(e.key==='Escape')close();else if(e.key==='ArrowRight'||e.key===' ')step(1);else if(e.key==='ArrowLeft')step(-1);else return;e.preventDefault();});})();`;

// A decision: one screen, what the person does on it, one drawing at a time as large as the page
// allows (A, B … flip in place), and a bar with the answers a person can give. The drawing being
// looked at is the one its Choose button offers first.
// d: { id, state, n, title, crumb, action, question, status: 'picked'|'revise'|'open'|'undrawn', vw, vh,
//      variants: [{ name, shot, screens, hooks, pins, view, pickId, status, summary, part,
//                   review: { lens, line, points: [{ id, text }], more, by, refused } }],
//      refs: [{ name, src, view }], revise: { note, by } | null, tech: [{ label, lines: [text] }], problems: n }
export const firstSentence = t => { t = String(t ?? '').trim(); const m = t.match(/^.*?[.!?](?=\s|$)/); return m ? m[0] : t; };
export const STATUS = { picked: 'Decided', revise: 'Revision asked', open: 'Open', undrawn: 'Not drawn' };
export function decisionHtml(d) {
  const letter = k => String.fromCharCode(65 + k);
  const drawn = d.variants.filter(v => v.shot);
  const picked = d.variants.find(v => v.status === 'pick');
  const first = Math.max(0, picked ? d.variants.indexOf(picked) : 0);
  const screens = v => (v.screens?.length ? v.screens : [{ vw: d.vw, vh: d.vh, shot: v.shot }]).map((x, k) =>
    `<div class="screen" data-vp="${x.vw}x${x.vh}" style="aspect-ratio:${x.vw}/${x.vh};--sw:${x.vw}">${x.shot ? `<a href="${esc(x.shot)}"${v.view ? ` data-view="${esc(v.view)}"` : ''}><img src="${esc(x.shot)}" alt="${esc(human(v.name))} at ${x.vw}×${x.vh}" loading="lazy" width="${x.vw}" height="${x.vh}"></a>` : `<div class="noshot">${esc(v.missing || 'No picture')}</div>`}${k === 0 ? hooksHtml(v.hooks, x) + pinsHtml(v.pins, x) : ''}</div>`).join('');
  const review = (r, k) => !r ? '' : `<details class="review${r.refused ? ' refused' : ''}" data-of="${k}"${k === first ? '' : ' hidden'}><summary>Agent review of ${letter(k)}, ${esc(human(r.lens))} lens: ${esc(r.line)}</summary><div class="pop">${r.points.length ? `<ul>${r.points.map(x => `<li title="${esc(x.id)}">${esc(x.text)}</li>`).join('')}</ul>` : ''}${r.more ? `<p class="more-n">${r.more} more in technical details</p>` : ''}${r.by ? `<p class="by">${esc(r.by)}</p>` : ''}</div></details>`;
  const flips = d.variants.length > 1 ? `<div class="seg" role="group" aria-label="Drawing">${d.variants.map((v, k) => `<button type="button" data-flip="${k}" class="${k === first ? 'on' : ''}" title="Key ${k + 1}"><b class="letter">${letter(k)}</b>${esc(human(v.name))}</button>`).join('')}</div>` : '';
  const opts = d.variants.map((v, k) => `<figure class="opt ${v.status}" data-k="${k}"${k === first ? '' : ' data-off'}>
      <figcaption><b class="letter">${letter(k)}</b><span class="opt-name" title="${esc(v.name)}.html">${esc(human(v.name))}</span>${v.status === 'pick' ? '<span class="tag pick">Chosen</span>' : v.status === 'part' ? '<span class="tag part">Part taken</span>' : ''}${v.summary ? `<span class="opt-sum">${esc(sentence(v.summary))}</span>` : ''}${v.status === 'part' && v.part ? `<span class="opt-sum">Taken into the pick: ${esc(v.part)}</span>` : ''}</figcaption>
      <div class="screens">${screens(v)}</div>
      ${v.pins?.length ? `<ol class="notes">${v.pins.map(n => `<li>${esc(sentence(n.text))}</li>`).join('')}</ol>` : ''}
    </figure>`).join('');
  const chooses = drawn.map(v => { const k = d.variants.indexOf(v); return `<button type="button" class="choose${k === first ? ' primary' : ''}${v.status === 'pick' ? ' on' : ''}" data-pickv="${esc(v.pickId)}" data-of="${k}">Choose ${letter(k)} · ${esc(human(v.name))}</button>`; }).join('');
  const bar = drawn.length ? `<div class="d-bar">${d.variants.map((v, k) => review(v.review, k)).join('') || '<span class="grow"></span>'}
      <button type="button" class="neither${d.status === 'revise' ? ' on' : ''}" data-revise="${esc(d.state)}">Neither, ask for a revision</button>${chooses}</div>` : '';
  const tech = d.tech?.length ? `<details class="tech"><summary>Technical details${d.problems ? ` · <span class="warn">${d.problems} problem${d.problems > 1 ? 's' : ''}</span>` : ''}</summary>${d.tech.map(t => `<div class="tech-row"><b>${esc(t.label)}</b>${t.lines.map(l => `<span>${esc(l)}</span>`).join('')}</div>`).join('')}</details>` : '';
  const refs = d.refs?.length ? `<details class="refsbox"><summary>References (${d.refs.length})</summary><div class="refs">${d.refs.map(r => `<figure class="ref"><a href="${esc(r.src)}" data-view="${esc(r.view)}"><img src="${esc(r.src)}" alt="${esc(r.name)}" loading="lazy"></a><figcaption title="${esc(r.name)}">${esc(human(r.name))}</figcaption></figure>`).join('')}</div></details>` : '';
  const ask = d.question ? sentence(d.question) : d.action ? `The person here: ${d.action}` : null;
  return `<section class="view decision ${d.status}${d.vw < d.vh ? ' portrait' : ''}" id="${esc(d.id)}" data-screen="${esc(d.state)}" data-state="${d.status}"${d.journeys ? ` data-journeys="${esc(d.journeys)}"` : ''}>
    <header class="d-h"><div class="d-t">${d.crumb ? `<span class="crumb">${esc(d.crumb)}</span>` : ''}<h2 title="${esc(d.state)}">${d.n ? `<span class="d-n">${esc(d.n)}</span>` : ''}${esc(human(d.title))}</h2>${ask ? `<p class="d-q">${esc(ask)}</p>` : ''}${d.revise ? `<p class="d-rev"><b>Revision asked${d.revise.by ? ` by ${esc(d.revise.by)}` : ''}:</b> ${esc(d.revise.note)}</p>` : ''}</div>
      <div class="d-tools"><span class="d-state ${d.status}">${esc(picked ? `Decided: ${human(picked.name)}` : STATUS[d.status])}</span>${flips}${drawn.length > 1 ? `<button type="button" class="ghost" data-compare="${esc(d.state)}">Side by side</button>` : ''}</div></header>
    <div class="stage">${opts}${refs || tech ? `<div class="d-more">${refs}${tech}</div>` : ''}</div>
    ${bar}
  </section>`;
}

// A hook the journey names, outlined where the browser found it in the drawing; shown when the
// page's hooks toggle is on. Nothing is drawn for a hook the browser did not find.
export const hooksHtml = (hooks = [], { vw, vh }) => hooks.filter(h => h.w > 0).map(h =>
  `<i class="hk" style="left:${pct(h.x, vw)};top:${pct(h.y, vh)};width:${pct(h.w, vw)};height:${pct(h.h, vh)}"><b>${esc(h.sel)}</b></i>`).join('');

// A pinned note: an element in the drawing carrying data-uxcli-note. The pin sits at the element's
// centre in the frame; one below the fold sits on the frame's bottom edge, dashed, since the picture
// stops where the viewport did.
export const pinsHtml = (pins = [], { vw, vh }) => pins.map((n, i) => {
  const off = n.y >= vh; const cx = n.x + n.w / 2, cy = off ? vh : Math.min(vh, n.y + n.h / 2);
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
.play{margin-left:12px;font:600 11px/1 var(--sans);padding:6px 10px;border-radius:999px;border:1px solid var(--line);background:var(--surface);color:var(--accent);cursor:pointer}
.play:hover{border-color:var(--accent)}
.play:focus-visible,.p-close:focus-visible,.proto .hot:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.proto{position:fixed;inset:0;z-index:100;background:rgba(10,12,16,.82);display:grid;grid-template-rows:1fr auto;padding:24px}
.proto[hidden]{display:none}
body.playing{overflow:hidden}
.p-stage{display:grid;place-items:center;min-height:0;gap:10px;grid-auto-rows:min-content;align-content:center}
.p-screen{position:relative;max-width:100%;max-height:calc(100vh - 140px);height:calc(100vh - 140px);background:#fff;border-radius:8px;box-shadow:0 20px 60px -20px rgba(0,0,0,.6);overflow:hidden}
.p-screen img{display:block;width:100%;height:100%;object-fit:contain}
.p-screen .noshot{position:absolute;inset:0}
.p-screen .hot{cursor:pointer;pointer-events:auto;animation:pulse 1.6s ease-in-out infinite}
@keyframes pulse{0%,100%{box-shadow:0 0 0 3px rgba(255,255,255,.7)}50%{box-shadow:0 0 0 8px color-mix(in srgb,var(--accent) 35%,transparent)}}
.p-off{cursor:pointer;font:12px/1.3 var(--sans);color:#fff;background:var(--fail);padding:8px 14px;border-radius:999px;border:2px dashed rgba(255,255,255,.6)}
.p-bar{display:flex;align-items:center;gap:16px;padding:14px 4px 0;color:#fff;font:13px var(--sans)}
.p-bar .p-n{font:600 12px var(--sans);opacity:.7}.p-bar .p-title{font:600 14px var(--sans)}.p-bar .p-link{opacity:.85;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.p-bar .p-keys{font:11px var(--sans);opacity:.6}
.p-close{font:600 12px var(--sans);padding:8px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.35);background:transparent;color:#fff;cursor:pointer}
.hk{position:absolute;display:none;border:1.5px dashed var(--accent);border-radius:3px;pointer-events:none;font-style:normal}
.hk b{position:absolute;left:-1.5px;top:-16px;font:600 9px/1 var(--mono);padding:3px 5px;border-radius:3px;background:var(--accent);color:#fff;white-space:nowrap}
body.hooks .hk{display:block}
.tog{font:600 11px/1 var(--sans);padding:6px 10px;border-radius:999px;border:1px solid var(--line);background:var(--surface);color:var(--dim)}
.tog.on{border-color:var(--accent);color:var(--accent);background:var(--accent-soft)}
.p-stage.two{grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:18px;align-items:start;justify-items:center}
.p-stage.two .p-screen{max-width:100%;height:calc(100vh - 230px)}
body.hooks .proto .hk{display:block}
.screens{position:relative}
body[data-vp] .screens .screen{display:none}body[data-vp="1440x900"] .screens .screen[data-vp="1440x900"],body[data-vp="1024x768"] .screens .screen[data-vp="1024x768"],body[data-vp="768x1024"] .screens .screen[data-vp="768x1024"],body[data-vp="390x844"] .screens .screen[data-vp="390x844"],body[data-vp="1920x1080"] .screens .screen[data-vp="1920x1080"],body[data-vp="1280x800"] .screens .screen[data-vp="1280x800"]{display:block}
body:not([data-vp]) .screens .screen:not(:first-child){display:none}
.vpsw{display:inline-flex;border:1px solid var(--line);border-radius:999px;overflow:hidden}.vpsw button{font:600 11px var(--sans);padding:6px 10px;border:0;background:var(--surface);color:var(--dim);cursor:pointer}.vpsw button.on{background:var(--accent);color:#fff}
.pickbar{position:fixed;left:0;right:0;bottom:0;z-index:50;background:var(--surface);border-top:1px solid var(--line);box-shadow:0 -8px 30px rgba(0,0,0,.15);padding:14px clamp(16px,2vw,32px);display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:16px;align-items:start}
.pickbar[hidden]{display:none}.pickbar .pb-h{display:grid;gap:4px;font:13px var(--sans);color:var(--dim);max-width:34ch}.pickbar .pb-h b{font:600 13px var(--sans);color:var(--ink);overflow-wrap:anywhere}
.pickbar textarea{width:100%;height:96px;font:12px/1.4 var(--mono);color:var(--ink);background:var(--well);border:1px solid var(--line);border-radius:8px;padding:8px;resize:vertical}
.pickbar .pb-act{display:grid;gap:8px}.pickbar button{font:600 12px var(--sans);padding:8px 14px;border-radius:999px;border:1px solid var(--line);background:var(--surface);color:var(--ink);cursor:pointer}.pickbar .pb-copy{background:var(--accent);color:#fff;border-color:transparent}
.p-cell{display:grid;gap:8px;min-width:0;justify-items:center}.p-under{display:flex;gap:12px;align-items:start;justify-content:space-between;width:100%;color:#fff}.p-notes{margin:0;padding-left:18px;font:12px/1.45 var(--sans);opacity:.9;display:grid;gap:2px}.p-notes li::marker{font:700 11px var(--sans);color:var(--finding)}
.p-pickv{flex:none;font:600 12px var(--sans);padding:8px 14px;border-radius:999px;border:0;background:var(--pass);color:#fff;cursor:pointer}
.ref{margin:0;display:grid;gap:4px}
.ref a{display:block;border-radius:6px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.08),0 6px 16px -10px rgba(0,0,0,.3)}.ref img{display:block;width:100%;height:auto}
.ref figcaption{font:11px/1.3 var(--sans);color:var(--dim);overflow-wrap:anywhere}
.pin{position:absolute;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;background:var(--finding);color:#fff;font:700 11px/20px var(--mono);text-align:center;box-shadow:0 0 0 2px #fff,0 2px 6px rgba(0,0,0,.25);pointer-events:auto;font-style:normal}
.pin.off{border:2px dashed #fff;line-height:16px}

.tog{cursor:pointer}
.refs{display:flex;flex-wrap:wrap;gap:12px;padding-top:8px}.ref{width:160px}
`;

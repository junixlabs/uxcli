// The one surface every uxcli page now is (studio and dashboard alike), in the design system of
// src/core/ui.js: the project as a canvas of the screens a person sees, laid out as filmstrips — each
// journey a row, each screen a device frame with its real picture, the action and its seconds on the
// arrow between, what is wrong pinned on the picture and said once in "fix first" and the to-do bar.
// Beside the canvas: Screens (every screen as a card), Runs, People (who it is for, what is unknown) and
// Library. One HTML file: the views switch in the page, so it works from disk; served, the studio adds
// the decisions a person makes (pick, redraw, note) and the dashboard a folder switch.
// Pure: data in, HTML out. Paths in the data are relative to the folder's .uxcli/ (or, in the studio
// model, to .uxcli/studio/); `asset` is the prefix that turns them into URLs.
import { TOKENS, COMPONENTS, ICONS, icon } from './ui.js';
import { human } from './wireflow.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const VIEWS = [
  { id: 'journeys', label: 'Journeys', icon: 'journeys' }, { id: 'screens', label: 'Screens', icon: 'screens' },
  { id: 'runs', label: 'Runs', icon: 'walked' }, { id: 'people', label: 'People', icon: 'person' }, { id: 'library', label: 'Library', icon: 'library' },
];

// What a person should do next, most urgent first, each pointing at a frame on the canvas.
// The screen a verdict was measured on: the state its words name ("… at agent.workspace_ready"), or else
// the screen the step reached — a verdict is read after the action.
export const verdictState = (v, s) => (/ at ([a-z][\w]*\.[\w.]+)\s*$/.exec(String(v?.what || '')) || [])[1] || s.after.state;
export function todos(model, design = []) {
  const out = []; const seen = new Set();
  const add = (t, key) => { if (seen.has(key)) return; seen.add(key); out.push(t); };
  for (const j of model.journeys || []) for (const w of j.workflows) for (const s of w.steps) {
    const at = `built|${j.id}|${w.id}|${s.id}`;
    const fail = (s.built.verdicts || []).find(v => v.value === 'fail');
    const vs = fail ? verdictState(fail, s) : s.before.state; const where = human(vs);
    const go = vs === s.after.state && s === w.steps[w.steps.length - 1] ? `${at}|end` : vs === s.after.state ? `built|${j.id}|${w.id}|${w.steps[w.steps.indexOf(s) + 1].id}` : at;
    if (fail) add({ kind: 'fail', text: fail.what ? `${where} · ${short(fail.what)}` : `${where} fails ${fail.commitment || ''}`, go, why: [fail.commitment, fail.statement, fail.what].filter(Boolean).join(' — ') }, `f|${s.before.state}|${fail.commitment}`);
    else if (s.after.held === false) add({ kind: 'fail', text: `${human(s.after.state)} was not reached`, go: at }, `h|${s.after.state}`);
    for (const f of s.built.findings || []) if (f.metric === 'reach' && !(fail && verdictState(fail, s) === s.before.state)) add({ kind: 'find', text: `${human(s.before.state)} · ${short(f.what)}`, go: at, why: f.what }, `r|${s.before.state}|${f.what}`);
  }
  for (const d of design) {
    if (d.revise) add({ kind: 'open', text: `Redraw ${human(d.state)}`, go: d.state, why: d.revise }, `v|${d.state}`);
    else if (d.variants?.length && !d.pick) add({ kind: 'open', text: `Pick a drawing for ${human(d.state)}`, go: d.state }, `p|${d.state}`);
  }
  for (const d of design) if (!d.variants?.length) add({ kind: 'idle', text: `Draw ${human(d.state)}`, go: d.state }, `d|${d.state}`);
  for (const j of model.journeys || []) if (!j.run) add({ kind: 'idle', text: `Walk ${human(j.id)}`, go: `journey|${j.id}` }, `w|${j.id}`);
  const rank = { fail: 0, find: 1, open: 2, idle: 3 };
  return out.map((t, i) => [t, i]).sort((a, b) => rank[a[0].kind] - rank[b[0].kind] || a[1] - b[1]).map(([t]) => t);
}
// The instrument's words for a finding, said the way a person would: the element by its name, what is
// wrong with it, nothing about selectors or viewports (the frame already shows which screen and size).
//   "[data-uxcli=call-action] inViewportWithoutScroll: false — needs 2 scrolls at 390x844 at agent.lead_detail" → "Call action is 2 scrolls down"
//   "lead board[data-view=kanban] visible: false at agent.workspace_ready" → "Kanban lead board is not shown"
//   "input[name=email] valueUnchanged: false" → "Email field loses what was typed"
export function short(what) {
  let s = String(what || '').trim().replace(/ cần (\d+) lần cuộn/, ' inViewportWithoutScroll: false — needs $1 scrolls').replace(/ ở \d+×\d+/, '');
  const name = sel => { const m = /\[data-uxcli=([^\]]+)\]|\[name=([^\]]+)\]|\[data-view=([^\]]+)\]|#([\w-]+)/.exec(sel); const pre = sel.replace(/\[[^\]]*\]|#[\w-]+|\b(input|button|a|div|span|select|textarea)\b/g, ' ').replace(/\s+/g, ' ').trim();
    const n = m ? (m[1] || m[2] || m[3] || m[4]).replace(/\{[^}]*\}/g, '').replace(/[-_]+/g, ' ').trim() : ''; const field = /^input|^select|^textarea/.test(sel) ? ' field' : '';
    return ((n && pre && !pre.includes(n) ? `${n} ${pre}` : n || pre || 'an element') + field).replace(/\s+/g, ' ').trim(); };
  let m;
  if ((m = /^(.*?)\s+inViewportWithoutScroll: false — needs (\d+) scrolls?/.exec(s))) s = `${name(m[1])} is ${m[2]} scroll${m[2] === '1' ? '' : 's'} down`;
  else if ((m = /^(.*?)\s+is (\d+) scrolls? away/.exec(s))) s = `${name(m[1])} is ${m[2]} scroll${m[2] === '1' ? '' : 's'} down`;
  else if ((m = /^(.*?)\s+visible: false/.exec(s))) s = `${name(m[1])} is not shown`;
  else if ((m = /^(.*?)\s+valueUnchanged: false/.exec(s))) s = `${name(m[1])} loses what was typed`;
  else if ((m = /^(.*?)\s+(\w+): (true|false)\b/.exec(s))) s = `${name(m[1])}: ${m[2].replace(/([A-Z])/g, ' $1').toLowerCase()} is ${m[3]}`;
  s = s.replace(/ at [a-z]+\.[\w.]+$/, '').replace(/ at \d+x\d+.*$/, '');
  s = s ? s[0].toUpperCase() + s.slice(1) : s;
  return s.length > 70 ? s.slice(0, 67) + '…' : s;
}

const CSS = TOKENS + COMPONENTS + `
body{height:100vh;overflow:hidden}
.top{position:fixed;left:12px;right:12px;top:12px;z-index:5}.top .sp{flex:1}
.view{position:absolute;inset:0;overflow:auto;padding:76px 24px 96px}.view[hidden]{display:none}
#journeys.view{overflow:hidden;padding:0}
.stage{position:absolute;inset:0;background-color:var(--canvas);background-image:radial-gradient(var(--dot) 1px,transparent 1px);background-size:22px 22px;cursor:grab;touch-action:none}
.stage.drag{cursor:grabbing}.world{position:absolute;left:0;top:0;transform-origin:0 0}
.wires{position:absolute;left:0;top:0;overflow:visible;pointer-events:none}.wires path{fill:none;stroke:var(--line-strong);stroke-width:2}
.wires text{font:600 11px var(--sans);fill:var(--dim)}.wires text.t{font-weight:700;font-size:12px;fill:var(--ink)}.wires text.d{fill:var(--fail)}
.jh{position:absolute;display:flex;align-items:center;gap:8px;font-weight:700;font-size:15px;white-space:nowrap}
.wl{position:absolute;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--dim)}
.frame{position:absolute;cursor:pointer;border-radius:12px;outline:none}
.frame .lb{display:flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:var(--soft);margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.frame .ics{margin-top:8px}
.frame.sel .device{outline:2px dashed var(--accent);outline-offset:6px}.frame:focus-visible .device{outline:2px solid var(--accent);outline-offset:6px}
.fix{position:fixed;left:12px;top:70px;width:320px;display:grid;grid-template-columns:64px 1fr;gap:12px;padding:12px;z-index:4}
.fix .c{height:84px;border-radius:8px;overflow:hidden;position:relative;border:1px solid var(--line);background:var(--well)}.fix .c img{width:64px}.fix .c span{position:absolute;left:0;right:0;bottom:0;height:6px;background:var(--fail-strong)}
.fix b{display:block;margin:3px 0 6px;font-size:14px}
.insp{position:fixed;right:12px;top:70px;bottom:84px;width:300px;padding:14px;z-index:4;overflow:auto;display:grid;gap:12px;align-content:start}
.insp h3{margin:0;font-size:15px}.insp .row{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:7px 0;border-top:1px solid var(--line)}
.insp .row span{display:flex;align-items:center;gap:6px;color:var(--soft)}.insp .row b.fail{color:var(--fail)}.insp .row b.ok{color:var(--ok)}
.insp h4{margin:0;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--dim)}
.vs{display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:8px}.vs figure{margin:0}.vs .th{border-radius:8px;overflow:hidden;border:2px solid var(--line);height:120px;background:var(--well)}.vs .th.p{border-color:var(--ok)}.vs img{width:100%;display:block}.vs figcaption{font-size:11px;margin-top:3px;color:var(--soft);overflow-wrap:anywhere}
.insp ul{margin:0;padding-left:16px;display:grid;gap:6px}.insp li small{display:block;color:var(--dim)}
.act{display:grid;gap:6px}.act textarea{width:100%;min-height:64px;border:1px solid var(--line);border-radius:8px;padding:6px;background:var(--surface)}.msg{font-size:12px}.msg.err{color:var(--fail)}.msg.ok{color:var(--ok)}
.todo .tt{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sheet{position:fixed;left:180px;right:324px;bottom:12px;display:flex;gap:8px;padding:8px;z-index:4;overflow:hidden}.sheet .todo{flex:0 1 auto;min-width:0}
.zoom{position:fixed;left:12px;bottom:12px;z-index:4;display:flex;align-items:center;gap:2px;padding:4px}.zoom button{border:0;background:none;border-radius:8px;padding:6px;display:grid;place-items:center}.zoom output{min-width:44px;text-align:center;font-weight:600;font-variant-numeric:tabular-nums}
.layers{display:flex;gap:2px;padding:4px}.layers button{border:0;background:none;border-radius:8px;padding:5px 9px;font-size:12px;font-weight:600;color:var(--soft);display:flex;gap:5px;align-items:center}.layers button[aria-pressed=true]{background:var(--accent-soft);color:var(--accent)}
.layers select{border:1px solid var(--line);border-radius:6px;padding:3px 6px;background:var(--surface);font-size:12px}
.live{color:var(--ok)}
h1.v{font-size:20px;margin:0 0 4px}.lede{margin:0 0 18px;color:var(--dim);max-width:760px}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:16px}
.card{padding:12px;display:grid;gap:8px;align-content:start}.card h3{margin:0;font-size:14px;display:flex;align-items:center;gap:6px}
.card .device{height:300px}.card button.open{all:unset;cursor:pointer;display:block;border-radius:18px}.card button.open:focus-visible{outline:2px solid var(--accent);outline-offset:4px}
.wide{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px}
.run summary{list-style:none;cursor:pointer;display:grid;grid-template-columns:56px 1fr auto;gap:12px;align-items:center}.run summary::-webkit-details-marker{display:none}
.run .mini{width:56px;height:76px;border-radius:8px;overflow:hidden;border:1px solid var(--line);background:var(--well)}.run .mini img{width:56px}
.res{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:2px 9px;font-size:12px;font-weight:700}.res.fail{background:var(--fail-soft);color:var(--fail)}.res.finding{background:var(--find-soft);color:var(--find)}.res.pass{background:var(--ok-soft);color:var(--ok)}.res.blocked{background:var(--idle-soft);color:var(--idle)}
.steps{display:flex;gap:14px;flex-wrap:wrap;margin-top:12px}.steps figure{margin:0;width:150px}.steps .device{height:300px}.steps figcaption{font-size:12px;margin-top:6px}
.person{display:grid;grid-template-columns:44px 1fr;gap:12px}.avatar{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:var(--accent-soft);color:var(--accent)}
.q{display:flex;gap:6px;align-items:flex-start;padding:6px 8px;border-radius:8px;background:var(--open-soft);margin-top:6px}
.meter{display:inline-flex;gap:3px}.meter i{width:8px;height:8px;border-radius:50%;background:var(--line-strong)}.meter i.on{background:var(--ok)}
@media (max-width:900px){.fix{display:none}.insp{top:auto;left:12px;right:12px;width:auto;max-height:45vh;bottom:130px}.insp:not(.on){display:none}.sheet{left:12px;right:12px;bottom:66px;overflow-x:auto}.sheet .todo{flex:0 0 230px}.top .tabs a span{display:none}}`;

const JS = `(function(){
var D=JSON.parse(document.getElementById('studio-data').textContent);var M=D.model;var A=D.asset;var IC=D.icons;
function u(p){return p==null?null:A+String(p).replace(/^\\.\\.\\//,'');}
function ic(n,s,l){return '<svg class="ic" width="'+(s||16)+'" height="'+(s||16)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'+(l?' role="img" aria-label="'+l+'"':' aria-hidden="true"')+'>'+(IC[n]||'')+'</svg>';}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function hum(id){var s=String(id==null?'':id).replace(/^.*\\./,'').replace(/^[a-z]-(?=[a-z])/,'').replace(/[_-]+/g,' ').trim();return s?s[0].toUpperCase()+s.slice(1):'';}
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;}
var DES={};(D.design||[]).forEach(function(d){DES[d.state]=d;});
var vw=parseInt(M.viewport)||390,vh=parseInt(String(M.viewport).split('x')[1])||844,PHONE=vw<700;
var FW=PHONE?150:300,FH=Math.round(FW*vh/vw),GAP=130,LBL=22,ICR=34,ROW=LBL+FH+12+ICR+48;
var stage=document.getElementById('stage'),world=document.getElementById('world'),insp=document.getElementById('insp');
var view={x:360,y:90,k:0.8},sel=null,layer='built',cmp={from:'',to:''};
var KEY='uxcli-app:'+(M.project.id||M.project.name);
try{var sv=JSON.parse(localStorage.getItem(KEY)||'null');if(sv&&sv.view)view=sv.view;if(sv&&sv.layer)layer=sv.layer;}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify({view:view,layer:layer}));}catch(e){}}
function apply(){world.style.transform='translate('+view.x+'px,'+view.y+'px) scale('+view.k+')';document.getElementById('zv').value=Math.round(view.k*100)+'%';save();}
// the screens of a workflow, in the order a person sees them: the screen before each step, then the last one after
function screens(w){var out=[];w.steps.forEach(function(s,i){out.push({state:s.before.state,shot:s.built.shot,step:s,leave:s,prev:i?w.steps[i-1]:null,end:false,w:w});});var l=w.steps[w.steps.length-1];if(l)out.push({state:l.after.state,shot:l.built.after,step:l,leave:null,prev:l,end:true,reached:l.after.held,w:w});return out;}
function vstate(v,s){var m=/ at ([a-z][\\w]*\\.[\\w.]+)\\s*$/.exec(String(v.what||''));return m?m[1]:s.after.state;}
function verdictsOn(sc,w){var out=[];w.steps.forEach(function(s){(s.built.verdicts||[]).forEach(function(v){if(vstate(v,s)===sc.state&&(s===sc.leave||(sc.prev===s)))out.push(v);});});return out;}
function health(sc){var vs=verdictsOn(sc,sc.w);if(vs.some(function(v){return v.value==='fail';})||(sc.end&&sc.reached===false))return'fail';var s=sc.leave;if(vs.length||(s&&(s.built.findings||[]).length))return'find';return'';}
function status(sc,walked){var d=DES[sc.state]||{variants:[]};var h=health(sc);
 return '<span class="s '+(d.variants.length?'y':'')+'" title="'+(d.variants.length?d.variants.length+' drawn':'not drawn')+'">'+ic('drawn',13,d.variants.length?'drawn':'not drawn')+'</span>'+
 '<span class="s '+(d.pick?'y':d.revise||d.variants.length?'w':'')+'" title="'+(d.pick?'picked '+esc(d.pick):d.revise?'redraw asked':d.variants.length?'waiting for a pick':'no pick')+'">'+ic('picked',13,d.pick?'picked':'not picked')+'</span>'+
 (h?'<span class="s n" title="needs a fix">'+ic('alert',13,'needs a fix')+'</span>':'<span class="s '+(walked?'y':'')+'" title="'+(walked?'walked':'not walked')+'">'+ic('walked',13,walked?'walked':'not walked')+'</span>');}
function image(sc){if(layer==='design'){var d=DES[sc.state];if(d){var v=d.variants.filter(function(x){return x.name===d.pick;})[0]||d.variants[0];return v&&v.shot;}return null;}return sc.shot;}
function pins(sc){var s=sc.leave;if(!s||layer!=='built')return'';var h='';(s.built.findings||[]).forEach(function(f,i){var r=f.rect;if(!r)return;var k=(FW-12)/((r.viewport&&r.viewport.w)||vw),y=r.y*k;if(y+8>FH-12){h+='<div class="fold'+((s.built.verdicts||[]).some(function(v){return v.value==='fail';})?'':' find')+'">'+ic('down',12)+esc(f.what.replace(/^.*?\\[data-uxcli=([^\\]]+)\\].*?(\\d+) scrolls?.*$/,function(m,n,k){return n.replace(/\\{[^}]*\\}/g,'').replace(/[-_]+/g,' ').trim()+' · '+k+' scroll'+(k==='1'?'':'s')+' down';}))+'</div>';}else h+='<span class="pin" style="left:'+(r.x*k)+'px;top:'+y+'px"><b>'+(i+1)+'</b></span>';});return h;}
function frame(x,y,sc,j,w){var id='built|'+j.id+'|'+w.id+'|'+sc.step.id+(sc.end?'|end':'');var f=el('div','frame');f.style.left=x+'px';f.style.top=y+'px';f.style.width=FW+'px';f.tabIndex=0;f.setAttribute('role','button');f.dataset.id=id;f.dataset.state=sc.state;if(sel===id)f.classList.add('sel');
 var h=health(sc),img=image(sc);f.setAttribute('aria-label',hum(sc.state)+(h==='fail'?', needs a fix':h==='find'?', has a finding':''));
 f.innerHTML='<div class="lb">'+ic(PHONE?'phone':'desktop',12)+' '+esc(hum(sc.state))+(h?' '+ic('alert',12):'')+'</div><div class="device'+(PHONE?'':' desk')+(h?' '+h:'')+'" style="height:'+FH+'px">'+(img?'<img src="'+esc(u(img))+'" alt="">':'<div class="none">'+(layer==='design'?'not drawn yet':'not walked yet')+'</div>')+pins(sc)+'</div><div class="ics">'+status(sc,!!j.run)+'</div>';
 f.addEventListener('click',function(e){e.stopPropagation();select(id);});f.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();select(id);}});return f;}
function render(){world.innerHTML='';var svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','wires');var g='',y=0,maxX=0;
 M.journeys.forEach(function(j){var jh=el('div','jh',esc(hum(j.id))+(j.actor?' <span class="chip">'+ic('person',12)+esc(hum(j.actor))+'</span>':'')+(j.workflows[0]&&j.workflows[0].totals?' <span class="chip">'+ic('clock',12)+j.workflows[0].totals.klmSeconds+' s</span>':'')+(j.run?'':' <span class="chip">'+ic('walked',12)+'not walked</span>'));jh.style.left='0px';jh.style.top=y+'px';jh.dataset.go='journey|'+j.id;world.appendChild(jh);y+=40;
  var rows=[{name:'',steps:null}];if(layer==='versions'){j.versions.forEach(function(v){if(cmp.from&&cmp.to&&v.name!==cmp.from&&v.name!==cmp.to)return;rows.push({name:v.name});});}
  j.workflows.forEach(function(w){if(!w.steps.length)return;var scs=screens(w);if(j.workflows.length>1){var wl=el('div','wl',esc(w.id||'workflow')+(w.kind==='recovery'?' · recovery':''));wl.style.left='0px';wl.style.top=y+'px';world.appendChild(wl);y+=20;}
   scs.forEach(function(sc,i){var x=i*(FW+GAP);maxX=Math.max(maxX,x+FW);world.appendChild(frame(x,y,sc,j,w));
    if(sc.leave){var cy=y+LBL+FH/2,x1=x+FW+10,x2=x+FW+GAP-10,m=sc.leave.built.metrics;g+='<path d="M'+x1+' '+cy+' L'+x2+' '+cy+' M'+(x2-8)+' '+(cy-6)+' L'+x2+' '+cy+' L'+(x2-8)+' '+(cy+6)+'"/>';
     var a=String(sc.leave.action||sc.leave.id);if(a.length>22)a=a.slice(0,21)+'…';g+='<text x="'+((x1+x2)/2)+'" y="'+(cy-12)+'" text-anchor="middle">'+esc(a)+'</text>';if(m)g+='<text class="t" x="'+((x1+x2)/2)+'" y="'+(cy+20)+'" text-anchor="middle">'+m.klmSeconds+' s</text>';}});
   y+=ROW;
   if(layer==='versions')j.versions.forEach(function(v){if(cmp.from&&cmp.to&&v.name!==cmp.from&&v.name!==cmp.to)return;var any=false;var wl=el('div','wl',ic('version',12)+' '+esc(v.name));wl.style.left='0px';wl.style.top=y+'px';world.appendChild(wl);
    w.steps.forEach(function(s,i){var q=s.versions.filter(function(z){return z.name===v.name;})[0];if(!q||!q.present)return;any=true;var x=(i+1)*(FW+GAP),f=el('div','frame');f.style.left=x+'px';f.style.top=(y+18)+'px';f.style.width=FW+'px';f.innerHTML='<div class="lb">'+esc(hum(s.after.state))+'</div><div class="device'+(PHONE?'':' desk')+'" style="height:'+FH+'px">'+(q.shot?'<img src="'+esc(u(q.shot))+'" alt="">':'<div class="none">no picture kept</div>')+'</div><div class="ics"><span class="chip">'+ic('clock',12)+(q.klmSeconds!=null?q.klmSeconds+' s':'–')+'</span>'+(q.findings?'<span class="chip">'+ic('alert',12)+q.findings+'</span>':'')+delta(s,v.name)+'</div>';world.appendChild(f);});
    if(any)y+=ROW+18;else world.removeChild(wl);});});
  y+=30;});
 svg.innerHTML=g;svg.setAttribute('width',maxX+60);svg.setAttribute('height',y);world.insertBefore(svg,world.firstChild);world.style.width=(maxX+60)+'px';world.style.height=y+'px';
 if(!M.journeys.length)world.appendChild(el('div','jh','No journey yet — write one under .uxcli/journeys/'));apply();}
function delta(s,name){if(!(cmp.from&&cmp.to&&name===cmp.to))return'';var a=s.versions.filter(function(z){return z.name===cmp.from;})[0],b=s.versions.filter(function(z){return z.name===name;})[0];if(!a||!a.present)return'<span class="chip">new step</span>';if(a.klmSeconds==null||b.klmSeconds==null)return'';var d=Math.round((b.klmSeconds-a.klmSeconds)*10)/10;return'<span class="chip" title="against '+esc(cmp.from)+'">'+(d>0?'+':'')+d+' s</span>';}
function find(id){var a=id.split('|');var j=M.journeys.filter(function(x){return x.id===a[1];})[0];if(!j)return null;var w=j.workflows.filter(function(x){return String(x.id)===a[2];})[0];var s=w&&w.steps.filter(function(x){return x.id===a[3];})[0];return s&&{j:j,w:w,s:s,end:a[4]==='end'};}
function select(id){sel=id;[].forEach.call(world.querySelectorAll('.frame.sel'),function(f){f.classList.remove('sel');});var f=world.querySelector('[data-id="'+(window.CSS&&CSS.escape?CSS.escape(id):id)+'"]');if(f)f.classList.add('sel');inspect();}
function inspect(){var x=sel&&find(sel);insp.hidden=false;insp.classList.toggle('on',!!x);
 if(!x){var c=M.counts;insp.innerHTML='<h3>'+esc(M.project.name)+'</h3><p class="muted" style="margin:0">Click a screen. Drag to move, ctrl+scroll or + − to zoom, F to fit.</p>'+
  '<div class="row"><span>'+ic('screens',14)+'screens walked</span><b>'+c.built+'</b></div><div class="row"><span>'+ic('drawn',14)+'drawn · picked</span><b>'+c.drawn+' · '+c.picked+'</b></div><div class="row"><span>'+ic('alert',14)+'findings on the walks</span><b>'+c.findings+'</b></div><div class="row"><span>'+ic('version',14)+'versions</span><b>'+c.versions+'</b></div>';return;}
 var s=x.s,state=x.end?s.after.state:s.before.state,d=DES[state]||{variants:[]},b=s.built,h='<div class="k">'+esc(hum(x.j.id))+' · '+(x.end?'end':'step '+s.n)+'</div><h3>'+esc(hum(state))+'</h3>';
 var scx={state:state,leave:x.end?null:s,prev:x.end?s:(x.w.steps[x.w.steps.indexOf(s)-1]||null),w:x.w};verdictsOn(scx,x.w).forEach(function(v){h+='<div class="row"><span>'+ic('alert',14)+esc(v.commitment||v.value)+'</span><b class="'+(v.value==='fail'?'fail':'')+'">'+esc(v.value)+'</b></div>'+(v.what?'<p class="muted" style="margin:0">'+esc(v.what)+(v.statement?' — '+esc(v.statement):'')+'</p>':'');});
 if(!x.end){h+='<div class="row"><span>'+ic('walked',14)+'next: '+esc(String(s.action||s.id))+'</span><b>'+(b.metrics?b.metrics.klmSeconds+' s':'–')+'</b></div>';}
 else h+='<div class="row"><span>'+ic('walked',14)+'reached</span><b class="'+(s.after.held===false?'fail':s.after.held?'ok':'')+'">'+(s.after.held===false?'no':s.after.held?'yes':'not measured')+'</b></div>';
 h+='<div class="row"><span>'+ic('picked',14)+'picked</span><b class="'+(d.pick?'ok':'')+'">'+esc(d.pick||(d.revise?'redraw asked':d.variants.length?'waiting':'not drawn'))+'</b></div>';
 if(d.variants.length)h+='<h4>Drawings</h4><div class="vs">'+d.variants.map(function(v){return '<figure><div class="th'+(v.name===d.pick?' p':'')+'">'+(v.shot?'<img src="'+esc(u(v.shot))+'" alt="'+esc(v.name)+'">':'')+'</div><figcaption>'+esc(v.name)+(v.name===d.pick?' · picked':'')+'</figcaption></figure>';}).join('')+'</div>';
 if(d.pick&&!x.end&&(b.verdicts||[]).some(function(v){return v.value==='fail';}))h+='<p class="muted" style="margin:0">The walk of the build fails here; compare it with the picked drawing.</p>';
 if(!x.end){h+='<section><h4>Built · the last walk</h4>'+(b.metrics?'<div class="row"><span>'+ic('clock',14)+'settled</span><b>'+(b.metrics.settleMs==null?'–':b.metrics.settleMs+' ms')+'</b></div><div class="row"><span>'+ic('down',14)+'scrolls</span><b>'+b.metrics.scrolls+'</b></div>':'<p class="muted" style="margin:6px 0 0">'+(b.measured?'walked, nothing measured':'not walked yet')+'</p>')+'</section>';
  if((b.findings||[]).length)h+='<section><h4>Findings</h4><ul>'+b.findings.map(function(f,i){return '<li>'+(f.rect?'<b>'+(i+1)+'.</b> ':'')+esc(f.what)+'<small>'+esc(f.source||'')+'</small></li>';}).join('')+'</ul></section>';
  if((s.walkthrough||[]).length)h+='<section><h4>Walkthrough</h4><ul>'+s.walkthrough.map(function(f){return '<li>'+esc(f.question)+': '+esc(f.answer)+'<small>'+esc(f.what.split(' — ').slice(1).join(' — '))+'</small></li>';}).join('')+'</ul></section>';
  if(b.shot)h+='<a class="btn" href="'+esc(u(b.shot))+'" target="_blank" rel="noopener">'+ic('external',13)+'Open the picture</a>';}
 if(D.serve&&d.variants.length&&!d.pick)h+='<section class="act"><h4>Decide</h4>'+d.variants.map(function(v){return '<button class="btn primary" data-pick="'+esc(v.name)+'">'+ic('picked',13)+'Choose '+esc(v.name)+'</button>';}).join('')+'<textarea id="rnote" aria-label="What should change" placeholder="Or say what should change, and ask for a redraw"></textarea><button class="btn" id="rbtn">'+ic('drawn',13)+'Ask for a redraw</button><p class="msg" id="amsg" role="status"></p></section>';
 if(D.serve&&!x.end)h+='<section class="act"><h4>Propose a change</h4><textarea id="nnote" aria-label="What should change on this step" placeholder="What should change for the person here"></textarea><button class="btn" id="nbtn">'+ic('note',13)+'Write a redesign proposal</button><p class="msg" id="amsg2" role="status"></p></section>';
 insp.innerHTML=h;
 [].forEach.call(insp.querySelectorAll('[data-pick]'),function(bt){bt.addEventListener('click',function(){post('/api/pick',{state:state,variant:bt.dataset.pick},'amsg');});});
 var nb=document.getElementById('nbtn');if(nb)nb.addEventListener('click',function(){post('/api/note',{journey:x.j.id,workflow:x.w.id,step:s.id,note:document.getElementById('nnote').value},'amsg2');});
 var rb=document.getElementById('rbtn');if(rb)rb.addEventListener('click',function(){post('/api/revise',{state:state,note:document.getElementById('rnote').value},'amsg');});}
function post(url,body,mid){var m=document.getElementById(mid);fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json();}).then(function(r){if(m){m.className='msg '+(r.ok?'ok':'err');m.textContent=r.ok?'Saved '+r.file+'. The agent reads it from there.':(r.problems||['could not save']).join('; ');}}).catch(function(e){if(m){m.className='msg err';m.textContent=String(e);}});}
function fit(){var r=stage.getBoundingClientRect(),W=parseFloat(world.style.width)||1,H=parseFloat(world.style.height)||1,left=r.width>900?350:20,right=r.width>900?330:20;view.k=Math.max(0.55,Math.min(1.1,(r.width-left-right)/W));view.x=left;view.y=80;apply();}
function zoom(f,cx,cy){var r=stage.getBoundingClientRect();cx=cx==null?r.width/2:cx;cy=cy==null?r.height/2:cy;var k=Math.max(0.1,Math.min(3,view.k*f));view.x=cx-(cx-view.x)*k/view.k;view.y=cy-(cy-view.y)*k/view.k;view.k=k;apply();}
function goTo(id){showView('journeys');var f=null;if(id.indexOf('|')<0)f=world.querySelector('[data-state="'+(window.CSS&&CSS.escape?CSS.escape(id):id)+'"]');else if(id.indexOf('journey|')===0)f=world.querySelector('[data-go="'+(window.CSS&&CSS.escape?CSS.escape(id):id)+'"]');else f=world.querySelector('[data-id="'+(window.CSS&&CSS.escape?CSS.escape(id):id)+'"]');if(!f)return;var r=stage.getBoundingClientRect();view.k=Math.max(view.k,0.8);view.x=r.width/2-(parseFloat(f.style.left)+FW/2)*view.k;view.y=110-parseFloat(f.style.top)*view.k;apply();if(f.dataset.id)select(f.dataset.id);}
var drag=null;stage.addEventListener('pointerdown',function(e){if(e.target.closest('.frame'))return;drag={x:e.clientX,y:e.clientY,vx:view.x,vy:view.y};stage.classList.add('drag');stage.setPointerCapture(e.pointerId);});
stage.addEventListener('pointermove',function(e){if(!drag)return;view.x=drag.vx+e.clientX-drag.x;view.y=drag.vy+e.clientY-drag.y;apply();});
stage.addEventListener('pointerup',function(){drag=null;stage.classList.remove('drag');});
stage.addEventListener('wheel',function(e){e.preventDefault();var r=stage.getBoundingClientRect();if(e.ctrlKey||e.metaKey)zoom(Math.exp(-e.deltaY*0.01),e.clientX-r.left,e.clientY-r.top);else{view.x-=e.deltaX;view.y-=e.deltaY;apply();}},{passive:false});
document.addEventListener('keydown',function(e){if(e.target.closest&&e.target.closest('textarea,input,select'))return;if(document.getElementById('journeys').hidden)return;if(e.key==='+'||e.key==='=')zoom(1.2);else if(e.key==='-')zoom(1/1.2);else if(e.key==='0'||e.key==='f'||e.key==='F')fit();});
document.getElementById('zin').onclick=function(){zoom(1.2);};document.getElementById('zout').onclick=function(){zoom(1/1.2);};document.getElementById('zfit').onclick=fit;
[].forEach.call(document.querySelectorAll('[data-layer]'),function(b){b.setAttribute('aria-pressed',b.dataset.layer===layer);b.onclick=function(){layer=b.dataset.layer;[].forEach.call(document.querySelectorAll('[data-layer]'),function(x){x.setAttribute('aria-pressed',x===b);});document.getElementById('cmp').hidden=layer!=='versions';save();render();};});
(function(){var names=[];M.journeys.forEach(function(j){j.versions.forEach(function(v){if(names.indexOf(v.name)<0)names.push(v.name);});});var a=document.getElementById('cmp-from'),b=document.getElementById('cmp-to');
 if(!names.length){var vb=document.querySelector('[data-layer=versions]');if(vb)vb.hidden=true;}
 [a,b].forEach(function(sl){names.forEach(function(n){var o=document.createElement('option');o.value=n;o.textContent=n;sl.appendChild(o);});sl.onchange=function(){cmp={from:a.value,to:b.value};render();};});document.getElementById('cmp').hidden=layer!=='versions';})();
[].forEach.call(document.querySelectorAll('[data-go]'),function(b){if(b.closest('#world'))return;b.addEventListener('click',function(){goTo(b.dataset.go);});});
function showView(v){[].forEach.call(document.querySelectorAll('.view'),function(s){s.hidden=s.id!==v;});[].forEach.call(document.querySelectorAll('.tabs a'),function(a){if(a.getAttribute('href')==='#'+v)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});var on=v==='journeys';['fix','insp','sheet','zoomer','layers'].forEach(function(id){var e=document.getElementById(id);if(e)e.style.display=on?'':'none';});if(location.hash!=='#'+v)history.replaceState(null,'','#'+v);}
[].forEach.call(document.querySelectorAll('.tabs a'),function(a){a.addEventListener('click',function(e){e.preventDefault();showView(a.getAttribute('href').slice(1));});});
var first=!(function(){try{return localStorage.getItem(KEY);}catch(e){return null;}})();render();inspect();if(first)fit();
showView((location.hash||'#journeys').slice(1).replace(/[^a-z]/g,'')||'journeys');
if(D.live&&window.EventSource){var es=new EventSource('/events');var live=document.getElementById('live');es.onopen=function(){live.textContent='live';};es.onmessage=function(){fetch('data.json',{cache:'no-store'}).then(function(r){return r.json();}).then(function(d){D=d;M=d.model;DES={};(D.design||[]).forEach(function(x){DES[x.state]=x;});render();inspect();live.textContent='live · '+new Date().toLocaleTimeString();});};es.onerror=function(){live.textContent='disconnected';};}
})();`;

const shotUrl = (asset, p) => p == null ? null : asset + String(p).replace(/^\.\.\//, '');
const device = (src, cls = '', alt = '', extra = '') => `<div class="device ${cls}">${src ? `<img src="${esc(src)}" alt="${esc(alt)}">` : `<div class="none">${esc(alt || 'no picture')}</div>`}${extra}</div>`;

function screensView(data, asset) {
  // every screen once: its newest picture, the drawings, and how it stands
  const pic = {}; const hl = {};
  for (const j of data.model.journeys) for (const w of j.workflows) w.steps.forEach((s, i) => {
    if (s.built.shot && !pic[s.before.state]) pic[s.before.state] = s.built.shot;
    if (i === w.steps.length - 1 && s.built.after && !pic[s.after.state]) pic[s.after.state] = s.built.after;
    for (const v of s.built.verdicts || []) { const at = verdictState(v, s); if (v.value === 'fail') hl[at] = 'fail'; else if (hl[at] !== 'fail') hl[at] = 'find'; }
    if (s.after.held === false) hl[s.after.state] = 'fail';
    if ((s.built.findings || []).length && hl[s.before.state] !== 'fail') hl[s.before.state] = 'find';
  });
  const cards = data.design.map(d => {
    const v = d.variants.find(x => x.name === d.pick) || d.variants[0]; const src = pic[d.state] ? shotUrl(asset, pic[d.state]) : v?.shot ? asset + v.shot : null;
    const state = hl[d.state] || '';
    const s = (on, n, t) => `<span class="s ${on}" title="${t}">${icon(n, 13, t)}</span>`;
    return `<article class="card float"><button class="open" data-go="${esc(d.state)}" aria-label="Show ${esc(human(d.state))} on the canvas">${device(src, state, src ? '' : 'not walked or drawn yet')}</button>
<h3>${esc(human(d.state))}${state ? ` ${icon('alert', 14, 'needs a fix')}` : ''}</h3><div class="ics">${s(d.variants.length ? 'y' : '', 'drawn', d.variants.length ? `${d.variants.length} drawn` : 'not drawn')}${s(d.pick ? 'y' : d.variants.length ? 'w' : '', 'picked', d.pick ? `picked ${d.pick}` : d.variants.length ? 'waiting for a pick' : 'no pick')}${s(state === 'fail' ? 'n' : state === 'find' ? 'w' : pic[d.state] ? 'y' : '', state ? 'alert' : 'walked', state === 'fail' ? 'fails' : state === 'find' ? 'finding' : pic[d.state] ? 'walked' : 'not walked')}</div></article>`;
  }).join('');
  return `<h1 class="v">Screens</h1><p class="lede">Every screen the journeys pass through, with its newest picture. A red frame needs a fix; open one to see it on the canvas.</p><div class="cards">${cards || '<p class="muted">No screen named by a journey yet.</p>'}</div>`;
}

function runsView(data, asset) {
  const rows = data.runs.map(r => {
    const first = r.steps.find(s => s.before || s.after); const src = first ? asset + (first.before || first.after) : null;
    return `<details class="run float" style="padding:10px 12px;margin-bottom:10px"><summary><div class="mini">${src ? `<img src="${esc(src)}" alt="">` : ''}</div>
<div><b>${esc(r.kind === 'journey' ? human(r.target) : r.target)}</b><div class="muted">${icon(r.viewport && parseInt(r.viewport) < 700 ? 'phone' : 'desktop', 12)} ${esc(r.viewport || '1280×800')} · ${esc(String(r.when || '').slice(0, 16).replace('T', ' '))}${r.klm != null ? ` · ${icon('clock', 12)} ${r.klm} s` : ''}</div></div>
<span class="res ${esc(r.worst)}">${icon(r.worst === 'pass' ? 'picked' : r.worst === 'blocked' ? 'minus' : 'alert', 12)}${esc(r.worst)}</span></summary>
${r.blocked ? `<p class="muted">Blocked: ${esc(r.blocked)}</p>` : ''}
${r.verdicts.length ? `<ul>${r.verdicts.map(v => `<li><span class="res ${v.value === 'fail' ? 'fail' : 'finding'}">${esc(v.value)}</span> ${esc(v.commitment || '')} ${esc(v.what)}</li>`).join('')}</ul>` : ''}
${r.probes.length ? `<ul>${r.probes.map(p => `<li><span class="res ${p.verdict === 'fail' ? 'fail' : p.verdict === 'finding' ? 'finding' : p.verdict === 'pass' ? 'pass' : 'blocked'}">${esc(p.verdict)}</span> ${esc(String(p.probe || '').replace(/^page\./, ''))} — ${esc(p.why)}</li>`).join('')}</ul>` : ''}
${r.steps.length ? `<div class="steps">${r.steps.map(s => `<figure>${device(s.before ? asset + s.before : null, s.held === false ? 'fail' : s.findings.length ? 'find' : '', s.before ? '' : 'no picture kept')}<figcaption><b>${esc(human(s.state))}</b><br>${esc(s.action)}${s.klm != null ? ` · ${s.klm} s` : ''}${s.findings.map(f => `<br><span class="res finding">${icon('alert', 11)}${esc(short(f))}</span>`).join('')}</figcaption></figure>`).join('')}</div>` : ''}</details>`;
  }).join('');
  return `<h1 class="v">Runs</h1><p class="lede">Every time Chrome walked a journey or checked a page, newest first. Open one for its steps as the browser saw them.</p>${rows || '<p class="muted">No run yet: uxcli run &lt;url&gt;, or uxcli run .uxcli/journeys/&lt;id&gt;.json</p>'}`;
}

function peopleView(data) {
  const u = data.understanding; const conf = { hypothesis: 0, low: 1, medium: 2, high: 3 };
  const meter = c => `<span class="meter" role="img" aria-label="confidence ${esc(c)}">${[1, 2, 3].map(i => `<i class="${(conf[c] ?? 0) >= i ? 'on' : ''}"></i>`).join('')}</span>`;
  return `<h1 class="v">People</h1><p class="lede">Who the product is for, what is known about them and how sure, and what is still a question.</p>
<div class="wide">${u.actors.map(a => `<article class="float card person"><div class="avatar">${icon('person', 22)}</div><div><h3>${esc(human(a.actor))}</h3>${(a.roles || []).length ? `<p class="muted" style="margin:0">${esc(a.roles.join(' · '))}</p>` : ''}
${(a.jobs || []).slice(0, 3).map(x => `<p style="margin:6px 0 0">${icon('picked', 12)} ${esc(x)}</p>`).join('')}${(a.pains || []).slice(0, 2).map(x => `<p style="margin:6px 0 0">${icon('alert', 12)} ${esc(x)}</p>`).join('')}
${(a.unknowns || []).map(x => `<div class="q">${icon('question', 14)}<span>${esc(x)}</span></div>`).join('')}</div></article>`).join('') || '<p class="muted">No one written yet: uxcli template apply &lt;kind&gt;.</p>'}</div>
<h2 style="font-size:15px;margin:24px 0 10px">What is known</h2><div class="wide">${u.insights.map(i => `<article class="float card"><h3>${meter(i.confidence)} ${esc(i.confidence)}</h3><p style="margin:0">${esc(i.claim)}</p><p class="muted" style="margin:0">${esc(i.source ? `${i.source.type} · ${i.source.ref}` : '')}${i.lastCheck ? ` · checked ${esc(String(i.lastCheck.at).slice(0, 10))}${i.lastCheck.fired ? ', and it changed' : ''}` : ''}</p></article>`).join('') || '<p class="muted">Nothing known yet.</p>'}</div>`;
}

function libraryView(data) {
  const L = data.model.library;
  return `<h1 class="v">Library</h1><p class="lede">What the agent reads before it draws: named designers' rules by kind of screen, and where to start for a kind of product.</p>
<div class="wide">${L.lenses.map(l => `<article class="float card"><h3>${icon('eye', 16)} ${esc(l.name)}</h3><p style="margin:0">${esc(l.when)}</p><p class="muted" style="margin:0">${l.count} rules · <code>uxcli lens show ${esc(l.id)}</code></p></article>`).join('')}</div>
<h2 style="font-size:15px;margin:24px 0 10px">Templates</h2><div class="wide">${L.templates.map(t => `<article class="float card"><h3>${icon('screens', 16)} ${esc(t.name)}</h3><p style="margin:0">${esc(t.when)}</p><p class="muted" style="margin:0">${t.screens.length} screens · <code>uxcli template show ${esc(t.id)}</code></p></article>`).join('')}</div>`;
}

// data: { model, design, runs, understanding } (src/dashboard.js gather). opts: asset — prefix for paths
// under .uxcli/; serve — the studio's decisions; live — refresh on change; folders/current — the switch.
export function appPage(data, { asset = '../', serve = false, live = false, folders = null, current = 0, notice = null } = {}) {
  const m = data.model; const T = todos(m, data.design);
  const top = T[0]; const topShot = top && (() => { const x = top.go.split('|'); const j = m.journeys.find(q => q.id === x[1]); const s = j?.workflows.find(w => String(w.id) === x[2])?.steps.find(q => q.id === x[3]); const p = x[4] === 'end' ? s?.built.after : s?.built.shot; return p ? shotUrl(asset, p) : null; })();
  const embed = JSON.stringify({ model: m, design: data.design, asset, serve, live, icons: ICONS }).replace(/</g, '\\u003c');
  const folder = folders ? `<label class="float box"><span class="ic-wrap">${icon('folder', 15)}</span><select aria-label="Folder" data-uxcli="folder-switch" onchange="location.search='?p='+this.value" style="border:0;background:none;font-weight:600">${folders.map((f, i) => `<option value="${i}"${i === current ? ' selected' : ''}>${esc(f)}</option>`).join('')}</select></label>` : `<span class="float box">${icon('folder', 15)} ${esc(m.project.name)}</span>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(m.project.name)} · uxcli</title><style>${CSS}</style></head><body>
<header class="top bar"><span class="float box logo"><i></i>uxcli</span>${folder}<nav class="float tabs" aria-label="Views">${VIEWS.map(v => `<a href="#${v.id}">${icon(v.icon, 14)}<span>${v.label}</span></a>`).join('')}</nav><span class="sp"></span>
<div class="float layers" id="layers" role="group" aria-label="Show on the canvas"><button data-layer="built">${icon('walked', 13)}Built</button><button data-layer="design">${icon('drawn', 13)}Drawn</button><button data-layer="versions">${icon('version', 13)}Versions</button><span id="cmp" hidden><select id="cmp-from" aria-label="From version"><option value="">from</option></select> → <select id="cmp-to" aria-label="To version"><option value="">to</option></select></span></div>
<span class="float box">${icon(parseInt(m.viewport) < 700 ? 'phone' : 'desktop', 15)} ${esc(m.viewport)}${live ? ' · <span class="live" id="live">connecting</span>' : ''}</span></header>
${notice ? `<p class="float box" role="status" style="position:fixed;top:66px;left:50%;transform:translateX(-50%);z-index:6">${esc(notice)}</p>` : ''}
<section class="view" id="journeys" aria-label="Journeys"><div class="stage" id="stage"><div class="world" id="world"></div></div></section>
${top ? `<section class="fix float" id="fix" aria-label="Fix first"><div class="c">${topShot ? `<img src="${esc(topShot)}" alt="">` : ''}${top.kind === 'fail' ? '<span></span>' : ''}</div><div><div class="k ${top.kind === 'fail' ? 'fail' : ''}">${icon(top.kind === 'fail' || top.kind === 'find' ? 'alert' : top.kind === 'open' ? 'picked' : 'drawn', 12)} ${top.kind === 'fail' ? 'Fix first' : top.kind === 'find' ? 'Look at first' : top.kind === 'open' ? 'Waiting for you' : 'Next'}</div><b>${esc(top.text)}</b><button class="btn primary" data-go="${esc(top.go)}">${icon('eye', 13)} Show on canvas</button></div></section>` : ''}
<aside class="insp float" id="insp" aria-live="polite" aria-label="Inspector"></aside>
${T.length ? `<nav class="sheet float" id="sheet" aria-label="To do">${T.slice(0, 4).map((t, i) => `<button class="todo" data-go="${esc(t.go)}" title="${esc(t.why || t.text)}"><span class="n ${t.kind}">${i + 1}</span><span class="tt">${esc(t.text)}</span></button>`).join('')}${T.length > 4 ? `<span class="muted" style="align-self:center;padding:0 6px;white-space:nowrap">+${T.length - 4} more</span>` : ''}</nav>` : ''}
<div class="zoom float" id="zoomer" role="group" aria-label="Zoom"><button id="zout" aria-label="Zoom out">${icon('minus', 16)}</button><output id="zv">100%</output><button id="zin" aria-label="Zoom in">${icon('plus', 16)}</button><button id="zfit" aria-label="Fit">${icon('fit', 16)}</button></div>
<section class="view" id="screens" hidden>${screensView(data, asset)}</section>
<section class="view" id="runs" hidden>${runsView(data, asset)}</section>
<section class="view" id="people" hidden>${peopleView(data)}</section>
<section class="view" id="library" hidden>${libraryView(data)}</section>
<script type="application/json" id="studio-data">${embed}</script><script>${JS}</script></body></html>`;
}

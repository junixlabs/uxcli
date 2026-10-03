// The studio page: the board as a canvas a person pans and zooms, the way a design file is read. The
// model is inlined, so the page works from disk; served (`uxcli studio --serve`), it refetches the model
// when a file under .uxcli/ changes and offers the two things a person decides here — choose a drawing,
// or ask for a redraw — which the server writes as pick.json or revise.json. Pure: a model in, HTML out.

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const CSS = `
:root{color-scheme:light;--bg:#eceef2;--canvas:#e6e9ee;--dot:#cdd2da;--surface:#ffffff;--well:#f3f5f8;--ink:#14171c;--dim:#545b66;--line:#d6dbe2;
--accent:#1d4ed8;--accent-soft:#e3ebfd;--find:#8a4b00;--find-soft:#fff1dc;--pin:#c2410c;--ok:#0f6b34;--ok-soft:#dcf3e5;--fail:#b3261e;--fail-soft:#fbe6e4;
--sans:-apple-system,"Segoe UI",Inter,Helvetica,Arial,sans-serif;--mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace}
@media (prefers-color-scheme:dark){:root{color-scheme:dark;--bg:#0f1216;--canvas:#13171c;--dot:#262c35;--surface:#1a1f26;--well:#20262e;--ink:#e8ebf0;--dim:#a3abb7;--line:#2c333d;
--accent:#8fb2ff;--accent-soft:#1c2a47;--find:#f2c071;--find-soft:#3a2a10;--pin:#fb923c;--ok:#7fe0a3;--ok-soft:#173a26;--fail:#ff8a7a;--fail-soft:#46211c}}
*{box-sizing:border-box}html,body{height:100%;margin:0}body{background:var(--bg);color:var(--ink);font:14px/1.45 var(--sans);display:grid;grid-template-rows:auto 1fr;overflow:hidden}
button,select,textarea{font:inherit;color:inherit}button{cursor:pointer}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.top{display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px;padding:8px 14px;background:var(--surface);border-bottom:1px solid var(--line)}
.brand{font-weight:700}.brand small{font-weight:400;color:var(--dim);margin-left:6px}
.tabs,.zoom,.layers{display:flex;gap:4px;align-items:center}
.tabs button,.zoom button,.layers label{border:1px solid var(--line);background:var(--surface);border-radius:6px;padding:4px 10px}
.tabs button[aria-pressed=true]{background:var(--accent-soft);border-color:var(--accent);color:var(--ink)}
.layers label{display:flex;gap:6px;align-items:center;cursor:pointer}.zoom output{min-width:48px;text-align:center;font-variant-numeric:tabular-nums}
.counts{color:var(--dim);margin-left:auto}.live{color:var(--ok);font-weight:600}
.main{display:grid;grid-template-columns:240px 1fr 340px;min-height:0}
.outline,.insp{background:var(--surface);overflow:auto;min-height:0}.outline{border-right:1px solid var(--line);padding:10px 0}.insp{border-left:1px solid var(--line);padding:14px 16px;display:grid;gap:12px;align-content:start}
.outline h2{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--dim);margin:12px 14px 6px}
.outline button{display:block;width:100%;text-align:left;border:0;background:none;padding:4px 14px;border-radius:0}.outline button:hover{background:var(--well)}
.outline .wf{color:var(--dim);font-size:12px;padding-left:22px}.outline .st{padding-left:30px}.outline .st b{font-variant-numeric:tabular-nums;color:var(--dim);font-weight:600;margin-right:6px}
.dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-left:6px;vertical-align:middle}.dot.find{background:var(--pin)}.dot.open{background:var(--accent)}
.stage{position:relative;overflow:hidden;background-color:var(--canvas);background-image:radial-gradient(var(--dot) 1px,transparent 1px);background-size:22px 22px;cursor:grab;touch-action:none}
.stage.drag{cursor:grabbing}.world{position:absolute;left:0;top:0;transform-origin:0 0}
.wires{position:absolute;left:0;top:0;overflow:visible;pointer-events:none}.wires path{fill:none;stroke:var(--dim);stroke-width:1.5}
.band{position:absolute;font-weight:700;font-size:20px}.band small{display:block;font-weight:400;font-size:13px;color:var(--dim);max-width:900px}
.lane{position:absolute;font:600 12px var(--mono);color:var(--dim)}.rowlabel{position:absolute;font:600 12px var(--sans);color:var(--dim);text-transform:uppercase;letter-spacing:.06em;width:120px;text-align:right}
.frame{position:absolute;background:var(--surface);border:1px solid var(--line);border-radius:8px;box-shadow:0 1px 2px rgba(0,0,0,.08);cursor:pointer}
.frame:hover{border-color:var(--dim)}.frame.sel{outline:3px solid var(--accent);outline-offset:2px}
.frame.find{border-color:var(--pin)}.frame.picked{border-color:var(--ok)}.frame.ghost{background:var(--well);border-style:dashed}
.fh{display:flex;gap:6px;align-items:center;padding:6px 8px;border-bottom:1px solid var(--line);font-size:12px;min-height:30px}
.fh .t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}.fh .n{font:600 11px var(--mono);color:var(--dim)}
.chip{font:600 11px var(--sans);padding:1px 6px;border-radius:999px;background:var(--well);color:var(--dim);white-space:nowrap}
.chip.ok{background:var(--ok-soft);color:var(--ok)}.chip.find{background:var(--find-soft);color:var(--find)}.chip.fail{background:var(--fail-soft);color:var(--fail)}.chip.acc{background:var(--accent-soft);color:var(--ink)}
.vtabs{display:flex;gap:2px}.vtabs button{border:1px solid var(--line);background:var(--surface);border-radius:4px;padding:0 6px;font:600 11px var(--mono)}.vtabs button[aria-pressed=true]{background:var(--accent-soft);border-color:var(--accent)}
.fi{position:relative;overflow:hidden;border-radius:0 0 8px 8px;background:var(--well)}.fi img{display:block;width:100%;height:100%;object-fit:cover;object-position:top}
.fi .none{position:absolute;inset:0;display:grid;place-items:center;color:var(--dim);font-size:12px;text-align:center;padding:12px}
.pin{position:absolute;border:2px solid var(--pin);border-radius:4px}.pin b{position:absolute;top:-10px;left:-10px;width:20px;height:20px;border-radius:50%;background:var(--pin);color:#fff;font:700 11px/20px var(--sans);text-align:center}
.pin.below{border-style:dashed;background:rgba(194,65,12,.14)}
.insp h3{margin:0;font-size:16px}.insp .sub{color:var(--dim);margin:0}.insp section{display:grid;gap:6px}.insp h4{margin:0;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--dim)}
.insp ul{margin:0;padding-left:18px;display:grid;gap:6px}.insp li small{display:block;color:var(--dim)}.insp code{font:12px var(--mono);overflow-wrap:anywhere}
.insp dl{display:grid;grid-template-columns:auto 1fr;gap:2px 10px;margin:0}.insp dt{color:var(--dim)}.insp dd{margin:0;font-variant-numeric:tabular-nums}
.act{display:grid;gap:6px}.act button{border:1px solid var(--accent);background:var(--accent);color:#fff;border-radius:6px;padding:6px 10px;font-weight:600}.act button.sec{background:var(--surface);color:var(--ink);border-color:var(--line)}
.act textarea{width:100%;min-height:70px;border:1px solid var(--line);border-radius:6px;padding:6px;background:var(--surface)}.msg{font-size:13px}.msg.err{color:var(--fail)}.msg.ok{color:var(--ok)}
.page{overflow:auto;padding:20px 24px;display:none;min-height:0}.page.on{display:block}.page h2{margin:0 0 4px}.page .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;margin-top:14px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:14px;display:grid;gap:8px;align-content:start}.card h3{margin:0;font-size:15px}.card p{margin:0}.card ul{margin:0;padding-left:18px}
.q{color:var(--ink)}.muted{color:var(--dim)}
@media (max-width:900px){.main{grid-template-columns:1fr}.outline{display:none}.insp{position:fixed;right:0;bottom:0;left:0;max-height:45vh;border-left:0;border-top:1px solid var(--line)}}
`;

const JS = `(function(){
var M=JSON.parse(document.getElementById('studio-data').textContent);
var FW=M.frame.w,FH=M.frame.h,HEAD=30,COL=FW+90,ROWH=FH+HEAD+46,GUT=150;
var stage=document.getElementById('stage'),world=document.getElementById('world'),insp=document.getElementById('insp');
var view={x:40,y:40,k:0.8},sel=null,show={design:true,built:true,versions:true,findings:true},vtab={};
var KEY='uxcli-studio:'+(M.project.id||M.project.name);
try{var s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.view)view=s.view;if(s&&s.show)show=s.show;}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify({view:view,show:show}));}catch(e){}}
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function apply(){world.style.transform='translate('+view.x+'px,'+view.y+'px) scale('+view.k+')';document.getElementById('zv').value=Math.round(view.k*100)+'%';save();}
function frameImg(shot,pins){var fi=el('div','fi');fi.style.height=FH+'px';if(shot){var im=el('img');im.src=shot;im.alt='';im.loading='lazy';fi.appendChild(im);}else fi.appendChild(el('div','none','no picture yet'));
 if(shot&&pins&&show.findings)pins.forEach(function(f,i){if(!f.rect)return;var r=f.rect,vw=(r.viewport&&r.viewport.w)||parseInt(M.viewport),k=FW/vw,p=el('span','pin','<b>'+(i+1)+'</b>');var y=r.y*k;
  if(y+8>FH){p.classList.add('below');p.style.top=(FH-26)+'px';p.style.height='22px';p.title='below the fold';}else{p.style.top=y+'px';p.style.height=Math.min(r.h*k,FH-y)+'px';}p.style.left=(r.x*k)+'px';p.style.width=Math.max(8,r.w*k)+'px';fi.appendChild(p);});
 return fi;}
function frame(x,y,kind,s,j,w,extra){var f=el('div','frame');f.style.left=x+'px';f.style.top=y+'px';f.style.width=FW+'px';f.tabIndex=0;f.setAttribute('role','button');
 var id=kind+'|'+j.id+'|'+w.id+'|'+s.id+(extra?'|'+extra:'');f.dataset.id=id;if(sel===id)f.classList.add('sel');
 f.addEventListener('click',function(e){e.stopPropagation();select(id);});f.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();select(id);}});return f;}
function render(){world.innerHTML='';var wires=document.createElementNS('http://www.w3.org/2000/svg','svg');wires.setAttribute('class','wires');var d='';
 var y=0,maxX=0;
 M.journeys.forEach(function(j){var b=el('div','band',esc(j.id)+'<small>'+esc(j.goal||'')+(j.actor?' · '+esc(j.actor):'')+(j.run?' · last walk: '+esc(j.run.verdict):' · not walked yet')+'</small>');b.style.left='0px';b.style.top=y+'px';world.appendChild(b);y+=74;
  // one set of rows per journey; its workflows sit side by side, as alternatives do
  var rows=[];if(show.design)rows.push('design');if(show.built)rows.push('built');
  if(show.versions)j.versions.forEach(function(v){if(j.workflows.some(function(w){return w.steps.some(function(s){return s.versions.some(function(q){return q.name===v.name&&q.present;});});}))rows.push('v:'+v.name);});
  rows.forEach(function(row,ri){var lab=el('div','rowlabel',row==='design'?'Design':row==='built'?'Built':esc(row.slice(2)));lab.style.left='0px';lab.style.top=(y+26+ri*ROWH+HEAD+FH/2-8)+'px';world.appendChild(lab);});
  var x0=GUT;
  j.workflows.forEach(function(w){var l=el('div','lane',esc(w.id||'workflow')+(w.totals?'  ·  '+w.totals.steps+' step'+(w.totals.steps===1?'':'s')+' · about '+w.totals.klmSeconds+' s':''));l.style.left=x0+'px';l.style.top=y+'px';world.appendChild(l);
   rows.forEach(function(row,ri){var ry=y+26+ri*ROWH;
    w.steps.forEach(function(s,i){var x=x0+i*COL;maxX=Math.max(maxX,x+FW);var f;
     if(row==='design'){var dz=s.design,vs=dz.variants;var cur=vtab[j.id+s.id]||(dz.pick&&dz.pick.pick)||(vs[0]&&vs[0].name);var cv=vs.filter(function(v){return v.name===cur;})[0]||vs[0];
      f=frame(x,ry,'design',s,j,w);if(dz.pick)f.classList.add('picked');if(!vs.length)f.classList.add('ghost');
      var h=el('div','fh','<span class="n">'+s.n+'</span><span class="t" title="'+esc(dz.state)+'">'+esc(dz.state)+'</span>');
      if(vs.length>1){var tabs=el('div','vtabs');vs.forEach(function(v,k){var bt=el('button','',String.fromCharCode(65+k));bt.title=v.name;bt.setAttribute('aria-pressed',v===cv);bt.addEventListener('click',function(e){e.stopPropagation();vtab[j.id+s.id]=v.name;var id=f.dataset.id;render();select(id);});tabs.appendChild(bt);});h.appendChild(tabs);}
      h.appendChild(el('span','chip '+(dz.pick?'ok':vs.length?'acc':''),dz.pick?'picked':dz.revise&&!dz.revise.answered?'redraw asked':vs.length?'open':'not drawn'));
      f.appendChild(h);f.appendChild(frameImg(cv&&cv.shot,null));}
     else if(row==='built'){var bl=s.built;f=frame(x,ry,'built',s,j,w);if(bl.findings.length||bl.verdicts.length)f.classList.add('find');if(!bl.shot)f.classList.add('ghost');
      var tag=bl.verdicts.some(function(v){return v.value==='fail';})?'<span class="chip fail">fail</span>':bl.findings.length?'<span class="chip find">'+bl.findings.length+' finding'+(bl.findings.length>1?'s':'')+'</span>':bl.measured?'<span class="chip ok">walked</span>':'<span class="chip">not walked</span>';
      f.appendChild(el('div','fh','<span class="n">'+s.n+'</span><span class="t" title="'+esc(s.action)+'">'+esc(s.action||s.id)+'</span>'+(bl.metrics?'<span class="chip">'+bl.metrics.klmSeconds+' s</span>':'')+tag));
      f.appendChild(frameImg(bl.shot,bl.findings));}
     else{var vn=row.slice(2),v=s.versions.filter(function(q){return q.name===vn;})[0]||{};if(!v.present)return;f=frame(x,ry,'version',s,j,w,vn);if(!v.shot)f.classList.add('ghost');
      f.appendChild(el('div','fh','<span class="n">'+s.n+'</span><span class="t">'+esc(vn)+'</span>'+(v.klmSeconds!=null?'<span class="chip">'+v.klmSeconds+' s</span>':'')+(v.findings?'<span class="chip find">'+v.findings+'</span>':'')));
      f.appendChild(frameImg(v.shot,null));}
     world.appendChild(f);
     if(i<w.steps.length-1&&(row==='design'||row==='built')){var cy=ry+HEAD+FH/2,x1=x+FW+4,x2=x+COL-4;d+='M'+x1+' '+cy+' C'+(x1+30)+' '+cy+' '+(x2-30)+' '+cy+' '+x2+' '+cy+' M'+(x2-7)+' '+(cy-5)+' L'+x2+' '+cy+' L'+(x2-7)+' '+(cy+5);}
    });});
   x0+=Math.max(1,w.steps.length)*COL+50;});
  y+=26+rows.length*ROWH+50;});
 var p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',d);wires.appendChild(p);wires.setAttribute('width',maxX+40);wires.setAttribute('height',y);world.insertBefore(wires,world.firstChild);
 world.style.width=(maxX+40)+'px';world.style.height=y+'px';if(!M.journeys.length)world.appendChild(el('div','band','No journey yet<small>Write one under .uxcli/journeys/ — uxcli template show &lt;kind&gt; says where to start.</small>'));apply();}
function find(id){var a=id.split('|');var j=M.journeys.filter(function(x){return x.id===a[1];})[0];if(!j)return null;var w=j.workflows.filter(function(x){return String(x.id)===a[2];})[0];var s=w&&w.steps.filter(function(x){return x.id===a[3];})[0];return s&&{kind:a[0],j:j,w:w,s:s,extra:a[4]};}
function select(id){sel=id;[].forEach.call(world.querySelectorAll('.frame.sel'),function(f){f.classList.remove('sel');});var f=world.querySelector('[data-id="'+(window.CSS&&CSS.escape?CSS.escape(id):id)+'"]');if(f)f.classList.add('sel');inspect();}
function list(items,fn){return items.length?'<ul>'+items.map(fn).join('')+'</ul>':'<p class="muted">none</p>';}
function inspect(){var x=sel&&find(sel);if(!x){insp.innerHTML='<h3>'+esc(M.project.name)+'</h3><p class="sub">Click a frame to see what the files and the last walk say about it. Drag to pan, scroll or pinch to zoom, F to fit.</p>'+
 '<section><h4>Board</h4><dl><dt>Journeys</dt><dd>'+M.counts.journeys+'</dd><dt>Steps</dt><dd>'+M.counts.steps+'</dd><dt>Drawn</dt><dd>'+M.counts.drawn+'</dd><dt>Picked</dt><dd>'+M.counts.picked+'</dd><dt>Built</dt><dd>'+M.counts.built+'</dd><dt>Findings</dt><dd>'+M.counts.findings+'</dd><dt>Versions</dt><dd>'+M.counts.versions+'</dd></dl></section>';return;}
 var s=x.s,h='<p class="sub">'+esc(x.j.id)+' · '+esc(x.w.id||'workflow')+' · step '+s.n+'</p><h3>'+esc(s.action||s.id)+'</h3><p class="sub"><code>'+esc(s.before.state)+'</code> → <code>'+esc(s.after.state)+'</code>'+(s.after.held===false?' · <span class="chip fail">not reached</span>':s.after.held?' · <span class="chip ok">reached</span>':'')+'</p>';
 if(x.kind==='design'){var dz=s.design;h+='<section><h4>Design · '+esc(dz.state)+'</h4>'+(dz.question?'<p class="q">'+esc(dz.question)+'</p>':'')+list(dz.variants,function(v){return '<li><b>'+esc(v.name)+'</b>'+(dz.pick&&dz.pick.pick===v.name?' <span class="chip ok">picked</span>':dz.pick&&dz.pick.parts&&dz.pick.parts[v.name]?' <span class="chip acc">part taken</span>':'')+(v.about?'<small>'+esc(v.about)+'</small>':'')+(v.reviews&&v.reviews.length?'<small>review: '+v.reviews.map(function(r){return esc(r.lens)+' '+esc(r.line);}).join('; ')+'</small>':'')+'<small><code>.uxcli/mockups/'+esc(dz.state)+'/'+esc(v.name)+'.html</code></small></li>';})+'</section>';
  if(dz.pick)h+='<section><h4>Pick</h4><p>'+esc(dz.pick.pick)+' by '+esc(dz.pick.by&&dz.pick.by.ref)+(dz.pick.when?' · '+esc(dz.pick.when):'')+'</p>'+(dz.pick.note?'<p class="muted">'+esc(dz.pick.note)+'</p>':'')+'</section>';
  if(dz.revise)h+='<section><h4>Redraw asked</h4><p>'+esc(dz.revise.note)+'</p><p class="muted">'+(dz.revise.answered?'answered: the drawings changed since':'waiting for the agent to redraw')+'</p></section>';
  if(M.serve&&dz.variants.length&&!dz.pick){h+='<section class="act"><h4>Decide</h4>'+dz.variants.map(function(v){return '<button data-pick="'+esc(v.name)+'">Choose '+esc(v.name)+'</button>';}).join('')+'<textarea id="rnote" aria-label="What should change" placeholder="Or say what should change, and ask for a redraw"></textarea><button class="sec" id="rbtn">Ask for a redraw</button><p class="msg" id="amsg" role="status"></p></section>';}
  else if(!M.serve&&dz.variants.length&&!dz.pick)h+='<section><p class="muted">To choose here, open the board with <code>uxcli studio --serve</code>.</p></section>';}
 else if(x.kind==='built'){var b=s.built;h+='<section><h4>Built · the last walk</h4>'+(b.metrics?'<dl><dt>Estimate</dt><dd>'+b.metrics.klmSeconds+' s</dd><dt>Settled</dt><dd>'+(b.metrics.settleMs==null?'–':b.metrics.settleMs+' ms · '+esc(b.metrics.response))+'</dd><dt>Clicks</dt><dd>'+b.metrics.clicks+'</dd><dt>Typed</dt><dd>'+b.metrics.chars+' characters</dd><dt>Scrolls</dt><dd>'+b.metrics.scrolls+'</dd></dl>':'<p class="muted">'+(b.measured?'walked, no metrics':'not walked yet')+'</p>')+'</section>';
  h+='<section><h4>Findings</h4>'+list(b.findings,function(f,i){return '<li>'+(f.rect?'<b>'+(i+1)+'.</b> ':'')+'<span class="chip find">'+esc(f.metric)+'</span> '+esc(f.what)+'<small>'+esc(f.source)+'</small></li>';})+'</section>';
  if(b.verdicts.length)h+='<section><h4>Verdicts</h4>'+list(b.verdicts,function(v){return '<li><span class="chip '+(v.value==='fail'?'fail':'find')+'">'+esc(v.value)+'</span> '+esc(v.what)+(v.commitment?'<small>'+esc(v.commitment)+(v.statement?' — '+esc(v.statement):'')+'</small>':'')+'</li>';})+'</section>';}
 else{var v=s.versions.filter(function(q){return q.name===x.extra;})[0]||{};var meta=x.j.versions.filter(function(q){return q.name===x.extra;})[0]||{};h+='<section><h4>Version '+esc(x.extra)+'</h4><p>'+esc(meta.note||'')+'</p><dl><dt>Named</dt><dd>'+esc((meta.at||'').slice(0,16))+' · '+esc(meta.by&&meta.by.ref)+'</dd><dt>This step</dt><dd>'+(v.present?v.klmSeconds+' s · '+v.findings+' finding'+(v.findings===1?'':'s'):'not in this version')+'</dd><dt>Whole walk</dt><dd>'+(meta.klmSeconds!=null?meta.klmSeconds+' s · ':'')+(meta.findings||0)+' findings</dd></dl></section>';}
 insp.innerHTML=h;
 [].forEach.call(insp.querySelectorAll('[data-pick]'),function(b){b.addEventListener('click',function(){post('/api/pick',{state:s.design.state,variant:b.dataset.pick});});});
 var rb=document.getElementById('rbtn');if(rb)rb.addEventListener('click',function(){post('/api/revise',{state:s.design.state,note:document.getElementById('rnote').value});});}
function post(url,body){var m=document.getElementById('amsg');fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json();}).then(function(r){if(m){m.className='msg '+(r.ok?'ok':'err');m.textContent=r.ok?'Saved '+r.file+'. The agent reads it from there.':(r.problems||['could not save']).join('; ');}}).catch(function(e){if(m){m.className='msg err';m.textContent=String(e);}});}
function fit(){var r=stage.getBoundingClientRect(),W=parseFloat(world.style.width)||1,H=parseFloat(world.style.height)||1;view.k=Math.max(0.1,Math.min(1.5,Math.min((r.width-60)/W,(r.height-60)/H)));view.x=30;view.y=30;apply();}
function zoom(f,cx,cy){var r=stage.getBoundingClientRect();cx=cx==null?r.width/2:cx;cy=cy==null?r.height/2:cy;var k=Math.max(0.1,Math.min(3,view.k*f));view.x=cx-(cx-view.x)*k/view.k;view.y=cy-(cy-view.y)*k/view.k;view.k=k;apply();}
function goTo(id){var f=world.querySelector('[data-id="'+(window.CSS&&CSS.escape?CSS.escape(id):id)+'"]');if(!f)return;var r=stage.getBoundingClientRect();view.k=Math.max(view.k,0.9);view.x=r.width/2-(parseFloat(f.style.left)+FW/2)*view.k;view.y=r.height/3-parseFloat(f.style.top)*view.k;apply();select(id);}
var drag=null;stage.addEventListener('pointerdown',function(e){if(e.target.closest('.frame'))return;drag={x:e.clientX,y:e.clientY,vx:view.x,vy:view.y};stage.classList.add('drag');stage.setPointerCapture(e.pointerId);});
stage.addEventListener('pointermove',function(e){if(!drag)return;view.x=drag.vx+e.clientX-drag.x;view.y=drag.vy+e.clientY-drag.y;apply();});
stage.addEventListener('pointerup',function(){drag=null;stage.classList.remove('drag');});
stage.addEventListener('click',function(e){if(!e.target.closest('.frame')&&!drag){sel=null;[].forEach.call(world.querySelectorAll('.frame.sel'),function(f){f.classList.remove('sel');});inspect();}});
stage.addEventListener('wheel',function(e){e.preventDefault();var r=stage.getBoundingClientRect();if(e.ctrlKey||e.metaKey)zoom(Math.exp(-e.deltaY*0.01),e.clientX-r.left,e.clientY-r.top);else{view.x-=e.deltaX;view.y-=e.deltaY;apply();}},{passive:false});
document.addEventListener('keydown',function(e){if(e.target.closest&&e.target.closest('textarea,input,select'))return;if(e.key==='+'||e.key==='=')zoom(1.2);else if(e.key==='-')zoom(1/1.2);else if(e.key==='0'||e.key==='f'||e.key==='F')fit();else if(e.key==='ArrowLeft'){view.x+=60;apply();}else if(e.key==='ArrowRight'){view.x-=60;apply();}else if(e.key==='ArrowUp'){view.y+=60;apply();}else if(e.key==='ArrowDown'){view.y-=60;apply();}});
document.getElementById('zin').onclick=function(){zoom(1.2);};document.getElementById('zout').onclick=function(){zoom(1/1.2);};document.getElementById('zfit').onclick=fit;
['design','built','versions','findings'].forEach(function(k){var c=document.getElementById('show-'+k);c.checked=show[k];c.onchange=function(){show[k]=c.checked;save();render();};});
[].forEach.call(document.querySelectorAll('.tabs button'),function(b){b.onclick=function(){[].forEach.call(document.querySelectorAll('.tabs button'),function(x){x.setAttribute('aria-pressed',x===b);});var t=b.dataset.tab;document.getElementById('board').style.display=t==='canvas'?'':'none';[].forEach.call(document.querySelectorAll('.page'),function(p){p.classList.toggle('on',p.id==='page-'+t);});};});
[].forEach.call(document.querySelectorAll('[data-go]'),function(b){b.onclick=function(){goTo(b.dataset.go);};});
render();inspect();var first=!(function(){try{return localStorage.getItem(KEY);}catch(e){return null;}})();if(first)fit();
if(M.serve&&window.EventSource){var es=new EventSource('/events');var live=document.getElementById('live');es.onopen=function(){live.textContent='live';};es.onmessage=function(){fetch('data.json',{cache:'no-store'}).then(function(r){return r.json();}).then(function(d){M=d;render();inspect();live.textContent='live · updated '+new Date().toLocaleTimeString();});};es.onerror=function(){live.textContent='disconnected';};}
})();`;

function outline(m) {
  return m.journeys.map(j => `<h2>${esc(j.id)}</h2>` + j.workflows.map(w => `<div class="wf">${esc(w.id || 'workflow')}</div>` + w.steps.map(s => {
    const id = `built|${j.id}|${w.id}|${s.id}`; const dz = s.design;
    return `<button class="st" data-go="${esc(id)}"><b>${s.n}</b>${esc(s.after.state)}${s.built.findings.length || s.built.verdicts.length ? '<span class="dot find" title="findings on the walk"></span>' : ''}${dz.variants.length && !dz.pick ? '<span class="dot open" title="waiting for a pick"></span>' : ''}</button>`;
  }).join('')).join('')).join('') || '<h2>No journey yet</h2>';
}

function contextPage(m) {
  const c = m.context;
  const actors = c.actors.map(a => `<div class="card"><h3>${esc(a.actor)}</h3>${a.note ? `<p class="muted">${esc(a.note)}</p>` : ''}${a.jobs.length ? `<p><b>Jobs</b></p><ul>${a.jobs.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}${a.pains.length ? `<p><b>Pains</b></p><ul>${a.pains.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}<p><b>Still unknown</b></p><ul>${a.unknowns.map(x => `<li class="q">${esc(x)}</li>`).join('')}</ul></div>`).join('');
  const insights = c.insights.map(i => `<div class="card"><h3>${esc(i.id)} <span class="chip ${i.confidence === 'high' ? 'ok' : i.confidence === 'hypothesis' ? 'find' : ''}">${esc(i.confidence || '?')}</span></h3><p>${esc(i.claim)}</p>${i.source ? `<p class="muted">${esc(i.source)}</p>` : ''}${i.evidence.length ? `<ul>${i.evidence.map(e => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}</div>`).join('');
  return `<section class="page" id="page-context"><h2>Context</h2><p class="muted">Who the product is for and what is known about them, as the files under .uxcli/understanding/ say. Unknowns stay questions until a source answers them.</p><div class="grid">${actors || '<p class="muted">No actor yet — uxcli template apply &lt;kind&gt; writes the questions to start from.</p>'}${insights}</div></section>`;
}

function libraryPage(m) {
  const L = m.library;
  return `<section class="page" id="page-library"><h2>Library</h2><p class="muted">What an agent reads before it draws: lenses of named designers' viewpoints by kind of UI (uxcli lens show &lt;kind&gt;), and templates by kind of product (uxcli template show &lt;id&gt;).</p>
<div class="grid">${L.lenses.map(l => `<div class="card"><h3>${esc(l.name)} <span class="chip">${l.count} viewpoints</span></h3><p>${esc(l.when)}</p><p class="muted"><code>uxcli lens show ${esc(l.id)}</code></p></div>`).join('')}</div>
<div class="grid">${L.templates.map(t => `<div class="card"><h3>${esc(t.name)} <span class="chip acc">template</span></h3><p>${esc(t.when)}</p><ul>${t.screens.map(s => `<li>${esc(s.name)} <span class="muted">· ${esc(s.lens)}</span></li>`).join('')}</ul><p class="muted"><code>uxcli template show ${esc(t.id)}</code></p></div>`).join('')}</div></section>`;
}

export function studioPage(m) {
  const data = JSON.stringify(m).replace(/</g, '\\u003c');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(m.project.name)} · uxcli studio</title><style>${CSS}</style></head><body>
<header class="top"><span class="brand">uxcli studio<small>${esc(m.project.name)}</small></span>
<nav class="tabs" aria-label="Views"><button data-tab="canvas" aria-pressed="true">Canvas</button><button data-tab="context" aria-pressed="false">Context</button><button data-tab="library" aria-pressed="false">Library</button></nav>
<div class="layers" role="group" aria-label="Layers"><label><input type="checkbox" id="show-design">Design</label><label><input type="checkbox" id="show-built">Built</label><label><input type="checkbox" id="show-versions">Versions</label><label><input type="checkbox" id="show-findings">Findings</label></div>
<div class="zoom" role="group" aria-label="Zoom"><button id="zout" aria-label="Zoom out">−</button><output id="zv">100%</output><button id="zin" aria-label="Zoom in">+</button><button id="zfit">Fit</button></div>
<span class="counts">${m.counts.steps} steps · ${m.counts.picked}/${m.counts.drawn} picked · ${m.counts.findings} findings${m.serve ? ' · <span class="live" id="live">connecting</span>' : ''}</span></header>
<div class="main" id="board"><nav class="outline" aria-label="Journeys">${outline(m)}</nav><section class="stage" id="stage" aria-label="Canvas"><div class="world" id="world"></div></section><aside class="insp" id="insp" aria-live="polite"></aside></div>
${contextPage(m)}${libraryPage(m)}
<script type="application/json" id="studio-data">${data}</script><script>${JS}</script></body></html>`;
}

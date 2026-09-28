// The journey map: one page that puts, for every journey, what was declared (the states and the
// mockups a person picked), what the last run saw (the screenshots and whether each state held),
// the difference between the two, and what the commitments decided — step by step, with the
// understanding the journey traces to beside it. Pure: the model is built from parsed files and
// packets, and the page is a string with the model embedded; the browser does the switching.
//
// Nothing on the page is advice. Every sentence is the project's declaration, the actor's own words,
// an insight with its source, or what the browser measured. "Drift" means exactly one of two things:
// a state the run said did not hold, or a verdict of fail cited at that step.
import { esc } from './wireflow.js';

export const DRIFT_WORD = { fail: 'FAIL', finding: 'finding', pass: 'pass', 'not-committed': 'not committed', unmeasurable: 'unmeasurable', 'not-applicable': 'n/a' };

// runs: { [journeyId]: { run, base } } where base is the path from the page to the run directory.
// mockups: { [stateId]: { pick: variantName|null, variants: [name], shots: { [variant]: path-from-page } } }
export function mapModel({ project = {}, journeys = [], commitments = [], actors = [], insights = [], runs = {}, mockups = {}, level = null, version = '' }) {
  const byC = Object.fromEntries(commitments.map(c => [c.id, c]));
  const insightBy = Object.fromEntries(insights.map(i => [i.file || i.id, i]).concat(insights.map(i => [i.id, i])));
  const findings = [];
  const J = journeys.map(j => {
    const R = runs[j.id] || null; const run = R?.run || null; const base = R?.base || '';
    const stepsOf = (wf, stepId) => run?.steps?.find(s => s.workflow === wf && s.id === stepId) || null;
    const actor = actors.find(a => a.actor === j.actor) || null;
    const trace = (j.trace || []).map(t => insightBy[t] || insightBy[String(t).replace(/^understanding\/insights\//, '').replace(/\.json$/, '')] || { id: t, claim: null, missing: true });
    const shotOf = name => (run && name && run.evidence?.shots?.includes(name)) ? `${base}/artifacts/${name}` : null;
    const mock = state => { const m = mockups[state]; return m?.pick && m.shots?.[m.pick] ? { shot: m.shots[m.pick], variant: m.pick } : m?.variants?.length ? { shot: null, variant: null, variants: m.variants.length } : { shot: null, variant: null, variants: 0 }; };
    let n = 0;
    const workflows = (j.workflows || []).map(w => {
      const steps = (w.steps || []).filter(s => s.kind !== 'fixture' && s.before).map(s => {
        n++;
        const rs = stepsOf(w.id, s.id);
        const verdicts = (run?.verdicts || []).filter(v => (v.where === s.id && (!v.workflow || v.workflow === w.id)) || (v.step === s.id && v.workflow === w.id)).map(v => ({ ...v, statement: byC[v.commitment]?.statement || null, owner: byC[v.commitment]?.owner?.ref || null, source: byC[v.commitment]?.source?.doc || null }));
        const notHeld = rs ? rs.after?.held === false : false;
        const fails = verdicts.filter(v => v.value === 'fail');
        const drift = notHeld || fails.length > 0;
        const nav = (s.interactions || []).find(x => x.type === 'navigation');
        const scoped = commitments.filter(c => c.scope?.journey === j.id && (!c.scope.workflow || c.scope.workflow === w.id) && (!c.scope.step || c.scope.step === s.id)).map(c => ({ id: c.id, statement: c.statement, owner: c.owner?.ref || null, status: c.status || null, verdict: (run?.verdicts || []).find(v => v.commitment === c.id && (v.where === s.id || v.step === s.id))?.value || null }));
        const step = {
          n, id: s.id, workflow: w.id, kind: w.kind || null, action: s.action || '', url: nav?.to || null,
          before: { state: s.before, declared: j.states?.[s.before] || null, held: rs?.before?.held ?? null, strength: rs?.before?.strength || j.states?.[s.before]?.strength || null, signals: rs?.before?.signals || null, why: rs?.before?.why || [], shot: shotOf(rs?.shots?.[0]), mock: mock(s.before) },
          after: { state: s.after, declared: j.states?.[s.after] || null, held: rs?.after?.held ?? null, strength: rs?.after?.strength || j.states?.[s.after]?.strength || null, signals: rs?.after?.signals || null, why: rs?.after?.why || [], shot: shotOf(rs?.shots?.[1]), mock: mock(s.after) },
          declaredInteractions: s.interactions || [], expectations: s.expectations || [],
          observed: rs ? { interactions: rs.interactions || [], timing: rs.timing || null, produced: rs.produced || {} } : null,
          verdicts, commitments: scoped, drift, notHeld, measured: !!rs,
        };
        for (const v of fails) findings.push({ journey: j.id, workflow: w.id, step: s.id, n, value: v.value, commitment: v.commitment || null, what: v.what || '', shot: v.shot ? shotOf(v.shot) : null });
        if (notHeld) findings.push({ journey: j.id, workflow: w.id, step: s.id, n, value: 'state', commitment: null, what: `${s.after} did not hold: ${(rs.after.why || []).join('; ')}`, shot: step.after.shot });
        return step;
      });
      return { id: w.id, kind: w.kind || null, status: w.status || null, reason: w.reason || null, steps };
    });
    const loud = (run?.verdicts || []).filter(v => v.value === 'fail' || v.value === 'finding');
    return {
      id: j.id, goal: j.goal || '', actor: j.actor || null, actorFile: actor ? { contexts: actor.contexts || [], expectations: actor.expectations || [], pains: actor.pains || [], unknowns: actor.unknowns || [] } : null,
      trace: trace.map(i => ({ id: i.id, claim: i.claim || null, confidence: i.confidence || null, source: i.source ? `${i.source.type || ''} ${i.source.ref || ''}`.trim() : null, evidence: i.evidence || [], missing: !!i.missing })),
      run: run ? { id: run.id, ranAt: run.ranAt, environment: run.environment, viewport: run.viewport, exit: run.exit, status: run.status, packet: `${base}/run.json`, verdict: run.exit === 2 ? 'fail' : loud.length ? 'finding' : run.exit === 1 ? 'blocked' : 'pass' } : null,
      screens: [...new Set(workflows.flatMap(w => w.steps.flatMap(s => [s.before.state, s.after.state])))].map(id => ({ id, variants: mockups[id]?.variants?.length || 0, pick: mockups[id]?.pick || null })),
      workflows,
    };
  });
  return { project: { id: project.id || null, name: project.name || project.id || 'project' }, version, level, generatedAt: null, journeys: J, findings };
}

export const mapCard = m => {
  const L = [`uxcli map · ${m.project.name}`, ''];
  for (const j of m.journeys) {
    const steps = j.workflows.flatMap(w => w.steps); const drift = steps.filter(s => s.drift).length;
    L.push(`  ${(j.run ? DRIFT_WORD[j.run.verdict] || j.run.verdict : 'no run').padEnd(10)} ${j.id.padEnd(28)} ${steps.length} steps · ${j.screens.filter(s => s.pick).length}/${j.screens.length} screens picked${j.run ? ` · ${drift} with drift` : ''}`);
  }
  L.push('', `  ${m.findings.length} finding${m.findings.length === 1 ? '' : 's'} across ${m.journeys.length} ${m.journeys.length === 1 ? 'journey' : 'journeys'}`);
  if (m.page) L.push(`  page   ${m.page}`);
  return L.join('\n');
};

export function mapPage(m) {
  const data = JSON.stringify(m).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(m.project.name)} · journey map</title>
<style>
*,*::before,*::after{box-sizing:border-box}
:root{color-scheme:light;--bg:#f4f6f9;--canvas:#f8f9fb;--dot:#d9dee6;--surface:#fff;--well:#eef1f5;--ink:#141822;--dim:#6b7380;--line:#e1e5eb;--accent:#2563eb;--accent-soft:#e3ecfd;--fail:#e0362b;--fail-soft:#fdeceb;--finding:#b06a00;--finding-soft:#fdf0d5;--pass:#16a34a;--pass-soft:#dcf5e6;--violet:#7c3aed;--violet-soft:#efe9fd;--mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;--sans:-apple-system,"Segoe UI",Inter,Helvetica,Arial,sans-serif}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){color-scheme:dark;--bg:#0e1116;--canvas:#13171d;--dot:#262c36;--surface:#181c23;--well:#20252e;--ink:#e8ebf0;--dim:#98a1ad;--line:#2a3039;--accent:#6b9cff;--accent-soft:#1b2a4a;--fail:#ff6b5c;--fail-soft:#46211c;--finding:#e3b23a;--finding-soft:#463912;--pass:#4ecb7f;--pass-soft:#173a26;--violet:#b197ff;--violet-soft:#2a2450}}
:root[data-theme="dark"]{color-scheme:dark;--bg:#0e1116;--canvas:#13171d;--dot:#262c36;--surface:#181c23;--well:#20252e;--ink:#e8ebf0;--dim:#98a1ad;--line:#2a3039;--accent:#6b9cff;--accent-soft:#1b2a4a;--fail:#ff6b5c;--fail-soft:#46211c;--finding:#e3b23a;--finding-soft:#463912;--pass:#4ecb7f;--pass-soft:#173a26;--violet:#b197ff;--violet-soft:#2a2450}
html{background:var(--bg)}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.45 var(--sans);height:100vh;overflow:hidden}
a{color:var(--accent)}
button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;padding:0}
.app{display:grid;grid-template-columns:196px minmax(0,1fr);height:100vh}
.side{background:var(--surface);border-right:1px solid var(--line);padding:18px 12px;display:flex;flex-direction:column;gap:2px}
.brand{display:flex;align-items:center;gap:8px;padding:6px 10px 18px;font:800 18px/1 var(--sans);letter-spacing:-.02em}
.brand i{width:20px;height:20px;border-radius:6px;background:var(--accent)}
.nav a{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:9px;color:var(--dim);text-decoration:none;font-weight:500}
.nav a:hover{background:var(--well);color:var(--ink)}
.nav a.on{background:var(--accent-soft);color:var(--accent);font-weight:600}
.nav a i{width:16px;height:16px;border-radius:5px;border:1.6px solid currentColor;opacity:.75;flex:none}
.nav a .n{margin-left:auto;font:700 11px/1 var(--mono);padding:4px 7px;border-radius:999px;background:var(--fail);color:#fff}
.nav a .n.zero{background:var(--well);color:var(--dim)}
.side .foot{margin-top:auto;padding:10px 12px;font:11px/1.5 var(--mono);color:var(--dim)}
.right{display:grid;grid-template-rows:auto minmax(0,1fr);height:100vh;min-width:0}
.top{background:var(--surface);border-bottom:1px solid var(--line);padding:12px 20px;display:flex;align-items:center;gap:10px}
.chip{display:inline-flex;align-items:center;gap:8px;font:600 13px/1 var(--sans);padding:10px 14px;border-radius:9px;background:var(--well);color:var(--ink)}
.chip.jm{background:var(--violet-soft);color:var(--violet)}
.chip.sel{cursor:pointer}.chip.sel select{border:0;background:none;font:inherit;color:inherit;cursor:pointer;outline:none}
.run{margin-left:auto;font:600 13px var(--sans);padding:10px 18px;border-radius:9px;background:var(--accent);color:#fff}
.run:hover{filter:brightness(1.08)}
.body{display:grid;grid-template-columns:minmax(0,1fr) 380px;min-height:0}
@media (max-width:1100px){.body{grid-template-columns:1fr}.panel{display:none}}
.canvas{position:relative;min-width:0;overflow:auto;background:var(--canvas);background-image:radial-gradient(var(--dot) 1.2px,transparent 1.2px);background-size:22px 22px;display:grid;align-content:start;padding:16px 22px 22px;gap:18px;--sw:clamp(220px,17vw,320px);--ta:4/5}
.canvas.wide{--ta:16/10}
.tools{display:flex;gap:10px;align-items:center}
.seg{display:inline-flex;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:3px;gap:2px}
.seg button{padding:8px 14px;border-radius:8px;font:700 11px/1 var(--mono);letter-spacing:.08em;color:var(--dim)}
.seg button.on{background:var(--accent);color:#fff}
.lanes{display:flex;flex-wrap:wrap;gap:22px 40px;align-items:flex-start}
.lane{display:grid;gap:8px;width:max-content;max-width:100%}
.lane-h{display:flex;gap:8px;align-items:center;font:600 12px var(--mono);color:var(--dim)}
.lane-h .k{font:700 10px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;padding:4px 7px;border-radius:5px;background:var(--surface);border:1px solid var(--line)}
.lane-h .k.happy{color:var(--accent)}.lane-h .k.recovery{color:var(--finding)}
.strip{display:flex;gap:0;align-items:stretch;width:max-content;max-width:100%;overflow-x:auto}
.step{width:var(--sw);background:var(--surface);border:1.5px solid var(--line);border-radius:14px;padding:14px;display:grid;gap:12px;text-align:left;box-shadow:0 1px 2px rgba(0,0,0,.04)}
.step:hover{box-shadow:0 6px 18px -8px rgba(0,0,0,.25)}
.step.on{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.step.drift{border-color:var(--fail);background:color-mix(in srgb,var(--fail-soft) 60%,var(--surface))}
.step.drift.on{box-shadow:0 0 0 3px var(--fail-soft)}
.step .h{display:flex;align-items:center;gap:10px}
.step .num{flex:none;width:26px;height:26px;border-radius:50%;background:var(--well);font:700 12px/26px var(--mono);text-align:center}
.step.drift .num{background:var(--fail-soft);color:var(--fail)}
.step .t{font:600 14px/1.2 var(--sans);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
.step .w{flex:none;color:var(--fail);font-weight:700}
.thumb{aspect-ratio:var(--ta,16/10);border-radius:8px;overflow:hidden;background:var(--well);border:1px solid var(--line)}
.thumb img{width:100%;height:100%;object-fit:cover;object-position:top;display:block}
.thumb.none{display:grid;place-items:center;font:11px/1.3 var(--mono);color:var(--dim);text-align:center;padding:8px;border-style:dashed;background:var(--surface)}
.m{width:24px;height:24px;border-radius:50%;display:inline-grid;place-items:center;font:700 12px/1 var(--mono);color:#fff}
.m.ok{background:var(--pass)}.m.bad{background:var(--fail)}.m.warn{background:var(--finding)}.m.na{background:var(--line);color:var(--dim)}
.arrow{align-self:center;width:34px;text-align:center;color:var(--dim);font-size:20px;flex:none}
.tray{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:12px 14px;display:grid;gap:10px}
.tray .th{display:flex;align-items:center;gap:8px;font:600 13px var(--sans)}
.tray .th small{color:var(--dim);font-weight:500}
.tray .th .sp{margin-left:auto;font:11px var(--mono);color:var(--dim)}
.tray .pics{display:flex;gap:12px;overflow-x:auto}
.tray .pic{flex:none;width:176px;display:grid;gap:4px;text-decoration:none;color:var(--dim);font:10px var(--mono)}
.tray .pic .thumb{width:176px}
.tray .pic.bad .thumb{border-color:var(--fail);box-shadow:0 0 0 2px var(--fail-soft)}
.panel{background:var(--surface);border-left:1px solid var(--line);padding:22px 22px;display:grid;gap:14px;align-content:start;overflow:auto}
.panel .ph{display:flex;align-items:center;gap:12px}
.panel .ph h2{margin:0;font:800 24px/1.1 var(--sans);letter-spacing:-.02em;flex:1;min-width:0;overflow-wrap:anywhere}
.flag{font:600 13px var(--sans);padding:8px 12px;border-radius:9px;background:var(--fail-soft);color:var(--fail);white-space:nowrap}
.flag.ok{background:var(--pass-soft);color:var(--pass)}.flag.na{background:var(--well);color:var(--dim)}
.panel .sub{margin:-6px 0 0;font:12px var(--mono);color:var(--dim)}
.ba{display:grid;grid-template-columns:1fr 20px 1fr;gap:8px;align-items:center}
.ba .b{padding:10px;border-radius:12px;background:var(--accent-soft);display:grid;gap:8px}
.ba .b.a{background:var(--fail-soft)}.ba .b.a.ok{background:var(--pass-soft)}
.ba .b span{font:600 12px var(--sans);padding:4px 8px;border-radius:6px;background:var(--surface);justify-self:start}
.ba .b .thumb{aspect-ratio:9/12;background:var(--surface)}
.ba .b .thumb img{object-position:top}
.ba .ar{text-align:center;color:var(--dim);font-size:18px}
.rows{display:grid;border-top:1px solid var(--line)}
.row{display:grid;grid-template-columns:38px 1fr auto 16px;gap:12px;align-items:center;padding:14px 0;border-bottom:1px solid var(--line);text-align:left;width:100%}
.row .ic{width:36px;height:36px;border-radius:10px;background:var(--well);display:grid;place-items:center;font:700 12px var(--mono);color:var(--dim)}
.row b{font:600 15px var(--sans)}
.row .val{font:13px var(--mono);color:var(--dim);text-align:right;overflow-wrap:anywhere;max-width:190px}
.row .val.flag{font:600 12px var(--sans);max-width:none;padding:7px 10px}
.row .chev{color:var(--dim)}
.row .mini{display:flex;gap:6px}.row .mini .thumb{width:64px;background:var(--surface)}
.det{display:none;padding:0 0 14px 50px;font:12px/1.55 var(--mono);color:var(--dim);border-bottom:1px solid var(--line)}
.det.open{display:block}
.det ul{margin:0;padding:0;list-style:none}.det li::before{content:"✓ ";color:var(--pass)}.det li.no::before{content:"✗ ";color:var(--fail)}.det li.na::before{content:"· "}
.det dl{margin:6px 0 0;display:grid;grid-template-columns:52px 1fr;gap:2px 8px}.det dt{font-weight:700;letter-spacing:.08em;font-size:10px;line-height:1.7}.det dd{margin:0;color:var(--ink)}
.det p{margin:0 0 4px}
.v{display:inline-block;font:700 10px/1 var(--mono);letter-spacing:.08em;padding:5px 7px;border-radius:5px;color:#fff;background:var(--dim)}
.v.fail,.v.state{background:var(--fail)}.v.finding{background:var(--finding)}.v.pass{background:var(--pass)}
.page{padding:24px;overflow:auto;display:grid;gap:18px;align-content:start}
.page h1{margin:0;font:800 26px/1.15 var(--sans);letter-spacing:-.02em}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:16px;display:grid;gap:10px;text-align:left}
.card:hover{border-color:var(--accent)}
.card b{font:700 16px var(--sans)}
.card .kv{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.card .kv .chip{padding:7px 10px;font-size:12px}
.cards .thumb{--ta:16/10}
.fx{display:grid;grid-template-columns:auto minmax(0,1fr) 110px;gap:14px;align-items:center;padding:12px 14px;background:var(--surface);border:1px solid var(--line);border-radius:12px;text-align:left}
.fx:hover{border-color:var(--accent)}
.fx b{display:block;font:600 13px var(--sans);overflow-wrap:anywhere}.fx small{font:11px var(--mono);color:var(--dim)}
.fx .thumb{width:110px;--ta:16/10}
.empty{color:var(--dim)}
</style>
</head>
<body>
<div class="app">
  <aside class="side">
    <div class="brand"><i></i>uxcli</div>
    <nav class="nav" id="nav"></nav>
    <div class="foot">uxcli ${esc(m.version)}<br>uxcli map</div>
  </aside>
  <div class="right">
    <header class="top" id="top"></header>
    <div id="view" class="body"></div>
  </div>
</div>
<script>
const M = ${data};
const h = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TABS = ['model','run','diff','impact'];
const W = { fail:'FAIL', finding:'finding', pass:'pass', 'not-committed':'not committed', unmeasurable:'unmeasurable', 'not-applicable':'n/a', state:'STATE', blocked:'blocked' };
const S = { view:'overview', j:null, tab:'run', step:1, open:{} };
const stepsOf = j => j.workflows.flatMap(w => w.steps);
function route(){ const p=(location.hash||'').replace(/^#/,'').split('/'); if(p[0]==='j'&&M.journeys.find(j=>j.id===p[1])){S.view='journey';S.j=p[1];S.tab=TABS.includes(p[2])?p[2]:S.tab;S.step=+p[3]>0?+p[3]:1;} else if(p[0]==='findings') S.view='findings'; else S.view='overview'; render(); }
const go=(...p)=>{location.hash=p.join('/');};
window.addEventListener('hashchange',route);
const J=()=>M.journeys.find(j=>j.id===S.j)||M.journeys[0];
function nav(){ document.getElementById('nav').innerHTML=
  '<a href="#overview" class="'+(S.view==='overview'?'on':'')+'"><i></i>Overview</a>'+
  '<a href="#j/'+h((J()||{}).id||'')+'/'+S.tab+'/1" class="'+(S.view==='journey'?'on':'')+'"><i></i>Journey Map</a>'+
  '<a href="#findings" class="'+(S.view==='findings'?'on':'')+'"><i></i>Findings<span class="n '+(M.findings.length?'':'zero')+'">'+M.findings.length+'</span></a>'; }
function topbar(){ const j=J(); document.getElementById('top').innerHTML=
  '<span class="chip">▦ '+h(M.project.name)+'</span>'+
  (S.view==='journey'&&j?'<label class="chip sel jm">◇ <select onchange="go(\\'j\\',this.value,\\''+S.tab+'\\',1)">'+M.journeys.map(x=>'<option value="'+h(x.id)+'" '+(x.id===j.id?'selected':'')+'>'+h(x.id)+'</option>').join('')+'</select></label>':'<span class="chip jm">◇ Journey Map</span>')+
  (M.level?'<span class="chip">'+h(M.level.story||'')+'</span>':'')+
  (j?'<button class="run" onclick="copy(this)" data-cmd="uxcli run .uxcli/journeys/'+h(j.id)+'.json">▶ Run</button>':''); }
function copy(b){const c=b.dataset.cmd;navigator.clipboard?.writeText(c).then(()=>{b.textContent='copied · '+c;setTimeout(()=>b.textContent='▶ Run',1800);}).catch(()=>{b.textContent=c;});}
const thumb=(src,alt,none)=>src?'<div class="thumb"><img src="'+h(src)+'" alt="'+h(alt||'')+'" loading="lazy"></div>':'<div class="thumb none">'+h(none||'—')+'</div>';
const after=(s)=>S.tab==='model'?s.after.mock.shot:s.after.shot;
const before=(s)=>S.tab==='model'?s.before.mock.shot:s.before.shot;
function mark(s){ if(S.tab==='model') return s.after.mock.variant?'<span class="m ok">✓</span>':s.after.mock.variants?'<span class="m warn">?</span>':'<span class="m na">–</span>'; if(!s.measured) return '<span class="m na">–</span>'; if(S.tab==='impact'){const f=s.verdicts.some(v=>v.value==='fail');const g=s.verdicts.some(v=>v.value==='finding');return f?'<span class="m bad">!</span>':g?'<span class="m warn">?</span>':s.commitments.length?'<span class="m ok">✓</span>':'<span class="m na">–</span>';} return s.drift?'<span class="m bad">!</span>':'<span class="m ok">✓</span>'; }
function lanes(j){ return '<div class="lanes">'+j.workflows.filter(w=>w.steps.length).map(w=>'<div class="lane"><div class="lane-h">'+h(w.id)+(w.kind?'<span class="k '+h(w.kind)+'">'+h(w.kind)+'</span>':'')+'</div><div class="strip">'+w.steps.map((s,i)=>(i?'<span class="arrow">→</span>':'')+'<button class="step '+(s.n===S.step?'on':'')+' '+(s.drift&&S.tab!=='model'?'drift':'')+'" onclick="go(\\'j\\',\\''+h(j.id)+'\\',\\''+S.tab+'\\','+s.n+')"><div class="h"><span class="num">'+s.n+'</span><span class="t" title="'+h(s.action)+'">'+h(s.after.state.split('.').pop().replace(/_/g,' '))+'</span>'+(s.drift&&S.tab!=='model'?'<span class="w">⚠</span>':'')+'</div>'+thumb(after(s),s.after.state,S.tab==='model'?(s.after.mock.variants?'no pick':'no mockup'):'not run')+mark(s)+'</button>').join('')+'</div></div>').join('')+'</div>'; }
function tray(s){ const pics=[]; const push=(src,l,bad)=>src&&pics.push({src,l,bad}); if(S.tab==='model'){push(s.before.mock.shot,s.before.state+' · '+s.before.mock.variant);push(s.after.mock.shot,s.after.state+' · '+s.after.mock.variant);} else {push(s.before.shot,s.before.state,s.before.held===false);push(s.after.shot,s.after.state,s.after.held===false||s.verdicts.some(v=>v.value==='fail'&&s.after.shot&&s.after.shot.endsWith(v.shot)));if(S.tab==='diff')push(s.after.mock.shot,'expected · '+s.after.state);}
  return '<div class="tray"><div class="th">▣ Evidence <small>('+pics.length+')</small><span class="sp">'+h(s.workflow+'/'+s.id)+'</span></div><div class="pics">'+(pics.length?pics.map(p=>'<a class="pic '+(p.bad?'bad':'')+'" href="'+h(p.src)+'" target="_blank">'+thumb(p.src,p.l)+'<span>'+h(p.l)+'</span></a>').join(''):'<span class="empty">no picture at this step yet</span>')+'</div></div>'; }
const sig=o=>o?'<ul>'+Object.entries(o).map(([k,v])=>'<li class="'+(v===true?'':v===false?'no':'na')+'">'+h(k)+'</li>').join('')+'</ul>':'';
const decl=st=>st&&st.signals?'<ul>'+st.signals.map(x=>'<li class="na">'+h([x.observer,x.selector||x.path||x.request||x.key||x.role||'',x.visible!=null?'visible':'',x.contains?'contains "'+x.contains+'"':'',x.status?'→ '+x.status:'',x.inViewportWithoutScroll?'in viewport':''].filter(Boolean).join(' '))+'</li>').join('')+'</ul>':'';
function toggle(k){S.open[k]=!S.open[k];render();}
function panel(j,s){ const inter=s.observed?s.observed.interactions:s.declaredInteractions; const api=inter.filter(x=>x.type==='api'); const ui=[...inter].reverse().find(x=>x.type==='ui');
  const row=(k,ic,t,val,det)=>'<button class="row" onclick="toggle(\\''+k+'\\')"><span class="ic">'+ic+'</span><b>'+h(t)+'</b>'+val+'<span class="chev">'+(S.open[k]?'⌄':'›')+'</span></button><div class="det '+(S.open[k]?'open':'')+'">'+det+'</div>';
  const flag=s.drift?'<span class="flag">⚠ Drift</span>':s.measured?'<span class="flag ok">✓ Held</span>':'<span class="flag na">not run</span>';
  const fail=s.verdicts.find(v=>v.value==='fail');
  return '<aside class="panel"><div class="ph"><h2>'+h(s.after.state.split('.').pop().replace(/_/g,' '))+'</h2>'+flag+'</div><p class="sub">'+h(s.n+' · '+s.action+(s.url?' · '+s.url:''))+'</p>'
   +'<div class="ba"><div class="b"><span>Before</span>'+thumb(before(s),s.before.state,'—')+'</div><span class="ar">→</span><div class="b a '+(s.drift?'':'ok')+'"><span>After</span>'+thumb(after(s),s.after.state,'—')+'</div></div>'
   +'<div class="rows">'
   +row('api','</>','API','<span class="val">'+h(api.length?api.map(x=>x.request+(x.status?' → '+x.status:'')).join(' · '):'—')+'</span>','<ul>'+inter.map(x=>'<li class="na">'+h(x.type==='api'?x.request+(x.status?' → '+x.status:x.expect&&x.expect.status?' expects '+x.expect.status:'')+(x.ms?' · '+x.ms+'ms':''):x.type==='navigation'?'navigate '+x.to:x.type==='ui'?x.target+(x.inViewportWithoutScroll===false?' · below the fold, '+x.scrollsNeeded+' scrolls':''):x.type+' '+(x.expr||''))+'</li>').join('')+(s.observed&&s.observed.timing?'<li class="na">stable after '+h(s.observed.timing.toStable)+'ms</li>':'')+'</ul>')
   +row('state','◈','State',s.measured?(s.after.held===false?'<span class="val flag">⚠ Drift</span>':'<span class="val flag ok">✓ '+h(s.after.strength||'held')+'</span>'):'<span class="val">'+h(s.after.state)+'</span>','<p>expected <b>'+h(s.after.state)+'</b>'+(s.after.declared&&s.after.declared.strength?' · '+h(s.after.declared.strength):'')+'</p>'+decl(s.after.declared)+(s.measured?'<p style="margin-top:6px">observed · '+(s.after.held===false?'did not hold':'held · '+h(s.after.strength))+'</p>'+sig(s.after.signals)+(s.after.why&&s.after.why.length?'<p>'+h(s.after.why.join('; '))+'</p>':''):''))
   +row('ev','▣','Evidence','<span class="mini">'+(before(s)?thumb(before(s)):'')+(after(s)?thumb(after(s)):'')+'</span>',(j.run?'<p><a href="'+h(j.run.packet)+'">run.json</a> · '+h(j.run.ranAt.slice(0,16).replace('T',' '))+' · '+h(j.run.environment)+' · '+h(j.run.viewport)+'</p>':'<p>no run yet</p>')+(s.verdicts.filter(v=>v.shot).map(v=>'<p>'+h(W[v.value]||v.value)+' '+h(v.commitment||'')+' cites '+h(v.shot)+'</p>').join('')))
   +row('c','§','Commitment',fail?'<span class="val flag">'+h(fail.commitment?fail.commitment+' FAIL':'state not held')+'</span>':s.commitments.length?'<span class="val">'+h(s.commitments.map(c=>c.id+(c.verdict?' '+(W[c.verdict]||c.verdict):'')).join(' · '))+'</span>':'<span class="val">none</span>',(s.commitments.length?s.commitments.map(c=>'<p><b>'+h(c.id)+'</b> '+h(c.statement)+'<br>'+h(c.owner||'')+(c.verdict?' · <span class="v '+h(c.verdict)+'">'+h(W[c.verdict]||c.verdict)+'</span>':'')+'</p>').join(''):'<p>nothing signed over this step; a would-be fail here is a finding</p>')+s.verdicts.filter(v=>v.what).map(v=>'<dl><dt>what</dt><dd>'+h(v.what)+'</dd><dt>where</dt><dd>'+h(s.workflow+'/'+s.id)+'</dd>'+(v.statement?'<dt>rule</dt><dd>'+h(v.statement)+'</dd>':'')+(v.shot?'<dt>check</dt><dd>'+h(v.shot)+'</dd>':'')+'</dl>').join(''))
   +row('run','▶','Run','<span class="val">'+h(j.run?(M.level?M.level.story:'')+' · exit '+j.run.exit:'not run')+'</span>','<p>'+h(j.goal)+'</p>'+(j.trace.length?j.trace.map(i=>'<p>'+h(i.claim||i.id)+(i.confidence?' · '+h(i.confidence):'')+(i.source?' · '+h(i.source):'')+'</p>').join(''):'')+'<p>uxcli run .uxcli/journeys/'+h(j.id)+'.json</p>')
   +'</div></aside>'; }
function journey(j){ const steps=stepsOf(j); const s=steps.find(x=>x.n===S.step)||steps[0]; if(!s) return '<div class="page"><h1>'+h(j.id)+'</h1><p class="empty">no measurable workflow</p></div>';
  const wide=j.run&&/^(\d+)x(\d+)$/.test(j.run.viewport||'')&&(+j.run.viewport.split('x')[0]>+j.run.viewport.split('x')[1]);
  return '<div class="canvas '+(wide?'wide':'')+'"><div class="tools"><div class="seg">'+TABS.map(t=>'<button class="'+(S.tab===t?'on':'')+'" onclick="go(\\'j\\',\\''+h(j.id)+'\\',\\''+t+'\\','+S.step+')">'+t.toUpperCase()+'</button>').join('')+'</div></div>'+lanes(j)+tray(s)+'</div>'+panel(j,s); }
function overview(){ return '<div class="page" style="grid-column:1/-1"><h1>Overview</h1><div class="cards">'+M.journeys.map(j=>{const st=stepsOf(j);return '<button class="card" onclick="go(\\'j\\',\\''+h(j.id)+'\\',\\''+S.tab+'\\',1)"><b>'+h(j.id)+'</b>'+thumb((st[0]&&(st[0].after.shot||st[0].after.mock.shot))||null,j.id,'no picture yet')+'<div class="kv">'+(j.run?'<span class="v '+h(j.run.verdict)+'">'+h(W[j.run.verdict]||j.run.verdict)+'</span>':'<span class="v">no run</span>')+'<span class="chip">'+st.length+' steps</span><span class="chip">'+j.screens.filter(x=>x.pick).length+'/'+j.screens.length+' picked</span>'+(j.run&&st.some(x=>x.drift)?'<span class="chip" style="color:var(--fail)">'+st.filter(x=>x.drift).length+' drift</span>':'')+'</div></button>';}).join('')+'</div></div>'; }
function findings(){ return '<div class="page" style="grid-column:1/-1"><h1>Findings</h1>'+(M.findings.length?M.findings.map(f=>'<button class="fx" onclick="go(\\'j\\',\\''+h(f.journey)+'\\',\\'impact\\','+f.n+')"><span class="v '+h(f.value)+'">'+h(W[f.value]||f.value)+'</span><div><b>'+h((f.commitment?f.commitment+' · ':'')+f.what)+'</b><small>'+h(f.journey+' · '+f.workflow+'/'+f.step)+'</small></div>'+thumb(f.shot,f.step,'')+'</button>').join(''):'<p class="empty">nothing failed on the last runs</p>')+'</div>'; }
function render(){ nav(); topbar(); document.getElementById('view').innerHTML = S.view==='journey'?journey(J()):S.view==='findings'?findings():overview(); }
route();
</script>
</body>
</html>
`;
}

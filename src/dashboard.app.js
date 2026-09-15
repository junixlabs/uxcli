// The dashboard's screens. Tier three of three, and the only file that knows what a run is.
//
// It holds the state, the route, the fetches and the five screens — welcome, a missing packet, a run,
// and the evidence column in its two forms. What it does not hold is a single class name: every piece
// of markup on the page comes from dashboard.ui.js, which is what stops the same verdict being drawn
// four ways on four screens. `test/dashboard-system.mjs` asserts it.
//
// A screen's whole job is to turn what a probe recorded into what a component takes. That translation
// is the interesting part and it lives here, in one place per screen, instead of being spread through
// a hundred lines of element construction.

import {
  $, el, on, ORDER, LOUD, byRank, tallyOf, homey, leaf, shorten, day, clock, when, shortName,
  stepLabels, Mark, Dot, LiveDot, Chip, Code, Eyebrow, Btn, Link, Tally, Scope, RunCard, Tiles,
  Note, Hint, Frame, Chain, Cover, ProbeTable, Pager, Field, Fields, EvHead, Cite, Why, Specimen,
  Proof, Raw, Acts, Caption, Foot, Pad, Empty, PageHead, PageMeta, EvPad, Combo,
} from './dashboard.ui.js';

let INDEX = { runs: [] }, RUN = null, ENTRY = null, FILTER = null, Q = '', STEP = 0, PROBE = null;
// Whichever pager the evidence column last drew — steps on a journey, probes on a page run. ← and →
// mean what the pager means, so there is one arrow behaviour and not two that differ by view.
let PAGE = null;
// The run cards as they were built, so nothing has to go looking for them by selector.
let CARDS = [];

// ── the route ───────────────────────────────────────────────────────────────
// The url carries run, probe and step, so Back walks back through what was looked at, and a link to
// one probe of one run is a link somebody else can open.
const route = () => { const h = decodeURIComponent(location.hash.replace(/^#\/?/, '')); const i = h.indexOf('|');
  if (i < 0) return { dir: h, probe: null, step: null };
  const rest = h.slice(i + 1);
  return rest.startsWith('s:') ? { dir: h.slice(0, i), probe: null, step: parseInt(rest.slice(2), 10) }
    : { dir: h.slice(0, i), probe: rest, step: null }; };
const nav = (dir, tail) => { const h = dir ? '#/' + encodeURIComponent(dir) + (tail ? '|' + tail : '') : '#/';
  if (location.hash !== h) location.hash = h; else show(); };
const go = (dir, probe) => { if (probe) evidence(true); nav(dir, probe || ''); };
const goStep = (dir, n) => { evidence(true); nav(dir, 's:' + n); };

const matches = r => { if (!Q) return true; const q = Q.toLowerCase();
  return [r.name, r.project, r.kind, r.where].some(v => String(v || '').toLowerCase().includes(q)); };
const listed = () => INDEX.runs.filter(matches).filter(r => !FILTER || r.project === FILTER)
  .slice().sort((a, b) => byRank(a.worst, b.worst) || String(b.ranAt).localeCompare(String(a.ranAt)));

async function boot() {
  try { INDEX = await (await fetch('/api/index')).json(); } catch { INDEX = { runs: [] }; }
  drawOrigin(); drawFilter(); drawRuns(); show();
}

// The claim this product makes is that the numbers were measured here, on this machine. The header
// says where "here" is, once, in the place a reader looks first — and says only what it can check
// from where it is standing. "no network" and "single user" were in the mock-up and are not here:
// a page that asserts what it has not measured is the one thing this product is against.
function drawOrigin() {
  const host = $('#origin'); host.textContent = '';
  host.append(el('b', {}, LiveDot(), document.createTextNode(location.host)),
    el('b', { text: `${INDEX.runs.length} runs on this machine` }));
}

// The project filter sits in the column it filters, and only when there is more than one project to
// choose between: a control with one option is a label that looks like a control.
function drawFilter() {
  const bar = $('#filterbar'); bar.textContent = '';
  const all = new Map();
  for (const r of INDEX.runs) (all.get(r.project) || all.set(r.project, []).get(r.project)).push(r);
  bar.hidden = all.size < 2;
  if (all.size < 2) return;
  const options = [{ proj: null, label: `all projects (${all.size})`, note: `${INDEX.runs.length} runs`, selected: FILTER === null }];
  for (const [proj, runs] of all) {
    const bad = runs.filter(r => r.worst === 'fail').length;
    options.push({ proj, label: leaf(proj), selected: proj === FILTER,
      // The project's own worst verdict, as a mark beside its name: the list is chosen from, so it
      // has to say which choice needs somebody before it is opened.
      verdict: bad ? 'fail' : runs.some(r => r.worst === 'finding') ? 'finding' : 'pass',
      note: bad ? `${bad} failing` : `${runs.length} run${runs.length > 1 ? 's' : ''}` });
  }
  const at = Math.max(0, options.findIndex(o => o.proj === FILTER));
  bar.append(Combo({ options, at, label: 'filter by project', id: 'projlist' },
    o => { FILTER = o.proj; drawFilter(); drawRuns(); }));
}

// Every run on the machine, worst first, each under its project — so the column answers "which one
// needs somebody" without opening anything.
function drawRuns() {
  const list = listed(), host = $('#runlist'); host.textContent = ''; CARDS = [];
  const projects = new Set(INDEX.runs.map(r => r.project)).size;
  $('#runsub').textContent = Q || FILTER
    ? `${list.length} of ${INDEX.runs.length}`
    : `${INDEX.runs.length} run${INDEX.runs.length === 1 ? '' : 's'} · ${projects} project${projects === 1 ? '' : 's'}`;
  if (!list.length) { host.append(Hint('Nothing matches.')); return; }
  const cur = route().dir;
  // A project is a scope, and its header carries what is stored under it. Grouping is what makes that
  // header true: sorted worst-first alone, a project's runs arrive in several separate stretches and
  // the header repeats, which is a heading that heads nothing. The scopes themselves stay worst-first,
  // so the run that needs somebody is still on top.
  const scopes = new Map();
  for (const r of list) (scopes.get(r.project) || scopes.set(r.project, []).get(r.project)).push(r);
  for (const [proj, mine] of scopes) {
    const counts = {};
    for (const x of mine) for (const v of ORDER) counts[v] = (counts[v] || 0) + ((x.counts || {})[v] || 0);
    host.append(Scope({ path: leaf(proj), title: homey(proj), runs: mine.length, counts }));
    for (const r of mine) {
      const card = RunCard({ name: r.name, verdict: r.worst, kind: r.kind, dir: r.dir,
        when: `${day(r.ranAt).slice(5)} ${clock(r.ranAt).slice(0, 5)}`,
        counts: r.counts || {}, current: r.dir === cur }, () => go(r.dir));
      CARDS.push(card); host.append(card);
    }
  }
}

async function show() {
  const { dir, probe, step } = route();
  for (const c of CARDS) c.setAttribute('aria-current', String(c.dataset.dir === dir));
  const stage = $('#stage');
  if (!dir) { RUN = null; ENTRY = null; return welcome(stage); }
  const entry = INDEX.runs.find(r => r.dir === dir);
  if (!entry) { RUN = null; ENTRY = null; return welcome(stage); }
  if (!RUN || ENTRY?.dir !== dir) {
    try { const res = await fetch('/api/run?dir=' + encodeURIComponent(dir)); if (!res.ok) throw new Error(); RUN = await res.json(); }
    catch { RUN = null; ENTRY = null; return missing(stage, dir); }
    ENTRY = entry; STEP = 0; PROBE = null;
  }
  const ordered = probesOrdered();
  // Nothing has to be clicked to see the failure: the worst probe is already the one in the panel.
  PROBE = probe || PROBE || ordered[0]?.probe || null;
  if (step !== null && !Number.isNaN(step)) STEP = step;
  renderRun(stage); renderEvidence();
}

function clearEvidence(title = 'Evidence') {
  $('#evbody').textContent = ''; $('#pager').textContent = ''; $('#evpx').textContent = '';
  $('#evtitle').textContent = title; PAGE = null;
}

function welcome(stage) {
  clearEvidence();
  $('#evbody').append(Hint('Pick a run on the left.'));
  stage.textContent = '';
  const pad = Pad();
  if (!INDEX.runs.length) pad.append(Empty('Nothing indexed yet',
    el('p', {}, document.createTextNode('Every '), Code('uxcli run'), document.createTextNode(' adds one line to '),
      Code('~/.uxcli/index.json'), document.createTextNode(' — a pointer to where it left run.json.')),
    el('p', { text: 'The packet stays in the project, so it travels with the repo, the pull request and CI. Delete the index and you lose this list, never a piece of evidence.' })));
  else {
    const list = listed();
    const bad = list.filter(r => r.worst === 'fail').length, held = list.filter(r => r.worst === 'finding').length;
    const say = bad && held ? `${bad} run${bad > 1 ? 's' : ''} failed and ${held} measured a failure ${held > 1 ? 'they are' : 'it is'} not licensed to state.`
      : bad ? `${bad} run${bad > 1 ? 's are' : ' is'} failing.`
        : held ? `Nothing failed, but ${held} run${held > 1 ? 's' : ''} measured a failure the probe may not state.`
          : 'Nothing failed and nothing was left unsaid.';
    pad.append(Empty('Runs on this machine',
      el('p', { text: say + ' The list on the left is ordered worst first.' }),
      el('p', { text: 'Pick one to see what it measured, and the evidence it kept.' })));
  }
  stage.append(pad);
}

function missing(stage, dir) {
  clearEvidence();
  stage.textContent = '';
  stage.append(Pad(Empty('The packet is gone',
    el('p', { text: 'This run is still in the index, but run.json is no longer on disk:' }),
    el('p', {}, Code(homey(dir))),
    el('p', { text: 'The index points; it never keeps a copy. Re-run it, or drop the line — either is fine.' }),
    Btn('forget this line', {}, async () => { await fetch('/api/forget?dir=' + encodeURIComponent(dir)); location.hash = ''; boot(); }))));
}

const probesOrdered = () => (RUN?.probes || []).slice().sort((a, b) => byRank(a.verdict, b.verdict));
const shotUrl = f => '/file?dir=' + encodeURIComponent(ENTRY.dir) + '&f=' + encodeURIComponent(f);

// Three things happen to a step and they are three different things: it was measured, it stopped
// part-way, or it was never reached at all. A reader who cannot tell the last two apart cannot tell
// "we looked and found nothing" from "we never looked".
const STATE = { ran: 'measured', stopped: 'stopped here', never: 'never executed' };
function frames() {
  if (!RUN?.steps?.length) return [];
  const labels = stepLabels(RUN.steps.map(s => s.url));
  const out = RUN.steps.map((s, k) => ({ ...s, state: s.error ? 'stopped' : 'ran', path: labels[k] }));
  for (let i = out.length; i < (RUN.stepCount || 0); i++) out.push({ i, state: 'never', path: '—' });
  if (RUN.finalShot) out.push({ i: 'final', shot: RUN.finalShot, state: 'ran', final: true,
    path: 'after the last step', url: RUN.steps[RUN.steps.length - 1]?.url });
  return out;
}
const stepName = f => f.final ? 'outcome' : `step ${f.i}`;

// Which steps a probe pinned itself to. Only what the probe actually recorded — `reasked` and
// `inversion` name steps, and nothing else here infers one. Inventing an attribution would be the
// one dishonest pixel on the page.
const pinnedSteps = p => [...new Set([...(p.reasked || []).map(m => m.step),
  ...(p.inversion ? [p.inversion.stepA, p.inversion.stepB] : [])])].filter(n => n !== undefined);

// ── the run ─────────────────────────────────────────────────────────────────
function renderRun(stage) {
  stage.textContent = '';
  const pad = Pad();
  const probes = RUN.probes || [], counts = tallyOf(probes);
  const worst = probesOrdered()[0]?.verdict || 'not-applicable';

  pad.append(Eyebrow(`${leaf(ENTRY.project)}  ·  ${ENTRY.kind} run`, 'kicker'));
  pad.append(PageHead({ title: RUN.journey || RUN.title || RUN.url || ENTRY.name, verdict: worst,
    action: Btn('evidence', { id: 'evopen', 'aria-controls': 'evidence', 'aria-expanded': String(evOpen()),
      title: 'the frame and the probe packet, on the right' },
      () => { evidence(!evOpen()); if (evOpen()) $('#evshut').focus(); }) }));

  const url = RUN.finalUrl || RUN.url;
  const meta = PageMeta(document.createTextNode([when(RUN.ranAt), RUN.uxcli ? 'uxcli ' + RUN.uxcli : null,
    RUN.journey ? `${RUN.steps?.length ?? 0} of ${RUN.stepCount} steps ran` : null].filter(Boolean).join('  ·  ')));
  if (url) { meta.append(document.createTextNode('  ·  '));
    meta.append(el('a', { href: url, target: '_blank', rel: 'noreferrer', title: url, text: shorten(url) })); }
  pad.append(meta);

  pad.append(Tiles(counts));
  pad.append(Tally(counts, { mode: 'words', only: ORDER.filter(v => !LOUD.includes(v)) }));

  // A journey that stopped early is not a journey that passed. Every probe read the steps that ran and
  // nothing else, so "nothing failed" is a true sentence about a page nobody finished — and read beside
  // the headline verdict it says the opposite of what happened. The verdicts are not touched (a probe
  // reports what it measured); what is corrected is this page's own summary, which was overstating it.
  const ran = (RUN.steps || []).length, declared = RUN.stepCount || 0;
  if (declared && ran < declared) {
    const short = declared - ran;
    pad.append(Note('review', el('b', { text: `${ran} of ${declared} steps ran. ` }),
      document.createTextNode(`The ${short === 1 ? 'last step was' : `last ${short} steps were`} never measured.`)));
  }

  const fr = frames();
  if (fr.length) {
    pad.append(Eyebrow('The journey, in order'));
    const broke = (RUN.steps || []).findIndex(x => x.error);
    if (broke >= 0) {
      const missed = declared - ran;
      pad.append(Note('refused', el('b', { text: `Step ${broke} did not finish. ` }),
        document.createTextNode(missed > 0
          ? `The ${missed === 1 ? 'step' : `${missed} steps`} after it never ran.`
          : 'The journey stopped there.')));
    }
    pad.append(Chain(fr.map((f, k) => ({
      name: stepName(f), path: f.path, url: f.url, state: f.state,
      note: f.ms && f.state === 'ran' ? `${f.ms} ms` : STATE[f.state],
      shot: f.shot ? shotUrl(f.shot) : null, current: k === STEP,
    })), k => goStep(ENTRY.dir, k)));

    // A conclusion belongs to the steps it was measured on, and on a journey that stopped, saying so
    // is the difference between "we looked and found nothing" and "we never looked".
    const at = new Map();
    for (const p of probesOrdered()) for (const n of pinnedSteps(p))
      (at.get(n) || at.set(n, []).get(n)).push(p);
    const rows = fr.filter(f => !f.final && (at.has(f.i) || f.state === 'never')).map(f => ({
      step: `step ${f.i}`, none: f.state === 'never',
      probes: (at.get(f.i) || []).map(p => ({ verdict: p.verdict, name: p.sc || shortName(p.probe) })),
    }));
    if (rows.length) pad.append(Eyebrow('What each conclusion covers'), Cover(rows));
  }

  pad.append(Eyebrow('Probes'));
  pad.append(ProbeTable(probesOrdered().map(p => ({
    criterion: p.sc || shortName(p.probe), name: shortName(p.probe), provenance: p.provenance || '',
    method: (p.method || '').replace('method-', ''), unproven: /unproven/.test(p.method || ''),
    verdict: p.verdict, detail: p.what || p.why || '', current: p.probe === PROBE, probe: p.probe,
  })), r => go(ENTRY.dir, r.probe)));

  const shots = probes.reduce((n, x) => n + (x.proof?.length || 0), 0)
    + (RUN.steps || []).filter(s => s.shot).length + (RUN.finalShot ? 1 : 0);
  pad.append(Foot(
    el('span', { title: ENTRY.dir + '/run.json', text: `packet  ${shorten(homey(ENTRY.dir) + '/run.json', 58)}` }),
    document.createTextNode(`   ·   ${shots} image${shots === 1 ? '' : 's'} beside it   ·   `),
    Btn('open the folder', { kind: 'plain' }, () => fetch('/api/open?dir=' + encodeURIComponent(ENTRY.dir)))));
  stage.append(pad);
}

// What a probe recorded, laid out. Scalars are a row and that is all: the first version turned every
// array of records into a table, which in a 400px rail meant eight columns at 45px each and every
// value broken mid-token — a worse way to read the same data than the JSON it was replacing. A list
// says how many it has and leaves the records to the raw packet below, which is also the thing the
// copy button hands an agent. The rail is for the reader.
function packet(obj, depth = 0) {
  const rows = [];
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) { rows.push(Field(k, v.length ? `${v.length} recorded — in the packet below` : 'none', { kind: 'nil' })); continue; }
    if (v && typeof v === 'object') {
      rows.push(depth < 1
        ? Field(k, packet(v, depth + 1), { kind: 'rows' })
        : Field(k, `${Object.keys(v).length} fields — in the packet below`, { kind: 'nil' }));
      continue;
    }
    rows.push(v === null || v === undefined || v === ''
      ? Field(k, '—', { kind: 'nil' })
      : Field(k, String(v), { kind: typeof v === 'number' || typeof v === 'boolean' ? 'num' : '' }));
  }
  return Fields(rows, { variant: depth ? 'nested' : 'packet' });
}

// The thing an agent needs is not a screenshot and not a sentence: it is the packet, and enough of the
// run around it to go and look for itself. Both lines of the header are commands or paths, so whoever
// receives this can re-run the measurement rather than take this page's word for it.
async function copyPacket(p, raw) {
  const head = [
    `# uxcli · ${p.sc || shortName(p.probe)} · ${p.verdict}`,
    `run: ${ENTRY?.dir || ''}`,
    RUN?.journey ? `journey: ${RUN.journey} · ${(RUN.steps || []).length} of ${RUN.stepCount} steps ran`
      : `page: ${RUN?.finalUrl || RUN?.url || ''}`,
    `measured: ${RUN?.ranAt || ''}${RUN?.uxcli ? ` · uxcli ${RUN.uxcli}` : ''}`,
    p.sc ? `why: npx @junixlabs/uxcli why ${p.sc}` : null,
    '', '```json', JSON.stringify(p, null, 1), '```', ''].filter(x => x !== null).join('\n');
  try {
    await navigator.clipboard.writeText(head);
    say(`copied · ${p.sc || shortName(p.probe)} packet, ${head.length} chars`);
  } catch {
    // Refused (no permission, or the page was opened over something that is not a secure context):
    // the text is selected instead, so the reader still has one keystroke to go, not a dead button.
    raw.open = true; getSelection().selectAllChildren(raw.querySelector('pre'));
    say('could not reach the clipboard — the packet is selected below');
  }
}

// ── the evidence ────────────────────────────────────────────────────────────
// On a journey it pages through the frames the run passed through and the probe sits underneath; on a
// page run there are no frames, so the probe is the whole column.
function renderEvidence() {
  clearEvidence();
  const body = $('#evbody'), pager = $('#pager');
  if (!RUN) { body.append(Hint('Pick a run on the left.')); return; }
  const fr = frames();
  const box = EvPad();

  if (fr.length) {
    if (STEP >= fr.length) STEP = 0;
    const f = fr[STEP];
    const stepTo = d => { if (fr[STEP + d]) goStep(ENTRY.dir, STEP + d); };
    PAGE = stepTo;
    pager.append(Pager({ what: 'step', atStart: STEP === 0, atEnd: STEP === fr.length - 1,
      label: f.final ? 'outcome' : `step ${f.i} of ${RUN.stepCount}` }, stepTo));
    // The size is read off the file once it has loaded rather than stated: a caption that says
    // 1920 × 1024 because a config said so is a caption that can be wrong about its own evidence.
    box.append(Frame({ src: f.shot ? shotUrl(f.shot) : null, alt: `step ${f.i}`,
      miss: f.state === 'never' ? 'This step was never reached, so there is nothing to show.'
        : 'No frame was captured for this step.',
      onLoad: img => { $('#evpx').textContent = `${img.naturalWidth} × ${img.naturalHeight}`; } }));
    box.append(Caption([f.url, f.startedAt ? `captured at ${clock(f.startedAt)} · took ${f.ms} ms` : null,
      f.arrivedBy ? `arrived by ${f.arrivedBy}` : null, f.error || f.flowBreak || null].filter(Boolean).join('\n')));
    if (f.shot) box.append(Acts(Link('open full screenshot ↗', shotUrl(f.shot))));
    box.append(Eyebrow('Probe details'));
  } else $('#evtitle').textContent = 'Probe evidence';

  const list = probesOrdered(), p = list.find(x => x.probe === PROBE) || list[0];
  if (!p) { box.append(Hint('This run recorded no probes.')); body.append(box); return; }
  if (!fr.length) {
    const i = list.indexOf(p);
    const to = d => { const n = list[i + d]; if (n) go(ENTRY.dir, n.probe); };
    PAGE = to;
    pager.append(Pager({ what: 'probe', atStart: i === 0, atEnd: i === list.length - 1,
      label: `${i + 1} of ${list.length}` }, to));
  }

  box.append(EvHead({ verdict: p.verdict, criterion: p.sc || '', name: shortName(p.probe) }));
  box.append(Fields([
    Field('provenance', p.provenance || '—'),
    Field('method', (p.method || '—').replace('method-', ''), { kind: /unproven/.test(p.method || '') ? 'unproven' : '' }),
  ], { variant: 'pair' }));

  if (p.what) box.append(Cite({ what: p.what, where: p.where, check: p.check }));
  else if (p.why) box.append(Why(p.why));

  for (const g of (p.groups || []).slice(0, 2)) if (g.fg && g.bg) {
    box.append(Specimen({ fg: g.fg, bg: g.bg }));
    const rows = [Field('colour pair', `${g.fg} on ${g.bg}`), Field('ratio', g.ratio + ':1', { kind: 'big' }),
      Field('across', `${g.count} text node${g.count === 1 ? '' : 's'}`)];
    if (g.example) rows.push(Field('example', g.example));
    if (g.fgToken || g.bgToken) rows.push(Field('token', [g.fgToken, g.bgToken].filter(Boolean).join(' / ')));
    box.append(Fields(rows, { variant: 'panel' }));
  }

  if (p.rawVerdict && p.rawVerdict !== p.verdict)
    box.append(Note('held', document.createTextNode(`measured ${p.rawVerdict}, reported ${p.verdict}: this probe's method is not validated yet, so it may not state a fail.`)));
  if (p.reread && !p.reread.agreed)
    box.append(Note('refused', document.createTextNode(`read twice ${p.reread.afterMs} ms apart and the page had changed between them, so the first read is not evidence.`)));
  if (p.reread?.agreed)
    box.append(Note('quiet', document.createTextNode(`confirmed by a second read ${p.reread.afterMs} ms later, naming the same elements.`)));
  const pinned = pinnedSteps(p);
  if (pinned.length) box.append(Note('quiet', document.createTextNode(`pointed from step ${pinned.join(', ')} — `),
    Btn('show that frame', { kind: 'plain' }, () => goStep(ENTRY.dir, pinned[0]))));

  const proof = (p.proof || []).map(f => String(f).split('/').pop());
  if (proof.length) {
    const pairs = new Map(), loose = [];
    for (const f of proof) { const m = f.match(/^(.*)-(before|after)\.png$/i);
      if (m) (pairs.get(m[1]) || pairs.set(m[1], {}).get(m[1]))[m[2].toLowerCase()] = f; else loose.push(f); }
    for (const [name, pair] of pairs) box.append(Proof({ caption: name,
      sides: ['before', 'after'].filter(s => pair[s]).map(s => ({ label: s, src: shotUrl(pair[s]), alt: pair[s] })) }));
    for (const f of loose) box.append(Proof({ caption: f, sides: [{ src: shotUrl(f), alt: f }] }));
  }

  // The packet was a JSON blob behind a disclosure, which is the right thing to hand an agent and the
  // wrong thing to hand a reader — the numbers that decided the verdict were in there, unreadable.
  // Both now: the object laid out, and the same object raw underneath for whoever is going to paste it.
  const raw = Raw(JSON.stringify(p, null, 1));
  box.append(Acts(Btn('copy for an agent', { title: 'the whole packet, ready to paste to an agent' },
    () => copyPacket(p, raw))));
  // Only the fields the rail has not already painted. The verdict is a chip, the provenance and the
  // method are two boxes, the sentence is `what`/`why` — printing them again four inches lower is how
  // the same fact ends up with two wordings on one screen.
  const SAID = new Set(['probe', 'sc', 'verdict', 'rawVerdict', 'provenance', 'method', 'rule',
    'what', 'where', 'check', 'why', 'proof', 'reread', 'reasked', 'inversion']);
  box.append(packet(Object.fromEntries(Object.entries(p).filter(([k]) => !SAID.has(k)))));
  box.append(raw);
  body.append(box);
}

// ── the page itself ─────────────────────────────────────────────────────────
// Re-reading the index takes about 4 ms, which is exactly the problem: the button gave no sign it had
// done anything, so "re-read, nothing new" and "did nothing" looked identical — to the reader, and to
// whoever was testing it. It now always reports, and holds the report long enough to read. A verdict
// this page will not state about itself is one it has no business stating about a page.
let saidAt = 0;
// One place the page speaks from, so a screen reader hears one region and a sighted reader looks in
// one spot — whether what happened was a re-read, a copy, or nothing at all.
function say(text) {
  const node = $('#say'); node.textContent = text;
  const mine = ++saidAt;
  setTimeout(() => { if (saidAt === mine) node.textContent = ''; }, 4000);
}
async function reread() {
  const btn = $('#reload'), before = INDEX.runs.length;
  btn.setAttribute('aria-busy', 'true'); btn.disabled = true;
  const t0 = performance.now();
  await boot();
  const after = INDEX.runs.length, added = after - before;
  await new Promise(r => setTimeout(r, Math.max(0, 250 - (performance.now() - t0))));
  btn.disabled = false; btn.removeAttribute('aria-busy');
  say(added > 0 ? `${added} new run${added > 1 ? 's' : ''}`
    : added < 0 ? `${-added} run${added < -1 ? 's' : ''} gone`
      : `no change · ${after} run${after === 1 ? '' : 's'}`);
}

// localStorage can throw (a private window, blocked site data) and the page must open either way, so
// every touch of it is guarded.
const remember = (k, v) => { try { localStorage.setItem(k, v); } catch { /* the page still works */ } };
const recall = k => { try { return localStorage.getItem(k); } catch { return null; } };
function evidence(open, keep = true) {
  $('#shell').dataset.ev = open ? 'open' : 'shut';
  $('#evshut').setAttribute('aria-expanded', String(open));
  $('#evopen')?.setAttribute('aria-expanded', String(open));
  if (keep) remember('uxcli.ev', open ? 'open' : 'shut');
}
const evOpen = () => $('#shell').dataset.ev === 'open';
// Open unless this reader shut it. Evidence is the product, not a drawer beside it.
evidence(recall('uxcli.ev') !== 'shut', false);
on($('#evshut'), () => { evidence(false); $('#evopen')?.focus(); });
on($('#reload'), reread);
// Dark is what the page is; light is a choice, and a choice a tool forgets is a choice it did not
// offer. Stored beside the rail's state, read before first paint in the head of the document.
on($('#theme'), () => {
  const root = document.documentElement, light = root.getAttribute('data-theme') === 'light';
  root.setAttribute('data-theme', light ? 'dark' : 'light');
  remember('uxcli.theme', light ? 'dark' : 'light');
  say(light ? 'dark' : 'light');
});
$('#q').addEventListener('input', e => { Q = e.target.value.trim(); drawRuns(); });
addEventListener('hashchange', show);
// Below the three-column layout the legend lands between the run list and the run itself, so it is
// folded there rather than made into a glossary the reader scrolls past on every visit.
const fitLegend = () => { $('#legend').open = innerWidth > 820; };
addEventListener('resize', fitLegend); fitLegend();
// Everything here is already reachable by click and by Tab. These are for the second hour: the pager
// is the thing a reader uses most and it sat two Tab stops away from whatever they were reading.
// PAGE is set by whichever pager the evidence column last drew, so ← → always mean what it means.
addEventListener('keydown', e => {
  const t = e.target, typing = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable;
  if (e.key === 'Escape' && typing) { t.blur(); return; }
  if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === '/') { e.preventDefault(); $('#q').focus(); return; }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    if (!PAGE) return; e.preventDefault(); PAGE(e.key === 'ArrowLeft' ? -1 : 1); return;
  }
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    if (!CARDS.length) return;
    e.preventDefault();
    const at = CARDS.findIndex(c => c.getAttribute('aria-current') === 'true');
    const next = CARDS[Math.min(CARDS.length - 1, Math.max(0, (at < 0 ? -1 : at) + (e.key === 'ArrowDown' ? 1 : -1)))];
    if (next) { go(next.dataset.dir); next.scrollIntoView({ block: 'nearest' }); }
  }
});
boot();

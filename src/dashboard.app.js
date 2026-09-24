// The dashboard's screens. Tier four of four, and the only file that knows what a run is.
//
// It holds no class name. Every piece of markup comes from dashboard.ui.js, which is what stops the
// same verdict being drawn four ways on four screens. `test/dashboard-system.mjs` asserts it.
//
// A screen's whole job is to turn what a probe recorded into what a component takes. That
// translation is the interesting part and it lives here, one place per screen.
//
// W5 (2026-09-21) split the list by what a run is. A journey used to sit in the same flat table as
// a page, told apart by one column, which on this machine meant one journey at row 27 of 70. It is
// its own destination now, and it opens on a map of the steps rather than on a table of probes.

import {
  $, el, on, ORDER, byRank, tallyOf, homey, leaf, shorten, day, clock, when, host, shortName,
  stepLabels, LiveDot, Code, Btn, Link, Chip, Tally, Note, Frame, Nothing,
  Wrap, Hero, Band, Stack, RunBody, Search, MetaStrip, VerdictTiles, AttentionCards,
  Ledger, Filters, Panel, RunHead, StatStrip, Tabs, FlowMap, StepList, ProbeCard, ProbeTable,
  Rel, Pager, Field, Fields, Specimen, Proof, Raw, Acts, Caption, Foot, Empty, Panes, Pane,
  Combo, Cmds, Legend, TargetCell, Demand, Hook, Reach, Coverage, Queue, LOUD
} from './dashboard.ui.js';
import { labelTargets } from './core/label.js';
import { timelines } from './core/timeline.js';
import { saw, cause } from './core/verdict/rank.js';

let INDEX = { runs: [], projects: [], unseated: [] }, RUN = null, ENTRY = null;
let Q = '', PROJ = null, VERDICT = null, SORT = 'recent';
let STEP = 0, PROBE = null, TAB = null, EVTAB = 'shot';
// Whichever pager the run screen last drew. ← and → mean what that pager means, so there is one
// arrow behaviour on the page and not two that differ by view.
let PAGE = null;

// ── the route ───────────────────────────────────────────────────────────────
// The url carries the screen, and on a run its tab, its step and its probe — so Back walks back
// through what was looked at, and a link to one probe of one run is a link somebody else can open.
//
// A run is addressed by its directory, which is always absolute. Anything that does not start with
// a slash is the name of a screen, which is why `#/runs` can never be mistaken for a run.
const SCREENS = ['home', 'runs', 'journeys', 'pages', 'projects'];
const route = () => {
  const raw = location.hash.replace(/^#\/?/, '');
  const cut = raw.indexOf('|');
  const head = decodeURIComponent(cut < 0 ? raw : raw.slice(0, cut));
  const q = new URLSearchParams(cut < 0 ? '' : raw.slice(cut + 1));
  if (!head.startsWith('/')) return { view: SCREENS.includes(head) ? head : 'home', dir: null };
  const s = q.get('s');
  return { view: 'run', dir: head, tab: q.get('t'), probe: q.get('p'),
    step: s === null ? null : parseInt(s, 10) };
};
const goRun = (dir, over = {}) => {
  const q = new URLSearchParams();
  const tab = over.tab ?? TAB, step = over.step ?? STEP, probe = over.probe ?? PROBE;
  if (tab) q.set('t', tab);
  if (Number.isInteger(step)) q.set('s', String(step));
  if (probe) q.set('p', probe);
  const tail = q.toString();
  const h = '#/' + encodeURIComponent(dir) + (tail ? '|' + tail : '');
  if (location.hash !== h) location.hash = h; else show();
};
const goScreen = name => { location.hash = '#/' + (name === 'home' ? '' : name); };

// ── reading the index ───────────────────────────────────────────────────────
const probesOf = r => Object.values(r.counts || {}).reduce((a, b) => a + b, 0);
const matches = r => { if (!Q) return true; const q = Q.toLowerCase();
  return [r.name, r.project, r.kind, r.where].some(x => String(x || '').toLowerCase().includes(q)); };
const NEEDS = ['fail', 'finding', 'unmeasurable'];

function selected(kind) {
  let list = INDEX.runs.filter(matches);
  if (kind) list = list.filter(r => r.kind === kind);
  if (PROJ) list = list.filter(r => r.project === PROJ);
  if (VERDICT) list = list.filter(r => r.worst === VERDICT);
  return list.slice().sort(SORT === 'worst'
    ? (a, b) => byRank(a.worst, b.worst) || String(b.ranAt).localeCompare(String(a.ranAt))
    : (a, b) => String(b.ranAt).localeCompare(String(a.ranAt)));
}
const recent = () => INDEX.runs.slice().sort((a, b) => String(b.ranAt).localeCompare(String(a.ranAt)));

// A row is named against the rows beside it, never on its own: the shortest label that still tells
// this target from the others on screen. So the naming happens once per list, here, and not once per
// row — the same set that gets drawn is the set that decides how short each name can be.
const ledgerRows = list => {
  const labels = labelTargets(list);
  // Six rows in a row reading `src/probes` is the same noise as six rows reading the whole path,
  // only quieter. The context line says where a target lives, and where it lives has not changed
  // since the row above, so it says nothing — the line stays, empty, holding the row's height.
  let said = null;
  return list.map((r, i) => ({ dir: r.dir, kind: r.kind, verdict: r.worst, exit: r.exit,
    when: `${day(r.ranAt).slice(5)} ${clock(r.ranAt).slice(0, 5)}`,
    project: leaf(r.project), projectFull: r.project,
    label: { ...labels[i], context: labels[i].context === said ? '' : (said = labels[i].context) },
    probes: probesOf(r), current: r.dir === route().dir }));
};

async function boot() {
  try { INDEX = await (await fetch('/api/index')).json(); } catch { INDEX = { runs: [], projects: [], unseated: [] }; }
  drawServer(); show();
}

// The claim this product makes is that the numbers were measured here, on this machine. The rail
// says where "here" is, once — and says only what it can check from where it is standing.
function drawServer() {
  const last = recent()[0];
  $('#origin').textContent = location.host;
  $('#live').prepend(LiveDot());
  const projects = INDEX.projects.length;
  $('#idxline').textContent = `${INDEX.runs.length} run${INDEX.runs.length === 1 ? '' : 's'} · ${projects} project${projects === 1 ? '' : 's'}`;
  $('#idxwhen').textContent = last ? `last ${when(last.ranAt)}` : 'nothing indexed';
}

// ── the screens ─────────────────────────────────────────────────────────────
const PLACE = { home: 'what needs you', runs: 'every run', journeys: 'journeys', pages: 'pages', projects: 'projects' };
const title = what => { document.title = what ? 'uxcli · ' + what : 'uxcli'; };

async function show() {
  const r = route(), stage = $('#stage');
  // A run is not a sixth destination — it is something you opened out of a list. The list it came
  // from stays lit, which is both the truth and the way back.
  const here = r.view === 'run' ? (RUN && RUN.journey ? 'journeys' : 'runs') : r.view;
  for (const link of document.querySelectorAll('[data-view]'))
    link.setAttribute('aria-current', link.dataset.view === here ? 'page' : 'false');
  // One title per place. A single-page app that never touches document.title reports the same name
  // for every screen — which the journey run reads back as three places all called "uxcli runs", so
  // the one thing a flow probe has to tell them apart by does not tell them apart.
  title(r.view === 'run' ? null : PLACE[r.view] || null);
  if (r.view === 'run') return runScreen(stage, r);
  RUN = null; ENTRY = null; PAGE = null;
  stage.textContent = '';
  stage.append(r.view === 'home' ? home()
    : r.view === 'projects' ? projects()
      : ledger(r.view));
}

// ── home ────────────────────────────────────────────────────────────────────
// The question this screen answers is "which of my runs needs a human right now", and the headline
// is that answer. It is computed, never written: a line reading "everything looks good" over eleven
// failures is the summary line this product exists to refuse.
const SAYS = {
  fail: 'needs fixing',
  finding: 'needs review',
  unmeasurable: 'the probe declined',
  'not-committed': 'nothing signed',
  'suppressed': 'waived on the record',
  pass: 'all clear',
  'not-applicable': 'nothing to measure',
};
const hello = () => { const h = new Date().getHours();
  return h < 5 ? 'Still up.' : h < 12 ? 'Good morning.' : h < 18 ? 'Good afternoon.' : 'Good evening.'; };

function home() {
  const runs = INDEX.runs, n = runs.length;
  if (!n) return Wrap(Empty('Nothing indexed yet',
    el('p', {}, document.createTextNode('Every '), Code('uxcli run'), document.createTextNode(' adds one line to '),
      Code('~/.uxcli/index.json'), document.createTextNode(' — a pointer to where it left run.json.')),
    el('p', { text: 'The packet stays in the project, so it travels with the repo, the pull request and CI. Delete the index and you lose this list, never a piece of evidence.' })));

  const box = Wrap();

  // A run on a must-fail page is the gate proving a probe can still see. Its `fail` is the pair
  // working. Sorted in with the rest it was 7 of the 12 rows at the top of this page.
  const mine = runs.filter(r => r.purpose !== 'instrument');
  const rig = n - mine.length;
  const targets = timelines(mine);
  const need = targets.filter(t => LOUD.includes(t.latest.worst));

  // The question that comes before "what failed" is "what can this project prove". Every commitment
  // in this repo is about a colour token; not one names a page, a step or a flow. So the count of
  // failures is a number about the instrument, and this is the number about the product.
  // Two different questions, and the screen used to answer the first with a proxy for the second.
  // `placeful` counts commitments that name somewhere; `reach` is E2's answer — places the browser
  // actually arrived at, against the ones a commitment covers. Where a journey has run, that is the
  // number; where none has, there is no place-level answer and the count of targets is the closest
  // honest thing, said as such.
  const reach = INDEX.projects.map(p => p.reach).filter(Boolean);
  const placed = reach.reduce((a, r) => a + r.observed, 0);
  const held = reach.reduce((a, r) => a + r.committed, 0);
  const promised = INDEX.projects.reduce((a, p) => a + (p.placeful || 0), 0);
  const open = reach.length ? placed - held : Math.max(0, targets.length - promised);

  box.append(Demand({
    need: open,
    label: open === 1 ? 'place under no promise' : 'places under no promise',
    aside: 'measured, and nobody has committed anything about them'
      + (rig ? '. A further ' + rig + ' runs are this tool proving its own probes can still see a defect.' : '.'),
    scope: n + ' runs · ' + targets.length + ' targets · ' + INDEX.projects.length
      + (INDEX.projects.length === 1 ? ' project · last ' : ' projects · last ') + when(recent()[0].ranAt),
  }));

  // What this project has put its name to, and what shape that promise has.
  box.append(Band('What each project has promised'));
  box.append(Hook(INDEX.projects.map(p => {
    const kinds = Object.entries(p.kinds || {});
    const only = kinds.length === 1 ? ', all ' + kinds[0][0] : kinds.length ? ' over ' + kinds.length + ' kinds' : '';
    // The number shown is what passed admission, never the raw count: an entry nothing could
    // falsify, or one nobody may sign, is not a promise this project has made.
    const refused = (p.refused || []).length;
    return { name: leaf(p.project), path: homey(p.project), state: p.governance.state,
      shape: p.admitted ? p.admitted + ' commitments' + only : 'nothing committed yet',
      gap: refused ? refused + ' refused at the door' : p.governance.missing.length ? 'no ' + p.governance.missing.join(', ') : null };
  })));

  box.append(Band('How much of what was measured is under a promise'));
  const kindsAll = INDEX.projects.reduce((a, p) => { for (const [k, n] of Object.entries(p.kinds || {})) a[k] = (a[k] || 0) + n; return a; }, {});
  const kindList = Object.keys(kindsAll);
  box.append(Coverage({ observed: reach.length ? placed : targets.length, committed: reach.length ? held : promised,
    foot: held === 0 && promised === 0 && kindList.length
      ? 'Every commitment here is ' + (kindList.length === 1 ? kindList[0] : kindList.join(' or '))
        + '. None names a page, a step or a flow, so no run can return Fail for anything a person does in this product.'
      : reach.length ? '' : 'No journey has run, so this counts targets, not places: a page run records one address, and one address is not a map.' }));
  // Which places. The band above says there are three; a reader who cannot see which three cannot
  // act on the number, and E2 already knows their names — it is the same list `uxcli propose` writes
  // a skeleton for.
  const openPlaces = reach.flatMap(r => r.uncovered.map(u => ({ ...u, journey: r.journey })));
  if (openPlaces.length) box.append(Fields(openPlaces.map(u =>
    Field(u.path, u.title || 'no title', { hint: 'reached by ' + u.journey + '; uxcli propose writes a skeleton for it' })),
  { variant: 'panel' }));

  box.append(Band(need.length ? 'Targets that need you' : 'Every target is holding',
    Btn('all ' + n + ' runs →', { kind: 'plain' }, () => goScreen('runs'))));
  const show = need.length ? need : targets;
  const labels = labelTargets(show.map(t => ({ where: t.latest.where, project: t.latest.project, name: t.latest.name })));
  box.append(Queue(show.map((t, i) => ({
    dir: t.latest.dir, verdict: t.latest.worst, drift: t.drift,
    name: labels[i].stem && /^index\.\w+$/.test(labels[i].leaf) ? leaf(labels[i].stem) : labels[i].leaf,
    context: labels[i].context, when: when(t.latest.ranAt),
    probes: String(Object.values(t.latest.counts || {}).reduce((a, b) => a + b, 0)),
    history: t.history.map(r => ({ verdict: r.worst, when: day(r.ranAt) })),
  })), r => goRun(r.dir, { tab: null, step: 0, probe: null })));

  // Health, last: a probe that found nothing to look at is not a clean result, and five of the eight
  // may never say Fail however right they are. It is context for the list above, not the headline.
  const probes = mine.reduce((a, r) => { for (const [k, v] of Object.entries(r.counts || {})) a[k] = (a[k] || 0) + v; return a; }, {});
  const total = Object.values(probes).reduce((a, b) => a + b, 0);
  const licensed = INDEX.probes.filter(p => p.method === 'method-validated').length;
  box.append(Band('How far the probes reach'));
  box.append(Reach({
    bars: ORDER.filter(k => probes[k]).map(k => ({ verdict: k, n: probes[k] })),
    foot: total ? Math.round((probes['not-applicable'] || 0) / total * 100) + '% of what the probes did found nothing to measure. '
      + licensed + ' of ' + INDEX.probes.length + ' probes may report Fail; the rest may only report Finding.' : '',
  }));

  return box;
}

// ── the three lists ─────────────────────────────────────────────────────────
// One screen, three doors into it. `runs` is everything; `journeys` and `pages` are the same table
// with the kind already chosen, because a journey at row 27 of 70 is a journey nobody finds.
const TITLES = { runs: 'Every run', journeys: 'Journeys', pages: 'Pages' };
const KINDS = { runs: null, journeys: 'journey', pages: 'page' };

function ledger(view) {
  const kind = KINDS[view];
  const pool = kind ? INDEX.runs.filter(r => r.kind === kind) : INDEX.runs;
  const list = selected(kind);
  const box = Wrap();

  // Only a path that still seats a project is a project; the rest are offered by the name they
  // have, so a filter can still reach their runs without calling them something they are not.
  const seated = new Set(INDEX.projects.map(p => p.project));
  const projSet = [...new Set(pool.map(r => r.project))].sort((a, b) => (seated.has(b) ? 1 : 0) - (seated.has(a) ? 1 : 0));
  const filters = Filters();
  if (projSet.length > 1) {
    const options = [{ proj: null, label: `everything (${seated.size} project${seated.size === 1 ? '' : 's'})`, note: `${pool.length} runs` }];
    for (const proj of projSet) {
      const mine = pool.filter(r => r.project === proj);
      const bad = mine.filter(r => r.worst === 'fail').length;
      options.push({ proj, label: leaf(proj),
        verdict: bad ? 'fail' : mine.some(r => r.worst === 'finding') ? 'finding' : 'pass',
        note: bad ? `${bad} failing` : `${mine.length} run${mine.length === 1 ? '' : 's'}` });
    }
    filters.append(Combo({ options, at: Math.max(0, options.findIndex(o => o.proj === PROJ)),
      label: 'filter by project' }, o => { PROJ = o.proj; redraw(view); }));
  }
  const vOpts = [{ verdict: null, label: 'all verdicts', note: `${pool.length}` },
    ...ORDER.map(v => ({ verdict: v, label: v, note: String(pool.filter(r => r.worst === v).length) }))];
  filters.append(Combo({ options: vOpts, at: Math.max(0, vOpts.findIndex(o => o.verdict === VERDICT)),
    label: 'filter by worst verdict' }, o => { VERDICT = o.verdict; redraw(view); }));
  const sOpts = [{ sort: 'recent', label: 'newest first' }, { sort: 'worst', label: 'worst first' }];
  filters.append(Combo({ options: sOpts, at: Math.max(0, sOpts.findIndex(o => o.sort === SORT)),
    label: 'order' }, o => { SORT = o.sort; redraw(view); }));

  box.append(Panel({ title: `${TITLES[view]} · ${list.length} of ${pool.length}`,
    action: filters, scroll: true, ref: LEDGER }, table(list)));
  return box;
}
const table = list => list.length
  ? Ledger(ledgerRows(list), r => goRun(r.dir, { tab: null, step: 0, probe: null }))
  : Empty('Nothing matches', el('p', { text: 'No run on this machine answers to that.' }));
// Only the table is rebuilt while somebody is typing or filtering, so the controls keep focus and
// the caret. The two nodes come from the Panel that built them — a screen composes components and
// does not go looking for them by selector.
const LEDGER = {};
function redraw(view) {
  const kind = KINDS[view];
  const pool = kind ? INDEX.runs.filter(r => r.kind === kind) : INDEX.runs;
  const list = selected(kind);
  LEDGER.title.textContent = `${TITLES[view]} · ${list.length} of ${pool.length}`;
  LEDGER.body.textContent = '';
  LEDGER.body.append(table(list));
}

// ── projects ────────────────────────────────────────────────────────────────
// The index is machine-wide, so a project is a fact about a run rather than a mode the app is in.
// This screen is the one place that turns it around and counts the other way.
function projects() {
  // The index is a log; a project is not. What this screen answers is what each engine made of the
  // project — what it has declared, who may sign, what passed admission, what its promises are
  // pinned to, and what the browser reached that nobody promised anything about. The run counts are
  // last because a project with nothing declared has nothing to be counted against.
  const runsBy = {}; const purposeBy = {};
  for (const r of INDEX.runs) {
    (runsBy[r.project] ||= []).push(r);
    const b = (purposeBy[r.project] ||= { product: 0, instrument: 0 });
    b[r.purpose === 'instrument' ? 'instrument' : 'product']++;
  }

  const box = Wrap();
  const seated = INDEX.projects;
  box.append(Panel({ title: seated.length + ' project' + (seated.length === 1 ? '' : 's') + ' with a root on this machine' },
    Stack(seated.map(p => {
      const rows = runsBy[p.project] || [];
      const pur = purposeBy[p.project] || { product: 0, instrument: 0 };
      const c = p.context || { said: [], standing: {}, portable: [], undeclared: [], checked: 0, fields: 0 };
      const kinds = Object.entries(p.kinds || {});
      const a = p.anchors || { pinned: 0, unanchored: 0, unverifiable: 0, differs: [] };
      const reach = p.reach;
      // Over product runs only. A `fail` on a must-fail page is the pair working; reported here it
      // would say this project is failing because its instrument can still see.
      const mine = rows.filter(x => x.purpose !== 'instrument');
      // Over each target's latest run, not over the whole log. A fail fixed three weeks ago is
      // history; ranking the log would report it as the state of the project today. Same rule as the
      // queue on the home screen, so the two cannot disagree about what is standing.
      const now = timelines(mine).map(t => t.latest);
      const worst = now.length ? now.slice().sort((x, y) => byRank(x.worst, y.worst))[0].worst : null;
      const last = mine.slice().sort((x, y) => String(y.ranAt).localeCompare(String(x.ranAt)))[0];

      return Panel({ title: leaf(p.project),
        action: Btn('see the runs →', { kind: 'plain' }, () => { PROJ = p.project; goScreen('runs'); }) },
      Fields([
        Field('governance', p.governance.state,
          { hint: p.governance.next.length ? 'next: ' + p.governance.next.join('; ') : 'everything a project can declare is declared and signed' }),
        Field('declared', c.checked + ' of ' + c.fields + ' fields checked',
          { kind: 'num', hint: c.said.map(x => x.field + ' — ' + x.standing
            + (x.doc ? ': ' + x.doc + (x.portable ? '' : ' (not in the repository)') : ': ' + x.means)).join('\n')
            + '\n\nquoted means the words are in the document, not that the field follows from them.' }),
        Field('may sign', p.authority.length
          ? p.authority.map(x => x.subject).join(', ')
          : 'nobody registered',
        { hint: p.authority.length
          ? p.authority.map(x => x.subject + ': ' + x.actions.filter(y => y.ok).map(y => y.action).join(', ') || x.subject + ': nothing').join('\n')
          : 'with no authorities registry, a signature is whatever the commitments file says it is' }),
        Field('promised', p.admitted + ' admitted'
          + (p.refused.length ? ' · ' + p.refused.length + ' refused' : '')
          + (kinds.length === 1 ? ' · all ' + kinds[0][0] : kinds.length > 1 ? ' · ' + kinds.length + ' kinds' : ''),
        { kind: 'num', hint: kinds.map(([k, n]) => n + ' ' + k).join('\n')
            + (p.refused.length ? '\nrefused: ' + p.refused.map(r => r.id + ' — ' + r.reason).join('\n') : '') }),
        Field('pinned to evidence', a.differs.length
          ? a.differs.length + ' over evidence that moved'
          : a.pinned + ' of ' + (a.pinned + a.unanchored + a.unverifiable),
        { kind: 'num', hint: a.differs.length
          ? a.differs.map(d => d.id + ' — ' + d.run + ' has changed since it was signed').join('\n')
          : a.unanchored + ' name no run, ' + a.unverifiable + ' name one but carry no hash' }),
        Field('reached, unpromised', reach
          ? reach.uncovered.length + ' of ' + reach.observed + ' places'
          : 'no journey run',
        { kind: 'num', hint: reach
          ? reach.journey + ' · ' + when(reach.ranAt) + '\n'
            + reach.uncovered.map(u => u.path + (u.title ? ' — ' + u.title : '')).join('\n')
          : 'a page run records one address, and one address is not a map: run a journey to ask this' }),
        Field('measured', now.length + (now.length === 1 ? ' target · ' : ' targets · ') + pur.product + ' runs'
          + (pur.instrument ? ' · ' + pur.instrument + ' proving the probes' : ''),
        { kind: 'num', hint: last ? 'last ' + when(last.ranAt) + ' · ' + last.name : '' }),
        Field('standing now', worst ? Chip(worst) : '\u2014',
          { hint: 'the worst verdict across every target\u2019s latest run' }),
      ], { variant: 'panel' }));
    }))));

  // Rows the index holds that no project on this machine can seat. Not folded into the list above:
  // a path that is gone is not a project with nothing to say.
  const loose = INDEX.unseated || [];
  if (loose.length) box.append(Panel({ title: loose.length + ' path' + (loose.length === 1 ? '' : 's') + ' the index names that no project root answers for' },
    Fields(loose.map(g => Field(homey(g.project), g.count + (g.count === 1 ? ' run · ' : ' runs · ') + g.state,
      { kind: 'num', hint: g.reason })), { variant: 'panel' })));
  return box;
}

// ── one run ─────────────────────────────────────────────────────────────────
async function runScreen(stage, r) {
  const entry = INDEX.runs.find(x => x.dir === r.dir);
  if (!entry) { goScreen('runs'); return; }
  const sameRun = ENTRY?.dir === r.dir;
  if (!sameRun) {
    try { const res = await fetch('/api/run?dir=' + encodeURIComponent(r.dir)); if (!res.ok) throw new Error();
      RUN = await res.json(); }
    catch { RUN = null; ENTRY = null; stage.textContent = ''; return stage.append(missing(r.dir)); }
    ENTRY = entry; STEP = 0; PROBE = null; TAB = null; EVTAB = 'shot';
  }
  const ordered = probesOrdered();
  TAB = r.tab || TAB || (RUN.journey ? 'map' : 'probes');
  PROBE = r.probe || PROBE || ordered[0]?.probe || null;
  if (r.step !== null && !Number.isNaN(r.step)) STEP = r.step;
  // The rail lights the list this run came out of, and that depends on the packet, which has only
  // just arrived. Set it here rather than in show(), where RUN was still the previous run.
  const here = RUN.journey ? 'journeys' : 'pages';
  for (const link of document.querySelectorAll('[data-view]'))
    link.setAttribute('aria-current', link.dataset.view === here ? 'page' : 'false');
  title(entry.name || leaf(entry.dir));
  stage.textContent = '';
  stage.append(renderRun({ focusCurrent: sameRun }));
}

const missing = dir => Wrap(Empty('The packet is gone',
  el('p', { text: 'This run is still in the index, but run.json is no longer on disk:' }),
  el('p', {}, Code(homey(dir))),
  el('p', { text: 'The index points; it never keeps a copy. Re-run it, or drop the line — either is fine.' }),
  Btn('forget this line', {}, async () => { await fetch('/api/forget?dir=' + encodeURIComponent(dir)); goScreen('runs'); boot(); })));

const probesOrdered = () => (RUN?.probes || []).slice().sort((a, b) => byRank(a.verdict, b.verdict));
const shotUrl = f => '/file?dir=' + encodeURIComponent(ENTRY.dir) + '&f=' + encodeURIComponent(f);

// Three things happen to a step and they are three different things: it was measured, it stopped
// part-way, or it was never reached at all. A reader who cannot tell the last two apart cannot tell
// "we looked and found nothing" from "we never looked".
function frames() {
  if (!RUN?.steps?.length) return [];
  const labels = stepLabels(RUN.steps.map(s => s.url));
  const out = RUN.steps.map((s, k) => ({ ...s, state: s.error ? 'stopped' : 'ran', path: labels[k] }));
  for (let i = out.length; i < (RUN.stepCount || 0); i++) out.push({ i, state: 'never', path: '—' });
  if (RUN.finalShot) out.push({ i: 'final', shot: RUN.finalShot, state: 'ran', final: true,
    path: 'after the last step', url: RUN.steps[RUN.steps.length - 1]?.url });
  return out;
}

// Which steps a probe pinned itself to. Only what the probe actually recorded — `reasked`,
// `satisfied` and `inversion` name steps, and nothing else here infers one. Inventing an
// attribution would be the one dishonest pixel on the page.
const pinnedSteps = p => [...new Set([
  ...(p.reasked || p.evidence?.reasked || []).map(m => m.step),
  ...(p.satisfied || p.evidence?.satisfied || []).map(m => m.step),
  ...(p.evidence?.inversion ? [p.evidence.inversion.stepA, p.evidence.inversion.stepB] : []),
])].filter(n => n !== undefined);

// step index → the probes that pinned themselves there, worst first.
function byStep() {
  const at = new Map();
  for (const p of probesOrdered()) for (const n of pinnedSteps(p))
    (at.get(n) || at.set(n, []).get(n)).push(p);
  return at;
}

// Every step→step link any probe recorded. 3.3.7 is the only one that records a pair today: a
// field a later step asked for again, and the step it was first entered on.
function relations() {
  const out = [];
  for (const p of probesOrdered()) {
    const label = p.sc || shortName(p.probe);
    for (const m of (p.reasked || p.evidence?.reasked || [])) out.push({
      verdict: p.verdict, from: `step ${m.firstEnteredStep}`, to: `step ${m.step}`,
      field: m.field?.label || m.field?.id || m.field?.name || 'a field',
      how: `${label} · asked again, matched by ${m.matchedBy}` });
    for (const m of (p.satisfied || p.evidence?.satisfied || [])) out.push({
      verdict: 'pass', from: `step ${m.firstEnteredStep}`, to: `step ${m.step}`,
      field: m.field?.label || m.field?.id || m.field?.name || 'a field',
      how: `${label} · carried over, ${m.mechanism || 'no mechanism recorded'}` });
  }
  return out;
}

function renderRun({ focusCurrent = false } = {}) {
  const probes = RUN.probes || [], counts = tallyOf(probes);
  const worst = probesOrdered()[0]?.verdict || 'not-applicable';
  const fr = frames();
  const isFlow = !!RUN.journey;
  const box = Wrap();
  const body = RunBody();

  // One target, so there is nothing to be unique against and the ladder gives its shortest rung —
  // which is what a heading wants, because the line under it is the raw address in full.
  const [name] = labelTargets([ENTRY]);
  body.append(RunHead({
    back: isFlow ? 'All journeys' : 'All pages',
    backTo: () => goScreen(isFlow ? 'journeys' : 'pages'),
    title: RUN.journey || RUN.title || name.leaf || ENTRY.name,
    verdict: worst, kind: ENTRY.kind, project: homey(ENTRY.project),
    ranAt: 'ran ' + when(RUN.ranAt),
    path: RUN.finalUrl || RUN.url || homey(ENTRY.dir),
    actions: command()
      ? Btn('copy the command', { title: 'the command that produced this run' },
        e => copy(command(), 'the command', e.currentTarget))
      : Btn('copy the packet path', { title: 'this packet does not record the journey file it was read from' },
        e => copy(ENTRY.dir + '/run.json', 'the packet path', e.currentTarget)),
  }));

  // `exit` was added on 2026-09-20. Every run measured before it carries null, and null is shown as
  // null — deriving a number nobody stored would be the one dishonest figure on the page.
  const code = Number.isInteger(ENTRY.exit) ? ENTRY.exit : null;
  const why = code === 2 ? 'a probe reported fail'
    : code === 1 ? 'the run could not be carried out'
      : code === 0 ? 'no probe reported fail — which is not a verdict on the interface'
        : 'this run predates the field, and nothing stored one';
  const figures = [{ label: 'probes', value: probes.length }];
  if (isFlow) figures.unshift({ label: 'steps', value: `${(RUN.steps || []).length}/${RUN.stepCount ?? '?'}` });
  body.append(StatStrip({ figures, counts,
    exit: { code, why, verdict: code === 2 ? 'fail' : code === 1 ? 'unmeasurable' : code === 0 ? 'pass' : 'not-committed' } }));

  // A journey that stopped early is not a journey that passed. Every probe read the steps that ran
  // and nothing else, so "nothing failed" is a true sentence about a page nobody finished.
  const ran = (RUN.steps || []).length, declared = RUN.stepCount || 0;
  if (declared && ran < declared) body.append(Note('review',
    el('b', { text: `${ran} of ${declared} steps ran. ` }),
    document.createTextNode(`The ${declared - ran === 1 ? 'last step was' : `last ${declared - ran} steps were`} never measured.`)));

  const tabs = isFlow
    ? [{ id: 'map', label: 'Journey map', n: fr.length }, { id: 'probes', label: 'Probes', n: probes.length },
      { id: 'info', label: 'Run info' }]
    : [{ id: 'probes', label: 'Probes', n: probes.length }, { id: 'info', label: 'Run info' }];
  if (!tabs.some(t => t.id === TAB)) TAB = tabs[0].id;
  body.append(Tabs(tabs, TAB, id => goRun(ENTRY.dir, { tab: id })));

  body.append(TAB === 'map' ? mapTab(fr, { focusCurrent })
    : TAB === 'probes' ? probeTab({ focusCurrent })
      : infoTab(fr));
  box.append(body);
  return box;
}

// The command that made this run — when the packet holds enough to write it, and null when it does
// not. A page run stores its url, so the line is exact. A journey run stores the journey's NAME and
// never the file it was read from, so there is no way to name it from here: the version that filled
// the gap by guessing `<dir>/../<dir>.json` was printing a path nobody had measured, on the one page
// whose whole claim is that it prints only what was measured.
const command = () => RUN.journey ? null
  : `npx @junixlabs/uxcli run ${RUN.finalUrl || RUN.url || ''}`;

// ── the map tab ─────────────────────────────────────────────────────────────
function mapTab(fr, { focusCurrent }) {
  const at = byStep();
  if (STEP >= fr.length) STEP = 0;
  const box = Stack();

  const broke = (RUN.steps || []).findIndex(x => x.error);
  if (broke >= 0) box.append(Note('refused', el('b', { text: `Step ${broke} did not finish. ` }),
    document.createTextNode('Nothing after it was measured.')));

  box.append(FlowMap(fr.map((f, k) => ({
    badge: f.final ? '✓' : String(f.i),
    name: f.final ? 'outcome' : f.path,
    sub: f.title ? shorten(f.title, 24) : (f.url ? host(f.url) : ''),
    url: f.url, state: f.state, shot: f.shot ? shotUrl(f.shot) : null,
    how: f.arrivedBy || '', current: k === STEP,
    chips: (at.get(f.i) || []).map(p => ({ verdict: p.verdict, label: p.sc || shortName(p.probe) })),
  })), k => goRun(ENTRY.dir, { step: k })));

  const f = fr[STEP] || {};
  const here = at.get(f.i) || [];
  const stepTo = d => { if (fr[STEP + d]) goRun(ENTRY.dir, { step: STEP + d }); };
  PAGE = stepTo;

  box.append(Panes(
    Pane({ title: `${fr.length} frame${fr.length === 1 ? '' : 's'}` },
      StepList(fr.map((x, k) => ({
        badge: x.final ? '✓' : x.i, name: x.final ? 'outcome' : x.path,
        state: x.state, verdict: (at.get(x.i) || [])[0]?.verdict || null, current: k === STEP,
      })), k => goRun(ENTRY.dir, { step: k }))),

    Pane({ title: f.final ? 'Outcome' : `Step ${f.i}`,
      action: Pager({ what: 'frame', atStart: STEP === 0, atEnd: STEP === fr.length - 1,
        label: `${STEP + 1} of ${fr.length}` }, stepTo) },
    here.length
      ? here.map(p => probeCardOf(p, { current: p.probe === PROBE,
        click: () => goRun(ENTRY.dir, { probe: p.probe, tab: 'probes' }) }))
      : Nothing(f.state === 'never'
        ? 'This step was never reached, so no probe could pin anything to it.'
        : 'No probe pinned a conclusion to this step. That is not a pass — it is the absence of one.')),

    stepEvidence(f)));
  if (focusCurrent) requestAnimationFrame(() => { /* focus stays where the reader put it */ });
  return box;
}

// The evidence for one step: the frame that was kept, what the step carried, and every link a probe
// drew between this step and another one.
function stepEvidence(f) {
  const tabs = [{ id: 'shot', label: 'Screenshot' }, { id: 'data', label: 'Step data' },
    { id: 'rel', label: 'Relationships', n: relations().length }];
  if (!tabs.some(t => t.id === EVTAB)) EVTAB = 'shot';
  const body = Stack();

  if (EVTAB === 'shot') {
    const px = Caption('');
    body.append(Frame({ src: f.shot ? shotUrl(f.shot) : null, alt: `step ${f.i}`,
      miss: f.state === 'never' ? 'This step was never reached, so there is nothing to show.'
        : 'No frame was captured for this step.',
      onLoad: img => { px.textContent = `${img.naturalWidth} × ${img.naturalHeight}`; } }));
    body.append(Caption([f.url, f.startedAt ? `captured at ${clock(f.startedAt)} · took ${f.ms} ms` : null,
      f.arrivedBy ? `arrived by ${f.arrivedBy}` : null, f.error || f.flowBreak || null].filter(Boolean).join('\n')));
    body.append(px);
    if (f.shot) body.append(Acts(Link('open full screenshot ↗', shotUrl(f.shot))));
  } else if (EVTAB === 'data') {
    const inputs = f.inputsOnArrival || [];
    body.append(Fields([
      Field('url', f.url || '—'),
      Field('title', f.title || '—'),
      Field('arrived by', f.arrivedBy || '—'),
      Field('scope', f.scope || '—'),
      Field('segment', f.segment === undefined ? '—' : String(f.segment), { kind: 'num' }),
      Field('took', f.ms === undefined ? '—' : f.ms + ' ms', { kind: 'num' }),
      Field('fields on arrival', String(inputs.length), { kind: 'num' }),
    ], { variant: 'panel' }));
    if (inputs.length) body.append(Fields(inputs.map(i =>
      Field(i.label || i.id || i.name || i.type, i.value ? `${i.type} · ${i.value}` : i.type,
        { kind: i.value ? '' : 'nil' })), { variant: 'nested' }));
  } else {
    body.append(Rel(relations()));
  }

  return Pane({ title: 'Evidence',
    action: Tabs(tabs, EVTAB, id => { EVTAB = id; show(); }) }, body);
}

// ── the probes tab ──────────────────────────────────────────────────────────
const probeCardOf = (p, { current = false, click = null } = {}) => ProbeCard({
  verdict: p.verdict, criterion: p.sc || shortName(p.probe), name: shortName(p.probe),
  provenance: p.provenance || '—', method: (p.method || '—').replace('method-', ''),
  unproven: /unproven/.test(p.method || ''),
  what: p.cite?.what || p.what || '', why: p.cite?.check || p.why || p.check || '', current,
}, click);

function probeTab({ focusCurrent }) {
  const list = probesOrdered();
  const p = list.find(x => x.probe === PROBE) || list[0];
  const i = list.indexOf(p);
  const to = d => { const nx = list[i + d]; if (nx) goRun(ENTRY.dir, { probe: nx.probe }); };
  PAGE = to;

  const box = Stack();
  box.append(Panel({ title: `${list.length} probe${list.length === 1 ? '' : 's'}`, scroll: true },
    ProbeTable(list.map(x => ({
      criterion: x.sc || shortName(x.probe), name: shortName(x.probe), provenance: x.provenance || '',
      method: (x.method || '').replace('method-', ''), unproven: /unproven/.test(x.method || ''),
      verdict: x.verdict, detail: x.cite?.what || x.what || x.why || '', current: x.probe === PROBE,
      probe: x.probe,
    })), r => goRun(ENTRY.dir, { probe: r.probe }), { focusCurrent })));
  if (p) box.append(Panes(
    Pane({ title: 'What it found' }, probeCardOf(p, { current: true })),
    Pane({ title: 'Evidence',
      action: Pager({ what: 'probe', atStart: i === 0, atEnd: i === list.length - 1,
        label: `${i + 1} of ${list.length}` }, to) }, ...evidenceOf(p))));
  return box;
}

// What a probe recorded, laid out. Scalars are a row and that is all: turning every array of
// records into a table meant eight columns at 45px each and every value broken mid-token — a worse
// way to read the same data than the JSON it replaced. A list says how many it has and leaves the
// records to the raw packet below, which is also what the copy button hands an agent.
function packet(obj, depth = 0) {
  const rows = [];
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) { rows.push(Field(k, v.length ? `${v.length} recorded — in the packet below` : 'none', { kind: 'nil' })); continue; }
    if (v && typeof v === 'object') {
      rows.push(depth < 1 ? Field(k, packet(v, depth + 1), { kind: 'rows' })
        : Field(k, `${Object.keys(v).length} fields — in the packet below`, { kind: 'nil' }));
      continue;
    }
    rows.push(v === null || v === undefined || v === ''
      ? Field(k, '—', { kind: 'nil' })
      : Field(k, String(v), { kind: typeof v === 'number' || typeof v === 'boolean' ? 'num' : '' }));
  }
  return Fields(rows, { variant: depth ? 'nested' : 'panel' });
}

function evidenceOf(p) {
  const out = [];
  out.push(Fields([
    Field('provenance', p.provenance || '—'),
    Field('method', (p.method || '—').replace('method-', ''),
      { kind: /unproven/.test(p.method || '') ? 'unproven' : '' }),
    Field('where', p.cite?.where || p.where || '—'),
  ], { variant: 'panel' }));

  for (const g of (p.evidence?.groups || []).slice(0, 2)) if (g.fg && g.bg) {
    out.push(Specimen({ fg: g.fg, bg: g.bg }));
    const rows = [Field('colour pair', `${g.fg} on ${g.bg}`), Field('ratio', g.ratio + ':1', { kind: 'big' }),
      Field('across', `${g.count} text node${g.count === 1 ? '' : 's'}`)];
    if (g.example) rows.push(Field('example', g.example));
    if (g.fgToken || g.bgToken) rows.push(Field('token', [g.fgToken, g.bgToken].filter(Boolean).join(' / ')));
    out.push(Fields(rows, { variant: 'panel' }));
  }

  if (cause(p) === 'method-unproven')
    out.push(Note('held', document.createTextNode(`measured ${saw(p)}, reported ${p.verdict}: this probe's method is not validated yet, so it may not state a fail.`)));
  if (p.doctrine?.reread && !p.doctrine.reread.agreed)
    out.push(Note('refused', document.createTextNode(`read twice ${p.doctrine.reread.afterMs} ms apart and the page had changed between them, so the first read is not evidence.`)));
  if (p.doctrine?.reread?.agreed)
    out.push(Note('quiet', document.createTextNode(`confirmed by a second read ${p.doctrine.reread.afterMs} ms later, naming the same elements.`)));

  const pinned = pinnedSteps(p);
  if (pinned.length) out.push(Note('quiet',
    document.createTextNode(`pointed from step ${pinned.join(', ')} — `),
    Btn('show that frame', { kind: 'plain' }, () => goRun(ENTRY.dir, { tab: 'map', step: pinned[0] }))));

  const proof = (p.evidence?.proof || []).map(f => String(f).split('/').pop());
  if (proof.length) {
    const pairs = new Map(), loose = [];
    for (const f of proof) { const m = f.match(/^(.*)-(before|after)\.png$/i);
      if (m) (pairs.get(m[1]) || pairs.set(m[1], {}).get(m[1]))[m[2].toLowerCase()] = f; else loose.push(f); }
    for (const [name, pair] of pairs) out.push(Proof({ caption: name,
      sides: ['before', 'after'].filter(s => pair[s]).map(s => ({ label: s, src: shotUrl(pair[s]), alt: pair[s] })) }));
    for (const f of loose) out.push(Proof({ caption: f, sides: [{ src: shotUrl(f), alt: f }] }));
  }

  const raw = Raw(JSON.stringify(p, null, 1));
  out.push(Acts(Btn('copy for an agent', { title: 'the whole packet, ready to paste to an agent' },
    e => copyPacket(p, e.currentTarget, raw))));
  // `evidence` and nothing else. This used to be a denylist of fifteen field names kept in step by
  // hand — the panel printed whatever a probe returned and could not tell `groups` from
  // `axe: "4.13.0"`. The packet says which is which now, so the screen stops guessing.
  out.push(packet(p.evidence || {}));
  out.push(raw);
  return out;
}

// ── the info tab ────────────────────────────────────────────────────────────
function infoTab(fr) {
  const shots = (RUN.probes || []).reduce((n, x) => n + (x.evidence?.proof?.length || 0), 0)
    + (RUN.steps || []).filter(s => s.shot).length + (RUN.finalShot ? 1 : 0);
  const box = Stack();
  box.append(Panel({ title: 'This run' }, Fields([
    Field('kind', ENTRY.kind),
    Field('measured', `${day(RUN.ranAt)} ${clock(RUN.ranAt)}`),
    Field('uxcli', RUN.uxcli || '—'),
    Field('project', homey(ENTRY.project)),
    Field('packet', homey(ENTRY.dir) + '/run.json'),
    Field('images', String(shots), { kind: 'num' }),
    RUN.journey ? Field('steps', `${(RUN.steps || []).length} of ${RUN.stepCount} ran`) : null,
    RUN.journey ? null : Field('url', RUN.finalUrl || RUN.url || '—'),
  ].filter(Boolean), { variant: 'panel' })));
  box.append(Panel({ title: 'To measure it again' }, Cmds([
    command()
      ? { line: command(), what: 'the same measurement, on whatever the page says now', copy: copyCmd }
      : { line: 'npx @junixlabs/uxcli run <journey.json>',
        what: 'the packet records the journey by name and not by file, so this run cannot name the file it came from',
        copy: copyCmd },
    { line: 'npx @junixlabs/uxcli sheet', what: "this project's own commitments on its design tokens", copy: copyCmd },
  ])));
  box.append(Foot(el('span', { title: ENTRY.dir, text: `packet  ${shorten(homey(ENTRY.dir) + '/run.json', 58)}` }),
    document.createTextNode('   ·   '),
    Btn('open the folder', { kind: 'plain' }, () => fetch('/api/open?dir=' + encodeURIComponent(ENTRY.dir)))));
  return box;
}

// ── the clipboard ───────────────────────────────────────────────────────────
const copyCmd = (line, btn) => copy(line, 'the command', btn);

async function copyPacket(p, btn, raw) {
  const head = [
    `# uxcli · ${p.sc || shortName(p.probe)} · ${p.verdict}`,
    `run: ${ENTRY?.dir || ''}`,
    RUN?.journey ? `journey: ${RUN.journey} · ${(RUN.steps || []).length} of ${RUN.stepCount} steps ran`
      : `page: ${RUN?.finalUrl || RUN?.url || ''}`,
    `measured: ${RUN?.ranAt || ''}${RUN?.uxcli ? ` · uxcli ${RUN.uxcli}` : ''}`,
    p.sc ? `why: npx @junixlabs/uxcli why ${p.sc}` : null,
    '', '```json', JSON.stringify(p, null, 1), '```', ''].filter(x => x !== null).join('\n');
  copy(head, `${p.sc || shortName(p.probe)} packet`, btn, raw);
}

// One clipboard path for the whole page. Refused — no permission, or the page was opened over
// something that is not a secure context — is reported rather than swallowed, because a button that
// silently did nothing is the failure mode this page is least able to see. Reported twice, and both
// are needed: `say` is the one live region a screen reader hears, and the button says it itself,
// where a sighted reader is already looking.
async function copy(text, what = 'that line', btn = null, raw = null) {
  const flash = word => { if (!btn) return; const was = btn.textContent;
    btn.textContent = word; setTimeout(() => { btn.textContent = was; }, 1600); };
  try { await navigator.clipboard.writeText(text); flash('copied'); say(`copied · ${what}, ${text.length} chars`); }
  catch {
    if (raw) { raw.open = true; getSelection().selectAllChildren(raw.querySelector('pre')); }
    flash('refused');
    say('could not reach the clipboard' + (raw ? ' — the packet is selected below' : ''));
  }
}

// ── the page itself ─────────────────────────────────────────────────────────
let saidAt = 0;
function say(text) {
  const node = $('#say'); node.textContent = text;
  const mine = ++saidAt;
  setTimeout(() => { if (saidAt === mine) node.textContent = ''; }, 4000);
}
// Re-reading the index takes about 4 ms, which is exactly the problem: a button that gave no sign
// made "re-read, nothing new" and "did nothing" look identical. It always reports now.
async function reread() {
  const btn = $('#reload'), before = INDEX.runs.length;
  btn.setAttribute('aria-busy', 'true'); btn.disabled = true;
  const t0 = performance.now();
  RUN = null; ENTRY = null;
  await boot();
  const after = INDEX.runs.length, added = after - before;
  await new Promise(r => setTimeout(r, Math.max(0, 250 - (performance.now() - t0))));
  btn.disabled = false; btn.removeAttribute('aria-busy');
  say(added > 0 ? `${added} new run${added > 1 ? 's' : ''}`
    : added < 0 ? `${-added} run${added < -1 ? 's' : ''} gone`
      : `no change · ${after} run${after === 1 ? '' : 's'}`);
}

// localStorage can throw (a private window, blocked site data) and the page must open either way.
const remember = (k, v) => { try { localStorage.setItem(k, v); } catch { /* the page still works */ } };

// The search box lives in the bar, so it is mounted once and never rebuilt by a screen — which is
// what lets it keep focus and the caret while the list under it is redrawn.
$('#tools').prepend(Search({ value: Q, placeholder: 'runs, projects, urls…',
  label: 'search every run on this machine', hint: '⌘K' }, s => {
  Q = s;
  const r = route();
  if (r.view === 'run') goScreen('runs');
  else if (LEDGER.body) redraw(r.view);
  else show();
}));

on($('#reload'), reread);
on($('#theme'), () => {
  const root = document.documentElement, dark = root.getAttribute('data-theme') === 'dark';
  root.setAttribute('data-theme', dark ? 'light' : 'dark');
  remember('uxcli.theme', dark ? 'light' : 'dark');
  say(dark ? 'light' : 'dark');
});
addEventListener('hashchange', show);
addEventListener('keydown', e => {
  const t = e.target, typing = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable;
  // The bar prints ⌘K on the search box, so ⌘K has to focus it. A hint the page does not honour is
  // worse than no hint — `/` promised the same thing for a week and reached nothing.
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#q')?.focus(); return; }
  if (e.key === 'Escape' && typing) { t.blur(); return; }
  if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === '/') { e.preventDefault(); $('#q')?.focus(); return; }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    if (!PAGE) return; e.preventDefault(); PAGE(e.key === 'ArrowLeft' ? -1 : 1);
  }
});
boot();

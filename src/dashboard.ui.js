// The dashboard's components, in markup. Tier two of four; dashboard.components.css is its other half.
//
// One rule holds the tier together: **every class name on this page is written in this file**. A
// screen in dashboard.app.js asks for a Chip or a Field and never for a `<span class="…">`, which is
// why a verdict can only ever be drawn one way. `test/dashboard-system.mjs` asserts it — app.js is
// checked for `class` and must not contain one.
//
// What a component knows: shapes, states, and the seven verdicts. What it does not know: runs,
// probes, routes or the index. Everything above is normalised by the screen before it gets here, so
// a component can be read, and changed, without knowing what a probe is.
//
// W5 (2026-09-21) rebuilt the vocabulary against the two mockups in .claude/specs/design/mockups/.
// What it removed is as deliberate as what it added: the halftone, the pull quote, the creed, the
// doctrine block, the kicker and the two-line heading are gone. Together they were 40% of the words
// on a page whose job is to say which run needs a person.

export const $ = (s, r = document) => r.querySelector(s);
export const el = (t, a = {}, ...kids) => { const n = document.createElement(t);
  for (const [k, v] of Object.entries(a)) { if (v === null || v === undefined || v === false) continue;
    if (k === 'class') n.className = v; else if (k === 'text') n.textContent = v; else n.setAttribute(k, v); }
  for (const c of kids.flat()) if (c) n.append(c); return n; };
export const on = (n, f) => { n.addEventListener('click', f); return n; };
const txt = s => document.createTextNode(s);

// ── the vocabulary ──────────────────────────────────────────────────────────
// Worst first, always. Re-exported from core/, not restated, so the browser tier and the server sort
// by one list. `export … from` re-exports without binding the name locally, so import then export.
import { BY_ATTENTION as ORDER, byAttention as byRank } from './core/verdict/rank.js';
export { ORDER, byRank };
// The verdicts that can ask something of a person, in the order they ask it.
export const LOUD = ['fail', 'finding', 'unmeasurable'];
export const tallyOf = ps => ps.reduce((a, p) => (a[p.verdict] = (a[p.verdict] || 0) + 1, a), {});
// Never colour alone: a verdict is a shape as well, so it survives a monochrome screen, a photograph
// of one, and a reader who does not separate red from amber. One glyph per verdict, drawn once here.
const GLYPH = { fail: '✕', finding: '!', unmeasurable: '?', pass: '✓', 'not-applicable': '–',
  'not-committed': '○', suppressed: '⊘' };
// The one place a verdict becomes a class.
const v = verdict => 'v-' + verdict;
// And the one place it becomes a word. The seven names are keys in the packet — lowercase, hyphenated,
// matched on — and they were printed straight onto the screen, so the page read like a log file
// quoting itself. Capitalised here and nowhere else, so no two surfaces can disagree about it.
export const Said = verdict => String(verdict).replace(/-/g, ' ').replace(/^./, c => c.toUpperCase());

// ── formatting ──────────────────────────────────────────────────────────────
export const homey = p => String(p).replace(/^\/(Users|home)\/[^/]+/, '~');
export const leaf = p => String(p).split('/').filter(Boolean).pop() || '/';
// A path or url is printed so it can be recognised, not read end to end: the head names the machine,
// the tail names the file, and the middle is what gets cut. The full string stays in `title`.
export const shorten = (s, n = 66) => { s = String(s); return s.length <= n ? s : s.slice(0, Math.round(n * .42)) + '…' + s.slice(-Math.round(n * .52)); };
export const day = s => { try { return new Date(s).toISOString().slice(0, 10); } catch { return ''; } };
export const clock = s => { try { return new Date(s).toTimeString().slice(0, 8); } catch { return ''; } };
export const when = s => { try { const d = new Date(s), m = Math.round((Date.now() - d) / 60000);
  return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : day(s);
} catch { return String(s); } };
export const host = u => { try { return new URL(u).host || 'file'; } catch { return ''; } };
export const shortName = p => (p || '').replace(/^(flow|page)\./, '').replace(/-/g, ' ');
// What to call a step in a box 190px wide. Drop the scheme and authority whatever the scheme is,
// then drop the longest directory prefix every step has in common — a journey over `file:` urls was
// five steps all reading `file:///Us…`, every one named by the part they share.
export function stepLabels(urls) {
  const paths = urls.map(u => (u || '').replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]*/i, '') || '/');
  const segs = paths.map(p => p.split('/'));
  let common = 0;
  if (segs.length > 1) while (segs[0][common] !== undefined && segs.every(x => x.length > common + 1 && x[common] === segs[0][common])) common++;
  return segs.map(x => (common ? x.slice(common).join('/') : x.join('/')) || '/');
}
// A sentence a person performs, with the machine's own values still set as the machine's values:
// a colour, a token name, a flag or a ratio stays in the mono inside the sans.
const MEASURED = /(#[0-9a-fA-F]{3,8}\b|--[a-zA-Z][\w-]*(?:=[\w./-]+)?|\d+(?:\.\d+)?:1)/g;
export const sentence = text => { const out = document.createDocumentFragment();
  for (const part of String(text).split(MEASURED)) if (part)
    out.append(MEASURED.test(part) && (MEASURED.lastIndex = 0, true) ? el('code', { text: part }) : txt(part));
  return out; };

// ── atoms ───────────────────────────────────────────────────────────────────
export const Mark = verdict => el('i', { class: 'mark ' + v(verdict), 'aria-hidden': 'true', text: GLYPH[verdict] || '·' });
export const Dot = (verdict, { hollow = false, off = false } = {}) =>
  el('i', { class: 'dot ' + v(verdict) + (hollow ? ' is-hollow' : '') + (off ? ' is-off' : ''), 'aria-hidden': 'true' });
// A step's state is not a verdict and does not get a verdict's class — only, in one case, its hue.
export const StateDot = state => el('i', { class: 'dot is-' + state, 'aria-hidden': 'true' });
export const LiveDot = () => el('i', { class: 'dot is-live', 'aria-hidden': 'true' });
export const Chip = verdict => el('span', { class: 'chip ' + v(verdict), title: MEANS[verdict] || '' }, Mark(verdict), txt(Said(verdict)));
// What kind of thing was measured. Deliberately colourless: colour on this page means a verdict, and
// `page` is not a verdict. It is an outline chip so it reads as a category, not as a state.
export const KindChip = kind => el('span', { class: 'kind', text: kind });
export const Code = text => el('code', { class: 'code', text });
export const Eyebrow = (text, kind = 'section') => el('div', { class: 'eyebrow is-' + kind, text });

export const Btn = (label, { kind = '', title, ...rest } = {}, click) => {
  const b = el('button', { class: 'btn' + (kind ? ' is-' + kind : ''), type: 'button', title, ...rest });
  b.append(typeof label === 'string' ? txt(label) : label);
  return click ? on(b, click) : b;
};
export const Link = (label, href, rest = {}) =>
  el('a', { class: 'btn is-link', href, target: '_blank', rel: 'noreferrer', text: label, ...rest });

// One object for everything the page says in its own voice; the tone says which voice.
export const Note = (tone, ...kids) => el('p', { class: 'note is-' + tone }, ...kids);

// Something that scrolls sideways and does not say so is something nobody scrolls. The wrapper
// carries the fade because the scroller is sized by its content: a sticky child resolves to height 0.
export function Scroller(inner, { tone = 'panel' } = {}) {
  const box = el('div', { class: 'scroller is-' + tone }, inner, el('span', { class: 'scroller-fade', 'aria-hidden': 'true' }));
  const more = () => {
    const over = inner.scrollWidth > inner.clientWidth + 1;
    box.classList.toggle('is-more', inner.scrollLeft + inner.clientWidth < inner.scrollWidth - 1);
    // A scroll region is only a region while it scrolls. At full width the table fits, and an empty
    // tab stop sat between the navigation and the first row of the thing you came to read.
    if (over) { inner.setAttribute('tabindex', '0'); inner.setAttribute('role', 'region'); }
    else { inner.removeAttribute('tabindex'); inner.removeAttribute('role'); }
  };
  inner.addEventListener('scroll', more, { passive: true });
  new ResizeObserver(more).observe(inner);
  more();
  return box;
}

export const Frame = ({ src, alt = '', miss, size = 'full', onLoad } = {}) => {
  const box = el('div', { class: 'frame is-' + size });
  if (src) {
    const img = el('img', { src, alt, loading: 'lazy' });
    if (onLoad) img.addEventListener('load', () => onLoad(img));
    box.append(img);
  } else box.append(el('div', { class: 'frame-miss', text: miss || 'no shot' }));
  return box;
};

// ── the shell ───────────────────────────────────────────────────────────────
export const Wrap = (...kids) => el('div', { class: 'wrap' }, ...kids);
// The four arrangements a screen is allowed to make. A screen composes components; the moment it
// writes its own `class` the tier is gone and the four naming schemes start growing back, so even
// a bare flex column is a component with a name.
export const Hero = (...kids) => el('div', { class: 'hero' }, ...kids);
export const Band = (title, action) => el('div', { class: 'band' }, el('h2', { text: title }), action || null);
export const Stack = (...kids) => el('div', { class: 'stack' }, ...kids);
export const RunBody = (...kids) => el('div', { class: 'runbody' }, ...kids);
// One sentence saying a thing is absent. Absence is a reading, not a blank.
export const Nothing = text => el('p', { class: 'nothing', text });

// The search box in the top bar. The shortcut printed on it is the shortcut that works — a hint the
// page does not honour is worse than no hint.
export const Search = ({ value = '', placeholder, label, hint }, type) => {
  const input = el('input', { id: 'q', type: 'search', value, placeholder, 'aria-label': label });
  input.addEventListener('input', e => type(e.target.value.trim()));
  return el('span', { class: 'search' },
    el('i', { class: 'search-ico', 'aria-hidden': 'true', text: '⌕' }),
    input, el('kbd', { class: 'search-key', text: hint }));
};

// ── molecules ───────────────────────────────────────────────────────────────
// The same counts at three sizes, from one component: dots in a dense row, small marks in a table
// cell, words where there is room for them.
// Two modes, because two are drawn. A third existed — verdict names spelled out — and nothing has
// built it since the projects screen stopped summarising the log; a variant the page cannot style is
// a trap for whoever reaches for it next.
export const Tally = (counts, { mode = 'dots', only = ORDER } = {}) => {
  const box = el('span', { class: 'tally' + (mode === 'dots' ? '' : ' is-' + mode) });
  for (const verdict of only) {
    const n = counts[verdict] || 0;
    if (mode === 'chips' && !n) continue;
    const item = el('span', { class: 'tally-item ' + v(verdict) + (n || mode !== 'dots' ? '' : ' is-zero'),
      title: `${n} ${verdict}` });
    if (mode === 'dots') item.append(Dot(verdict, { hollow: verdict === 'not-committed' }), txt(String(n)));
    else item.append(Mark(verdict), txt(String(n)));
    box.append(item);
  }
  return box;
};

// Three figures at the top right of the home screen: how much there is, across how many projects,
// and how stale it all is. Each is a label and a value and nothing else.
export const MetaStrip = items => el('div', { class: 'meta-strip' },
  items.map(m => el('div', { class: 'meta-one' },
    el('span', { class: 'meta-k', text: m.label }),
    el('span', { class: 'meta-v', text: String(m.value) }))));

// Seven tiles, one per verdict, each with the count and what the count asks of a person. The action
// line is the point of the row: six of the seven verdicts leave the exit code at 0, so a reader
// scanning numbers alone cannot tell which of them wants them.
export const VerdictTiles = (counts, says, onPick) => {
  const box = el('div', { class: 'vtiles' });
  for (const verdict of ORDER) {
    const n = counts[verdict] || 0;
    const tile = el('button', { class: 'vtile ' + v(verdict) + (n ? '' : ' is-zero'), type: 'button',
      'aria-label': `${n} ${verdict} — ${says[verdict]}` },
      el('span', { class: 'vtile-n', text: String(n) }),
      el('span', { class: 'vtile-k', text: Said(verdict) }),
      el('span', { class: 'vtile-say', text: says[verdict] }));
    box.append(on(tile, () => onPick(verdict)));
  }
  return box;
};

// A run that wants a person, as a card. Everything on it is a fact from the index: no card is drawn
// for a run the index cannot describe.
export const AttentionCards = (cards, onPick) => el('div', { class: 'attend' },
  cards.map(c => on(el('button', { class: 'acard ' + v(c.verdict), type: 'button' },
    el('span', { class: 'acard-top' },
      Dot(c.verdict), KindChip(c.kind), el('span', { class: 'acard-when', text: c.when })),
    TargetCell(c.label),
    el('span', { class: 'acard-foot' },
      el('span', { class: 'acard-proj', title: c.project, text: c.project }),
      el('span', { class: 'acard-num' }, Tally(c.counts, { mode: 'chips', only: LOUD })))),
  () => onPick(c))));

// What was measured, in two lines. Line one is identity and it is as short as it can be while
// still telling this row from its neighbours; line two is where the thing lives. Splitting them is
// what stops a reader parsing a browser address to learn what was measured — on this machine the
// raw strings run to a median of 77 characters and 11 slashes, and seven of them are an absolute
// path percent-encoded inside a hash route. The raw value stays on the element, so it is one hover
// away and never gone.
export const TargetCell = ({ head, stem, leaf, context, raw }) =>
  el('div', { class: 'target', title: raw || leaf },
    el('span', { class: 'target-id' },
      head || stem ? el('span', { class: 'target-stem', text: [head, stem].filter(Boolean).join('/') + '/' }) : null,
      el('b', { class: 'target-leaf', text: leaf })),
    // Always drawn, even empty. The second line is what keeps every row the same height, and a
    // table whose rows change height by a few pixels depending on their content is harder to run an
    // eye down than one that repeats a word.
    el('span', { class: 'target-ctx', text: context || '' }));

// ── the ledger ──────────────────────────────────────────────────────────────
const LEDGER_COLS = ['ran at', 'what was measured', 'kind', 'project', 'worst', 'probes', 'exit'];
export function Ledger(rows, onPick) {
  const body = el('tbody');
  for (const r of rows) {
    const tr = el('tr', { 'aria-current': String(!!r.current) },
      el('td', { class: 't-when', text: r.when }),
      el('td', { class: 't-target' }, TargetCell(r.label)),
      el('td', {}, KindChip(r.kind)),
      el('td', { class: 't-proj', title: r.projectFull, text: r.project }),
      el('td', {}, Chip(r.verdict)),
      el('td', { class: 't-num', text: String(r.probes) }),
      // Null is what the index holds for every run measured before the exit code was recorded. An
      // em dash is the truthful glyph for it; a 0 there would be a number nobody stored.
      el('td', { class: 't-num' }, r.exit === null || r.exit === undefined
        ? txt('—') : el('b', { class: v(r.verdict), text: String(r.exit) })));
    tr.addEventListener('click', () => onPick(r));
    body.append(tr);
  }
  const scroll = el('div', { class: 'scroller-box', 'aria-label': 'runs, scrolls sideways when narrow' },
    el('table', { class: 'ledger' },
      el('thead', {}, el('tr', {}, LEDGER_COLS.map(h => el('th', { text: h })))), body));
  return Scroller(scroll);
}

// A row of controls over a list. More than one control needs a flex parent: a bare span is inline,
// so the search box and the filters wrapped onto two lines instead of sitting side by side.
export const Filters = (...kids) => el('div', { class: 'filters' }, ...kids);

export const Panel = ({ title, action, scroll = false, ref }, ...kids) => {
  const head = el('h2', { text: title });
  const body = el('div', { class: 'panel-body' + (scroll ? ' panel-scroll' : '') }, ...kids);
  if (ref) { ref.title = head; ref.body = body; }
  return el('section', { class: 'panel', 'aria-label': title },
    el('div', { class: 'panel-head' }, head, action || null), body);
};

// ── a run ───────────────────────────────────────────────────────────────────
// The header of one run: where it sits, what it is, and the two things you can do with it from here.
export const RunHead = ({ back, backTo, title, verdict, kind, project, path, ranAt, actions }) => {
  const box = el('header', { class: 'runhead' });
  box.append(on(el('button', { class: 'runhead-back', type: 'button' }, txt('← ' + back)), backTo));
  box.append(el('div', { class: 'runhead-line' },
    el('h1', { text: title }), Chip(verdict), KindChip(kind),
    el('span', { class: 'runhead-proj', title: project, text: project }),
    el('span', { class: 'runhead-when', text: ranAt }),
    actions ? el('span', { class: 'runhead-acts' }, actions) : null));
  if (path) box.append(el('p', { class: 'runhead-path', title: path, text: path }));
  return box;
};

// What the run counted, in one band: the plain figures first, then one cell per verdict, then the
// exit code with the sentence that explains it. The exit cell is the only one that carries a reason,
// because it is the only number a CI job reads.
export const StatStrip = ({ figures, counts, exit }) => {
  const box = el('div', { class: 'strip' });
  for (const f of figures) box.append(el('div', { class: 'strip-cell' },
    el('span', { class: 'strip-k', text: f.label }), el('span', { class: 'strip-n', text: String(f.value) })));
  for (const verdict of ORDER) {
    const n = counts[verdict] || 0;
    box.append(el('div', { class: 'strip-cell ' + v(verdict) + (n ? '' : ' is-zero') },
      el('span', { class: 'strip-n is-hue', text: String(n) }),
      el('span', { class: 'strip-k', text: Said(verdict) })));
  }
  box.append(el('div', { class: 'strip-exit ' + v(exit.verdict) },
    el('span', { class: 'strip-k', text: 'exit code' }),
    el('span', { class: 'strip-n', text: exit.code === null ? '—' : String(exit.code) }),
    el('span', { class: 'strip-why', text: exit.why })));
  return box;
};

// One tab bar, used by the run screen and by the evidence pane. The current tab is a real state in
// the url, so a link to one tab of one run is a link somebody else can open.
export function Tabs(tabs, current, onPick) {
  const box = el('div', { class: 'tabs', role: 'tablist' });
  for (const t of tabs) {
    const b = el('button', { class: 'tab', type: 'button', role: 'tab',
      'aria-selected': String(t.id === current) }, txt(t.label));
    if (t.n !== undefined && t.n !== null) b.append(el('span', { class: 'tab-n', text: String(t.n) }));
    box.append(on(b, () => onPick(t.id)));
  }
  return box;
}

// The journey, as designers draw it: one node per step, in order, with the frame that was kept and
// the verdicts that were pinned to it. An arrow is drawn between two nodes only because the run
// recorded that one followed the other — nothing here infers an edge.
export function FlowMap(nodes, onPick) {
  const box = el('div', { class: 'flow', role: 'group', 'aria-label': 'the journey, in order' });
  nodes.forEach((s, k) => {
    if (k) box.append(el('span', { class: 'flow-arrow', 'aria-hidden': 'true' },
      el('span', { class: 'flow-how', text: s.how || '' })));
    const node = el('button', { class: 'node is-' + s.state, type: 'button',
      'aria-current': String(!!s.current), title: s.url || '' },
      el('span', { class: 'node-top' },
        el('span', { class: 'node-i', text: s.badge }),
        el('span', { class: 'node-name', text: s.name })),
      Frame({ src: s.shot, size: 'node',
        miss: s.state === 'never' ? 'no evidence exists' : 'no frame kept' }),
      el('span', { class: 'node-sub', text: s.sub }),
      el('span', { class: 'node-chips' }, s.chips.length
        ? s.chips.map(c => el('span', { class: 'ministat ' + v(c.verdict) },
          Mark(c.verdict), txt(c.label)))
        : el('span', { class: 'node-none', text: s.state === 'never' ? 'never ran' : 'nothing pinned here' })));
    box.append(on(node, () => onPick(k)));
  });
  return Scroller(box, { tone: 'bare' });
}

// The same steps as a column, for the pane under the map. A dot, a number, a name — and the dot is
// the worst verdict pinned to that step, or the step's own state when nothing is pinned.
export function StepList(rows, onPick) {
  const box = el('ol', { class: 'steplist' });
  rows.forEach((r, k) => box.append(el('li', {},
    on(el('button', { class: 'steprow', type: 'button', 'aria-current': String(!!r.current) },
      r.verdict ? Dot(r.verdict) : StateDot(r.state),
      el('span', { class: 'steprow-i', text: String(r.badge) }),
      el('span', { class: 'steprow-name', text: r.name })), () => onPick(k)))));
  return box;
}

// One probe, as a card rather than a table row. The table survives on the Probe results tab, where
// the question is "how do these compare"; a card is what answers "what did this one find".
export const ProbeCard = ({ verdict, criterion, name, provenance, method, unproven, what, why, current }, click) => {
  const box = el('article', { class: 'pcard ' + v(verdict) + (current ? ' is-current' : '') });
  box.append(el('header', { class: 'pcard-head' },
    Chip(verdict),
    el('b', { class: 'pcard-crit', text: criterion }),
    el('span', { class: 'pcard-name', text: name }),
    el('span', { class: 'pcard-tags' },
      el('span', { class: 'tag', text: provenance }),
      el('span', { class: 'tag' + (unproven ? ' is-unproven' : ''), text: method }))));
  if (what) box.append(el('div', { class: 'pcard-row' },
    el('span', { class: 'pcard-k', text: 'what' }), el('p', { class: 'pcard-v' }, sentence(what))));
  if (why) box.append(el('div', { class: 'pcard-row' },
    el('span', { class: 'pcard-k', text: 'why' }), el('p', { class: 'pcard-v is-why', text: why })));
  return click ? on(box, click) : box;
};

const PROBE_COLS = ['criterion', 'probe', 'provenance', 'method', 'verdict', 'what'];
export function ProbeTable(rows, onPick, { focusCurrent = false } = {}) {
  const body = el('tbody');
  for (const r of rows) {
    const tr = el('tr', { class: v(r.verdict), 'aria-current': String(r.current) },
      el('td', {}, el('div', { class: 'cell is-crit' },
        on(el('button', { type: 'button', text: r.criterion }),
          e => { e.stopPropagation(); onPick(r); }))),
      el('td', {}, el('div', { class: 'cell is-name', text: r.name })),
      el('td', {}, el('div', { class: 'cell', text: r.provenance })),
      el('td', {}, el('div', { class: 'cell' },
        el('span', { class: r.unproven ? 'is-unproven' : '', text: r.method }))),
      el('td', {}, el('div', { class: 'cell' }, Chip(r.verdict))),
      el('td', {}, el('div', { class: 'cell is-detail' }, el('span', { title: r.detail, text: r.detail }))));
    tr.addEventListener('click', () => onPick(r));
    body.append(tr);
  }
  const scroll = el('div', { class: 'scroller-box', 'aria-label': 'probes, scrolls sideways when narrow' },
    el('table', { class: 'probes' },
      el('thead', {}, el('tr', {}, PROBE_COLS.map(h => el('th', { text: h })))), body));
  const box = Scroller(scroll);
  if (focusCurrent) requestAnimationFrame(() => {
    const here = body.querySelector('tr[aria-current="true"] button');
    if (here) here.focus({ preventScroll: true });
  });
  return box;
}

// What one step re-asked for, and where it was first entered. This is the only screen-to-screen
// relationship uxcli measures, and it is measured — 3.3.7 records the pair, and this draws the pair.
export function Rel(rows) {
  if (!rows.length) return Nothing('No probe recorded a link between two steps in this run.');
  const box = el('div', { class: 'rel' });
  for (const r of rows) box.append(el('div', { class: 'rel-row ' + v(r.verdict) },
    el('span', { class: 'rel-from', text: r.from }),
    el('span', { class: 'rel-arrow', 'aria-hidden': 'true' }),
    el('span', { class: 'rel-to', text: r.to }),
    el('span', { class: 'rel-what', text: r.field }),
    el('span', { class: 'rel-how', text: r.how })));
  return box;
}

export function Pager({ label, atStart, atEnd, what }, move) {
  return el('span', { class: 'pager' },
    Btn('‹', { disabled: atStart, title: `previous ${what} (←)`, 'aria-label': `previous ${what}` }, () => move(-1)),
    el('span', { class: 'pager-label', text: label }),
    Btn('›', { disabled: atEnd, title: `next ${what} (→)`, 'aria-label': `next ${what}` }, () => move(1)));
}

// One label and one value, and every label/value on the page is this.
// `hint` is the long form, and it belongs on the element rather than on the page: the reading is the
// number, and the sentence behind it is for whoever stops on it.
export const Field = (k, value, { kind = '', hint = '' } = {}) => el('div', { class: 'field' },
  el('dt', { text: k, title: hint || null }),
  typeof value === 'string' || value === null || value === undefined
    ? el('dd', { class: kind ? 'is-' + kind : '', text: value ?? '\u2014', title: hint || null })
    : el('dd', { class: kind ? 'is-' + kind : '', title: hint || null }, value));
export const Fields = (rows, { variant = '' } = {}) =>
  el('dl', { class: 'fields' + (variant ? ' is-' + variant : '') }, rows);

export const Specimen = ({ fg, bg, text = 'The quick brown fox jumps over the lazy dog' }) =>
  el('div', { class: 'specimen' },
    el('div', { class: 'specimen-sample', role: 'img', 'aria-hidden': 'true',
      'data-specimen': `${fg} on ${bg}`, style: `color:${fg};background:${bg}`, text }),
    el('div', { class: 'specimen-cap', text: 'the measured colours, as painted' }));

export const Proof = ({ caption, sides }) => el('figure', { class: 'proof' },
  el('div', { class: 'proof-two' }, sides.map(s => el('div', {},
    s.label ? Eyebrow(s.label, 'field') : null, el('img', { src: s.src, alt: s.alt || '', loading: 'lazy' })))),
  el('figcaption', { text: caption }));

export const Raw = json => el('details', { class: 'raw' },
  el('summary', { text: 'the packet as measured, raw' }), el('pre', { text: json }));

export const Acts = (...kids) => el('div', { class: 'acts' }, ...kids);
export const Caption = text => el('p', { class: 'caption', text });
export const Foot = (...kids) => el('p', { class: 'foot' }, ...kids);
export const Empty = (title, ...kids) => el('div', { class: 'empty' }, el('h1', { text: title }), ...kids);

// Three columns under the journey map: the steps, what was found at the one you picked, and the
// evidence for it. On a page run there are no steps, so the screen passes two.
export const Panes = (...kids) => el('div', { class: 'panes' }, ...kids);
export const Pane = ({ title, action, grow = false, ref }, ...kids) => {
  const head = el('h2', { text: title });
  const body = el('div', { class: 'pane-body' }, ...kids);
  if (ref) { ref.title = head; ref.body = body; }
  return el('section', { class: 'pane' + (grow ? ' is-grow' : ''), 'aria-label': title },
    el('div', { class: 'pane-head' }, head, action || null), body);
};

// APG's select-only combobox: a trigger that owns a popup list. Focus stays on the trigger and
// `aria-activedescendant` names the option being pointed at, so the whole control is one tab stop.
// https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/
let comboSeq = 0;
export function Combo({ options, at = 0, label }, choose) {
  const id = 'combo-' + (++comboSeq);
  const btn = el('button', { type: 'button', role: 'combobox', 'aria-controls': id,
    'aria-haspopup': 'listbox', 'aria-expanded': 'false', 'aria-label': label },
    el('span', { text: options[at].label }), el('span', { class: 'combo-caret', text: '▾' }));
  const ul = el('ul', { id, class: 'combo-list', role: 'listbox', 'aria-label': label, hidden: 'hidden' });
  options.forEach((o, i) => {
    const li = el('li', { class: 'combo-opt', role: 'option', id: id + '-' + i, 'aria-selected': String(i === at) },
      o.verdict ? Dot(o.verdict) : el('span', {}),
      el('span', { text: o.label }), el('span', { class: 'combo-note', text: o.note }));
    li.addEventListener('click', () => pick(i));
    ul.append(li);
  });
  const point = i => { at = (i + options.length) % options.length;
    for (const [k, li] of [...ul.children].entries()) li.classList.toggle('is-here', k === at);
    btn.setAttribute('aria-activedescendant', id + '-' + at);
    ul.children[at].scrollIntoView({ block: 'nearest' }); };
  const open = () => { ul.hidden = false; btn.setAttribute('aria-expanded', 'true'); point(at); };
  const shut = () => { ul.hidden = true; btn.setAttribute('aria-expanded', 'false');
    btn.removeAttribute('aria-activedescendant'); for (const li of ul.children) li.classList.remove('is-here'); };
  // A select-only combobox's trigger IS the selected value, and `aria-selected` is where a screen
  // reader reads it back. A component keeps its own state: the version that only called `choose`
  // stated the wrong filter the moment a screen redrew just the list beneath it.
  const pick = i => {
    at = i; shut(); btn.focus();
    btn.firstChild.textContent = options[i].label;
    for (const [k, li] of [...ul.children].entries()) li.setAttribute('aria-selected', String(k === i));
    choose(options[i], i);
  };
  const jump = ch => { const from = at + 1;
    for (let k = 0; k < options.length; k++) { const i = (from + k) % options.length;
      if (options[i].label.toLowerCase().startsWith(ch)) return point(i); } };

  btn.addEventListener('click', e => { e.stopPropagation(); ul.hidden ? open() : shut(); });
  btn.addEventListener('keydown', e => {
    const k = e.key, isOpen = !ul.hidden;
    if (!isOpen && ['ArrowDown', 'ArrowUp', 'Enter', ' ', 'Home', 'End'].includes(k)) {
      e.preventDefault(); open(); if (k === 'Home') point(0); else if (k === 'End') point(options.length - 1);
      else if (k === 'ArrowUp') point(at - 1); return;
    }
    if (isOpen) {
      if (k === 'Escape') { e.preventDefault(); return shut(); }
      if (k === 'Enter' || k === ' ') { e.preventDefault(); return pick(at); }
      if (k === 'Tab') return pick(at);
      if (k === 'ArrowDown') { e.preventDefault(); return point(at + 1); }
      if (k === 'ArrowUp') { e.preventDefault(); return point(at - 1); }
      if (k === 'Home') { e.preventDefault(); return point(0); }
      if (k === 'End') { e.preventDefault(); return point(options.length - 1); }
      if (k === 'PageDown') { e.preventDefault(); return point(Math.min(at + 5, options.length - 1)); }
      if (k === 'PageUp') { e.preventDefault(); return point(Math.max(at - 5, 0)); }
    }
    if (k.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) { if (!isOpen) open(); jump(k.toLowerCase()); }
  });
  addEventListener('click', () => { if (!ul.hidden) shut(); });
  return el('span', { class: 'combo' }, btn, ul);
}

// The commands, as commands. This server reads an index and serves files out of the directories in
// it; it starts no browser and runs nothing. A button here would be a button that lies.
export const Cmds = rows => el('div', { class: 'cmds' },
  rows.map(r => el('div', { class: 'cmd' },
    el('code', { class: 'line', text: r.line }),
    Btn('copy', { kind: 'plain', title: 'copy this line' }, e => r.copy(r.line, e.currentTarget)),
    el('p', { class: 'what', text: r.what }))));

// The vocabulary, written in the vocabulary, built from the same list the page sorts by so the two
// can never disagree about how many verdicts there are. Six of these seven leave the exit code at 0;
// only `fail` changes it, and only `pass` is a pass.
const MEANS = {
  fail: 'measured, and the probe is licensed to say so',
  finding: 'measured, but this method may not state a fail yet',
  unmeasurable: 'the probe declined — it could not get a reading it trusts',
  'not-committed': 'nobody signed a commitment, so there is nothing to judge against',
  suppressed: 'waived on the record, with a reason, never silently skipped',
  pass: 'satisfied',
  'not-applicable': 'there was nothing on the page to measure',
};
export const Legend = () => el('details', { class: 'legend', id: 'legend' },
  el('summary', { class: 'eyebrow' }, txt('What the seven verdicts mean')),
  el('ul', {}, ORDER.map(verdict => el('li', { class: 'legend-row' },
    Mark(verdict), el('span', { class: 'legend-word', text: Said(verdict) }), el('span', { text: MEANS[verdict] })))));

// ── the overview, rebuilt ───────────────────────────────────────────────────
// W7 (2026-09-23). What stood here answered "what failed", which the terminal already answers and
// answers faster. The page is opened for the question `uxcli run` refuses: exit 0 is a floor, four
// probes found no fail. So these components lead with reach and with what is promised, and the list
// of failures is fourth — after it has been said how much of the product was never looked at.

// The demand line. One figure, and beside it the runs that are the tool proving itself rather than
// anything a person ships: 22 of 83 here, 7 of 12 in the queue, which is most of what a reader would
// otherwise have had to sort by eye.
export const Demand = ({ need, label, aside, scope }) => el('div', { class: 'demand' },
  el('div', { class: 'demand-fig' }, el('b', { text: String(need) }), el('span', { text: label })),
  aside ? el('p', { class: 'demand-aside', text: aside }) : null,
  el('p', { class: 'demand-scope', text: scope }));

// One row per project: what it has promised, and what shape that promise has. `kinds` is the point —
// forty-two commitments that are all one kind is a narrow promise, and the count alone reads as
// breadth it does not have.
const STAGE = { unmanaged: 'hook-stage is-unmanaged', adopted: 'hook-stage is-adopted', enforced: 'hook-stage is-enforced' };
export const Hook = rows => el('div', { class: 'hook' }, rows.map(r => el('div', { class: 'hook-row' },
  el('span', { class: 'hook-name', text: r.name }),
  el('span', { class: STAGE[r.state] || STAGE.unmanaged }, el('i', { class: 'hook-rung' }), el('i', { class: 'hook-rung' }), el('i', { class: 'hook-rung' }), el('b', { text: r.state })),
  el('span', { class: 'hook-kinds', text: r.shape }),
  r.gap ? el('span', { class: 'hook-gap', text: r.gap }) : null,
  el('span', { class: 'hook-path', text: r.path }))));

// How far the instrument can see. Two facts a verdict tally cannot carry: how much measurement found
// nothing to measure, and how many rules are licensed to conclude anything at all.
export const Reach = ({ bars, foot }) => el('div', { class: 'reach' },
  el('div', { class: 'reach-bar' }, bars.map(b => el('i', { class: 'reach-seg ' + v(b.verdict), style: `flex:${b.n}`, title: `${b.n} ${b.verdict}` }))),
  el('div', { class: 'reach-keys' }, bars.map(b => el('span', { class: 'reach-key' },
    Dot(b.verdict), el('b', { text: String(b.n) }), el('span', { text: Said(b.verdict) })))),
  el('p', { class: 'reach-foot', text: foot }));

// Observed against committed. The bar is mostly empty on purpose: a project can measure a hundred
// screens and have promised nothing about any of them, and no tally of verdicts will ever say so.
export const Coverage = ({ observed, committed, foot }) => el('div', { class: 'reach' },
  el('div', { class: 'reach-bar' },
    el('i', { class: 'reach-seg v-pass', style: `flex:${committed || 0}` }),
    el('i', { class: 'reach-seg is-open', style: `flex:${Math.max(0, observed - committed)}` })),
  el('div', { class: 'reach-keys' },
    el('span', { class: 'reach-key' }, el('b', { text: String(committed) }), el('span', { text: 'carry a commitment' })),
    el('span', { class: 'reach-key' }, el('b', { text: String(observed - committed) }), el('span', { text: 'nobody has promised anything about' }))),
  el('p', { class: 'reach-foot', text: foot }));

// A target's runs, oldest to newest, right-aligned so the newest sits at one x on every row: a
// column of red down the right edge is the whole scan. One cell alone is a first measurement, and
// says so by being alone rather than by carrying a word.
const SLOTS = 7;
export const HistStrip = history => {
  const box = el('div', { class: 'hist' });
  const runs = history.slice(-SLOTS);
  for (let i = 0; i < SLOTS - runs.length; i++) box.append(el('i', { class: 'hist-gap' }));
  runs.forEach((r, i) => box.append(el('i', {
    class: 'hist-cell ' + v(r.verdict) + (i === runs.length - 1 ? ' is-now' : ''),
    title: `${Said(r.verdict)} · ${r.when}` })));
  return box;
};

// One row per target, not per run: a page that failed five times is one thing to fix, and a table
// that lists it five times has counted the work wrong.
export const Queue = (rows, onPick) => {
  const body = el('tbody');
  for (const r of rows) {
    const tr = el('tr', { class: r.drift === 'regressed' ? 'is-regressed' : null },
      el('td', {}, Chip(r.verdict)),
      el('td', { class: 'q-name' }, el('b', { text: r.name }), r.context ? el('span', { class: 'q-ctx', text: r.context }) : null),
      el('td', { class: 'q-hist' }, HistStrip(r.history)),
      el('td', { class: 'q-drift', title: r.drift }, r.drift === 'regressed' ? '▲' : r.drift === 'improved' ? '▼' : ''),
      el('td', { class: 'q-num', text: r.when }),
      el('td', { class: 'q-num', text: r.probes }));
    on(tr, () => onPick(r));
    body.append(tr);
  }
  return Scroller(el('div', { class: 'scroller-box', 'aria-label': 'targets, scrolls sideways when narrow' },
    el('table', { class: 'queue' },
      el('thead', {}, el('tr', {}, ['State', 'Target', 'History', '', 'Last run', 'Probes']
        .map(h => el('th', { text: h })))), body)));
};

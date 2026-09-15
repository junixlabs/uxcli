// The dashboard's components, in markup. Tier two of three; dashboard.components.css is its other half.
//
// One rule holds the tier together: **every class name on this page is written in this file**. A
// screen in dashboard.app.js asks for a Chip or a Field and never for a `<span class="…">`, which is
// why a verdict can only ever be drawn one way. `test/dashboard-system.mjs` asserts it — app.js is
// checked for `class` and must not contain one.
//
// What a component knows: shapes, states, and the six verdicts. What it does not know: runs, probes,
// routes or the index. Everything above is normalised by the screen before it gets here, so a
// component can be read, and changed, without knowing what a probe is.

export const $ = (s, r = document) => r.querySelector(s);
export const el = (t, a = {}, ...kids) => { const n = document.createElement(t);
  for (const [k, v] of Object.entries(a)) { if (v === null || v === undefined || v === false) continue;
    if (k === 'class') n.className = v; else if (k === 'text') n.textContent = v; else n.setAttribute(k, v); }
  for (const c of kids.flat()) if (c) n.append(c); return n; };
export const on = (n, f) => { n.addEventListener('click', f); return n; };
const txt = s => document.createTextNode(s);

// ── the vocabulary ──────────────────────────────────────────────────────────
// Worst first, always: the list, the table and the tiles are all read for "which one needs somebody".
export const ORDER = ['fail', 'finding', 'unmeasurable', 'pass', 'not-applicable', 'not-committed'];
// The four that can ask something of a person. The other two are states of the commitment, not of the
// page, and they are counted as words rather than given a tile each.
export const LOUD = ['fail', 'finding', 'unmeasurable', 'pass'];
const RANK = { fail: 0, finding: 1, unmeasurable: 2, pass: 3, 'not-applicable': 4, 'not-committed': 4 };
export const byRank = (a, b) => (RANK[a] ?? 5) - (RANK[b] ?? 5);
export const tallyOf = ps => ps.reduce((a, p) => (a[p.verdict] = (a[p.verdict] || 0) + 1, a), {});
// Never colour alone: a verdict is a shape as well, so it survives a monochrome screen, a photograph
// of one, and a reader who does not separate red from amber. One glyph per verdict, drawn once here.
const GLYPH = { fail: '✕', finding: '!', unmeasurable: '?', pass: '✓', 'not-applicable': '–', 'not-committed': '○' };
// The one place a verdict becomes a class. Every component that shows one calls this, so there is
// exactly one naming scheme on the page rather than the four that had grown.
const v = verdict => 'v-' + verdict;

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
export const shortName = p => (p || '').replace(/^(flow|page)\./, '').replace(/-/g, ' ');
// What to call a step in a box 130px wide. The old line stripped `https://host` and nothing else, so
// a journey over `file:` urls showed five steps all reading `file:///Us…` — every one named by the
// part they share and cut off before the part that tells them apart. Two steps: drop the scheme and
// authority whatever the scheme is, then drop the longest directory prefix every step has in common.
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
export const Chip = verdict => el('span', { class: 'chip ' + v(verdict) }, Mark(verdict), txt(verdict));
export const Code = text => el('code', { class: 'code', text });
export const Eyebrow = (text, kind = 'section') => el('div', { class: 'eyebrow is-' + kind, text });

// Three sizes of one object. `plain` is a button that is a sentence's own verb and sits inside
// running text; `link` is an anchor that behaves like a control.
export const Btn = (label, { kind = '', title, ...rest } = {}, click) => {
  const b = el('button', { class: 'btn' + (kind ? ' is-' + kind : ''), type: 'button', title, ...rest });
  b.append(typeof label === 'string' ? txt(label) : label);
  return click ? on(b, click) : b;
};
export const Link = (label, href, rest = {}) =>
  el('a', { class: 'btn is-link', href, target: '_blank', rel: 'noreferrer', text: label, ...rest });

// ── molecules ───────────────────────────────────────────────────────────────
// The same six counts at three sizes, from one component: dots in a dense card, small chips in a
// scope header that is summarising several runs, words for the quiet pair under the tiles.
export const Tally = (counts, { mode = 'dots', only = ORDER } = {}) => {
  const box = el('span', { class: 'tally' + (mode === 'dots' ? '' : ' is-' + mode) });
  for (const verdict of only) {
    const n = counts[verdict] || 0;
    if (mode === 'chips' && !n) continue;
    const item = el('span', { class: 'tally-item ' + v(verdict) + (n || mode !== 'dots' ? '' : ' is-zero'),
      title: `${n} ${verdict}` });
    // A zero fades the whole item, dot included; the dot itself keeps its own colour and its ring.
    // Greying it would make `not-committed 0` and `not-applicable 0` the same swatch, which is the
    // one thing the two quiet verdicts must never be. Only a tile, which has no word on it, goes grey.
    if (mode === 'dots') item.append(Dot(verdict, { hollow: verdict === 'not-committed' }), txt(String(n)));
    else if (mode === 'chips') item.append(Mark(verdict), txt(String(n)));
    else item.append(el('b', { text: verdict }), txt(String(n)));
    box.append(item);
  }
  return box;
};

export const Scope = ({ path, title, runs, counts }) => el('div', { class: 'scope' },
  el('span', { class: 'scope-path', title, text: path }),
  el('span', { class: 'scope-n', text: `${runs} run${runs > 1 ? 's' : ''}` }),
  Tally(counts, { mode: 'chips', only: LOUD }));

export const RunCard = ({ name, verdict, kind, when: at, counts, dir, current }, click) =>
  on(el('button', { class: 'runcard', type: 'button', 'data-dir': dir, 'aria-current': String(current) },
    el('div', { class: 'runcard-line' }, el('span', { class: 'runcard-name', text: name }), Chip(verdict)),
    el('div', { class: 'runcard-line' }, el('span', { class: 'runcard-kind', text: kind }),
      el('span', { class: 'runcard-when', text: at })),
    Tally(counts)), click);

export const Tiles = counts => {
  const box = el('div', { class: 'tiles' });
  for (const verdict of LOUD) {
    const n = counts[verdict] || 0;
    box.append(el('div', { class: 'tile ' + v(verdict) + (n ? '' : ' is-zero') },
      el('span', { class: 'tile-top' }, Dot(verdict, { off: !n }),
        el('span', { class: 'tile-n', text: String(n) })),
      el('span', { class: 'tile-k eyebrow is-field', text: verdict })));
  }
  return box;
};

// One object for everything the page says in its own voice; the tone says which voice.
export const Note = (tone, ...kids) => el('p', { class: 'note is-' + tone }, ...kids);
export const Hint = text => Note('hint', txt(text));

// Something that scrolls sideways and does not say so is something nobody scrolls. The wrapper carries
// the fade because the scroller is sized by its content: a sticky child of it resolves to height 0.
export function Scroller(inner, { tone = 'panel' } = {}) {
  const box = el('div', { class: 'scroller is-' + tone }, inner, el('span', { class: 'scroller-fade', 'aria-hidden': 'true' }));
  const more = () => box.classList.toggle('is-more', inner.scrollLeft + inner.clientWidth < inner.scrollWidth - 1);
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

// Three things happen to a step and they are three different things: it was measured, it stopped
// part-way, or it was never reached at all. A reader who cannot tell the last two apart cannot tell
// "we looked and found nothing" from "we never looked".
export const Step = ({ name, path, url, state, note, shot, current }, click) =>
  on(el('button', { class: 'step is-' + state, type: 'button', 'aria-current': String(current),
    title: url || (state === 'never' ? 'never reached' : '') },
    Frame({ src: shot, size: 'thumb', miss: state === 'never' ? 'no evidence exists' : 'no shot' }),
    el('span', { class: 'step-cap' },
      el('span', { class: 'step-name', text: name }),
      el('span', { class: 'step-url', text: path }),
      el('span', { class: 'step-state' }, StateDot(state), txt(note)))), click);

export function Chain(steps, onPick) {
  const box = el('div', { class: 'chain', tabindex: '0', role: 'group', 'aria-label': 'the journey, in order' });
  steps.forEach((s, k) => {
    if (k) box.append(el('span', { class: 'chain-link', text: '→' }));
    box.append(Step(s, () => onPick(k)));
  });
  return Scroller(box, { tone: 'bare' });
}

// Which conclusion belongs to which step. A row is drawn only when it carries an answer — one a probe
// pinned itself to, or one that has nothing because it never ran. A row per step saying "nothing pins
// here" is one sentence repeated, which is the noise this component exists to remove.
export function Cover(rows) {
  const box = el('div', { class: 'cover' });
  for (const r of rows) box.append(el('div', { class: 'cover-row' },
    el('span', { class: 'cover-step', text: r.step }),
    el('span', { class: 'cover-rule' }),
    el('span', { class: 'cover-say' }, r.none
      ? [Mark('not-committed'), txt('no evidence exists')]
      : r.probes.map(p => el('span', { class: 'cover-probe ' + v(p.verdict) }, Mark(p.verdict), txt(p.name))))));
  return box;
}

const COLUMNS = ['criterion', 'probe', 'provenance', 'method', 'verdict', 'details'];
export function ProbeTable(rows, onPick) {
  const body = el('tbody');
  for (const r of rows) {
    const tr = el('tr', { class: v(r.verdict), 'aria-current': String(r.current) },
      // Not a `.btn`: the criterion is the most-scanned column on the page, and a column of framed
      // controls reads as a toolbar. It is a real button for the keyboard and bare to the eye —
      // `.cell.is-crit button` is where it gets its type.
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
  const scroll = el('div', { class: 'scroller-box', tabindex: '0', role: 'region',
    'aria-label': 'probes, scrolls sideways when narrow' },
    el('table', { class: 'probes' },
      el('thead', {}, el('tr', {}, COLUMNS.map(h => el('th', { class: 'eyebrow', text: h })))), body));
  return Scroller(scroll);
}

export function Pager({ label, atStart, atEnd, what }, move) {
  return el('span', { class: 'pager' },
    Btn('‹', { disabled: atStart, title: `previous ${what} (←)`, 'aria-label': `previous ${what}` }, () => move(-1)),
    el('span', { class: 'pager-label', text: label }),
    Btn('›', { disabled: atEnd, title: `next ${what} (→)`, 'aria-label': `next ${what}` }, () => move(1)));
}

// One label and one value, and every label/value on the page is this. Three arrangements, and the
// arrangement is the only thing that differs between them.
export const Field = (k, value, { kind = '' } = {}) => el('div', { class: 'field' },
  el('dt', { text: k }),
  typeof value === 'string' || value === null || value === undefined
    ? el('dd', { class: kind ? 'is-' + kind : '', text: value ?? '—' })
    : el('dd', { class: kind ? 'is-' + kind : '' }, value));
export const Fields = (rows, { variant = '' } = {}) =>
  el('dl', { class: 'fields' + (variant ? ' is-' + variant : '') }, rows);

export const EvHead = ({ verdict, criterion, name }) => el('div', { class: 'evhead' },
  Chip(verdict), el('span', { class: 'evhead-crit', text: criterion }), el('span', { class: 'evhead-name', text: name }));

export function Cite({ what, where, check, whereTitle }) {
  const box = el('div', { class: 'cite' });
  box.append(Eyebrow('what', 'field'), el('p', { class: 'cite-what', text: what }));
  if (where) box.append(Eyebrow('where', 'field'),
    el('p', { class: 'cite-where' }, el('a', { href: where, target: '_blank', rel: 'noreferrer',
      title: whereTitle || where, text: shorten(where, 54) })));
  if (check) box.append(Eyebrow('check', 'field'), el('p', { class: 'cite-check' }, sentence(check)));
  return box;
}
export const Why = text => el('p', { class: 'cite-why', text });

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
export const Pad = (...kids) => el('div', { class: 'stage-pad' }, ...kids);
export const Empty = (title, ...kids) => el('div', { class: 'empty' }, el('h1', { text: title }), ...kids);

export const PageHead = ({ title, verdict, action }) => {
  const head = el('div', { class: 'pagehead' }, el('h1', { text: title }), Chip(verdict));
  if (action) head.append(action);
  return head;
};
export const PageMeta = (...kids) => el('p', { class: 'pagehead-meta' }, ...kids);
export const EvPad = (...kids) => el('div', { class: 'evidence-body' }, ...kids);

// APG calls this a select-only combobox, not a listbox: a trigger that owns a popup list. Focus stays
// on the trigger and `aria-activedescendant` names the option being pointed at, so the whole control
// is one tab stop and every key the pattern lists is answered.
// https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/
export function Combo({ options, at = 0, label, id = 'combolist' }, choose) {
  const btn = el('button', { type: 'button', role: 'combobox', 'aria-controls': id,
    'aria-haspopup': 'listbox', 'aria-expanded': 'false', 'aria-label': label },
    el('span', { text: options[at].label }), el('span', { class: 'combo-caret', text: '▾' }));
  const ul = el('ul', { id, class: 'combo-list', role: 'listbox', 'aria-label': label, hidden: 'hidden' });
  options.forEach((o, i) => {
    const li = el('li', { class: 'combo-opt', role: 'option', id: id + '-' + i, 'aria-selected': String(!!o.selected) },
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
  const pick = i => { at = i; shut(); btn.focus(); choose(options[i], i); };
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

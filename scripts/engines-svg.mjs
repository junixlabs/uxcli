// docs/uxcli-engines-{light,dark}.svg — the seven engines and the loop they close.
//
// One source, two files, because GitHub picks between them with <picture media>. Drawn rather than
// listed: the point a list cannot make is that engine 7 feeds back into engine 1, so the thing is a
// cycle and not a pipeline with an end. Status is a colour and a word, never a colour alone.
import fs from 'node:fs';

const ENGINES = [
  ['CONTEXT',     'business · domain · users · journeys · constraints',      'done', 'cited'],
  ['REASONING',   'patterns · research · hypotheses · risks → proposals',    'done', 'anchored'],
  ['COMMITMENT',  'proposed · signed · owner · source · lineage',            'done', 'traceable'],
  ['MEASUREMENT', 'probes · methods · targets · environments',               'done', 'flows too'],
  ['EVIDENCE',    'artifacts · snapshots · replay · provenance',             'done', 'no overwrites'],
  ['VERDICT',     'seven closed verdicts · six provenance · two methods',    'done', 'complete'],
  ['AGENT LOOP',  'fix · propose · explain · request authority',             'done', 'scoped'],
];

const T = {
  light: { ink:'#101828', quiet:'#475467', mark:'#7d8898', line:'#dfe3e8', panel:'#ffffff',
           done:'#067647', doneBg:'#dcfae6', part:'#b54708', partBg:'#fef0c7',
           none:'#b42318', noneBg:'#fee4e2', rule:'#eceff2' },
  dark:  { ink:'#f5f5f6', quiet:'#94969c', mark:'#717784', line:'#333741', panel:'#161b26',
           done:'#75e0a7', doneBg:'#053321', part:'#fec84b', partBg:'#4e1d09',
           none:'#fda29b', noneBg:'#55160c', rule:'#242933' },
};

const W = 880, X = 74, RW = 760, RH = 58, GAP = 7, TOP = 58;
const LEGEND_Y = TOP + 6 * (RH + GAP) + RH + 22;
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Only the states actually on the page get a key. A legend entry that matches no row is a claim the
// picture does not make, and this one used to say "not built" after the last blank engine was gone.
// Generated, not typed: a hand-written alt text goes stale the first time a status changes, and the
// reader who depends on it is the one least able to notice.
const names = k => ENGINES.filter(e => e[2] === k).map(e => e[0].toLowerCase());
function alt() {
  const say = ENGINES.map(e => e[0].toLowerCase()).join(', ');
  const parts = [];
  const done = names('done'), part = names('part'), none = names('none');
  if (done.length === ENGINES.length) parts.push('All seven are complete');
  else {
    if (done.length) parts.push(`${done.join(', ')} ${done.length === 1 ? 'is' : 'are'} complete`);
    if (part.length) parts.push(`${part.join(', ')} ${part.length === 1 ? 'is' : 'are'} partial`);
    if (none.length) parts.push(`${none.join(', ')} ${none.length === 1 ? 'is' : 'are'} not built`);
  }
  return `The seven engines of uxcli, drawn as a cycle: ${say}, and what the loop learned feeds back into context. ${parts.join("; ")}.`;
}

const WORDS = { done: 'complete', part: 'partial — real, but narrow', none: 'not built — claimed by nothing' };
function legend(c) {
  const seen = ['done', 'part', 'none'].filter(k => ENGINES.some(e => e[2] === k));
  let x = 0;
  return seen.map(k => {
    const s = `
    <rect x="${X + x}" y="${LEGEND_Y}" width="9" height="9" rx="2" fill="${c[k === 'done' ? 'done' : k === 'part' ? 'part' : 'none']}"/>
    <text x="${X + x + 15}" y="${LEGEND_Y + 8}">${WORDS[k]}</text>`;
    x += 28 + WORDS[k].length * 6.7;
    return s;
  }).join('');
}

function draw(c) {
  const rows = ENGINES.map(([name, role, state, word], i) => {
    const y = TOP + i * (RH + GAP);
    const hue = c[state === 'done' ? 'done' : state === 'part' ? 'part' : 'none'];
    const bg  = c[state === 'done' ? 'doneBg' : state === 'part' ? 'partBg' : 'noneBg'];
    return `
  <g>
    <rect x="${X}" y="${y}" width="${RW}" height="${RH}" rx="7" fill="${c.panel}" stroke="${c.line}"/>
    <rect x="${X}" y="${y}" width="4" height="${RH}" rx="2" fill="${hue}"/>
    <text x="${X + 22}" y="${y + 24}" font-size="12" fill="${c.mark}">${i + 1}</text>
    <text x="${X + 46}" y="${y + 24}" font-size="14" font-weight="700" fill="${c.ink}" letter-spacing=".04em">${name}</text>
    <text x="${X + 46}" y="${y + 43}" font-size="11.5" fill="${c.quiet}">${esc(role)}</text>
    <rect x="${X + RW - 118}" y="${y + 18}" width="98" height="22" rx="11" fill="${bg}" stroke="${hue}" stroke-opacity=".55"/>
    <text x="${X + RW - 69}" y="${y + 33}" font-size="11" font-weight="600" fill="${hue}" text-anchor="middle">${word}</text>
  </g>`;
  }).join('');

  const arrows = ENGINES.slice(0, -1).map((_, i) => {
    const y = TOP + i * (RH + GAP) + RH;
    return `<path d="M${X + RW / 2},${y} L${X + RW / 2},${y + GAP - 1}" stroke="${c.line}" stroke-width="1.5"/>`;
  }).join('\n  ');

  const last = TOP + 6 * (RH + GAP) + RH;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${last + 54}" width="${W}" role="img" aria-label="${alt()}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace">
  <defs>
    <marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="${c.mark}"/>
    </marker>
  </defs>

  <text x="${X}" y="26" font-size="13" font-weight="700" fill="${c.ink}" letter-spacing=".06em">THE SEVEN ENGINES</text>
  <text x="${X + 186}" y="26" font-size="11.5" fill="${c.mark}">a UX decision system, not a pipeline with an end</text>
  <line x1="${X}" y1="40" x2="${X + RW}" y2="40" stroke="${c.rule}"/>
  ${arrows}${rows}

  <!-- engine 7 feeds engine 1: what the loop learned becomes context, which is why this is a cycle -->
  <path d="M${X - 6},${last - RH / 2} L${X - 40},${last - RH / 2} L${X - 40},${TOP + RH / 2} L${X - 6},${TOP + RH / 2}"
        fill="none" stroke="${c.mark}" stroke-width="1.4" stroke-dasharray="5 4" marker-end="url(#a)"/>
  <text x="${X - 46}" y="${(TOP + last) / 2}" font-size="11" fill="${c.mark}" text-anchor="middle"
        transform="rotate(-90 ${X - 46} ${(TOP + last) / 2})">what it learned becomes context</text>

  <g font-size="11" fill="${c.quiet}">${legend(c)}
  </g>
</svg>
`;
}

for (const [k, c] of Object.entries(T)) fs.writeFileSync(`docs/uxcli-engines-${k}.svg`, draw(c));
console.log('docs/uxcli-engines-light.svg · docs/uxcli-engines-dark.svg');

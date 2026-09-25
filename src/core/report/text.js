// Plain-text layout for the cards. No colour, no node:*, width is a hard ceiling.
export const WIDTH = 100;

const hardSplit = (word, w) => { const out = []; for (let i = 0; i < word.length; i += w) out.push(word.slice(i, i + w)); return out; };

// Wrap `text`: the first line has `width - first` columns, every later line `width - indent` and is
// prefixed with `indent` spaces. The caller prefixes the first line itself.
// in: string, {first, indent, width}   out: string[] (at least one line, even for '')
export function wrap(text, { first = 0, indent = 0, width = WIDTH } = {}) {
  const pad = ' '.repeat(indent); const lines = []; let line = '';
  const room = () => width - (lines.length ? indent : first);
  const push = () => { lines.push(lines.length ? pad + line : line); line = ''; };
  for (const raw of String(text ?? '').split(/\s+/).filter(Boolean)) {
    for (const word of raw.length > room() ? hardSplit(raw, room()) : [raw]) {
      if (line && line.length + 1 + word.length > room()) push();
      line = line ? line + ' ' + word : word;
    }
  }
  push();
  return lines;
}

// `label` padded to `col` after `indent` spaces, then `text` wrapped under the text column.
export const row = (label, text, { col = 14, indent = 2 } = {}) => {
  const head = ' '.repeat(indent) + String(label).padEnd(col);
  return wrap(text, { first: head.length, indent: head.length }).map((l, i) => (i ? l : head + l));
};
export const bullet = (text, indent = 4) => row('-', text, { col: 2, indent });

// Last guard: a line a builder let through is folded at its last space, keeping its indent.
const fold = line => {
  const out = []; const lead = line.match(/^ */)[0].length + 2;
  while (line.length > WIDTH) {
    const cut = Math.max(line.lastIndexOf(' ', WIDTH), lead + 1);
    out.push(line.slice(0, cut).trimEnd()); line = ' '.repeat(lead) + line.slice(cut).trimStart();
  }
  return [...out, line];
};
// Every card ends here: one string, no line wider than WIDTH.
export const join = lines => lines.flat().flatMap(l => String(l).split('\n')).flatMap(fold).map(l => l.trimEnd()).join('\n');

export const short = hash => (typeof hash === 'string' && hash.length > 20 ? hash.slice(0, 19) + '…' : hash || '');
export const list = (xs, sep = ' · ') => (Array.isArray(xs) && xs.length ? xs.join(sep) : '—');

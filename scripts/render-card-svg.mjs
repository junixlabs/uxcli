#!/usr/bin/env node
// Render a captured verdict card into the animated SVG the README embeds.
// The card is not retyped here: it is read from a file produced by a real run, so the
// clip regenerates whenever the output changes. See `npm run clip`.
//
//   node scripts/render-card-svg.mjs <card.txt> <out.svg> [--cmd="uxcli run …"]
import fs from 'node:fs';

const [, , cardPath, outPath, ...rest] = process.argv;
if (!cardPath || !outPath) {
  console.error('usage: render-card-svg.mjs <card.txt> <out.svg> [--cmd="…"]');
  process.exit(1);
}
const cmd = (rest.find(a => a.startsWith('--cmd=')) || '--cmd=uxcli run http://localhost:3100/login --prove').slice(6);

const C = {
  bg: '#0b0b0c', panel: '#141416', bar: '#1a1a1d', hair: '#26262a',
  ink: '#ece9e2', ink2: '#c9c6be', muted: '#8f8d86', faint: '#5d5b56',
  pass: '#5fd38a', fail: '#ff5c4d', warn: '#e0b04a', green: '#7ccf9a',
};
const FONT = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'DejaVu Sans Mono', 'Liberation Mono', monospace";

const FS = 13, CH = FS * 0.601, LH = 20, PAD = 18, BAR = 34;

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ── colour the card by its own vocabulary ────────────────────────────────────
// Only presentation: every character comes from the captured card.
const VERDICT = { FAIL: C.fail, PASS: C.pass, 'N/A': C.muted, FINDING: C.warn };
const LABEL = /^(\s+)(what|where|rule|check|proof|files|finding)(\s+)(.*)$/;

function spans(line) {
  // returns [{t, fill, weight}]
  if (/^uxcli run · /.test(line)) {
    return [{ t: 'uxcli run', fill: C.ink }, { t: ' · ', fill: C.faint }, { t: line.slice(12), fill: C.ink2 }];
  }
  const lab = line.match(LABEL);
  if (lab) {
    const [, sp, key, gap, val] = lab;
    const fill = key === 'finding' ? C.warn : C.faint;
    const out = [{ t: sp + key + gap, fill }];
    // highlight the counterfactual and the issue link wherever they appear
    return out.concat(inline(val, key === 'finding' ? C.ink2 : C.ink2));
  }
  // probe line: "2.4.7  focus-visible    FAIL   …"
  const m = line.match(/^(\S+)(\s+)(\S+)(\s+)(FAIL|PASS|N\/A|FINDING)(\s*)(.*)$/);
  if (m) {
    const [, sc, s1, name, s2, verdict, s3, tail] = m;
    return [
      { t: sc, fill: C.faint }, { t: s1, fill: C.faint },
      { t: name, fill: C.ink, weight: 500 }, { t: s2, fill: C.faint },
      { t: verdict, fill: VERDICT[verdict] || C.ink, weight: 600 }, { t: s3, fill: C.faint },
      ...inline(tail, C.muted),
    ];
  }
  return inline(line, C.ink2);
}

// split a tail on the ` · would fail on …` counterfactual so it reads as the proof it is
function inline(text, base) {
  const i = text.indexOf('would fail on');
  if (i === -1) return [{ t: text, fill: base }];
  return [{ t: text.slice(0, i), fill: base }, { t: text.slice(i), fill: C.green }];
}

const COLS = Number((rest.find(a => a.startsWith('--cols=')) || '--cols=120').slice(7));

// Soft-wrap like a terminal does, but keep the colouring: spans are computed on the whole
// logical line, then the coloured characters are chunked into rows. Continuation rows are
// indented to the content column so a wrapped `what` still reads as one field.
function wrap(line) {
  const chars = [];
  for (const s of spans(line)) for (const ch of s.t) chars.push([ch, s.fill, s.weight]);
  if (chars.length <= COLS) return [chars];
  const lab = line.match(LABEL);
  const probe = line.match(/^(\S+\s+\S+\s+(?:FAIL|PASS|N\/A|FINDING)\s*)/);
  const indent = lab ? lab[1].length + lab[2].length + lab[3].length
    : probe ? probe[1].length : 0;
  const rows = [];
  let i = 0;
  while (i < chars.length) {
    const room = rows.length === 0 ? COLS : COLS - indent;
    let end = Math.min(i + room, chars.length);
    if (end < chars.length) {                       // break on a space when there is one
      let b = end;
      while (b > i + room * 0.6 && chars[b][0] !== ' ') b--;
      if (chars[b][0] === ' ') end = b + 1;
    }
    const row = chars.slice(i, end);
    rows.push(rows.length === 0 ? row : [...Array(indent).fill([' ', C.faint]), ...row]);
    i = end;
  }
  return rows;
}

const logical = fs.readFileSync(cardPath, 'utf8').replace(/\s+$/, '').split('\n');
const card = logical.flatMap(wrap);   // rows of [char, fill, weight]

// merge adjacent characters that share a fill back into tspans
const rowSpans = row => {
  const out = [];
  for (const [ch, fill, weight] of row) {
    const last = out[out.length - 1];
    if (last && last.fill === fill && last.weight === weight) last.t += ch;
    else out.push({ t: ch, fill, weight });
  }
  return out;
};

// ── timing ───────────────────────────────────────────────────────────────────
const TYPE = 0.032;                       // per character
const typeEnd = +(cmd.length * TYPE).toFixed(2);
const STATUS_AT = typeEnd + 0.35;
const FIRST = STATUS_AT + 0.75;
const STEP = 0.13;
const total = +(FIRST + card.length * STEP + 3.2).toFixed(2);

const status = 'opening http://localhost:3100/login · chromium 1280×800 · --prove: one planted defect per pass';

const widest = Math.max(cmd.length + 12, status.length + 2, ...card.map(r => r.length));
const W = Math.round(widest * CH + PAD * 2);
const H = BAR + PAD + (card.length + 5) * LH + PAD;

// One shared cycle: every element is keyed as a percentage of `total` so the clip loops
// cleanly instead of freezing on the last frame.
const pct = t => +(t / total * 100).toFixed(3);
const keyframes = [];
const reveal = (name, t) => {
  const p = pct(t);
  keyframes.push(`@keyframes ${name}{0%,${Math.max(p - 0.01, 0)}%{opacity:0}${p}%,97%{opacity:1}100%{opacity:0}}`);
  return `animation:${name} ${total}s linear infinite`;
};

const L = [];
L.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${FONT}" font-size="${FS}" role="img" aria-label="uxcli run on a page with no visible focus ring: 2.4.7 FAIL, contrast and text-overlap PASS, each pass carrying the defect that would have failed it">`);
L.push(`<title>uxcli run · one screen, four probes, one blocking verdict</title>`);
const STYLE_AT = L.length;   // keyframes are collected as the body is built
L.push('');                  // placeholder, filled in once every delay is known

// window
L.push(`<rect width="${W}" height="${H}" rx="10" fill="${C.bg}"/>`);
L.push(`<rect width="${W}" height="${H}" rx="10" fill="none" stroke="${C.hair}"/>`);
L.push(`<rect width="${W}" height="${BAR}" rx="10" fill="${C.bar}"/>`);
L.push(`<rect y="${BAR - 10}" width="${W}" height="10" fill="${C.bar}"/>`);
L.push(`<line x1="0" y1="${BAR}" x2="${W}" y2="${BAR}" stroke="${C.hair}"/>`);
[0, 1, 2].forEach(i => L.push(`<circle cx="${18 + i * 16}" cy="${BAR / 2}" r="4.5" fill="${['#3a3a3f', '#3a3a3f', '#3a3a3f'][i]}"/>`));
L.push(`<text x="${W / 2}" y="${BAR / 2 + 4}" fill="${C.faint}" font-size="11.5" text-anchor="middle">uxcli — verdict card</text>`);

let y = BAR + PAD + LH;

// prompt + typed command, revealed by wiping a cover rect to the right edge
const promptTxt = '$ ';
const cmdX = PAD + promptTxt.length * CH;
const cw = cmd.length * CH + 2;
// The command is typed by growing a clip window left-to-right over the text.
keyframes.push(`@keyframes type{0%{width:0}${pct(typeEnd)}%,100%{width:${cw.toFixed(1)}px}}`);
L.push(`<clipPath id="type"><rect x="${cmdX}" y="${y - LH}" width="0" height="${LH + 6}" style="animation:type ${total}s steps(${cmd.length}) infinite"/></clipPath>`);
L.push(`<text x="${PAD}" y="${y}" fill="${C.green}">${esc(promptTxt)}</text>`);
L.push(`<text x="${cmdX}" y="${y}" fill="${C.ink}" clip-path="url(#type)" xml:space="preserve">${esc(cmd)}</text>`);
// caret: sits at the end of the command while it is typed, then leaves as output arrives
keyframes.push(`@keyframes caret{0%,${pct(typeEnd)}%{opacity:1}${pct(STATUS_AT)}%,100%{opacity:0}}`);
L.push(`<rect x="${(cmdX + cmd.length * CH).toFixed(1)}" y="${y - LH + 6}" width="${(CH * 0.85).toFixed(1)}" height="${FS + 2}" fill="${C.ink}" style="animation:caret ${total}s step-end infinite"/>`);

y += LH;
L.push(`<text x="${PAD}" y="${y}" fill="${C.faint}" style="${reveal('st', STATUS_AT)}">${esc(status)}</text>`);

y += LH;
card.forEach((line, i) => {
  y += LH;
  const t = rowSpans(line).map(s => `<tspan fill="${s.fill}"${s.weight ? ` font-weight="${s.weight}"` : ''} xml:space="preserve">${esc(s.t)}</tspan>`).join('');
  L.push(`<text x="${PAD}" y="${y}" style="${reveal('c' + i, FIRST + i * STEP)}" xml:space="preserve">${t}</text>`);
});

// exit line
y += LH;
L.push(`<text x="${PAD}" y="${y}" style="${reveal('ex', FIRST + card.length * STEP + 0.3)}" xml:space="preserve"><tspan fill="${C.faint}">$ echo $? → </tspan><tspan fill="${C.fail}" font-weight="600">2</tspan><tspan fill="${C.faint}">   one fail blocks the merge</tspan></text>`);

L[STYLE_AT] = `<style>\n${keyframes.join('\n')}\n</style>`;
L.push(`</svg>`);

fs.writeFileSync(outPath, L.join('\n'));
console.log(`${outPath} ${(fs.statSync(outPath).size / 1024).toFixed(1)} KB · ${card.length} card lines · ${total}s loop`);

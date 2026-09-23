// Dựng trang so font cho dashboard uxcli.
// Không đoán: font nhúng thẳng từ fonts/, số liệu VI đọc từ bảng cmap, còn bề ngang đo trong trình duyệt.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');

// —— tokens: lấy từ chính stylesheet của dashboard, không chép tay ——
const tok = readFileSync(join(root, 'src/dashboard.tokens.css'), 'utf8');
const val = n => {
  const m = tok.match(new RegExp(`--${n}\\s*:\\s*([^;]+);`));
  if (!m) throw new Error(`token --${n} không có trong dashboard.tokens.css`);
  return m[1].trim();
};
const SANS = val('sans');
const MONO_NOW = val('mono');

const pairs = [
  'fail-ink','fail-bg','fail-edge','finding-ink','finding-bg','finding-edge',
  'unmeas-ink','unmeas-bg','unmeas-edge','pass-ink','pass-bg','pass-edge',
  'quiet-ink','quiet-bg','quiet-edge','quiet-mark','accent','accent-bg','select-bg',
  'ink','ink-2','ink-3','bg','panel','sunk','rail','line','line-2',
];
const theme = p => pairs.map(n => `    --${n}: ${val(`${p}-${n}`)};`).join('\n');

// —— font: nhúng data URI, không CDN, không phụ thuộc file:// đọc được thư mục bên cạnh ——
const b64 = f => readFileSync(join(here, 'fonts', f)).toString('base64');
const face = (family, file) =>
  `url(data:font/woff2;base64,${b64(file)}) format('woff2')`;

const files = readdirSync(join(here, 'fonts'));
const faces = [];
const bytesOf = {};
for (const [fam, slug] of [['IBM Plex Mono','plex'], ['JetBrains Mono','jb'], ['Iosevka','iosevka']]) {
  let b = 0;
  for (const f of files.filter(f => f.startsWith(slug + '-'))) {
    const wt = f.split('-')[1];
    b += readFileSync(join(here, 'fonts', f)).length;
    faces.push(`@font-face{font-family:'${fam}';font-style:normal;font-weight:${wt};font-display:block;src:${face(fam, f)};}`);
  }
  bytesOf[fam] = b;
}

// —— ứng viên. `viMissing` đọc từ bảng cmap bằng fontTools, không phải lời quảng cáo của font ——
const FONTS = [
  { key: 'now',  name: 'Menlo',           note: 'đang dùng',  stack: MONO_NOW,                        viMissing: 46, kb: null },
  { key: 'plex', name: 'IBM Plex Mono',   note: 'ứng viên',   stack: `'IBM Plex Mono', ${MONO_NOW}`,  viMissing: 0,  kb: Math.round(bytesOf['IBM Plex Mono']/1024) },
  { key: 'jb',   name: 'JetBrains Mono',  note: 'ứng viên',   stack: `'JetBrains Mono', ${MONO_NOW}`, viMissing: 0,  kb: Math.round(bytesOf['JetBrains Mono']/1024) },
  { key: 'ios',  name: 'Iosevka',         note: 'ứng viên',   stack: `'Iosevka', ${MONO_NOW}`,        viMissing: 0,  kb: Math.round(bytesOf['Iosevka']/1024) },
];

// —— nội dung thật, lấy từ index.json và run.json của chính uxcli ——
const ROWS = [
  { t: '17:14:44', name: 'Order summary',                              where: 'uxcli · page', v: 'fail',         n: [2,1,1] },
  { t: '17:14:41', name: 'Page that is still changing when it is read', where: 'uxcli · page', v: 'unmeasurable', n: [2,1,1] },
  { t: '17:14:39', name: 'Settled page with one contrast defect',       where: 'uxcli · page', v: 'fail',         n: [2,1,1] },
];
const WHAT = '1 text nodes in 1 colour pair: #9a9a9a on #ffffff 2.81:1 ×1 (e.g. .hint)';
const WHERE = 'file:///Users/chuongle/tools/uxcli/src/probes/contrast/must-fail/index.html';
const VERDICTS = ['pass','fail','finding','not-applicable','not-committed','unmeasurable','suppressed'];
const PROBES = ['page.focus-visible','page.contrast','page.text-spacing','page.text-overlap'];
const VI = 'Bỏ clamp: nội dung là <project> · <kind>, vốn ngắn — chữ nở ra mà hộp thì không.';
const VI_HARD = 'Ả ả Ấ ấ Ầ ầ Ẩ ẩ Ẫ ẫ Ắ ắ Ẳ ẳ Ẵ ẵ Ẻ ẻ Ế ế Ề ề Ể ể Ễ ễ Ệ ệ  ₫';
const GLYPHS = '0O 1lI| 5S 8B rn m ., :; {} () [] #0b0b0c 5.45:1 ×1';
const LIGA = '-> => != <= >= === != ... --- :: <> |> /* */ www 0x1A';

const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const V = { fail:'fail', unmeasurable:'unmeas', finding:'finding', pass:'pass' };
const hue = v => `--hue: var(--${V[v] || 'quiet'}-ink); --hue-bg: var(--${V[v]||'quiet'}-bg); --hue-edge: var(--${V[v]||'quiet'}-edge);`;

const q = s => s.replace(/"/g, "'");   // stack vào CSS, không vào thuộc tính HTML
const monoRules = FONTS.map(f => `.spec[data-font="${f.key}"] { --mono: ${q(f.stack)}; }`).join('\n');

const specimen = f => `
<section class="spec" data-font="${f.key}">
  <header class="spec-h">
    <h2>${f.name}</h2>
    <span class="tag${f.key === 'now' ? ' is-now' : ''}">${f.note}</span>
    <span class="num" data-w="${f.key}"></span>
  </header>

  <div class="frag">
    <p class="k">bảng runs — 12px/20px, đúng sáu cột của màn Runs</p>
    <div class="scroll"><table class="runs" data-t="${f.key}"><thead><tr>
      <th>ran</th><th>what</th><th>where</th><th>worst</th><th>probes</th><th>exit</th>
    </tr></thead><tbody>
    ${ROWS.map(r => `<tr>
      <td class="t-t">${r.t}</td>
      <td class="t-n">${esc(r.name)}</td>
      <td class="t-w">${esc(r.where)}</td>
      <td><span class="chip" style="${hue(r.v)}">${r.v}</span></td>
      <td class="t-c">${r.n.join(' / ')}</td>
      <td class="t-e"><b style="${hue(r.v)}">2</b></td>
    </tr>`).join('')}
    </tbody></table></div>
  </div>

  <div class="two">
    <div class="frag">
      <p class="k">chip verdict — 11px/700, chỗ chữ nhỏ nhất và dày nhất</p>
      <div class="chips">${VERDICTS.map(v => `<span class="chip" style="${hue(v)}">${v}</span>`).join('')}</div>
      <p class="k">tên probe — 12px/600</p>
      <div class="chips">${PROBES.map(p => `<b class="pn">${p}</b>`).join('')}</div>
    </div>
    <div class="frag">
      <p class="k">con số — 34px và 24px, chữ số kiểu bảng</p>
      <div class="figs"><span class="fig">0</span><span class="fig" style="${hue('fail')}">2</span><span class="dis">42</span><span class="dis">70</span><span class="dis">2.81:1</span></div>
    </div>
  </div>

  <div class="frag">
    <p class="k">thẻ probe — <code>what</code> 12px, <code>where</code> 11px</p>
    <p class="what">${esc(WHAT)}</p>
    <p class="where">${esc(WHERE)}</p>
  </div>

  <div class="two">
    <div class="frag">
      <p class="k">ký tự dễ lẫn — 12px</p>
      <p class="glyph">${esc(GLYPHS)}</p>
      <p class="k">ligature — dấu nào dính vào nhau là font tự nối, dashboard không xin</p>
      <p class="glyph hard">${esc(LIGA)}</p>
    </div>
    <div class="frag">
      <p class="k">tiếng Việt — 12px. Chữ nào đổi nét là font không có, hệ điều hành mượn chỗ khác</p>
      <p class="glyph">${esc(VI)}</p>
      <p class="glyph hard">${VI_HARD}</p>
    </div>
  </div>
</section>`;

const html = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mono cho uxcli</title>
<style>
${faces.join('\n')}

:root {
${theme('lt')}
  --sans: ${SANS};
  --mono: ${q(MONO_NOW)};
  --s1: 5px; --s2: 10px; --s3: 15px; --s4: 20px; --s5: 30px; --s6: 40px;
  --r1: 3px; --r2: 6px;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
${theme('dk')}
} }
:root[data-theme="dark"] {
${theme('dk')}
}

*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--bg); color: var(--ink);
  font: 13px/20px var(--sans); }
h1, h2, p, table, figure { margin: 0; }
table { border-collapse: collapse; }

.wrap { max-width: 1120px; margin: 0 auto; padding-block: var(--s5) var(--s6); padding-inline: var(--s4); }

.top { display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--s3); margin-bottom: var(--s4); }
.top h1 { font: 30px/35px var(--sans); font-weight: 600; letter-spacing: -0.01em; flex: 1 1 320px; }
.lede { color: var(--ink-2); font: 15px/25px var(--sans); max-width: 62ch; margin-top: var(--s2); }
button.tg { font: 11px/15px var(--sans); letter-spacing: .06em; text-transform: uppercase;
  color: var(--ink-2); background: var(--panel); border: 1px solid var(--line);
  border-radius: var(--r1); padding: var(--s1) var(--s2); cursor: pointer; }
button.tg:hover { color: var(--ink); border-color: var(--quiet-mark); }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

/* —— bảng số đo —— */
.card { background: var(--panel); border: 1px solid var(--line); border-radius: var(--r2);
  padding: var(--s4); margin-top: var(--s4); }
.card > h2 { font: 11px/15px var(--sans); letter-spacing: .08em; text-transform: uppercase;
  color: var(--ink-3); margin-bottom: var(--s3); }
.scroll { overflow-x: auto; }
table.m { width: 100%; min-width: 620px; }
table.m th { font: 11px/15px var(--sans); letter-spacing: .06em; text-transform: uppercase;
  color: var(--ink-3); text-align: right; padding: 0 0 var(--s2); border-bottom: 1px solid var(--line); white-space: nowrap; }
table.m th:first-child, table.m td:first-child { text-align: left; }
table.m td { font: 12px/20px var(--mono); text-align: right;
  padding: var(--s2) 0; border-bottom: 1px solid var(--line-2);
  font-variant-numeric: tabular-nums; white-space: nowrap; }
table.m td + td { padding-left: var(--s4); }
table.m tr:last-child td { border-bottom: 0; }
table.m .who { font: 13px/20px var(--sans); font-weight: 600; }
table.m .no { color: var(--fail-ink); }
table.m .yes { color: var(--pass-ink); }
.foot { font: 11px/15px var(--sans); color: var(--ink-3); margin-top: var(--s3); max-width: 78ch; }
.foot code { font: 11px/15px var(--mono); color: var(--ink-2); }

/* —— mỗi khối mẫu đổi đúng một biến —— */
${monoRules}

/* —— khối mẫu —— */
.spec { background: var(--panel); border: 1px solid var(--line); border-radius: var(--r2);
  padding: var(--s4); margin-top: var(--s4); }
.spec[data-font="now"] { border-color: var(--quiet-mark); background: var(--sunk); }
.spec-h { display: flex; align-items: baseline; gap: var(--s2); flex-wrap: wrap;
  padding-bottom: var(--s3); border-bottom: 1px solid var(--line); margin-bottom: var(--s3); }
.spec-h h2 { font: 21px/30px var(--sans); font-weight: 600; }
.tag { font: 11px/15px var(--sans); letter-spacing: .06em; text-transform: uppercase;
  color: var(--ink-3); border: 1px solid var(--line); border-radius: var(--r1); padding: 0 var(--s1); }
.tag.is-now { color: var(--accent); border-color: var(--accent); }
.spec-h .num { margin-left: auto; font: 11px/15px var(--mono); color: var(--ink-3);
  font-variant-numeric: tabular-nums; }

.frag + .frag, .two + .frag, .frag + .two, .two + .two { margin-top: var(--s4); }
.two { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--s4); }
.k { font: 11px/15px var(--sans); color: var(--ink-3); margin-bottom: var(--s2); }
.chips + .k, .glyph + .k { margin-top: var(--s3); }
.k code { font: 11px/15px var(--mono); color: var(--ink-2); }

table.runs { width: 100%; min-width: 560px; }
table.runs th { font: 11px/15px var(--sans); letter-spacing: .06em; text-transform: uppercase;
  color: var(--ink-3); text-align: left; padding: 0 var(--s3) var(--s1) 0; border-bottom: 1px solid var(--line); }
table.runs td { font: 12px/20px var(--mono); padding: var(--s1) var(--s3) var(--s1) 0;
  border-bottom: 1px solid var(--line-2); white-space: nowrap; }
table.runs tr:last-child td { border-bottom: 0; }
table.runs .t-t, table.runs .t-c { font-variant-numeric: tabular-nums slashed-zero; color: var(--ink-2); }
table.runs .t-n { font: 13px/20px var(--sans); color: var(--ink); }
table.runs .t-w { color: var(--ink-3); }
table.runs .t-e b { font-weight: 600; color: var(--hue); }
table.runs th:last-child, table.runs td:last-child { padding-right: 0; }

.chip { display: inline-block; font: 700 11px/15px var(--mono); letter-spacing: .02em;
  color: var(--hue); background: var(--hue-bg); border: 1px solid var(--hue-edge);
  border-radius: var(--r1); padding: 0 var(--s1); }
.chips { display: flex; flex-wrap: wrap; gap: var(--s1) var(--s2); align-items: center; }
.pn { font: 600 12px/20px var(--mono); color: var(--ink-2); }

.figs { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--s3); }
.fig { font: 34px/40px var(--mono); font-variant-numeric: tabular-nums slashed-zero; color: var(--hue, var(--ink)); }
.dis { font: 24px/30px var(--mono); font-variant-numeric: tabular-nums slashed-zero; color: var(--ink-2); }

.what { font: 12px/20px var(--mono); color: var(--ink); }
.where { font: 11px/15px var(--mono); color: var(--ink-3); overflow-wrap: anywhere; }
.glyph { font: 12px/20px var(--mono); color: var(--ink); overflow-wrap: anywhere; }
.glyph.hard { margin-top: var(--s1); color: var(--ink-2); }

@media (max-width: 600px) {
  .top h1 { font: 21px/30px var(--sans); font-weight: 600; }
  .wrap { padding-inline: 16px; }
}
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
</style>
</head>
<body>
<div class="wrap">

  <div class="top">
    <h1>Mono nào cho uxcli</h1>
    <button class="tg" id="tg" type="button">đổi nền</button>
  </div>
  <p class="lede">Bốn mặt chữ, cùng một nội dung thật lấy từ <code>index.json</code> và <code>run.json</code>
  của chính uxcli, đặt ở đúng cỡ mà dashboard đang dùng: 11px chip, 12px ô bảng, 24px và 34px con số.
  Khối đầu là Menlo — thứ máy này thực sự đang vẽ.</p>

  <section class="card">
    <h2>Số đo</h2>
    <div class="scroll">
      <table class="m">
        <thead><tr>
          <th>font</th><th>ký tự Việt thiếu</th><th>nặng (woff2)</th>
          <th>bề ngang 1 ký tự</th><th>so với sans</th><th>bảng runs cần</th>
        </tr></thead>
        <tbody id="mrows"></tbody>
      </table>
    </div>
    <p class="foot">Cột <b>ký tự Việt thiếu</b> đọc từ bảng <code>cmap</code> của file font bằng fontTools —
    134 điểm mã tiếng Việt cần có, đếm cái nào không có. Không suy từ mắt nhìn.
    Ba cột còn lại do trang này đo trong trình duyệt khi mở, sau khi font đã nạp xong.
    Ngưỡng của bảng runs là <code>--w-runtable: 640px</code>; dưới ngưỡng đó bảng phải cuộn ngang.</p>
  </section>

${FONTS.map(specimen).join('\n')}

</div>

<script>
(() => {
  const root = document.documentElement;
  const tg = document.getElementById('tg');
  const now = () => root.getAttribute('data-theme')
    || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  tg.addEventListener('click', () => {
    root.setAttribute('data-theme', now() === 'dark' ? 'light' : 'dark');
  });

  const FONTS = ${JSON.stringify(FONTS.map(({key,name,stack,viMissing,kb}) => ({key,name,stack,viMissing,kb})))};
  const PROBE = 'file:///Users/chuongle/tools/uxcli/src/probes/contrast/';

  // Đo bằng DOM, không bằng canvas: canvas 2D không phải lúc nào cũng thấy webfont vừa nạp,
  // và nó đã im lặng trả về Menlo cho cả bốn ứng viên ở bản dựng đầu.
  const rule = document.createElement('div');
  rule.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;' +
    'white-space:pre;width:max-content;letter-spacing:normal;';
  document.body.append(rule);
  const w = (stack, s, px) => {
    rule.style.font = px + 'px/' + px + 'px ' + stack;
    rule.textContent = s;
    return rule.getBoundingClientRect().width;
  };

  // Bề ngang tự nhiên của bảng: bỏ width:100% và min-width ra rồi mới đọc, nếu không
  // ta chỉ đang đo cái khung chứa nó.
  const natural = t => {
    const was = t.style.cssText;
    t.style.cssText = was + ';width:max-content;min-width:0;';
    const px = t.getBoundingClientRect().width;
    t.style.cssText = was;
    return Math.ceil(px);
  };

  function fill() {
    const sans = ${JSON.stringify(SANS)};
    const base = w(sans, PROBE, 12);
    const rows = FONTS.map(f => {
      const one = w(f.stack, 'M', 12);
      const ratio = w(f.stack, PROBE, 12) / base;
      const t = document.querySelector('table.runs[data-t="' + f.key + '"]');
      const need = t ? natural(t) : 0;
      const badge = document.querySelector('.num[data-w="' + f.key + '"]');
      if (badge) badge.textContent = one.toFixed(2) + 'px/ký tự · bảng ' + need + 'px';
      return { f, one, ratio, need };
    });
    document.getElementById('mrows').innerHTML = rows.map(({f, one, ratio, need}) => \`
      <tr>
        <td class="who">\${f.name}</td>
        <td class="\${f.viMissing ? 'no' : 'yes'}">\${f.viMissing ? f.viMissing : '0'}</td>
        <td>\${f.kb == null ? 'có sẵn' : f.kb + ' KB'}</td>
        <td>\${one.toFixed(2)}px</td>
        <td>\${(ratio * 100).toFixed(0)}%</td>
        <td class="\${need > 640 ? 'no' : ''}">\${need}px</td>
      </tr>\`).join('');
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fill);
  else fill();
})();
</script>
</body>
</html>
`;

writeFileSync(join(here, 'index.html'), html);
console.log(`index.html — ${(html.length / 1024 / 1024).toFixed(2)} MB, ${FONTS.length} font, ${faces.length} @font-face`);

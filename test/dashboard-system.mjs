// The dashboard's design system is a file, not a habit — this is what keeps it one.
//
// `2026-09-12-does-the-agent-hold-a-style.md` measured what happens without it: 27 spacing values,
// 21 font sizes, 9 radii across three screens of one product. The first version of this dashboard
// reproduced that in a single file (23 / 15 / 10). Colour was the only clean axis, and colour was
// the only axis written down. So every axis is written down now, and this asserts it stayed that way.
//
//   node test/dashboard-system.mjs        exit 0 clean, exit 1 with the offending values
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const page = fs.readFileSync(path.join(ROOT, 'src/dashboard.html'), 'utf8');
const css = page.split('<style>')[1].split('</style>')[0];

// The exceptions, each one a decision recorded in the palette or the brief.
const OK_LENGTHS = new Set([0, 1, 2, 3]);       // hairline borders and the verdict stripe, not spacing
const OK_FONT_SIZES = new Set([16]);            // the specimen: another page's text at the browser default
const problems = [];
const push = (what, values) => values.length && problems.push(`${what}: ${[...new Set(values)].join(', ')}`);

const lengths = [...css.matchAll(/(?:padding|margin|gap|inset|top|bottom|left|right)[a-z-]*:\s*([^;]+);/g)]
  .flatMap(m => (m[1].match(/-?\d+(?:\.\d+)?px/g) || []).map(parseFloat))
  .filter(v => !OK_LENGTHS.has(Math.abs(v)));
push('spacing values that are not on the scale (use --s1…--s9)', lengths.map(v => v + 'px'));

const sizes = [...css.matchAll(/font(?:-size)?:[^;]*?(\d+(?:\.\d+)?)px/g)]
  .map(m => parseFloat(m[1])).filter(v => !OK_FONT_SIZES.has(v));
push('font sizes outside the seven type roles (use --type-*)', sizes.map(v => v + 'px'));

const radii = [...css.matchAll(/border-radius:\s*([^;]+);/g)]
  .flatMap(m => (m[1].match(/\d+(?:\.\d+)?px/g) || []).map(parseFloat))
  .filter(v => !OK_LENGTHS.has(v));
push('border radii outside the three steps (use --r-chip/--r-control/--r-panel)', radii.map(v => v + 'px'));

const colours = [...css.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)/g)].map(m => m[0]);
push('colours declared outside src/dashboard.tokens.css', colours);

// Every line height the type roles declare must land on the 5px grid: GOV.UK's rule, adopted for the
// reason GOV.UK gives for it — a consistent vertical rhythm is what makes a dense page scannable.
const tokens = fs.readFileSync(path.join(ROOT, 'src/dashboard.tokens.css'), 'utf8');
const offGrid = [...tokens.matchAll(/--type-[a-z]+:\s*(\d+(?:\.\d+)?)px\/(\d+(?:\.\d+)?)px/g)]
  .filter(m => parseFloat(m[2]) % 5 !== 0).map(m => m[0]);
push('type roles whose line height is not a multiple of 5px', offGrid);

if (problems.length) { console.error('dashboard design system: DRIFT\n  ' + problems.join('\n  ')); process.exit(1); }
console.log('dashboard design system: ok — every length, size, radius and colour comes from src/dashboard.tokens.css');

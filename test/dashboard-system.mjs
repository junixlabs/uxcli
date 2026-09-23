// The dashboard's design system is a file, not a habit — this is what keeps it one.
//
// `2026-09-12-does-the-agent-hold-a-style.md` measured what happens without it: 27 spacing values,
// 21 font sizes, 9 radii across three screens of one product. The first version of this dashboard
// reproduced that in a single file (23 / 15 / 10). Colour was the only clean axis, and colour was
// the only axis written down. So every axis is written down now, and this asserts it stayed that way.
//
// Three tiers, and two rules between them:
//   tokens      dashboard.tokens.css        every value — colour, type, spacing, radius, measure
//   components  dashboard.components.css    every component, defined once, drawn from tokens only
//   shell       dashboard.shell.css         the frame those components sit in, same two rules
//   screens     dashboard.app.js            composed of components only, and naming none of them
//
//   node test/dashboard-system.mjs        exit 0 clean, exit 1 with the offending values
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = f => fs.readFileSync(path.join(ROOT, 'src', f), 'utf8');
const page = src('dashboard.html'), tokens = src('dashboard.tokens.css');
const ui = src('dashboard.ui.js'), app = src('dashboard.app.js');
// Comments are where the old values are quoted — "the declared 130px was never a width", "88px each"
// — so a rule that reads the file has to read the rules and not the reasons. Media conditions go the
// same way: a breakpoint is where the layout changes, not a size the layout is drawn at, and CSS
// cannot take a custom property in one anyway.
// Both stylesheets, checked as one. The shell arrived with the 2026-09-20 rebuild and spent its
// first hour outside these rules — 26px, 46px, 19px, three radii off the scale — which is exactly
// how the drift this file exists to stop gets back in: through a file the file does not read.
const css = [src('dashboard.components.css'), src('dashboard.shell.css')]
  .join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
const rules = css.replace(/@media[^{]*/g, '@media ');

// The exceptions, each one a decision recorded in the palette or the brief.
const OK_LENGTHS = new Set([0, 1, 2, 3]);       // hairline borders and the verdict stripe, not spacing
const OK_FONT_SIZES = new Set([16]);            // the specimen: another page's text at the browser default
const problems = [];
const push = (what, values) => values.length && problems.push(`${what}: ${[...new Set(values)].join(', ')}`);

// The page is a shell. A `<style>` block in it is a component nobody else can reach, and the tier it
// belongs to would stop being a file — which is the whole of what this split bought.
if (/<style[\s>]/.test(page)) problems.push('src/dashboard.html carries a <style> block: components belong in dashboard.components.css');

// Spacing is the distance between things; a measure is how wide a thing is allowed to be. Both are
// checked, because a width was for a long time the one axis with no rule on it — which is how
// `min-width: 700px` and `min-width: 820px` ended up on the same table, eighty lines apart.
const lengths = [...rules.matchAll(/(?:padding|margin|gap|inset|top|bottom|left|right|width|height|flex|grid-template-columns|grid-template-rows)[a-z-]*:\s*([^;]+);/g)]
  .flatMap(m => (m[1].match(/-?\d+(?:\.\d+)?px/g) || []).map(parseFloat))
  .filter(v => !OK_LENGTHS.has(Math.abs(v)));
push('lengths that are not on the scale (use --s1…--s9 for spacing, --w-*/--h-* for a measure)', lengths.map(v => v + 'px'));

const sizes = [...rules.matchAll(/font(?:-size)?:[^;]*?(\d+(?:\.\d+)?)px/g)]
  .map(m => parseFloat(m[1])).filter(v => !OK_FONT_SIZES.has(v));
push('font sizes outside the seven type roles (use --type-*)', sizes.map(v => v + 'px'));

const radii = [...rules.matchAll(/border-radius:\s*([^;]+);/g)]
  .flatMap(m => (m[1].match(/\d+(?:\.\d+)?px/g) || []).map(parseFloat))
  .filter(v => !OK_LENGTHS.has(v));
push('border radii outside the three steps (use --r-chip/--r-control/--r-panel)', radii.map(v => v + 'px'));

const colours = [...rules.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)/g)].map(m => m[0]);
push('colours declared outside src/dashboard.tokens.css', colours);

// Every line height the type roles declare must land on the 5px grid: GOV.UK's rule, adopted for the
// reason GOV.UK gives for it — a consistent vertical rhythm is what makes a dense page scannable.
const offGrid = [...tokens.matchAll(/--type-[a-z]+:\s*(\d+(?:\.\d+)?)px\/(\d+(?:\.\d+)?)px/g)]
  .filter(m => parseFloat(m[2]) % 5 !== 0).map(m => m[0]);
push('type roles whose line height is not a multiple of 5px', offGrid);

// Component first, in one line: a screen may compose components and may not name one. Every class on
// the page is written in dashboard.ui.js, which is why a verdict can only be drawn one way. The day
// a screen writes its own `class`, the tier is gone and the four naming schemes start growing back.
const named = [...app.matchAll(/\bclass(?:Name|List)?\s*[:=.]/g)].map(m => m[0]);
push('src/dashboard.app.js names a class (compose components from dashboard.ui.js instead)', named);

// Dead CSS is a component nobody builds. Every class this stylesheet defines has to be reachable from
// the markup that exists — a factory in ui.js, the shell in dashboard.html, or, for the `is-` and `v-`
// variants that are assembled from a word (`'is-' + tone`), that word as a string a screen passes in.
const built = ui + page + app;
const reachable = c => built.includes(c)
  || (/^(?:is|v)-/.test(c) && new RegExp(`['"\`]${c.replace(/^(?:is|v)-/, '')}['"\`]`).test(built));
const dead = [...new Set([...css.matchAll(/\.([a-z][a-z0-9-]*)/g)].map(m => m[1]))].filter(c => !reachable(c));
push('classes defined in dashboard.components.css that nothing builds', dead);

if (problems.length) { console.error('dashboard design system: DRIFT\n  ' + problems.join('\n  ')); process.exit(1); }
console.log('dashboard design system: ok — three tiers, every value from src/dashboard.tokens.css, every class from src/dashboard.ui.js');

// Mockups, held by a pair: the agent draws, a person picks. A pick nobody stands behind is refused;
// a pick naming a variant that is not on disk is refused; a part that is the pick itself is refused.
// The screens come from the journeys in the order a reader meets them; the step that leaves a screen
// is its last ui interaction; a hook written with a run-time param still finds the mockup's hook.
// The page: the picked variant is the one the flow draws; the others sit in the gallery with the
// status the pick gives them; a screen with variants and no pick is drawn as `no pick yet`.
import { parsePick, statusOf, screensOf, hookOf, receiptOf, tokensOf, drawingHash, mockupsCard } from '../src/core/mockups.js';
import crypto from 'node:crypto';
import { flowRow, galleryHtml, protoHtml, PROTO_JS, hooksHtml } from '../src/core/wireflow.js';
import { read, text } from './example-data.mjs';

export const OPERATOR = 'a pick without by{}, without sha256, over a drawing that changed, naming a variant not on disk, a part naming the pick itself, and an unknown key are refused; a drawing missing a wanted hook, reaching for a CDN or carrying lorem fails its receipt; '
  + 'a variant painting a colour no shared token carries is reported, one on the palette is not, and a token change changes the drawing\'s hash; the example picks are accepted; screens come in journey order and the leaving hook is the last ui interaction; '
  + 'a data-uxcli-note is pinned where its element is and listed under the frame, below the fold it pins to the bottom edge, and a further viewport is pictured beside the first; a lane with a play id carries the play button and the prototype script parses; a reference picture is shown beside the variants as a reference and never as a pick; a hook is outlined only where the browser found it, and a photographed variant opens in the viewer and can be compared; the gallery marks pick, part and not taken; the flow draws the picked variant and says no pick yet when there is none; a lens review is shown on its variant with what breaks, and a refused one says refused';

export function pair() {
  const problems = []; let checks = 0;
  const must = (what, cond) => { checks++; if (!cond) problems.push(what); };
  const variants = ['a-list', 'b-kanban'];
  const H = 'a'.repeat(64); const hashes = { 'a-list': H, 'b-kanban': 'b'.repeat(64) };
  const good = { schema_version: 1, pick: 'a-list', sha256: H, parts: { 'b-kanban': 'the counters' }, by: { type: 'role', ref: 'product-owner' } };
  const sha = rel => crypto.createHash('sha256').update(text(rel)).digest('hex');

  // must-pass
  must('a well-formed pick was refused', parsePick(good, variants, hashes).value?.pick === 'a-list');
  must('the example pick was refused', parsePick(read('mockups/agent.lead_detail/pick.json'), ['a-stacked', 'b-call-first'], { 'b-call-first': sha('mockups/agent.lead_detail/b-call-first.html') }).value !== null);
  // must-fail: a pick over a drawing that moved, and a pick that names no drawing
  must('a pick whose drawing changed was accepted', parsePick(good, variants, { 'a-list': 'c'.repeat(64) }).problems.some(p => /pick predates the drawing/.test(p)));
  must('a pick without sha256 was accepted', parsePick({ ...good, sha256: undefined }, variants, hashes).problems.some(p => /sha256 missing/.test(p)));
  // the receipt: hooks found, nothing reached for over the network, no filler
  const ok = receiptOf({ html: '<main data-uxcli="lead-board"><button data-uxcli="call-action">Gọi</button></main>', wanted: ['[data-uxcli=lead-board]', '[data-uxcli=call-action]'], found: ['[data-uxcli=lead-board]', '[data-uxcli=call-action]'] });
  must('a sound drawing fails its receipt', ok.ok && ok.hooks.found.length === 2);
  const bad = receiptOf({ html: '<link rel="stylesheet" href="https://cdn.example/x.css"><p>Lorem ipsum dolor</p>', wanted: ['[data-uxcli=call-action]'], found: [] });
  must('a drawing missing a hook, reaching for a CDN and full of lorem passes its receipt', !bad.ok && bad.hooks.missing.length === 1 && bad.external.length === 1 && bad.lorem);
  // shared tokens: off-palette colours reported; on-palette not; no _shared → nothing to say; the hash moves with the tokens
  const shared = { 'tokens.css': ':root{--ink:#1D2126;--surface:#fff}' };
  const off = tokensOf({ html: '<link rel="stylesheet" href="../_shared/tokens.css"><style>a{color:var(--ink);background:#FFFFFF;border-color:#0f6b4f}</style>', shared });
  must('an off-palette colour was not reported, or an on-palette one was', off.linked.length === 1 && off.off.length === 1 && off.off[0] === '#0f6b4f');
  must('a variant that does not link the shared file is not told so', tokensOf({ html: '<style>a{color:#1d2126}</style>', shared }).linked.length === 0);
  must('a project with nothing shared got a tokens line', tokensOf({ html: '<style>a{color:#123}</style>', shared: {} }) === null);
  must('the receipt does not carry the tokens', receiptOf({ html: '<style>a{color:#123}</style>', shared }).tokens.off[0] === '#112233');
  must('a token change does not change the drawing hash', drawingHash([Buffer.from('<p>x')]) !== drawingHash([Buffer.from('<p>x'), ':root{--a:#000}']) && drawingHash([Buffer.from('<p>x')]) === drawingHash(['<p>x']));
  must('the example variant that links _shared paints off the palette', (() => { const t = tokensOf({ html: text('mockups/agent.call_started/a-banner.html'), shared: { 'tokens.css': text('mockups/_shared/tokens.css') } }); return t.linked.length === 1 && t.off.length === 0; })());
  must('the card does not say where a colour is off the palette', /2 colours off the shared palette: #0f6b4f #b06a00/.test(mockupsCard({ dir: '.', screens: [{ id: 'a', variants: ['x'], pick: null, problems: [], receipts: { x: { ok: true, hooks: { found: [1], wanted: [1] }, problems: [], tokens: { files: ['tokens.css'], linked: ['tokens.css'], off: ['#0f6b4f', '#b06a00'] } } } }] })));
  const want = screensOf([read('journeys/handle-inbound-lead.json')]).find(s => s.id === 'agent.lead_detail');
  must('a screen does not want its own signal hooks and what leaves it', want.hooks.includes('[data-uxcli=lead-phone]') && want.hooks.includes('[data-uxcli=call-action]'));
  // must-fail
  must('a pick without by{} was accepted', parsePick({ ...good, by: undefined }, variants).problems.some(p => /nobody stands behind/.test(p)));
  must('a pick naming a variant not on disk was accepted', parsePick({ ...good, pick: 'c-none' }, variants).problems.some(p => /not a variant on disk/.test(p)));
  must('a part naming the pick itself was accepted', parsePick({ ...good, parts: { 'a-list': 'x' } }, variants).problems.some(p => /is the pick itself/.test(p)));
  must('an unknown key was accepted', parsePick({ ...good, approved: true }, variants).problems.some(p => /unknown key/.test(p)));
  must('a wrong schema_version was accepted', parsePick({ ...good, schema_version: 2 }, variants).problems.length > 0);

  // status
  const pk = parsePick(good, variants, hashes).value;
  must('statuses wrong', statusOf('a-list', pk) === 'pick' && statusOf('b-kanban', pk) === 'part' && statusOf('c', pk) === 'not-taken' && statusOf('a-list', null) === 'no-pick');

  // screens from the example journeys: order, leaving hook, param stripped
  const auth = read('journeys/authenticate.json'); const lead = read('journeys/handle-inbound-lead.json');
  const screens = screensOf([auth, lead]); const ids = screens.map(s => s.id);
  must('screens are not in journey order', ids[0] === 'anon.login_page' && ids.indexOf('agent.lead_detail') > ids.indexOf('agent.workspace_ready'));
  const login = screens.find(s => s.id === 'anon.login_page');
  must('the leaving hook is not the last ui interaction', login.leaves.every(l => l.target === '[data-uxcli=login-submit]'));
  must('a screen does not know both journeys that name it', screens.find(s => s.id === 'agent.workspace_ready').journeys.length === 2);
  must('a run-time param was not stripped from the hook', hookOf('[data-uxcli=lead-row][data-id={leadId}]') === '[data-uxcli=lead-row]');
  must('a plain hook was changed', hookOf('[data-uxcli=call-action]') === '[data-uxcli=call-action]');

  // the page
  const g = galleryHtml({ id: 'x', title: 'agent.workspace_ready', vw: 390, vh: 844, variants: [{ name: 'a-list', shot: 'a.png', status: 'pick' }, { name: 'b-kanban', shot: 'b.png', status: 'part', note: 'the counters' }, { name: 'c', shot: 'c.png', status: 'not-taken' }] });
  // a lens review on a variant is shown as the reviewer's claim, with what breaks; a refused one says refused
  const grv = galleryHtml({ id: 'r', title: 't', vw: 390, vh: 844, variants: [{ name: 'a', shot: 'a.png', status: 'no-pick', reviews: [{ lens: 'data', line: '8 of 40 hold · 19 break', by: 'agent claude', breaks: [{ id: 'craft.fewer-borders', where: 'card > well > shot', note: 'three boxes' }] }, { lens: 'shop', line: 'refused: 3 of 31 viewpoints unanswered', breaks: [], refused: true }] }] });
  must('a review on a variant is not shown with its lens, its line and its breaks', /<details class="review"><summary><b>data lens<\/b> · 8 of 40 hold · 19 break · agent claude/.test(grv) && grv.includes('craft.fewer-borders') && grv.includes('card &gt; well &gt; shot'));
  must('a refused review is not marked refused', /class="review refused"><summary><b>shop lens<\/b> · refused:/.test(grv));
  const gp = galleryHtml({ id: 'y', title: 't', vw: 1440, vh: 900, variants: [{ name: 'a', shot: 'a.png', status: 'no-pick', pins: [{ text: 'stays above the fold', x: 100, y: 200, w: 200, h: 50 }, { text: 'below', x: 0, y: 950, w: 10, h: 10 }], more: [{ vw: 390, vh: 844, shot: 'a@390x844.png' }] }] });
  must('a note is not pinned at its element or listed', /class="pin" style="left:13.89%;top:25.00%"/.test(gp) && /<li>stays above the fold<\/li>/.test(gp));
  must('a note below the fold is not pinned to the bottom edge', /class="pin off" style="left:0.35%;top:100.00%"/.test(gp));
  const gv = galleryHtml({ id: 'y2', title: 't', vw: 1440, vh: 900, variants: [{ name: 'a', shot: 'a.png', status: 'pick', view: 'view:s/a', pickId: 's/a', sig: 'role product-owner · 2026-09-29 · abc1234', receipt: 'hooks 2/2 · self-contained', screens: [{ vw: 1440, vh: 900, shot: 'a.png' }, { vw: 390, vh: 844, shot: 'a@390x844.png' }] }] });
  must('a further viewport is not pictured as a switchable screen', /class="screen" data-vp="390x844" style="aspect-ratio:390\/844"><a href="a@390x844.png"/.test(gv) && /class="screen" data-vp="1440x900"/.test(gv));
  must('a picked variant does not carry its signature, receipt and a checked pick box', /class="sig">✓ role product-owner · 2026-09-29 · abc1234</.test(gv) && /class="receipt">hooks 2\/2 · self-contained</.test(gv) && /data-pick="s\/a" checked/.test(gv));
  must('the gallery does not mark pick, part and not taken', /class="variant pick"/.test(g) && /class="variant part"/.test(g) && /not taken/.test(g) && /taken: the counters/.test(g));
  const f = flowRow({ id: 'w', kind: 'happy', vw: 390, vh: 844, frames: [{ shot: 'a.png', title: 's1', pill: { text: 'a-list', tone: 'ok' }, hot: { x: 10, y: 20, w: 100, h: 30 } }, { shot: null, title: 's2', missing: 'no pick yet · 2 variants', hot: null }], links: [{ label: 's1', text: 'tap' }] });
  must('the flow does not draw the hotspot from the rect', /class="hot" style="left:2.56%;top:2.37%;width:25.64%;height:3.55%"/.test(f));
  must('the flow does not say no pick yet for an unpicked screen', /no pick yet · 2 variants/.test(f));
  const fc = flowRow({ id: 'w', vw: 1440, vh: 900, frames: [{ shot: null, title: 's', missing: 'no pick yet · 2 variants', candidates: [{ name: 'a', shot: 'a.png', view: 'view:s/a' }, { name: 'b', shot: 'b.png' }] }], links: [] });
  must('an unpicked screen with drawings is an empty box instead of its candidates', /class="cands n2"><a href="a.png" data-view="view:s\/a"><img src="a.png"/.test(fc) && /2 variants · pick one/.test(fc) && !/noshot/.test(fc) && /class="lane wide"/.test(fc));
  must('a flow frame with a hotspot below the fold is not marked', /offhot/.test(flowRow({ id: 'w', vw: 390, vh: 844, frames: [{ shot: 'a.png', title: 's', hot: { off: true, target: '[data-uxcli=call-action]', scrolls: 2 } }, { shot: 'b.png', title: 't', hot: null }], links: [{ label: 's1' }] })));

  // the prototype: a lane with play gets the button, the overlay and the script exist and parse
  must('a playable lane has no play button', /<button class="play" type="button" data-play="j\/w">/.test(flowRow({ id: 'w', vw: 390, vh: 844, frames: [{ shot: 'a.png', title: 's' }], links: [], play: 'j/w' })));
  must('a lane without play grew a button', !/data-play/.test(flowRow({ id: 'w', vw: 390, vh: 844, frames: [{ shot: 'a.png', title: 's' }], links: [] })));
  must('the prototype script does not parse', (() => { try { new Function(PROTO_JS); return true; } catch { return false; } })() && /id="proto"/.test(protoHtml()));
  // hooks outlined where found, a variant opens in the viewer, and carries a compare box
  const gh = galleryHtml({ id: 'z', title: 't', vw: 1440, vh: 900, variants: [{ name: 'a', shot: 'a.png', status: 'no-pick', view: 'view:s/a', hooks: [{ sel: '[data-uxcli=x]', x: 144, y: 90, w: 288, h: 45 }, { sel: '[data-uxcli=none]', x: 0, y: 0, w: 0, h: 0 }] }] });
  must('a found hook is not outlined, or an unfound one is', /class="hk" style="left:10.00%;top:10.00%;width:20.00%;height:5.00%"><b>\[data-uxcli=x\]<\/b>/.test(gh) && !/data-uxcli=none/.test(gh));
  must('a variant does not open in the viewer or carry a compare box', /data-view="view:s\/a"/.test(gh) && /data-cmp="view:s\/a"/.test(gh));
  must('hooksHtml draws a hook the browser did not find', hooksHtml([{ sel: 'x', x: 0, y: 0, w: 0, h: 0 }], { vw: 10, vh: 10 }) === '');
  // a reference picture sits beside the variants, marked reference, and is never a pick
  const gr = galleryHtml({ id: 'r', title: 't', vw: 1440, vh: 900, variants: [{ name: 'a', shot: 'a.png', status: 'no-pick' }], refs: [{ name: 'chatgpt', src: 's/refs/chatgpt.png', view: 'ref:s/chatgpt.png' }] });
  must('a reference is not drawn beside the variants as a reference', /class="ref"><a href="s\/refs\/chatgpt.png" data-view="ref:s\/chatgpt.png">/.test(gr) && /class="refs-h">reference</.test(gr) && !/data-cmp="ref:/.test(gr) && !/data-pick="ref/.test(gr));
  // the card names the refused pick and the screen with no pick
  const card = mockupsCard({ dir: '.', screens: [{ id: 'a', variants: ['x'], pick: null, problems: ['by{type, ref} missing'] }, { id: 'b', variants: ['y'], pick: null, problems: [] }, { id: 'c', variants: [], pick: null, problems: [] }] });
  must('the card does not say REFUSED for a bad pick', /REFUSED\s+a/.test(card) && /by\{type, ref\} missing/.test(card));
  must('the card does not say no pick yet / no mockup', /no pick yet\s+b/.test(card) && /no mockup\s+c/.test(card));
  return { ok: !problems.length, checks, problems };
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  const r = pair(); console.log(r.ok ? `PASS mock · ${r.checks} checks` : 'FAIL ' + r.problems.join('\n     ')); process.exit(r.ok ? 0 : 1);
}

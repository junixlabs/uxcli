// uxcli's design system, one for every page it writes: the tokens, the icons and the shared component
// styles. Picked by the owner on 2026-10-03 from three drawings and a merge of two of them (docs/design/
// system/): the project is a canvas of the screens a person sees, read as filmstrips — pictures first,
// state as icons and colour on the picture, words only where a picture cannot say it. Pure.

// Every colour a page paints is one of these; light, with a dark set under prefers-color-scheme.
export const TOKENS = `:root{color-scheme:light;
--bg:#f3f4f7;--canvas:#f3f4f7;--dot:#d3d6de;--surface:#fff;--well:#f5f6f8;--line:#e6e8ee;--line-strong:#c9ccd6;
--ink:#16181d;--soft:#4b5160;--dim:#5b6170;--device:#16181d;
--accent:#3b3bd0;--accent-soft:#eef0ff;--brand-a:#5b5bf6;--brand-b:#22c3a6;
--fail:#b42318;--fail-strong:#d92d20;--fail-soft:#fde3e1;--find:#8a5300;--find-strong:#c4700a;--find-soft:#fff3d6;
--ok:#0b7350;--ok-soft:#e3f6ee;--open:#3b3bd0;--open-soft:#eef0ff;--idle:#525866;--idle-soft:#e9ebf0;
--shadow:0 1px 3px rgba(22,24,29,.06);--lift:0 8px 24px rgba(22,24,29,.12);
--sans:Inter,-apple-system,"Segoe UI",Helvetica,Arial,sans-serif;--mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace}
@media (prefers-color-scheme:dark){:root{color-scheme:dark;
--bg:#0f1115;--canvas:#0f1115;--dot:#262a33;--surface:#171a20;--well:#1d2128;--line:#262b34;--line-strong:#3a404c;
--ink:#e9ebf0;--soft:#c4c8d2;--dim:#a2a8b5;--device:#3a404c;
--accent:#a9b0ff;--accent-soft:#23264a;--fail:#ffb0a8;--fail-strong:#f0645a;--fail-soft:#3d1a17;--find:#ffd27a;--find-strong:#e8a33a;--find-soft:#3a2b0f;
--ok:#7ee2b8;--ok-soft:#123a2a;--open:#a9b0ff;--open-soft:#23264a;--idle:#a2a8b5;--idle-soft:#262b34;--shadow:none;--lift:0 8px 24px rgba(0,0,0,.5)}}`;

// 24px stroke icons; the same shape means the same thing on every page.
const PATHS = {
  drawn: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  picked: '<path d="M20 6 9 17l-5-5"/>',
  walked: '<path d="m6 3 14 9-14 9V3z"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  person: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  screens: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  journeys: '<rect x="3" y="4" width="6" height="6" rx="1"/><rect x="15" y="14" width="6" height="6" rx="1"/><path d="M9 7h3a3 3 0 0 1 3 3v4"/>',
  library: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  desktop: '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17h.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  version: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M6 8.5v3a4 4 0 0 0 4 4h5.5"/>',
  note: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
};
export const ICONS = PATHS;
export const icon = (name, size = 16, label = null) => `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${label ? ` role="img" aria-label="${label}"` : ' aria-hidden="true"'}>${PATHS[name] || ''}</svg>`;

// The status of a screen as the icons under its frame: drawn, picked, walked — or what is wrong.
// state: 'y' done · 'n' wrong · 'w' waiting on a person · '' not yet
export const STATE_WORDS = { y: 'done', n: 'needs a fix', w: 'waiting on a person', '': 'not yet' };

// Components shared by every page: the shell, floating panels, the device frame, status icons, pins.
export const COMPONENTS = `*{box-sizing:border-box}html,body{margin:0}body{background:var(--bg);color:var(--ink);font:13px/1.45 var(--sans)}
a{color:var(--accent)}button,select,textarea,input{font:inherit;color:inherit}button{cursor:pointer}:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.ic{flex:none;vertical-align:-3px}
.float{background:var(--surface);border:1px solid var(--line);border-radius:12px;box-shadow:var(--shadow)}
.bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.box{display:flex;align-items:center;gap:8px;padding:7px 12px;font-weight:600}
.logo i{width:20px;height:20px;border-radius:6px;background:linear-gradient(135deg,var(--brand-a),var(--brand-b));display:inline-block}
.tabs{display:flex;gap:2px;padding:4px}.tabs a,.tabs button{display:flex;align-items:center;gap:6px;padding:5px 10px;border:0;border-radius:8px;background:none;color:var(--soft);text-decoration:none;font-size:12px;font-weight:600}
.tabs [aria-current=page],.tabs [aria-pressed=true]{background:var(--accent-soft);color:var(--accent)}
.btn{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:8px;background:var(--surface);padding:6px 11px;font-weight:600;font-size:12px;text-decoration:none;color:var(--ink)}
.btn.primary{background:var(--accent);border-color:var(--accent);color:#fff}
@media (prefers-color-scheme:dark){.btn.primary{color:#0f1115}}
.chip{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:2px 9px;font-size:12px;font-weight:600;background:var(--surface);border:1px solid var(--line);color:var(--soft)}
.s{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:7px;background:var(--idle-soft);color:var(--idle)}
.s.y{background:var(--ok-soft);color:var(--ok)}.s.n{background:var(--fail-soft);color:var(--fail)}.s.w{background:var(--open-soft);color:var(--open)}
.ics{display:flex;gap:5px}
.device{position:relative;border-radius:18px;overflow:hidden;border:6px solid var(--device);background:#fff;box-shadow:var(--lift)}
.device.desk{border-radius:10px;border-width:4px}
.device img{display:block;width:100%}
.device.fail{border-color:var(--fail-strong);box-shadow:0 0 0 4px var(--fail-soft),var(--lift)}.device.find{border-color:var(--find-strong);box-shadow:0 0 0 4px var(--find-soft),var(--lift)}
.device .none{display:grid;place-items:center;height:100%;color:var(--dim);text-align:center;padding:12px;font-size:12px;background:var(--well);overflow-wrap:anywhere}
.fold{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;gap:5px;padding:6px;background:var(--fail-strong);color:#fff;font-weight:700;font-size:11px}
.fold.find{background:var(--find-strong);color:#1a1200}
.pin{position:absolute;display:grid;place-items:center;width:22px;height:22px;border-radius:50% 50% 50% 0;transform:translate(-4px,-22px) rotate(-45deg);background:var(--fail-strong);color:#fff;font-weight:800;font-size:11px;box-shadow:0 2px 6px rgba(0,0,0,.25)}.pin b{transform:rotate(45deg)}
.pin.find{background:var(--find-strong);color:#1a1200}
.k{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--dim)}.k.fail{color:var(--fail)}
.todo{display:flex;align-items:center;gap:8px;border:0;border-radius:10px;padding:7px 11px;background:var(--well);font-weight:600;text-align:left;color:var(--ink)}.todo .n{display:grid;place-items:center;width:22px;height:22px;border-radius:50%;color:#fff;font-size:11px;flex:none}
.todo .n.fail{background:var(--fail-strong)}.todo .n.find{background:var(--find-strong);color:#1a1200}.todo .n.open{background:var(--accent)}.todo .n.idle{background:var(--idle)}
@media (prefers-color-scheme:dark){.todo .n.open{color:#0f1115}}
.muted{color:var(--dim)}`;

// For the pages that predate this system (mockups, map, experience): their own variable names, given
// this system's values. Appended last in their CSS, so the light look is this one everywhere; their dark
// overrides stay as they were.
export const LEGACY_ALIASES = TOKENS + `:root{--finding:var(--find);--finding-soft:var(--find-soft);--pass:var(--ok);--pass-soft:var(--ok-soft);--faint:var(--dim);--line-soft:var(--line);--pin:var(--fail-strong);--stage:var(--canvas);--fail-ink:var(--fail);--pass-ink:var(--ok)}

body{font-family:var(--sans)}`;

// The chrome observer: perform one action on a Playwright page, wait for the page to come to rest,
// and return one Observation in the plan's shape. It only reports; deciding is core's.
//
// Two rules hold at this boundary and nowhere else. A response field the journey asked for leaves
// here as `sha1_8:…`, never as the value. Of a request's headers only `x-tenant-id` is read at all,
// so Authorization, Cookie and a password can not be copied by mistake: they were never picked up.
import path from 'node:path';
import { sha1_8, getPath, requestMatches } from './hash.js';
import { classifyHost, effectClassOf } from './policy.js';

const STATE = new WeakMap();

// One recorder per page, attached on first use and shared by every observation and intercept on it.
function state(page) {
  let s = STATE.get(page); if (s) return s;
  s = { seq: 0, log: [], inflight: 0, intercepts: [], hit: new Map(), routed: false };
  STATE.set(page, s);
  page.on('request', req => { if (!/^https?:/i.test(req.url())) return; s.inflight++; s.log.push({ seq: ++s.seq, req, t0: Date.now(), status: null, ms: null }); });
  const done = req => { s.inflight = Math.max(0, s.inflight - 1); const e = s.log.find(x => x.req === req); if (e && e.ms == null) e.ms = Date.now() - e.t0; };
  page.on('response', res => { const e = s.log.find(x => x.req === res.request()); if (e) { e.status = res.status(); e.res = res; e.body = res.text().catch(() => null); } });
  page.on('requestfinished', done); page.on('requestfailed', done);
  // "no DOM mutation for 300ms" needs a clock the page keeps; re-armed on every navigation.
  page.addInitScript(MUT).catch(() => {});
  return s;
}
const MUT = `(() => { window.__uxcliMut = performance.now(); new MutationObserver(() => { window.__uxcliMut = performance.now(); })
  .observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true }); })()`;

// intercept(page, { request: 'POST /api/login', status: 500, blockAllOfEffect: true })
// The request is answered inside the browser and never leaves it. Without `blockAllOfEffect` only the
// first match is taken; with it every later request of the same method+path (a retry too) is held
// until `release()`. Returns { count, release }.
export async function intercept(page, { request, status = 500, body = '{}', blockAllOfEffect = false }) {
  const s = state(page);
  const entry = { request, status, body, blockAll: !!blockAllOfEffect, fired: 0 };
  s.intercepts.push(entry);
  if (!s.routed) {
    s.routed = true;
    await page.route('**/*', route => {
      const req = route.request(); const p = pathOf(req.url());
      const hit = s.intercepts.find(i => (i.blockAll || !i.fired) && requestMatches(i.request, req.method(), p));
      if (!hit) return route.fallback();
      hit.fired++; s.hit.set(req, { status: hit.status });
      return route.fulfill({ status: hit.status, contentType: 'application/json', body: hit.body });
    });
  }
  return { get count() { return entry.fired; }, release() { s.intercepts = s.intercepts.filter(i => i !== entry); } };
}
export const releaseIntercepts = page => { const s = STATE.get(page); if (s) s.intercepts = []; };

const pathOf = u => { try { return new URL(u).pathname; } catch { return u; } };

// One action. `{ type: 'ui', target }` clicks; `{ type: 'fill', selector, value }` types;
// `{ type: 'navigate', to }` goes. A list is done in order.
async function act(page, action) {
  for (const a of [].concat(action || [])) {
    if (a.type === 'ui') await page.locator(a.target).first().click({ timeout: 15000 });
    else if (a.type === 'fill') await page.locator(a.selector).first().fill(String(a.value), { timeout: 15000 });
    else if (a.type === 'navigate') await page.goto(a.to, { waitUntil: 'load', timeout: 45000 });
    else throw new Error(`unknown action type: ${a.type}`);
  }
}

// Stable = nothing in flight and no mutation for 300ms, together; capped. Returns ms since t0.
async function waitStable(page, s, t0, cap) {
  for (;;) {
    const quiet = s.inflight === 0 && await page.evaluate(() => performance.now() - (window.__uxcliMut ?? 0)).catch(() => -1);
    if (quiet !== false && quiet >= 300) return Math.max(0, Date.now() - t0 - Math.floor(quiet));
    if (Date.now() - t0 >= cap) return cap;
    await page.waitForTimeout(50);
  }
}

// DOM facts for every selector the journey names. Read in one evaluate, against the viewport as it is
// at this moment: the observer never scrolls, so `scrollsNeeded` is what a person would have to do.
const DOM = `(sels) => {
  const vis = el => { if (!el.getClientRects().length) return false; const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0; };
  const out = {};
  for (const sel of sels) {
    let el = null; try { el = document.querySelector(sel); } catch {}
    if (!el) { out[sel] = { present: false, visible: false, enabled: false, inViewportWithoutScroll: false, scrollsNeeded: null, text: null, value: null }; continue; }
    const r = el.getBoundingClientRect(); const H = window.innerHeight, W = window.innerWidth;
    const inView = r.top >= 0 && r.left >= 0 && r.bottom <= H && r.right <= W;
    const scrollsNeeded = inView ? 0 : Math.ceil(Math.max(r.bottom - H, -r.top, 0) / H) || (r.right > W || r.left < 0 ? 1 : 0);
    out[sel] = { present: true, visible: vis(el), enabled: !el.disabled && el.getAttribute('aria-disabled') !== 'true',
      inViewportWithoutScroll: inView, scrollsNeeded, text: (el.innerText ?? el.textContent ?? '').trim(),
      value: 'value' in el && el.tagName !== 'LI' ? String(el.value ?? '') : null };
  }
  return out;
}`;
const ALERTS = `() => [...document.querySelectorAll('[role=alert],[role=status],[aria-live]:not([aria-live=off])')].map(el => {
  const cs = getComputedStyle(el);
  return { role: el.getAttribute('role') || 'live:' + el.getAttribute('aria-live'), text: (el.innerText ?? el.textContent ?? '').trim(),
    visible: !!el.getClientRects().length && cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0 };
})`;
const STORAGE = `(keys) => { const c = Object.fromEntries(document.cookie.split(';').map(x => x.trim().split('=')).filter(x => x[0]).map(([k, ...v]) => [k, v.join('=')]));
  const out = {};
  for (const k of keys) { const v = localStorage.getItem(k) ?? sessionStorage.getItem(k) ?? c[k] ?? null; out[k] = v === null ? { present: false } : { present: true, value: v }; }
  return out; }`;

// The response fields asked for: `['response.phone']` for any JSON response, or
// `[{ request: 'GET /api/leads/{id}', paths: [...] }]` for one request only.
async function fieldsOf(e, produces, pathname) {
  const paths = [];
  for (const p of produces) {
    if (typeof p === 'string') paths.push(p);
    else if (p?.paths && (!p.request || requestMatches(p.request, e.req.method(), pathname))) paths.push(...p.paths);
  }
  if (!paths.length || !e.body) return {};
  let json; try { json = JSON.parse(await e.body); } catch { return {}; }
  const out = {};
  for (const p of paths) { const v = getPath(json, p); if (v !== undefined) out[p] = sha1_8(v); }
  return out;
}

// observe(page, { action?, selectors, produces, policy, storageKeys, shotDir, shotName, stableCap, since })
// `since` is a network seq to read the log from (default: now) — a before-observation passes 0 to see how the page was reached.
export async function observe(page, opts = {}) {
  const { action = null, selectors = [], produces = [], policy = {}, storageKeys = [], shotDir = null, shotName = 'observation', stableCap = 10000, since } = opts;
  const s = state(page);
  await page.evaluate(MUT).catch(() => {});
  const from = since ?? s.seq; const t0 = Date.now();
  await act(page, action);
  const toStable = await waitStable(page, s, t0, stableCap);
  await page.evaluate(MUT).catch(() => {});                         // the action may have navigated
  const at = new Date().toISOString();
  const href = page.url();
  const dom = await page.evaluate(new Function('return ' + DOM)(), selectors).catch(() => ({}));
  const alerts = await page.evaluate(new Function('return ' + ALERTS)()).catch(() => []);
  const raw = await page.evaluate(new Function('return ' + STORAGE)(), storageKeys).catch(() => ({}));
  const storage = {};
  for (const [k, v] of Object.entries(raw)) storage[k] = v.present ? { present: true, hash: sha1_8(v.value) } : { present: false };

  const network = [];
  for (const e of s.log.filter(x => x.seq > from)) {
    const url = e.req.url(); const pathname = pathOf(url);
    const { host, hostClass, production } = classifyHost(url, policy);
    const n = { seq: e.seq, method: e.req.method(), path: pathname, host };
    if (hostClass) n.hostClass = hostClass;
    if (production) n.production = true;
    n.status = e.status; n.ms = e.ms;
    const effectClass = effectClassOf(n.method, pathname, policy); if (effectClass) n.effectClass = effectClass;
    const tenant = e.req.headers()['x-tenant-id'];
    n.requestHeaders = tenant !== undefined ? { 'x-tenant-id': tenant } : {};
    n.fields = await fieldsOf(e, produces, pathname);
    const hit = s.hit.get(e.req); if (hit) { n.blocked = true; n.intercepted = { status: hit.status }; }
    network.push(n);
  }

  const shots = [];
  if (shotDir) {
    const file = `${shotName}.png`;
    await page.screenshot({ path: path.join(shotDir, file), timeout: 5000 }).then(() => shots.push(file)).catch(() => {});
  }
  return { at, url: { href, path: pathOf(href) }, dom, a11y: { alerts }, network, storage, timing: { toStable }, shots };
}

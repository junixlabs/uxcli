// Drives the chrome observer against a page this file serves, and asserts what leaves the adapter:
// a button below the fold is reported as needing a scroll, an intercepted request never reaches the
// server, a response field leaves as a hash and the value does not, and no Authorization header does.
//
//   node test/chrome-adapter-check.mjs        PASS/FAIL per assertion; exit 1 on any FAIL
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { launch } from '../src/browser.js';
import { observe, intercept, releaseIntercepts } from '../src/adapters/chrome/index.js';

const PHONE = '+84901234567', SECRET = 'topsecret-bearer', TOKEN = 'sess-abc-123';
const HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>t</title></head><body>
<h1 id="top">Top</h1><div role="alert" id="alert"></div><input name="email" value="a@example.invalid">
<div style="height:2600px"></div><button id="below" data-uxcli="call-action">Call</button><button id="send">Send</button>
<script>
  localStorage.setItem('session.token', ${JSON.stringify(TOKEN)});
  fetch('/api/data', { headers: { Authorization: 'Bearer ${SECRET}', 'x-tenant-id': 't_uxcli_7f3a' } });
  document.getElementById('send').onclick = async () => {
    for (let i = 0; i < 2; i++) { const r = await fetch('/api/x', { method: 'POST', headers: { Authorization: 'Bearer ${SECRET}', 'x-tenant-id': 't_uxcli_7f3a' }, body: '{}' });
      if (r.status >= 500) document.getElementById('alert').textContent = 'Server error ' + r.status; }
  };
</script></body></html>`;

const hits = [];
const server = http.createServer((req, res) => {
  hits.push(req.method + ' ' + req.url);
  if (req.url === '/api/data') { res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify({ phone: PHONE, token: SECRET })); }
  if (req.url === '/api/x') { res.statusCode = 201; return res.end('{}'); }
  res.setHeader('content-type', 'text/html'); res.end(HTML);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const policy = { hostClasses: { 'local-fixture': ['127.0.0.1', 'localhost'] }, effects: { project: { x_write: { class: 'database_write', signature: 'POST /api/x' } } },
  environments: { production: { origin: 'https://crm.example.vn' } } };

let fails = 0;
const check = (what, cond) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${what}`); if (!cond) fails++; };
const shotDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-chrome-'));
const browser = await launch();
try {
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const selectors = ['#top', '#below', 'input[name=email]', '#missing'];

  const o1 = await observe(page, { action: { type: 'navigate', to: base + '/' }, selectors, produces: ['response.phone'], policy, storageKeys: ['session.token', 'nope'], shotDir, shotName: 's1-after' });
  const s1 = JSON.stringify(o1);
  check('below-the-fold button: inViewportWithoutScroll false', o1.dom['#below'].present && o1.dom['#below'].inViewportWithoutScroll === false);
  check('below-the-fold button: scrollsNeeded >= 1  (got ' + o1.dom['#below'].scrollsNeeded + ')', o1.dom['#below'].scrollsNeeded >= 1);
  check('heading at top: inViewportWithoutScroll true, scrollsNeeded 0', o1.dom['#top'].inViewportWithoutScroll === true && o1.dom['#top'].scrollsNeeded === 0);
  check('input value read, missing selector present:false', o1.dom['input[name=email]'].value === 'a@example.invalid' && o1.dom['#missing'].present === false);
  const data = o1.network.find(n => n.path === '/api/data');
  check('GET /api/data seen with status 200 and ms', data && data.status === 200 && typeof data.ms === 'number');
  check('response.phone hashed as sha1_8', /^sha1_8:[0-9a-f]{8}$/.test(data?.fields?.['response.phone'] || ''));
  check('raw phone value absent from serialized observation', !s1.includes(PHONE));
  check('Authorization header and bearer absent from serialized observation', !/authorization/i.test(s1) && !s1.includes(SECRET));
  check('x-tenant-id kept as the only request header', data?.requestHeaders?.['x-tenant-id'] === 't_uxcli_7f3a' && Object.keys(data.requestHeaders).length === 1);
  check('hostClass from policy globs', data?.hostClass === 'local-fixture' && data.production === undefined);
  check('storage: session.token present + hashed, raw token absent', o1.storage['session.token']?.present === true && /^sha1_8:/.test(o1.storage['session.token'].hash) && o1.storage.nope.present === false && !s1.includes(TOKEN));
  check('url.path and timing.toStable present', o1.url.path === '/' && Number.isInteger(o1.timing.toStable));
  check('screenshot written', o1.shots[0] === 's1-after.png' && fs.existsSync(path.join(shotDir, 's1-after.png')));

  const handle = await intercept(page, { request: 'POST /api/x', status: 500, blockAllOfEffect: true });
  const o2 = await observe(page, { action: { type: 'ui', target: '#send' }, selectors: ['#alert'], policy, shotDir, shotName: 'r1-after' });
  releaseIntercepts(page);
  const xs = o2.network.filter(n => n.path === '/api/x');
  check('intercepted POST /api/x never reached the server  (server hits: ' + hits.filter(h => h.includes('/api/x')).length + ')', !hits.some(h => h.includes('/api/x')));
  check('both attempts (retry too) blocked:true, intercepted:{status:500}  (' + xs.length + ' entries)', xs.length === 2 && xs.every(n => n.blocked === true && n.intercepted?.status === 500 && n.status === 500));
  check('intercept handle counted 2', handle.count === 2);
  check('effectClass from policy signature', xs.every(n => n.effectClass === 'database_write'));
  check('a11y alert visible with text after the 500', o2.a11y.alerts.some(a => a.role === 'alert' && a.visible && /500/.test(a.text)));

  if (process.argv.includes('--print')) console.log(JSON.stringify(o2, null, 1));
  fs.writeFileSync(path.join(shotDir, 'o1.json'), JSON.stringify(o1, null, 1)); fs.writeFileSync(path.join(shotDir, 'o2.json'), JSON.stringify(o2, null, 1));
  console.log('observations + shots in ' + shotDir);
} finally { await browser.close(); server.close(); }
process.exit(fails ? 1 : 0);

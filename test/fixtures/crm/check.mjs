// Proves the fixture behaves as DEFECTS.md says, in real Chrome. Not a uxcli run — a sanity check for the fixture itself.
// Usage: node test/fixtures/crm/check.mjs [origin]   (defaults to http://localhost:3000; starts nothing)
import { chromium } from 'playwright-core';

const ORIGIN = process.argv[2] || process.env.UXCLI_TARGET || 'http://localhost:3000';
const EMAIL = 'agent@example.invalid', PASSWORD = 'matkhau123';
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };

const browser = await chromium.launch({ executablePath: process.env.UXCLI_CHROME || process.env.CHROME_EXE || undefined, headless: true });

async function login(page) {
  await page.goto(ORIGIN + '/login');
  await page.fill('input[name=email]', EMAIL);
  await page.fill('input[name=password]', PASSWORD);
  await page.click('[data-uxcli=login-submit]');
  await page.waitForURL(/\/workspace\//);
  await page.locator('[data-uxcli=lead-list]').waitFor({ state: 'visible' });
}
// Position of the call button relative to the viewport, before any scroll.
async function callButtonPlacement(page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  return page.evaluate(() => {
    const el = document.querySelector('[data-uxcli=call-action]'); const r = el.getBoundingClientRect(); const vh = window.innerHeight;
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), viewportHeight: vh, inViewportWithoutScroll: r.top >= 0 && r.bottom <= vh, scrollsNeeded: Math.max(0, Math.floor(r.top / vh)) };
  });
}

for (const [w, h] of [[390, 844], [768, 1024], [1440, 900]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await login(page);
  if (w === 390) {
    check('workspace: url + GET /api/me + lead-list visible', /\/workspace\/ws_demo$/.test(page.url()) && await page.locator('[data-uxcli=lead-list]').isVisible(), page.url());
    check('workspace: lead-board is list, not kanban', await page.locator('[data-uxcli=lead-board][data-view=list]').count() === 1);
    check('storage: session.token present', !!await page.evaluate(() => localStorage.getItem('session.token')));
  }
  const calls = [];
  page.on('request', (r) => { if (r.url().endsWith('/api/calls') && r.method() === 'POST') calls.push({ tenantHeader: r.headers()['x-tenant-id'] }); });
  await page.click('[data-uxcli=lead-row][data-id=ld_0001]');
  await page.waitForURL(/\/leads\/ld_0001$/);
  await page.locator('[data-uxcli=lead-phone]').waitFor({ state: 'visible' });
  const placement = await callButtonPlacement(page);
  if (w === 390) {
    check(`lead-detail ${w}x${h}: call-action BELOW the fold (defect a)`, !placement.inViewportWithoutScroll && placement.scrollsNeeded >= 2, JSON.stringify(placement));
    check('lead-phone shows "0901 234 567" for +84901234567', (await page.textContent('[data-uxcli=lead-phone]')).trim() === '0901 234 567');
    check('call-status hidden before the click', !(await page.locator('[data-uxcli=call-status]').isVisible()));
    check('back-to-list present', await page.locator('[data-uxcli=back-to-list]').count() === 1);
    if (process.env.SHOT_DIR) await page.screenshot({ path: process.env.SHOT_DIR + '/lead-390.png' }).catch(() => {});
    const statusP = page.waitForResponse((r) => r.url().endsWith('/api/calls') && r.request().method() === 'POST');
    await page.click('[data-uxcli=call-action]');
    const res = await statusP;
    check('POST /api/calls → 201 with x-tenant-id = t_demo (constraint holds)', res.status() === 201 && calls[0]?.tenantHeader === 't_demo', JSON.stringify({ status: res.status(), ...calls[0] }));
    await page.locator('[data-uxcli=call-status]').waitFor({ state: 'visible' });
    check('call-status visible and contains "Đang gọi"', (await page.textContent('[data-uxcli=call-status]')).includes('Đang gọi'));
    await page.waitForTimeout(300);
    check('page survived the tel: navigation', /\/leads\/ld_0001$/.test(page.url()), page.url());
  } else {
    check(`lead-detail ${w}x${h}: call-action visible WITHOUT scroll`, placement.inViewportWithoutScroll, JSON.stringify(placement));
  }
  await ctx.close();
}

// Login recovery paths at phone size.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(ORIGIN + '/login');
  await page.fill('input[name=email]', EMAIL); await page.fill('input[name=password]', 'sai-mat-khau');
  await page.click('[data-uxcli=login-submit]');
  await page.locator('[role=alert]').waitFor({ state: 'visible' });
  check('401: alert visible, contains "không đúng", email KEPT, still on /login',
    (await page.textContent('[role=alert]')).includes('không đúng') && await page.inputValue('input[name=email]') === EMAIL && /\/login$/.test(page.url()));

  await page.reload();
  await page.route('**/api/login', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"internal"}' }));
  await page.fill('input[name=email]', EMAIL); await page.fill('input[name=password]', PASSWORD);
  const t0 = Date.now();
  await page.click('[data-uxcli=login-submit]');
  await page.locator('[role=alert]').waitFor({ state: 'visible' });
  const alertMs = Date.now() - t0;
  await page.waitForFunction(() => !document.querySelector('[data-uxcli=login-submit]').disabled);
  check('500: alert visible within 1000ms, submit enabled', alertMs <= 1000, alertMs + 'ms');
  check('500: email field CLEARED (defect b — value not kept)', await page.inputValue('input[name=email]') === '', JSON.stringify({ email: await page.inputValue('input[name=email]') }));
  await ctx.close();
}
// No session → workspace bounces to /login.
{
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  await page.goto(ORIGIN + '/workspace/ws_demo'); await page.waitForURL(/\/login$/);
  check('anonymous /workspace/* redirects to /login', true); await ctx.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks hold`);
process.exit(failed ? 1 : 0);

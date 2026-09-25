#!/usr/bin/env node
// Fixture CRM for real-estate agents: the product uxcli's vertical slice runs against.
// One process, in-memory data, no dependencies. `node server.mjs [port]` prints {"port":N} on stdout when listening.
// Every record carries tenantId. Planted defects live in pages/, and are listed in DEFECTS.md — not here.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.argv[2] ?? process.env.CRM_PORT ?? 0);
const HOUR = 3600_000;

// ---------- data ----------
const db = { tenants: new Map(), users: new Map(), leads: new Map(), calls: new Map(), sessions: new Map() };
let leadSeq = 0, callSeq = 0, phoneSeq = 1234567;

const newId = (prefix) => prefix + randomBytes(3).toString('hex');
const nextPhone = () => '+8490' + String(phoneSeq++).padStart(7, '0');
const minutesAgo = (m) => new Date(Date.now() - m * 60_000).toISOString();

const REQUIREMENTS = [
  { type: 'Căn hộ 2PN', area: 'Quận 2, TP.HCM', budget: '3,2 – 3,8 tỷ', size: '65 – 75 m²', bedrooms: 2, timeline: 'Trong 3 tháng', purpose: 'Để ở', legal: 'Sổ hồng riêng' },
  { type: 'Nhà phố', area: 'Thủ Đức, TP.HCM', budget: '6 – 7,5 tỷ', size: '80 – 100 m²', bedrooms: 3, timeline: 'Trong 6 tháng', purpose: 'Để ở + cho thuê tầng trệt', legal: 'Sổ hồng riêng' },
  { type: 'Đất nền', area: 'Long Thành, Đồng Nai', budget: '1,8 – 2,2 tỷ', size: '100 – 120 m²', bedrooms: 0, timeline: 'Chưa rõ', purpose: 'Đầu tư', legal: 'Sổ đỏ thổ cư 100%' },
  { type: 'Căn hộ 3PN', area: 'Quận 7, TP.HCM', budget: '5 – 6 tỷ', size: '90 – 110 m²', bedrooms: 3, timeline: 'Trong 1 tháng', purpose: 'Để ở', legal: 'Đang chờ sổ' },
];
const LISTINGS = [
  { code: 'DA-2041', title: 'Căn hộ 2PN view sông, tầng 18', price: '3,45 tỷ', size: '68 m²', status: 'Đang mở bán', match: 92 },
  { code: 'DA-1988', title: 'Căn hộ 2PN góc, nội thất cơ bản', price: '3,7 tỷ', size: '72 m²', status: 'Còn 2 căn', match: 86 },
  { code: 'DA-2107', title: 'Căn hộ 2PN+1, ban công Đông Nam', price: '3,9 tỷ', size: '75 m²', status: 'Nhận booking', match: 74 },
];
const TIMELINE = (createdAt) => [
  { at: createdAt, kind: 'system', text: 'Lead vào từ form website — chiến dịch "Căn hộ ven sông Q2"' },
  { at: createdAt, kind: 'system', text: 'Tự động gán nhóm: Khu Đông TP.HCM' },
  { at: createdAt, kind: 'note', text: 'Khách để lại lời nhắn: "Mình muốn xem nhà cuối tuần này, gọi mình sau 18h nhé."' },
  { at: createdAt, kind: 'system', text: 'Kiểm tra trùng số điện thoại: không trùng với lead nào trong 90 ngày' },
  { at: createdAt, kind: 'system', text: 'Điểm ưu tiên tính lại: nhu cầu rõ, ngân sách khớp 3 dự án đang mở bán' },
  { at: createdAt, kind: 'system', text: 'Nhắc SLA: cần phản hồi trong 15 phút kể từ khi lead vào' },
];

function createTenant(id, name) {
  const t = { id, name, workspaceId: 'ws_' + id.replace(/^t_/, ''), createdAt: new Date().toISOString() };
  db.tenants.set(id, t); return t;
}
function createUser({ tenantId, email, password, permissions, name, expiresAt = null }) {
  const u = { id: newId('u_'), tenantId, email, password, permissions, name, expiresAt, createdAt: new Date().toISOString() };
  db.users.set(u.id, u); return u;
}
function createLead({ tenantId, name, phone, status = 'new', assignedTo = null, source = 'website', createdMinutesAgo = 0, email = null }) {
  leadSeq += 1;
  const createdAt = minutesAgo(createdMinutesAgo);
  const l = {
    id: 'ld_' + String(leadSeq).padStart(4, '0'), tenantId, name, phone, email, status, assignedTo, source, createdAt,
    internalScore: 40 + ((leadSeq * 17) % 55),
    requirements: REQUIREMENTS[(leadSeq - 1) % REQUIREMENTS.length],
    timeline: TIMELINE(createdAt),
    suggestions: LISTINGS,
    note: 'Khách chủ động so sánh giá giữa 2 dự án, đã tự tìm hiểu pháp lý. Ưu tiên gửi bảng giá + lịch xem nhà ngay trong cuộc gọi đầu.',
  };
  db.leads.set(l.id, l); return l;
}

function seed() {
  const t = createTenant('t_demo', 'Địa Ốc Miền Đông');
  const agent = createUser({ tenantId: t.id, email: 'agent@example.invalid', password: 'matkhau123', permissions: ['agent'], name: 'Trần Minh Anh' });
  createUser({ tenantId: t.id, email: 'manager@example.invalid', password: 'matkhau123', permissions: ['agent', 'manager'], name: 'Lê Quốc Bảo' });
  createLead({ tenantId: t.id, name: 'Nguyễn Thị Hồng', phone: nextPhone(), status: 'new', createdMinutesAgo: 4 });
  createLead({ tenantId: t.id, name: 'Phạm Văn Đức', phone: nextPhone(), status: 'new', createdMinutesAgo: 12, source: 'zalo' });
  createLead({ tenantId: t.id, name: 'Võ Ngọc Lan', phone: nextPhone(), status: 'contacted', assignedTo: agent.id, createdMinutesAgo: 95, source: 'facebook' });
  createLead({ tenantId: t.id, name: 'Đặng Hoàng Nam', phone: nextPhone(), status: 'qualified', assignedTo: agent.id, createdMinutesAgo: 60 * 26 });
  createLead({ tenantId: t.id, name: 'Bùi Thu Trang', phone: nextPhone(), status: 'new', createdMinutesAgo: 41, source: 'hotline' });
  createLead({ tenantId: t.id, name: 'Lý Gia Huy', phone: nextPhone(), status: 'lost', assignedTo: agent.id, createdMinutesAgo: 60 * 24 * 3 });
}

// ---------- http helpers ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
const json = (res, status, body, headers = {}) => {
  const buf = Buffer.from(JSON.stringify(body));
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': buf.length, 'cache-control': 'no-store', ...headers });
  res.end(buf);
};
async function page(res, name, status = 200) {
  const buf = await readFile(path.join(ROOT, 'pages', name));
  res.writeHead(status, { 'content-type': MIME['.html'], 'content-length': buf.length, 'cache-control': 'no-store' });
  res.end(buf);
}
async function asset(res, rel) {
  const file = path.normalize(path.join(ROOT, 'assets', rel));
  if (!file.startsWith(path.join(ROOT, 'assets') + path.sep)) return json(res, 404, { error: 'Không tìm thấy' });
  try {
    const buf = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'content-length': buf.length, 'cache-control': 'no-store' });
    res.end(buf);
  } catch { json(res, 404, { error: 'Không tìm thấy' }); }
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > 64 * 1024) { reject(new Error('body too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { const raw = Buffer.concat(chunks).toString('utf8'); if (!raw) return resolve({}); try { resolve(JSON.parse(raw)); } catch { reject(new Error('invalid json')); } });
    req.on('error', reject);
  });
}
function cookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').map((p) => p.trim()).filter(Boolean).map((p) => { const i = p.indexOf('='); return [p.slice(0, i), decodeURIComponent(p.slice(i + 1))]; }));
}
function sessionOf(req) {
  const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const token = bearer || cookies(req).crm_session;
  const s = token && db.sessions.get(token);
  if (!s) return null;
  const user = db.users.get(s.userId);
  if (!user) { db.sessions.delete(token); return null; }
  if (user.expiresAt && Date.parse(user.expiresAt) < Date.now()) return null;
  return { token, user, tenant: db.tenants.get(user.tenantId) };
}
const publicLead = (l) => ({ id: l.id, tenantId: l.tenantId, name: l.name, phone: l.phone, email: l.email, status: l.status, assignedTo: l.assignedTo, source: l.source, createdAt: l.createdAt, internalScore: l.internalScore, requirements: l.requirements, timeline: l.timeline, suggestions: l.suggestions, note: l.note });
const publicUser = (u) => ({ id: u.id, email: u.email, name: u.name, permissions: u.permissions, tenantId: u.tenantId });

// ---------- api ----------
async function api(req, res, url) {
  const m = req.method, p = url.pathname;
  let seg;

  if (m === 'GET' && p === '/api/health') return json(res, 200, { ok: true, tenants: db.tenants.size, leads: db.leads.size });

  if (m === 'POST' && p === '/api/login') {
    const body = await readBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const user = [...db.users.values()].find((u) => u.email.toLowerCase() === email);
    if (!user || user.password !== String(body.password || '')) return json(res, 401, { error: 'Email hoặc mật khẩu không đúng' });
    if (user.expiresAt && Date.parse(user.expiresAt) < Date.now()) return json(res, 401, { error: 'Tài khoản đã hết hạn' });
    const token = randomBytes(24).toString('base64url');
    db.sessions.set(token, { token, userId: user.id, tenantId: user.tenantId, createdAt: new Date().toISOString() });
    const tenant = db.tenants.get(user.tenantId);
    return json(res, 200, { workspaceId: tenant.workspaceId, token, user: publicUser(user) },
      { 'set-cookie': `crm_session=${token}; Path=/; HttpOnly; SameSite=Lax` });
  }

  if (m === 'POST' && p === '/api/logout') {
    const s = sessionOf(req); if (s) db.sessions.delete(s.token);
    return json(res, 204, {}, { 'set-cookie': 'crm_session=; Path=/; Max-Age=0' });
  }

  if (m === 'GET' && p === '/api/me') {
    const s = sessionOf(req); if (!s) return json(res, 401, { error: 'Phiên đăng nhập không hợp lệ' });
    return json(res, 200, { ...publicUser(s.user), workspaceId: s.tenant.workspaceId, tenant: { id: s.tenant.id, name: s.tenant.name } });
  }

  if (m === 'GET' && p === '/api/leads') {
    const s = sessionOf(req); if (!s) return json(res, 401, { error: 'Phiên đăng nhập không hợp lệ' });
    const leads = [...db.leads.values()].filter((l) => l.tenantId === s.tenant.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(publicLead);
    const users = [...db.users.values()].filter((u) => u.tenantId === s.tenant.id).map((u) => ({ id: u.id, name: u.name }));
    return json(res, 200, { leads, users, responseSlaMinutes: 15 });
  }

  if (m === 'GET' && (seg = p.match(/^\/api\/leads\/([^/]+)$/))) {
    const s = sessionOf(req); if (!s) return json(res, 401, { error: 'Phiên đăng nhập không hợp lệ' });
    const l = db.leads.get(seg[1]);
    if (!l || l.tenantId !== s.tenant.id) return json(res, 404, { error: 'Không tìm thấy lead' });
    return json(res, 200, publicLead(l));
  }

  if (m === 'POST' && p === '/api/calls') {
    const s = sessionOf(req); if (!s) return json(res, 401, { error: 'Phiên đăng nhập không hợp lệ' });
    const tenantHeader = req.headers['x-tenant-id'];
    if (!tenantHeader) return json(res, 400, { error: 'Thiếu header x-tenant-id' });
    if (tenantHeader !== s.tenant.id) return json(res, 403, { error: 'x-tenant-id không thuộc phiên hiện tại' });
    const body = await readBody(req);
    const l = db.leads.get(String(body.leadId || ''));
    if (!l || l.tenantId !== s.tenant.id) return json(res, 404, { error: 'Không tìm thấy lead' });
    callSeq += 1;
    const call = { id: 'call_' + String(callSeq).padStart(4, '0'), tenantId: s.tenant.id, leadId: l.id, userId: s.user.id, to: l.phone, status: 'dialing', startedAt: new Date().toISOString() };
    db.calls.set(call.id, call);
    if (l.status === 'new') { l.status = 'contacted'; l.assignedTo = s.user.id; }
    l.timeline.push({ at: call.startedAt, kind: 'call', text: `${s.user.name} bắt đầu gọi ${l.phone}` });
    return json(res, 201, call);
  }

  if (m === 'GET' && p === '/api/calls') {
    const s = sessionOf(req); if (!s) return json(res, 401, { error: 'Phiên đăng nhập không hợp lệ' });
    return json(res, 200, { calls: [...db.calls.values()].filter((c) => c.tenantId === s.tenant.id) });
  }

  // ----- provisioning (what scripts/*.sh call; no auth, this is a fixture) -----
  if (m === 'POST' && p === '/api/provision/agents') {
    const body = await readBody(req);
    const suffix = randomBytes(3).toString('hex');
    const tenant = createTenant('t_uxcli_' + suffix, 'uxcli synthetic ' + suffix);
    const ttlMs = Math.min(Number(body.ttlHours) || 1, 24) * HOUR;
    const expiresAt = new Date(Date.now() + ttlMs).toISOString().replace(/\.\d{3}Z$/, 'Z');
    const user = createUser({ tenantId: tenant.id, email: `uxcli-${suffix}@example.invalid`, password: randomBytes(9).toString('base64url'), permissions: ['agent'], name: 'Môi giới uxcli ' + suffix, expiresAt });
    return json(res, 201, { user: { id: user.id, email: user.email, password: user.password, permissions: user.permissions }, tenant: { id: tenant.id, workspaceId: tenant.workspaceId }, expiresAt });
  }
  if ((seg = p.match(/^\/api\/provision\/agents\/([^/]+)$/))) {
    const user = db.users.get(seg[1]);
    if (!user) return json(res, 404, { error: 'Không tìm thấy user' });
    if (m === 'GET') return json(res, 200, { user: publicUser(user), tenant: { id: user.tenantId } });
    if (m === 'DELETE') {
      const tenantId = user.tenantId;
      const removed = { users: 0, leads: 0, calls: 0, sessions: 0 };
      for (const [k, v] of db.users) if (v.tenantId === tenantId) { db.users.delete(k); removed.users++; }
      for (const [k, v] of db.leads) if (v.tenantId === tenantId) { db.leads.delete(k); removed.leads++; }
      for (const [k, v] of db.calls) if (v.tenantId === tenantId) { db.calls.delete(k); removed.calls++; }
      for (const [k, v] of db.sessions) if (v.tenantId === tenantId) { db.sessions.delete(k); removed.sessions++; }
      db.tenants.delete(tenantId);
      return json(res, 200, { deleted: true, tenant: { id: tenantId }, removed });
    }
  }
  if (m === 'POST' && p === '/api/provision/leads') {
    const body = await readBody(req);
    const tenant = db.tenants.get(String(body.tenantId || ''));
    if (!tenant) return json(res, 404, { error: 'Không tìm thấy tenant' });
    const status = String(body.status || 'new');
    if (!['new', 'contacted', 'qualified', 'lost'].includes(status)) return json(res, 400, { error: 'status không hợp lệ' });
    const createdMinutesAgo = Number(body.createdMinutesAgo ?? 0);
    if (!Number.isFinite(createdMinutesAgo) || createdMinutesAgo < 0 || createdMinutesAgo > 1440) return json(res, 400, { error: 'createdMinutesAgo phải trong [0, 1440]' });
    const lead = createLead({ tenantId: tenant.id, name: body.name || 'Khách uxcli ' + randomBytes(2).toString('hex'), phone: body.phone || nextPhone(), status, assignedTo: body.assignedTo ?? null, source: body.source || 'website', createdMinutesAgo });
    return json(res, 201, { lead: { id: lead.id, phone: lead.phone, status: lead.status, assignedTo: lead.assignedTo, tenantId: lead.tenantId, createdAt: lead.createdAt } });
  }
  if ((seg = p.match(/^\/api\/provision\/leads\/([^/]+)$/))) {
    const lead = db.leads.get(seg[1]);
    if (!lead) return json(res, 404, { error: 'Không tìm thấy lead' });
    if (m === 'GET') return json(res, 200, { lead: { id: lead.id, phone: lead.phone, status: lead.status, assignedTo: lead.assignedTo, tenantId: lead.tenantId, createdAt: lead.createdAt } });
    if (m === 'DELETE') {
      db.leads.delete(lead.id);
      for (const [k, v] of db.calls) if (v.leadId === lead.id) db.calls.delete(k);
      return json(res, 200, { deleted: true, lead: { id: lead.id } });
    }
  }

  return json(res, 404, { error: 'Không tìm thấy' });
}

// ---------- pages ----------
async function pages(req, res, url) {
  const p = url.pathname;
  if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Method không hỗ trợ' });
  if (p === '/') { res.writeHead(302, { location: sessionOf(req) ? '/workspace/' + sessionOf(req).tenant.workspaceId : '/login' }); return res.end(); }
  if (p === '/login') return page(res, 'login.html');
  if (/^\/workspace\/[^/]+$/.test(p)) return page(res, 'workspace.html');
  if (/^\/leads\/[^/]+$/.test(p)) return page(res, 'lead.html');
  if (p.startsWith('/assets/')) return asset(res, p.slice('/assets/'.length));
  return page(res, 'not-found.html', 404);
}

seed();
const server = http.createServer(async (req, res) => {
  const t0 = Date.now();
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) await api(req, res, url); else await pages(req, res, url);
  } catch (e) {
    if (!res.headersSent) json(res, e.message === 'invalid json' || e.message === 'body too large' ? 400 : 500, { error: e.message });
  }
  res.on('finish', () => process.stderr.write(`${req.method} ${url.pathname} ${res.statusCode} ${Date.now() - t0}ms\n`));
});
server.listen(PORT, '127.0.0.1', () => {
  process.stdout.write(JSON.stringify({ port: server.address().port }) + '\n');
});
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => server.close(() => process.exit(0)));

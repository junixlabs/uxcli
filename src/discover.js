// uxcli discover <repo|url>: journey candidates as proposals. The agent may propose a journey; a human confirms it before `run` accepts it.
// Repo mode reads a Next.js app router tree (app/**/page.tsx → route) and files containing <form>. URL mode crawls same-origin pages two levels deep for forms.
import fs from 'node:fs';
import { normUrl } from './util.js'; import path from 'node:path';

const FORM_RE = /<form\b[^>]*>([\s\S]*?)<\/form>/gi;
const attr = (tag, name) => (tag.match(new RegExp(`\\b${name}\\s*=\\s*["'{]([^"'}]*)`, 'i')) || [])[1] || '';
const summariseForm = html => {
  const inputs = [...html.matchAll(/<(input|select|textarea)\b[^>]*>/gi)].map(m => ({ type: attr(m[0], 'type') || m[1].toLowerCase(), name: attr(m[0], 'name') || attr(m[0], 'id') || '', autocomplete: attr(m[0], 'autocomplete') }));
  const submit = [...html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/gi)].map(m => ({ type: attr(m[0], 'type') || 'submit', text: m[1].replace(/<[^>]+>/g, '').replace(/\{[^}]*\}/g, '').trim().slice(0, 40) })).filter(b => b.type !== 'button');
  return { fields: inputs.filter(i => !['hidden', 'submit', 'button'].includes(i.type)), submit: submit.map(b => b.text).filter(Boolean), auth: inputs.some(i => i.type === 'password') };
};

export function discoverRepo(root) {
  const appDirs = []; const walk = (d, depth) => { if (depth > 4) return; for (const f of fs.readdirSync(d, { withFileTypes: true })) { if (f.name === 'node_modules' || f.name.startsWith('.')) continue; const p = path.join(d, f.name); if (f.isDirectory()) { if (f.name === 'app' && fs.existsSync(path.join(p, 'layout.tsx')) || fs.existsSync(path.join(p, 'layout.js'))) appDirs.push(p); else walk(p, depth + 1); } } }; walk(root, 0);
  const routes = []; for (const app of appDirs) { const rec = d => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) rec(p); else if (/^page\.(tsx|jsx|js|ts)$/.test(f.name)) { const rel = path.relative(app, d).split(path.sep).filter(s => s && !/^\(.*\)$/.test(s)).join('/'); routes.push({ route: '/' + rel, file: path.relative(root, p), dynamic: /\[/.test(rel) }); } } }; rec(app); }
  const forms = []; const scan = d => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { if (f.name === 'node_modules' || f.name.startsWith('.')) continue; const p = path.join(d, f.name); if (f.isDirectory()) scan(p); else if (/\.(tsx|jsx|html|vue|svelte)$/.test(f.name)) { const t = fs.readFileSync(p, 'utf8'); for (const m of t.matchAll(FORM_RE)) forms.push({ file: path.relative(root, p), ...summariseForm(m[1]) }); } } }; scan(root);
  return { mode: 'repo', root, routes: routes.sort((a, b) => a.route.localeCompare(b.route)), forms };
}

export async function discoverUrl(start, { browser, limit = 30 } = {}) {
  const origin = new URL(start).origin; const seen = new Set([normUrl(start)]); const queue = [{ url: start, depth: 0 }]; const pages = [];
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  while (queue.length && pages.length < limit) {
    const { url, depth } = queue.shift(); const page = await ctx.newPage();
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 30000 });
      const info = await page.evaluate(() => ({ title: document.title, forms: [...document.querySelectorAll('form')].map(f => ({ action: f.getAttribute('action') || '', fields: [...f.querySelectorAll('input,select,textarea')].filter(i => !['hidden', 'submit', 'button'].includes(i.type) && i.getClientRects().length > 0 && !i.closest('[aria-hidden=true]') && (() => { for (let a = i; a; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) return false; } return true; })()).map(i => ({ type: i.type, name: i.name || i.id, autocomplete: i.getAttribute('autocomplete') || '' })), submit: [...f.querySelectorAll('button:not([type=button]),input[type=submit]')].map(b => (b.textContent || b.value || '').trim().slice(0, 40)).filter(Boolean), auth: !!f.querySelector('input[type=password]') })), links: [...document.querySelectorAll('a[href]')].map(a => a.href) }));
      pages.push({ url, title: info.title, forms: info.forms });
      if (depth < 2) for (const l of info.links) { try { const u = new URL(l); u.hash = ''; if (u.origin === origin && !seen.has(normUrl(u.href)) && !/\.(pdf|zip|png|jpg|svg)$/i.test(u.pathname)) { seen.add(normUrl(u.href)); queue.push({ url: u.href, depth: depth + 1 }); } } catch {} }
    } catch (e) { pages.push({ url, error: String(e.message || e).slice(0, 100) }); }
    await page.close();
  }
  await ctx.close();
  return { mode: 'url', start, pages };
}

// Journey proposals: every form becomes a one-step candidate with a `fill` skeleton; a password form is marked as the sign-in step. Provenance `proposal`, confirmedBy null.
export function proposals(d) {
  const out = [];
  const forms = d.mode === 'repo' ? d.forms.map(f => ({ where: f.file, url: null, ...f })) : d.pages.flatMap(p => (p.forms || []).map(f => ({ where: p.url, url: p.url, ...f })));
  const seen = new Map();
  for (const f of forms) {
    if (!f.fields.length && !f.submit.length) continue;
    // The same form served at several URLs (locales, trailing slashes) is one proposal; the other URLs are listed on it.
    const sig = (f.action || '') + '|' + f.fields.map(i => i.name).join(',');
    if (seen.has(sig)) { const p = seen.get(sig); if (f.where !== p.from) (p.alsoAt ||= []).push(f.where); continue; }
    const fill = Object.fromEntries(f.fields.map(i => [i.name ? `[name="${i.name}"]` : `[type="${i.type}"]`, i.type === 'password' ? '{{password}}' : i.autocomplete === 'email' || i.type === 'email' ? '{{email}}' : `{{${(i.name || i.type).replace(/[^a-z0-9]/gi, '_')}}}`]));
    const prop = { name: `${f.auth ? 'sign-in' : 'form'} · ${f.where}`, provenance: 'proposal', confirmedBy: null, from: f.where, steps: [{ url: f.url || '{{base}}<route of ' + f.where + '>', fill, submit: f.submit[0] ? `button:has-text("${f.submit[0]}")` : 'button[type=submit]', commit: !f.auth }] };
    seen.set(sig, prop); out.push(prop);
  }
  return out;
}

export function discoverCard(d, props) {
  const L = [`uxcli discover · ${d.mode === 'repo' ? d.root : d.start}`, ''];
  if (d.mode === 'repo') { L.push(`  routes ${d.routes.length}${d.routes.length ? ': ' + d.routes.slice(0, 12).map(r => r.route).join(', ') + (d.routes.length > 12 ? ', …' : '') : ''}`); L.push(`  forms  ${d.forms.length} in source`); for (const f of d.forms.slice(0, 12)) L.push(`         ${f.file}: ${f.fields.length} field${f.fields.length === 1 ? '' : 's'}${f.auth ? ', password' : ''}${f.submit.length ? `, submit "${f.submit[0]}"` : ''}`); }
  else { const withForms = d.pages.filter(p => p.forms?.length); L.push(`  pages  ${d.pages.length} crawled, ${withForms.length} with forms`); for (const p of withForms.slice(0, 12)) L.push(`         ${p.url}: ${p.forms.map(f => `${f.fields.length} field${f.fields.length === 1 ? '' : 's'}${f.auth ? ', password' : ''}${f.submit[0] ? `, submit "${f.submit[0]}"` : ''}`).join(' | ')}`); }
  L.push('', `  ${props.length} journey proposal${props.length === 1 ? '' : 's'} written (provenance proposal). A human fills the values, sets confirmedBy, and moves each file next to the project's journeys before run accepts it.`);
  return L.join('\n');
}

// Design-token lookup: which custom property in the project's stylesheets declares a colour. Read-only scan of --src.
import fs from 'node:fs'; import path from 'node:path';
const EXT = new Set(['.css', '.scss', '.sass', '.less', '.pcss', '.styl']);
export function tokenIndex(root) {
  const idx = {}; if (!root || !fs.existsSync(root)) return idx;
  const walk = d => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { if (f.name === 'node_modules' || f.name.startsWith('.')) continue; const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else if (EXT.has(path.extname(f.name))) scan(p); } };
  const scan = file => { const text = fs.readFileSync(file, 'utf8'); for (const m of text.matchAll(/(--[a-zA-Z0-9_-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\b/g)) { const hex = expand(m[2]); if (hex) (idx[hex] ||= []).push({ token: m[1], file: path.relative(root, file) }); } };
  walk(root); return idx;
}
const expand = h => { h = h.toLowerCase(); if (h.length === 4) return '#' + [...h.slice(1)].map(c => c + c).join(''); if (h.length === 7) return h; if (h.length === 9) return h.slice(0, 7); return null; };
export const tokenFor = (idx, hex) => (idx[String(hex || '').toLowerCase()] || [])[0]?.token || null;

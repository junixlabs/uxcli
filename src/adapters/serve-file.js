// The one way a uxcli server hands out a file from disk: only a file under `base`, only of a type it
// names, and a malformed or escaping path is a 404 rather than a crash.
import fs from 'node:fs'; import path from 'node:path';

export const MIME = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.css': 'text/css', '.svg': 'image/svg+xml', '.js': 'text/javascript' };

export function serveFile(res, base, rel, types = MIME) {
  let file; try { file = path.resolve(base, decodeURIComponent(rel)); } catch { file = null; }
  const type = file && types[path.extname(file).toLowerCase()];
  if (!type || !file.startsWith(base + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' }); fs.createReadStream(file).pipe(res);
}

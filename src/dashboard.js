// uxcli dashboard: one viewer on this machine for runs that stay in their own projects.
//
// The split is deliberate and is the whole design. Evidence — run.json and its screenshots — stays in
// the project that produced it, because a verdict is only licensed by a commitment signed in that
// project, because CI has no home directory, and because an agent asked to dispute a verdict must be
// able to open the packet from the repo it is working in. What lives in ~/.uxcli is an index of
// pointers and nothing else: delete it and you lose the list, never a single piece of evidence.
//
// file:// cannot fetch file://, so a viewer that reads many projects has to be served. It is served on
// the loopback interface only, and it will only open files under a directory that is in the index.
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import http from 'node:http'; import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const HOME = path.join(os.homedir(), '.uxcli');
export const INDEX = path.join(HOME, 'index.json');

const read = () => { try { const j = JSON.parse(fs.readFileSync(INDEX, 'utf8')); return Array.isArray(j.runs) ? j : { runs: [] }; } catch { return { runs: [] }; } };

// One line per outDir, replaced in place: the index is a list of where runs are, not a history of them.
// A machine without a writable home (CI) simply has no index; that must never fail a run.
export function registerRun(result, outDir) {
  try {
    const dir = path.resolve(outDir); const idx = read();
    const probes = result.probes || [];
    const entry = {
      kind: result.journey ? 'journey' : 'page',
      name: result.journey || result.title || result.url || path.basename(dir),
      where: result.finalUrl || result.url || null,
      project: path.resolve('.'), dir, ranAt: result.ranAt || new Date().toISOString(),
      worst: probes.some(p => p.verdict === 'fail') ? 'fail'
        : probes.some(p => p.verdict === 'finding') ? 'finding'
          : probes.some(p => p.verdict === 'unmeasurable') ? 'unmeasurable'
            : probes.some(p => p.verdict === 'pass') ? 'pass' : 'not-applicable',
      counts: probes.reduce((a, p) => ({ ...a, [p.verdict]: (a[p.verdict] || 0) + 1 }), {}),
    };
    idx.runs = [entry, ...idx.runs.filter(r => r.dir !== dir)];
    fs.mkdirSync(HOME, { recursive: true }); fs.writeFileSync(INDEX, JSON.stringify(idx, null, 1) + '\n');
  } catch { /* no index is a fine state; a run is not worth failing over one */ }
}

// A directory is readable only because it is in the index, and a file only because it resolves inside
// that directory. Screenshots can show a signed-in page, so this is the one check that has to be exact.
const under = (dir, f) => { const p = path.resolve(dir, f); return p === dir || p.startsWith(dir + path.sep) ? p : null; };
const allowed = (idx, dir) => idx.runs.some(r => r.dir === path.resolve(dir || '')) ? path.resolve(dir) : null;

export function serve({ port = 4717, host = '127.0.0.1' } = {}) {
  const send = (res, code, type, body) => { res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' }); res.end(body); };
  const server = http.createServer((req, res) => {
    // Bound to loopback, and a Host header from anywhere else is refused: a page in the browser must
    // not be able to reach this through a name that resolves here.
    const hostHdr = (req.headers.host || '').replace(/:\d+$/, '');
    if (!['127.0.0.1', 'localhost', '[::1]', '::1'].includes(hostHdr)) return send(res, 403, 'text/plain', 'loopback only');
    const u = new URL(req.url, 'http://127.0.0.1'); const q = u.searchParams; const idx = read();
    try {
      if (u.pathname === '/') return send(res, 200, 'text/html; charset=utf-8', fs.readFileSync(path.join(HERE, 'dashboard.html')));
      // The palette is a real stylesheet so `uxcli sheet` can read the project's own tokens out of it.
      if (u.pathname === '/dashboard.tokens.css') return send(res, 200, 'text/css; charset=utf-8', fs.readFileSync(path.join(HERE, 'dashboard.tokens.css')));
      if (u.pathname === '/api/index') return send(res, 200, 'application/json', JSON.stringify(idx));
      if (u.pathname === '/api/run') {
        const dir = allowed(idx, q.get('dir')); if (!dir) return send(res, 404, 'application/json', '{"error":"not in index"}');
        return send(res, 200, 'application/json', fs.readFileSync(path.join(dir, 'run.json')));
      }
      if (u.pathname === '/file') {
        const dir = allowed(idx, q.get('dir')); if (!dir) return send(res, 404, 'text/plain', 'not in index');
        const f = under(dir, q.get('f') || ''); if (!f || !/\.(png|jpe?g)$/i.test(f)) return send(res, 403, 'text/plain', 'not a screenshot in this run');
        return send(res, 200, /\.png$/i.test(f) ? 'image/png' : 'image/jpeg', fs.readFileSync(f));
      }
      // The packet is what a person attaches to a dispute, so being able to reach it is the point. Only
      // a directory that is in the index can be opened, and only through the OS file manager.
      if (u.pathname === '/api/open') {
        const dir = allowed(idx, q.get('dir')); if (!dir) return send(res, 404, 'text/plain', 'not in index');
        const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open';
        spawn(cmd, [dir], { stdio: 'ignore', detached: true }).unref();
        return send(res, 200, 'application/json', '{"ok":true}');
      }
      if (u.pathname === '/api/forget') {
        const dir = path.resolve(q.get('dir') || ''); idx.runs = idx.runs.filter(r => r.dir !== dir);
        fs.writeFileSync(INDEX, JSON.stringify(idx, null, 1) + '\n'); return send(res, 200, 'application/json', JSON.stringify(idx));
      }
    } catch (e) { return send(res, 404, 'text/plain', String(e.message || e).slice(0, 120)); }
    send(res, 404, 'text/plain', 'no such route');
  });
  return new Promise(resolve => server.listen(port, host, () => resolve({ server, url: `http://${host}:${port}/` })));
}

export function indexCard() {
  const idx = read(); const L = [`uxcli dashboard · ${INDEX}`, ''];
  if (!idx.runs.length) return L.concat(['  no run recorded yet. Every `uxcli run` adds one line here; the evidence stays in its project.']).join('\n');
  const gone = idx.runs.filter(r => !fs.existsSync(path.join(r.dir, 'run.json'))).length;
  for (const r of idx.runs.slice(0, 12)) L.push(`  ${r.worst.padEnd(13)} ${r.kind.padEnd(8)} ${String(r.name).slice(0, 46).padEnd(46)} ${r.dir.replace(os.homedir(), '~')}`);
  if (idx.runs.length > 12) L.push(`  … ${idx.runs.length - 12} more`);
  if (gone) L.push('', `  ${gone} run${gone > 1 ? 's are' : ' is'} listed but no longer on disk: the index points, it does not keep a copy.`);
  return L.join('\n');
}

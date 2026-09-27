// The one place that knows what a project's declaration files are called and what their absence
// means. Four copies of that fallback had already begun to disagree — one read a missing registry as
// empty, another would have thrown. `arch.js` checks nothing outside this directory names them.
import fs from 'node:fs'; import path from 'node:path';

export const NAMES = {
  commitments: 'uxcli.commitments.json',
  authorities: 'uxcli.authorities.json',
  proposedCommitments: 'uxcli.commitments.proposed.json',
  proposedAuthorities: 'uxcli.authorities.proposed.json',
};

export const pathTo = (root, which) => path.join(root || '.', NAMES[which]);

// Replaces `path.resolve('.')`, which minted a new project for every subdirectory somebody ran from.
// Stops at home so a stray run in ~ does not claim the whole home.
const MARKERS = [NAMES.commitments, '.git', 'package.json'];
export function projectRoot(from, home) {
  const stop = home ? path.resolve(home) : null;
  let dir = path.resolve(from || '.');
  for (;;) {
    if (MARKERS.some(m => fs.existsSync(path.join(dir, m)))) return dir;
    const up = path.dirname(dir);
    if (up === dir || dir === stop) return path.resolve(from || '.');
    dir = up;
  }
}
export const found = (root, which) => { const p = pathTo(root, which); return fs.existsSync(p) ? p : null; };

// Absent is a state; unparseable is not. The second throws, because guessing past a broken
// declaration is how a tool enforces something nobody wrote.
const read = (root, which) => { const p = found(root, which); return p ? JSON.parse(fs.readFileSync(p, 'utf8')) : null; };

export const readCommitments = root => read(root, 'commitments');

// Both shapes are what a person writes first; refusing the one they picked teaches nothing.
export function readAuthorities(root) {
  const doc = read(root, 'authorities');
  if (!doc) return [];
  return Array.isArray(doc) ? doc : (doc.authorities || []);
}

export const readEntries = root => readCommitments(root)?.entries || [];

export function writeProposedCommitments(root, doc) {
  const p = pathTo(root, 'proposedCommitments');
  fs.writeFileSync(p, JSON.stringify(doc, null, 1) + '\n');
  return p;
}
export const readProposedCommitments = root => read(root, 'proposedCommitments');

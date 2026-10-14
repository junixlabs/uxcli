// Where the designer's files live: one global place (~/.uxcli/designer/, or $UXCLI_HOME/designer/ so
// a test never touches the real home) and one per project (.uxcli/designer/). The only file in uxcli
// that reads the home directory.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';

export const globalDir = () => path.join(process.env.UXCLI_HOME || path.join(os.homedir(), '.uxcli'), 'designer');
export const projectDir = root => path.join(root, '.uxcli', 'designer');
export const readJson = f => fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
export const listJson = dir => fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().map(f => path.join(dir, f)) : [];
// Only ever creates: a file already there is left as it was.
export function create(file, doc) {
  if (fs.existsSync(file)) return 'kept';
  fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n'); return 'create';
}
// Derived files (taste.json, the global copy of a decision) are rewritten from their source each time.
export function rewrite(file, doc) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n'); }
// The global store keeps a copy of every decision a project let it learn from, one folder per project.
export const globalDecisions = () => { const d = path.join(globalDir(), 'decisions'); return fs.existsSync(d) ? fs.readdirSync(d).sort().flatMap(p => listJson(path.join(d, p)).map(file => ({ project: p, file }))) : []; };

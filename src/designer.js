// The designer on disk: the shipped catalog (skills/uxcli/designer/catalog.json and the catalog.md an
// agent reads, installed with the skill). The model is pure (src/core/model/catalog.js); this reads files.
import fs from 'node:fs'; import path from 'node:path';
import { parseCatalog, catalogMarkdown } from './core/model/catalog.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const DESIGNER_DIR = path.join(ROOT, 'skills', 'uxcli', 'designer');
const readJson = f => JSON.parse(fs.readFileSync(f, 'utf8'));

export function catalog() {
  const r = parseCatalog(readJson(path.join(DESIGNER_DIR, 'catalog.json')));
  return { value: r.value, problems: r.problems.map(p => `catalog.json: ${p}`) };
}

export { catalogMarkdown };

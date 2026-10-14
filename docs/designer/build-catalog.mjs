// Write skills/uxcli/designer/catalog.md from catalog.json. The JSON is the source; the gate
// (test/catalog-pairs.mjs) refuses a catalog.md that differs from this rendering.
import fs from 'node:fs'; import path from 'node:path';
import { catalog, catalogMarkdown, DESIGNER_DIR } from '../../src/designer.js';
const c = catalog();
if (c.problems.length) { console.error(c.problems.join('\n')); process.exit(1); }
fs.writeFileSync(path.join(DESIGNER_DIR, 'catalog.md'), catalogMarkdown(c.value));
console.log('wrote', path.relative(process.cwd(), path.join(DESIGNER_DIR, 'catalog.md')));

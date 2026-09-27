// Rebuild examples/crm/.uxcli/index.json from the example's own declarations and runs. The file is a
// projection; this is the one way it is written, and level-pairs checks it still matches.
import fs from 'node:fs'; import path from 'node:path';
import { projection } from '../src/core/level/projection.js';
import { DATA, exampleInput } from '../test/example-data.mjs';
const out = path.join(DATA, 'index.json');
fs.writeFileSync(out, JSON.stringify(projection(exampleInput()), null, 2) + '\n');
console.log(`wrote ${path.relative(process.cwd(), out)}`);

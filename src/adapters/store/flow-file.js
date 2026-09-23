// The adapter that turns a path into text so the core never has to. One line of capability, named,
// with nothing else in it — which is the only way the "no business logic in the new layer" promise
// stays checkable.
import fs from 'node:fs';
import { parseFlow, Rejection } from '../../core/promise/parse.js';

export function readFlow(file, vars = {}) {
  let text; try { text = fs.readFileSync(file, 'utf8'); } catch (e) { throw new Rejection(file, `cannot be read: ${e.code || e.message}`); }
  return parseFlow(text, { file, vars });
}

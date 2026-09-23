// Disk half of `core/context.js`. That one knows the shape and nothing about where it lives; this
// one knows where it lives and decides nothing.
import path from 'node:path';
import { readContext as parse, contextCard as card, FIELDS } from './core/context.js';
import { readContext as load, found, pathTo } from './adapters/store/project-files.js';

export { FIELDS };

export function contextOf(root) {
  const doc = load(root);
  const file = path.relative(process.cwd(), found(root, 'context') || pathTo(root, 'context'));
  return doc ? { ...parse(doc), file, exists: true } : { file, exists: false, root };
}

export const contextCard = ctx => ctx.exists ? card(ctx, ctx.file)
  : `no ${path.basename(ctx.file)} under ${ctx.root}: this project has not said what it is, so a proposal has nothing to cite`;

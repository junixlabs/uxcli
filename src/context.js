// Disk half of `core/context.js`. That one knows the shape and nothing about where it lives; this
// one knows where it lives and decides nothing.
//
// It resolves every document the context cites — reads it, and asks git whether it travels with the
// repository — because a citation nobody else can open is a citation only for whoever wrote it.
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
import { readContext as parse, contextCard as card, citationOf, FIELDS } from './core/context.js';
import { readContext as load, found, pathTo } from './adapters/store/project-files.js';

export { FIELDS };

const tracked = (root, rel) => {
  try { execFileSync('git', ['-C', root, 'ls-files', '--error-unmatch', rel], { stdio: 'ignore' }); return true; }
  catch { return false; }
};

// What a document says, not how it is marked up. A quote is taken from the thing a person read, and
// in an HTML document the markup splits sentences a reader sees whole — `Người đứng tên</b><br><span
// class="dim">vận hành agent</span>` is one phrase on the page and three fragments in the file. The
// stripping happens here because it is a reading decision; `core/` is handed text and compares words.
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };
const saysOf = (text, file) => /\.html?$/i.test(file)
  ? text.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&([a-z]+|#\d+);/gi, (m, k) => ENTITIES[k.toLowerCase()] ?? m)
  : text;

// One entry per document the context names, read once however many fields cite it.
function resolve(doc, root) {
  const out = {};
  for (const key of Object.keys(FIELDS)) {
    const cite = citationOf(doc?.[key]);
    if (!cite || out[cite.doc]) continue;
    const at = path.resolve(root || '.', cite.doc);
    try {
      out[cite.doc] = fs.existsSync(at)
        ? { found: true, text: saysOf(fs.readFileSync(at, 'utf8'), cite.doc), tracked: tracked(root || '.', cite.doc) }
        : { found: false };
    } catch { out[cite.doc] = { found: false }; }
  }
  return out;
}

export function contextOf(root) {
  const doc = load(root);
  const file = path.relative(process.cwd(), found(root, 'context') || pathTo(root, 'context'));
  return doc ? { ...parse(doc, { docs: resolve(doc, root) }), file, exists: true } : { file, exists: false, root };
}

export const contextCard = ctx => ctx.exists ? card(ctx, ctx.file)
  : `no ${path.basename(ctx.file)} under ${ctx.root}: this project has not said what it is, so a proposal has nothing to cite`;

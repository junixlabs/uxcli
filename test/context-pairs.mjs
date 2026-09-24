import { readContext, standingOf, citable, citationOf, STANDINGS, FIELDS } from '../src/core/context.js';

export const OPERATOR = 'a field quoting words that are really in the document, against the same field once the document no longer says them — which is what happened to this project\'s own declaration and which the old rule, asking only whether `source` was a non-empty string, reported as known; and the three honest ways a citation says less than that, none of which may be read as a mismatch: a source that is only a name, a document that could not be read, and a field nobody wrote.';

const DOC = 'Trước khi nó được phép nói "xong", sản phẩm đang chạy\nphải được đối chiếu với những gì đã được hứa.';
const at = (text, tracked = true) => ({ 'spec.md': { found: true, text, tracked } });
const field = (source, value = 'x') => ({ value, source });

export function pair() {
  const problems = [];
  let checks = 0;
  const is = (got, want, what) => { checks++; if (got !== want) problems.push(`${what}: ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`); };

  const cited = field({ doc: 'spec.md', quote: 'phải được đối chiếu với những gì đã được hứa' });

  // The pair. Same declaration, same quote; only the document moves.
  is(standingOf(cited, at(DOC)).standing, 'quoted', 'a quote that is in the document');
  is(standingOf(cited, at('Tài liệu này đã được viết lại.')).standing, 'drifted', 'the document no longer says it');

  // A quote is words, not bytes: a sentence re-wrapped when the file was edited is the same sentence.
  is(standingOf(field({ doc: 'spec.md', quote: 'sản phẩm đang chạy phải được đối chiếu' }), at(DOC)).standing,
    'quoted', 'a quote that spans a line break in the document');

  // The three ways of saying less, each its own word. None of them is `drifted`: a citation that was
  // never checkable did not fail a check.
  is(standingOf(field('spec.md'), at(DOC)).standing, 'unquoted', 'the old bare-string source');
  is(standingOf(field({ doc: 'spec.md' }), at(DOC)).standing, 'unquoted', 'a document named with no quote');
  is(standingOf(cited, { 'spec.md': { found: false } }).standing, 'unresolved', 'a document that could not be read');
  is(standingOf(cited, {}).standing, 'unresolved', 'a document nobody resolved');
  is(standingOf(field({ doc: '  ', quote: 'x' }), at(DOC)).standing, 'unsourced', 'whitespace is not a document');
  is(standingOf(field(null), at(DOC)).standing, 'unsourced', 'a value with no source');
  is(standingOf('a bare string', at(DOC)).standing, 'unsourced', 'a value that is not a field object');
  is(standingOf(undefined, at(DOC)).standing, 'undeclared', 'a field nobody wrote');
  is(standingOf(null, at(DOC)).standing, 'undeclared', 'a field written as null');

  // Reachability is reported beside the standing, never folded into it: the quote is in the document
  // wherever the document lives.
  is(standingOf(cited, at(DOC, false)).standing, 'quoted', 'an untracked document still holds its quote');
  is(standingOf(cited, at(DOC, false)).portable, false, 'a document git does not track is not portable');
  is(standingOf(cited, at(DOC, true)).portable, true, 'a tracked document is portable');

  is(citationOf(field({ doc: 'spec.md', quote: '  ' }))?.quote, null, 'a blank quote is no quote');
  is(citationOf(field({ quote: 'x' })), null, 'a quote with no document is no citation');

  // What a proposal may lean on is exactly what was checked against a document.
  const doc = { domain: cited, audiences: field('spec.md'), constraints: field(null) };
  const ctx = readContext(doc, { docs: at(DOC) });
  is(citable(ctx).length, 1, 'only quoted fields are citable');
  is(citable(ctx)[0].field, 'domain', 'the citable field is the quoted one');
  is(ctx.standing.quoted.join(), 'domain', 'quoted names the field it checked');
  is(ctx.standing.unquoted.join(), 'audiences', 'unquoted names the field that only gave a name');
  is(ctx.standing.unsourced.join(), 'constraints', 'unsourced names the field with no source');
  is(ctx.undeclared.join(), 'journeys', 'undeclared names the field nobody wrote');
  is(ctx.portable.join(), '', 'a tracked document raises no portability problem');
  is(readContext(doc, { docs: at(DOC, false) }).portable.join(), 'domain', 'an untracked document does');

  // Every field lands in exactly one standing, and every standing is a word the card can print.
  const all = Object.values(ctx.standing).flat().concat(ctx.standing.undeclared.length ? [] : []);
  is(all.length, Object.keys(FIELDS).length, 'every field is classified exactly once');
  is(STANDINGS.filter(s => !(s in ctx.standing)).join(), '', 'every standing has a bucket');

  return { ok: problems.length === 0, checks, problems };
}

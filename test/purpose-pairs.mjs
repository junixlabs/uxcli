// Telling the instrument apart from the product, held by the same kind of pair as every rule here.
//
// The must-fail half matters more than usual: this rule DEMOTES things. A version of it that reads
// too widely hides a real failure inside a project, which is worse than the noise it was written to
// remove — so it is shown refusing every shape that merely resembles a fixture.
import { purposeOf } from '../src/core/purpose.js';

export const OPERATOR =
  'a probe pair page and a fixture pair page, which gate plants and which must not sit at the top of '
  + 'a work queue; against a project page whose path merely contains the word, a directory called '
  + 'test or fixtures, and a page whose name a person chose — each of which must stay a product run';

export function pair() {
  const problems = []; let checks = 0;
  const is = (what, target, want) => { checks++;
    const got = purposeOf(typeof target === 'string' ? { where: target } : target);
    if (got !== want) problems.push(`${what}: got ${got}, wanted ${want}`); };

  // ── must-fail: the planted pages, which gate runs on purpose ────────────
  is('a probe must-fail page', 'file:///r/src/probes/contrast/must-fail/index.html', 'instrument');
  is('a probe must-pass page', 'file:///r/src/probes/contrast/must-pass/index.html', 'instrument');
  is('a fixture pair page', 'file:///r/test/fixtures/stability/must-fail/index.html', 'instrument');
  is('a packet route naming a pair run', 'http://127.0.0.1:4717/#/%2Fr%2F.uxcli%2Ffx-stability-must-pass', 'instrument');
  is('a pair page reached over http', 'http://localhost:9/probes/focus-visible/must-fail/', 'instrument');

  // ── must-pass: everything that only resembles one ───────────────────────
  // The rule demotes, so every one of these is a real failure it must not hide.
  is('a project page under test/', 'file:///app/test/login.html', 'product');
  is('a project page under fixtures/', 'file:///app/fixtures/cart.html', 'product');
  is('a page whose path merely contains the word', 'file:///app/must-have/checkout.html', 'product');
  is('a page about failing, which is not a pair', 'file:///app/pages/fail-states.html', 'product');
  is('a page named mustard', 'file:///app/mustard.html', 'product');
  is('a live login screen', 'http://localhost:3100/login', 'product');
  is('a journey named by a person', { name: 'Toolshop register → checkout (B1 round 2)' }, 'product');
  is('a run with no address at all', {}, 'product');

  // A journey a person named after the pair it drives is the instrument too: the name is the only
  // address a journey has, so refusing to read it would exempt every flow pair from the rule.
  is('a journey named for a pair', { name: 'contrast must-fail' }, 'instrument');

  return { ok: !problems.length, checks, problems };
}

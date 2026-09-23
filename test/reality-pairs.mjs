// What actually happened, held by the same kind of pair as every probe.
//
// This module is the one anchor an agent may not write, so the pair has to show it holding. The
// must-fail half is the narrowing the module exists to catch: a trace that went six places and a
// model that admits to one. The must-pass half is the reason the first half means anything — a rule
// that reports every model as incomplete is as useless as one that reports every model as whole,
// and either could ship undetected if only one half were written.
//
// The observation semantics are checked alongside them, because coverage is only as honest as the
// list of places it counts. A map that split a loop into two places would inflate what is owed; one
// that folded two hash routes into a single place would quietly shrink it. Both are ways of
// redrawing the map, which is the move this module was built to make impossible.
import { observedFlow, coverage } from '../src/core/reality.js';

export const OPERATOR =
  'a trace of six places against a model that claims one, and a claim on a path the browser never '
  + 'reached; against a model that claims every place observed, and a two-step flow claimed in full; '
  + 'with a loop, a trailing slash, a hash route, a run carrying no steps, and how each step was '
  + 'reached';

const step = (i, url, arrivedBy, title) => ({ i, url, arrivedBy, title });

// A shop deep enough that skipping it is worth something: six distinct screens, and a model that
// speaks only about the one everybody demos.
const DEEP = {
  journey: 'browse → buy',
  ranAt: '2026-09-23T10:00:00Z',
  steps: [
    step(0, 'http://shop.test/', 'goto', 'Home'),
    step(1, 'http://shop.test/search?q=lamp', 'click', 'Search'),
    step(2, 'http://shop.test/product/42', 'click', 'Brass lamp'),
    step(3, 'http://shop.test/cart', 'click', 'Cart'),
    step(4, 'http://shop.test/checkout', 'submit', 'Checkout'),
    step(5, 'http://shop.test/confirmation', 'redirect', 'Order placed'),
  ],
};

export function pair() {
  const problems = []; let checks = 0;
  const check = (what, got, want) => { checks++; if (got !== want) problems.push(`${what}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`); };

  const deep = observedFlow(DEEP);

  // ── must-fail: the narrowing is visible ─────────────────────────────────
  // One commitment about checkout, and nothing at all about the five screens a customer has to get
  // through to reach it. If this reported ok the module would be decorative.
  {
    const thin = coverage({ flow: deep, entries: [{ id: 'checkout.contrast', step: '/checkout' }] });
    check('a model naming one of six places', thin.ok, false);
    check('the places it left out', thin.uncovered.map(u => u.path).join(' '),
      '/ /search /product/42 /cart /confirmation');
    check('and the count it is answerable for', thin.observed, 6);
  }

  // Claiming somewhere the browser never went. This is the cheapest way to fake a full map — write
  // entries against invented screens — so a claim that matches no observed place must move nothing.
  {
    const elsewhere = coverage({ flow: deep, entries: [
      { id: 'ghost.a', step: '/pricing' },
      { id: 'ghost.b', at: 'http://shop.test/about' },
    ] });
    check('claims on paths never observed cover nothing', elsewhere.committed, 0);
    check('so every observed place is still owed', elsewhere.uncovered.length, 6);
  }

  // An entry filed under a different journey is someone else's evidence. Counting it here would let
  // a model borrow coverage from a run that never touched these screens.
  {
    const borrowed = coverage({
      flow: deep,
      journey: 'browse → buy',
      entries: [{ id: 'other', journey: 'admin login', step: '/cart' }],
    });
    check('an entry belonging to another journey', borrowed.committed, 0);
  }

  // ── must-pass: a complete model is left alone ───────────────────────────
  // Every place named, in the three spellings the module accepts — a numeric index into the places,
  // a bare path, and a nested scope. A rule that only recognised one spelling would report a model
  // written in another as incomplete, and the honest author would have no way to tell.
  {
    const whole = coverage({ flow: deep, entries: [
      { id: 'a', step: 0 },
      { id: 'b', step: '/search' },
      { id: 'c', at: 'http://shop.test/product/42' },
      { id: 'd', scope: { step: '/cart' } },
      { id: 'e', step: 4 },
      { id: 'f', step: '/confirmation' },
    ] });
    check('a model naming every place observed', whole.ok, true);
    check('leaves nothing uncovered', whole.uncovered.length, 0);
  }

  // The small honest case. Most journeys are two screens and a form, and reporting those as a
  // shortfall would teach everyone to ignore the number.
  {
    const small = observedFlow({ steps: [
      step(0, 'http://shop.test/login', 'goto', 'Sign in'),
      step(1, 'http://shop.test/account', 'submit', 'Account'),
    ] });
    const claimed = coverage({ flow: small, entries: [{ step: '/login' }, { step: '/account' }] });
    check('a two-step flow claimed in full', claimed.ok, true);
  }

  // ── what counts as a place ──────────────────────────────────────────────
  // A loop back to the cart is the same screen twice. Counting it twice would make the customer who
  // corrected a mistake look like more product than the one who did not.
  {
    const loop = observedFlow({ steps: [
      step(0, 'http://shop.test/cart', 'goto', 'Cart'),
      step(1, 'http://shop.test/payment', 'click', 'Payment'),
      step(2, 'http://shop.test/cart', 'back', 'Cart'),
    ] });
    check('a revisited url is still three steps', loop.steps.length, 3);
    check('but two places', loop.places.length, 2);
    check('and the place keeps the step it was first seen at', loop.places[0]?.firstSeen, 0);
  }

  // Nobody means two screens by the trailing slash, and a map that split them would hand out
  // uncovered places that are the same screen under two names.
  {
    const slash = observedFlow({ steps: [
      step(0, 'http://shop.test/cart/', 'goto', 'Cart'),
      step(1, 'http://shop.test/cart', 'click', 'Cart'),
    ] });
    check('a trailing slash does not open a second place', slash.places.length, 1);
    check('and the place is named without it', slash.places.map(p => p.path).join(' '), '/cart');
  }

  // This product's own dashboard is a single-page app: the hash is the only thing that names the
  // screen. Dropping it would collapse every screen of every app built that way into one place, and
  // a model covering one route would read as covering the lot.
  {
    const spa = observedFlow({ steps: [
      step(0, 'http://127.0.0.1:4717/#/runs', 'goto', 'Runs'),
      step(1, 'http://127.0.0.1:4717/#/home', 'click', 'Home'),
    ] });
    check('two hash routes are two places', spa.places.length, 2);
    check('and the routes are named by their hash', spa.places.map(p => p.path).join(' '), '/#/runs /#/home');
  }

  // How a step was reached is part of what was observed: the same url arrived at by redirect is not
  // the same finding as the same url arrived at by a click, and an edge list that dropped it would
  // let a forced redirect pass as a chosen navigation.
  {
    check('the flow records one edge per move', deep.edges.length, 5);
    check('each edge carries how it was reached', deep.edges.map(e => e.by).join(' '),
      'click click click submit redirect');
    check('and the last edge names both ends', `${deep.edges[4]?.from} → ${deep.edges[4]?.to}`,
      '/checkout → /confirmation');
  }

  // A run with no steps is not a run with an empty map. Inventing one would report full coverage of
  // nothing, which is the most flattering wrong answer available here.
  check('a run with no steps array', observedFlow({ url: 'http://shop.test/' }), null);
  check('and nothing at all', observedFlow(null), null);
  check('coverage of no flow is not coverage of nothing', coverage({ flow: null, entries: [] }), null);

  return { ok: !problems.length, checks, problems };
}

// What actually happened, as opposed to what anybody says happened — the one layer an agent may not
// write. Every other anti-gaming rule considered here bottomed out in a field the checked party
// fills in itself, and a control whose input comes from the thing it controls is not a control.
//
// in:  a journey packet (run.steps)      out: { steps, edges, places } and a coverage report
//
// It does not interpret. A run yields events, not meaning: naming a step "where trust is won"
// belongs to whoever will sign it, and must point back here.
const trim = p => p.replace(/\/+$/, '') || '/';
const pathOf = u => { try { const x = new URL(u); return trim(x.pathname + x.hash); } catch { return trim(String(u || '')); } };

// `arrivedBy` is kept: a step reached by redirect is not the same observation as the same URL
// reached by a click, and flattening the two is already an interpretation.
export function observedFlow(run) {
  if (!run || !Array.isArray(run.steps)) return null;
  const steps = run.steps.map((s, i) => ({
    i: Number.isInteger(s.i) ? s.i : i,
    url: s.url || null,
    path: pathOf(s.url),
    arrivedBy: s.arrivedBy || null,
    title: s.title || null,
    flowBreak: !!s.flowBreak,
  }));
  const edges = steps.slice(1).map((s, k) => ({ from: steps[k].path, to: s.path, by: s.arrivedBy }));
  // A loop back to the cart is one place visited twice; coverage is owed per place, not per visit.
  const places = [];
  for (const s of steps) if (!places.some(p => p.path === s.path)) places.push({ path: s.path, url: s.url, title: s.title, firstSeen: s.i });
  return { steps, edges, places, derivedFrom: run.journey || run.url || null, ranAt: run.ranAt || null };
}

// Deliberately blunt: it judges not whether a commitment is good, only whether somewhere the browser
// demonstrably went has nothing committed about it. A hundred commitments about button colour do not
// move this number.
export function coverage({ flow, entries = [], journey = null }) {
  if (!flow) return null;
  const claimed = new Set();
  for (const e of entries) {
    if (journey && e.journey && e.journey !== journey) continue;
    const at = e.step ?? e.at ?? e.scope?.step;
    if (at === undefined || at === null) continue;
    claimed.add(typeof at === 'number' ? (flow.places[at]?.path ?? String(at)) : pathOf(at));
  }
  const places = flow.places.map(p => ({ ...p, committed: claimed.has(p.path) }));
  const uncovered = places.filter(p => !p.committed);
  // Reported as a count, never a percentage: a percentage of a map the other party drew is a number
  // about the map, not about the product.
  return {
    observed: places.length,
    committed: places.length - uncovered.length,
    uncovered: uncovered.map(p => ({ path: p.path, title: p.title })),
    ok: uncovered.length === 0,
  };
}

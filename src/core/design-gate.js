// The design step, held to by the instrument when the project asks for it (policy project.design).
// Measured 2026-10-03: told in text to draw before building, 0 of 20 agents drew; so a project can make
// the walk say, beside its verdicts, which of the screens it walked were built without a design step.
// This is not a verdict on the interface — a screen can be drawn, picked and still fail — and it never
// turns a fail into anything else. It is the work's state, with its own exit (3), so "done" waits on it.
//
//   drawn   every screen the walk passed through has two or more variants and a complete lens review
//   picked  and a person's pick of one of them (pick.json, hashes matching the drawings)
//
// in: screens as mockups discover() reads them ({ id, variants, reviews, pick, revise, problems }),
//     the states the walk passed through, and the policy's requirement.
// out: { require, screens: [{ state, variants, reviewed, picked, missing: [] }], open }
import { screenStatus } from './mockups.js';

export const DESIGN = ['off', 'drawn', 'picked'];
export const EXIT_DESIGN = 3;

export const NEEDS = {
  draw: 'two or three variants drawn into .uxcli/mockups/<state>/ to the lens for what the person does there',
  review: 'a complete lens review of a variant (uxcli review <state>/<variant> --lens=<kind> --write, then uxcli review check)',
  pick: 'a person\'s pick (uxcli studio --serve, or pick.json signed by them)',
};

// The states a walk passed through, in order, fixtures aside.
export const walkedStates = run => [...new Set((run.steps || []).filter(s => s.kind !== 'fixture').flatMap(s => [s.before?.state, s.after?.state]).filter(Boolean))];

export function designGate(screens, states, require = 'off') {
  if (!DESIGN.includes(require) || require === 'off') return null;
  const by = Object.fromEntries((screens || []).map(s => [s.id, s]));
  const rows = states.map(state => {
    const s = by[state] || { variants: [], reviews: {}, pick: null };
    const reviewed = [...new Set(Object.values(s.reviews || {}).flat().filter(r => r.value && !r.problems?.length).map(r => r.lens))];
    const picked = s.variants?.length ? screenStatus(s) === 'picked' : false;
    const missing = [];
    if ((s.variants || []).length < 2) missing.push('draw');
    if (!reviewed.length) missing.push('review');
    if (require === 'picked' && !picked) missing.push('pick');
    return { state, variants: (s.variants || []).length, reviewed, picked, missing };
  });
  return { require, screens: rows, open: rows.filter(r => r.missing.length).length };
}

// The exit a run takes once the design step is counted: a fail or a run that could not go stays what it
// is; a clean run with the design step open exits 3.
export const exitWithDesign = (exit, gate) => exit === 0 && gate?.open ? EXIT_DESIGN : exit;

export function designLines(gate) {
  if (!gate) return [];
  if (!gate.open) return [`  design   policy asks for screens ${gate.require}: all ${gate.screens.length} walked screens are`];
  const L = [`  DESIGN STEP OPEN  policy asks for screens ${gate.require}; ${gate.open} of ${gate.screens.length} walked screen${gate.screens.length === 1 ? '' : 's'} ${gate.open === 1 ? 'is' : 'are'} not (exit 3, not a verdict on the UI)`];
  for (const r of gate.screens.filter(r => r.missing.length)) L.push(`    ${r.state.padEnd(28)} needs ${r.missing.map(m => NEEDS[m]).join('; ')}`);
  const yours = gate.screens.some(r => r.missing.some(m => m !== 'pick'));
  if (yours) L.push('    drawing and reviewing are yours to do now, not a person\'s: uxcli lens show <kind>, draw the variants with the hooks the journey names, uxcli mockups, review each, then run this again');
  if (gate.screens.some(r => r.missing.includes('pick'))) L.push('    a pick is a person\'s: ask them (uxcli studio --serve); do not write one without their say-so');
  L.push('    the work is not done until this closes');
  return L;
}

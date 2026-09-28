// uxcli guide "<situation>": which command and which file, for what the agent is about to do. The
// recipes are the fast path of the shipped skill spelled out per situation; the matching is words in
// common, nothing cleverer, and the whole list prints when nothing matches — a guide that answers
// "I don't know" with silence is worse than one that shows its table of contents.
export const RECIPES = [
  { id: 'start', when: 'a project that has never used uxcli', words: ['start', 'setup', 'new', 'project', 'init', 'install', 'begin', 'first'],
    do: ['uxcli doctor', 'uxcli init --apply --origin=<url the screen is served at>', 'uxcli init   (prints the first undone thing, every time)'], read: 'skills/uxcli/SKILL.md § Setup' },
  { id: 'design', when: 'about to design or change a screen', words: ['design', 'build', 'change', 'screen', 'page', 'form', 'component', 'ui', 'before', 'implement', 'redesign'],
    do: ['uxcli context show <journey-id>', 'build to the hooks and states the card names; an unknown is not yours to fill'], read: 'skills/uxcli/SKILL.md § Fast path, steps 2–4' },
  { id: 'mockups', when: 'a journey names screens nobody has drawn, or a screen has variants and no pick', words: ['mockup', 'mockups', 'draw', 'sketch', 'variant', 'variants', 'pick', 'picked', 'wireframe', 'prototype', 'figma', 'flow'],
    do: ['.uxcli/mockups/<state>/<variant>.html   (two or three per screen, the same data-uxcli hooks the journey names)', 'uxcli mockups   (photographs every variant; the picked ones drawn as the journey\'s flow; open the page it prints)', 'a person picks in .uxcli/mockups/<state>/pick.json; you never pick for them'], read: 'skills/uxcli/references/mockups.md' },
  { id: 'map', when: 'wanting to see a journey as screens: declared, observed, the difference, the verdicts', words: ['map', 'journey map', 'see', 'show', 'visual', 'overview', 'drift', 'before', 'after', 'compare', 'evidence'],
    do: ['uxcli map   (writes .uxcli/map/index.html; open it)', 'MODEL = the picked mockups · RUN = the last run · DIFF = both · IMPACT = what the commitments decided', 'a step marked drift is a state that did not hold or a fail cited there — nothing else'], read: 'README § The sequence' },
  { id: 'done', when: 'about to say UI work is finished', words: ['done', 'finished', 'finish', 'complete', 'ship', 'merge', 'pr', 'review', 'verify', 'check', 'measure', 'test'],
    do: ['uxcli run .uxcli/journeys/<journey-id>.json', 'uxcli run <url> --prove', 'say done only at exit 0, and say what was measured'], read: 'skills/uxcli/references/before-done.md' },
  { id: 'understand', when: 'no understanding on disk, or an insight is a hypothesis', words: ['understand', 'understanding', 'actor', 'user', 'users', 'persona', 'insight', 'research', 'interview', 'evidence', 'unknown', 'unknowns'],
    do: ['.uxcli/understanding/actors/<actor>.json   (unknowns[] may not be empty)', '.uxcli/understanding/insights/I-0001.json   (claim, source, evidence, wouldChangeIf)', 'uxcli init   (parses both and prints every problem)'], read: 'skills/uxcli/references/understand.md' },
  { id: 'journey', when: 'no journey on disk, or a flow changed shape', words: ['journey', 'flow', 'state', 'states', 'signal', 'workflow', 'steps', 'hook', 'hooks', 'data-uxcli', 'selector'],
    do: ['.uxcli/journeys/<name>.json   (states as signals, one happy workflow, trace to an insight)', 'uxcli init   (parses it)', 'uxcli run .uxcli/journeys/<name>.json'], read: 'skills/uxcli/references/journey.md' },
  { id: 'commit', when: 'a verdict is not-committed, or a threshold has no owner', words: ['commit', 'commitment', 'not-committed', 'propose', 'proposal', 'sign', 'owner', 'threshold', 'principle', 'principles', 'token', 'approve'],
    do: ['uxcli propose <run dir>   (one skeleton per uncovered place; the claim is yours to write)', '.uxcli/proposals/P-xxxx.json → .uxcli/commitments/C-xxxx.json with owner and source', 'a person approves; you never set approvedBy on your own say-so'], read: 'skills/uxcli/references/principles.md' },
  { id: 'fail', when: 'a run printed FAIL', words: ['fail', 'failed', 'failing', 'red', 'exit 2', 'fix', 'defect', 'broken'],
    do: ['fix the element at `where`; run again', 'never edit the journey, the commitment or the probe to make it pass', 'uxcli why <rule>   (the probe\'s definition)'], read: 'skills/uxcli/SKILL.md § Verdict router' },
  { id: 'finding', when: 'a run printed a finding', words: ['finding', 'unproven', 'method', 'cap', 'capped'],
    do: ['report it in the probe\'s words as a finding, never as a pass', 'fix the element if it is yours; the cap is on the method, not the defect'], read: 'skills/uxcli/references/before-done.md § Exit 0 is the floor' },
  { id: 'blocked', when: 'a run was blocked (exit 1)', words: ['blocked', 'block', 'exit 1', 'reach', 'policy', 'identity', 'fixture', 'provision', 'provisioner', 'environment'],
    do: ['read the reason on the card: identity, fixture, or reach', 'raise reachMax only by editing .uxcli/policy/policy.json, with a signer', 'this is not a UX fail; report it as blocked'], read: 'skills/uxcli/SKILL.md § Verdict router' },
  { id: 'chromium', when: 'no Chromium, or run cannot open a browser', words: ['chromium', 'chrome', 'browser', 'playwright', 'headless', 'launch', 'executable'],
    do: ['uxcli doctor', 'npx playwright-core install chromium-headless-shell', 'or set UXCLI_CHROME=<path to a Chromium binary>'], read: 'README § Install' },
  { id: 'migrate', when: 'an older .uxcli/ layout (history/, one directory per target, understanding at the top level)', words: ['migrate', 'migration', 'old', 'layout', 'history', 'upgrade', 'version', 'schema_version'],
    do: ['uxcli migrate   (prints the plan)', 'uxcli migrate --apply'], read: 'CHANGELOG § storage v0.2' },
  { id: 'ci', when: 'putting uxcli in CI', words: ['ci', 'github', 'actions', 'pipeline', 'workflow', 'job', 'automate'],
    do: ['serve the app in the job, then: uxcli run <url>; uxcli run <journey>; uxcli sheet --src=.', 'exit 2 blocks the job; exit 0 still carries findings the reviewer reads'], read: 'uxcli init   (prints the CI step)' },
  { id: 'dispute', when: 'a verdict looks wrong', words: ['wrong', 'dispute', 'false', 'incorrect', 'disagree', 'bug', 'report', 'issue'],
    do: ['attach the run directory: run.json and artifacts/', 'issues/new/choose → wrong verdict or a miss', 'until then the verdict stands'], read: 'README § When it is wrong, say so' },
  { id: 'demo', when: 'seeing what a fail looks like before touching a real project', words: ['demo', 'example', 'try', 'sample', 'show', 'look', 'see'],
    do: ['uxcli demo <empty dir>', 'uxcli context show handle-inbound-lead --src=<that dir>'], read: 'examples/crm/.uxcli/   (the shape of every file)' },
];

const tokens = s => String(s || '').toLowerCase().replace(/[^a-z0-9 .-]/g, ' ').split(/\s+/).filter(Boolean);

export function guide(text) {
  const t = new Set(tokens(text));
  const scored = RECIPES.map(r => ({ r, score: r.words.filter(w => t.has(w) || (w.includes(' ') && text.toLowerCase().includes(w))).length })).filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score || RECIPES.indexOf(a.r) - RECIPES.indexOf(b.r)).slice(0, 3);
  return { query: text, matched: scored.map(x => x.r), all: scored.length ? null : RECIPES };
}

export function guideCard(g) {
  const L = [`uxcli guide · ${g.query || '(nothing asked)'}`, ''];
  const one = r => { L.push(`  ${r.when}`); for (const d of r.do) L.push(`      ${d}`); L.push(`      read: ${r.read}`, ''); };
  if (g.all) { L.push('  nothing matched those words; the situations this guide knows:', ''); g.all.forEach(one); }
  else g.matched.forEach(one);
  return L.join('\n').trimEnd();
}

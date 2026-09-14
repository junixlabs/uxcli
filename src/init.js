// uxcli init: propose first, write only when told to.
//
// The three skills say the same thing to the agent that reads them — you propose, the human commits —
// and until now init was the one tool in this repo exempt from it: it wrote four files into someone
// else's repository without asking. It no longer does. By default it prints what it would create and
// where the project stands; `--apply` is the consent, and even then it only ever creates. It never
// edits, never overwrites, never appends to a file that exists. Touches nothing that exists.
//
// The card also answers a question no other command answers: where is this project in the sequence.
// That is measured from disk every time — a commitments file, a journey that has run, a recorded run —
// never remembered, because the whole instrument is built on not taking its own word for anything.
import fs from 'node:fs'; import path from 'node:path';
import { findCommitments, FILE as COMMITMENTS } from './sheet.js';
import { INDEX } from './dashboard.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const RULE = path.join('.claude', 'rules', 'uxcli.md');

// Four lines, and they are four because this file is loaded at the start of every session in this
// project — including every session that has nothing to do with the interface. It points; it does not
// explain. The explaining is `uxcli init` (which measures) and the three skills (which load on demand).
const RULE_BODY = `This project measures its UI with uxcli, a CLI that drives real Chrome and reports what the page actually painted.

\`npx @junixlabs/uxcli init\` prints where setup stands and what the next step is.

Two things only a human signs: \`${COMMITMENTS}\`, and \`confirmedBy\` in a journey. Propose them; never write them yourself.

Never say UI work is finished before uxcli exits 0. The \`before-done\` skill is the sequence.
`;

// A project already carrying a CLAUDE.md gets a line to paste rather than an edit it did not ask for.
// It is only needed on Claude Code older than 2.0.64, which does not read .claude/rules/; on anything
// newer the rule file is already loaded and the line is redundant.
export const IMPORT_LINE = `@${RULE}`;

const skillNames = () => fs.readdirSync(path.join(ROOT, 'skills')).filter(d => fs.existsSync(path.join(ROOT, 'skills', d, 'SKILL.md')));
const same = (a, b) => { try { return fs.readFileSync(a, 'utf8') === fs.readFileSync(b, 'utf8'); } catch { return false; } };

// create / kept / stale. `stale` is the one Playwright's CLI taught us to report: a skill copied by an
// older uxcli sits in the project unchanged forever, and init used to say `kept` and fall silent.
function items(project) {
  const out = [];
  for (const name of skillNames()) {
    const rel = path.join('.claude', 'skills', name, 'SKILL.md'); const src = path.join(ROOT, 'skills', name, 'SKILL.md'); const dst = path.join(project, rel);
    out.push({ rel, src, status: !fs.existsSync(dst) ? 'create' : same(src, dst) ? 'kept' : 'stale' });
  }
  const rule = path.join(project, RULE);
  const ruleNow = fs.existsSync(rule) ? fs.readFileSync(rule, 'utf8') : null;
  out.push({ rel: RULE, body: RULE_BODY, status: ruleNow == null ? 'create' : ruleNow === RULE_BODY ? 'kept' : 'stale', note: 'loaded at the start of every session' });
  const outDir = path.join(project, '.uxcli');
  out.push({ rel: '.uxcli/', dir: true, status: fs.existsSync(outDir) ? 'kept' : 'create' });
  return out;
}

// A confirmed journey is counted by measuring, not by looking for it. There is no convention for
// where a project keeps its journeys — the `journey` skill says "where the project keeps its
// journeys" and deliberately does not name a directory; this repo's own live under test/journeys/.
// So guessing at directory names would report a number about someone else's layout as if it were a
// fact. What is a fact: `run` refuses a journey whose provenance is proposal until a human sets
// confirmedBy, so every journey in the run index was confirmed by construction. The blind spot is
// stated rather than papered over — a journey confirmed but never run does not appear here.
//
// Proposals are different: `discover` writes them to uxcli-proposals/ unless told otherwise, so that
// directory is uxcli's own output, not an assumption about the project.
const PROPOSALS = 'uxcli-proposals';
function proposals(project) {
  const dir = path.join(project, PROPOSALS); if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => f.endsWith('.json')).filter(f => {
    try { const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); return Array.isArray(j.steps) && j.provenance === 'proposal' && !j.confirmedBy; } catch { return false; }
  }).length;
}

function recorded(project) {
  try {
    const here = (JSON.parse(fs.readFileSync(INDEX, 'utf8')).runs || []).filter(r => r.project === project);
    return { runs: here.length, journeysRan: new Set(here.filter(r => r.kind === 'journey').map(r => r.name)).size };
  } catch { return { runs: 0, journeysRan: 0 }; }
}

export function state(project) {
  const { runs, journeysRan } = recorded(project);
  return { commitments: findCommitments(project), journeys: { measured: journeysRan, proposals: proposals(project) }, runs };
}

// One next step, not a list, and it stops at the first thing undone. The order is what actually gates
// what, not the order a setup guide would tell it in: a page run needs nothing signed, `sheet` needs
// the commitments, and flow probes need a confirmed journey. A product with no flows to commit to is
// therefore finished without one, and is told so, instead of being sent back to `discover` forever.
export function next(s) {
  if (!s.runs) return ['uxcli run <url of the screen under test>', 'the first measurement; it needs nothing signed'];
  if (!s.commitments) return ['the `principles` skill drafts the proposal', `a human signs ${COMMITMENTS}; until then sheet has nothing to read`];
  if (s.journeys.proposals && !s.journeys.measured) return [`a human sets confirmedBy in ${PROPOSALS}/`, 'run refuses a journey whose provenance is proposal'];
  if (!s.journeys.measured) return [null, 'screens are covered. `uxcli discover .` if the product has flows to commit to'];
  return [null, 'setup is done; the `before-done` skill governs from here'];
}

export function init(project, { apply = false } = {}) {
  const list = items(project);
  if (apply) for (const it of list.filter(i => i.status === 'create')) {
    const dst = path.join(project, it.rel);
    if (it.dir) { fs.mkdirSync(dst, { recursive: true }); continue; }
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.writeFileSync(dst, it.body != null ? it.body : fs.readFileSync(it.src));
  }
  const s = state(project);
  // The source path and the rule text are how this module does its job, not part of what it reports.
  return { project, apply, items: list.map(({ rel, status, note }) => note ? { rel, status, note } : { rel, status }), state: s, next: next(s) };
}

export const CI_STEP = `      - name: uxcli
        run: |
          npx @junixlabs/uxcli run <url of the screen under test>
          npx @junixlabs/uxcli run <journeys/name.json>        # each confirmed journey
          npx @junixlabs/uxcli sheet --src=.                    # when uxcli.commitments.json exists
          # exit 2 blocks the job; 0 carries findings the reviewer still reads`;

export function initCard(r) {
  const made = r.items.filter(i => i.status === 'create');
  const L = [`uxcli init · ${r.project}` + (r.apply ? `          ${made.length ? made.length + ' created' : 'nothing to create'} · nothing overwritten` : '          nothing written — this is a plan'), ''];
  for (const it of r.items) {
    const verb = it.status === 'create' ? (r.apply ? 'created     ' : 'would create') : it.status === 'stale' ? 'stale       ' : 'kept        ';
    const note = it.status === 'stale' ? '  differs from the copy shipped with this uxcli; delete it to take the new one' : it.note ? '  ' + it.note : '';
    L.push(`  ${verb}  ${it.rel}${note}`);
  }
  const s = r.state; const j = s.journeys;
  // Two columns that line up, because the arrows are the point: they mark the two gates that are not
  // the agent's to pass, and a mark that does not sit in its own column stops reading as a mark.
  const row = (label, value, arrow) => `    ${label.padEnd(14)}${arrow ? value.padEnd(38) + arrow : value}`;
  L.push('', '  where this project stands');
  L.push(row('commitments', s.commitments ? `signed (${COMMITMENTS})` : `not found (${COMMITMENTS})`, s.commitments ? null : '← only a human signs this'));
  L.push(row('journeys', `${j.measured} measured · ${j.proposals} proposal${j.proposals === 1 ? '' : 's'}`, j.proposals && !j.measured ? '← only a human sets confirmedBy' : null));
  L.push(row('runs', s.runs ? `${s.runs} recorded for this project` : 'none recorded for this project'));
  L.push('', '  next step');
  L.push(r.next[0] ? `    ${r.next[0].padEnd(52)}${r.next[1]}` : `    ${r.next[1]}`);
  if (!r.apply && made.length) L.push('', `  uxcli init --apply          create the ${made.length} item${made.length === 1 ? '' : 's'} above. Nothing is overwritten.`);
  L.push('', '  CI step to add to the job that serves the app:', CI_STEP);
  L.push('', `  On Claude Code older than 2.0.64, which does not read .claude/rules/, paste this one line into the project's CLAUDE.md:`, `      ${IMPORT_LINE}`);
  L.push('', `  Nothing is ever edited or overwritten. ${COMMITMENTS} and journeys are yours to sign; the principles and journey skills draft them as proposals.`);
  return L.join('\n');
}

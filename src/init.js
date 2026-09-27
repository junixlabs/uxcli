// uxcli init: propose first, write only when told to.
//
// The shipped skill says the same thing to the agent that reads it — you propose, the human commits —
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
import { UXCLI, currentRuns } from './adapters/store/runs.js';
import { execSync } from 'node:child_process'; import os from 'node:os';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const RULE = path.join('.claude', 'rules', 'uxcli.md');

// Four lines, and they are four because this file is loaded at the start of every session in this
// project — including every session that has nothing to do with the interface. It points; it does not
// explain. The explaining is `uxcli init` (which measures) and the `uxcli` skill (which loads on demand).
const RULE_BODY = `This project measures its UI with uxcli, a CLI that drives real Chrome and reports what the page actually painted.

\`npx @junixlabs/uxcli init\` prints where setup stands and what the next step is.

Anyone can sign \`${COMMITMENTS}\` and \`confirmedBy\` in a journey — an agent too, when the person running it says so. What a signature has to carry is not a species but accountability: \`owner\` names who stands behind it and \`source\` names the document it came from, and \`uxcli sheet\` returns \`not-committed\` without both. Say in the entry that an agent signed it and on whose say-so.

Signing is not the same act as erasing a verdict. Do not edit a commitment, a journey or a probe in order to turn a run that is failing into one that passes: that is not deciding what correct means, it is deleting the finding. Change a commitment because the commitment was wrong, and say so in \`source\`.

Before designing or changing a screen, read \`uxcli context show <journey>\`: the actor's unknowns, the insights at the confidence their evidence allows, the states the screen must hold and the hooks each needs. Build to that card; do not invent what it does not carry.

Never say UI work is finished before uxcli exits 0 — and exit 0 is a floor, not a verdict on the interface: four probes found no fail. The \`uxcli\` skill is the sequence, and its \`references/before-done.md\` lists what those probes do not look at.
`;

// A project already carrying a CLAUDE.md gets a line to paste rather than an edit it did not ask for.
// It is only needed on Claude Code older than 2.0.64, which does not read .claude/rules/; on anything
// newer the rule file is already loaded and the line is redundant.
export const IMPORT_LINE = `@${RULE}`;

const skillNames = () => fs.readdirSync(path.join(ROOT, 'skills')).filter(d => fs.existsSync(path.join(ROOT, 'skills', d, 'SKILL.md')));
const same = (a, b) => { try { return fs.readFileSync(a, 'utf8') === fs.readFileSync(b, 'utf8'); } catch { return false; } };
// A skill ships as a directory: SKILL.md and whatever references/ it names. Every file in it is an
// item of its own, so a reference added by a newer uxcli shows as `create` beside a router that is `kept`.
const skillFiles = (dir, rel = '') => fs.readdirSync(path.join(dir, rel), { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? skillFiles(dir, path.join(rel, e.name)) : /\.md$/.test(e.name) ? [path.join(rel, e.name)] : []);

// create / kept / stale. `stale` is the one Playwright's CLI taught us to report: a skill copied by an
// older uxcli sits in the project unchanged forever, and init used to say `kept` and fall silent.
function items(project, origin) {
  const out = [];
  for (const name of skillNames()) for (const f of skillFiles(path.join(ROOT, 'skills', name))) {
    const rel = path.join('.claude', 'skills', name, f); const src = path.join(ROOT, 'skills', name, f); const dst = path.join(project, rel);
    out.push({ rel, src, status: !fs.existsSync(dst) ? 'create' : same(src, dst) ? 'kept' : 'stale' });
  }
  const rule = path.join(project, RULE);
  const ruleNow = fs.existsSync(rule) ? fs.readFileSync(rule, 'utf8') : null;
  out.push({ rel: RULE, body: RULE_BODY, status: ruleNow == null ? 'create' : ruleNow === RULE_BODY ? 'kept' : 'stale', note: 'loaded at the start of every session' });
  const outDir = path.join(project, UXCLI);
  out.push({ rel: UXCLI + '/', dir: true, status: fs.existsSync(outDir) ? 'kept' : 'create' });
  for (const d of declarations(project, origin)) out.push(d);
  return out;
}

// The two files every run reads first. project.json names the project; policy.json is the floor:
// reach `observe` in one environment, no identity, no fixture, no effect — the level a project starts
// at, and the one that grants nothing. Its signer is whoever runs `--apply`: that is the say-so.
const PROJECT = path.join(UXCLI, 'project.json'), POLICY = path.join(UXCLI, 'policy', 'policy.json');
const who = () => { try { return execSync('git config user.name', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || os.userInfo().username; } catch { return os.userInfo().username; } };
const projectId = project => { try { return JSON.parse(fs.readFileSync(path.join(project, 'package.json'), 'utf8')).name.replace(/^@[^/]+\//, ''); } catch { return path.basename(project); } };
export const floorPolicy = (origin, signer, at = new Date().toISOString()) => ({
  note: `written by uxcli init --apply on ${at}, on ${signer.ref}'s say-so; the floor — raise reachMax only by editing this file`,
  defaultEnvironment: 'local',
  project: { reachMax: 'observe', constraints: [] },
  environments: { local: { origin, reachMax: 'observe', constraints: [] } },
  workflows: {},
  effects: { core: ['database_write', 'external_email', 'external_sms', 'payment', 'webhook', 'file_write', 'file_delete', 'account_mutation', 'external_api'] },
  testIdentity: { mode: 'provided' },
  authority: { project: signer, environments: signer, workflows: signer },
});
// A body is only built for an item that would be created; a kept file is never read back or re-signed.
function declarations(project, origin) {
  const hasProject = fs.existsSync(path.join(project, PROJECT)), hasPolicy = fs.existsSync(path.join(project, POLICY));
  const out = [{ rel: PROJECT, status: hasProject ? 'kept' : 'create', note: 'names the project; add rules{} when a journey needs a business number' }];
  if (!hasProject) { const id = projectId(project); out[0].body = JSON.stringify({ id, name: id }, null, 2) + '\n'; }
  // Without --origin the policy is not an item — nothing can be written — so `next` sends the person to it.
  if (origin || hasPolicy) out.push({ rel: POLICY, status: hasPolicy ? 'kept' : 'create', note: 'the floor: reach observe, no identity, no effect; you are its signer',
    ...(!hasPolicy && { body: JSON.stringify(floorPolicy(origin, { type: 'person', ref: who() }), null, 2) + '\n' }) });
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

// Counted from the run directories themselves: a page run has a url, a journey run names its journey.
function recorded(project) {
  try {
    const here = currentRuns(project).map(r => r.run);
    return { runs: here.length, journeysRan: new Set(here.filter(r => r.journey).map(r => typeof r.journey === 'string' ? r.journey : r.journey.ref)).size };
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
export function next(s, list = []) {
  // The last rung used to be reached without looking at the items above it, so a project with no
  // skill and no rule file was told "setup is done; the `before-done` skill governs from here" — by
  // the same card that had just printed `would create .claude/skills/before-done/SKILL.md` four lines
  // up. uxcli's own repo was in exactly that state on 2026-09-20: the discipline it installs in every
  // other project was never installed where it was being built, and the card said it was.
  const missing = list.filter(i => i.status === 'create').length;
  if (!list.some(i => i.rel === POLICY && i.status === 'kept')) return ['uxcli init --apply --origin=<url the screen under test is served at>', 'writes project.json and the floor policy (reach observe, no identity) with you as signer; every run reads it first'];
  if (!s.runs) return ['uxcli run <url of the screen under test>', 'the first measurement; it needs nothing signed'];
  if (!s.commitments) return ['the `uxcli` skill (references/principles.md) drafts the proposal', `a human signs ${COMMITMENTS}; until then sheet has nothing to read`];
  if (s.journeys.proposals && !s.journeys.measured) return [`a human sets confirmedBy in ${PROPOSALS}/`, 'run refuses a journey whose provenance is proposal'];
  if (!s.journeys.measured) return [null, 'screens are covered. `uxcli discover .` if the product has flows to commit to'];
  if (missing) return ['uxcli init --apply', missing === 1
    ? 'nothing here loads the skills yet: 1 item above is not in the project'
    : `nothing here loads the skills yet: ${missing} items above are not in the project`];
  return [null, 'setup is done; the `uxcli` skill governs from here'];
}

export function init(project, { apply = false, origin = null } = {}) {
  const list = items(project, origin);
  if (apply) for (const it of list.filter(i => i.status === 'create')) {
    const dst = path.join(project, it.rel);
    if (it.dir) { fs.mkdirSync(dst, { recursive: true }); continue; }
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.writeFileSync(dst, it.body != null ? it.body : fs.readFileSync(it.src));
  }
  const s = state(project);
  // The source path and the rule text are how this module does its job, not part of what it reports.
  // Two readings, because they answer two questions. `list` is from before the writes and is what the
  // card reports — it is how `created` can be printed at all. `after` is the state the project is
  // actually in now, and is what the next step is computed from; reporting the post-write list instead
  // made `--apply` announce `nothing to create` in the same breath as creating four files.
  const after = apply ? items(project, origin) : list;
  return { project, apply, items: list.map(({ rel, status, note }) => note ? { rel, status, note } : { rel, status }), state: s, next: next(s, after) };
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
  L.push(r.next[0] ? `    ${r.next[0]}\n      ${r.next[1]}` : `    ${r.next[1]}`);
  if (!r.apply && made.length) L.push('', `  uxcli init --apply          create the ${made.length} item${made.length === 1 ? '' : 's'} above. Nothing is overwritten.`);
  L.push('', '  CI step to add to the job that serves the app:', CI_STEP);
  L.push('', `  On Claude Code older than 2.0.64, which does not read .claude/rules/, paste this one line into the project's CLAUDE.md:`, `      ${IMPORT_LINE}`);
  L.push('', `  Nothing is ever edited or overwritten. ${COMMITMENTS} and journeys are yours to sign; the uxcli skill drafts them as proposals.`);
  return L.join('\n');
}

// After the floor policy exists: the first thing still undone, in the order the model gates it.
// An understanding before a journey (a journey traces to an insight), a journey before a run, a run
// before a commitment can be measured. Stops at the first.
export function firstStep(P, idx = {}) {
  if (!P.actors.length) return ['.uxcli/understanding/actors/<actor>.json', 'who uses this screen and what they expect; unknowns[] is the most important field'];
  if (!P.insights.length) return ['.uxcli/understanding/insights/I-0001.json', 'one claim with a source and a wouldChangeIf; a journey traces to it'];
  if (!P.journeys.length) return ['.uxcli/journeys/<name>.json', 'one journey: states as signals an observer can check, one happy workflow'];
  if (!(idx.rows || []).length) return [`uxcli run .uxcli/journeys/${P.journeys[0].value?.id || '<name>'}.json`, 'the first run; at reach observe nothing is provisioned or mutated'];
  if (!P.commitments.length) return ['.uxcli/commitments/C-001.json', 'a commitment with owner and source; until one is signed every would-be fail is a finding'];
  return [null, 'declared and measured; the projection above is the state'];
}

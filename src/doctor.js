// uxcli doctor: is the instrument here, and is this a project it can read. One row per thing a run
// needs, measured now, each with the one command that fixes it. Nothing is written.
//
// Chromium is looked for the way `launch()` will look for it: UXCLI_CHROME, then CHROME_EXE, then
// the binary playwright-core installed. A path that does not exist on disk is reported as missing
// even if the variable is set, because that is what the browser will say a minute later.
import fs from 'node:fs'; import path from 'node:path';
import { findRoot, loadProject, projectionOf } from './journey.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const INSTALL = 'npx playwright-core install chromium-headless-shell   (or set UXCLI_CHROME to a Chromium binary)';

// playwright-core's headless launch prefers chromium-headless-shell, whose path executablePath()
// does not report, so the last resort is the thing itself: launch once and close.
async function chromiumPath() {
  for (const k of ['UXCLI_CHROME', 'CHROME_EXE']) if (process.env[k]) return { from: k, path: process.env[k], exists: fs.existsSync(process.env[k]) };
  try {
    const { chromium } = await import('playwright-core'); const p = chromium.executablePath();
    if (p && fs.existsSync(p)) return { from: 'playwright-core', path: p, exists: true };
    const b = await chromium.launch({ headless: true }); const v = b.version(); await b.close();
    return { from: 'playwright-core', path: `chromium-headless-shell ${v}`, exists: true };
  } catch (e) { return { from: 'playwright-core', path: null, exists: false, error: e.message }; }
}

const skillState = project => {
  const src = path.join(ROOT, 'skills', 'uxcli', 'SKILL.md'), dst = path.join(project, '.claude', 'skills', 'uxcli', 'SKILL.md');
  if (!fs.existsSync(dst)) return 'missing';
  return fs.readFileSync(src, 'utf8') === fs.readFileSync(dst, 'utf8') ? 'installed' : 'stale';
};

export async function doctor(from = '.') {
  const rows = []; const here = path.resolve(from);
  const major = Number(process.versions.node.split('.')[0]);
  rows.push({ check: 'node', ok: major >= 20, note: `v${process.versions.node}`, fix: major >= 20 ? null : 'uxcli needs Node 20 or newer' });
  const ch = await chromiumPath();
  rows.push({ check: 'chromium', ok: ch.exists, note: ch.exists ? `${ch.path} (${ch.from})` : ch.path ? `${ch.from} names ${ch.path}, which is not on disk` : 'none installed for playwright-core' + (ch.error ? `: ${ch.error.split('\n')[0].slice(0, 80)}` : ''), fix: ch.exists ? null : INSTALL });
  const root = findRoot(here);
  if (!root) {
    rows.push({ check: 'project', ok: null, note: `no .uxcli/policy/policy.json at or above ${here}; run <url> works, run <journey> and context show need one`, fix: 'uxcli init --apply --origin=<url the screen under test is served at>' });
    return { dir: here, root: null, rows, ok: rows.every(r => r.ok !== false) };
  }
  rows.push({ check: 'project', ok: true, note: root, fix: null });
  let P; try { P = loadProject(root); } catch (e) { rows.push({ check: 'declarations', ok: false, note: e.message, fix: 'fix the file it names; uxcli init prints every problem' }); return { dir: here, root, rows, ok: false }; }
  rows.push({ check: 'policy', ok: P.policy.ok, note: P.policy.ok ? `${Object.keys(P.policy.value.environments || {}).length} environment(s), default ${P.policy.value.defaultEnvironment || Object.keys(P.policy.value.environments || {})[0] || 'none'}` : P.problems.filter(p => p.startsWith('policy/')).join('; '), fix: P.policy.ok ? null : 'edit .uxcli/policy/policy.json until uxcli init prints no problem for it' });
  const other = P.problems.filter(p => !p.startsWith('policy/'));
  rows.push({ check: 'declarations', ok: !other.length, note: other.length ? `${other.length} problem(s): ${other[0]}${other.length > 1 ? ' …' : ''}` : `${P.actors.length} actor(s), ${P.insights.length} insight(s), ${P.journeys.length} journey(s), ${P.commitments.length} commitment(s)`, fix: other.length ? 'uxcli init prints every problem with the file it is in' : null });
  let level = null; try { level = projectionOf(P).level; } catch {}
  rows.push({ check: 'level', ok: true, note: level ? `trust ${level.trust} · reach ${level.reach}` : 'not computed', fix: null });
  const sk = skillState(root);
  rows.push({ check: 'skill', ok: sk === 'installed' ? true : null, note: sk === 'installed' ? '.claude/skills/uxcli/ matches this uxcli' : sk === 'stale' ? '.claude/skills/uxcli/ differs from the copy this uxcli ships' : 'no .claude/skills/uxcli/ in the project', fix: sk === 'installed' ? null : sk === 'stale' ? 'delete .claude/skills/uxcli/ and run uxcli init --apply' : 'uxcli init --apply' });
  return { dir: here, root, rows, ok: rows.every(r => r.ok !== false) };
}

export function doctorCard(r) {
  const L = [`uxcli doctor · ${r.dir}`, ''];
  for (const row of r.rows) {
    L.push(`  ${(row.ok === true ? 'ok' : row.ok === false ? 'MISSING' : '--').padEnd(8)} ${row.check.padEnd(13)} ${row.note}`);
    if (row.fix) L.push(`  ${''.padEnd(8)} ${''.padEnd(13)} fix: ${row.fix}`);
  }
  L.push('', r.ok ? '  ready. uxcli context show <journey> before you design; uxcli run after.' : '  not ready: fix the MISSING rows first. context show and init work without Chromium; run does not.');
  return L.join('\n');
}

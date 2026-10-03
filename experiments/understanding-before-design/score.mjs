// Scoring: the instrument, not a reading. The fixture's declarations are put back into the session
// directory (the arms that did not carry them), the server is started on a free port, and the journey
// is run at two viewports. What is recorded per viewport: the run's exit, C-001's verdict, which
// steps' `after` states held (fixture steps have none), and whether the hooks the journey names
// exist on the page. A blocked run keeps its note, so the reason is in the record.
import fs from 'node:fs'; import path from 'node:path';

export async function score(dir, { fixture, root, keep = null, outcomes = false }) {
  if (!fs.existsSync(path.join(dir, '.uxcli'))) fs.cpSync(path.join(fixture, '.uxcli'), path.join(dir, '.uxcli'), { recursive: true, filter: src => !/[\\/]\.uxcli[\\/](runs|index\.json)/.test(src) });
  const { serve } = await import(path.join(root, 'src', 'demo.js'));
  const { runJourney } = await import(path.join(root, 'src', 'journey.js'));
  const { experience } = await import(path.join(root, 'src', 'core', 'experience.js'));
  const page = fs.existsSync(path.join(dir, 'pages', 'lead.html')) ? fs.readFileSync(path.join(dir, 'pages', 'lead.html'), 'utf8') : '';
  const hooks = Object.fromEntries(['lead-phone', 'call-action', 'call-status', 'back-to-list'].map(h => [h, new RegExp(`data-uxcli=["']?${h}`).test(page)]));
  const out = { hooks, page: !!page };
  const { child, port } = await serve(dir);
  try {
    for (const viewport of ['390x844', '1440x900']) {
      // ticket 2: what the walk recorded on the server, read from the fixture's provisioning door
      const recorded = async () => outcomes ? (await (await fetch(`http://localhost:${port}/api/provision/outcomes`)).json()).outcomes : [];
      const before = (await recorded()).length;
      const r = await runJourney(path.join(dir, '.uxcli', 'journeys', 'handle-inbound-lead.json'), { origin: `http://localhost:${port}`, viewport });
      if (r.problems) { out[viewport] = { problems: r.problems, summary: 'declarations did not parse' }; continue; }
      const run = r.run;
      const c001 = (run.verdicts || []).filter(v => v.commitment === 'C-001').map(v => v.value);
      const steps = (run.steps || []).map(s => ({ id: s.id, afterHeld: s.after?.held ?? null, before: s.before?.held ?? null }));
      const measured = steps.filter(s => typeof s.afterHeld === 'boolean'); const held = measured.filter(s => s.afterHeld).length;
      // what the person goes through on that walk: the happy workflow's estimate and scrolls, and every finding by metric
      const ex = experience(run); const happy = ex.workflows[0]?.totals || null;
      const byMetric = ex.findings.reduce((m, f) => ({ ...m, [f.metric]: (m[f.metric] || 0) + 1 }), {});
      const xp = { klmSeconds: happy?.klmSeconds ?? null, scrolls: happy?.scrolls ?? null, steps: happy?.steps ?? null, findings: ex.findings.length, byMetric };
      // the pictures of the walk, kept beside the session's record for a blind pairwise study
      if (keep) { const dst = path.join(keep, 'shots', viewport); fs.mkdirSync(dst, { recursive: true }); const src = path.join(r.dir, 'artifacts'); if (fs.existsSync(src)) for (const f of fs.readdirSync(src).filter(f => f.endsWith('.png'))) fs.copyFileSync(path.join(src, f), path.join(dst, f)); }
      const got = (await recorded()).slice(before);
      out[viewport] = { ...(outcomes && { outcomes: got, reachedQualified: got.some(o => o.outcome === 'reached' && o.status === 'qualified'), workflowSteps: (run.steps || []).filter(s => s.kind !== 'fixture' && (!s.workflow || s.workflow === run.steps.find(x => x.kind !== 'fixture')?.workflow)).length }), exit: run.exit, status: run.status, note: run.note || run.blocked?.reason || null, c001, steps, experience: xp, ...(run.design && { design: { open: run.design.open, screens: run.design.screens.map(x => ({ state: x.state, missing: x.missing })) } }), summary: `exit ${run.exit} · C-001 ${c001.join('/') || '—'} · ${held}/${measured.length} after-states held${run.design ? ` · design open ${run.design.open}` : ''}${outcomes ? ` · outcome recorded ${got.some(o => o.outcome === 'reached' && o.status === 'qualified') ? 'yes' : 'NO'} · ${happy?.klmSeconds ?? '—'}s KLM` : ''}${run.status === 'blocked' ? ` · blocked: ${run.note || run.blocked?.reason || ''}` : ''}`, packet: path.relative(dir, path.join(r.dir, 'run.json')) };
    }
  } finally { child.kill(); }
  return out;
}

// The studio model: one board for the whole project, the way a design file lays it out — each journey a
// band, each workflow a lane, each step a column, and in each column the screen as it was drawn (the
// variants and the pick), as it was built (the last walk's screenshot with its findings pinned), and as
// each named version left it. Pure: everything is handed in already read; paths are relative to the
// page. Nothing here judges a screen; it places what the files and the runs already say.
//
// in:  { map: mapModel(), screens: [{ id, variants: [{ name, shot, about, reviews }], pick, revise, status }],
//        experiences: { [journey]: report }, versions: { [journey]: [{ name, at, note, by, report, shots: { [wf/step]: path } }] },
//        actors, insights, lenses, templates, viewport, serve }
// out: { project, version, generatedAt, viewport, frame: { w, h }, journeys: [...], context, library, counts }

const vp = s => { const m = /^(\d+)x(\d+)$/.exec(String(s || '')); return m ? { w: +m[1], h: +m[2] } : { w: 390, h: 844 }; };

export function studioModel({ map, screens = [], experiences = {}, versions = {}, actors = [], insights = [], lenses = [], templates = [], viewport = null, serve = false }) {
  const v = vp(viewport || map?.journeys?.find(j => j.run?.viewport)?.run?.viewport);
  const screenBy = Object.fromEntries(screens.map(s => [s.id, s]));
  const journeys = (map?.journeys || []).map(j => {
    const exp = experiences[j.id] || null;
    const vs = versions[j.id] || [];
    const workflows = j.workflows.map(w => ({
      id: w.id, kind: w.kind, status: w.status,
      totals: exp?.workflows?.find(x => x.id === w.id)?.totals || null,
      steps: w.steps.map(s => {
        const sc = screenBy[s.after.state] || null;
        const metrics = exp?.steps?.find(x => x.id === s.id && (x.workflow === w.id || x.workflow == null)) || null;
        const findings = (exp?.findings || []).filter(f => f.step === s.id && (f.workflow === w.id || f.workflow == null)).map(f => ({ metric: f.metric, what: f.what, source: f.source, rect: f.rect || null }));
        const verdicts = (s.verdicts || []).filter(x => x.value !== 'pass').map(x => ({ value: x.value, what: x.what || '', commitment: x.commitment || null, statement: x.statement || null }));
        return {
          n: s.n, id: s.id, action: s.action, url: s.url,
          before: { state: s.before.state, held: s.before.held }, after: { state: s.after.state, held: s.after.held },
          design: sc ? { state: sc.id, status: sc.status, pick: sc.pick, revise: sc.revise, question: sc.question || null, variants: sc.variants } : { state: s.after.state, status: 'undrawn', pick: null, revise: null, question: null, variants: [] },
          built: { shot: s.before.shot || s.after.shot || null, after: s.after.shot || null, measured: s.measured, drift: s.drift, metrics: metrics && { klmSeconds: metrics.klmSeconds, settleMs: metrics.settleMs, response: metrics.response, clicks: metrics.clicks, chars: metrics.chars, scrolls: metrics.scrolls }, findings, verdicts },
          versions: vs.map(x => { const m = x.report?.steps?.find(y => y.id === s.id && (y.workflow === w.id || y.workflow == null)); return { name: x.name, shot: x.shots?.[`${w.id}/${s.id}`] || x.shots?.[`/${s.id}`] || null, klmSeconds: m?.klmSeconds ?? null, findings: (x.report?.findings || []).filter(f => f.step === s.id && (f.workflow === w.id || f.workflow == null)).length, present: !!m }; }),
        };
      }),
    }));
    return { id: j.id, goal: j.goal, actor: j.actor, run: j.run, versions: vs.map(x => ({ name: x.name, at: x.at, note: x.note, by: x.by, klmSeconds: x.report?.totals?.klmSeconds ?? null, findings: x.report?.findings?.length ?? 0 })), workflows };
  });
  const steps = journeys.flatMap(j => j.workflows.flatMap(w => w.steps));
  return {
    project: map?.project || { name: 'project' }, version: map?.version || '', generatedAt: map?.generatedAt || null, serve,
    viewport: `${v.w}x${v.h}`, frame: { w: 220, h: Math.round(220 * v.h / v.w) },
    journeys,
    context: {
      actors: actors.map(a => ({ actor: a.actor, roles: a.roles || [], jobs: a.jobs || [], pains: a.pains || [], expectations: a.expectations || [], unknowns: a.unknowns || [], note: a.note || null })),
      insights: insights.map(i => ({ id: i.id, about: i.about || null, claim: i.claim, confidence: i.confidence || null, evidence: i.evidence || [], source: i.source ? `${i.source.type || ''} ${i.source.ref || ''}`.trim() : null })),
    },
    library: { lenses: lenses.map(l => ({ id: l.id, name: l.name, when: l.when, count: l.viewpoints?.length || 0 })), templates: templates.map(t => ({ id: t.id, name: t.name, when: t.when, screens: t.screens.map(s => ({ name: s.name, lens: s.lens })) })) },
    counts: {
      journeys: journeys.length, steps: steps.length,
      drawn: steps.filter(s => s.design.variants.length).length, picked: steps.filter(s => s.design.pick).length,
      built: steps.filter(s => s.built.shot).length, findings: steps.reduce((n, s) => n + s.built.findings.length, 0),
      versions: journeys.reduce((n, j) => n + j.versions.length, 0),
    },
  };
}

export function studioCard(m, page) {
  const c = m.counts;
  const L = [`uxcli studio · ${m.project.name}`, '',
    `  ${c.journeys} journeys · ${c.steps} steps · ${c.drawn} drawn · ${c.picked} picked · ${c.built} built · ${c.findings} findings on the walk · ${c.versions} versions`];
  for (const j of m.journeys) {
    L.push(`  ${j.id}${j.run ? ` · last walk ${j.run.verdict}` : ' · never walked'}${j.versions.length ? ` · versions ${j.versions.map(v => v.name).join(', ')}` : ''}`);
    for (const w of j.workflows) for (const s of w.steps) {
      const d = s.design; const open = d.variants.length && !d.pick ? (d.revise && !d.revise.answered ? 'revision asked' : 'waiting for a pick') : null;
      L.push(`    ${String(s.n).padStart(2)}. ${s.after.state.padEnd(28)} design ${d.variants.length ? `${d.variants.length} drawn${d.pick ? ` · picked ${d.pick.pick}` : ''}` : 'not drawn'}${open ? ` (${open})` : ''} · built ${s.built.shot ? 'yes' : 'no'}${s.built.findings.length ? ` · ${s.built.findings.length} finding${s.built.findings.length === 1 ? '' : 's'}` : ''}`);
    }
  }
  if (page) L.push('', `  page   ${page}`);
  L.push('', '  uxcli studio --serve     the board in a browser, refreshed as files change; a person picks or asks for a redraw there',
    '  uxcli studio --shot=FILE  a picture of the board, for an agent to look at');
  return L.join('\n');
}

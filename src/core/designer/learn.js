// What the designer may learn from its decisions, and nothing more. Only a closed decision whose
// learn.scope is not none speaks; context feedback becomes an insight to propose, never taste; a
// rule-conflict the owner kept becomes this project's exception, never taste. A preference is settled
// at three for and at most one against, and global only when it was settled across two projects.
// learn never writes the profile: a settled preference is a proposal the owner signs. Pure.
const SETTLE_FOR = 3, SETTLE_AGAINST = 1, GLOBAL_PROJECTS = 2;

// rows: [{ project, decision }] — parsed decisions only.
export function learn(rows) {
  const taste = new Map(), insights = [], exceptions = [];
  const key = (axis, a, b) => `${axis}|${a}|${b}`;
  for (const { project, decision: d } of rows) {
    if (!d.resolution || d.resolution.state === 'open') continue;
    for (const f of d.feedback || []) if (f.kind === 'context') insights.push({ project, decision: d.id, said: f.said });
    if (d.resolution.state === 'owner-overrode' && (d.feedback || []).some(f => f.kind === 'rule-conflict')) exceptions.push({ project, decision: d.id, chosen: d.resolution.chosen, why: d.resolution.why });
    if (d.learn.scope === 'none') continue;
    for (const s of d.learn.signals) {
      const k = key(s.axis, s.prefer, s.over);
      const t = taste.get(k) || { axis: s.axis, prefer: s.prefer, over: s.over, for: 0, against: 0, projects: [], evidence: [], scope: 'global' };
      t.for++; t.evidence.push(`${project}:${d.id}`); if (!t.projects.includes(project)) t.projects.push(project);
      if (d.learn.scope === 'project') t.scope = 'project';
      taste.set(k, t);
    }
  }
  // a preference the other way round counts against
  for (const t of taste.values()) { const o = taste.get(key(t.axis, t.over, t.prefer)); t.against = o ? o.for : 0; }
  const list = [...taste.values()].map(t => {
    const settled = t.for >= SETTLE_FOR && t.against <= SETTLE_AGAINST;
    return { ...t, settled, global: settled && t.scope === 'global' && t.projects.length >= GLOBAL_PROJECTS };
  }).sort((a, b) => b.for - a.for || a.axis.localeCompare(b.axis));
  return { taste: list, insights, exceptions };
}

// A settled preference the profile does not carry yet: what to add, and where. Never applied here.
export function promotions(taste, profile, where) {
  return taste.filter(t => t.settled && t.axis !== 'library' && (where === 'global' ? t.global : true))
    .filter(t => !(profile?.defaults?.[t.axis] || []).includes(t.prefer))
    .map(t => ({ where, axis: t.axis, add: t.prefer, over: t.over, evidence: t.evidence }));
}

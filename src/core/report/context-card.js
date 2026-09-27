// The context card: what the agent reads before it opens the editor. Unknowns come first, because
// the failure this card exists to prevent is an agent turning a gap into a fact. Then who the actor
// is, what the project knows and how far it can be trusted (the ceiling, never the author's word),
// the states the screen must be able to hold with the hooks each needs, the commitments already
// signed over it, and what the last run saw. It gives no advice.
import { join, row, bullet, list } from './text.js';

const NONE = { understanding: 'no understanding on disk — unknowns are everything; write .uxcli/understanding/actors/<actor>.json before designing',
  journey: 'no journey on disk — nothing says what this screen must be able to hold; write .uxcli/journeys/<name>.json' };

export function contextCard(b = {}) {
  const j = b.journey; const a = b.actor;
  const L = [`uxcli context${j ? ` · ${j.id}` : ''}${a ? ` · ${a.actor}` : ''}`, '  read before you design. Nothing here is advice; nothing here was written by uxcli.', ''];

  L.push('  unknown — do not assume; ask, or leave the gap visible in what you build');
  if (!a) L.push(...bullet(NONE.understanding));
  else if (!b.unknowns.length) L.push(...bullet('unknowns[] is empty — treat that as a problem, not as completeness'));
  for (const u of b.unknowns) L.push(...bullet(u));

  L.push('', '  actor');
  if (!a) L.push(...bullet(NONE.understanding));
  else {
    L.push(...row('who', `${a.actor}${a.roles.length ? ` (${list(a.roles, ', ')})` : ''} — ${a.file}`, { indent: 4 }));
    for (const k of ['contexts', 'jobs', 'behaviors', 'habits', 'expectations', 'pains', 'constraints']) if (a[k].length) L.push(...row(k, list(a[k]), { indent: 4 }));
  }

  L.push('', '  insights — confidence is the ceiling the evidence allows, not what the author wrote');
  if (!b.insights.length) L.push(...bullet(a ? 'none written' : NONE.understanding));
  for (const i of b.insights) {
    const lean = i.leanedOnBy.length ? ` · leaned on by ${list(i.leanedOnBy, ', ')}` : '';
    L.push(...row(i.id, `${i.ceiling}${i.overclaims ? ` (file says ${i.claimed})` : ''}${i.about ? ` · about ${i.about}` : ''}${i.demoted ? ` · demoted ${i.demoted}` : ''}${lean}`, { indent: 4 }));
    L.push(...row('', i.claim, { indent: 4 }));
    if (i.source) L.push(...row('', `source ${i.source}${i.evidence.length ? ` · evidence ${i.evidence.length}` : ''}`, { indent: 4 }));
    else L.push(...row('', 'no source — a hypothesis, whatever the file calls it', { indent: 4 }));
    if (i.wouldChangeIf) L.push(...row('', `would change if ${i.wouldChangeIf}${i.lastCheck ? ` · checked ${i.lastCheck.at}, ${i.lastCheck.fired ? 'FIRED' : 'did not fire'}${i.lastCheck.observed !== undefined ? ` (${i.lastCheck.observed})` : ''}` : ' · never checked'}`, { indent: 4 }));
    else L.push(...row('', 'no wouldChangeIf — nothing could show this wrong, so it stays low', { indent: 4 }));
  }

  L.push('', '  journey — what the screen must be able to hold');
  if (!j) L.push(...bullet(NONE.journey));
  else {
    L.push(...row('goal', j.goal || '—', { indent: 4 }));
    L.push(...row('trace', j.trace.length ? list(j.trace, ', ') : 'none — no insight says why this journey exists', { indent: 4 }));
    for (const s of b.states) {
      L.push(...row(s.name, `${s.strength}${s.mustNotMatch.length ? ` · must not match ${list(s.mustNotMatch, '; ')}` : ''}`, { col: 26, indent: 4 }));
      for (const sig of s.signals) L.push(...bullet(sig, 6));
    }
    for (const r of b.refs) L.push(...row(r.name, `from ${r.ref}`, { col: 26, indent: 4 }));
    L.push('', '  steps — the hooks the agent must not invent');
    for (const s of b.steps) L.push(...row(`${s.workflow}/${s.id}`, `${s.action || '—'}${s.before ? ` · from ${s.before}` : ''}${s.after ? ` → ${s.after}` : ''}${s.hooks.length ? ` · ${list(s.hooks, ' ')}` : ''}`, { col: 26, indent: 4 }));
  }

  L.push('', '  commitments already signed over this screen');
  if (!b.commitments.length) L.push(...bullet(j ? 'none — every would-be fail is a finding until somebody signs one' : NONE.journey));
  for (const c of b.commitments) {
    L.push(...row(c.id, `${c.status}${c.owner ? ` · owner ${c.owner}` : ''} · where ${c.where}${c.viewports.length ? ` · ${list(c.viewports, ' ')}` : ''}`, { indent: 4 }));
    L.push(...row('', c.statement, { indent: 4 }));
    for (const m of c.measurements) L.push(...bullet(`${m.text}${m.target ? ` when ${m.target} held` : ''}${m.method && m.method !== 'method-validated' ? ` · ${m.method}` : ''}`, 6));
    if (c.standing?.traceDemoted) L.push(...bullet(`leans on demoted ${list(c.standing.traceDemoted, ', ')} — awaiting a decision`, 6));
  }

  L.push('', '  last run');
  const r = b.lastRun;
  L.push(r ? `    ${r.target} · ${r.env || '?'} · ${r.latest || '?'} · ${r.status === 'blocked' ? 'blocked — no verdict' : r.fails?.length ? `fail ${list(r.fails, ', ')}` : 'no fail'}` : '    none — the journey has never been run against this product');

  if (b.problems?.length) { L.push('', '  problems'); for (const p of b.problems) L.push(...bullet(p)); }
  return join(L);
}

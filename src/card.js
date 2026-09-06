// The verdict card: what the working agent reads. Low hundreds of tokens; --json carries the evidence.
const V = v => ({ pass: 'PASS', fail: 'FAIL', finding: 'FINDING', unmeasurable: 'UNMEASURABLE', 'not-applicable': 'N/A', 'not-committed': 'NOT-COMMITTED' }[v] || String(v).toUpperCase());
const short = s => { s = String(s); if (s.startsWith('t:')) return s.slice(2); s = s.slice(2); const i = s.lastIndexOf('/'); return (i >= 0 ? s.slice(i + 1) : s).slice(0, 60) || s.slice(0, 60); };
const name = p => p.probe.replace(/^(flow|page)\./, '');
const reason = p => (p.why || '').slice(0, 120);
const failLike = p => p.verdict === 'fail' || p.rawVerdict === 'fail';
const methodLine = p => p.rawVerdict === 'fail' ? `  method ${p.method}: reported as finding, not fail; see \`uxcli why ${p.sc}\` for what validation needs` : null;

export function card(result) {
  return result.url ? pageCard(result) : flowCard(result);
}

function flowCard(result) {
  const L = [`uxcli run · ${result.journey}`, ''];
  for (const s of result.steps) if (s.error) L.push(`  step ${s.i}  could not run: ${s.error}${/Timeout|waiting for locator/i.test(s.error) ? ' (locator not found on the page)' : ''}`);
  if (result.stepCount && result.steps.length < result.stepCount) L.push(`  ${result.stepCount - result.steps.length} of ${result.stepCount} steps did not run`);
  if (result.steps.some(s => s.error)) L.push('');
  for (const p of result.probes) {
    const proof = p.proof?.length ? `  proof  ${p.proof.join('  ')}` + (p.refute ? `\n  reader ${p.refute.tested ? (p.refute.parsed ? (p.refute.agrees ? 'agrees' : 'DISPUTES') + ' — ' + p.refute.reason : 'unparsed: ' + p.refute.raw) : 'not run: ' + p.refute.why}` : '') : null;
    const head = `${p.sc} ${name(p).padEnd(22)} ${V(p.verdict).padEnd(13)}`;
    const rule = `  rule   WCAG ${p.sc} (spec, ${p.method})${p.override ? ` · process joined by sameProcess ${JSON.stringify(p.override.sameProcess)} (project)` : ''}`;
    if (failLike(p) && p.sc === '3.3.7') {
      const fields = [...new Set(p.reasked.map(m => m.field.name || m.field.id))], steps = [...new Set(p.reasked.map(m => m.step))], first = [...new Set(p.reasked.map(m => m.firstEnteredStep))];
      L.push(head, `  what   ${fields.join(', ')} asked again on step ${steps.join(',')}; first entered on step ${first.join(',')}`, `  where  ${p.reasked[0].url}  ${fields.map(f => '#' + f).join(', ')}`, rule, `  check  Reach this screen through the earlier steps. ${fields.length > 1 ? 'Are these fields' : 'Is this field'} empty although you typed the value${fields.length > 1 ? 's' : ''} earlier?`); if (proof) L.push(proof);
    } else if (failLike(p) && p.sc === '3.3.4') {
      const c = p.branches.confirmed, ck = p.branches.checked; const cm = c.changeMechanism;
      L.push(head, `  what   ${c.missing.length} of ${c.missing.length + c.present.length} entered values are not shown on the commit screen; ${cm ? `change control "${typeof cm === 'string' ? cm : cm.text}"` : 'no change control'}; validation ${ck.tested ? 'tested: ' + ck.evidence : 'untested'}`, `  where  ${result.steps.find(s => s.i === c.screen)?.url}`, rule, `  check  On this screen, can you see ${c.missing.slice(0, 3).map(m => JSON.stringify(m.value)).join(', ')} and a way to change them before committing?`); if (proof) L.push(proof);
    } else if (failLike(p) && p.sc === '3.3.1') {
      const pl = p.planted;
      L.push(head, `  what   ${p.form === 'silent' ? 'submission rejected, nothing said' : 'submission rejected, message not tied to the field'}: ${pl.probeKind} on "${pl.probedField}" (step ${pl.entryStep + 1}); ${p.form === 'silent' ? 'no new text, no native validation' : 'new text: ' + pl.newText.slice(0, 2).map(t => JSON.stringify(t.slice(0, 50))).join(', ')}`, `  where  ${pl.urlBefore}  ${pl.probedField}`, rule, `  check  Submit this form with "${pl.probedField}" ${pl.probeValue ? 'set to ' + JSON.stringify(pl.probeValue) : 'empty'}. Does a text message appear that names that field?`); if (proof) L.push(proof);
    } else if (failLike(p) && p.sc === '3.2.3') {
      const x = p.inversion;
      L.push(head, `  what   ${x.mechanism} order differs between steps ${x.stepA} and ${x.stepB}; first inverted pair ${x.firstInvertedPair.map(short).join(' / ')}`, rule, `  check  Compare the ${x.mechanism.replace(/^name:/, '')} menu on both pages; are those two items in swapped order?`); if (proof) L.push(proof);
    } else if (p.verdict === 'pass') {
      const why = p.sc === '3.3.4' ? `via ${p.branch}${p.branches?.confirmed?.changeMechanism ? ` · change control "${typeof p.branches.confirmed.changeMechanism === 'string' ? p.branches.confirmed.changeMechanism : p.branches.confirmed.changeMechanism.text}"` : ''}${p.branches?.checked?.evidence ? ` · ${p.branches.checked.evidence}` : ''}`
        : p.sc === '3.3.7' ? `${p.satisfied.length} matched field${p.satisfied.length > 1 ? 's' : ''}, ${[...new Set(p.satisfied.map(m => m.mechanism))].join('/')}`
        : p.sc === '3.3.1' ? `${p.planted.probeKind} on "${p.planted.probedField}" rejected; ${p.signal}`
        : `${p.comparedPairs} pairs, ${Object.keys(p.mechanisms || {}).length} mechanisms, no inversion`;
      L.push(`${head} ${why}`);
    } else {
      let why = reason(p);
      if (p.sc === '3.3.4' && p.verdict === 'unmeasurable' && p.branches?.confirmed?.missing?.length) why += `; not shown: ${p.branches.confirmed.missing.slice(0, 3).map(m => JSON.stringify(m.value)).join(', ')}`;
      L.push(`${head} ${why}`);
    }
    if (methodLine(p)) L.push(methodLine(p));
  }
  return L.join('\n');
}

function pageCard(result) {
  const L = [`uxcli run · ${result.url}`, ''];
  if (result.error) L.push(`  could not run: ${result.error}`, '');
  for (const p of result.probes) {
    const head = `${p.sc.padEnd(6)} ${name(p).padEnd(16)} ${V(p.verdict).padEnd(13)}`;
    const rule = `  rule   WCAG ${p.sc} (spec, ${p.method}${p.axe ? `, axe-core ${p.axe}` : ''})`;
    if (failLike(p) && p.sc === '2.4.7') {
      const t = p.targets;
      L.push(head, `  what   ${t.length} of ${p.measured} measured controls show no pixel change on focus: ${t.slice(0, 4).map(x => x.sel + (x.text ? ` "${x.text.slice(0, 20)}"` : '')).join(', ')}${t.length > 4 ? ', …' : ''}`, `  where  ${result.finalUrl || result.url}`, rule, `  check  Press Tab until ${t[0].sel}${t[0].text ? ` "${t[0].text.slice(0, 20)}"` : ''} should have focus. Can you see where focus is?`);
      if (p.proof?.length) L.push(`  proof  ${p.proof.slice(0, 4).join('  ')}${p.proof.length > 4 ? '  …' : ''}`);
      if (p.refute) L.push(`  reader ${p.refute.tested ? (p.refute.parsed ? (p.refute.agrees ? 'agrees' : 'DISPUTES') + ' — ' + p.refute.reason : 'unparsed: ' + p.refute.raw) : 'not run: ' + p.refute.why}`);
    } else if (failLike(p) && p.sc === '1.4.12') {
      const t = p.targets;
      L.push(head, `  what   ${t.length} locked value${t.length > 1 ? 's' : ''} below the minimum: ${t.slice(0, 3).map(x => `${x.sel} ${x.property} ${x.value}px < ${x.threshold}px (ACT ${x.rule})`).join('; ')}${t.length > 3 ? '; …' : ''}`, `  where  ${result.finalUrl || result.url}`, rule, `  check  Does the style attribute on ${t[0].lockedOn === 'self' ? t[0].sel : t[0].lockedOn} set ${t[0].property} with !important?`);
    } else if (failLike(p) && p.sc === '1.4.3') {
      const g = p.groups;
      const col = (hex, tok) => tok ? `${hex} (${tok})` : hex;
      L.push(head, `  what   ${g.reduce((n, x) => n + x.count, 0)} text nodes in ${g.length} colour pair${g.length > 1 ? 's' : ''}: ${g.slice(0, 4).map(x => `${col(x.fg, x.fgToken)} on ${col(x.bg, x.bgToken)} ${x.ratio}:1 ×${x.count} (e.g. ${x.example})`).join('; ')}${g.length > 4 ? '; …' : ''}`, `  where  ${result.finalUrl || result.url}`, rule, g[0].fgToken || g[0].bgToken ? `  check  ${[g[0].fgToken, g[0].bgToken].filter(Boolean).join(' and ')} declared in ${result.src}; one change there fixes ${g[0].count} node${g[0].count > 1 ? 's' : ''}.` : `  check  Is ${g[0].fg} on ${g[0].bg} a design token? One change there fixes ${g[0].count} node${g[0].count > 1 ? 's' : ''}. Pass --src=DIR to name it.`);
    } else L.push(`${head} ${reason(p)}${p.prove ? (p.prove.wouldFail ? ` · would fail on ${p.prove.mutation}` : ` · could not be made to fail: ${p.prove.why}`) : ''}`);
    if (p.finding) L.push(`  finding ${p.finding.why}`);
    if (methodLine(p)) L.push(methodLine(p));
  }
  return L.join('\n');
}

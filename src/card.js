// The verdict card: what the working agent reads. Low hundreds of tokens; --json carries the evidence.
const V = v => ({ pass: 'PASS', fail: 'FAIL', unmeasurable: 'UNMEASURABLE', 'not-applicable': 'N/A', 'not-committed': 'NOT-COMMITTED', blocked: 'BLOCKED' }[v] || String(v).toUpperCase());
const short = s => { s = String(s); if (s.startsWith('t:')) return s.slice(2); s = s.slice(2); const i = s.lastIndexOf('/'); return (i >= 0 ? s.slice(i + 1) : s).slice(0, 60) || s.slice(0, 60); };
export function card(result) {
  const L = [`uxcli run · ${result.journey}`, ''];
  for (const p of result.probes) {
    const proof = p.proof?.length ? `  proof  ${p.proof.join('  ')}` : null;
    const head = `${p.sc} ${p.probe.replace('flow.', '').padEnd(22)} ${V(p.verdict).padEnd(13)}`;
    const rule = `  rule   WCAG ${p.sc} (spec)${p.override ? ` · process joined by sameProcess ${JSON.stringify(p.override.sameProcess)} (project)` : ''}`;
    if (p.verdict === 'fail' && p.sc === '3.3.7') {
      const fields = [...new Set(p.reasked.map(m => m.field.name || m.field.id))], steps = [...new Set(p.reasked.map(m => m.step))], first = [...new Set(p.reasked.map(m => m.firstEnteredStep))];
      L.push(head, `  what   ${fields.join(', ')} asked again on step ${steps.join(',')}; first entered on step ${first.join(',')}`, `  where  ${p.reasked[0].url}  ${fields.map(f => '#' + f).join(', ')}`, rule, `  check  Reach this screen through the earlier steps. ${fields.length > 1 ? 'Are these fields' : 'Is this field'} empty although you typed the value${fields.length > 1 ? 's' : ''} earlier?`); if (proof) L.push(proof);
    } else if (p.verdict === 'fail' && p.sc === '3.3.4') {
      const c = p.branches.confirmed, ck = p.branches.checked;
      L.push(head, `  what   ${c.missing.length} of ${c.missing.length + c.present.length} entered values are not shown on the commit screen; no change control; validation ${ck.tested ? 'tested: ' + ck.evidence : 'untested'}`, `  where  ${result.steps.find(s => s.i === c.screen)?.url}`, rule, `  check  On this screen, can you see ${c.missing.slice(0, 3).map(m => JSON.stringify(m.value)).join(', ')} and a way to change them before committing?`); if (proof) L.push(proof);
    } else if (p.verdict === 'fail' && p.sc === '3.2.3') {
      const x = p.inversion;
      L.push(head, `  what   ${x.mechanism} order differs between steps ${x.stepA} and ${x.stepB}; first inverted pair ${x.firstInvertedPair.map(short).join(' / ')}`, rule, `  check  Compare the ${x.mechanism.replace(/^name:/, '')} menu on both pages; are those two items in swapped order?`); if (proof) L.push(proof);
    } else if (p.verdict === 'pass') {
      const why = p.sc === '3.3.4' ? `via ${p.branch}${p.branches?.confirmed?.changeMechanism ? ` · change control "${typeof p.branches.confirmed.changeMechanism === 'string' ? p.branches.confirmed.changeMechanism : p.branches.confirmed.changeMechanism.text}"` : ''}${p.branches?.checked?.evidence ? ` · ${p.branches.checked.evidence}` : ''}`
        : p.sc === '3.3.7' ? `${p.satisfied.length} matched field${p.satisfied.length > 1 ? 's' : ''}, ${[...new Set(p.satisfied.map(m => m.mechanism))].join('/')}`
        : `${p.comparedPairs} pairs, ${Object.keys(p.mechanisms || {}).length} mechanisms, no inversion`;
      L.push(`${head} ${why}`);
    } else L.push(`${head} ${(p.why || '').split(';')[0].slice(0, 100)}`);
  }
  return L.join('\n');
}

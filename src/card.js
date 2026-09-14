// The verdict card: what the working agent reads. Low hundreds of tokens; --json carries the evidence.
import { readerLine } from './refute.js';
const V = v => ({ pass: 'PASS', fail: 'FAIL', finding: 'FINDING', unmeasurable: 'UNMEASURABLE', 'not-applicable': 'N/A', 'not-committed': 'NOT-COMMITTED' }[v] || String(v).toUpperCase());
const name = p => p.probe.replace(/^(flow|page)\./, '');
const reason = p => (p.why || '').slice(0, 120);
const failLike = p => p.verdict === 'fail' || p.rawVerdict === 'fail';
const methodLine = p => p.rawVerdict === 'fail' ? `  method ${p.method}: reported as finding, not fail; see \`uxcli why ${p.sc}\` for what validation needs` : null;

export function card(result) {
  const body = result.url ? pageCard(result) : flowCard(result);
  return result.outDir ? body + `\n  files  ${result.outDir}/run.json${result.screenshots ? ` and ${result.screenshots} screenshot${result.screenshots > 1 ? 's' : ''}` : ''}. A verdict you can show is wrong, or a miss: https://github.com/junixlabs/uxcli/issues/new/choose` : body;
}

function flowCard(result) {
  const L = [`uxcli run · ${result.journey}`, ''];
  for (const s of result.steps) if (s.error) L.push(`  step ${s.i}  could not run: ${s.error}${/Timeout|waiting for locator/i.test(s.error) ? ' (locator not found on the page)' : ''}`);
  if (result.stepCount && result.steps.length < result.stepCount) L.push(`  ${result.stepCount - result.steps.length} of ${result.stepCount} steps did not run`);
  if (result.steps.some(s => s.error)) L.push('');
  for (const p of result.probes) {
    const proof = p.proof?.length ? `  proof  ${p.proof.join('  ')}` + (p.refute ? '\n' + readerLine(p) : '') : null;
    const head = `${p.sc} ${name(p).padEnd(22)} ${V(p.verdict).padEnd(13)}`;
    const rule = `  rule   WCAG ${p.sc} (spec, ${p.method})${p.override ? ` · process joined by sameProcess ${JSON.stringify(p.override.sameProcess)} (project)` : ''}`;
    if (failLike(p) && p.what) {
      L.push(head, `  what   ${p.what}`);
      if (p.where) L.push(`  where  ${p.where}`);
      L.push(rule, `  check  ${p.check}`);
      if (proof) L.push(proof);
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
    const head = `${(p.provenance === 'opinion' ? '·' : p.sc).padEnd(6)} ${name(p).padEnd(16)} ${V(p.verdict).padEnd(13)}`;
    const rule = p.provenance === 'opinion' ? `  rule   ${p.rule} (opinion, ${p.method})` : `  rule   WCAG ${p.sc} (spec, ${p.method}${p.axe ? `, axe-core ${p.axe}` : ''})`;
    if (failLike(p) && p.what) {
      L.push(head, `  what   ${p.what}`);
      if (p.where) L.push(`  where  ${p.where}`);
      L.push(rule, `  check  ${p.check}`);
      if (p.proof?.length) L.push(`  proof  ${p.proof.slice(0, 4).join('  ')}${p.proof.length > 4 ? '  …' : ''}`);
      if (p.refute) L.push(readerLine(p));
    } else L.push(`${head} ${reason(p)}${p.prove ? (p.prove.wouldFail ? ` · would fail on ${p.prove.mutation}` : ` · could not be made to fail: ${p.prove.why}`) : ''}`);
    if (p.finding) L.push(`  finding ${p.finding.why}`);
    if (methodLine(p)) L.push(methodLine(p));
  }
  return L.join('\n');
}

// The verdict card: what the working agent reads. Low hundreds of tokens; --json carries the evidence.
import { readerLine } from './refute.js';
const V = v => ({ pass: 'PASS', fail: 'FAIL', finding: 'FINDING', unmeasurable: 'UNMEASURABLE', 'not-applicable': 'N/A', 'not-committed': 'NOT-COMMITTED' }[v] || String(v).toUpperCase());
const name = p => p.probe.replace(/^(flow|page)\./, '');
const reason = p => (p.why || '').slice(0, 120);
const failLike = p => p.verdict === 'fail' || p.doctrine?.rawVerdict === 'fail';
const methodLine = p => p.doctrine?.rawVerdict === 'fail' ? `  method ${p.method}: reported as finding, not fail; see \`uxcli why ${p.sc}\` for what validation needs` : null;
// The packet names its own parts, so the card reads them by name instead of guessing which of a
// probe's private fields it was supposed to know about. See src/probes/packet.md.
const ev = p => p.evidence || {}, ms = p => p.measured || {}, dr = p => p.doctrine || {};

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
    const proof = ev(p).proof?.length ? `  proof  ${ev(p).proof.join('  ')}` + (ev(p).refute ? '\n' + readerLine(p) : '') : null;
    const head = `${p.sc} ${name(p).padEnd(22)} ${V(p.verdict).padEnd(13)}`;
    const rule = `  rule   WCAG ${p.sc} (spec, ${p.method})${ev(p).override ? ` · process joined by sameProcess ${JSON.stringify(ev(p).override.sameProcess)} (project)` : ''}`;
    if (failLike(p) && p.cite) {
      L.push(head, `  what   ${p.cite.what}`);
      if (p.cite.where) L.push(`  where  ${p.cite.where}`);
      L.push(rule, `  check  ${p.cite.check}`);
      if (proof) L.push(proof);
    } else if (p.verdict === 'pass') {
      const e = ev(p);
      const why = p.sc === '3.3.4' ? `via ${e.branch}${e.branches?.confirmed?.changeMechanism ? ` · change control "${typeof e.branches.confirmed.changeMechanism === 'string' ? e.branches.confirmed.changeMechanism : e.branches.confirmed.changeMechanism.text}"` : ''}${e.branches?.checked?.evidence ? ` · ${e.branches.checked.evidence}` : ''}`
        : p.sc === '3.3.7' ? `${e.satisfied.length} matched field${e.satisfied.length > 1 ? 's' : ''}, ${[...new Set(e.satisfied.map(m => m.mechanism))].join('/')}`
        : p.sc === '3.3.1' ? `${e.planted.probeKind} on "${e.planted.probedField}" rejected; ${e.signal}`
        : `${e.comparedPairs} pairs, ${Object.keys(e.mechanisms || {}).length} mechanisms, no inversion`;
      L.push(`${head} ${why}`);
    } else {
      let why = reason(p);
      if (p.sc === '3.3.4' && p.verdict === 'unmeasurable' && ev(p).branches?.confirmed?.missing?.length) why += `; not shown: ${ev(p).branches.confirmed.missing.slice(0, 3).map(m => JSON.stringify(m.value)).join(', ')}`;
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
    const rule = p.provenance === 'opinion' ? `  rule   ${ev(p).rule} (opinion, ${p.method})` : `  rule   WCAG ${p.sc} (spec, ${p.method}${ms(p).axe ? `, axe-core ${ms(p).axe}` : ''})`;
    if (failLike(p) && p.cite) {
      L.push(head, `  what   ${p.cite.what}`);
      if (p.cite.where) L.push(`  where  ${p.cite.where}`);
      L.push(rule, `  check  ${p.cite.check}`);
      if (ev(p).proof?.length) L.push(`  proof  ${ev(p).proof.slice(0, 4).join('  ')}${ev(p).proof.length > 4 ? '  …' : ''}`);
      if (ev(p).refute) L.push(readerLine(p));
    } else L.push(`${head} ${reason(p)}${dr(p).prove ? (dr(p).prove.wouldFail ? ` · would fail on ${dr(p).prove.mutation}` : ` · could not be made to fail: ${dr(p).prove.why}`) : ''}`);
    if (ev(p).finding) L.push(`  finding ${ev(p).finding.why}`);
    if (methodLine(p)) L.push(methodLine(p));
  }
  return L.join('\n');
}

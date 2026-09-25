// A derived parameter is a domain rule with arithmetic on it: `{ rule, mul?, add? }` → rule × mul + add.
// The rule's value comes from the run's `ruleSnapshots`; when it is not there the answer is a problem,
// never a number — a made-up SLA would test a made-up product.
export function derive(spec, ruleSnapshots = {}) {
  const problems = [];
  if (!spec?.rule) return { value: null, problems: ['derive names no rule'] };
  const snap = ruleSnapshots[spec.rule];
  if (snap === undefined) return { value: null, problems: [`rule ${spec.rule} has no snapshot — nothing to derive from`] };
  const base = typeof snap === 'object' ? snap.value : snap;
  if (typeof base !== 'number' || !Number.isFinite(base)) return { value: null, problems: [`rule ${spec.rule} is not a number: ${JSON.stringify(base)}`] };
  for (const k of Object.keys(spec)) if (!['rule', 'add', 'mul'].includes(k)) problems.push(`derive op ${k} is not add or mul`);
  return { value: base * (spec.mul ?? 1) + (spec.add ?? 0), problems };
}

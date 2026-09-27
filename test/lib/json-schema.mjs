// A validator for the subset of JSON Schema the files under schemas/ use. Kept in the repo rather
// than taken from npm because two dependencies is the whole budget and a schema is a test input, not
// a runtime one: the parsers under src/core/model/ are what refuse a bad file at run time. Supports
// type (one or a list), properties, required, additionalProperties (boolean or schema), items, enum,
// const, pattern, minItems, minLength, minimum, maximum, oneOf, anyOf, allOf, not, $ref to #/$defs/…
// and `nullable`-style `type: [..., "null"]`. Anything else in a schema is a problem, not ignored.
const typeOf = v => v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v === 'number' ? (Number.isInteger(v) ? 'integer' : 'number') : typeof v;
const KNOWN = new Set(['$schema', '$id', 'title', 'description', '$defs', 'type', 'properties', 'required', 'additionalProperties', 'items', 'enum', 'const', 'pattern', 'minItems', 'minLength', 'minimum', 'maximum', 'oneOf', 'anyOf', 'allOf', 'not', '$ref', 'examples', 'default', '$comment']);

export function validate(schema, value, { root = schema, at = '$' } = {}) {
  const bad = [];
  if (typeof schema === 'boolean') return schema ? [] : [`${at}: not allowed`];
  for (const k of Object.keys(schema)) if (!KNOWN.has(k)) bad.push(`${at}: schema keyword "${k}" is not one this validator implements`);
  if (schema.$ref) {
    const m = schema.$ref.match(/^#\/\$defs\/([^/]+)$/); if (!m || !root.$defs?.[m[1]]) return [`${at}: unresolvable $ref ${schema.$ref}`];
    bad.push(...validate(root.$defs[m[1]], value, { root, at }));
  }
  if (schema.type) { const want = [].concat(schema.type); const got = typeOf(value); if (!want.includes(got) && !(got === 'integer' && want.includes('number'))) return bad.concat(`${at}: is ${got}, wanted ${want.join('|')}`); }
  if (schema.enum && !schema.enum.some(e => JSON.stringify(e) === JSON.stringify(value))) bad.push(`${at}: ${JSON.stringify(value)} is not one of ${schema.enum.map(e => JSON.stringify(e)).join(', ')}`);
  if ('const' in schema && JSON.stringify(schema.const) !== JSON.stringify(value)) bad.push(`${at}: must be ${JSON.stringify(schema.const)}`);
  if (typeof value === 'string') {
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) bad.push(`${at}: "${value}" does not match ${schema.pattern}`);
    if (schema.minLength != null && value.length < schema.minLength) bad.push(`${at}: shorter than ${schema.minLength}`);
  }
  if (typeof value === 'number') {
    if (schema.minimum != null && value < schema.minimum) bad.push(`${at}: ${value} < ${schema.minimum}`);
    if (schema.maximum != null && value > schema.maximum) bad.push(`${at}: ${value} > ${schema.maximum}`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems != null && value.length < schema.minItems) bad.push(`${at}: fewer than ${schema.minItems} items`);
    if (schema.items) value.forEach((v, i) => bad.push(...validate(schema.items, v, { root, at: `${at}[${i}]` })));
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const r of schema.required || []) if (!(r in value)) bad.push(`${at}: missing required "${r}"`);
    const props = schema.properties || {};
    for (const [k, v] of Object.entries(value)) {
      if (k in props) bad.push(...validate(props[k], v, { root, at: `${at}.${k}` }));
      else if (schema.additionalProperties === false) bad.push(`${at}: unknown property "${k}"`);
      else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') bad.push(...validate(schema.additionalProperties, v, { root, at: `${at}.${k}` }));
    }
  }
  if (schema.allOf) for (const s of schema.allOf) bad.push(...validate(s, value, { root, at }));
  if (schema.anyOf && !schema.anyOf.some(s => !validate(s, value, { root, at }).length)) bad.push(`${at}: matches none of the anyOf branches`);
  if (schema.oneOf) { const n = schema.oneOf.filter(s => !validate(s, value, { root, at }).length).length; if (n !== 1) bad.push(`${at}: matches ${n} oneOf branches, wanted exactly 1`); }
  if (schema.not && !validate(schema.not, value, { root, at }).length) bad.push(`${at}: matches a schema it must not`);
  return bad;
}

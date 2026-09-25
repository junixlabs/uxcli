// Provisioning: run a profile's provisioner, read what it declares, and keep the raw values in memory
// only. The packet ever sees `hashes`; `values` are the handle a run holds until cleanup.
import { spawnSync } from 'node:child_process';
import { sha1_8, getPath, globs } from '../chrome/hash.js';

const DAY = 24 * 60 * 60 * 1000;

// Runs `profile.provisioner.command` with `params` as JSON in $UXCLI_PARAMS and stdin, parses stdout as
// JSON, and extracts `provisioner.outputs` ({ name: '$.a.b' }). Synchronous, so a pair can run it.
export function provision(profile, { cwd = process.cwd(), env = process.env, params = {} } = {}) {
  const prov = profile?.provisioner || {};
  if (!prov.command) return { ok: false, values: {}, hashes: {}, missing: [], error: 'profile has no provisioner.command' };
  const asEnv = Object.fromEntries(Object.entries(params).map(([k, v]) => ['UXCLI_PARAM_' + k, String(v)]));
  const r = run(prov.command, { cwd, env, input: JSON.stringify(params), extra: { UXCLI_PARAMS: JSON.stringify(params), ...asEnv } });
  if (r.error) return { ok: false, values: {}, hashes: {}, missing: [], error: r.error };
  const values = {}, hashes = {}, missing = [];
  for (const [name, p] of Object.entries(prov.outputs || {})) {
    const v = getPath(r.json, p);
    if (v === undefined || v === null) missing.push(`${name} (${p})`); else { values[name] = v; hashes[name] = sha1_8(v); }
  }
  // `secrets` (a password the run must type) are values the packet never sees, not even hashed.
  for (const [name, p] of Object.entries(prov.secrets || {})) { const v = getPath(r.json, p); if (v !== undefined && v !== null) values[name] = v; }
  return { ok: missing.length === 0, values, hashes, missing };
}

// The provisioner's output is testimony; this is the check. `allowed` is the permission set the profile
// permits (see `allowedPermissions`). Rejections name the field and the rule.
export function verifyIdentity(values, policyEnv, { allowed = [], now = Date.now() } = {}) {
  const rejected = [];
  const no = (field, why) => rejected.push({ field, why });
  if (!globs(policyEnv?.syntheticTenants, values?.tenantId)) no('tenantId', `not in syntheticTenants ${JSON.stringify(policyEnv?.syntheticTenants || [])}`);
  const domain = String(values?.email || '').split('@')[1];
  if (!domain || !globs(policyEnv?.sinkDomains, domain)) no('email', `domain not in sinkDomains ${JSON.stringify(policyEnv?.sinkDomains || [])}`);
  const perms = [].concat(values?.permissions ?? []);
  const extra = perms.filter(p => !allowed.includes(p));
  if (extra.length) no('permissions', `outside allowed ${JSON.stringify(allowed)}: ${extra.join(', ')}`);
  const exp = values?.expiresAt ? Date.parse(values.expiresAt) : NaN;
  if (!values?.expiresAt) no('expiresAt', 'missing');
  else if (Number.isNaN(exp)) no('expiresAt', 'not a date');
  else if (exp <= now) no('expiresAt', 'already expired');
  else if (exp - now > DAY) no('expiresAt', 'more than 24h away');
  return { ok: rejected.length === 0, rejected };
}

// `verify.permissions: "⊆ [agent, viewer]"` → ['agent', 'viewer'].
export function allowedPermissions(profile) {
  const m = /\[([^\]]*)\]/.exec(String(profile?.verify?.permissions || ''));
  return m ? m[1].split(',').map(s => s.trim()).filter(Boolean) : [];
}

// Runs `provisioner.cleanup` with the raw values in $UXCLI_VALUES and stdin. `deleted` is the exit
// code; `verified` is the script saying so in its own JSON ({ deleted: true } or { verified: true }).
export function cleanup(profile, values, { cwd = process.cwd(), env = process.env } = {}) {
  const cmd = profile?.provisioner?.cleanup;
  if (!cmd) return { status: 'failed', verified: false, error: 'profile has no provisioner.cleanup' };
  const r = run(cmd, { cwd, env, input: JSON.stringify(values), extra: { UXCLI_VALUES: JSON.stringify(values) } });
  if (r.error) return { status: 'failed', verified: false, error: r.error };
  return { status: 'deleted', verified: r.json?.deleted === true || r.json?.verified === true };
}

function run(command, { cwd, env, input, extra }) {
  const r = spawnSync(command, { shell: true, cwd, env: { ...env, ...extra }, input, encoding: 'utf8', timeout: 120000 });
  if (r.error) return { error: r.error.message };
  if (r.status !== 0) return { error: `exit ${r.status}: ${(r.stderr || '').trim().slice(0, 200)}` };
  try { return { json: JSON.parse(r.stdout) }; } catch { return { error: 'stdout is not JSON' }; }
}

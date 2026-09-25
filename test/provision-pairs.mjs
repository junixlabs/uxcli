// A provisioner's output is a claim about who the run will be. This is the pair that shows the claim
// being checked: an identity outside the synthetic tenants, on a real mail domain, or with no expiry
// is refused and named, and the raw values never reach the packet's hashes.
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { provision, verifyIdentity, allowedPermissions, cleanup } from '../src/adapters/provision/index.js';

export const OPERATOR =
  'a fake provisioner whose output lacks a declared path; then one claiming a tenant outside the '
  + 'synthetic globs, an email on a real domain, and no expiresAt — each must be rejected by name; '
  + 'then a valid output, accepted, whose values appear nowhere in the hashes';

const ENV = { syntheticTenants: ['t_uxcli_*'], sinkDomains: ['example.invalid', 'mail.sink.local'] };
const PROFILE = (cmd, cleanupCmd) => ({ id: 'agent-basic', kind: 'identity', mode: 'provision',
  provisioner: { command: cmd, cleanup: cleanupCmd, outputs: { userId: '$.user.id', tenantId: '$.tenant.id', email: '$.user.email', permissions: '$.user.permissions', expiresAt: '$.expiresAt' } },
  verify: { permissions: '⊆ [agent]' } });
const GOOD = () => ({ user: { id: 'u_1', email: 'agent@example.invalid', permissions: ['agent'] }, tenant: { id: 't_uxcli_7f3a' }, expiresAt: new Date(Date.now() + 3600e3).toISOString() });

export function pair() {
  const problems = []; let checks = 0;
  const must = (what, cond) => { checks++; if (!cond) problems.push(what); };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'uxcli-prov-'));
  try {
    const fake = path.join(dir, 'fake.mjs');
    fs.writeFileSync(fake, 'process.stdout.write(process.env.FAKE_OUT);\n');
    fs.writeFileSync(path.join(dir, 'clean.mjs'), 'const v = JSON.parse(process.env.UXCLI_VALUES); process.stdout.write(JSON.stringify({ deleted: v.userId === "u_1" }));\n');
    const profile = PROFILE(`node "${fake}"`, `node "${path.join(dir, 'clean.mjs')}"`);
    const prov = out => provision(profile, { cwd: dir, env: { ...process.env, FAKE_OUT: JSON.stringify(out) } });
    const verify = values => verifyIdentity(values, ENV, { allowed: allowedPermissions(profile) });

    // Output missing a declared path — not ok, and the path is named.
    const { tenant: _t, ...noTenant } = GOOD();
    const missing = prov(noTenant);
    must('provision accepted an output with no $.tenant.id', missing.ok === false);
    must('provision did not name the missing path', missing.missing.some(m => m.includes('$.tenant.id')));

    // Tenant outside the synthetic globs.
    const real = GOOD(); real.tenant.id = 't_acme_prod';
    const r1 = verify(prov(real).values);
    must('a tenant outside syntheticTenants was accepted', !r1.ok && r1.rejected.some(r => r.field === 'tenantId'));

    // Email on a real domain.
    const mail = GOOD(); mail.user.email = 'agent@gmail.com';
    const r2 = verify(prov(mail).values);
    must('an email on a real domain was accepted', !r2.ok && r2.rejected.some(r => r.field === 'email'));

    // No expiresAt.
    const { expiresAt: _e, ...noExp } = GOOD();
    const p3 = prov(noExp);
    const r3 = verify(p3.values);
    must('an identity with no expiresAt was accepted', !r3.ok && r3.rejected.some(r => r.field === 'expiresAt' && r.why === 'missing'));
    must('provision did not report expiresAt as missing', p3.ok === false && p3.missing.some(m => m.startsWith('expiresAt')));

    // Permissions beyond the profile's set, and an expiry too far out.
    const admin = GOOD(); admin.user.permissions = ['agent', 'admin'];
    must('permissions outside the allowed set were accepted', verify(prov(admin).values).rejected.some(r => r.field === 'permissions'));
    const far = GOOD(); far.expiresAt = new Date(Date.now() + 3 * 86400e3).toISOString();
    must('an expiresAt beyond 24h was accepted', verify(prov(far).values).rejected.some(r => r.field === 'expiresAt'));

    // The valid one: accepted, hashed, and no raw value anywhere in the hashes.
    const ok = prov(GOOD());
    must('a valid output was not accepted', ok.ok === true && ok.missing.length === 0);
    must('a valid identity was rejected: ' + JSON.stringify(verify(ok.values).rejected), verify(ok.values).ok === true);
    const hashed = JSON.stringify(ok.hashes);
    must('hashes are not all sha1_8', Object.values(ok.hashes).every(h => /^sha1_8:[0-9a-f]{8}$/.test(h)));
    for (const v of ['u_1', 't_uxcli_7f3a', 'agent@example.invalid', 'example.invalid'])
      must(`raw value "${v}" leaked into hashes`, !hashed.includes(v));
    must('values were not held raw in memory for the run', ok.values.tenantId === 't_uxcli_7f3a');

    // Cleanup: verified only when the script says so.
    const c1 = cleanup(profile, ok.values, { cwd: dir });
    must('cleanup of the provisioned identity was not deleted+verified', c1.status === 'deleted' && c1.verified === true);
    const c2 = cleanup(profile, { userId: 'someone-else' }, { cwd: dir });
    must('cleanup claimed verified when the script did not say so', c2.status === 'deleted' && c2.verified === false);
    const c3 = cleanup(PROFILE(`node "${fake}"`, 'exit 3'), ok.values, { cwd: dir });
    must('a failing cleanup command was not reported failed', c3.status === 'failed');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  return { ok: problems.length === 0, problems, checks };
}

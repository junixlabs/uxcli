# Security

## What uxcli touches

- **The browser.** `uxcli run` launches Chromium (playwright-core) against the origin the project's
  policy names, or the one passed with `--origin`. It navigates, fills forms and clicks as the
  journey declares. It never sends anything anywhere else.
- **The project's provisioner.** When a journey requires an identity or a fixture and the policy's
  reach allows it, uxcli runs the commands the project's own profile names
  (`.uxcli/profiles/<id>.json` → `provisioner.command`), in the project directory, with
  `UXCLI_TARGET` set. It runs nothing it did not read from a file the project wrote.
- **Disk.** Runs are written under `.uxcli/runs/`. Screenshots may contain whatever the page
  showed. Identifiers, phone numbers, emails, cookies and `Authorization` headers are redacted to
  `sha1_8:` in `run.json`; screenshots are not redacted.
- **`--refute`** spawns `claude -p` (or `UXCLI_REFUTER`) with the screenshots of a fail. Nothing
  else leaves the machine. There is no telemetry, no update check, no network call of uxcli's own.

## Reach is a policy, not a flag

`.uxcli/policy/policy.json` says how far a run may go per environment: `observe` (no identity, no
fixture, no effect), `interact`, `mutate`, `inject`. `uxcli init --apply` writes the floor. Raising
it is an edit to that file with a signer, never a command-line switch. A run that would exceed it is
`blocked`, and says so.

Do not point uxcli at production with a policy that allows `mutate`. The example policy shows a
production environment pinned to `observe`.

## Reporting a vulnerability

Email security@junixlabs.com, or open a private security advisory on GitHub. Say what uxcli did
that it should not have (a write outside `.uxcli/`, a request to an origin the policy did not name,
a provisioner run the reach did not allow) and attach the run directory. Expect an acknowledgement
within three working days. Please do not open a public issue for something that lets a journey file
drive the browser somewhere its policy forbids.

## Supply chain

Two runtime dependencies (`playwright-core`, `axe-core`), pinned. Releases are published from
`release.yml` with npm provenance on an annotated tag that must match `package.json`; nothing is
published by hand.

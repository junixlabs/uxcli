#!/bin/sh
# uxcli identity provisioner for profile agent-basic.
# Prints: { "user": {"id","email","permissions":["agent"],"password"}, "tenant": {"id":"t_uxcli_…"}, "expiresAt": "<now+1h>" }
set -eu
. "$(dirname "$0")/_common.sh"
request POST /api/provision/agents '{"ttlHours":1}'
[ "$STATUS" = "201" ] || { printf '%s\n' "$BODY" >&2; exit 1; }
printf '%s\n' "$BODY"

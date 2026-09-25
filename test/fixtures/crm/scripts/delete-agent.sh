#!/bin/sh
# uxcli identity cleanup for profile agent-basic. Removes the user, its tenant and everything in it.
# Usage: delete-agent.sh <userId>   |   provision output on stdin
# Exit 0 only when the record is gone afterwards.
set -eu
. "$(dirname "$0")/_common.sh"
ID="${1:-}"
[ -n "$ID" ] || ID=$(json_in user id)
[ -n "$ID" ] || { echo '{"error":"thiếu userId"}' >&2; exit 2; }
request DELETE "/api/provision/agents/$ID"
[ "$STATUS" = "200" ] || { printf '%s\n' "$BODY" >&2; exit 1; }
DELETED="$BODY"
request GET "/api/provision/agents/$ID"
[ "$STATUS" = "404" ] || { printf '{"error":"user %s vẫn còn sau khi xoá","status":%s}\n' "$ID" "$STATUS" >&2; exit 1; }
printf '%s\n' "$DELETED"

#!/bin/sh
# uxcli data cleanup for profile lead-new-unassigned.
# Usage: delete-lead.sh <leadId>   |   seed output on stdin
# Exit 0 only when the record is gone afterwards.
set -eu
. "$(dirname "$0")/_common.sh"
ID="${1:-}"
[ -n "$ID" ] || ID=$(json_in lead id)
[ -n "$ID" ] || { echo '{"error":"thiếu leadId"}' >&2; exit 2; }
request DELETE "/api/provision/leads/$ID"
[ "$STATUS" = "200" ] || { printf '%s\n' "$BODY" >&2; exit 1; }
DELETED="$BODY"
request GET "/api/provision/leads/$ID"
[ "$STATUS" = "404" ] || { printf '{"error":"lead %s vẫn còn sau khi xoá","status":%s}\n' "$ID" "$STATUS" >&2; exit 1; }
printf '%s\n' "$DELETED"

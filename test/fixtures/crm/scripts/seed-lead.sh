#!/bin/sh
# uxcli data provisioner for profile lead-new-unassigned.
# Usage: seed-lead.sh --tenant t_uxcli_xxx [--status new] [--createdMinutesAgo 10] [--phone +8490…]
#        (--tenant may be omitted when $UXCLI_TENANT_ID is set)
# Prints: { "lead": {"id","phone",…} }
set -eu
. "$(dirname "$0")/_common.sh"
TENANT="${UXCLI_TENANT_ID:-${UXCLI_PARAM_tenant:-}}"; LEAD_STATUS="${UXCLI_PARAM_status:-new}"; MINUTES="${UXCLI_PARAM_createdMinutesAgo:-0}"; PHONE="${UXCLI_PARAM_phone:-}"
while [ $# -gt 0 ]; do
  case "$1" in
    --tenant|--tenantId) TENANT="$2"; shift 2 ;;
    --tenant=*|--tenantId=*) TENANT="${1#*=}"; shift ;;
    --status) LEAD_STATUS="$2"; shift 2 ;;
    --status=*) LEAD_STATUS="${1#*=}"; shift ;;
    --createdMinutesAgo) MINUTES="$2"; shift 2 ;;
    --createdMinutesAgo=*) MINUTES="${1#*=}"; shift ;;
    --phone) PHONE="$2"; shift 2 ;;
    --phone=*) PHONE="${1#*=}"; shift ;;
    *) printf '{"error":"tham số không hiểu: %s"}\n' "$1" >&2; exit 2 ;;
  esac
done
[ -n "$TENANT" ] || { echo '{"error":"thiếu --tenant"}' >&2; exit 2; }
case "$MINUTES" in ''|*[!0-9]*) echo '{"error":"--createdMinutesAgo phải là số nguyên"}' >&2; exit 2 ;; esac
PHONE_JSON=""; [ -n "$PHONE" ] && PHONE_JSON=",\"phone\":\"$PHONE\""
request POST /api/provision/leads "{\"tenantId\":\"$TENANT\",\"status\":\"$LEAD_STATUS\",\"createdMinutesAgo\":$MINUTES,\"assignedTo\":null$PHONE_JSON}"
[ "$STATUS" = "201" ] || { printf '%s\n' "$BODY" >&2; exit 1; }
printf '%s\n' "$BODY"

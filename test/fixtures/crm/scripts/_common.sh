# Shared by the uxcli provisioner scripts. POSIX sh; curl only, no jq.
# Target: $UXCLI_TARGET, else http://localhost:$CRM_PORT, else http://localhost:3000.
TARGET="${UXCLI_TARGET:-http://localhost:${CRM_PORT:-3000}}"

# request METHOD PATH [JSON_BODY] — sets $BODY (response body) and $STATUS (http code)
request() {
  _m="$1"; _p="$2"; _b="${3:-}"
  if [ -n "$_b" ]; then
    _out=$(curl -sS -X "$_m" -H 'content-type: application/json' --data "$_b" -w '\n%{http_code}' "$TARGET$_p") || { echo "{\"error\":\"không kết nối được $TARGET\"}" >&2; exit 1; }
  else
    _out=$(curl -sS -X "$_m" -w '\n%{http_code}' "$TARGET$_p") || { echo "{\"error\":\"không kết nối được $TARGET\"}" >&2; exit 1; }
  fi
  STATUS=$(printf '%s' "$_out" | tail -n 1)
  BODY=$(printf '%s\n' "$_out" | sed '$d')
}

# json_in OBJ KEY < json — the string value of "OBJ":{… "KEY":"value" …} (enough for our own API shapes; no jq)
json_in() { sed -n "s/.*\"$1\"[[:space:]]*:[[:space:]]*{[^}]*\"$2\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p" | head -n 1; }

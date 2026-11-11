#!/bin/sh
# Render infra/consul/core-app-local.yml.example with values from infra/.env and
# store it in Consul KV at config/core-app,local/data.
# Usage: sh infra/scripts/load-consul-config.sh        (CONSUL_HTTP_ADDR overrides http://127.0.0.1:8500)
set -eu

script_dir=$(cd "$(dirname "$0")" && pwd)
infra_dir=$(dirname "$script_dir")
. "$script_dir/_env.sh"

load_env "$infra_dir/.env"
require_env POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD KEYCLOAK_CLIENT_SECRET \
  MINIO_ROOT_USER MINIO_ROOT_PASSWORD APP_CRYPTO_KEY
# Optional key: empty means "rule-based chatbot fallback only", but it must be defined for the template.
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY-}
export ANTHROPIC_API_KEY

case ${#APP_CRYPTO_KEY} in
  16 | 24 | 32) ;;
  *) die "APP_CRYPTO_KEY must be exactly 16, 24 or 32 characters (got ${#APP_CRYPTO_KEY})" ;;
esac

consul_addr=${CONSUL_HTTP_ADDR:-http://127.0.0.1:8500}
template="$infra_dir/consul/core-app-local.yml.example"
[ -f "$template" ] || die "template not found: $template"

rendered=$(mktemp)
trap 'rm -f "$rendered"' EXIT

# Replace every ${NAME} with the environment value. Fails on unknown names and on values that would break
# a double-quoted YAML string (double quote, backslash).
awk '
  {
    line = $0
    out = ""
    while (match(line, /\$\{[A-Za-z_][A-Za-z0-9_]*\}/)) {
      name = substr(line, RSTART + 2, RLENGTH - 3)
      if (!(name in ENVIRON)) {
        printf "ERROR: template references %s but it is not defined in infra/.env\n", name > "/dev/stderr"
        bad = 1
      } else if (ENVIRON[name] ~ /["\\]/) {
        printf "ERROR: %s contains a double quote or backslash, which is not allowed\n", name > "/dev/stderr"
        bad = 1
      }
      out = out substr(line, 1, RSTART - 1) ENVIRON[name]
      line = substr(line, RSTART + RLENGTH)
    }
    print out line
  }
  END { exit bad }
' "$template" >"$rendered" || die "rendering failed"

command -v curl >/dev/null 2>&1 || die "curl not found in PATH"
result=$(curl -fsS -X PUT --data-binary "@$rendered" "$consul_addr/v1/kv/config/core-app,local/data") ||
  die "could not write to Consul at $consul_addr (is the consul container healthy?)"
[ "$result" = "true" ] || die "Consul rejected the write (response: $result)"

echo "Loaded config/core-app,local/data into Consul at $consul_addr"
echo "Review (contains secrets): curl -s $consul_addr/v1/kv/config/core-app,local/data?raw"

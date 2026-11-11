#!/bin/sh
# Sourced helper (do not run). Loads infra/.env without evaluating it as shell code.

die() {
  printf '%s\n' "ERROR: $1" >&2
  exit 1
}

# load_env FILE - export every KEY=VALUE line (blank lines and # comments skipped, matching quotes stripped).
load_env() {
  [ -f "$1" ] || die "$1 not found. Copy infra/.env.example to infra/.env and fill every key."
  while IFS= read -r line || [ -n "$line" ]; do
    line=$(printf '%s' "$line" | tr -d '\r')
    case "$line" in
      '' | '#'*) continue ;;
      *=*) ;;
      *) continue ;;
    esac
    key=${line%%=*}
    val=${line#*=}
    case "$key" in
      '' | *[!A-Za-z0-9_]*) continue ;;
    esac
    case "$val" in
      \"*\") val=${val#\"}; val=${val%\"} ;;
      \'*\') val=${val#\'}; val=${val%\'} ;;
    esac
    export "$key=$val"
  done <"$1"
}

# require_env NAME... - fail when a variable is unset or empty.
require_env() {
  for name in "$@"; do
    eval "value=\${$name-}"
    [ -n "$value" ] || die "$name is empty or missing in infra/.env"
  done
}

# Podman is a drop-in replacement: when only podman is installed, route every `docker` call to it.
if ! command -v docker >/dev/null 2>&1 && command -v podman >/dev/null 2>&1; then
  docker() { podman "$@"; }
fi

# require_container NAME - fail with a hint when the container is not running.
require_container() {
  command -v docker >/dev/null 2>&1 || die "docker (or podman) not found in PATH"
  [ "$(docker inspect -f '{{.State.Running}}' "$1" 2>/dev/null)" = "true" ] ||
    die "container $1 is not running. Start it with: docker compose up -d (in infra/)"
}

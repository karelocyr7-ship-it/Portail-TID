#!/usr/bin/env bash
set -Eeuo pipefail
repo_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
compose() {
  if [[ -n "${PORTAL_COMPOSE_ENV_FILE:-}" ]]; then
    docker compose --env-file "$PORTAL_COMPOSE_ENV_FILE" -f "$repo_dir/compose.yml" "$@"
  else
    docker compose -f "$repo_dir/compose.yml" "$@"
  fi
}
[[ "$(git -C "$repo_dir" branch --show-current)" == main ]]
[[ -z "$(git -C "$repo_dir" status --porcelain)" ]]
[[ "$(git -C "$repo_dir" rev-parse HEAD)" == "$(git -C "$repo_dir" rev-parse origin/main)" ]]
compose config --quiet
running="$(compose ps -q keycloak)"
[[ -n "$running" ]]
previous="$(docker inspect --format '{{.Image}}' "$running")"
[[ "$(docker inspect --format '{{.State.Health.Status}}' "$running")" == healthy ]]
image="${KEYCLOAK_IMAGE:-tad-keycloak:initial-access-26.6.2-v1}"
if [[ "$image" == tad-keycloak:initial-access-26.6.2-v1 ]]; then
  docker build -t "$image" "$repo_dir/infrastructure/keycloak/initial-access"
else
  docker image inspect "$image" >/dev/null
fi
"$repo_dir/scripts/backup.sh"
wait_health() {
  local id status
  id="$(compose ps -q keycloak)"
  for attempt in {1..60}; do
    status="$(docker inspect --format '{{.State.Health.Status}}' "$id")"
    [[ "$status" == healthy ]] && return 0
    [[ "$status" == unhealthy ]] && return 1
    sleep 5
  done
  return 1
}
rollback() {
  local code=$?
  trap - EXIT
  if (( code != 0 )); then
    export KEYCLOAK_IMAGE="$previous"
    compose up -d --pull never --no-deps keycloak
    wait_health || true
    printf 'Keycloak rollback image selected: %s\n' "$previous" >&2
  fi
  exit "$code"
}
trap rollback EXIT
export KEYCLOAK_IMAGE="$image"
compose up -d --pull never --no-deps keycloak
wait_health
public_ready=0
for attempt in {1..12}; do
  if curl --fail --silent --max-time 10 \
      https://portail.tadgroupe.com/auth/realms/tad-groupe/.well-known/openid-configuration >/dev/null; then
    public_ready=1
    break
  fi
  sleep 5
done
(( public_ready == 1 ))
trap - EXIT
printf 'Keycloak initial-access image: %s\nRollback image: %s\n' "$image" "$previous"

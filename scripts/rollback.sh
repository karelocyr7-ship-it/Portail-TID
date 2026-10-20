#!/usr/bin/env bash
set -Eeuo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
state_dir="${PORTAL_RELEASE_STATE_DIR:-/srv/tad/backups}"
state_file="$state_dir/portal-release-rollback.tag"
health_url="${PORTAL_HEALTH_URL:-https://portail.tadgroupe.com/health}"
services=(portal mail-worker provisioning-worker)

fail() { printf 'ERREUR: %s\n' "$*" >&2; exit 1; }
compose() {
  if [[ -n "${PORTAL_COMPOSE_ENV_FILE:-}" ]]; then
    docker compose --env-file "$PORTAL_COMPOSE_ENV_FILE" -f "$repo_dir/compose.yml" "$@"
  else
    docker compose -f "$repo_dir/compose.yml" "$@"
  fi
}

wait_for_health() {
  local container_id status attempt
  container_id="$(compose ps -q portal)"
  [[ -n "$container_id" ]] || return 1
  for attempt in $(seq 1 60); do
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}' "$container_id" 2>/dev/null || true)"
    [[ "$status" == healthy ]] && break
    [[ "$status" == unhealthy || "$status" == missing ]] && return 1
    sleep 5
  done
  [[ "${status:-}" == healthy ]] || return 1
  curl --fail --silent --show-error --max-time 10 "$health_url" >/dev/null
  for service in mail-worker provisioning-worker; do
    local worker_id worker_status
    worker_id="$(compose ps -q "$service")"
    [[ -n "$worker_id" ]] || return 1
    worker_status="$(docker inspect --format '{{.State.Status}}' "$worker_id")"
    [[ "$worker_status" == running ]] || return 1
  done
}

[[ "$(git -C "$repo_dir" branch --show-current)" == main ]] || fail 'lancer depuis la branche main uniquement.'
[[ -z "$(git -C "$repo_dir" status --porcelain)" ]] || fail 'le dépôt contient des modifications locales.'
head="$(git -C "$repo_dir" rev-parse HEAD)"
main_ref="$(git -C "$repo_dir" rev-parse origin/main 2>/dev/null)" || fail 'origin/main absent; mettre à jour les références Git.'
[[ "$head" == "$main_ref" ]] || fail 'HEAD doit être identique à origin/main.'
if [[ -n "${PORTAL_COMPOSE_ENV_FILE:-}" && ! -r "$PORTAL_COMPOSE_ENV_FILE" ]]; then
  fail 'le fichier d’environnement Compose indiqué est illisible.'
fi
[[ -r "$state_file" ]] || fail "fichier de retour arrière absent: $state_file"
previous_tag="$(<"$state_file")"
[[ "$previous_tag" =~ ^rollback-[0-9]{8}T[0-9]{6}Z-[a-f0-9]{64}$ ]] || fail 'tag de retour arrière invalide.'
docker image inspect "tad-portal:$previous_tag" >/dev/null 2>&1 || fail "image de retour arrière introuvable: tad-portal:$previous_tag"

PORTAL_IMAGE_TAG="$previous_tag" compose up -d --no-deps "${services[@]}"
wait_for_health || fail 'le healthcheck après rollback a échoué; intervention opérateur requise.'
printf 'Retour arrière OK: image tad-portal:%s; services %s.\n' "$previous_tag" "${services[*]}"

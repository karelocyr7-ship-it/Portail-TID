#!/usr/bin/env bash
set -Eeuo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
state_dir="${PORTAL_RELEASE_STATE_DIR:-/srv/tad/backups}"
state_file="$state_dir/portal-release-rollback.tag"
health_url="${PORTAL_HEALTH_URL:-https://portail.tadgroupe.com/health}"
services=(portal mail-worker provisioning-worker)
previous_tag=""
deployment_started=0

fail() { printf 'ERREUR: %s\n' "$*" >&2; exit 1; }
compose() {
  if [[ -n "${PORTAL_COMPOSE_ENV_FILE:-}" ]]; then
    docker compose --env-file "$PORTAL_COMPOSE_ENV_FILE" -f "$repo_dir/compose.yml" "$@"
  else
    docker compose -f "$repo_dir/compose.yml" "$@"
  fi
}

rollback_on_exit() {
  local status=$?
  trap - EXIT
  if (( status != 0 && deployment_started )); then
    printf 'Échec de livraison; tentative de retour à %s.\n' "$previous_tag" >&2
    if [[ -n "$previous_tag" ]] && docker image inspect "tad-portal:$previous_tag" >/dev/null 2>&1; then
      if PORTAL_IMAGE_TAG="$previous_tag" compose up -d --no-deps "${services[@]}" && wait_for_health; then
        printf 'Retour automatique à tad-portal:%s confirmé.\n' "$previous_tag" >&2
      else
        printf 'ERREUR: retour automatique non confirmé; intervention opérateur requise.\n' >&2
      fi
    fi
  fi
  exit "$status"
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

trap rollback_on_exit EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

[[ "$(git -C "$repo_dir" branch --show-current)" == main ]] || fail 'lancer depuis la branche main uniquement.'
[[ -z "$(git -C "$repo_dir" status --porcelain)" ]] || fail 'le dépôt contient des modifications locales.'
head="$(git -C "$repo_dir" rev-parse HEAD)"
main_ref="$(git -C "$repo_dir" rev-parse origin/main 2>/dev/null)" || fail 'origin/main absent; mettre à jour les références Git.'
[[ "$head" == "$main_ref" ]] || fail 'HEAD doit être identique à origin/main après git pull --ff-only.'
command -v docker >/dev/null || fail 'Docker est absent.'
command -v curl >/dev/null || fail 'curl est absent.'
if [[ -n "${PORTAL_COMPOSE_ENV_FILE:-}" && ! -r "$PORTAL_COMPOSE_ENV_FILE" ]]; then
  fail 'le fichier d’environnement Compose indiqué est illisible.'
fi
compose config --quiet
"$repo_dir/scripts/backup.sh"
umask 077
mkdir -p "$state_dir"

running_id="$(compose ps -q portal)"
[[ -n "$running_id" ]] || fail 'aucun conteneur portail actif; livraison annulée.'
old_image_id="$(docker inspect --format '{{.Image}}' "$running_id")"
[[ -n "$old_image_id" ]] || fail 'impossible d’identifier l’image actuellement en service.'
release_tag="${head:0:12}"
previous_tag="rollback-$(date -u +%Y%m%dT%H%M%SZ)-${old_image_id#sha256:}"
docker image tag "$old_image_id" "tad-portal:$previous_tag"
printf '%s\n' "$previous_tag" > "$state_file"
chmod 600 "$state_file"
deployment_started=1

PORTAL_IMAGE_TAG="$release_tag" compose build portal
PORTAL_IMAGE_TAG="$release_tag" compose up -d --no-deps "${services[@]}"
wait_for_health || fail 'le healthcheck local ou l’URL publique a échoué.'

deployment_started=0
trap - EXIT INT TERM
printf 'Livraison OK: commit %s, services %s.\n' "$head" "${services[*]}"
printf 'Image de retour arrière conservée: tad-portal:%s\n' "$previous_tag"
printf 'Healthcheck public OK: %s\n' "$health_url"

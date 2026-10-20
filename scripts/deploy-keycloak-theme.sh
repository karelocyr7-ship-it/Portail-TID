#!/usr/bin/env bash
set -Eeuo pipefail

repo_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
state_dir="${PORTAL_RELEASE_STATE_DIR:-/srv/tad/backups}"
oidc_url="https://portail.tadgroupe.com/auth/realms/tad-groupe/.well-known/openid-configuration"
login_url="https://portail.tadgroupe.com/api/auth/login"
theme_files=(
  infrastructure/keycloak/themes/tad-login/login/messages/messages_en.properties
  infrastructure/keycloak/themes/tad-login-v2/login/messages/messages_en.properties
)
deployment_started=0
previous_dir=""

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
  container_id="$(compose ps -q keycloak)"
  [[ -n "$container_id" ]] || return 1
  for attempt in $(seq 1 60); do
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}' "$container_id" 2>/dev/null || true)"
    [[ "$status" == healthy ]] && break
    [[ "$status" == unhealthy || "$status" == missing ]] && return 1
    sleep 5
  done
  [[ "${status:-}" == healthy ]] || return 1
  curl --fail --silent --show-error --max-time 10 "$oidc_url" >/dev/null || return 1
}

verify_login_title() {
  local html
  html="$(curl --fail --silent --show-error --location --max-redirs 8 --max-time 30 "$login_url")" || return 1
  [[ "$html" == *"Connexion"* && "$html" != *"Sign in to your account"* ]]
}

rollback_on_exit() {
  local status=$?
  trap - EXIT
  if (( status != 0 && deployment_started )); then
    printf 'Échec du contrôle Keycloak; restauration des messages précédents.\n' >&2
    local rel
    for rel in "${theme_files[@]}"; do
      cp "$previous_dir/$rel" "$repo_dir/$rel"
    done
    if compose up -d --no-deps --force-recreate keycloak && wait_for_health; then
      printf 'Keycloak est revenu sain avec les anciens messages. Le checkout est laissé modifié pour faciliter la revue du rollback.\n' >&2
    else
      printf 'ERREUR: retour arrière non confirmé; intervention opérateur requise.\n' >&2
    fi
  fi
  exit "$status"
}

trap rollback_on_exit EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

[[ "$(git -C "$repo_dir" branch --show-current)" == main ]] || fail 'lancer depuis la branche main uniquement.'
[[ -z "$(git -C "$repo_dir" status --porcelain)" ]] || fail 'le dépôt contient des modifications locales.'
head="$(git -C "$repo_dir" rev-parse HEAD)"
main_ref="$(git -C "$repo_dir" rev-parse origin/main 2>/dev/null)" || fail 'origin/main absent; mettre à jour les références Git.'
[[ "$head" == "$main_ref" ]] || fail 'HEAD doit être identique à origin/main après git pull --ff-only.'
[[ -n "${PORTAL_COMPOSE_ENV_FILE:-}" && -r "$PORTAL_COMPOSE_ENV_FILE" ]] || fail 'indiquer un fichier Compose lisible via PORTAL_COMPOSE_ENV_FILE.'
for rel in "${theme_files[@]}"; do
  grep -qx 'loginAccountTitle=Connexion' "$repo_dir/$rel" || fail "traduction loginAccountTitle absente: $rel"
done
compose config --quiet
running="$(compose ps -q keycloak)"
[[ -n "$running" ]] || fail 'aucun conteneur Keycloak actif.'
[[ "$(docker inspect --format '{{.State.Health.Status}}' "$running")" == healthy ]] || fail 'Keycloak n’est pas sain avant livraison.'

parent="$(git -C "$repo_dir" rev-parse HEAD^)" || fail 'commit parent absent; rollback impossible.'
umask 077
mkdir -p "$state_dir"
previous_dir="$(mktemp -d "$state_dir/keycloak-theme-rollback.XXXXXX")"
for rel in "${theme_files[@]}"; do
  mkdir -p "$previous_dir/$(dirname "$rel")"
  git -C "$repo_dir" show "$parent:$rel" > "$previous_dir/$rel"
done
"$repo_dir/scripts/backup.sh"

deployment_started=1
compose up -d --no-deps --force-recreate keycloak
wait_for_health || fail 'le healthcheck Keycloak ou OpenID public a échoué.'
verify_login_title || fail 'la page de connexion n’affiche pas Connexion.'

deployment_started=0
trap - EXIT INT TERM
printf 'Thème Keycloak livré: loginAccountTitle=Connexion dans les deux thèmes; santé et page de connexion vérifiées.\n'
printf 'Retour arrière des messages disponible dans: %s\n' "$previous_dir"

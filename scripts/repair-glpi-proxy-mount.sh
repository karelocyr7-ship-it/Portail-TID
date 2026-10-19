#!/usr/bin/env bash
# Exige l'autorisation ciblée de recréer seulement Caddy (brève interruption HTTPS).
set -Eeuo pipefail
repo=$(cd "$(dirname "$0")/.." && pwd)
cd "$repo"
[[ ${GLPI_CADDY_RECREATE_APPROVED:-} == yes ]]
[[ $(git branch --show-current) == main && -z $(git status --porcelain) ]]
[[ $(git rev-parse HEAD) == $(git rev-parse origin/main) ]]
live=/srv/tad/portail/infrastructure/caddy/Caddyfile
backup=/srv/tad/backups/caddy-before-glpi-MFVq5K
[[ $(sha256sum "$backup" | cut -d' ' -f1) == f77d1ccbd6be2a5a76e3c664df66b43c3982f64a4dae51211717da1c4feb6879 ]]
cmp --silent "$live" infrastructure/caddy/Caddyfile
compose=(sudo -n docker compose --env-file /srv/tad/portail/.env -f "$repo/compose.yml")
"${compose[@]}" config --quiet
[[ $("${compose[@]}" config --format json caddy | jq -r '.services.caddy.image') == $(docker inspect --format '{{.Config.Image}}' tad-portail-caddy-1) ]]
docker cp infrastructure/caddy/Caddyfile tad-portail-caddy-1:/tmp/Caddyfile.glpi-candidate
docker exec tad-portail-caddy-1 caddy validate --config /tmp/Caddyfile.glpi-candidate --adapter caddyfile >/dev/null 2>&1
rollback() {
  cp "$backup" "$live"
  "${compose[@]}" up -d --no-deps --force-recreate caddy
}
trap rollback ERR
"${compose[@]}" up -d --no-deps --force-recreate caddy
expected=$(sha256sum "$live" | cut -d' ' -f1)
actual=$(docker exec tad-portail-caddy-1 sha256sum /etc/caddy/Caddyfile | cut -d' ' -f1)
[[ "$expected" == "$actual" ]]
curl --retry 8 --retry-delay 2 --retry-all-errors -fsS https://portail.tadgroupe.com/health >/dev/null
trap - ERR
echo 'Montage Caddy corrigé, santé portail vérifiée. Contrôler émission TLS GLPI avant activation.'

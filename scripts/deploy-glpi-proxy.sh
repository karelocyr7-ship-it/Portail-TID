#!/usr/bin/env bash
# Livraison limitée au proxy GLPI et à sa fiche inactive, aucun rebuild portail.
set -Eeuo pipefail
umask 077
repo=$(cd "$(dirname "$0")/.." && pwd)
cd "$repo"
[[ $(git branch --show-current) == main ]]
[[ -z $(git status --porcelain) ]]
[[ $(git rev-parse HEAD) == $(git rev-parse origin/main) ]]
live=/srv/tad/portail/infrastructure/caddy/Caddyfile
baseline=f77d1ccbd6be2a5a76e3c664df66b43c3982f64a4dae51211717da1c4feb6879
[[ $(sha256sum "$live" | cut -d' ' -f1) == "$baseline" ]] || { echo 'Configuration partagée modifiée : livraison refusée'; exit 1; }
curl -fsS https://portail.tadgroupe.com/health >/dev/null
docker cp infrastructure/caddy/Caddyfile tad-portail-caddy-1:/tmp/Caddyfile.glpi-candidate
docker exec tad-portail-caddy-1 caddy validate --config /tmp/Caddyfile.glpi-candidate --adapter caddyfile >/dev/null 2>&1
backup=$(mktemp /srv/tad/backups/caddy-before-glpi-XXXXXX)
cp "$live" "$backup"
rollback() {
  cp "$backup" "$live"
  docker exec tad-portail-caddy-1 caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1
}
trap 'rollback' ERR
# Copy into the existing inode, preserving the running bind mount.
cp infrastructure/caddy/Caddyfile "$live"
[[ $(sha256sum "$live" | cut -d' ' -f1) == $(docker exec tad-portail-caddy-1 sha256sum /etc/caddy/Caddyfile | cut -d' ' -f1) ]] || { echo 'Montage obsolète : recréation Caddy requise avec autorisation ciblée'; false; }
docker exec tad-portail-caddy-1 caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1
curl -fsS https://portail.tadgroupe.com/health >/dev/null
docker exec -i tad-portail-portal-1 node --input-type=module < scripts/register-glpi.mjs
trap - ERR
printf 'Proxy chargé ; fiche GLPI inactive. Sauvegarde Caddy : %s\n' "$backup"

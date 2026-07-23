#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "== Conteneurs =="
docker compose -f "$repo_dir/compose.yml" ps --all

echo "== Ressources =="
docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}' 2>/dev/null || true
df -h "$repo_dir"

echo "== Santé publique =="
curl -kfsS https://portail.tadgroupe.com/health
echo

echo "== Certificat =="
if command -v openssl >/dev/null 2>&1; then
  timeout 10 openssl s_client -connect portail.tadgroupe.com:443 \
    -servername portail.tadgroupe.com </dev/null 2>/dev/null |
    openssl x509 -noout -dates 2>/dev/null || echo "Certificat non lisible"
else
  echo "openssl indisponible"
fi

echo "== Dernières sauvegardes =="
find "${BACKUP_DIR:-/srv/tad/backups}" -maxdepth 1 -type f -name 'tad-*.tar.gz' \
  -printf '%TY-%Tm-%Td %TH:%TM %s octets %p\n' 2>/dev/null | sort -r | head -5 || true

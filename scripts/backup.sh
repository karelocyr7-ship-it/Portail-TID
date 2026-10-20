#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
backup_dir="${BACKUP_DIR:-/srv/tad/backups}"
compose() {
  if [[ -n "${PORTAL_COMPOSE_ENV_FILE:-}" ]]; then
    docker compose --env-file "$PORTAL_COMPOSE_ENV_FILE" -f "$repo_dir/compose.yml" "$@"
  else
    docker compose -f "$repo_dir/compose.yml" "$@"
  fi
}
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
work_dir="$(mktemp -d "${TMPDIR:-/tmp}/tad-backup.XXXXXX")"
archive_dir="$work_dir/tad-$timestamp"
archive="$backup_dir/tad-$timestamp.tar.gz"

cleanup() { rm -rf "$work_dir"; }
trap cleanup EXIT

umask 077
mkdir -p "$backup_dir" "$archive_dir/postgres" "$archive_dir/data"
if [[ -n "${PORTAL_COMPOSE_ENV_FILE:-}" && ! -r "$PORTAL_COMPOSE_ENV_FILE" ]]; then
  printf 'ERREUR: le fichier d’environnement Compose indiqué est illisible.\n' >&2
  exit 1
fi

for database in portal keycloak n8n; do
  compose exec -T postgres sh -c \
    "PGPASSWORD=\"\$POSTGRES_PASSWORD\" pg_dump -U \"\$POSTGRES_USER\" -d '$database' --format=custom --no-owner --no-acl" \
    > "$archive_dir/postgres/$database.dump"
done

compose exec -T n8n \
  tar -C /home/node/.n8n -czf - . > "$archive_dir/data/n8n-data.tar.gz"
compose exec -T uptime-kuma \
  tar -C /app/data -czf - . > "$archive_dir/data/uptime-data.tar.gz"

tar -C "$repo_dir" -czf "$archive_dir/configuration.tar.gz" \
  compose.yml compose.dev.yml Makefile .env.example infrastructure scripts docs README.md SECURITY.md CONTRIBUTING.md

(
  cd "$archive_dir"
  sha256sum postgres/*.dump data/*.tar.gz configuration.tar.gz > SHA256SUMS
  printf 'created_at=%s\n' "$timestamp"
  printf 'databases=portal,keycloak,n8n\n'
  printf 'contains_env=false\n'
) > "$archive_dir/MANIFEST"

tar -C "$work_dir" -czf "$archive" "tad-$timestamp"
sha256sum "$archive" > "$archive.sha256"
chmod 600 "$archive" "$archive.sha256"
echo "Sauvegarde créée : $archive"

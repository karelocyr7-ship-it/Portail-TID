#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
backup_dir="${BACKUP_DIR:-/srv/tad/backups}"
mode="${1:---check-only}"
archive="${2:-}"

if [[ -z "$archive" ]]; then
  archive="$(find "$backup_dir" -maxdepth 1 -type f -name 'tad-*.tar.gz' -printf '%T@ %p\n' 2>/dev/null | sort -nr | awk 'NR == 1 { print $2 }')"
fi
[[ -n "$archive" && -f "$archive" ]] || { echo "Archive introuvable." >&2; exit 1; }

work_dir="$(mktemp -d "${TMPDIR:-/tmp}/tad-restore.XXXXXX")"
cleanup() { rm -rf "$work_dir"; }
trap cleanup EXIT

tar -xzf "$archive" -C "$work_dir"
root_dir="$(find "$work_dir" -mindepth 1 -maxdepth 1 -type d -print -quit)"
[[ -n "$root_dir" && -f "$root_dir/MANIFEST" && -f "$root_dir/SHA256SUMS" ]] || {
  echo "Archive invalide : manifeste absent." >&2
  exit 1
}
(
  cd "$root_dir"
  sha256sum -c SHA256SUMS
)

if [[ "$mode" == "--check-only" ]]; then
  echo "Contrôle d’intégrité réussi : $archive"
  exit 0
fi

if [[ "$mode" != "--restore-check" ]]; then
  echo "Usage: $0 [--check-only|--restore-check] [archive.tar.gz]" >&2
  exit 2
fi

suffix="$(date -u +%Y%m%d%H%M%S)_$$"
created_databases=()
cleanup_databases() {
  for database in "${created_databases[@]}"; do
    docker compose -f "$repo_dir/compose.yml" exec -T postgres sh -c \
      "PGPASSWORD=\"\$POSTGRES_PASSWORD\" dropdb -U \"\$POSTGRES_USER\" --if-exists '$database'" >/dev/null || true
  done
}
trap 'cleanup_databases; cleanup' EXIT

for database in portal keycloak n8n; do
  target="restore_check_${database//-/_}_$suffix"
  created_databases+=("$target")
  docker compose -f "$repo_dir/compose.yml" exec -T postgres sh -c \
    "PGPASSWORD=\"\$POSTGRES_PASSWORD\" createdb -U \"\$POSTGRES_USER\" '$target'"
  docker compose -f "$repo_dir/compose.yml" exec -T postgres sh -c \
    "PGPASSWORD=\"\$POSTGRES_PASSWORD\" pg_restore -U \"\$POSTGRES_USER\" -d '$target' --no-owner --no-acl" \
    < "$root_dir/postgres/$database.dump"
  docker compose -f "$repo_dir/compose.yml" exec -T postgres sh -c \
    "PGPASSWORD=\"\$POSTGRES_PASSWORD\" psql -U \"\$POSTGRES_USER\" -d '$target' -Atc 'SELECT 1'" | grep -qx 1
  echo "Restauration isolée réussie : $database"
done

echo "Test de restauration terminé; les bases temporaires ont été supprimées."

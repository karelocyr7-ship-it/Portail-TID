#!/usr/bin/env bash
set -euo pipefail

create_database() {
  local database="$1"
  local username="$2"
  local password="$3"

  psql --username "$POSTGRES_USER" --dbname postgres \
    --set ON_ERROR_STOP=1 \
    --set database="$database" \
    --set username="$username" \
    --set password="$password" <<'SQL'
SELECT format('CREATE USER %I WITH PASSWORD %L', :'username', :'password')
WHERE NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = :'username')\gexec
SELECT format('CREATE DATABASE %I OWNER %I', :'database', :'username')
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = :'database')\gexec
SQL
}

create_database portal portal_user "$PORTAL_DB_PASSWORD"
create_database keycloak keycloak_user "$KEYCLOAK_DB_PASSWORD"
create_database n8n n8n_user "$N8N_DB_PASSWORD"

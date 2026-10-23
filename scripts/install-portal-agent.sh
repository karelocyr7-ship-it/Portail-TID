#!/usr/bin/env bash
set -Eeuo pipefail

if (( EUID != 0 )); then
  echo "Exécuter avec sudo." >&2
  exit 1
fi

agent_id="${1:-}"
repository_source="${2:-}"
portal_url="${3:-}"
if [[ ! "$agent_id" =~ ^[a-z0-9-]+$ || "$repository_source" != /* || ! -d "$repository_source" ]]; then
  echo "Usage: sudo bash scripts/install-portal-agent.sh <agent-id> <repo-local> <https://portail.tadgroupe.com>" >&2
  exit 2
fi
if [[ ! "$portal_url" =~ ^https://[A-Za-z0-9.-]+(:[0-9]+)?/?$ ]]; then
  echo "L’URL du Portail doit utiliser HTTPS." >&2
  exit 2
fi
command -v codex >/dev/null 2>&1 || { echo "Codex CLI doit être installé." >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js doit être installé." >&2; exit 1; }
command -v git >/dev/null 2>&1 || { echo "Git doit être installé." >&2; exit 1; }
git -C "$repository_source" rev-parse --show-toplevel >/dev/null

case "$agent_id" in
  portal-agent) service_user=tadportal ;;
  supervision-agent) service_user=tadsupervision ;;
  glpi-agent) service_user=tadglpi ;;
  sirh-agent) service_user=tadsirh ;;
  tdb-agent) service_user=tadtdb ;;
  cash-recon-agent) service_user=tadcash ;;
  revue-pdv-agent) service_user=tadpdv ;;
  atf-agent) service_user=tadatf ;;
  gparc-agent) service_user=tadgparc ;;
  mdm-agent) service_user=tadmdm ;;
  recrutement-om-telco-agent) service_user=tadrecrut ;;
  *) echo "Agent non déclaré." >&2; exit 2 ;;
esac
if ! getent passwd "$service_user" >/dev/null; then
  useradd --system --user-group --create-home --home-dir "/var/lib/$service_user" --shell /usr/sbin/nologin "$service_user"
fi
install -d -o root -g root -m 0755 /srv/tad/agents
install -d -o root -g root -m 0711 /srv/tad/agents/repositories /srv/tad/agents/workspaces
install -d -o root -g root -m 0700 /etc/tad-agents

repository="/srv/tad/agents/repositories/$agent_id"
if [[ ! -d "$repository/.git" ]]; then
  if git -C "$repository_source" ls-files --error-unmatch .env >/dev/null 2>&1 || \
     git -C "$repository_source" ls-files | grep -Eqi '(^|/)\.env(\.(local|production|prod|development|dev)(\.|$)|$)|(^|/)secrets?/|\.(pem|key|p12|pfx)$'; then
    echo "Le dépôt contient des chemins sensibles suivis par Git ; arrêt avant clonage." >&2
    exit 1
  fi
  git -c core.hooksPath=/dev/null clone --quiet --depth 1 --no-local "$repository_source" "$repository"
fi
install -d -o "$service_user" -g "$service_user" -m 0750 "$repository" "/srv/tad/agents/workspaces/$agent_id"
chown -R "$service_user:$service_user" "$repository" "/srv/tad/agents/workspaces/$agent_id"

install -o root -g root -m 0644 "$(dirname "$0")/portal-local-agent.mjs" /srv/tad/agents/portal-local-agent.mjs
config_file="/etc/tad-agents/$agent_id.env"
credential_preserved=0
if [[ -e "$config_file" ]]; then
  [[ -f "$config_file" && "$(stat -c '%U:%G:%a' "$config_file")" == "root:root:600" ]] || {
    echo "Fichier d’identifiants existant invalide ; arrêt sans modification." >&2
    exit 1
  }
  credential_preserved=1
else
  token="$(openssl rand -hex 32)"
  token_hash="$(printf '%s' "$token" | sha256sum | cut -d ' ' -f 1)"
  config_tmp="$(mktemp /etc/tad-agents/.${agent_id}.XXXXXX)"
  trap 'rm -f "$config_tmp"' EXIT
  umask 077
  cat >"$config_tmp" <<EOF
PORTAL_AGENT_ID=$agent_id
PORTAL_AGENT_URL=$portal_url/api/agent-runtime
PORTAL_AGENT_REPOSITORY=$repository
PORTAL_AGENT_WORK_ROOT=/srv/tad/agents/workspaces
PORTAL_AGENT_TOKEN=$token
EOF
  install -o root -g root -m 0600 "$config_tmp" "$config_file"
  unset token
fi

install -o root -g root -m 0644 "$(dirname "$0")/../infrastructure/systemd/tad-portal-agent@.service" /etc/systemd/system/tad-portal-agent@.service
dropin="/etc/systemd/system/tad-portal-agent@$agent_id.service.d"
install -d -o root -g root -m 0755 "$dropin"
printf '[Service]\nUser=%s\nGroup=%s\nEnvironment=HOME=/var/lib/%s\nReadWritePaths=/var/lib/%s\n' \
  "$service_user" "$service_user" "$service_user" "$service_user" >"$dropin/identity.conf"
chmod 0644 "$dropin/identity.conf"
systemctl daemon-reload
printf 'Installation préparée pour %s. Jeton conservé dans /etc/tad-agents/%s.env.\n' "$agent_id" "$agent_id"
if (( credential_preserved )); then
  echo 'Identifiants existants préservés ; aucune empreinte n’a changé.'
else
  printf 'Empreinte SHA-256 à enregistrer dans l’administration du Portail : %s\n' "$token_hash"
fi
printf 'Authentifier Codex : sudo -u %s -H codex login\n' "$service_user"
printf 'Après enregistrement de l’empreinte, démarrer : sudo systemctl enable --now tad-portal-agent@%s.service\n' "$agent_id"

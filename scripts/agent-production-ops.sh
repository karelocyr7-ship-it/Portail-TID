#!/usr/bin/env bash
set -Eeuo pipefail

if (( EUID != 0 )); then
  echo 'Exécuter via sudo.' >&2
  exit 1
fi

mode=""
agent_id=""
operation=""
if [[ "${1:-}" == "--verify" ]]; then
  mode=verify
  agent_id="${2:-}"
else
  agent_id="${1:-}"
  operation="${2:-}"
fi

case "$agent_id" in
  portal-agent)
    service_user=tadportal
    containers=(tad-portail-portal-1 tad-portail-mail-worker-1 tad-portail-provisioning-worker-1)
    ;;
  monitoring-agent)
    service_user=tadmonitor
    containers=(grafana prometheus uptime-kuma node-exporter cadvisor)
    ;;
  glpi-agent)
    service_user=tadglpi
    containers=(tad-glpi-glpi-1)
    ;;
  tdb-agent)
    service_user=tadtdb
    containers=(tdb-tid-frontend-1 tdb-tid-backend-1)
    ;;
  cash-recon-agent)
    service_user=tadcash
    containers=(cash-recon-api cash-recon-web cash-recon-sms-relay)
    ;;
  revue-pdv-agent)
    service_user=tadpdv
    containers=(pdv-prod-web pdv-prod-api)
    ;;
  *)
    echo 'Agent sans opérations production configurées.' >&2
    exit 2
    ;;
esac

if [[ "$mode" == verify ]]; then
  for container in "${containers[@]}"; do
    /usr/bin/docker inspect "$container" >/dev/null
  done
  exit 0
fi

if [[ "${SUDO_USER:-}" != "$service_user" ]]; then
  echo 'Compte de service incorrect.' >&2
  exit 1
fi
if [[ "$operation" != STATUS_APP && "$operation" != RESTART_APP ]]; then
  echo 'Opération production non autorisée.' >&2
  exit 2
fi

for container in "${containers[@]}"; do
  /usr/bin/docker inspect "$container" >/dev/null || {
    echo 'Conteneur applicatif attendu absent ; aucune action exécutée.' >&2
    exit 1
  }
done

if [[ "$operation" == RESTART_APP ]]; then
  state_dir=/var/lib/tad-agent-production-ops
  /usr/bin/install -d -o root -g root -m 0755 "$state_dir"
  exec 9>"$state_dir/$agent_id.lock"
  /usr/bin/flock -n 9 || { echo 'Une opération est déjà en cours.' >&2; exit 1; }
  state_file="$state_dir/$agent_id.last"
  now=$(/usr/bin/date +%s)
  if [[ -f "$state_file" ]]; then
    last="$(/usr/bin/cat "$state_file")"
    if [[ "$last" =~ ^[0-9]+$ ]] && (( now - last < 120 )); then
      echo 'Redémarrage limité à un par application toutes les 120 secondes.' >&2
      exit 1
    fi
  fi
  printf '%s\n' "$now" >"$state_file"
  /usr/bin/docker restart --time 10 "${containers[@]}" >/dev/null
fi

for container in "${containers[@]}"; do
  state=""
  for attempt in $(/usr/bin/seq 1 45); do
    state="$(/usr/bin/docker inspect --format '{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container")"
    [[ "$state" == running\|healthy || "$state" == running\|none ]] && break
    [[ "$state" == *\|unhealthy ]] && break
    /usr/bin/sleep 1
  done
  if [[ "$state" != running\|healthy && "$state" != running\|none ]]; then
    echo "État applicatif non sain après l’opération : $container ($state)." >&2
    exit 1
  fi
  printf '%s %s\n' "$container" "$state"
done

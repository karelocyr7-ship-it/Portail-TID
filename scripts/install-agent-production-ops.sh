#!/usr/bin/env bash
set -Eeuo pipefail

if (( EUID != 0 )); then
  echo 'Exécuter avec sudo.' >&2
  exit 1
fi
agent_id="${1:-}"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

case "$agent_id" in
  portal-agent) service_user=tadportal ;;
  monitoring-agent) service_user=tadmonitor ;;
  glpi-agent) service_user=tadglpi ;;
  tdb-agent) service_user=tadtdb ;;
  cash-recon-agent) service_user=tadcash ;;
  revue-pdv-agent) service_user=tadpdv ;;
  *) echo 'Agent sans politique locale d’opérations production.' >&2; exit 2 ;;
esac
getent passwd "$service_user" >/dev/null || { echo 'Compte de service absent.' >&2; exit 1; }
[[ -x /usr/bin/docker ]] || { echo 'Docker CLI absent.' >&2; exit 1; }
"$script_dir/agent-production-ops.sh" --verify "$agent_id"

helper=/usr/local/sbin/tad-agent-production-ops
sudoers="/etc/sudoers.d/tad-agent-production-ops-$agent_id"
dropin="/etc/systemd/system/tad-portal-agent@$agent_id.service.d/production-ops.conf"
for target in "$sudoers" "$dropin"; do
  [[ ! -e "$target" ]] || { echo "Fichier existant, arrêt sans remplacement : $target" >&2; exit 1; }
done

if [[ -e "$helper" ]]; then
  /usr/bin/cmp -s "$script_dir/agent-production-ops.sh" "$helper" || {
    echo 'Helper root existant différent ; arrêt sans remplacement.' >&2
    exit 1
  }
else
  /usr/bin/install -o root -g root -m 0755 "$script_dir/agent-production-ops.sh" "$helper"
fi

sudoers_tmp="$(/usr/bin/mktemp /etc/sudoers.d/.tad-agent-production-ops.XXXXXX)"
trap '/usr/bin/unlink "$sudoers_tmp"' EXIT
printf '%s ALL=(root) NOPASSWD: %s %s STATUS_APP, %s %s RESTART_APP\n' \
  "$service_user" "$helper" "$agent_id" "$helper" "$agent_id" \
  >"$sudoers_tmp"
/usr/bin/chown root:root "$sudoers_tmp"
/usr/bin/chmod 0440 "$sudoers_tmp"
/usr/sbin/visudo -cf "$sudoers_tmp"
/usr/bin/install -o root -g root -m 0440 "$sudoers_tmp" "$sudoers"

/usr/bin/install -d -o root -g root -m 0755 "$(dirname "$dropin")"
 /usr/bin/install -d -o root -g root -m 0755 /var/lib/tad-agent-production-ops
printf '[Service]\nNoNewPrivileges=false\nReadWritePaths=/var/lib/tad-agent-production-ops\n' >"$dropin"
/usr/bin/chown root:root "$dropin"
/usr/bin/chmod 0644 "$dropin"
systemctl daemon-reload
printf 'Opérations locales installées pour %s : STATUS_APP, RESTART_APP.\n' "$agent_id"

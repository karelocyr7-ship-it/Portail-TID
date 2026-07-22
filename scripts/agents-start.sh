#!/usr/bin/env bash
set -euo pipefail

agent_root="${AGENT_ROOT:-/srv/tad/agents}"
state_dir="$agent_root/state"
pid_file="$state_dir/agent.pid"
lock_file="$state_dir/agent.lock"
mkdir -p "$state_dir"
exec 9>"$lock_file"
flock -n 9 || { echo "Un agent est déjà actif."; exit 0; }

if [[ -e "$state_dir/stop-new-tasks" ]]; then
  echo "Prise de nouvelles tâches suspendue."
  exit 0
fi

job="$(find "$agent_root/queue" -maxdepth 1 -type f -name '*.task' -print 2>/dev/null | sort | head -1 || true)"
if [[ -z "$job" ]]; then
  echo "Aucune tâche en attente."
  exit 0
fi

if [[ "${AGENT_ALLOW_RUN:-false}" != "true" ]]; then
  echo "Tâche détectée mais exécution désactivée; définir AGENT_ALLOW_RUN=true après validation."
  exit 0
fi

command -v codex >/dev/null 2>&1 || { echo "Codex CLI introuvable." >&2; exit 1; }
workspace="$agent_root/workspaces/$(basename "$job" .task)"
mkdir -p "$workspace"
echo "$$" > "$pid_file"
cleanup() { rm -f "$pid_file"; }
trap cleanup EXIT

codex exec --sandbox workspace-write --cd "$workspace" "$(<"$job")"

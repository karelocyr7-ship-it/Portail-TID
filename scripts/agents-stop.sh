#!/usr/bin/env bash
set -euo pipefail
agent_root="${AGENT_ROOT:-/srv/tad/agents}"
pid_file="$agent_root/state/agent.pid"
if [[ ! -s "$pid_file" ]]; then
  echo "Aucun agent actif."
  exit 0
fi
pid="$(<"$pid_file")"
if kill -0 "$pid" 2>/dev/null; then
  kill -TERM "$pid"
  echo "Arrêt demandé à l’agent $pid."
else
  rm -f "$pid_file"
  echo "PID d’agent obsolète supprimé."
fi

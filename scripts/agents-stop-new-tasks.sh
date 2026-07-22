#!/usr/bin/env bash
set -euo pipefail
agent_root="${AGENT_ROOT:-/srv/tad/agents}"
mkdir -p "$agent_root/state"
touch "$agent_root/state/stop-new-tasks"
echo "Prise de nouvelles tâches suspendue."

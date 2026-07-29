#!/usr/bin/env bash
set -euo pipefail

agent_root="${AGENT_ROOT:-/srv/tad/agents}"
state_dir="$agent_root/state"

mkdir -p "$state_dir"
rm -f "$state_dir/stop-new-tasks"
echo "Prise de nouvelles tâches réactivée."

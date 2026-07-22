#!/usr/bin/env bash
set -euo pipefail
agent_root="${AGENT_ROOT:-/srv/tad/agents}"
report_dir="$agent_root/results"
mkdir -p "$report_dir"
report="$report_dir/report-$(date +%Y-%m-%d).md"
{
  echo "# Rapport agents Codex — $(date --iso-8601=seconds)"
  echo
  echo "- Tâches en attente : $(find "$agent_root/queue" -maxdepth 1 -type f -name '*.task' 2>/dev/null | wc -l)"
  echo "- Résultats disponibles : $(find "$report_dir" -maxdepth 1 -type f 2>/dev/null | wc -l)"
  if [[ -e "$agent_root/state/stop-new-tasks" ]]; then
    echo "- Nouvelles tâches : suspendues"
  else
    echo "- Nouvelles tâches : ouvertes"
  fi
} > "$report"
chmod 640 "$report"
echo "Rapport créé : $report"

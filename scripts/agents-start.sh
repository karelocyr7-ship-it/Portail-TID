#!/usr/bin/env bash
set -euo pipefail

agent_root="${AGENT_ROOT:-/srv/tad/agents}"
agent_ids=(
  portal-orchestrator
  tdb-agent
  cash-recon-agent
  revue-pdv-agent
  gparc-agent
  mdm-agent
  recrutement-om-telco-agent
  architecture-review-agent
  security-review-agent
  database-review-agent
  test-quality-agent
  deployment-agent
  documentation-agent
)
declare -A repository_by_agent=(
  [tdb-agent]="/srv/tad/agents/repositories/tdb"
  [cash-recon-agent]="/srv/tad/agents/repositories/cash-recon"
  [revue-pdv-agent]="/srv/tad/agents/repositories/revue-pdv"
  [gparc-agent]="/srv/tad/agents/repositories/gparc"
  [mdm-agent]="/srv/tad/agents/repositories/mdm"
  [recrutement-om-telco-agent]="/srv/tad/agents/repositories/recrutement-om-telco"
)
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

job=""
job_agent=""
for candidate in "${agent_ids[@]}"; do
  candidate_job="$(find "$agent_root/queue/$candidate" -maxdepth 1 -type f -name '*.task' -printf '%T@ %p\n' 2>/dev/null | sort -n | head -1 || true)"
  if [[ -n "$candidate_job" ]]; then
    candidate_job="${candidate_job#* }"
    if [[ -z "$job" || "$candidate_job" -ot "$job" ]]; then
      job="$candidate_job"
      job_agent="$candidate"
    fi
  fi
done
if [[ -z "$job" ]]; then
  echo "Aucune tâche en attente."
  exit 0
fi

if [[ "${AGENT_ALLOW_RUN:-false}" != "true" ]]; then
  echo "Tâche détectée mais exécution désactivée; définir AGENT_ALLOW_RUN=true après validation."
  exit 0
fi

command -v codex >/dev/null 2>&1 || { echo "Codex CLI introuvable." >&2; exit 1; }
task_name="$(basename "$job")"
task_content="$(<"$job")"
archive_dir="$agent_root/results/$job_agent/tasks"
mkdir -p "$archive_dir"
mv "$job" "$archive_dir/$task_name"
workspace="$agent_root/workspaces/$job_agent/$(basename "$job" .task)"
result_dir="$agent_root/results/$job_agent"
log_dir="$agent_root/logs/$job_agent"
mkdir -p "$workspace" "$result_dir" "$log_dir"
repository="${repository_by_agent[$job_agent]:-}"
if [[ -n "$repository" && -d "$repository/.git" && -z "$(find "$workspace" -mindepth 1 -print -quit 2>/dev/null)" ]]; then
  git clone --quiet --no-local "$repository" "$workspace"
  git -C "$workspace" checkout -q -b "agent/$job_agent/$(basename "$job" .task)"
fi
echo "$$" > "$pid_file"
cleanup() { rm -f "$pid_file"; }
trap cleanup EXIT

result_file="$result_dir/$(basename "$job" .task).md"
log_file="$log_dir/$(basename "$job" .task).log"
{
  echo "# Rapport — $job_agent"
  echo
  echo "- Tâche : $(basename "$job")"
  echo "- Début : $(date --iso-8601=seconds)"
  echo
  codex exec --skip-git-repo-check --sandbox workspace-write --cd "$workspace" \
    "Tu es l’agent $job_agent. Limite strictement ton travail au périmètre de cette application. Ne déploie rien, ne lis aucun secret et ne modifie aucune base. $task_content"
} > >(tee "$result_file" | tee "$log_file") 2>&1

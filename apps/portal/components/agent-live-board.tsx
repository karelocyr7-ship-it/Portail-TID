"use client";

import { useEffect, useState } from "react";

type Runtime = {
  agentId: string;
  applicationId: string;
  vm: string;
  environment: string;
  status: "EXECUTING" | "QUEUED" | "COMPLETED" | "IDLE";
  task: string | null;
  startedAt: string | null;
  finishedAt: string | null;
};

const labels: Record<Runtime["status"], string> = {
  EXECUTING: "En cours",
  QUEUED: "En file",
  COMPLETED: "Dernière tâche terminée",
  IDLE: "En attente",
};

export function AgentLiveBoard() {
  const [agents, setAgents] = useState<Runtime[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const response = await fetch("/api/admin/agents/runtime", { cache: "no-store" });
      if (!response.ok || !active) return;
      const payload = await response.json();
      setAgents(payload.agents ?? []);
      setUpdatedAt(payload.generatedAt ?? null);
    };
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  return (
    <section className="agent-live-board" aria-label="Suivi temps réel des agents">
      <div className="section-header admin-section-heading">
        <div><p className="eyebrow">Supervision temps réel</p><h2>Agents, VM et applications</h2></div>
        <small>{updatedAt ? `Actualisé à ${new Date(updatedAt).toLocaleTimeString("fr-FR")}` : "Synchronisation…"}</small>
      </div>
      <div className="agent-live-grid">
        {agents.map((agent) => (
          <article className="agent-live-card" key={agent.agentId}>
            <div className="agent-live-card-heading">
              <strong>{agent.applicationId}</strong>
              <span className={`status-pill agent-status-${agent.status.toLowerCase()}`}>{labels[agent.status]}</span>
            </div>
            <p className="muted">{agent.agentId}</p>
            <dl>
              <div><dt>VM</dt><dd>{agent.vm}</dd></div>
              <div><dt>Environnement</dt><dd>{agent.environment}</dd></div>
              <div><dt>Tâche</dt><dd>{agent.task ?? "Aucune"}</dd></div>
              <div><dt>Début</dt><dd>{agent.startedAt ? new Date(agent.startedAt).toLocaleString("fr-FR") : "—"}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

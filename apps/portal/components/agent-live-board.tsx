"use client";

import { useEffect, useState } from "react";

type Runtime = {
  agentId: string;
  applicationId: string;
  vm: string;
  environment: string;
  status: "EXECUTING" | "QUEUED" | "IDLE" | "OFFLINE" | "UNREGISTERED";
  task: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  lastSeenAt: string | null;
};

const labels: Record<Runtime["status"], string> = {
  EXECUTING: "En cours",
  QUEUED: "En file",
  IDLE: "Disponible",
  OFFLINE: "Hors ligne",
  UNREGISTERED: "Non configuré",
};

export function AgentLiveBoard() {
  const [agents, setAgents] = useState<Runtime[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const response = await fetch("/api/admin/agents/runtime", {
        cache: "no-store",
      });
      if (!response.ok || !active) return;
      const payload = await response.json();
      setAgents(payload.agents ?? []);
      setUpdatedAt(payload.generatedAt ?? null);
      setPaused(Boolean(payload.paused));
    };
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <section
      className="agent-live-board"
      aria-label="Suivi temps réel des agents"
    >
      <div className="section-header admin-section-heading">
        <div>
          <p className="eyebrow">Supervision temps réel</p>
          <h2>Agents, VM et applications</h2>
        </div>
        <small>
          {updatedAt
            ? `Actualisé à ${new Date(updatedAt).toLocaleTimeString("fr-FR")}`
            : "Synchronisation…"}
        </small>
      </div>
      {paused ? (
        <p className="agent-runtime-notice">
          Le traitement des anciennes actions de rapport est suspendu. Les
          runners locaux de la nouvelle file continuent à récupérer leurs
          tâches.
        </p>
      ) : null}
      <div className="agent-report-table-wrap">
        <table className="agent-report-table agent-live-table">
          <thead>
            <tr>
              <th scope="col">Application</th>
              <th scope="col">Agent</th>
              <th scope="col">VM</th>
              <th scope="col">Environnement</th>
              <th scope="col">Tâche</th>
              <th scope="col">Début</th>
              <th scope="col">Dernier contact</th>
              <th scope="col">État</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr key={agent.agentId}>
                <td>{agent.applicationId}</td>
                <td>{agent.agentId}</td>
                <td>{agent.vm}</td>
                <td>{agent.environment}</td>
                <td>{agent.task ?? "Aucune"}</td>
                <td>
                  {agent.startedAt
                    ? new Date(agent.startedAt).toLocaleString("fr-FR")
                    : "—"}
                </td>
                <td>
                  {agent.lastSeenAt
                    ? new Date(agent.lastSeenAt).toLocaleString("fr-FR")
                    : "Jamais"}
                </td>
                <td>
                  <span
                    className={`status-pill agent-status-${agent.status.toLowerCase()}`}
                  >
                    {labels[agent.status]}
                  </span>
                </td>
              </tr>
            ))}
            {agents.length === 0 ? (
              <tr>
                <td colSpan={8}>Aucun agent enregistré.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

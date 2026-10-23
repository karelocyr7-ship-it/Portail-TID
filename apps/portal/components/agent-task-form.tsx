"use client";

import { useState } from "react";

type AgentOption = { id: string; name: string };
type Operation = "STATUS_APP" | "RESTART_APP";

export function AgentTaskForm({
  action,
  agents,
  operationsByAgent,
}: {
  action: (formData: FormData) => void | Promise<void>;
  agents: AgentOption[];
  operationsByAgent: Record<string, readonly Operation[]>;
}) {
  const [agentId, setAgentId] = useState(agents[0]?.id ?? "");
  const operations = operationsByAgent[agentId] ?? [];

  return (
    <form action={action} className="agent-report-actions">
      <label>
        Application
        <select
          name="agentId"
          required
          value={agentId}
          onChange={(event) => setAgentId(event.target.value)}
        >
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Opération production
        <select name="productionOperation" defaultValue="NONE">
          <option value="NONE">Aucune — demande de modification</option>
          {operations.map((operation) => (
            <option key={operation} value={operation}>
              {operation === "STATUS_APP"
                ? "Contrôler l’état des services"
                : "Redémarrer les services applicatifs"}
            </option>
          ))}
        </select>
      </label>
      <label>
        Demande ou justification de l’opération
        <textarea name="task" minLength={10} maxLength={8000} required />
      </label>
      <button className="button primary" type="submit">
        Envoyer à l’agent local
      </button>
    </form>
  );
}

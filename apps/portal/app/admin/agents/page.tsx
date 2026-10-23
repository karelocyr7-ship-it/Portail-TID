import Link from "next/link";
import { redirect } from "next/navigation";
import { getRoles, getSession } from "@/lib/oidc";
import { getPrisma } from "@/lib/prisma";
import { getAgentReports } from "@/lib/agent-reports";
import {
  queueAgentTask,
  registerAgentCredential,
  reviewAgentReport,
} from "./actions";
import { AgentLiveBoard } from "@/components/agent-live-board";
import { AgentTaskForm } from "@/components/agent-task-form";
import { AgentReportTable } from "@/components/agent-report-table";
import { agentCatalog } from "@/lib/agents/catalog";
import { productionOperations } from "@/lib/agents/production-operations";

const statusLabels: Record<string, string> = {
  PENDING: "En attente",
  QUEUED: "En file",
  APPROVED: "Approuvée — en file",
  REJECTED: "Refusée",
  EXECUTING: "En cours",
  COMPLETED: "Terminée",
  FAILED: "Échec",
};

const actionStatusLabels: Record<string, string> = {
  QUEUED: "En file",
  EXECUTING: "En cours",
  COMPLETED: "Terminée",
  FAILED: "Échec",
  REJECTED: "Refusée",
};

export default async function AgentReportsPage() {
  const session = await getSession();
  if (!getRoles(session).includes("PORTAL_ADMIN")) redirect("/");
  const reports = await getAgentReports();
  const [tasks, credentials] = await Promise.all([
    getAgentTasks(),
    getAgentCredentials(),
  ]);
  const pending = reports.filter(
    (report) => report.status === "PENDING",
  ).length;
  const actions = reports.flatMap((report) =>
    report.actions.map((action) => ({ ...action, report })),
  );
  const queued = actions.filter((action) => action.status === "QUEUED").length;

  return (
    <div className="page-container admin-page agent-reports-page">
      <section className="admin-hero">
        <div>
          <p className="eyebrow light">Espace administrateur</p>
          <h1>Rapports des agents</h1>
          <p>
            Consultez les propositions, contrôlez leur risque et placez les
            actions approuvées dans la file de l’orchestrateur.
          </p>
        </div>
        <div className="agent-queue-summary" aria-label="État de la file">
          <strong>{queued}</strong>
          <span>actions en file</span>
        </div>
      </section>

      <section className="agent-action-ledger" aria-label="Tâches locales">
        <div className="section-header admin-section-heading">
          <div>
            <p className="eyebrow">Dispatch local sécurisé</p>
            <h2>Demander une modification à un agent d’application</h2>
          </div>
        </div>
        <p>
          La VM applicative récupère la tâche par HTTPS, travaille dans un
          espace isolé et renvoie son rapport au Portail. Les opérations de
          production sont limitées aux commandes explicitement habilitées pour
          chaque runner et sont journalisées.
        </p>
        <AgentTaskForm
          action={queueAgentTask}
          agents={Object.entries(agentCatalog).map(([id, agent]) => ({
            id,
            name: agent.name,
          }))}
          operationsByAgent={productionOperations}
        />
        <details>
          <summary>Runners enregistrés</summary>
          <ul>
            {Object.entries(agentCatalog).map(([agentId, agent]) => {
              const credential = credentials.find(
                (entry) => entry.agentId === agentId,
              );
              return (
                <li key={agentId}>
                  {agent.name} · {credential?.active ? "actif" : "à configurer"}
                  {credential?.lastSeenAt
                    ? ` · vu ${new Intl.DateTimeFormat("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(credential.lastSeenAt)}`
                    : ""}
                </li>
              );
            })}
          </ul>
        </details>
        <details>
          <summary>Enregistrer un runner</summary>
          <p>
            Le runner garde son jeton sur sa VM. Enregistre ici uniquement
            l’empreinte SHA-256 fournie par le script d’installation ; ne colle
            jamais le jeton lui-même.
          </p>
          <form
            action={registerAgentCredential}
            className="agent-report-actions"
          >
            <label>
              Agent
              <select name="agentId" required>
                {Object.entries(agentCatalog).map(([agentId, agent]) => (
                  <option key={agentId} value={agentId}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Empreinte SHA-256
              <input
                name="tokenHash"
                pattern="[A-Fa-f0-9]{64}"
                minLength={64}
                maxLength={64}
                required
              />
            </label>
            <button className="button secondary" type="submit">
              Enregistrer l’empreinte
            </button>
          </form>
        </details>
        <details className="agent-task-history">
          <summary>Historique des 30 dernières tâches ({tasks.length})</summary>
          {tasks.length === 0 ? (
            <p className="empty-state compact-empty">Aucune tâche envoyée.</p>
          ) : (
            <div className="agent-report-table-wrap">
              <table className="agent-report-table agent-action-table">
                <thead>
                  <tr>
                    <th scope="col">Application · agent</th>
                    <th scope="col">Demande / résultat</th>
                    <th scope="col">Opération</th>
                    <th scope="col">Statut</th>
                    <th scope="col">Demandée le</th>
                    <th scope="col">Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td>
                        {task.applicationId} · {task.agentId}
                      </td>
                      <td>{task.summary ?? task.task}</td>
                      <td>
                        {task.productionOperation === "NONE"
                          ? "—"
                          : task.productionOperation}
                      </td>
                      <td>
                        <span
                          className={`status-pill agent-status-${task.status.toLowerCase()}`}
                        >
                          {statusLabels[task.status] ?? task.status}
                        </span>
                      </td>
                      <td>
                        {new Intl.DateTimeFormat("fr-FR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(task.requestedAt)}
                      </td>
                      <td>
                        {task.report ? (
                          <details className="agent-report-row-details">
                            <summary>Voir le rapport</summary>
                            <pre className="agent-report-body">
                              {task.report}
                            </pre>
                          </details>
                        ) : task.workspacePath ? (
                          task.workspacePath
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </details>
      </section>

      <section className="agent-action-ledger" aria-label="Journal des actions">
        <div className="section-header admin-section-heading">
          <div>
            <p className="eyebrow">Orchestrateur</p>
            <h2>Actions validées et exécutées</h2>
          </div>
          <span className="count-badge">{actions.length} actions</span>
        </div>
        {actions.length === 0 ? (
          <p className="empty-state compact-empty">
            Aucune action enregistrée.
          </p>
        ) : (
          <div className="agent-report-table-wrap">
            <table className="agent-report-table agent-action-table">
              <thead>
                <tr>
                  <th scope="col">Application · agent</th>
                  <th scope="col">Rapport</th>
                  <th scope="col">Décision</th>
                  <th scope="col">Statut</th>
                  <th scope="col">Demandée le</th>
                  <th scope="col">Erreur</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((action) => (
                  <tr key={action.id}>
                    <td>
                      {action.report.applicationId} · {action.report.agentId}
                    </td>
                    <td>{action.report.title}</td>
                    <td>
                      {action.action === "APPROVE" ? "Approuver" : "Refuser"}
                    </td>
                    <td>
                      <span
                        className={`status-pill agent-status-${action.status.toLowerCase()}`}
                      >
                        {actionStatusLabels[action.status] ?? action.status}
                      </span>
                    </td>
                    <td>
                      {new Intl.DateTimeFormat("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(action.requestedAt)}
                    </td>
                    <td className="error-text">{action.error ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AgentLiveBoard />

      <div className="agent-report-toolbar" aria-label="Résumé des rapports">
        <span>
          <strong>{reports.length}</strong> rapports reçus
        </span>
        <span>
          <strong>{pending}</strong> à valider
        </span>
        <span>
          <strong>{queued}</strong> actions en file · une exécution simultanée
          maximale
        </span>
      </div>

      {reports.length === 0 ? (
        <section className="empty-state agent-empty-state">
          <h2>Aucun rapport agent reçu</h2>
          <p>
            Les agents pourront déposer ici leurs analyses, preuves, risques et
            propositions après configuration de leurs canaux de rapport.
          </p>
        </section>
      ) : (
        <AgentReportTable
          actionStatusLabels={actionStatusLabels}
          reports={reports.map((report) => ({
            ...report,
            createdAt: report.createdAt.toISOString(),
          }))}
          reviewAction={reviewAgentReport}
          statusLabels={statusLabels}
        />
      )}

      <div className="admin-tool-strip">
        <div>
          <p className="eyebrow">Orchestration</p>
          <h2>File contrôlée</h2>
          <p className="muted">
            Aucune action approuvée n’est exécutée par cette page.
          </p>
        </div>
        <Link className="button secondary" href="/admin">
          Retour à l’administration
        </Link>
      </div>
    </div>
  );
}

async function getAgentTasks() {
  return getPrisma().agentTask.findMany({
    orderBy: { requestedAt: "desc" },
    take: 30,
  });
}

async function getAgentCredentials() {
  return getPrisma().agentCredential.findMany({
    select: { agentId: true, active: true, lastSeenAt: true },
  });
}

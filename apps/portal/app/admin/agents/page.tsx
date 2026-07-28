import Link from "next/link";
import { redirect } from "next/navigation";
import { getRoles, getSession } from "@/lib/oidc";
import {
  dispatchQueuedAgentActions,
  getAgentReports,
  syncAgentReports,
  syncAgentActionStatuses,
} from "@/lib/agent-reports";
import { reviewAgentReport } from "./actions";

const statusLabels: Record<string, string> = {
  PENDING: "En attente",
  APPROVED: "Approuvée — en file",
  REJECTED: "Refusée",
  EXECUTING: "En cours",
  COMPLETED: "Terminée",
  FAILED: "Échec",
};

export default async function AgentReportsPage() {
  const session = await getSession();
  if (!getRoles(session).includes("PORTAL_ADMIN")) redirect("/");
  await syncAgentReports();
  await dispatchQueuedAgentActions();
  await syncAgentActionStatuses();
  const reports = await getAgentReports();
  const pending = reports.filter(
    (report) => report.status === "PENDING",
  ).length;
  const queued = reports.filter(
    (report) => report.status === "APPROVED",
  ).length;

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

      <section
        className="agent-report-toolbar"
        aria-label="Résumé des rapports"
      >
        <div>
          <strong>{reports.length}</strong>
          <span>rapports reçus</span>
        </div>
        <div>
          <strong>{pending}</strong>
          <span>à valider</span>
        </div>
        <div>
          <strong>1</strong>
          <span>action simultanée maximale</span>
        </div>
        <p>
          Une validation ne déclenche pas une commande distante : elle crée
          uniquement une action <code>QUEUED</code> traitée par l’orchestrateur.
        </p>
      </section>

      {reports.length === 0 ? (
        <section className="empty-state agent-empty-state">
          <h2>Aucun rapport agent reçu</h2>
          <p>
            Les agents pourront déposer ici leurs analyses, preuves, risques et
            propositions après configuration de leurs canaux de rapport.
          </p>
        </section>
      ) : (
        <section className="agent-report-list" aria-label="Rapports agents">
          {reports.map((report) => (
            <article className="agent-report-card" key={report.id}>
              <div className="agent-report-heading">
                <div>
                  <p className="eyebrow">
                    {report.applicationId} · {report.agentId}
                  </p>
                  <h2>{report.title}</h2>
                  <p className="muted">
                    Tâche {report.taskId} · Risque niveau {report.riskLevel}
                  </p>
                </div>
                <span
                  className={`status-pill agent-status-${report.status.toLowerCase()}`}
                >
                  {statusLabels[report.status] ?? report.status}
                </span>
              </div>
              <p>{report.summary}</p>
              <details>
                <summary>Afficher le rapport et les preuves</summary>
                <pre className="agent-report-body">{report.reportBody}</pre>
                {report.evidence ? (
                  <pre className="agent-report-evidence">
                    {JSON.stringify(report.evidence, null, 2)}
                  </pre>
                ) : null}
              </details>
              {report.proposal ? (
                <details>
                  <summary>Proposition d’action</summary>
                  <pre className="agent-report-evidence">
                    {JSON.stringify(report.proposal, null, 2)}
                  </pre>
                </details>
              ) : null}
              {report.status === "PENDING" ? (
                <div className="agent-report-actions">
                  <form action={reviewAgentReport}>
                    <input type="hidden" name="reportId" value={report.id} />
                    <input type="hidden" name="decision" value="APPROVE" />
                    <button className="button primary" type="submit">
                      Valider et mettre en file
                    </button>
                  </form>
                  <form action={reviewAgentReport}>
                    <input type="hidden" name="reportId" value={report.id} />
                    <input type="hidden" name="decision" value="REJECT" />
                    <button className="button secondary" type="submit">
                      Refuser la proposition
                    </button>
                  </form>
                </div>
              ) : null}
              {report.actions.length > 0 ? (
                <p className="agent-report-history">
                  Dernière décision : {report.actions[0].action} ·{" "}
                  {report.actions[0].status}
                </p>
              ) : null}
            </article>
          ))}
        </section>
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

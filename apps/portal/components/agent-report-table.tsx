"use client";

import { useMemo, useState } from "react";

type Report = {
  id: string;
  applicationId: string;
  agentId: string;
  title: string;
  taskId: string;
  riskLevel: number;
  status: string;
  summary: string;
  reportBody: string;
  evidence: unknown;
  proposal: unknown;
  createdAt: string;
  actions: { action: string; status: string }[];
};

type SortKey =
  | "applicationId"
  | "agentId"
  | "title"
  | "taskId"
  | "riskLevel"
  | "status"
  | "createdAt"
  | "lastAction";

type Props = {
  reports: Report[];
  reviewAction: (formData: FormData) => void | Promise<void>;
  statusLabels: Record<string, string>;
  actionStatusLabels: Record<string, string>;
};

const sortLabels: Record<SortKey, string> = {
  applicationId: "Application",
  agentId: "Agent",
  title: "Titre",
  taskId: "Tâche",
  riskLevel: "Risque",
  status: "Statut",
  createdAt: "Reçu le",
  lastAction: "Dernière décision",
};

function displayAction(report: Report, labels: Record<string, string>) {
  const action = report.actions[0];
  if (!action) return "—";
  return `${action.action === "APPROVE" ? "Approuvée" : "Refusée"} · ${labels[action.status] ?? action.status}`;
}

function compareReports(a: Report, b: Report, key: SortKey) {
  if (key === "riskLevel") return a.riskLevel - b.riskLevel;
  if (key === "createdAt")
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  if (key === "lastAction")
    return displayAction(a, {}).localeCompare(displayAction(b, {}), "fr");
  return a[key].localeCompare(b[key], "fr", { sensitivity: "base" });
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function jsonText(value: unknown) {
  if (value === null || value === undefined) return null;
  return JSON.stringify(value, null, 2) ?? null;
}

export function AgentReportTable({
  reports,
  reviewAction,
  statusLabels,
  actionStatusLabels,
}: Props) {
  const [query, setQuery] = useState("");
  const [application, setApplication] = useState("");
  const [agent, setAgent] = useState("");
  const [status, setStatus] = useState("");
  const [risk, setRisk] = useState("");
  const [decision, setDecision] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const applications = useMemo(
    () =>
      [...new Set(reports.map((report) => report.applicationId))].sort((a, b) =>
        a.localeCompare(b, "fr"),
      ),
    [reports],
  );
  const agents = useMemo(
    () =>
      [...new Set(reports.map((report) => report.agentId))].sort((a, b) =>
        a.localeCompare(b, "fr"),
      ),
    [reports],
  );
  const statuses = useMemo(
    () => [...new Set(reports.map((report) => report.status))].sort(),
    [reports],
  );
  const risks = useMemo(
    () =>
      [...new Set(reports.map((report) => report.riskLevel))].sort(
        (a, b) => a - b,
      ),
    [reports],
  );

  const visibleReports = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("fr");
    return reports
      .filter((report) => {
        const createdAt = new Date(report.createdAt).toISOString().slice(0, 10);
        const searchable = [
          report.applicationId,
          report.agentId,
          report.title,
          report.taskId,
          report.summary,
          report.reportBody,
          JSON.stringify(report.evidence ?? ""),
          JSON.stringify(report.proposal ?? ""),
          report.status,
          String(report.riskLevel),
        ]
          .join(" ")
          .toLocaleLowerCase("fr");
        return (
          (!normalizedQuery || searchable.includes(normalizedQuery)) &&
          (!application || report.applicationId === application) &&
          (!agent || report.agentId === agent) &&
          (!status || report.status === status) &&
          (risk === "" || report.riskLevel === Number(risk)) &&
          (!decision || (report.actions[0]?.action ?? "NONE") === decision) &&
          (!fromDate || createdAt >= fromDate) &&
          (!toDate || createdAt <= toDate)
        );
      })
      .sort(
        (a, b) =>
          (sortDirection === "asc" ? 1 : -1) * compareReports(a, b, sortKey),
      );
  }, [
    reports,
    query,
    application,
    agent,
    status,
    risk,
    decision,
    fromDate,
    toDate,
    sortKey,
    sortDirection,
  ]);

  function sortBy(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection(key === "createdAt" ? "desc" : "asc");
    }
  }

  function sortHeader(key: SortKey) {
    const active = sortKey === key;
    const ariaSort = active
      ? sortDirection === "asc"
        ? "ascending"
        : "descending"
      : "none";
    return (
      <th aria-sort={ariaSort} key={key} scope="col">
        <button
          className="agent-table-sort"
          onClick={() => sortBy(key)}
          type="button"
        >
          {sortLabels[key]}
          <span aria-hidden="true">
            {active ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
          </span>
        </button>
      </th>
    );
  }

  const clearFilters = () => {
    setQuery("");
    setApplication("");
    setAgent("");
    setStatus("");
    setRisk("");
    setDecision("");
    setFromDate("");
    setToDate("");
  };

  return (
    <section
      className="agent-report-table-section"
      aria-label="Rapports des agents"
    >
      <div className="agent-report-filters">
        <label className="agent-report-search">
          Recherche
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Application, agent, tâche, contenu…"
            type="search"
            value={query}
          />
        </label>
        <label>
          Application
          <select
            onChange={(event) => setApplication(event.target.value)}
            value={application}
          >
            <option value="">Toutes</option>
            {applications.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          Agent
          <select
            onChange={(event) => setAgent(event.target.value)}
            value={agent}
          >
            <option value="">Tous</option>
            {agents.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          Statut
          <select
            onChange={(event) => setStatus(event.target.value)}
            value={status}
          >
            <option value="">Tous</option>
            {statuses.map((value) => (
              <option key={value} value={value}>
                {statusLabels[value] ?? value}
              </option>
            ))}
          </select>
        </label>
        <label>
          Risque
          <select
            onChange={(event) => setRisk(event.target.value)}
            value={risk}
          >
            <option value="">Tous</option>
            {risks.map((value) => (
              <option key={value} value={value}>
                Niveau {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          Décision
          <select
            onChange={(event) => setDecision(event.target.value)}
            value={decision}
          >
            <option value="">Toutes</option>
            <option value="NONE">Sans décision</option>
            <option value="APPROVE">Approuvée</option>
            <option value="REJECT">Refusée</option>
          </select>
        </label>
        <label>
          Du
          <input
            onChange={(event) => setFromDate(event.target.value)}
            type="date"
            value={fromDate}
          />
        </label>
        <label>
          Au
          <input
            onChange={(event) => setToDate(event.target.value)}
            type="date"
            value={toDate}
          />
        </label>
        <button
          className="button secondary agent-report-reset"
          onClick={clearFilters}
          type="button"
        >
          Effacer les filtres
        </button>
      </div>

      <div className="agent-report-table-meta" aria-live="polite">
        {visibleReports.length} rapport{visibleReports.length > 1 ? "s" : ""}{" "}
        affiché{visibleReports.length > 1 ? "s" : ""} sur {reports.length}
      </div>

      <div className="agent-report-table-wrap">
        <table className="agent-report-table">
          <thead>
            <tr>
              {(
                [
                  "applicationId",
                  "agentId",
                  "title",
                  "taskId",
                  "riskLevel",
                  "status",
                  "createdAt",
                  "lastAction",
                ] as SortKey[]
              ).map(sortHeader)}
              <th scope="col">Détails</th>
              <th scope="col">Décision</th>
            </tr>
          </thead>
          <tbody>
            {visibleReports.map((report) => {
              const evidence = jsonText(report.evidence);
              const proposal = jsonText(report.proposal);
              return (
                <tr key={report.id}>
                  <td>{report.applicationId}</td>
                  <td>{report.agentId}</td>
                  <td className="agent-report-title-cell">{report.title}</td>
                  <td>{report.taskId}</td>
                  <td>{report.riskLevel}</td>
                  <td>
                    <span
                      className={`status-pill agent-status-${report.status.toLowerCase()}`}
                    >
                      {statusLabels[report.status] ?? report.status}
                    </span>
                  </td>
                  <td>{formatDate(report.createdAt)}</td>
                  <td>{displayAction(report, actionStatusLabels)}</td>
                  <td>
                    <details className="agent-report-row-details">
                      <summary>Ouvrir</summary>
                      <p>{report.summary}</p>
                      <pre className="agent-report-body">
                        {report.reportBody}
                      </pre>
                      {evidence ? (
                        <pre className="agent-report-evidence">{evidence}</pre>
                      ) : null}
                      {proposal ? (
                        <pre className="agent-report-evidence">{proposal}</pre>
                      ) : null}
                    </details>
                  </td>
                  <td>
                    {report.status === "PENDING" ? (
                      <div className="agent-table-decisions">
                        <form action={reviewAction}>
                          <input
                            name="reportId"
                            type="hidden"
                            value={report.id}
                          />
                          <input
                            name="decision"
                            type="hidden"
                            value="APPROVE"
                          />
                          <button className="button primary" type="submit">
                            Valider
                          </button>
                        </form>
                        <form action={reviewAction}>
                          <input
                            name="reportId"
                            type="hidden"
                            value={report.id}
                          />
                          <input name="decision" type="hidden" value="REJECT" />
                          <button className="button secondary" type="submit">
                            Refuser
                          </button>
                        </form>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
            {visibleReports.length === 0 ? (
              <tr>
                <td className="agent-report-no-results" colSpan={10}>
                  Aucun rapport ne correspond aux filtres.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

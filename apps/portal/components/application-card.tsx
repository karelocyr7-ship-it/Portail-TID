import type { CatalogApplication } from "@/lib/catalog";

export function ApplicationCard({
  application,
}: {
  application: CatalogApplication;
}) {
  return (
    <article className="application-card">
      <div className="application-icon" aria-hidden="true">
        {application.icon}
      </div>
      <div className="application-card-content">
        <div className="card-heading">
          <div>
            <p className="eyebrow">{application.category}</p>
            <h3>{application.name}</h3>
          </div>
          <span className="integration-badge">
            Niveau {application.integrationLevel}
          </span>
        </div>
        <p className="muted">{application.description}</p>
        {application.maintenance && (
          <p className="maintenance">
            {application.maintenanceMessage ?? "Maintenance en cours"}
          </p>
        )}
        {application.url ? (
          <a className="button secondary" href={application.url}>
            Ouvrir l’application
          </a>
        ) : (
          <span className="button secondary" aria-disabled="true">
            URL à configurer
          </span>
        )}
      </div>
    </article>
  );
}

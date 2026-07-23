import Image from "next/image";
import type { CatalogApplication } from "@/lib/catalog";
import { getApplicationIconPath } from "@/lib/application-icons";

export function ApplicationCard({
  application,
}: {
  application: CatalogApplication;
}) {
  return (
    <article className="application-card">
      <div className="application-icon">
        {getApplicationIconPath(application.code) ? (
          <Image
            className="application-icon-image"
            src={getApplicationIconPath(application.code)!}
            alt={`${application.name} logo`}
            width={64}
            height={64}
          />
        ) : (
          <span aria-hidden="true">{application.icon}</span>
        )}
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

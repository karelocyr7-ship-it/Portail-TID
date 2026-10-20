import Image from "next/image";
import type { CatalogApplication } from "@/lib/catalog";
import { getApplicationIconPath } from "@/lib/application-icons";

export function ApplicationCard({
  application,
}: {
  application: CatalogApplication;
}) {
  const iconPath = getApplicationIconPath(application.code);

  return (
    <article className="application-card">
      <div className="application-card-main">
        <div className="application-icon">
          {iconPath ? (
            <Image
              className="application-icon-image"
              src={iconPath}
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
      </div>
      {application.url ? (
        <a className="application-card-mobile" href={application.url}>
          <span className="application-card-mobile-icon">
            {iconPath ? (
              <Image
                className="application-card-mobile-image"
                src={iconPath}
                alt=""
                width={64}
                height={64}
              />
            ) : (
              <span aria-hidden="true">{application.icon}</span>
            )}
          </span>
          <span className="application-card-mobile-title">
            {application.name}
          </span>
        </a>
      ) : (
        <span
          className="application-card-mobile is-disabled"
          aria-disabled="true"
        >
          <span className="application-card-mobile-icon">
            {iconPath ? (
              <Image
                className="application-card-mobile-image"
                src={iconPath}
                alt=""
                width={64}
                height={64}
              />
            ) : (
              <span aria-hidden="true">{application.icon}</span>
            )}
          </span>
          <span className="application-card-mobile-title">
            {application.name}
          </span>
        </span>
      )}
    </article>
  );
}

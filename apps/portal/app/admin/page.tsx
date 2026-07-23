import Link from "next/link";
import { getVisibleApplicationsFromDatabase } from "@/lib/catalog-db";
import { getRoles, getSession } from "@/lib/oidc";

export default async function AdminPage() {
  const session = await getSession();
  const isAdmin = getRoles(session).includes("PORTAL_ADMIN");
  if (!isAdmin) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p className="eyebrow">Accès contrôlé</p>
          <h1>Accès refusé</h1>
          <p>
            Votre session ne possède pas le rôle d’administration du portail.
          </p>
          <Link className="button secondary" href="/">
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  }

  const applications = await getVisibleApplicationsFromDatabase([
    "PORTAL_ADMIN",
  ]);
  const categories = new Set(
    applications.map((application) => application.category),
  );
  const roles = new Set(
    applications.flatMap((application) => application.roles),
  );

  return (
    <div className="page-container">
      <section className="admin-hero">
        <div>
          <p className="eyebrow light">Espace administrateur</p>
          <h1>Le portail, en un coup d’œil.</h1>
          <p>
            Pilotez les applications disponibles, leurs accès et leur état
            depuis un espace centralisé.
          </p>
        </div>
        <div className="admin-hero-mark" aria-hidden="true">
          ✦
        </div>
      </section>

      <section className="admin-stat-grid" aria-label="Vue d’ensemble">
        <div className="admin-stat-card">
          <span className="admin-stat-icon">▦</span>
          <span>
            <strong>{applications.length}</strong>
            <small>Applications actives</small>
          </span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-icon orange">◈</span>
          <span>
            <strong>{categories.size}</strong>
            <small>Domaines métiers</small>
          </span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-icon">♙</span>
          <span>
            <strong>{roles.size}</strong>
            <small>Rôles configurés</small>
          </span>
        </div>
      </section>

      <div className="section-header admin-section-heading">
        <div>
          <p className="eyebrow">Catalogue central</p>
          <h2>Applications et accès</h2>
        </div>
        <span className="count-badge">PORTAL_ADMIN</span>
      </div>

      <section className="admin-app-grid" aria-label="Applications du portail">
        {applications.map((application) => (
          <article className="admin-app-card" key={application.code}>
            <div className="admin-app-card-top">
              <span className="admin-app-icon" aria-hidden="true">
                {application.icon}
              </span>
              <span className="status-pill">
                {application.maintenance ? "Maintenance" : "Active"}
              </span>
            </div>
            <p className="eyebrow">{application.category}</p>
            <h3>{application.name}</h3>
            <p className="muted">{application.description}</p>
            <div
              className="role-list"
              aria-label={`Rôles de ${application.name}`}
            >
              {application.roles.map((role) => (
                <span className="role-chip" key={role}>
                  {role}
                </span>
              ))}
            </div>
            {application.url ? (
              <a
                className="button secondary admin-app-link"
                href={application.url}
              >
                Ouvrir l’application <span aria-hidden="true">↗</span>
              </a>
            ) : (
              <span className="admin-app-unavailable">URL à configurer</span>
            )}
          </article>
        ))}
      </section>

      <section
        className="admin-tool-strip"
        aria-label="Fonctions d’administration"
      >
        <div>
          <p className="eyebrow">Prochaines fonctions</p>
          <h2>Rôles, accès et audit</h2>
          <p className="muted">
            Les contrôles détaillés seront ajoutés dans les prochaines étapes.
          </p>
        </div>
        <Link className="button secondary" href="/">
          Retour au tableau de bord
        </Link>
      </section>
    </div>
  );
}

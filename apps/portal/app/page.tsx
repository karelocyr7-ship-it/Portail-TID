import { ApplicationCard } from "@/components/application-card";
import { getVisibleApplicationsFromDatabase } from "@/lib/catalog-db";
import { getRoles, getSession } from "@/lib/oidc";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/api/auth/login");

  const roles = getRoles(session);
  const applications = await getVisibleApplicationsFromDatabase(roles);

  return (
    <div className="page-container">
      <section className="hero-panel">
        <div>
          <p className="eyebrow light">Bienvenue sur votre portail</p>
          <h1>
            Bonjour, {session?.name ?? session?.username ?? "utilisateur"}
          </h1>
          <p>
            Retrouvez rapidement les applications et outils autorisés pour votre
            activité.
          </p>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <span>✦</span>
          <span>+</span>
          <span>⌁</span>
        </div>
      </section>

      <section className="section-header" id="applications">
        <div>
          <p className="eyebrow">Accès personnalisés</p>
          <h2>Vos applications</h2>
        </div>
        <span className="count-badge">{applications.length} disponibles</span>
      </section>

      {applications.length === 0 ? (
        <div className="empty-state">
          <h2>Aucune application disponible</h2>
          <p>Votre compte ne possède pas encore de rôle applicatif.</p>
        </div>
      ) : (
        <div className="application-grid">
          {applications.map((application) => (
            <ApplicationCard key={application.code} application={application} />
          ))}
        </div>
      )}

      <section className="notice-panel">
        <div className="notice-icon">i</div>
        <div>
          <strong>Besoin d’aide ?</strong>
          <p>
            Contactez l’administrateur du portail pour demander l’accès à une
            application.
          </p>
        </div>
      </section>
    </div>
  );
}

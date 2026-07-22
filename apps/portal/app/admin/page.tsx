import Link from "next/link";
import { getDevelopmentRoles } from "@/lib/catalog";

export default function AdminPage() {
  const isAdmin = getDevelopmentRoles().includes("PORTAL_ADMIN");
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
  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Gérer le catalogue</h1>
        </div>
      </div>
      <div className="admin-grid">
        <div className="admin-card">
          <strong>Applications</strong>
          <p>Activer, désactiver et classer les entrées du catalogue.</p>
        </div>
        <div className="admin-card">
          <strong>Rôles et accès</strong>
          <p>Associer les rôles Keycloak aux applications.</p>
        </div>
        <div className="admin-card">
          <strong>Journal d’audit</strong>
          <p>Consulter les actions administratives enregistrées.</p>
        </div>
      </div>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import { getAdminApplications } from "@/lib/catalog-db";
import { getAdminProfiles, getAdminUsers } from "@/lib/portal-users";
import { getRoles, getSession } from "@/lib/oidc";
import { getApplicationIconPath } from "@/lib/application-icons";
import { UserDirectory } from "@/components/user-directory";
import {
  savePortalUser,
  updateApplicationStatus,
  updateApplicationUrl,
} from "./actions";

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

  const applications = await getAdminApplications();
  const profiles = await getAdminProfiles();
  const users = await getAdminUsers();
  const categories = new Set(
    applications.map((application) => application.category),
  );
  const roles = new Set(
    applications.flatMap((application) => application.roles),
  );
  const activeUsers = users.filter((user) => user.active).length;

  return (
    <div className="page-container">
      <section className="admin-hero">
        <div>
          <p className="eyebrow light">Espace administrateur</p>
          <h1>Utilisateurs, accès et applications.</h1>
          <p>
            Gérez les comptes Keycloak, les profils autorisés et le catalogue
            métier depuis un espace centralisé.
          </p>
        </div>
        <div className="admin-hero-mark" aria-hidden="true">
          <Image
            src="/branding/tid-logo.png"
            alt="TID"
            width={216}
            height={87}
          />
        </div>
      </section>

      <section className="admin-stat-grid" aria-label="Vue d’ensemble">
        <div className="admin-stat-card">
          <span className="admin-stat-icon">▦</span>
          <span>
            <strong>{applications.length}</strong>
            <small>Applications référencées</small>
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
        <div className="admin-stat-card">
          <span className="admin-stat-icon orange">♙</span>
          <span>
            <strong>{activeUsers}</strong>
            <small>Comptes actifs</small>
          </span>
        </div>
      </section>

      <div className="section-header admin-section-heading" id="catalogue">
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
                {getApplicationIconPath(application.code) ? (
                  <Image
                    src={getApplicationIconPath(application.code)!}
                    alt=""
                    width={56}
                    height={56}
                  />
                ) : (
                  application.icon
                )}
              </span>
              <span className="status-pill">
                {!application.active
                  ? "Désactivée"
                  : application.maintenance
                    ? "Maintenance"
                    : "Active"}
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
            <div className="admin-actions">
              <form action={updateApplicationStatus}>
                <input type="hidden" name="code" value={application.code} />
                <input type="hidden" name="action" value="toggle-active" />
                <button className="button secondary" type="submit">
                  {application.active ? "Désactiver" : "Activer"}
                </button>
              </form>
              <form action={updateApplicationStatus}>
                <input type="hidden" name="code" value={application.code} />
                <input type="hidden" name="action" value="toggle-maintenance" />
                <button className="button secondary" type="submit">
                  {application.maintenance ? "Fin maintenance" : "Maintenance"}
                </button>
              </form>
            </div>
            <form className="admin-url-form" action={updateApplicationUrl}>
              <input type="hidden" name="code" value={application.code} />
              <label htmlFor={`url-${application.code}`}>
                URL de l’application
              </label>
              <div className="admin-url-row">
                <input
                  id={`url-${application.code}`}
                  name="url"
                  type="url"
                  inputMode="url"
                  placeholder="https://..."
                  defaultValue={application.url ?? ""}
                  maxLength={2048}
                />
                <button className="button primary" type="submit">
                  Enregistrer
                </button>
              </div>
            </form>
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

      <section className="admin-users-section" id="comptes">
        <div className="section-header admin-section-heading">
          <div>
            <p className="eyebrow">Habilitations</p>
            <h2>Comptes et profils applicatifs</h2>
          </div>
          <span className="count-badge">{profiles.length} profils</span>
        </div>
        <p className="section-intro">
          Associez une identité Keycloak aux profils réels déclarés par chaque
          application. Aucun mot de passe n’est enregistré dans le portail.
        </p>

        <UserDirectory
          users={users.map((user) => ({
            id: user.id,
            displayName: user.displayName,
            email: user.email,
            active: user.active,
            profileCount: user.assignments.length,
          }))}
        />

        <form className="user-editor" action={savePortalUser}>
          <div className="user-editor-heading">
            <div>
              <p className="eyebrow">Nouveau compte</p>
              <h3>Ajouter une habilitation</h3>
            </div>
            <span className="source-note">Source : identité Keycloak</span>
          </div>
          <div className="user-fields">
            <label>
              Nom affiché
              <input name="displayName" required maxLength={160} />
            </label>
            <label>
              E-mail de référence
              <input name="email" type="email" maxLength={320} />
            </label>
            <label className="field-wide">
              Identifiant Keycloak (sub)
              <input name="keycloakSubject" required maxLength={200} />
            </label>
          </div>
          <ProfilePicker profiles={profiles} />
          <div className="user-editor-footer">
            <label className="check-label">
              <input type="checkbox" name="active" defaultChecked /> Compte
              actif
            </label>
            <button className="button primary" type="submit">
              Enregistrer le compte
            </button>
          </div>
        </form>

        <div className="user-list" aria-label="Comptes portail">
          {users.length === 0 ? (
            <div className="empty-state compact-empty">
              <h3>Aucun compte administré</h3>
              <p>Ajoutez une identité Keycloak pour gérer ses accès.</p>
            </div>
          ) : (
            users.map((user) => (
              <form
                className="user-editor user-editor-existing"
                action={savePortalUser}
                key={user.id}
                id={`user-${user.id}`}
              >
                <input type="hidden" name="userId" value={user.id} />
                <div className="user-editor-heading">
                  <div>
                    <p className="eyebrow">Compte portail</p>
                    <h3>{user.displayName}</h3>
                    <p className="user-meta">
                      {user.email ?? "E-mail non renseigné"} ·{" "}
                      {user.keycloakSubject}
                    </p>
                  </div>
                  <span
                    className={
                      user.active ? "status-pill" : "status-pill inactive"
                    }
                  >
                    {user.active ? "Actif" : "Désactivé"}
                  </span>
                </div>
                <div className="user-fields">
                  <label>
                    Nom affiché
                    <input
                      name="displayName"
                      required
                      maxLength={160}
                      defaultValue={user.displayName}
                    />
                  </label>
                  <label>
                    E-mail de référence
                    <input
                      name="email"
                      type="email"
                      maxLength={320}
                      defaultValue={user.email ?? ""}
                    />
                  </label>
                  <label className="field-wide">
                    Identifiant Keycloak (sub)
                    <input
                      name="keycloakSubject"
                      required
                      maxLength={200}
                      defaultValue={user.keycloakSubject}
                    />
                  </label>
                </div>
                <ProfilePicker
                  profiles={profiles}
                  selected={
                    new Set(user.assignments.map(({ profileId }) => profileId))
                  }
                />
                <div className="user-editor-footer">
                  <label className="check-label">
                    <input
                      type="checkbox"
                      name="active"
                      defaultChecked={user.active}
                    />{" "}
                    Compte actif
                  </label>
                  <button className="button primary" type="submit">
                    Enregistrer les accès
                  </button>
                </div>
              </form>
            ))
          )}
        </div>
      </section>

      <section
        className="admin-tool-strip"
        aria-label="Fonctions d’administration"
      >
        <div>
          <p className="eyebrow">Actions disponibles</p>
          <h2>Pilotage du catalogue</h2>
          <p className="muted">
            Activez une application ou signalez sa mise en maintenance. Chaque
            action est enregistrée dans l’audit du portail.
          </p>
        </div>
        <Link className="button secondary" href="/">
          Retour au tableau de bord
        </Link>
      </section>
    </div>
  );
}

function ProfilePicker({
  profiles,
  selected = new Set<string>(),
}: {
  profiles: Awaited<ReturnType<typeof getAdminProfiles>>;
  selected?: Set<string>;
}) {
  const groups = profiles.reduce<Map<string, typeof profiles>>(
    (map, profile) => {
      const current = map.get(profile.applicationId) ?? [];
      current.push(profile);
      map.set(profile.applicationId, current);
      return map;
    },
    new Map(),
  );

  return (
    <fieldset className="profile-picker">
      <legend>Applications et profils autorisés</legend>
      <p className="field-help">
        Profils récupérés depuis les dépôts applicatifs ; le portail ne copie
        jamais les comptes ni les mots de passe des applications.
      </p>
      <div className="profile-groups">
        {[...groups.values()].map((applicationProfiles) => (
          <div
            className="profile-group"
            key={applicationProfiles[0].applicationId}
          >
            <strong>{applicationProfiles[0].application.name}</strong>
            <small className="profile-source">
              Source : {applicationProfiles[0].sourceSystem} · synchronisé le{" "}
              {applicationProfiles[0].syncedAt
                ? new Intl.DateTimeFormat("fr-FR", {
                    dateStyle: "medium",
                  }).format(applicationProfiles[0].syncedAt)
                : "non synchronisé"}
            </small>
            <div className="profile-options">
              {applicationProfiles.map((profile) => (
                <label className="profile-option" key={profile.id}>
                  <input
                    type="checkbox"
                    name="profileIds"
                    value={profile.id}
                    defaultChecked={selected.has(profile.id)}
                  />
                  <span>
                    <b>{profile.name}</b>
                    <small>{profile.key}</small>
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

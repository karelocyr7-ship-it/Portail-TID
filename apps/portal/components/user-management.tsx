"use client";

import { useMemo, useState } from "react";

export type UserManagementProfile = {
  id: string;
  name: string;
  key: string;
  applicationId: string;
  applicationName: string;
};

export type UserManagementUser = {
  id: string;
  displayName: string;
  email: string | null;
  employeeId: string | null;
  keycloakSubject: string;
  active: boolean;
  profileIds: string[];
};

type ServerAction = (formData: FormData) => Promise<void>;

export function UserManagement({
  users,
  savePortalUser,
  deletePortalUser,
}: {
  users: UserManagementUser[];
  savePortalUser: ServerAction;
  deletePortalUser: ServerAction;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [modal, setModal] = useState<"create" | UserManagementUser | null>(
    null,
  );
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const matchesQuery =
          !normalizedQuery ||
          `${user.displayName} ${user.email ?? ""}`
            .toLocaleLowerCase()
            .includes(normalizedQuery);
        const matchesStatus =
          status === "all" ||
          (status === "active" ? user.active : !user.active);
        return matchesQuery && matchesStatus;
      }),
    [normalizedQuery, status, users],
  );

  return (
    <div className="user-management">
      <div className="user-management-toolbar">
        <div>
          <p className="eyebrow">Répertoire</p>
          <h3>Utilisateurs du portail</h3>
          <p className="field-help">
            Gérez les comptes et leurs accès aux applications depuis un seul
            écran.
          </p>
        </div>
        <button
          className="button primary user-add-button"
          type="button"
          onClick={() => setModal("create")}
          aria-label="Ajouter un utilisateur"
        >
          <span aria-hidden="true">＋</span> Ajouter
        </button>
      </div>

      <div className="user-table-tools">
        <label className="directory-search">
          <span>Rechercher</span>
          <input
            type="search"
            placeholder="Nom ou e-mail…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="directory-filters" aria-label="Filtrer les comptes">
          {(["all", "active", "inactive"] as const).map((value) => (
            <button
              className={
                status === value ? "filter-button selected" : "filter-button"
              }
              key={value}
              type="button"
              onClick={() => setStatus(value)}
            >
              {value === "all"
                ? `Tous (${users.length})`
                : value === "active"
                  ? `Actifs (${users.filter((user) => user.active).length})`
                  : `Désactivés (${users.filter((user) => !user.active).length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="user-table-wrap">
        <table className="user-table">
          <caption className="sr-only">Utilisateurs du portail</caption>
          <thead>
            <tr>
              <th scope="col">Utilisateur</th>
              <th scope="col">Matricule</th>
              <th scope="col">Accès</th>
              <th scope="col">Statut</th>
              <th scope="col" className="user-table-actions-heading">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="user-table-identity">
                    <span
                      className={`directory-avatar${user.active ? "" : " inactive"}`}
                    >
                      {user.displayName.slice(0, 1).toUpperCase()}
                    </span>
                    <span>
                      <strong>{user.displayName}</strong>
                      <small>{user.email ?? "E-mail non renseigné"}</small>
                    </span>
                  </div>
                </td>
                <td>{user.employeeId ?? "—"}</td>
                <td>
                  <span className="user-access-count">
                    {user.profileIds.length}
                  </span>{" "}
                  profil{user.profileIds.length > 1 ? "s" : ""}
                </td>
                <td>
                  <span
                    className={
                      user.active ? "status-pill" : "status-pill inactive"
                    }
                  >
                    {user.active ? "Actif" : "Désactivé"}
                  </span>
                </td>
                <td>
                  <div className="user-table-actions">
                    <button
                      className="button secondary compact-button"
                      type="button"
                      onClick={() => setModal(user)}
                    >
                      Modifier
                    </button>
                    <form
                      action={async (formData) => {
                        if (!window.confirm(`Supprimer ${user.displayName} ?`))
                          return;
                        await deletePortalUser(formData);
                      }}
                    >
                      <input type="hidden" name="userId" value={user.id} />
                      <button
                        className="button danger compact-button"
                        type="submit"
                      >
                        Supprimer
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="user-table-empty">
            <strong>Aucun utilisateur trouvé</strong>
            <span>Modifiez la recherche ou ajoutez un nouveau compte.</span>
          </div>
        )}
      </div>

      {modal && (
        <UserModal
          key={modal === "create" ? "create" : modal.id}
          mode={modal}
          savePortalUser={savePortalUser}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function UserModal({
  mode,
  savePortalUser,
  onClose,
}: {
  mode: "create" | UserManagementUser;
  savePortalUser: ServerAction;
  onClose: () => void;
}) {
  const existing = mode === "create" ? null : mode;
  const [error, setError] = useState<string | null>(null);
  return (
    <div
      className="user-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="user-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="user-modal-header">
          <div>
            <p className="eyebrow">
              {existing ? "Modification" : "Nouveau compte"}
            </p>
            <h2 id="user-modal-title">
              {existing ? "Modifier l’utilisateur" : "Ajouter un utilisateur"}
            </h2>
          </div>
          <button
            className="modal-close"
            type="button"
            onClick={onClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
        <form
          action={async (formData) => {
            try {
              setError(null);
              await savePortalUser(formData);
              onClose();
            } catch (caught) {
              setError(
                caught instanceof Error
                  ? caught.message
                  : "Enregistrement impossible",
              );
            }
          }}
        >
          {existing && (
            <input type="hidden" name="userId" value={existing.id} />
          )}
          <div className="user-modal-fields">
            <label>
              Nom affiché
              <input
                name="displayName"
                required
                maxLength={160}
                defaultValue={existing?.displayName ?? ""}
              />
            </label>
            <label>
              E-mail
              <input
                name="email"
                type="email"
                required
                maxLength={320}
                defaultValue={existing?.email ?? ""}
              />
            </label>
            <label>
              Matricule
              <input
                name="employeeId"
                maxLength={32}
                placeholder="TID000… ou TIDP000…"
                defaultValue={existing?.employeeId ?? ""}
              />
            </label>
            <label>
              Identifiant Keycloak (sub)
              <input
                name="keycloakSubject"
                maxLength={200}
                readOnly={!existing}
                required={Boolean(existing)}
                placeholder={existing ? undefined : "Généré automatiquement"}
                defaultValue={existing?.keycloakSubject ?? ""}
              />
            </label>
          </div>
          <div className="modal-accesses">
            <strong>Accès applicatifs</strong>
            <p className="field-help">
              À la création, le portail attribue automatiquement le profil
              minimal de chaque application active et demande son provisioning.
              Les droits plus fins sont gérés par l’administrateur de chaque
              application.
            </p>
            {existing && (
              <p className="field-help">
                Ce compte dispose actuellement de {existing.profileIds.length}{" "}
                profil{existing.profileIds.length > 1 ? "s" : ""} applicatif.
              </p>
            )}
          </div>
          <div className="user-modal-footer">
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <label className="check-label">
              <input
                type="checkbox"
                name="active"
                defaultChecked={existing?.active ?? true}
              />{" "}
              Compte actif
            </label>
            <div className="modal-buttons">
              <button
                className="button secondary"
                type="button"
                onClick={onClose}
              >
                Annuler
              </button>
              <button className="button primary" type="submit">
                Enregistrer
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

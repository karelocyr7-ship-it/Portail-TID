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
type SortKey = "user" | "employeeId" | "access" | "status";
type SortState = { key: SortKey; direction: "asc" | "desc" };

function sortValue(user: UserManagementUser, key: SortKey): string | number {
  switch (key) {
    case "employeeId":
      return user.employeeId ?? "";
    case "access":
      return user.profileIds.length;
    case "status":
      return user.active ? 1 : 0;
    default:
      return `${user.employeeId ?? ""} ${user.displayName} ${user.email ?? ""}`;
  }
}

export function UserManagement({
  users,
  savePortalUser,
  deletePortalUser,
  sendPortalUserPasswordReset,
}: {
  users: UserManagementUser[];
  savePortalUser: ServerAction;
  deletePortalUser: ServerAction;
  sendPortalUserPasswordReset: ServerAction;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [sort, setSort] = useState<SortState>({
    key: "employeeId",
    direction: "asc",
  });
  const [modal, setModal] = useState<"create" | UserManagementUser | null>(
    null,
  );
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const matchesQuery =
          !normalizedQuery ||
          `${user.employeeId ?? ""} ${user.displayName} ${user.email ?? ""}`
            .toLocaleLowerCase()
            .includes(normalizedQuery);
        const matchesStatus =
          status === "all" ||
          (status === "active" ? user.active : !user.active);
        return matchesQuery && matchesStatus;
      }),
    [normalizedQuery, status, users],
  );
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((left, right) => {
      const leftValue = sortValue(left, sort.key);
      const rightValue = sortValue(right, sort.key);
      const comparison =
        typeof leftValue === "number" && typeof rightValue === "number"
          ? leftValue - rightValue
          : String(leftValue).localeCompare(String(rightValue), "fr", {
              numeric: true,
              sensitivity: "base",
            });
      return sort.direction === "asc" ? comparison : -comparison;
    });
  }, [filteredUsers, sort]);

  function toggleSort(key: SortKey) {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  }

  function sortLabel(key: SortKey, label: string) {
    const active = sort.key === key;
    return (
      <button
        className="user-table-sort-button"
        type="button"
        onClick={() => toggleSort(key)}
        aria-label={`Trier par ${label}`}
        aria-pressed={active}
      >
        {label}
        <span aria-hidden="true">
          {active ? (sort.direction === "asc" ? " ↑" : " ↓") : " ↕"}
        </span>
      </button>
    );
  }

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
            placeholder="Matricule, nom ou e-mail…"
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
              <th scope="col">{sortLabel("user", "Utilisateur")}</th>
              <th scope="col">{sortLabel("employeeId", "Matricule")}</th>
              <th scope="col">{sortLabel("access", "Accès")}</th>
              <th scope="col">{sortLabel("status", "Statut")}</th>
              <th scope="col" className="user-table-actions-heading">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((user) => (
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
                        if (
                          !window.confirm(
                            `Envoyer un lien de réinitialisation à ${user.email ?? "cet utilisateur"} ?`,
                          )
                        )
                          return;
                        await sendPortalUserPasswordReset(formData);
                      }}
                    >
                      <input type="hidden" name="userId" value={user.id} />
                      <button
                        className="button secondary compact-button"
                        type="submit"
                        disabled={!user.email}
                        title={
                          user.email
                            ? "Envoyer un lien de réinitialisation"
                            : "Une adresse e-mail est requise"
                        }
                      >
                        Réinitialiser
                      </button>
                    </form>
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
        {sortedUsers.length === 0 && (
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

"use client";

import { useMemo, useState } from "react";

export type UserDirectoryEntry = {
  id: string;
  displayName: string;
  email: string | null;
  active: boolean;
  profileCount: number;
};

export function UserDirectory({ users }: { users: UserDirectoryEntry[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return users.filter((user) => {
      const matchesQuery =
        !normalizedQuery ||
        [user.displayName, user.email ?? ""]
          .join(" ")
          .toLocaleLowerCase()
          .includes(normalizedQuery);
      const matchesStatus =
        status === "all" || (status === "active" ? user.active : !user.active);
      return matchesQuery && matchesStatus;
    });
  }, [query, status, users]);

  return (
    <div className="user-directory">
      <div className="directory-toolbar">
        <label className="directory-search">
          <span>Rechercher un compte</span>
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
      <div className="directory-summary">
        <strong>{filteredUsers.length}</strong> compte
        {filteredUsers.length > 1 ? "s" : ""} affiché
        {filteredUsers.length > 1 ? "s" : ""}
      </div>
      {filteredUsers.length === 0 ? (
        <p className="directory-empty">
          Aucun compte ne correspond à ce filtre.
        </p>
      ) : (
        <div className="directory-grid">
          {filteredUsers.map((user) => (
            <a
              className="directory-card"
              href={`#user-${user.id}`}
              key={user.id}
            >
              <span
                className={
                  user.active ? "directory-avatar" : "directory-avatar inactive"
                }
              >
                {user.displayName.slice(0, 1).toUpperCase()}
              </span>
              <span className="directory-card-copy">
                <strong>{user.displayName}</strong>
                <small>{user.email ?? "E-mail non renseigné"}</small>
              </span>
              <span className="directory-card-meta">
                <b>{user.profileCount}</b> profil
                {user.profileCount > 1 ? "s" : ""}
                <small>{user.active ? "Actif" : "Désactivé"}</small>
              </span>
              <span className="directory-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

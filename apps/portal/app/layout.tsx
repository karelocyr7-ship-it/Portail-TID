import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/oidc";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portail TAD Groupe",
  description: "Portail centralisé des applications métiers de TAD Groupe",
  applicationName: "Portail TAD Groupe",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  return (
    <html lang="fr">
      <body>
        <div className="shell">
          <aside className="sidebar">
            <Link className="brand" href="/">
              <span className="brand-mark" aria-hidden="true">
                T
              </span>
              <span>
                <strong>Portail</strong>
                <small>TAD Groupe</small>
              </span>
            </Link>
            <nav aria-label="Navigation principale">
              <Link className="nav-link active" href="/">
                ⌂ <span>Tableau de bord</span>
              </Link>
              <Link className="nav-link" href="/#applications">
                ▦ <span>Applications</span>
              </Link>
              <Link className="nav-link" href="/admin">
                ⚙ <span>Administration</span>
              </Link>
            </nav>
            <div className="sidebar-footer">
              <span className="status-dot" /> Services opérationnels
            </div>
          </aside>
          <main className="main-content">
            <header className="topbar">
              <div>
                <p className="eyebrow">TID / TAD Groupe</p>
                <p className="topbar-title">Espace de travail</p>
              </div>
              <div className="user-chip">
                <span className="avatar">{(session?.name ?? session?.username ?? "U").slice(0, 1).toUpperCase()}</span>
                <span>
                  <strong>{session?.name ?? session?.username ?? "Visiteur"}</strong>
                  <small>{session ? "Session Keycloak" : "Non connecté"}</small>
                </span>
              </div>
            </header>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

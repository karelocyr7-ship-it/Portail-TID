import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portail TAD Groupe",
  description: "Portail centralisé des applications métiers de TAD Groupe",
  applicationName: "Portail TAD Groupe",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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
                <span className="avatar">D</span>
                <span>
                  <strong>Utilisateur</strong>
                  <small>Session Keycloak</small>
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

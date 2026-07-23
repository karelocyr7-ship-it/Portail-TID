import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Image from "next/image";
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
  if (!session) redirect("/api/auth/login");

  return (
    <html lang="fr">
      <body>
        <div className="shell">
          <aside className="sidebar">
            <Link className="brand" href="/">
              <span className="brand-logo">
                <Image
                  src="/branding/tad-logo.png"
                  alt="TAD Groupe"
                  width={1080}
                  height={545}
                  priority
                />
              </span>
              <span className="brand-caption">
                <strong>Portail</strong>
                <small>Espace métier</small>
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
                <span className="avatar">
                  {(session?.name ?? session?.username ?? "U")
                    .slice(0, 1)
                    .toUpperCase()}
                </span>
                <span>
                  <strong>
                    {session?.name ?? session?.username ?? "Visiteur"}
                  </strong>
                  <small>{session ? "Session Keycloak" : "Non connecté"}</small>
                </span>
                <a
                  className="auth-link"
                  href={session ? "/api/auth/logout" : "/api/auth/login"}
                >
                  {session ? "Se déconnecter" : "Se connecter"}
                </a>
              </div>
            </header>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

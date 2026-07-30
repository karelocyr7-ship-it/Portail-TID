import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getRoles, getSession } from "@/lib/oidc";
import { MainNavigation } from "@/components/main-navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portail TID",
  description:
    "Portail centralisé des applications métiers de TID / TAD Groupe",
  applicationName: "TAD Groupe",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  if (!session) redirect("/api/auth/login");
  const isPortalAdmin = getRoles(session).includes("PORTAL_ADMIN");

  return (
    <html lang="fr">
      <body>
        <div className="shell">
          <aside className="sidebar">
            <Link className="brand" href="/">
              <span className="brand-logo">
                <Image
                  src="/branding/tid-logo.png"
                  alt="TID – Tropical Ivoire Distribution"
                  width={216}
                  height={87}
                  priority
                />
              </span>
              <span className="brand-caption">
                <strong>Portail</strong>
                <small>Espace métier</small>
              </span>
            </Link>
            <MainNavigation isPortalAdmin={isPortalAdmin} />
            <div className="sidebar-footer">
              <span className="status-dot" /> Services opérationnels
            </div>
          </aside>
          <main className="main-content">
            <header className="topbar">
              <div>
                <p className="eyebrow">Tropical Ivoire Distribution</p>
                <p className="topbar-title">Portail métier unifié</p>
              </div>
              <div className="user-chip">
                <span className="avatar">
                  {(session?.name ?? session?.username ?? "U")
                    .slice(0, 1)
                    .toUpperCase()}
                </span>
                <span className="user-identity">
                  <strong>
                    {session?.name ?? session?.username ?? "Visiteur"}
                  </strong>
                  <small>{session ? "Session Keycloak" : "Non connecté"}</small>
                </span>
                <span className="auth-actions">
                  {session && (
                    <a className="auth-link" href="/api/auth/switch">
                      Changer de compte
                    </a>
                  )}
                  <a
                    className="auth-link"
                    href={session ? "/api/auth/logout" : "/api/auth/login"}
                  >
                    {session ? "Se déconnecter" : "Se connecter"}
                  </a>
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

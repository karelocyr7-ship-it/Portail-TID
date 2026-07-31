"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function MainNavigation({ isPortalAdmin }: { isPortalAdmin: boolean }) {
  const pathname = usePathname();
  const section = useSearchParams().get("section");
  const linkClass = (active: boolean) =>
    active ? "nav-link active" : "nav-link";

  return (
    <nav aria-label="Navigation principale">
      <Link className={linkClass(pathname === "/")} href="/">
        ▦ <span>Applications</span>
      </Link>
      {isPortalAdmin && (
        <>
          <Link
            className={linkClass(pathname === "/admin" && section === "users")}
            href="/admin?section=users"
          >
            ♙ <span>Utilisateurs</span>
          </Link>
          <Link
            className={linkClass(pathname === "/admin" && section !== "users")}
            href="/admin?section=catalogue"
          >
            ⚙ <span>Administration</span>
          </Link>
          <Link
            className={linkClass(pathname.startsWith("/admin/agents"))}
            href="/admin/agents"
          >
            ◈ <span>Rapports agents</span>
          </Link>
          <Link
            className={linkClass(pathname.startsWith("/admin/email"))}
            href="/admin/email"
          >
            ✉ <span>E-mails</span>
          </Link>
        </>
      )}
    </nav>
  );
}

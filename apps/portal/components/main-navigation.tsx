"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

export function MainNavigation({ isPortalAdmin }: { isPortalAdmin: boolean }) {
  const pathname = usePathname();
  const section = useSearchParams().get("section");
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = () => setIsOpen(false);
  const linkClass = (active: boolean) =>
    active ? "nav-link active" : "nav-link";

  return (
    <>
      <button
        aria-controls="portal-main-navigation"
        aria-expanded={isOpen}
        className="mobile-nav-toggle"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <span aria-hidden="true">☰</span>
        <span>{isOpen ? "Fermer le menu" : "Menu"}</span>
        <span aria-hidden="true" className="mobile-nav-chevron">
          ⌄
        </span>
      </button>
      <nav
        aria-label="Navigation principale"
        className={`main-navigation${isOpen ? " is-open" : ""}`}
        id="portal-main-navigation"
      >
        <Link
          className={linkClass(pathname === "/")}
          href="/"
          onClick={closeMenu}
        >
          ▦ <span>Applications</span>
        </Link>
        {isPortalAdmin && (
          <>
            <Link
              className={linkClass(
                pathname === "/admin" && section === "users",
              )}
              href="/admin?section=users"
              onClick={closeMenu}
            >
              ♙ <span>Utilisateurs</span>
            </Link>
            <Link
              className={linkClass(
                pathname === "/admin" && section !== "users",
              )}
              href="/admin?section=catalogue"
              onClick={closeMenu}
            >
              ⚙ <span>Administration</span>
            </Link>
            <Link
              className={linkClass(pathname.startsWith("/admin/agents"))}
              href="/admin/agents"
              onClick={closeMenu}
            >
              ◈ <span>Rapports agents</span>
            </Link>
            <Link
              className={linkClass(pathname.startsWith("/admin/email"))}
              href="/admin/email"
              onClick={closeMenu}
            >
              ✉ <span>E-mails</span>
            </Link>
          </>
        )}
      </nav>
    </>
  );
}

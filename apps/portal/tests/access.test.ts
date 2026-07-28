import { describe, expect, it } from "vitest";
import {
  catalogApplications,
  canReadCatalog,
  getVisibleApplications,
  hasRoleAccess,
} from "../lib/catalog";

describe("contrôle d’accès au catalogue", () => {
  it("autorise une application correspondant au rôle", () => {
    const finance = catalogApplications.find(
      (application) => application.code === "CASH-RECON",
    );
    expect(finance).toBeDefined();
    expect(hasRoleAccess(finance!, ["FINANCE"])).toBe(true);
  });

  it("refuse une application sans rôle correspondant", () => {
    const finance = catalogApplications.find(
      (application) => application.code === "CASH-RECON",
    );
    expect(finance).toBeDefined();
    expect(hasRoleAccess(finance!, ["RH"])).toBe(false);
  });

  it("réserve MDM au rôle informatique", () => {
    const mdm = catalogApplications.find(
      (application) => application.code === "MDM",
    );
    expect(mdm).toMatchObject({
      url: "https://mdm.tadgroupe.com",
      roles: ["PORTAL_ADMIN", "INFORMATIQUE"],
    });
    expect(hasRoleAccess(mdm!, ["INFORMATIQUE"])).toBe(true);
    expect(hasRoleAccess(mdm!, ["RH"])).toBe(false);
  });

  it("donne accès à tout le catalogue à PORTAL_ADMIN", () => {
    expect(getVisibleApplications(["PORTAL_ADMIN"])).toHaveLength(
      catalogApplications.length,
    );
  });

  it("ne renvoie jamais les applications inactives", () => {
    expect(getVisibleApplications([])).toHaveLength(0);
  });

  it("réserve le catalogue géré aux comptes actifs et habilités", () => {
    expect(
      canReadCatalog(["DIRECTION"], {
        managed: true,
        active: true,
        applicationIds: ["application-1"],
      }),
    ).toBe(true);
    expect(
      canReadCatalog(["DIRECTION"], {
        managed: true,
        active: false,
        applicationIds: ["application-1"],
      }),
    ).toBe(false);
    expect(
      canReadCatalog(["DIRECTION"], {
        managed: true,
        active: true,
        applicationIds: [],
      }),
    ).toBe(false);
  });

  it("laisse PORTAL_ADMIN accéder au catalogue sans profil applicatif", () => {
    expect(
      canReadCatalog(["PORTAL_ADMIN"], {
        managed: false,
        active: false,
        applicationIds: [],
      }),
    ).toBe(true);
  });
});

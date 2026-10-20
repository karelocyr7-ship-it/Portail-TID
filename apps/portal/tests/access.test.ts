import { describe, expect, it } from "vitest";
import {
  catalogApplications,
  canReadCatalog,
  getApplicationLaunchUrl,
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
      url: "https://mdm.tadgroupe.com/rest/public/auth/oidc/login",
      roles: ["PORTAL_ADMIN", "INFORMATIQUE"],
    });
    expect(hasRoleAccess(mdm!, ["INFORMATIQUE"])).toBe(true);
    expect(hasRoleAccess(mdm!, ["RH"])).toBe(false);
  });

  it("rend GLPI visible par défaut à tout utilisateur connecté", () => {
    const glpi = catalogApplications.find(
      (application) => application.code === "GLPI",
    );
    expect(glpi).toMatchObject({
      availableToAllUsers: true,
      url: "https://glpi.tadgroupe.com/?samlIdpId=1",
    });
    expect(hasRoleAccess(glpi!, [])).toBe(true);
    expect(getVisibleApplications([]).map(({ code }) => code)).toEqual([
      "GLPI",
    ]);
  });

  it("ouvre ATF via Keycloak et conserve ses profils métier", () => {
    const atf = catalogApplications.find(
      (application) => application.code === "ATF",
    );
    expect(atf).toMatchObject({
      integrationLevel: 2,
      url: "https://atf.tadgroupe.com/rest/public/oidc",
      roles: ["PORTAL_ADMIN", "SUPERVISEUR", "DIRECTION"],
    });
    expect(hasRoleAccess(atf!, ["SUPERVISEUR"])).toBe(true);
    expect(hasRoleAccess(atf!, ["FINANCE"])).toBe(false);
  });

  it("ouvre Revue-PDV via son entrée OIDC", () => {
    const revuePdv = catalogApplications.find(
      (application) => application.code === "REVUE-PDV",
    );
    expect(revuePdv).toMatchObject({
      integrationLevel: 2,
      url: "https://pdv.tadgroupe.com/api/auth/oidc/start",
    });
    expect(hasRoleAccess(revuePdv!, ["SUPERVISEUR"])).toBe(true);
  });

  it("ouvre Perf-TID par OIDC plutôt que de réutiliser une session locale", () => {
    const perfTid = catalogApplications.find(
      (application) => application.code === "TDB",
    );
    expect(perfTid).toMatchObject({
      name: "Perf-TID",
      integrationLevel: 2,
      url: "https://perf-tid.tadgroupe.com/api/auth/oidc/start",
    });
    expect(
      getApplicationLaunchUrl("TDB", "https://perf-tid.tadgroupe.com"),
    ).toBe("https://perf-tid.tadgroupe.com/api/auth/oidc/start");
  });

  it("donne accès à tout le catalogue à PORTAL_ADMIN", () => {
    expect(getVisibleApplications(["PORTAL_ADMIN"])).toHaveLength(
      catalogApplications.length,
    );
  });

  it("permet à tout compte connecté actif de voir le catalogue même sans affectation", () => {
    expect(
      canReadCatalog([], {
        managed: true,
        active: true,
        applicationIds: [],
      }),
    ).toBe(true);
    expect(
      canReadCatalog([], {
        managed: true,
        active: false,
        applicationIds: [],
      }),
    ).toBe(false);
    expect(
      canReadCatalog([], {
        managed: false,
        active: false,
        applicationIds: [],
        authenticated: false,
      }),
    ).toBe(false);
    expect(
      canReadCatalog([], {
        managed: false,
        active: false,
        applicationIds: [],
        authenticated: true,
      }),
    ).toBe(true);
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
    ).toBe(true);
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

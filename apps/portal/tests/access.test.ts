import { describe, expect, it } from "vitest";
import {
  catalogApplications,
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

  it("donne accès à tout le catalogue à PORTAL_ADMIN", () => {
    expect(getVisibleApplications(["PORTAL_ADMIN"])).toHaveLength(
      catalogApplications.length,
    );
  });

  it("ne renvoie jamais les applications inactives", () => {
    expect(getVisibleApplications([])).toHaveLength(0);
  });
});

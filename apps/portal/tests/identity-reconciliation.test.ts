import { describe, expect, it } from "vitest";
import {
  canAutomaticallyReconcileSubject,
  trustedIdentityEmail,
} from "../lib/identity-reconciliation";

const stored = {
  keycloakSubject: "direction@tadgroupe.com",
  email: "direction@tadgroupe.com",
};

describe("réconciliation automatique du sub Keycloak", () => {
  it("accepte un placeholder égal au nom d'utilisateur e-mail", () => {
    expect(
      canAutomaticallyReconcileSubject(stored, {
        subject: "keycloak-uuid",
        username: "direction@tadgroupe.com",
        email: "direction@tadgroupe.com",
        emailVerified: false,
      }),
    ).toBe(true);
  });

  it("accepte un e-mail vérifié lorsque le nom d'utilisateur n'est pas un e-mail", () => {
    expect(
      canAutomaticallyReconcileSubject(stored, {
        subject: "keycloak-uuid",
        username: "direction",
        email: "direction@tadgroupe.com",
        emailVerified: true,
      }),
    ).toBe(true);
  });

  it("refuse un e-mail non vérifié qui ne correspond pas au nom d'utilisateur", () => {
    expect(
      trustedIdentityEmail({
        subject: "keycloak-uuid",
        username: "direction",
        email: "direction@tadgroupe.com",
        emailVerified: false,
      }),
    ).toBeUndefined();
  });

  it("refuse une fiche qui contient déjà un véritable sub", () => {
    expect(
      canAutomaticallyReconcileSubject(
        { ...stored, keycloakSubject: "another-keycloak-uuid" },
        {
          subject: "keycloak-uuid",
          username: "direction@tadgroupe.com",
        },
      ),
    ).toBe(false);
  });

  it("refuse une identité ou une fiche portant un autre e-mail", () => {
    expect(
      canAutomaticallyReconcileSubject(stored, {
        subject: "keycloak-uuid",
        username: "another@tadgroupe.com",
      }),
    ).toBe(false);
  });
});

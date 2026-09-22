import { afterEach, describe, expect, it, vi } from "vitest";
import {
  provisionKeycloakUser,
  setKeycloakUserEnabled,
} from "@/lib/keycloak-admin";

describe("provisionKeycloakUser", () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = {
    issuer: process.env.KEYCLOAK_ISSUER,
    clientId: process.env.KEYCLOAK_ADMIN_CLIENT_ID,
    clientSecret: process.env.KEYCLOAK_ADMIN_CLIENT_SECRET,
  };

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalEnv.issuer === undefined) delete process.env.KEYCLOAK_ISSUER;
    else process.env.KEYCLOAK_ISSUER = originalEnv.issuer;
    if (originalEnv.clientId === undefined)
      delete process.env.KEYCLOAK_ADMIN_CLIENT_ID;
    else process.env.KEYCLOAK_ADMIN_CLIENT_ID = originalEnv.clientId;
    if (originalEnv.clientSecret === undefined)
      delete process.env.KEYCLOAK_ADMIN_CLIENT_SECRET;
    else process.env.KEYCLOAK_ADMIN_CLIENT_SECRET = originalEnv.clientSecret;
  });

  it("returns the Keycloak subject from the creation response", async () => {
    process.env.KEYCLOAK_ISSUER =
      "https://sso.example.test/auth/realms/tad-groupe";
    process.env.KEYCLOAK_ADMIN_CLIENT_ID = "portal-provisioner-test";
    process.env.KEYCLOAK_ADMIN_CLIENT_SECRET = "test-only-secret";
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "test-token" }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(null, {
          status: 201,
          headers: { location: "/auth/admin/realms/tad-groupe/users/sub-123" },
        }),
      );

    await expect(
      provisionKeycloakUser({
        email: "test.user@example.test",
        displayName: "Utilisateur Test",
        employeeId: "TID0001",
      }),
    ).resolves.toEqual({ subject: "sub-123", created: true });
  });

  it("updates the Keycloak enabled state", async () => {
    process.env.KEYCLOAK_ISSUER =
      "https://sso.example.test/auth/realms/tad-groupe";
    process.env.KEYCLOAK_ADMIN_CLIENT_ID = "portal-provisioner-test";
    process.env.KEYCLOAK_ADMIN_CLIENT_SECRET = "test-only-secret";
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "test-token" }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(setKeycloakUserEnabled("sub-123", false)).resolves.toBeUndefined();
    expect(globalThis.fetch).toHaveBeenLastCalledWith(
      "https://sso.example.test/auth/admin/realms/tad-groupe/users/sub-123",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ enabled: false }),
      }),
    );
  });
});

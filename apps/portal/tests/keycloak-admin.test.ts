import { afterEach, describe, expect, it, vi } from "vitest";
import {
  provisionKeycloakUser,
  sendKeycloakPasswordReset,
} from "@/lib/keycloak-admin";

describe("provisionKeycloakUser", () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = {
    issuer: process.env.KEYCLOAK_ISSUER,
    clientId: process.env.KEYCLOAK_ADMIN_CLIENT_ID,
    clientSecret: process.env.KEYCLOAK_ADMIN_CLIENT_SECRET,
    portalUrl: process.env.PORTAL_PUBLIC_URL,
    portalClientId: process.env.KEYCLOAK_CLIENT_ID,
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
    if (originalEnv.portalUrl === undefined)
      delete process.env.PORTAL_PUBLIC_URL;
    else process.env.PORTAL_PUBLIC_URL = originalEnv.portalUrl;
    if (originalEnv.portalClientId === undefined)
      delete process.env.KEYCLOAK_CLIENT_ID;
    else process.env.KEYCLOAK_CLIENT_ID = originalEnv.portalClientId;
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
    const createRequest = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[1]?.[1] as RequestInit;
    expect(JSON.parse(String(createRequest.body))).toMatchObject({
      username: "TID0001",
      email: "test.user@example.test",
    });
  });

  it("uses the registered OIDC callback for password reset links", async () => {
    process.env.KEYCLOAK_ISSUER =
      "https://sso.example.test/auth/realms/tad-groupe";
    process.env.KEYCLOAK_ADMIN_CLIENT_ID = "portal-provisioner-test";
    process.env.KEYCLOAK_ADMIN_CLIENT_SECRET = "test-only-secret";
    process.env.KEYCLOAK_CLIENT_ID = "tad-portal";
    process.env.PORTAL_PUBLIC_URL = "https://portail.example.test";
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "test-token" }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(
      sendKeycloakPasswordReset("subject-123"),
    ).resolves.toBeUndefined();
    const resetUrl = String(
      (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[1]?.[0],
    );
    expect(resetUrl).toContain(
      "redirect_uri=https%3A%2F%2Fportail.example.test%2Fapi%2Fauth%2Fcallback",
    );
  });
});

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
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

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
      requiredActions: ["VERIFY_EMAIL", "UPDATE_PASSWORD"],
    });
    const activationRequest = (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mock.calls[2];
    expect(String(activationRequest?.[0])).toContain(
      "execute-actions-email?lifespan=1800",
    );
    expect(String(activationRequest?.[0])).not.toContain("redirect_uri");
    expect(String(activationRequest?.[0])).not.toContain("client_id");
    expect(
      JSON.parse(String((activationRequest?.[1] as RequestInit).body)),
    ).toEqual(["VERIFY_EMAIL", "UPDATE_PASSWORD"]);
  });

  it("does not use a client redirect for password reset action emails", async () => {
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
    expect(resetUrl).toContain("execute-actions-email?lifespan=1800");
    expect(resetUrl).not.toContain("redirect_uri");
    expect(resetUrl).not.toContain("client_id");
    const resetRequest = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[1]?.[1] as RequestInit;
    expect(JSON.parse(String(resetRequest.body))).toEqual(["UPDATE_PASSWORD"]);
  });

  it("resends activation only when a duplicate Keycloak account is awaiting setup", async () => {
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
      .mockResolvedValueOnce(new Response(null, { status: 409 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: "sub-123" }]), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ requiredActions: ["UPDATE_PASSWORD"] }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(
      provisionKeycloakUser({
        email: "test.user@example.test",
        displayName: "Utilisateur Test",
        employeeId: "TID0001",
      }),
    ).resolves.toEqual({ subject: "sub-123", created: false });
    const activationRequest = (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mock.calls[4]?.[1] as RequestInit;
    expect(JSON.parse(String(activationRequest.body))).toEqual([
      "UPDATE_PASSWORD",
    ]);
  });
});

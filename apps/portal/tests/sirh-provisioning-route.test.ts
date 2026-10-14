import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPrisma: vi.fn(),
  provisionKeycloakUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ getPrisma: mocks.getPrisma }));
vi.mock("@/lib/keycloak-admin", () => ({
  provisionKeycloakUser: mocks.provisionKeycloakUser,
}));

import { POST } from "@/app/api/provisioning/sirh/users/route";

const secret = "synthetic-sirh-hmac-secret";
const payload = {
  sageId: "SAGE-TEST-001",
  email: "provisioning-test@example.invalid",
  displayName: "Synthetic Portal User",
};

function signedRequest(body: unknown = payload) {
  const raw = JSON.stringify(body);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac("sha256", secret)
    .update(`${timestamp}.${raw}`)
    .digest("hex");
  return new Request("https://portal.example.invalid/api/provisioning/sirh/users", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-sirh-timestamp": timestamp,
      "x-sirh-signature": `sha256=${signature}`,
    },
    body: raw,
  });
}

describe("POST /api/provisioning/sirh/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SIRH_PROVISIONING_SECRET = secret;
    mocks.provisionKeycloakUser.mockResolvedValue({ subject: "synthetic-subject" });
  });

  it("crée l'identité Portail sans attribuer d'accès applicatif implicite", async () => {
    const user = {
      id: "synthetic-portal-user",
      keycloakSubject: "synthetic-subject",
    };
    const transaction = {
      portalUser: { create: vi.fn().mockResolvedValue(user) },
      auditLog: { create: vi.fn().mockResolvedValue(undefined) },
    };
    const prisma = {
      portalUser: {
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
      },
      $transaction: vi.fn((callback: (tx: typeof transaction) => unknown) =>
        callback(transaction),
      ),
    };
    mocks.getPrisma.mockReturnValue(prisma);

    const response = await POST(signedRequest());
    const result = await response.json();

    expect(response.status).toBe(201);
    expect(result.applicationAccess).toBe("NOT_ASSIGNED");
    expect(transaction.portalUser.create).toHaveBeenCalledOnce();
    expect(transaction.auditLog.create).toHaveBeenCalledOnce();
    expect("userApplicationProfile" in transaction).toBe(false);
    expect("applicationProvisioningOutbox" in transaction).toBe(false);
  });

  it("laisse les accès applicatifs existants inchangés lors d'une mise à jour SIRH", async () => {
    const existing = {
      id: "synthetic-existing-user",
      keycloakSubject: "synthetic-subject",
    };
    const updated = { ...existing };
    const transaction = {
      portalUser: { update: vi.fn().mockResolvedValue(updated) },
      userApplicationProfile: {
        findMany: vi.fn().mockResolvedValue([
          { profileId: "synthetic-profile", profile: { applicationId: "synthetic-app" } },
        ]),
      },
      applicationProvisioningOutbox: {
        upsert: vi.fn().mockResolvedValue(undefined),
      },
      auditLog: { create: vi.fn().mockResolvedValue(undefined) },
    };
    const prisma = {
      portalUser: {
        findUnique: vi.fn().mockResolvedValue(existing),
        findMany: vi.fn(),
      },
      $transaction: vi.fn((callback: (tx: typeof transaction) => unknown) =>
        callback(transaction),
      ),
    };
    mocks.getPrisma.mockReturnValue(prisma);

    const response = await POST(signedRequest({ ...payload, enabled: false }));
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.applicationAccess).toBe("UNCHANGED");
    expect(transaction.portalUser.update).toHaveBeenCalledOnce();
    expect(mocks.provisionKeycloakUser).not.toHaveBeenCalled();
    expect(transaction.userApplicationProfile.findMany).toHaveBeenCalledOnce();
    expect(transaction.applicationProvisioningOutbox.upsert).toHaveBeenCalledOnce();
  });

  it("refuse les requêtes non signées avant tout accès aux comptes", async () => {
    const response = await POST(
      new Request("https://portal.example.invalid/api/provisioning/sirh/users", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );

    expect(response.status).toBe(401);
    expect(mocks.getPrisma).not.toHaveBeenCalled();
    expect(mocks.provisionKeycloakUser).not.toHaveBeenCalled();
  });
});

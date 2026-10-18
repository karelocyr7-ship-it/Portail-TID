import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPrisma: vi.fn(),
  initialize: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ getPrisma: mocks.getPrisma }));
vi.mock("@/lib/sirh-initial-access", async (original) => ({
  ...(await original<typeof import("@/lib/sirh-initial-access")>()),
  initializeSirhAccess: mocks.initialize,
}));
import { POST } from "@/app/api/provisioning/sirh/initial-access/route";

const signingSecret = randomBytes(32).toString("base64url");
const temporaryPassword = randomBytes(32).toString("base64url");
const payload = () => ({
  purpose: "initial-access-v1",
  requestId: randomUUID(),
  sageId: "TID000042",
  email: "synthetic@example.invalid",
  firstName: "Synthetic",
  lastName: "Person",
  temporaryPassword,
});
const tx = {
  $queryRaw: vi.fn(),
  auditLog: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  portalUser: { findUnique: vi.fn(), upsert: vi.fn() },
};
function request(body = payload(), age = 0, signed = true) {
  const raw = JSON.stringify(body);
  const timestamp = String(Math.floor(Date.now() / 1000) - age);
  return new Request(
    "https://portal.example.invalid/api/provisioning/sirh/initial-access",
    {
      method: "POST",
      body: raw,
      headers: signed
        ? {
            "x-sirh-timestamp": timestamp,
            "x-sirh-signature": createHmac("sha256", signingSecret)
              .update(`${timestamp}.${raw}`)
              .digest("hex"),
          }
        : {},
    },
  );
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("SIRH_PROVISIONING_SECRET", signingSecret);
  vi.stubEnv("SIRH_PROVISIONING_MAX_SKEW_SECONDS", "300");
  mocks.getPrisma.mockReturnValue({
    $transaction: async (callback: (transaction: typeof tx) => unknown) =>
      callback(tx),
  });
  mocks.initialize.mockResolvedValue({
    status: "READY",
    subject: "synthetic-subject",
  });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("SIRH initial-access request boundary", () => {
  it.each(["SAGE-TEST-001", "TID42", "TIDX00042"])(
    "rejects an incompatible matricule before creating a remote account (%s)",
    async (sageId) => {
      const response = await POST(request({ ...payload(), sageId }));
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "INVALID_MATRICULE" });
      expect(mocks.getPrisma).not.toHaveBeenCalled();
      expect(mocks.initialize).not.toHaveBeenCalled();
    },
  );
  it.each([
    "TID000042",
    "TIDS000042",
    "TIDC000042",
    "TIDP000042",
    "TIDPS000042",
    "TIDPC000042",
  ])(
    "preserves leading zeros and does not grant application rights (%s)",
    async (sageId) => {
      const response = await POST(request({ ...payload(), sageId }));
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("no-store");
      const data = tx.portalUser.upsert.mock.calls[0][0];
      expect(data.create.employeeId).toBe(sageId);
      expect(data.create.sageEmployeeId).toBe(sageId);
      expect(data.update).toEqual({});
      expect(data.create).not.toHaveProperty("userApplicationProfiles");
      const audit = JSON.stringify([
        tx.auditLog.create.mock.calls,
        tx.auditLog.update.mock.calls,
      ]);
      expect(audit.includes(temporaryPassword)).toBe(false);
      expect(audit.includes(signingSecret)).toBe(false);
      expect((await response.text()).includes(temporaryPassword)).toBe(false);
    },
  );
  it.each([
    { age: 301, signed: true },
    { age: -301, signed: true },
    { age: 0, signed: false },
  ])(
    "rejects stale, future or unsigned requests before any account access ($age, $signed)",
    async ({ age, signed }) => {
      const response = await POST(request(payload(), age, signed));
      expect(response.status).toBe(401);
      expect(mocks.getPrisma).not.toHaveBeenCalled();
      expect(mocks.initialize).not.toHaveBeenCalled();
    },
  );
  it("rejects a consumed request while holding the identity lock", async () => {
    tx.auditLog.findUnique.mockResolvedValue({ id: "consumed" });
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "REQUEST_ALREADY_USED" });
    expect(tx.$queryRaw).toHaveBeenCalledOnce();
    expect(mocks.initialize).not.toHaveBeenCalled();
  });
  it("does not reactivate a suspended portal account", async () => {
    tx.portalUser.findUnique.mockResolvedValue({ active: false });
    const response = await POST(request());
    expect(await response.json()).toEqual({ error: "ACCOUNT_DISABLED" });
    expect(mocks.initialize).not.toHaveBeenCalled();
    expect(tx.portalUser.upsert).not.toHaveBeenCalled();
  });
  it("preserves the account and permissions when credentials already exist", async () => {
    mocks.initialize.mockResolvedValue({
      status: "EXISTING_CREDENTIAL_PROTECTED",
      subject: "existing",
    });
    tx.portalUser.findUnique.mockResolvedValue({
      active: true,
      keycloakSubject: "existing",
    });
    const response = await POST(request());
    expect(await response.json()).toEqual({
      status: "EXISTING_CREDENTIAL_PROTECTED",
    });
    expect(tx.portalUser.upsert).not.toHaveBeenCalled();
    expect(mocks.initialize.mock.calls[0][2]).toBe("existing");
  });
  it("never logs or returns an exception body containing a credential", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.initialize.mockRejectedValue(new Error(temporaryPassword));
    const response = await POST(request());
    expect(await response.json()).toEqual({
      error: "INITIAL_ACCESS_UNAVAILABLE",
    });
    expect(log).toHaveBeenCalledWith(
      "SIRH_INITIAL_ACCESS_FAILURE",
      "INTERNAL",
      "keycloak",
    );
    expect(JSON.stringify(log.mock.calls).includes(temporaryPassword)).toBe(
      false,
    );
  });
});

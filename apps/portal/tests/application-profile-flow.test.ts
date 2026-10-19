import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  verify: vi.fn(),
  fetch: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    portalUser: { findFirst: mocks.findFirst, findUnique: mocks.findUnique },
  }),
}));
vi.mock("@/lib/oidc", () => ({ verifyApplicationIdToken: mocks.verify }));
import { POST } from "@/app/api/authorization/profiles/route";
import { provisionApplication } from "@/lib/provisioning/worker";

const assignments = [
  { profile: { key: "sup_orange", displayOrder: 0 } },
  { profile: { key: "ro", displayOrder: 5 } },
];
const currentUser = { active: true, assignments, updatedAt: new Date(0) };
const request = () =>
  new Request("https://portal.example.invalid/api/authorization/profiles", {
    method: "POST",
    body: JSON.stringify({
      application: "REVUE-PDV",
      idToken: "synthetic-test-token",
    }),
  });
const job = {
  application: { id: "synthetic-app", code: "REVUE-PDV" },
  user: {
    id: "synthetic-user",
    active: true,
    displayName: "Synthetic User",
    employeeId: "TEST-001",
    email: "test@example.invalid",
  },
  profile: { key: "sup_orange" },
  status: "REVOKE",
} as NonNullable<Parameters<typeof provisionApplication>[0]>;

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv(
    "REVUE_PDV_PROVISIONING_URL",
    "https://connector.example.invalid/users",
  );
  vi.stubEnv("REVUE_PDV_PROVISIONING_TOKEN", "synthetic-test-secret");
  vi.stubGlobal("fetch", mocks.fetch);
  mocks.fetch.mockResolvedValue({ ok: true });
  mocks.verify.mockResolvedValue({ subject: "synthetic-user" });
  mocks.findFirst.mockResolvedValue(currentUser);
  mocks.findUnique.mockResolvedValue(currentUser);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it("returns authorization without role data and provisions identity without a profile", async () => {
  const response = await POST(request());
  expect(response.status).toBe(200);
  const access = await response.json();
  expect(access.authorized).toBe(true);
  expect(access).not.toHaveProperty("profiles");
  expect(access).not.toHaveProperty("primaryProfile");
  await provisionApplication(job);
  const payload = JSON.parse(mocks.fetch.mock.calls[0][1].body);
  expect(payload).not.toHaveProperty("profile");
  expect(payload.enabled).toBe(true);
  expect(mocks.findUnique.mock.calls[0][0].where).toEqual({
    id: "synthetic-user",
  });
  expect(
    mocks.findUnique.mock.calls[0][0].include.assignments.where.profile,
  ).toEqual({
    active: true,
    application: { id: "synthetic-app", active: true },
  });
});

it.each([
  { active: false, assignments },
  { active: true, assignments: [] },
  null,
])(
  "denies SSO and disables provisioning for unavailable access: %j",
  async (user) => {
    const record = user ? { ...user, updatedAt: new Date(0) } : null;
    mocks.findFirst.mockResolvedValue(record);
    mocks.findUnique.mockResolvedValue(record);
    const access = await (await POST(request())).json();
    expect(access).toMatchObject({
      authorized: false,
    });
    expect(access).not.toHaveProperty("profiles");
    expect(access).not.toHaveProperty("primaryProfile");
    await provisionApplication(job);
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body).enabled).toBe(false);
  },
);

it("does not look up profiles when OIDC verification fails", async () => {
  mocks.verify.mockRejectedValue(new Error("synthetic rejection"));
  expect((await POST(request())).status).toBe(401);
  expect(mocks.findFirst).not.toHaveBeenCalled();
});

it("does not send a stale assignment if the current-state lookup fails", async () => {
  mocks.findUnique.mockRejectedValue(new Error("synthetic database failure"));
  await expect(provisionApplication(job)).rejects.toThrow(
    "synthetic database failure",
  );
  expect(mocks.fetch).not.toHaveBeenCalled();
});

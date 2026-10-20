import { beforeEach, expect, it, vi } from "vitest";
import { glpiAccessFromForm } from "@/lib/provisioning/glpi-access";

const mocks = vi.hoisted(() => ({ prisma: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ getPrisma: mocks.prisma }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/oidc", () => ({
  getSession: async () => ({ subject: "synthetic-admin" }),
  getRoles: () => ["PORTAL_ADMIN"],
}));
vi.mock("@/lib/keycloak-admin", () => ({
  provisionKeycloakUser: vi.fn(),
  sendKeycloakPasswordReset: vi.fn(),
}));
import { savePortalUser } from "@/app/admin/actions";

function form(edit = false) {
  const data = new FormData();
  data.set("keycloakSubject", "synthetic-subject");
  data.set("displayName", "Synthetic User");
  data.set("email", "synthetic@example.invalid");
  data.set("active", "on");
  if (edit) data.set("userId", "synthetic-user");
  return data;
}
let record: Record<string, unknown> | null;
const outbox = vi.fn();
beforeEach(() => {
  record = null;
  vi.clearAllMocks();
  const tx = {
    portalUser: {
      findUnique: async () => record && { ...record, assignments: [] },
      create: async ({ data }: { data: Record<string, unknown> }) =>
        (record = { id: "synthetic-user", ...data }),
      update: async ({ data }: { data: Record<string, unknown> }) =>
        (record = { ...record, ...data }),
    },
    application: { findUnique: async () => ({ id: "synthetic-glpi" }) },
    applicationProfile: {
      findMany: async () => [],
      upsert: async () => ({ id: "synthetic-access" }),
    },
    userApplicationProfile: { deleteMany: vi.fn(), createMany: vi.fn() },
    applicationProvisioningOutbox: { updateMany: vi.fn(), upsert: outbox },
    auditLog: { create: vi.fn() },
  };
  mocks.prisma.mockReturnValue({
    $transaction: async (fn: (txArg: typeof tx) => unknown) => fn(tx),
  });
});

it("defaults new and legacy missing values to true, never overrides false", () => {
  expect(glpiAccessFromForm(form())).toBe(true);
  expect(glpiAccessFromForm(form(), null)).toBe(true);
  expect(glpiAccessFromForm(form(), false)).toBe(false);
  const unchecked = form();
  unchecked.set("glpiAccessPresent", "1");
  expect(glpiAccessFromForm(unchecked, true)).toBe(false);
});
it("creates a default-enabled identity and queues automatic GLPI creation atomically", async () => {
  await savePortalUser(form());
  expect(record).toMatchObject({ glpiAccess: true });
  expect(outbox).toHaveBeenCalledWith(
    expect.objectContaining({
      create: expect.objectContaining({
        applicationId: "synthetic-glpi",
        userId: "synthetic-user",
      }),
    }),
  );
});
it("saves a legacy account without a stored value as enabled", async () => {
  record = { id: "synthetic-user" };
  await savePortalUser(form(true));
  expect(record).toMatchObject({ glpiAccess: true });
});
it("persists explicit false through reloading, unrelated editing and SSO identity editing", async () => {
  await savePortalUser(form());
  const unchecked = form(true);
  unchecked.set("glpiAccessPresent", "1");
  await savePortalUser(unchecked);
  expect(record).toMatchObject({ glpiAccess: false });
  const otherEdit = form(true);
  otherEdit.set("displayName", "Synthetic Edited");
  await savePortalUser(otherEdit);
  expect(record).toMatchObject({
    glpiAccess: false,
    displayName: "Synthetic Edited",
  });
  otherEdit.set("glpiAccessPresent", "1");
  otherEdit.set("glpiAccess", "on");
  await savePortalUser(otherEdit);
  expect(record).toMatchObject({ glpiAccess: true });
});

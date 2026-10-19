import { describe, it, expect, vi } from "vitest";
import type { Prisma } from "@prisma/client";
import { assignDefaultGlpiAccess } from "@/lib/default-glpi-access";

function fixture(
  profile: object | null = {
    id: "synthetic-access",
    applicationId: "synthetic-glpi",
  },
) {
  const calls = {
    applicationProfile: { findFirst: vi.fn().mockResolvedValue(profile) },
    userApplicationProfile: { upsert: vi.fn() },
    applicationProvisioningOutbox: { upsert: vi.fn() },
    auditLog: { create: vi.fn() },
  };
  return { calls, tx: calls as unknown as Prisma.TransactionClient };
}
describe("default GLPI access", () => {
  it("grants only the configured minimal GLPI profile and queues provisioning", async () => {
    const { calls, tx } = fixture();
    expect(await assignDefaultGlpiAccess(tx, "synthetic-user", true)).toBe(
      true,
    );
    expect(calls.applicationProfile.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          key: "ACCESS",
          active: true,
          isDefault: true,
          application: { code: "GLPI", active: true },
        },
      }),
    );
    expect(calls.userApplicationProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: {},
        create: {
          userId: "synthetic-user",
          profileId: "synthetic-access",
          assignedBy: "policy:glpi-default",
        },
      }),
    );
    expect(calls.applicationProvisioningOutbox.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: {} }),
    );
    expect(calls.auditLog.create).toHaveBeenCalledOnce();
  });
  it("does not grant access to a disabled user", async () => {
    const { calls, tx } = fixture();
    expect(await assignDefaultGlpiAccess(tx, "synthetic-user", false)).toBe(
      false,
    );
    expect(calls.applicationProfile.findFirst).not.toHaveBeenCalled();
  });
  it("does not invent a profile if the catalogue is unconfigured", async () => {
    const { calls, tx } = fixture(null);
    expect(await assignDefaultGlpiAccess(tx, "synthetic-user", true)).toBe(
      false,
    );
    expect(calls.userApplicationProfile.upsert).not.toHaveBeenCalled();
  });
});

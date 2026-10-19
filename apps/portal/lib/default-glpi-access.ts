import type { Prisma } from "@prisma/client";

// Call only when creating a portal identity, never during an identity refresh.
export async function assignDefaultGlpiAccess(
  tx: Prisma.TransactionClient,
  userId: string,
  active: boolean,
) {
  if (!active) return false;
  const profile = await tx.applicationProfile.findFirst({
    where: {
      key: "ACCESS",
      isDefault: true,
      active: true,
      application: { code: "GLPI", active: true },
    },
    select: { id: true, applicationId: true },
  });
  if (!profile) return false;
  await tx.userApplicationProfile.upsert({
    where: { userId_profileId: { userId, profileId: profile.id } },
    update: {},
    create: {
      userId,
      profileId: profile.id,
      assignedBy: "policy:glpi-default",
    },
  });
  await tx.applicationProvisioningOutbox.upsert({
    where: {
      userId_applicationId: { userId, applicationId: profile.applicationId },
    },
    update: {},
    create: {
      userId,
      applicationId: profile.applicationId,
      profileId: profile.id,
      idempotencyKey: `${userId}:${profile.applicationId}`,
    },
  });
  await tx.auditLog.create({
    data: {
      userId: "policy:glpi-default",
      eventType: "APPLICATION_ACCESS_GRANTED",
      entityType: "PortalUser",
      entityId: userId,
      afterData: {
        application: "GLPI",
        profile: "ACCESS",
        provisioning: "QUEUED",
      },
    },
  });
  return true;
}

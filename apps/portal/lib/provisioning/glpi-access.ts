import type { Prisma } from "@prisma/client";

// The presence marker distinguishes an unchecked checkbox from an unrelated edit.
export function glpiAccessFromForm(form: FormData, stored?: boolean | null) {
  return form.get("glpiAccessPresent") === "1"
    ? form.get("glpiAccess") === "on"
    : (stored ?? true);
}

export async function queueGlpiProvisioning(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  const application = await tx.application.findUnique({
    where: { code: "GLPI" },
    select: { id: true },
  });
  if (!application) return; // No GLPI integration in this installation.
  // ACCESS is an outbox reference, never a GLPI business role.
  const profile = await tx.applicationProfile.upsert({
    where: {
      applicationId_key: { applicationId: application.id, key: "ACCESS" },
    },
    update: {},
    create: {
      applicationId: application.id,
      key: "ACCESS",
      name: "Accès à GLPI",
    },
  });
  await tx.applicationProvisioningOutbox.upsert({
    where: { userId_applicationId: { userId, applicationId: application.id } },
    create: {
      idempotencyKey: `${userId}:${application.id}`,
      userId,
      applicationId: application.id,
      profileId: profile.id,
    },
    update: {
      profileId: profile.id,
      status: "PENDING",
      attempts: 0,
      lastError: null,
      nextAttemptAt: new Date(),
    },
  });
}

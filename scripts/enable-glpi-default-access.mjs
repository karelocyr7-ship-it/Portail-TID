// Run in the portal container. Dry-run by default; no credentials or PII output.
import { createRequire } from "node:module";
const require = createRequire("/app/apps/portal/package.json");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const actor = "policy:glpi-default-20261019";
try {
  await db.$transaction(
    async (tx) => {
      const app = await tx.application.findUnique({
        where: { code: "GLPI" },
        include: { profiles: true },
      });
      if (!app?.active) throw Error();
      const profile = app.profiles.find((p) => p.key === "ACCESS" && p.active);
      if (
        !profile ||
        app.profiles.some((p) => p.isDefault && p.id !== profile.id)
      )
        throw Error();
      const users = await tx.portalUser.findMany({
        where: {
          active: true,
          assignments: { none: { profile: { applicationId: app.id } } },
        },
        select: {
          id: true,
          provisioningJobs: {
            where: { applicationId: app.id },
            select: { id: true },
          },
        },
      });
      // A prior job without an assignment can represent an explicit withdrawal.
      const candidates = users.filter((u) => u.provisioningJobs.length === 0);
      const apply = process.argv.includes("--apply");
      if (apply) {
        if (!profile.isDefault) {
          await tx.applicationProfile.update({
            where: { id: profile.id },
            data: { isDefault: true },
          });
          await tx.auditLog.create({
            data: {
              userId: actor,
              eventType: "GLPI_DEFAULT_PROFILE_ENABLED",
              entityType: "ApplicationProfile",
              entityId: profile.id,
              beforeData: { isDefault: false },
              afterData: { isDefault: true },
            },
          });
        }
        for (const user of candidates) {
          await tx.userApplicationProfile.create({
            data: { userId: user.id, profileId: profile.id, assignedBy: actor },
          });
          await tx.applicationProvisioningOutbox.create({
            data: {
              userId: user.id,
              applicationId: app.id,
              profileId: profile.id,
              idempotencyKey: `${user.id}:${app.id}`,
            },
          });
          await tx.auditLog.create({
            data: {
              userId: actor,
              eventType: "APPLICATION_ACCESS_GRANTED",
              entityType: "PortalUser",
              entityId: user.id,
              afterData: {
                application: "GLPI",
                profile: "ACCESS",
                provisioning: "QUEUED",
              },
            },
          });
        }
      }
      console.log(
        JSON.stringify({
          applied: apply,
          eligibleActiveUsers: candidates.length,
          priorWithdrawalsPreserved: users.length - candidates.length,
          defaultProfile: "ACCESS",
          localGlpiAccountsCreated: false,
        }),
      );
    },
    { timeout: 60000, isolationLevel: "Serializable" },
  );
} catch {
  console.error(
    "GLPI default access failed; transaction rolled back, no secrets displayed.",
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}

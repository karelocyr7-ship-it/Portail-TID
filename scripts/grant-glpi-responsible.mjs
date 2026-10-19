// Accès catalogue nominatif uniquement ; aucun droit interne GLPI modifié.
import { createRequire } from "node:module";
const require = createRequire("/app/apps/portal/package.json");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
try {
  await db.$transaction(async (tx) => {
    const users = await tx.portalUser.findMany({
      where: { email: { equals: "c.navarre@atf.onl", mode: "insensitive" } },
    });
    if (users.length !== 1 || !users[0].active)
      throw Error("Ambiguous or inactive target");
    const user = users[0];
    if (
      ![user.employeeId, user.sageEmployeeId].some(
        (v) => v?.toUpperCase() === "TIDC777",
      )
    )
      throw Error("Identity mismatch");
    const app = await tx.application.findUnique({ where: { code: "GLPI" } });
    if (!app?.active || app.url !== "https://glpi.tadgroupe.com")
      throw Error("Unexpected application");
    const profile = await tx.applicationProfile.upsert({
      where: { applicationId_key: { applicationId: app.id, key: "ACCESS" } },
      update: {},
      create: {
        applicationId: app.id,
        key: "ACCESS",
        name: "Accès GLPI",
        description: "Accès au lien ; droits gérés localement dans GLPI",
        sourceSystem: "manual-local",
        active: true,
      },
    });
    if (!profile.active) throw Error("Inactive profile");
    const existing = await tx.userApplicationProfile.findUnique({
      where: { userId_profileId: { userId: user.id, profileId: profile.id } },
    });
    if (!existing) {
      await tx.userApplicationProfile.create({
        data: {
          userId: user.id,
          profileId: profile.id,
          assignedBy: "deployment:glpi-responsible",
        },
      });
      await tx.auditLog.create({
        data: {
          userId: "deployment:glpi-responsible",
          eventType: "APPLICATION_ACCESS_GRANTED",
          entityType: "Application",
          entityId: app.id,
          afterData: {
            targetUserId: user.id,
            profile: "ACCESS",
            application: "GLPI",
            localPermissionsChanged: false,
          },
        },
      });
    }
    const visible = await tx.application.findFirst({
      where: {
        id: app.id,
        active: true,
        profiles: {
          some: { active: true, assignments: { some: { userId: user.id } } },
        },
      },
      select: { code: true },
    });
    if (!visible) throw Error("Assignment verification failed");
  });
  console.log(
    JSON.stringify({
      application: "GLPI",
      target: "TIDC777",
      explicitAccess: true,
      localPermissionsChanged: false,
    }),
  );
} catch {
  console.error(
    "Attribution GLPI refusée sans divulgation de données sensibles",
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}

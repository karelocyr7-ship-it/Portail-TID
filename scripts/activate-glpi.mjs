// Activation limitée à GLPI, après TLS valide. Aucun rôle ni compte modifié.
import { createRequire } from "node:module";
const require = createRequire("/app/apps/portal/package.json");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
try {
  const response = await fetch("https://glpi.tadgroupe.com/", {
    redirect: "manual",
    signal: AbortSignal.timeout(15000),
  });
  if (response.status !== 200) throw Error("HTTPS not ready");
  await prisma.$transaction(async (tx) => {
    const app = await tx.application.findUnique({ where: { code: "GLPI" } });
    if (
      !app ||
      app.url !== "https://glpi.tadgroupe.com" ||
      app.integrationLevel !== 1
    )
      throw Error("Unexpected catalogue");
    if (app.active) return;
    await tx.application.update({
      where: { id: app.id },
      data: { active: true },
    });
    await tx.auditLog.create({
      data: {
        userId: "deployment:glpi",
        eventType: "APPLICATION_ACTIVATED",
        entityType: "Application",
        entityId: app.id,
        beforeData: { active: false },
        afterData: { active: true },
      },
    });
  });
  const app = await prisma.application.findUnique({
    where: { code: "GLPI" },
    select: {
      code: true,
      active: true,
      integrationLevel: true,
      roles: { select: { keycloakRole: true } },
    },
  });
  console.log(JSON.stringify(app));
} catch {
  console.error(
    "Activation GLPI refusée, sans divulgation de données sensibles.",
  );
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

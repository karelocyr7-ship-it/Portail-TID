// Run inside the portal runtime; do not print environment values or secrets.
import { createRequire } from "node:module";

const require = createRequire("/app/apps/portal/package.json");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const previousName = "GLPI – Support IT & Parc Informatique";
const nextName = "Support Informatique";

try {
  const result = await prisma.$transaction(async (tx) => {
    const application = await tx.application.findUnique({
      where: { code: "GLPI" },
    });
    const applicationUrl = application ? new URL(application.url) : null;
    if (
      !applicationUrl ||
      applicationUrl.origin !== "https://glpi.tadgroupe.com" ||
      applicationUrl.pathname !== "/"
    ) {
      throw new Error("GLPI catalog entry not found or URL mismatch");
    }
    if (application.name === nextName) {
      return { updated: false, name: application.name };
    }
    if (application.name !== previousName) {
      throw new Error("GLPI catalog label changed unexpectedly");
    }

    const updated = await tx.application.update({
      where: { code: "GLPI" },
      data: { name: nextName },
    });
    await tx.auditLog.create({
      data: {
        userId: "deployment:glpi-catalog-label",
        eventType: "APPLICATION_NAME_UPDATED",
        entityType: "Application",
        entityId: application.id,
        beforeData: { code: "GLPI", name: previousName },
        afterData: { code: "GLPI", name: updated.name },
      },
    });
    return { updated: true, name: updated.name };
  });
  console.log(JSON.stringify({ code: "GLPI", ...result }));
} catch {
  console.error("Renommage de la fiche GLPI refusé; aucune donnée affichée.");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

// Run inside portal runtime, without printing its environment or reading .env.
import { createRequire } from "node:module";
const require = createRequire("/app/apps/portal/package.json");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
try {
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.application.findUnique({
      where: { code: "GLPI" },
    });
    if (existing) {
      if (existing.url !== "https://glpi.tadgroupe.com")
        throw Error("Conflict");
      return { created: false, active: existing.active };
    }
    const category = await tx.category.upsert({
      where: { name: "Support / Informatique" },
      update: {},
      create: {
        name: "Support / Informatique",
        description: "Support et parc informatique",
        displayOrder: 80,
      },
    });
    const app = await tx.application.create({
      data: {
        code: "GLPI",
        name: "GLPI – Support IT & Parc Informatique",
        description:
          "TID — Gestion des demandes informatiques, incidents, interventions et inventaire du parc.",
        categoryId: category.id,
        url: "https://glpi.tadgroupe.com",
        icon: "🛠️",
        integrationLevel: 1,
        active: false,
        displayOrder: 10,
        roles: { create: [{ keycloakRole: "PORTAL_ADMIN" }] },
      },
    });
    await tx.auditLog.create({
      data: {
        userId: "deployment:glpi",
        eventType: "APPLICATION_CREATED",
        entityType: "Application",
        entityId: app.id,
        afterData: { code: "GLPI", active: false, integrationLevel: 1 },
      },
    });
    return { created: true, active: false };
  });
  console.log(JSON.stringify({ code: "GLPI", ...result }));
} catch {
  console.error(
    "Enregistrement GLPI refusé ; aucune donnée sensible affichée.",
  );
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

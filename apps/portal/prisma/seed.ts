import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const categories = [
  ["Pilotage", "Tableaux de pilotage et indicateurs", 1],
  ["Finance", "Applications financières", 2],
  ["Terrain", "Outils pour les équipes terrain", 3],
  ["Ressources humaines", "Outils RH", 4],
  ["Parc automobile", "Gestion du parc automobile", 5],
  ["Administration", "Documents et fonctions administratives", 6],
  ["Informatique", "Outils techniques et référentiels", 7],
] as const;

const applications = [
  [
    "CASH-RECON",
    "CASH-RECON",
    "Rapprochement financier",
    "Finance",
    ["PORTAL_ADMIN", "DIRECTION", "FINANCE"],
  ],
  [
    "TDB",
    "TDB",
    "Tableau de bord de pilotage",
    "Pilotage",
    ["PORTAL_ADMIN", "DIRECTION", "SUPERVISEUR"],
  ],
  [
    "GPARC",
    "GPARC",
    "Gestion du parc automobile",
    "Parc automobile",
    ["PORTAL_ADMIN", "GESTIONNAIRE_PARC", "DIRECTION"],
  ],
  [
    "REVUE-PDV",
    "Revue-PDV",
    "Revue des points de vente",
    "Terrain",
    ["PORTAL_ADMIN", "SUPERVISEUR", "AGENT_TERRAIN", "DIRECTION"],
  ],
  [
    "ATF",
    "ATF",
    "Application terrain",
    "Terrain",
    ["PORTAL_ADMIN", "SUPERVISEUR", "DIRECTION"],
  ],
  [
    "MDM",
    "MDM",
    "Master Data Management",
    "Informatique",
    ["PORTAL_ADMIN", "INFORMATIQUE"],
  ],
  [
    "SIRH",
    "SIRH",
    "Système d’information RH",
    "Ressources humaines",
    ["PORTAL_ADMIN", "RH", "DIRECTION"],
  ],
  [
    "GED",
    "GED",
    "Gestion électronique des documents",
    "Administration",
    ["PORTAL_ADMIN", "RH", "DIRECTION"],
  ],
  [
    "RECRUTEMENT",
    "Recrutement",
    "Suivi des recrutements",
    "Ressources humaines",
    ["PORTAL_ADMIN", "RH", "DIRECTION"],
  ],
  [
    "CA",
    "Suivi du chiffre d’affaires",
    "Suivi du chiffre d’affaires",
    "Finance",
    ["PORTAL_ADMIN", "DIRECTION", "FINANCE"],
  ],
] as const;

export { applications, categories };

const profileNames: Record<string, string> = {
  PORTAL_ADMIN: "Administrateur portail",
  DIRECTION: "Direction",
  FINANCE: "Finance",
  SUPERVISEUR: "Superviseur",
  AGENT_TERRAIN: "Agent terrain",
  GESTIONNAIRE_PARC: "Gestionnaire parc",
  RH: "Ressources humaines",
  INFORMATIQUE: "Informatique",
};

async function main() {
  const categoryIds = new Map<string, string>();

  for (const [name, description, displayOrder] of categories) {
    const category = await prisma.category.upsert({
      where: { name },
      update: { description, displayOrder, active: true },
      create: { name, description, displayOrder },
    });
    categoryIds.set(name, category.id);
  }

  for (const [code, name, description, categoryName, roles] of applications) {
    const application = await prisma.application.upsert({
      where: { code },
      update: {
        name,
        description,
        categoryId: categoryIds.get(categoryName)!,
        active: true,
        maintenance: false,
      },
      create: {
        code,
        name,
        description,
        categoryId: categoryIds.get(categoryName)!,
        icon: code.slice(0, 1),
        active: true,
        displayOrder: categoryIds.size,
      },
    });

    await prisma.applicationRole.deleteMany({
      where: { applicationId: application.id },
    });
    await prisma.applicationRole.createMany({
      data: roles.map((keycloakRole) => ({
        applicationId: application.id,
        keycloakRole,
      })),
      skipDuplicates: true,
    });

    for (const [displayOrder, key] of roles.entries()) {
      await prisma.applicationProfile.upsert({
        where: {
          applicationId_key: { applicationId: application.id, key },
        },
        update: {
          name: profileNames[key] ?? key,
          description: "Profil déclaré dans le catalogue du portail",
          active: true,
          displayOrder,
        },
        create: {
          applicationId: application.id,
          key,
          name: profileNames[key] ?? key,
          description: "Profil déclaré dans le catalogue du portail",
          displayOrder,
        },
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Seed failed");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

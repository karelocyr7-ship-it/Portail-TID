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
  ["Recrutement OCI", "Recrutement Telco et OM pour OCI", 8],
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
    "Recrutement Telco & OM",
    "Recrutement Telco et OM pour Orange Côte d’Ivoire",
    "Recrutement OCI",
    ["PORTAL_ADMIN", "RH", "DIRECTION"],
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

type ProfileDefinition = {
  key: string;
  name: string;
  description: string;
  sourceSystem: string;
  sourceReference: string;
};

const profileDefinitions: Record<string, ProfileDefinition[]> = {
  TDB: [
    ["ADMIN", "Administrateur TDB", "Administration des comptes et données"],
    ["MANAGER", "Manager", "Pilotage des indicateurs et équipes"],
    ["SUPERVISOR", "Superviseur", "Suivi opérationnel et supervision"],
    ["DIRECTION", "Direction", "Consultation direction"],
    ["VIEWER", "Consultation", "Accès en lecture seule"],
  ].map(([key, name, description]) => ({
    key,
    name,
    description,
    sourceSystem: "TDB",
    sourceReference: "backend/src/routes/users.js:roles",
  })),
  "REVUE-PDV": [
    ["super_admin", "Super administrateur", "Administration globale"],
    ["admin", "Administrateur", "Administration de Revue-PDV"],
    ["ro", "Responsable Orange", "Pilotage de la branche Orange"],
    ["rc", "Responsable Canal", "Pilotage de la branche Canal+"],
    ["sup_orange", "Superviseur Orange", "Suivi terrain Orange"],
    ["rz", "Responsable de zone", "Suivi terrain Canal+"],
  ].map(([key, name, description]) => ({
    key,
    name,
    description,
    sourceSystem: "REVUE-PDV",
    sourceReference: ["ro", "rc", "sup_orange", "rz"].includes(key)
      ? "api/src/lib/branches.js:DEFAULT_BRANCHES"
      : "db/init.sql:users.role",
  })),
  "CASH-RECON": [
    [
      "ADMIN",
      "Administrateur CASH-RECON",
      "Administration des comptes et référentiels",
    ],
    ["DAF", "Direction financière", "Pilotage financier et arbitrages"],
    ["DG", "Direction générale", "Consultation et validation direction"],
    ["TRESORIER", "Trésorier", "Gestion de la trésorerie"],
    [
      "CASH_MANAGER",
      "Cash Manager",
      "Gestion opérationnelle des encaissements",
    ],
    ["VIEWER", "Consultation", "Accès en lecture seule"],
  ].map(([key, name, description]) => ({
    key,
    name,
    description,
    sourceSystem: "CASH-RECON",
    sourceReference: "api/src/routes/users.routes.js:USER_ROLES",
  })),
  MDM: [
    [
      "ADMIN",
      "Administrateur HMDM",
      "Administration complète de la plateforme et des utilisateurs",
    ],
    ["USER", "Utilisateur HMDM", "Gestion des appareils et des applications"],
    [
      "OBSERVER",
      "Observateur HMDM",
      "Consultation de l’état et des informations des appareils",
    ],
  ].map(([key, name, description]) => ({
    key,
    name,
    description,
    sourceSystem: "HMDM",
    sourceReference: "Headwind MDM Community: user roles",
  })),
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

    const definitions =
      profileDefinitions[code] ??
      roles.map((key) => ({
        key,
        name: profileNames[key] ?? key,
        description: "Profil déclaré dans le catalogue du portail",
        sourceSystem: "portal-catalog",
        sourceReference: "apps/portal/prisma/seed.ts",
      }));
    for (const [displayOrder, profile] of definitions.entries()) {
      await prisma.applicationProfile.upsert({
        where: {
          applicationId_key: {
            applicationId: application.id,
            key: profile.key,
          },
        },
        update: {
          name: profile.name,
          description: profile.description,
          sourceSystem: profile.sourceSystem,
          sourceReference: profile.sourceReference,
          syncedAt: new Date(),
          active: true,
          displayOrder,
        },
        create: {
          applicationId: application.id,
          key: profile.key,
          name: profile.name,
          description: profile.description,
          sourceSystem: profile.sourceSystem,
          sourceReference: profile.sourceReference,
          syncedAt: new Date(),
          displayOrder,
        },
      });
    }
  }

  await prisma.application.updateMany({
    where: { code: "CA" },
    data: {
      active: false,
      maintenance: true,
      maintenanceMessage: "Application future TID+ / Canal+",
    },
  });
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Seed failed");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

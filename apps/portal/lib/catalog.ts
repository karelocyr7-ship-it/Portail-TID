export type PortalRole =
  | "PORTAL_ADMIN"
  | "DIRECTION"
  | "FINANCE"
  | "SUPERVISEUR"
  | "AGENT_TERRAIN"
  | "GESTIONNAIRE_PARC"
  | "AUDITEUR"
  | "RH"
  | "INFORMATIQUE";

export type CatalogApplication = {
  code: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  integrationLevel: 1 | 2 | 3;
  active: boolean;
  maintenance?: boolean;
  maintenanceMessage?: string;
  url?: string;
  roles: PortalRole[];
};

export type PortalCatalogAccess = {
  managed: boolean;
  active: boolean;
  applicationIds: string[];
};

export function canReadCatalog(
  roles: readonly string[],
  access: PortalCatalogAccess,
): boolean {
  if (roles.includes("PORTAL_ADMIN")) return true;
  if (access.managed) return access.active && access.applicationIds.length > 0;
  return roles.length > 0;
}

export const catalogApplications: CatalogApplication[] = [
  {
    code: "CASH-RECON",
    name: "CASH-RECON",
    description: "Rapprochement financier",
    category: "Finance",
    icon: "€",
    integrationLevel: 1,
    active: true,
    roles: ["PORTAL_ADMIN", "DIRECTION", "FINANCE"],
  },
  {
    code: "TDB",
    name: "TDB",
    description: "Tableau de bord de pilotage",
    category: "Pilotage",
    icon: "▥",
    integrationLevel: 1,
    active: true,
    roles: ["PORTAL_ADMIN", "DIRECTION", "SUPERVISEUR"],
  },
  {
    code: "GPARC",
    name: "GPARC",
    description: "Gestion du parc automobile",
    category: "Parc automobile",
    icon: "▣",
    integrationLevel: 1,
    active: true,
    roles: ["PORTAL_ADMIN", "GESTIONNAIRE_PARC", "DIRECTION"],
  },
  {
    code: "REVUE-PDV",
    name: "Revue-PDV",
    description: "Revue des points de vente",
    category: "Terrain",
    icon: "⌖",
    integrationLevel: 1,
    active: true,
    roles: ["PORTAL_ADMIN", "SUPERVISEUR", "AGENT_TERRAIN", "DIRECTION"],
  },
  {
    code: "ATF",
    name: "ATF",
    description: "Application terrain",
    category: "Terrain",
    icon: "↗",
    integrationLevel: 1,
    active: true,
    roles: ["PORTAL_ADMIN", "SUPERVISEUR", "DIRECTION"],
  },
  {
    code: "MDM",
    name: "MDM",
    description: "Référentiel des données",
    category: "Informatique",
    icon: "⌘",
    integrationLevel: 1,
    active: true,
    roles: ["PORTAL_ADMIN", "INFORMATIQUE"],
  },
  {
    code: "SIRH",
    name: "SIRH",
    description: "Système d’information RH",
    category: "Ressources humaines",
    icon: "♙",
    integrationLevel: 1,
    active: true,
    roles: ["PORTAL_ADMIN", "RH", "DIRECTION"],
  },
  {
    code: "GED",
    name: "GED",
    description: "Gestion électronique des documents",
    category: "Administration",
    icon: "▤",
    integrationLevel: 1,
    active: true,
    roles: ["PORTAL_ADMIN", "RH", "DIRECTION"],
  },
  {
    code: "RECRUTEMENT",
    name: "Recrutement",
    description: "Suivi des recrutements",
    category: "Ressources humaines",
    icon: "✦",
    integrationLevel: 1,
    active: true,
    roles: ["PORTAL_ADMIN", "RH", "DIRECTION"],
  },
  {
    code: "CA",
    name: "Suivi du chiffre d’affaires",
    description: "Indicateurs de chiffre d’affaires",
    category: "Finance",
    icon: "↗",
    integrationLevel: 1,
    active: true,
    roles: ["PORTAL_ADMIN", "DIRECTION", "FINANCE"],
  },
];

export function hasRoleAccess(
  application: CatalogApplication,
  roles: readonly string[],
): boolean {
  if (roles.includes("PORTAL_ADMIN")) return true;
  return application.roles.some((role) => roles.includes(role));
}

export function getVisibleApplications(
  roles: readonly string[],
): CatalogApplication[] {
  return catalogApplications.filter(
    (application) => application.active && hasRoleAccess(application, roles),
  );
}

export function getDevelopmentRoles(): PortalRole[] {
  if (process.env.NODE_ENV !== "development") return [];
  return (process.env.PORTAL_DEMO_ROLES ?? "DIRECTION")
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean) as PortalRole[];
}

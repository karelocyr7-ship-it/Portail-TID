import { getPrisma } from "@/lib/prisma";
import {
  canReadCatalog,
  defaultVisibleApplicationCodes,
  type CatalogApplication,
} from "@/lib/catalog";
import { getPortalUserAccess } from "@/lib/portal-users";

export async function getVisibleApplicationsFromDatabase(
  roles: readonly string[],
  subject?: string,
  sageId?: string,
  employeeId?: string,
  email?: string,
): Promise<CatalogApplication[]> {
  if (!subject) return [];
  const prisma = getPrisma();
  const isAdmin = roles.includes("PORTAL_ADMIN");
  const portalUserAccess = {
    ...(await getPortalUserAccess({ subject, sageId, employeeId, email })),
    authenticated: true,
  };
  if (!canReadCatalog(roles, portalUserAccess)) return [];
  const applications = await prisma.application.findMany({
    where: {
      active: true,
      ...(isAdmin
        ? {}
        : portalUserAccess.managed
          ? {
              OR: [
                { id: { in: portalUserAccess.applicationIds } },
                { code: { in: [...defaultVisibleApplicationCodes] } },
              ],
            }
          : {
              OR: [
                { roles: { some: { keycloakRole: { in: [...roles] } } } },
                { code: { in: [...defaultVisibleApplicationCodes] } },
              ],
            }),
    },
    include: { category: true, roles: true },
    orderBy: [{ category: { displayOrder: "asc" } }, { displayOrder: "asc" }],
  });

  return applications.map((application) => ({
    code: application.code,
    name: application.code === "TDB" ? "Perf-TID" : application.name,
    description: application.description,
    category: application.category.name,
    icon: application.icon,
    integrationLevel: application.integrationLevel as 1 | 2 | 3,
    active: application.active,
    availableToAllUsers: defaultVisibleApplicationCodes.includes(
      application.code as (typeof defaultVisibleApplicationCodes)[number],
    ),
    maintenance: application.maintenance,
    maintenanceMessage: application.maintenanceMessage ?? undefined,
    url:
      application.code === "RECRUTEMENT"
        ? "https://recrut-oci.tadgroupe.com/?sso=1"
        : application.code === "GPARC"
          ? "https://gparc.tadgroupe.com/api/oidc/start"
          : application.code === "MDM"
            ? "https://mdm.tadgroupe.com/rest/public/auth/oidc/login"
            : application.code === "REVUE-PDV"
              ? "https://pdv.tadgroupe.com/api/auth/oidc/start"
              : application.url ??
                (application.code === "TDB"
                  ? "https://perf-tid.tadgroupe.com"
                  : undefined),
    roles: application.roles.map((role) => role.keycloakRole) as CatalogApplication["roles"],
  }));
}

export async function getAdminApplications(): Promise<CatalogApplication[]> {
  const applications = await getPrisma().application.findMany({
    include: { category: true, roles: true },
    orderBy: [{ category: { displayOrder: "asc" } }, { displayOrder: "asc" }],
  });

  return applications.map((application) => ({
    code: application.code,
    name: application.code === "TDB" ? "Perf-TID" : application.name,
    description: application.description,
    category: application.category.name,
    icon: application.icon,
    integrationLevel: application.integrationLevel as 1 | 2 | 3,
    active: application.active,
    maintenance: application.maintenance,
    maintenanceMessage: application.maintenanceMessage ?? undefined,
    url: application.url ?? undefined,
    roles: application.roles.map((role) => role.keycloakRole) as CatalogApplication["roles"],
  }));
}

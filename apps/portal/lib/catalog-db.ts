import { getPrisma } from "@/lib/prisma";
import type { CatalogApplication } from "@/lib/catalog";

export async function getVisibleApplicationsFromDatabase(
  roles: readonly string[],
): Promise<CatalogApplication[]> {
  if (roles.length === 0) return [];

  const prisma = getPrisma();
  const isAdmin = roles.includes("PORTAL_ADMIN");
  const applications = await prisma.application.findMany({
    where: {
      active: true,
      ...(isAdmin
        ? {}
        : { roles: { some: { keycloakRole: { in: [...roles] } } } }),
    },
    include: { category: true, roles: true },
    orderBy: [{ category: { displayOrder: "asc" } }, { displayOrder: "asc" }],
  });

  return applications.map((application) => ({
    code: application.code,
    name: application.name,
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

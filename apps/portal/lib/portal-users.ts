import { getPrisma } from "@/lib/prisma";

export async function getAdminProfiles() {
  return getPrisma().applicationProfile.findMany({
    where: { active: true, application: { active: true } },
    include: { application: true },
    orderBy: [
      { application: { displayOrder: "asc" } },
      { displayOrder: "asc" },
      { name: "asc" },
    ],
  });
}

export async function getAdminUsers() {
  return getPrisma().portalUser.findMany({
    include: {
      assignments: {
        include: { profile: { include: { application: true } } },
        orderBy: { profile: { name: "asc" } },
      },
    },
    orderBy: [{ active: "desc" }, { displayName: "asc" }],
  });
}

export async function getPortalUserAccess(subject: string) {
  const user = await getPrisma().portalUser.findUnique({
    where: { keycloakSubject: subject },
    include: {
      assignments: {
        where: { profile: { active: true, application: { active: true } } },
        select: { profile: { select: { applicationId: true } } },
      },
    },
  });

  return {
    managed: Boolean(user),
    active: user?.active ?? false,
    applicationIds:
      user?.assignments.map(({ profile }) => profile.applicationId) ?? [],
  };
}

import { getPrisma } from "@/lib/prisma";
import type { PortalSession } from "@/lib/oidc";
import {
  canAutomaticallyReconcileSubject,
  trustedIdentityEmail,
} from "@/lib/identity-reconciliation";

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

export async function reconcilePortalUserSubject(identity: PortalSession) {
  const trustedEmail = trustedIdentityEmail(identity);
  if (!trustedEmail) return false;

  const prisma = getPrisma();
  const existingSubject = await prisma.portalUser.findUnique({
    where: { keycloakSubject: identity.subject },
    select: { id: true },
  });
  if (existingSubject) return false;

  const candidates = await prisma.portalUser.findMany({
    where: { email: { equals: trustedEmail, mode: "insensitive" } },
    select: { id: true, keycloakSubject: true, email: true },
    take: 2,
  });
  if (
    candidates.length !== 1 ||
    !canAutomaticallyReconcileSubject(candidates[0], identity)
  ) {
    return false;
  }

  const candidate = candidates[0];
  return prisma.$transaction(async (transaction) => {
    const [current, conflict] = await Promise.all([
      transaction.portalUser.findUnique({
        where: { id: candidate.id },
        select: { id: true, keycloakSubject: true, email: true },
      }),
      transaction.portalUser.findUnique({
        where: { keycloakSubject: identity.subject },
        select: { id: true },
      }),
    ]);
    if (
      conflict ||
      !current ||
      !canAutomaticallyReconcileSubject(current, identity)
    ) {
      return false;
    }

    await transaction.portalUser.update({
      where: { id: current.id },
      data: { keycloakSubject: identity.subject },
    });
    await transaction.auditLog.create({
      data: {
        userId: identity.subject,
        eventType: "PORTAL_USER_SUBJECT_RECONCILED",
        entityType: "PortalUser",
        entityId: current.id,
        beforeData: { keycloakSubject: current.keycloakSubject },
        afterData: { keycloakSubject: identity.subject },
      },
    });
    return true;
  });
}

export async function getPortalUserAccess(identity: {
  subject: string;
  employeeId?: string;
}) {
  const user = await getPrisma().portalUser.findUnique({
    where: { keycloakSubject: identity.subject },
    include: {
      assignments: {
        where: { profile: { active: true, application: { active: true } } },
        select: { profile: { select: { applicationId: true } } },
      },
    },
  });

  const resolvedUser =
    user ??
    (identity.employeeId
      ? await getPrisma().portalUser.findUnique({
          where: { employeeId: identity.employeeId },
          include: {
            assignments: {
              where: {
                profile: { active: true, application: { active: true } },
              },
              select: { profile: { select: { applicationId: true } } },
            },
          },
        })
      : null);

  return {
    managed: Boolean(resolvedUser),
    active: resolvedUser?.active ?? false,
    applicationIds:
      resolvedUser?.assignments.map(({ profile }) => profile.applicationId) ??
      [],
  };
}

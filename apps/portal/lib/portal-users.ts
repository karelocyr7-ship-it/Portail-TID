import { getPrisma } from "@/lib/prisma";
import type { PortalSession } from "@/lib/oidc";
import {
  canAutomaticallyReconcileSubject,
  trustedIdentityEmail,
} from "@/lib/identity-reconciliation";
import { normalizeSageId } from "@/lib/sage-id";

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
  const sageId = normalizeSageId(identity.sageId ?? identity.employeeId);
  if (!trustedEmail && !sageId) return false;

  const prisma = getPrisma();
  const existingSubject = await prisma.portalUser.findUnique({
    where: { keycloakSubject: identity.subject },
    select: { id: true },
  });
  if (existingSubject) return false;

  const candidates = sageId
    ? await prisma.portalUser.findMany({
        where: { sageEmployeeId: sageId },
        select: {
          id: true,
          keycloakSubject: true,
          email: true,
          sageEmployeeId: true,
        },
        take: 2,
      })
    : trustedEmail
      ? await prisma.portalUser.findMany({
          where: { email: { equals: trustedEmail, mode: "insensitive" } },
          select: {
            id: true,
            keycloakSubject: true,
            email: true,
            sageEmployeeId: true,
          },
          take: 2,
        })
      : [];
  if (
    candidates.length !== 1 ||
    (!sageId && !canAutomaticallyReconcileSubject(candidates[0], identity))
  ) {
    return false;
  }

  const candidate = candidates[0];
  return prisma.$transaction(async (transaction) => {
    const [current, conflict] = await Promise.all([
      transaction.portalUser.findUnique({
        where: { id: candidate.id },
        select: {
          id: true,
          keycloakSubject: true,
          email: true,
          sageEmployeeId: true,
        },
      }),
      transaction.portalUser.findUnique({
        where: { keycloakSubject: identity.subject },
        select: { id: true },
      }),
    ]);
    if (
      conflict ||
      !current ||
      (!sageId && !canAutomaticallyReconcileSubject(current, identity))
    ) {
      return false;
    }

    await transaction.portalUser.update({
      where: { id: current.id },
      data: {
        keycloakSubject: identity.subject,
        sageEmployeeId: sageId ?? current.sageEmployeeId,
        employeeId: sageId ?? undefined,
      },
    });
    await transaction.auditLog.create({
      data: {
        userId: identity.subject,
        eventType: "PORTAL_USER_SUBJECT_RECONCILED",
        entityType: "PortalUser",
        entityId: current.id,
        beforeData: {
          keycloakSubject: current.keycloakSubject,
          sageEmployeeId: current.sageEmployeeId,
        },
        afterData: {
          keycloakSubject: identity.subject,
          sageEmployeeId: sageId ?? current.sageEmployeeId,
        },
      },
    });
    return true;
  });
}

const accessInclude = {
  assignments: {
    where: { profile: { active: true, application: { active: true } } },
    select: { profile: { select: { applicationId: true } } },
  },
} as const;

export async function getPortalUserAccess(identity: {
  subject: string;
  sageId?: string;
  employeeId?: string;
  email?: string;
}) {
  const prisma = getPrisma();
  const user =
    (await prisma.portalUser.findUnique({
      where: { keycloakSubject: identity.subject },
      include: accessInclude,
    })) ??
    (identity.sageId
      ? await prisma.portalUser.findUnique({
          where: { sageEmployeeId: identity.sageId },
          include: accessInclude,
        })
      : null) ??
    (identity.employeeId
      ? await prisma.portalUser.findUnique({
          where: { employeeId: identity.employeeId },
          include: accessInclude,
        })
      : null) ??
    (identity.email
      ? await prisma.portalUser.findFirst({
          where: { email: { equals: identity.email, mode: "insensitive" } },
          include: accessInclude,
        })
      : null);

  return {
    managed: Boolean(user),
    active: user?.active ?? false,
    applicationIds:
      user?.assignments.map(({ profile }) => profile.applicationId) ?? [],
  };
}

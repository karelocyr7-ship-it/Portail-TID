"use server";

import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/prisma";
import { getRoles, getSession } from "@/lib/oidc";
import { normalizeSageId } from "@/lib/sage-id";
import { provisionKeycloakUser } from "@/lib/keycloak-admin";

const allowedActions = ["toggle-active", "toggle-maintenance"] as const;
type AdminAction = (typeof allowedActions)[number];

async function requireAdmin() {
  const session = await getSession();
  if (!session || !getRoles(session).includes("PORTAL_ADMIN")) {
    throw new Error("Accès administrateur requis");
  }
  return session;
}

export async function updateApplicationStatus(formData: FormData) {
  const session = await requireAdmin();

  const code = formData.get("code");
  const action = formData.get("action");
  if (
    typeof code !== "string" ||
    !code ||
    !allowedActions.includes(action as AdminAction)
  ) {
    throw new Error("Demande d’administration invalide");
  }

  const prisma = getPrisma();
  const application = await prisma.application.findUnique({ where: { code } });
  if (!application) throw new Error("Application introuvable");

  const data =
    action === "toggle-active"
      ? { active: !application.active }
      : { maintenance: !application.maintenance };
  await prisma.$transaction(async (transaction) => {
    const result = await transaction.application.update({
      where: { code },
      data,
    });
    await transaction.auditLog.create({
      data: {
        userId: session!.subject,
        eventType: "APPLICATION_STATUS_UPDATED",
        entityType: "Application",
        entityId: application.id,
        beforeData: {
          active: application.active,
          maintenance: application.maintenance,
        },
        afterData: { active: result.active, maintenance: result.maintenance },
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function updateApplicationUrl(formData: FormData) {
  const session = await requireAdmin();

  const code = formData.get("code");
  const rawUrl = formData.get("url");
  if (typeof code !== "string" || !code || typeof rawUrl !== "string") {
    throw new Error("Demande d’administration invalide");
  }

  const url = rawUrl.trim();
  if (url.length > 2048) throw new Error("URL trop longue");
  if (url) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error("URL invalide");
    }
    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password
    ) {
      throw new Error("L’URL doit utiliser HTTP(S), sans identifiants");
    }
  }

  const prisma = getPrisma();
  const application = await prisma.application.findUnique({ where: { code } });
  if (!application) throw new Error("Application introuvable");

  await prisma.$transaction(async (transaction) => {
    const result = await transaction.application.update({
      where: { code },
      data: { url: url || null },
    });
    await transaction.auditLog.create({
      data: {
        userId: session!.subject,
        eventType: "APPLICATION_URL_UPDATED",
        entityType: "Application",
        entityId: application.id,
        beforeData: { url: application.url },
        afterData: { url: result.url },
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function savePortalUser(formData: FormData) {
  const session = await requireAdmin();
  let keycloakSubject = String(formData.get("keycloakSubject") ?? "").trim();
  const sageIdProvided = formData.has("sageId") || formData.has("employeeId");
  const sageId = normalizeSageId(
    formData.get("sageId") ?? formData.get("employeeId"),
  );
  const email = String(formData.get("email") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const userId = String(formData.get("userId") ?? "").trim();
  const active = formData.get("active") === "on";
  const requestedApplicationIds = formData
    .getAll("applicationIds")
    .filter((value): value is string => typeof value === "string")
    .filter(Boolean);

  if (keycloakSubject.length > 200) {
    throw new Error("Identifiant Keycloak invalide");
  }
  if (sageIdProvided && !sageId) {
    throw new Error("ID Sage invalide");
  }
  if (!displayName || displayName.length > 160) {
    throw new Error("Nom d’affichage invalide");
  }
  if (email.length > 320 || (email && !email.includes("@"))) {
    throw new Error("Adresse e-mail invalide");
  }
  const prisma = getPrisma();
  if (!userId && !keycloakSubject) {
    if (!email)
      throw new Error(
        "Un e-mail est requis pour créer automatiquement le compte Keycloak",
      );
    const provisioned = await provisionKeycloakUser({
      email,
      displayName,
      employeeId: sageId,
    });
    keycloakSubject = provisioned.subject;
  }
  if (!keycloakSubject) throw new Error("Identifiant Keycloak invalide");

  await prisma.$transaction(async (transaction) => {
    const before = userId
      ? await transaction.portalUser.findUnique({
          where: { id: userId },
          include: { assignments: { select: { profileId: true } } },
        })
      : null;
    if (userId && !before) throw new Error("Compte portail introuvable");

    const preserveAssignments = userId && !formData.has("applicationIds");
    const profiles = preserveAssignments
      ? await transaction.applicationProfile.findMany({
          where: {
            id: {
              in: before?.assignments.map(({ profileId }) => profileId) ?? [],
            },
            active: true,
            application: { active: true },
          },
          select: { id: true, applicationId: true },
        })
      : await transaction.applicationProfile.findMany({
          where: {
            applicationId: { in: [...new Set(requestedApplicationIds)] },
            isDefault: true,
            active: true,
            application: { active: true },
          },
          select: { id: true, applicationId: true },
        });
    if (
      !preserveAssignments &&
      new Set(profiles.map(({ applicationId }) => applicationId)).size !==
        new Set(requestedApplicationIds).size
    ) {
      throw new Error(
        "Chaque application sélectionnée doit avoir un profil minimal actif",
      );
    }
    const profileIds = profiles.map(({ id }) => id);

    const user = userId
      ? await transaction.portalUser.update({
          where: { id: userId },
          data: {
            keycloakSubject,
            sageEmployeeId: sageIdProvided
              ? (sageId ?? null)
              : (before?.sageEmployeeId ?? null),
            employeeId: sageIdProvided
              ? (sageId ?? null)
              : (before?.employeeId ?? null),
            email: email || null,
            displayName,
            active,
          },
        })
      : await transaction.portalUser.create({
          data: {
            keycloakSubject,
            sageEmployeeId: sageIdProvided ? (sageId ?? null) : null,
            employeeId: sageIdProvided ? (sageId ?? null) : null,
            email: email || null,
            displayName,
            active,
          },
        });

    await transaction.userApplicationProfile.deleteMany({
      where: { userId: user.id },
    });
    if (profileIds.length > 0) {
      await transaction.userApplicationProfile.createMany({
        data: [...new Set(profileIds)].map((profileId) => ({
          userId: user.id,
          profileId,
          assignedBy: session.subject,
        })),
      });
    }
    await transaction.applicationProvisioningOutbox.updateMany({
      where: {
        userId: user.id,
        applicationId: {
          notIn: profiles.map(({ applicationId }) => applicationId),
        },
      },
      data: {
        status: "REVOKE",
        lastError: null,
        nextAttemptAt: new Date(),
      },
    });
    for (const profile of profiles) {
      await transaction.applicationProvisioningOutbox.upsert({
        where: {
          userId_applicationId: {
            userId: user.id,
            applicationId: profile.applicationId,
          },
        },
        update: {
          profileId: profile.id,
          status: "PENDING",
          lastError: null,
          nextAttemptAt: new Date(),
        },
        create: {
          idempotencyKey: user.id + ":" + profile.applicationId,
          userId: user.id,
          applicationId: profile.applicationId,
          profileId: profile.id,
        },
      });
    }
    await transaction.auditLog.create({
      data: {
        userId: session.subject,
        eventType: userId ? "PORTAL_USER_UPDATED" : "PORTAL_USER_CREATED",
        entityType: "PortalUser",
        entityId: user.id,
        beforeData: before
          ? {
              keycloakSubject: before.keycloakSubject,
              sageEmployeeId: before.sageEmployeeId,
              employeeId: before.employeeId,
              email: before.email,
              displayName: before.displayName,
              active: before.active,
              profileIds: before.assignments.map(({ profileId }) => profileId),
            }
          : undefined,
        afterData: {
          keycloakSubject,
          sageEmployeeId: user.sageEmployeeId,
          employeeId: user.employeeId,
          email: email || null,
          displayName,
          active,
          profileIds: [...new Set(profileIds)],
        },
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deletePortalUser(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) throw new Error("Compte portail invalide");

  const prisma = getPrisma();
  await prisma.$transaction(async (transaction) => {
    const user = await transaction.portalUser.findUnique({
      where: { id: userId },
      include: { assignments: { select: { profileId: true } } },
    });
    if (!user) throw new Error("Compte portail introuvable");
    if (user.keycloakSubject === session.subject) {
      throw new Error(
        "Votre propre compte administrateur ne peut pas être supprimé",
      );
    }

    await transaction.auditLog.create({
      data: {
        userId: session.subject,
        eventType: "PORTAL_USER_DELETED",
        entityType: "PortalUser",
        entityId: user.id,
        beforeData: {
          keycloakSubject: user.keycloakSubject,
          sageEmployeeId: user.sageEmployeeId,
          employeeId: user.employeeId,
          email: user.email,
          displayName: user.displayName,
          active: user.active,
          profileIds: user.assignments.map(({ profileId }) => profileId),
        },
      },
    });
    await transaction.portalUser.delete({ where: { id: userId } });
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function saveCurrentPortalUser(formData: FormData) {
  const session = await requireAdmin();
  const currentUser = new FormData();

  currentUser.set(
    "displayName",
    session.name ?? session.username ?? session.subject,
  );
  currentUser.set("email", session.email ?? session.username ?? "");
  currentUser.set("keycloakSubject", session.subject);
  if (session.sageId ?? session.employeeId)
    currentUser.set("sageId", session.sageId ?? session.employeeId ?? "");
  currentUser.set("active", "on");
  for (const profileId of formData.getAll("profileIds")) {
    if (typeof profileId === "string")
      currentUser.append("profileIds", profileId);
  }

  await savePortalUser(currentUser);
}

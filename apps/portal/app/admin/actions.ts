"use server";

import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/prisma";
import { getRoles, getSession } from "@/lib/oidc";

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
  const keycloakSubject = String(formData.get("keycloakSubject") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const userId = String(formData.get("userId") ?? "").trim();
  const active = formData.get("active") === "on";
  const profileIds = formData
    .getAll("profileIds")
    .filter((value): value is string => typeof value === "string")
    .filter(Boolean);

  if (!keycloakSubject || keycloakSubject.length > 200) {
    throw new Error("Identifiant Keycloak invalide");
  }
  if (!displayName || displayName.length > 160) {
    throw new Error("Nom d’affichage invalide");
  }
  if (email.length > 320 || (email && !email.includes("@"))) {
    throw new Error("Adresse e-mail invalide");
  }

  const prisma = getPrisma();
  const profiles = await prisma.applicationProfile.findMany({
    where: { id: { in: [...new Set(profileIds)] }, active: true },
    select: { id: true },
  });
  if (profiles.length !== new Set(profileIds).size) {
    throw new Error("Un profil sélectionné est invalide ou inactif");
  }

  await prisma.$transaction(async (transaction) => {
    const before = userId
      ? await transaction.portalUser.findUnique({
          where: { id: userId },
          include: { assignments: { select: { profileId: true } } },
        })
      : null;
    if (userId && !before) throw new Error("Compte portail introuvable");

    const user = userId
      ? await transaction.portalUser.update({
          where: { id: userId },
          data: { keycloakSubject, email: email || null, displayName, active },
        })
      : await transaction.portalUser.create({
          data: {
            keycloakSubject,
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
    await transaction.auditLog.create({
      data: {
        userId: session.subject,
        eventType: userId ? "PORTAL_USER_UPDATED" : "PORTAL_USER_CREATED",
        entityType: "PortalUser",
        entityId: user.id,
        beforeData: before
          ? {
              keycloakSubject: before.keycloakSubject,
              email: before.email,
              displayName: before.displayName,
              active: before.active,
              profileIds: before.assignments.map(({ profileId }) => profileId),
            }
          : undefined,
        afterData: {
          keycloakSubject,
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

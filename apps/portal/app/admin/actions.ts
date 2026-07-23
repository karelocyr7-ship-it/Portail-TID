"use server";

import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/prisma";
import { getRoles, getSession } from "@/lib/oidc";

const allowedActions = ["toggle-active", "toggle-maintenance"] as const;
type AdminAction = (typeof allowedActions)[number];

export async function updateApplicationStatus(formData: FormData) {
  const session = await getSession();
  if (!getRoles(session).includes("PORTAL_ADMIN")) {
    throw new Error("Accès administrateur requis");
  }

  const code = formData.get("code");
  const action = formData.get("action");
  if (typeof code !== "string" || !code || !allowedActions.includes(action as AdminAction)) {
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
    const result = await transaction.application.update({ where: { code }, data });
    await transaction.auditLog.create({
      data: {
        userId: session!.subject,
        eventType: "APPLICATION_STATUS_UPDATED",
        entityType: "Application",
        entityId: application.id,
        beforeData: { active: application.active, maintenance: application.maintenance },
        afterData: { active: result.active, maintenance: result.maintenance },
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function updateApplicationUrl(formData: FormData) {
  const session = await getSession();
  if (!getRoles(session).includes("PORTAL_ADMIN")) {
    throw new Error("Accès administrateur requis");
  }

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
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
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

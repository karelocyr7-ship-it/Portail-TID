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

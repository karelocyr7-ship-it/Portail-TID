"use server";

import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/prisma";
import { getRoles, getSession } from "@/lib/oidc";

const decisions = ["APPROVE", "REJECT"] as const;
type Decision = (typeof decisions)[number];

async function requireAdmin() {
  const session = await getSession();
  if (!session || !getRoles(session).includes("PORTAL_ADMIN")) {
    throw new Error("Accès administrateur requis");
  }
  return session;
}

export async function reviewAgentReport(formData: FormData) {
  const session = await requireAdmin();
  const reportId = String(formData.get("reportId") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim() as Decision;

  if (!reportId || !decisions.includes(decision)) {
    throw new Error("Décision d’agent invalide");
  }

  const prisma = getPrisma();
  await prisma.$transaction(async (transaction) => {
    const report = await transaction.agentReport.findUnique({
      where: { id: reportId },
    });
    if (!report) throw new Error("Rapport agent introuvable");
    if (report.status !== "PENDING") {
      throw new Error("Ce rapport a déjà été traité");
    }

    const nextStatus = decision === "APPROVE" ? "APPROVED" : "REJECTED";
    const actionStatus = decision === "APPROVE" ? "QUEUED" : "REJECTED";
    await transaction.agentReport.update({
      where: { id: report.id },
      data: { status: nextStatus },
    });
    await transaction.agentAction.create({
      data: {
        reportId: report.id,
        action: decision,
        status: actionStatus,
        requestedBy: session.subject,
      },
    });
    await transaction.auditLog.create({
      data: {
        userId: session.subject,
        eventType: `AGENT_REPORT_${decision}`,
        entityType: "AgentReport",
        entityId: report.id,
        beforeData: { status: report.status },
        afterData: { status: nextStatus, actionStatus },
      },
    });
  });

  revalidatePath("/admin/agents");
}

"use server";

import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/prisma";
import { getRoles, getSession } from "@/lib/oidc";
import { hashAgentToken } from "@/lib/agents/auth";
import { agentCatalog, isPortalAgentId } from "@/lib/agents/catalog";
import { supportsProductionOperation } from "@/lib/agents/production-operations";

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

export async function queueAgentTask(formData: FormData) {
  const session = await requireAdmin();
  const agentId = String(formData.get("agentId") ?? "").trim();
  const task = String(formData.get("task") ?? "").trim();
  const productionOperation = String(
    formData.get("productionOperation") ?? "NONE",
  ).trim();
  if (!isPortalAgentId(agentId) || task.length < 10 || task.length > 8000)
    throw new Error("Tâche ou agent invalide");
  if (!supportsProductionOperation(agentId, productionOperation))
    throw new Error(
      "Cette opération de production n’est pas autorisée pour cet agent",
    );

  const agent = agentCatalog[agentId];
  const prisma = getPrisma();
  await prisma.$transaction(async (transaction) => {
    const created = await transaction.agentTask.create({
      data: {
        agentId,
        applicationId: agent.applicationId,
        task,
        productionOperation,
        requestedBy: session.subject,
      },
    });
    await transaction.auditLog.create({
      data: {
        userId: session.subject,
        eventType:
          productionOperation === "NONE"
            ? "AGENT_TASK_QUEUED"
            : "AGENT_PRODUCTION_OPERATION_QUEUED",
        entityType: "AgentTask",
        entityId: created.id,
        afterData: {
          agentId,
          applicationId: agent.applicationId,
          productionOperation,
        },
      },
    });
  });
  revalidatePath("/admin/agents");
}

export async function registerAgentCredential(formData: FormData) {
  const session = await requireAdmin();
  const agentId = String(formData.get("agentId") ?? "").trim();
  const tokenHash = String(formData.get("tokenHash") ?? "").trim();
  if (!isPortalAgentId(agentId) || !/^[a-f0-9]{64}$/i.test(tokenHash))
    throw new Error("Identifiant ou empreinte de jeton invalide");

  await getPrisma().agentCredential.upsert({
    where: { agentId },
    create: { agentId, tokenHash: tokenHash.toLowerCase(), active: true },
    update: {
      tokenHash: tokenHash.toLowerCase(),
      active: true,
      lastSeenAt: null,
    },
  });
  await getPrisma().auditLog.create({
    data: {
      userId: session.subject,
      eventType: "AGENT_CREDENTIAL_REGISTERED",
      entityType: "AgentCredential",
      entityId: agentId,
      afterData: { agentId, tokenHash: "stored-hash-only" },
    },
  });
  revalidatePath("/admin/agents");
}

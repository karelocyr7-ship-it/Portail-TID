import { randomUUID } from "node:crypto";
import { getPrisma } from "../prisma";
import { getEmailConfig } from "./config";
import type { EmailStatus, EnqueueEmailInput } from "./types";

const sensitiveKey = /password|token|secret|private.?key|access.?key|refresh|identity.?number|bank|iban|credit.?card/i;

function assertSafePayload(payload: Record<string, unknown>) {
  const visit = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      if (sensitiveKey.test(key)) throw new Error("Sensitive data is not allowed in email payload");
      visit(child);
    }
  };
  visit(payload);
}

export async function enqueueEmail(input: EnqueueEmailInput) {
  const payload = input.variables ?? {};
  assertSafePayload(payload);
  const prisma = getPrisma();
  const idempotencyKey = input.idempotencyKey?.trim() || randomUUID();
  try {
    return await prisma.emailOutbox.create({
      data: {
        idempotencyKey,
        eventType: input.eventType,
        recipient: input.to,
        subject: input.subject,
        templateName: input.template,
        templatePayload: payload,
        priority: input.priority ?? 0,
        maxAttempts: input.maxAttempts ?? getEmailConfig().SMTP_MAX_ATTEMPTS,
      },
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002") {
      return prisma.emailOutbox.findUniqueOrThrow({ where: { idempotencyKey } });
    }
    throw error;
  }
}

export async function claimNextEmail(workerId: string) {
  const prisma = getPrisma();
  return prisma.$transaction(async (transaction) => {
    const rows = await transaction.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "EmailOutbox"
      WHERE ("status" IN ('PENDING', 'RETRY') AND "nextAttemptAt" <= NOW())
         OR ("status" = 'PROCESSING' AND "lockedAt" < NOW() - INTERVAL '10 minutes')
      ORDER BY "priority" DESC, "createdAt" ASC
      FOR UPDATE SKIP LOCKED LIMIT 1
    `;
    const row = rows[0];
    if (!row) return null;
    return transaction.emailOutbox.update({
      where: { id: row.id },
      data: { status: "PROCESSING", lockedAt: new Date(), lockedBy: workerId, attempts: { increment: 1 } },
    });
  });
}

export async function markEmailSent(id: string, workerId: string, providerMessageId: string) {
  return getPrisma().emailOutbox.updateMany({
    where: { id, status: "PROCESSING", lockedBy: workerId },
    data: { status: "SENT", sentAt: new Date(), lockedAt: null, lockedBy: null, providerMessageId },
  });
}

export async function markEmailFailure(
  id: string,
  workerId: string,
  status: Extract<EmailStatus, "RETRY" | "FAILED">,
  code: string,
  message: string,
  nextAttemptAt?: Date,
) {
  return getPrisma().emailOutbox.updateMany({
    where: { id, status: "PROCESSING", lockedBy: workerId },
    data: {
      status,
      lastErrorCode: code,
      lastErrorMessage: message.slice(0, 500),
      failedAt: status === "FAILED" ? new Date() : null,
      nextAttemptAt: nextAttemptAt ?? new Date(),
      lockedAt: null,
      lockedBy: null,
    },
  });
}

import { randomUUID } from "node:crypto";
import { EmailPermanentError, EmailTemporaryError } from "./errors";
import { claimNextEmail, markEmailFailure, markEmailSent } from "./outbox";
import { sendTransactionalEmail } from "./send-email";
import type { EmailTemplateName } from "./types";

const retryDelaysMs = [0, 60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000];

function errorInfo(error: unknown): { code: string; message: string; temporary: boolean } {
  if (error instanceof EmailPermanentError) return { code: error.code, message: error.message, temporary: false };
  if (error instanceof EmailTemporaryError) return { code: error.code, message: error.message, temporary: true };
  return { code: "EMAIL_WORKER_ERROR", message: "Unexpected email worker failure", temporary: true };
}

async function processOne(workerId: string): Promise<boolean> {
  const email = await claimNextEmail(workerId);
  if (!email) return false;
  const startedAt = Date.now();
  try {
    const result = await sendTransactionalEmail({
      to: email.recipient,
      subject: email.subject,
      template: email.templateName as EmailTemplateName,
      variables: (email.templatePayload ?? {}) as Record<string, string | number | boolean>,
    });
    await markEmailSent(email.id, workerId, result.providerMessageId);
    console.info(JSON.stringify({ event: "email.sent", id: email.id, template: email.templateName, attempt: email.attempts, durationMs: Date.now() - startedAt }));
  } catch (error) {
    const info = errorInfo(error);
    const terminal = !info.temporary || email.attempts >= email.maxAttempts;
    const delay = retryDelaysMs[Math.min(email.attempts, retryDelaysMs.length - 1)] ?? retryDelaysMs.at(-1)!;
    await markEmailFailure(email.id, workerId, terminal ? "FAILED" : "RETRY", info.code, info.message, new Date(Date.now() + delay));
    console.error(JSON.stringify({ event: terminal ? "email.failed" : "email.retry", id: email.id, template: email.templateName, attempt: email.attempts, code: info.code, durationMs: Date.now() - startedAt }));
  }
  return true;
}

export async function runMailWorker(): Promise<void> {
  const workerId = `mail-worker-${randomUUID()}`;
  let stopping = false;
  const stop = () => { stopping = true; };
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
  console.info(JSON.stringify({ event: "email.worker_started", workerId }));
  while (!stopping) {
    const processed = await processOne(workerId);
    if (!processed) await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
  console.info(JSON.stringify({ event: "email.worker_stopped", workerId }));
}

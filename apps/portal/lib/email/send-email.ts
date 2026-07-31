import { randomUUID } from "node:crypto";
import { getEmailConfig } from "./config";
import { EmailPermanentError, EmailTemporaryError, EmailValidationError } from "./errors";
import { getTransporter } from "./transporter";
import { renderTemplate } from "./templates";
import type { SendTransactionalEmailInput } from "./types";

const addressPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateHeader(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized || /[\r\n]/.test(normalized)) {
    throw new EmailValidationError(`${field} is invalid`);
  }
  return normalized;
}

function validateRecipient(value: string): string {
  const recipient = validateHeader(value, "recipient");
  if (recipient.length > 320 || !addressPattern.test(recipient)) {
    throw new EmailValidationError("recipient is invalid");
  }
  return recipient;
}

function classifyError(error: unknown): Error {
  const responseCode =
    typeof error === "object" && error !== null && "responseCode" in error
      ? Number((error as { responseCode?: unknown }).responseCode)
      : undefined;
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code)
      : "SMTP_ERROR";
  const message = responseCode ? `SMTP response ${responseCode}` : "SMTP transport failure";
  if (responseCode && responseCode >= 500 && responseCode < 600) {
    return new EmailPermanentError(message);
  }
  return new EmailTemporaryError(`${message} (${code})`);
}

export async function sendTransactionalEmail(input: SendTransactionalEmailInput) {
  const config = getEmailConfig();
  if (!config.SMTP_ENABLED) throw new EmailValidationError("SMTP is disabled");
  const to = validateRecipient(input.to);
  const subject = validateHeader(input.subject, "subject");
  const replyTo = input.replyTo ? validateRecipient(input.replyTo) : config.SMTP_REPLY_TO || undefined;
  const correlationId = randomUUID();
  const rendered = renderTemplate(input.template, input.variables);
  try {
    const result = await getTransporter().sendMail({
      from: { name: config.SMTP_FROM_NAME, address: config.SMTP_FROM_EMAIL },
      to,
      replyTo,
      subject,
      text: rendered.text,
      html: rendered.html,
      encoding: "utf-8",
      headers: { "X-TAD-Correlation-ID": correlationId },
    });
    return { correlationId, providerMessageId: result.messageId };
  } catch (error) {
    throw classifyError(error);
  }
}

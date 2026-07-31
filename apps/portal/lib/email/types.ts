export const EMAIL_STATUSES = [
  "PENDING",
  "PROCESSING",
  "SENT",
  "RETRY",
  "FAILED",
  "CANCELLED",
] as const;

export type EmailStatus = (typeof EMAIL_STATUSES)[number];

export type EmailTemplateName =
  | "generic-notification"
  | "application-access"
  | "application-maintenance"
  | "approval-request"
  | "approval-accepted"
  | "approval-rejected"
  | "agent-daily-report"
  | "technical-alert";

export type EmailTemplateVariables = Record<string, string | number | boolean>;

export type RenderedEmail = {
  html: string;
  text: string;
};

export type SendTransactionalEmailInput = {
  to: string;
  subject: string;
  template: EmailTemplateName;
  variables?: EmailTemplateVariables;
  replyTo?: string;
  idempotencyKey?: string;
};

export type EnqueueEmailInput = SendTransactionalEmailInput & {
  eventType: string;
  priority?: number;
  maxAttempts?: number;
};

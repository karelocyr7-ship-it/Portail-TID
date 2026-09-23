import { z } from "zod";
import { EmailConfigurationError } from "./errors";

const address = z
  .string()
  .trim()
  .min(3)
  .max(320)
  .email()
  .refine((value) => !/[\r\n]/.test(value), "Header injection detected");

const positiveInt = (fallback: number) =>
  z.coerce.number().int().positive().default(fallback);

const schema = z
  .object({
    SMTP_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    SMTP_HOST: z.string().trim().min(1).default("smtp.mail.ovh.net"),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
    SMTP_SECURE: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    SMTP_REQUIRE_TLS: z
      .enum(["true", "false"])
      .default("true")
      .transform((value) => value === "true"),
    SMTP_USER: address.default("notification@tadgroupe.com"),
    SMTP_PASSWORD: z.string().default(""),
    SMTP_FROM_EMAIL: address.default("notification@tadgroupe.com"),
    SMTP_FROM_NAME: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .refine((value) => !/[\r\n]/.test(value), "Header injection detected")
      .default("Portail TAD Groupe"),
    SMTP_REPLY_TO: z.union([address, z.literal("")]).default(""),
    SMTP_CONNECTION_TIMEOUT_MS: positiveInt(10_000),
    SMTP_GREETING_TIMEOUT_MS: positiveInt(10_000),
    SMTP_SOCKET_TIMEOUT_MS: positiveInt(20_000),
    SMTP_MAX_MESSAGES_PER_HOUR: z.coerce.number().int().min(1).max(180).default(120),
    SMTP_MAX_CONCURRENCY: z.literal("1").default("1").transform(() => 1),
    SMTP_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(5).default(5),
    SMTP_TEST_RECIPIENT: z.union([address, z.literal("")]).default(""),
  })
  .superRefine((value, context) => {
    if (value.SMTP_ENABLED && !value.SMTP_PASSWORD) {
      context.addIssue({
        code: "custom",
        path: ["SMTP_PASSWORD"],
        message: "SMTP_PASSWORD is required when SMTP_ENABLED=true",
      });
    }
    if (value.SMTP_SECURE && value.SMTP_PORT === 587) {
      context.addIssue({
        code: "custom",
        path: ["SMTP_SECURE"],
        message: "Port 587 requires SMTP_SECURE=false and STARTTLS",
      });
    }
    if (!value.SMTP_REQUIRE_TLS && value.SMTP_ENABLED) {
      context.addIssue({
        code: "custom",
        path: ["SMTP_REQUIRE_TLS"],
        message: "SMTP_REQUIRE_TLS must be true when SMTP is enabled",
      });
    }
    if (value.SMTP_FROM_EMAIL.toLowerCase() !== value.SMTP_USER.toLowerCase()) {
      context.addIssue({
        code: "custom",
        path: ["SMTP_FROM_EMAIL"],
        message: "SMTP_FROM_EMAIL must match SMTP_USER",
      });
    }
  });

export type EmailConfig = z.infer<typeof schema>;

export function getEmailConfig(env: Record<string, string | undefined> = process.env): EmailConfig {
  const result = schema.safeParse(env);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new EmailConfigurationError(details);
  }
  return result.data;
}

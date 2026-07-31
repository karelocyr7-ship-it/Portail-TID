import nodemailer, { type Transporter } from "nodemailer";
import { getEmailConfig, type EmailConfig } from "./config";

let cached: { configFingerprint: string; transporter: Transporter } | undefined;

function fingerprint(config: EmailConfig): string {
  return [
    config.SMTP_ENABLED,
    config.SMTP_HOST,
    config.SMTP_PORT,
    config.SMTP_USER,
    config.SMTP_FROM_EMAIL,
  ].join("|");
}

export function getTransporter(): Transporter {
  const config = getEmailConfig();
  if (!config.SMTP_ENABLED) throw new Error("SMTP is disabled");
  const key = fingerprint(config);
  if (cached?.configFingerprint === key) return cached.transporter;

  const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE,
    requireTLS: config.SMTP_REQUIRE_TLS,
    name: "portail.tadgroupe.com",
    auth: { user: config.SMTP_USER, pass: config.SMTP_PASSWORD },
    tls: { minVersion: "TLSv1.2", rejectUnauthorized: true },
    connectionTimeout: config.SMTP_CONNECTION_TIMEOUT_MS,
    greetingTimeout: config.SMTP_GREETING_TIMEOUT_MS,
    socketTimeout: config.SMTP_SOCKET_TIMEOUT_MS,
    pool: true,
    maxConnections: 1,
    maxMessages: config.SMTP_MAX_MESSAGES_PER_HOUR,
  });
  cached = { configFingerprint: key, transporter };
  return transporter;
}

export async function verifySmtpConnection(): Promise<void> {
  await getTransporter().verify();
}

export function resetTransporterForTests(): void {
  cached?.transporter.close();
  cached = undefined;
}

import { runMailWorker } from "../lib/email/worker";
import { verifySmtpConnection } from "../lib/email/transporter";

const configEnabled = process.env.SMTP_ENABLED === "true";
if (!configEnabled) {
  console.error("SMTP_ENABLED=false; worker arrêté.");
  process.exit(0);
}
await verifySmtpConnection();
await runMailWorker();

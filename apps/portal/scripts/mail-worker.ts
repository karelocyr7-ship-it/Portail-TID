import { runMailWorker } from "../lib/email/worker";
import { verifySmtpConnection } from "../lib/email/transporter";

const configEnabled = process.env.SMTP_ENABLED === "true";
if (!configEnabled) {
  console.info("SMTP_ENABLED=false; worker en attente d’activation.");
  await new Promise<void>((resolve) => {
    process.once("SIGTERM", resolve);
    process.once("SIGINT", resolve);
  });
  process.exit(0);
}
await verifySmtpConnection();
await runMailWorker();

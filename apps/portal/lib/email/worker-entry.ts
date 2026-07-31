import { runMailWorker } from "./worker";
import { getEmailConfig } from "./config";
import { verifySmtpConnection } from "./transporter";

async function main() {
  const config = getEmailConfig();
  if (!config.SMTP_ENABLED) {
    console.info("SMTP_ENABLED=false; worker en attente d’activation.");
    await new Promise<void>((resolve) => {
      process.once("SIGTERM", resolve);
      process.once("SIGINT", resolve);
    });
    return;
  }
  await verifySmtpConnection();
  await runMailWorker();
}

void main().catch(() => {
  console.error("Le worker SMTP n’a pas pu démarrer. Aucun secret n’a été affiché.");
  process.exitCode = 1;
});

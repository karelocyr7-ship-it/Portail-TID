import { runMailWorker } from "./worker";
import { getEmailConfig } from "./config";
import { verifySmtpConnection } from "./transporter";

const config = getEmailConfig();
if (!config.SMTP_ENABLED) {
  console.info("SMTP_ENABLED=false; worker en attente d’activation.");
  await new Promise<void>((resolve) => {
    process.once("SIGTERM", resolve);
    process.once("SIGINT", resolve);
  });
} else {
  await verifySmtpConnection();
  await runMailWorker();
}

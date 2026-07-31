import { getEmailConfig } from "../lib/email/config";
import { verifySmtpConnection } from "../lib/email/transporter";

try {
  const config = getEmailConfig();
  if (!config.SMTP_ENABLED) throw new Error("SMTP_ENABLED=false");
  await verifySmtpConnection();
  console.log(`SMTP STARTTLS vérifié sur ${config.SMTP_HOST}:${config.SMTP_PORT} pour ${config.SMTP_USER}`);
} catch {
  console.error("La vérification SMTP a échoué. Aucun secret n’a été affiché.");
  process.exitCode = 1;
}

import { getEmailConfig } from "../lib/email/config";
import { sendTransactionalEmail } from "../lib/email/send-email";

const recipient = process.argv[2];
if (!recipient) {
  console.error("Usage: npm run smtp:test -- adresse@exemple.com");
  process.exit(1);
}
if (process.env.NODE_ENV === "production" && process.env.SMTP_TEST_CONFIRM !== "yes") {
  console.error("En production, définir SMTP_TEST_CONFIRM=yes après confirmation explicite.");
  process.exit(1);
}
try {
  const config = getEmailConfig();
  if (!config.SMTP_ENABLED) throw new Error("SMTP désactivé");
  const result = await sendTransactionalEmail({
    to: recipient,
    subject: "Test SMTP — Portail TAD Groupe",
    template: "technical-alert",
    variables: { title: "Test SMTP", message: "La configuration SMTP transactionnelle est opérationnelle." },
  });
  console.log(`Message test envoyé. Corrélation: ${result.correlationId}`);
} catch {
  console.error("Le message test n’a pas été envoyé. Aucun secret n’a été affiché.");
  process.exitCode = 1;
}

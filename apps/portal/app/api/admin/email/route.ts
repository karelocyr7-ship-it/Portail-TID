import { NextResponse } from "next/server";
import { getEmailConfig } from "@/lib/email/config";
import { sendTransactionalEmail } from "@/lib/email/send-email";
import { verifySmtpConnection } from "@/lib/email/transporter";
import { getPrisma } from "@/lib/prisma";
import { getRoles, getSession } from "@/lib/oidc";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !getRoles(session).includes("PORTAL_ADMIN")) return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès administrateur requis" }, { status: 403 });
  const config = getEmailConfig();
  const prisma = getPrisma();
  const [pending, failed, sent24h, lastSent, lastFailure] = await Promise.all([
    prisma.emailOutbox.count({ where: { status: { in: ["PENDING", "PROCESSING", "RETRY"] } } }),
    prisma.emailOutbox.count({ where: { status: "FAILED" } }),
    prisma.emailOutbox.count({ where: { status: "SENT", sentAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
    prisma.emailOutbox.findFirst({ where: { status: "SENT" }, orderBy: { sentAt: "desc" }, select: { sentAt: true } }),
    prisma.emailOutbox.findFirst({ where: { status: "FAILED" }, orderBy: { failedAt: "desc" }, select: { failedAt: true } }),
  ]);
  return NextResponse.json({
    enabled: config.SMTP_ENABLED,
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    encryption: "STARTTLS",
    from: config.SMTP_FROM_EMAIL,
    lastTestSucceededAt: lastSent?.sentAt ?? null,
    lastFailureAt: lastFailure?.failedAt ?? null,
    pending,
    failed,
    sent24h,
  });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès administrateur requis" }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as { confirm?: boolean };
  if (body.confirm !== true) return NextResponse.json({ error: "Confirmation requise" }, { status: 400 });
  const config = getEmailConfig();
  if (!config.SMTP_ENABLED) return NextResponse.json({ error: "SMTP désactivé" }, { status: 409 });
  const recipient = config.SMTP_TEST_RECIPIENT || session.email;
  if (!recipient) return NextResponse.json({ error: "SMTP_TEST_RECIPIENT ou e-mail administrateur requis" }, { status: 400 });
  const idempotencyKey = `smtp-test:${session.subject}:${new Date().toISOString().slice(0, 16)}`;
  try {
    await verifySmtpConnection();
    const result = await sendTransactionalEmail({
      to: recipient,
      subject: "Test SMTP — Portail TAD Groupe",
      template: "technical-alert",
      variables: { title: "Configuration SMTP validée", message: "Ce message confirme la configuration SMTP du Portail TAD Groupe." },
      idempotencyKey,
    });
    await getPrisma().auditLog.create({ data: { userId: session.subject, eventType: "SMTP_TEST", entityType: "Email", entityId: result.correlationId, afterData: { recipient: recipient.replace(/^(.).+(@.*)$/, "$1***$2") } } });
    return NextResponse.json({ ok: true, correlationId: result.correlationId });
  } catch {
    await getPrisma().auditLog.create({ data: { userId: session.subject, eventType: "SMTP_TEST_FAILED", entityType: "Email", afterData: { recipient: recipient.replace(/^(.).+(@.*)$/, "$1***$2") } } });
    return NextResponse.json({ error: "Le test SMTP a échoué. Consultez les journaux techniques." }, { status: 502 });
  }
}

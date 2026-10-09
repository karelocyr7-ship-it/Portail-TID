import { createHmac, timingSafeEqual } from "node:crypto";
import { getPrisma } from "@/lib/prisma";
import { normalizeEmployeeId } from "@/lib/employee-id";
import { provisionKeycloakUser } from "@/lib/keycloak-admin";

export const runtime = "nodejs";

const MAX_CLOCK_SKEW_SECONDS = 300;

function requiredSecret(): string {
  const secret = process.env.SIRH_PROVISIONING_SECRET?.trim();
  if (!secret) throw new Error("SIRH_PROVISIONING_SECRET is not configured");
  return secret;
}

function validSignature(timestamp: string, body: string, signature: string) {
  const timestampNumber = Number(timestamp);
  if (!Number.isInteger(timestampNumber)) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - timestampNumber) > MAX_CLOCK_SKEW_SECONDS)
    return false;

  const expected = `sha256=${createHmac("sha256", requiredSecret())
    .update(`${timestamp}.${body}`)
    .digest("hex")}`;
  if (signature.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

type SirhProvisioningPayload = {
  sageId?: unknown;
  email?: unknown;
  displayName?: unknown;
  phone?: unknown;
};

export async function POST(request: Request) {
  const body = await request.text();
  const timestamp = request.headers.get("x-sirh-timestamp") ?? "";
  const signature = request.headers.get("x-sirh-signature") ?? "";
  if (!validSignature(timestamp, body, signature)) {
    return Response.json({ error: "Invalid provisioning signature" }, { status: 401 });
  }

  let payload: SirhProvisioningPayload;
  try {
    payload = JSON.parse(body) as SirhProvisioningPayload;
  } catch {
    return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const employeeId = normalizeEmployeeId(payload.sageId);
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const displayName = typeof payload.displayName === "string" ? payload.displayName.trim() : "";
  if (!employeeId || !email.includes("@") || !displayName || displayName.length > 160) {
    return Response.json({ error: "Invalid employee payload" }, { status: 422 });
  }

  try {
    const provisioned = await provisionKeycloakUser({ email, displayName, employeeId });
    const prisma = getPrisma();
    const defaults = await prisma.applicationProfile.findMany({
      where: { isDefault: true, active: true, application: { active: true } },
      select: { id: true, applicationId: true },
    });
    const activeApplicationCount = await prisma.application.count({ where: { active: true } });
    if (
      defaults.length !== activeApplicationCount ||
      new Set(defaults.map(({ applicationId }) => applicationId)).size !== defaults.length
    ) {
      return Response.json({ error: "Default application profiles are not configured" }, { status: 503 });
    }

    const result = await prisma.$transaction(async (transaction) => {
      const byEmployeeId = await transaction.portalUser.findUnique({ where: { employeeId } });
      const byEmail = await transaction.portalUser.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
      });
      if (byEmployeeId && byEmail && byEmployeeId.id !== byEmail.id) {
        throw new Error("Employee ID and e-mail belong to different portal accounts");
      }
      const existing = byEmployeeId ?? byEmail;
      const user = existing
        ? await transaction.portalUser.update({
            where: { id: existing.id },
            data: { keycloakSubject: provisioned.subject, employeeId, email, displayName, active: true },
          })
        : await transaction.portalUser.create({
            data: { keycloakSubject: provisioned.subject, employeeId, email, displayName, active: true },
          });

      for (const profile of defaults) {
        await transaction.userApplicationProfile.upsert({
          where: { userId_profileId: { userId: user.id, profileId: profile.id } },
          create: { userId: user.id, profileId: profile.id, assignedBy: "SIRH" },
          update: {},
        });
        await transaction.applicationProvisioningOutbox.upsert({
          where: { userId_applicationId: { userId: user.id, applicationId: profile.applicationId } },
          create: {
            idempotencyKey: `${user.id}:${profile.applicationId}`,
            userId: user.id,
            applicationId: profile.applicationId,
            profileId: profile.id,
          },
          update: { profileId: profile.id, status: "PENDING", nextAttemptAt: new Date(), lastError: null },
        });
      }
      await transaction.auditLog.create({
        data: {
          userId: "SIRH",
          eventType: existing ? "SIRH_PORTAL_USER_UPDATED" : "SIRH_PORTAL_USER_CREATED",
          entityType: "PortalUser",
          entityId: user.id,
          afterData: { employeeId, email, displayName, keycloakSubject: provisioned.subject },
        },
      });
      return { id: user.id, created: !existing };
    });

    return Response.json({ ok: true, employeeId, created: result.created });
  } catch (error) {
    console.error("SIRH portal provisioning failed", error instanceof Error ? error.message : "unknown");
    return Response.json({ error: "Portal provisioning failed" }, { status: 502 });
  }
}

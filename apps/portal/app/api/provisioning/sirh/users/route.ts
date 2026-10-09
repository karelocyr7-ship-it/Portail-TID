import { z } from "zod";
import { provisionKeycloakUser } from "@/lib/keycloak-admin";
import { getPrisma } from "@/lib/prisma";
import { normalizeSageId } from "@/lib/sage-id";
import { verifySirhSignature } from "@/lib/sirh-provisioning";

export const runtime = "nodejs";

const payloadSchema = z.object({
  sageId: z.string().trim().min(2).max(64),
  email: z.string().trim().email().max(320),
  displayName: z.string().trim().min(1).max(160),
  phone: z.string().trim().max(64).optional(),
  keycloakSubject: z.string().trim().min(1).max(200).optional(),
});

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (
    !verifySirhSignature(
      rawBody,
      request.headers.get("x-sirh-timestamp"),
      request.headers.get("x-sirh-signature"),
    )
  ) {
    return Response.json({ error: "Signature SIRH invalide" }, { status: 401 });
  }

  let payload: z.infer<typeof payloadSchema>;
  try {
    payload = payloadSchema.parse(JSON.parse(rawBody));
  } catch {
    return Response.json({ error: "Payload SIRH invalide" }, { status: 400 });
  }
  const sageId = normalizeSageId(payload.sageId);
  if (!sageId)
    return Response.json({ error: "ID Sage invalide" }, { status: 400 });

  const prisma = getPrisma();
  const bySage = await prisma.portalUser.findUnique({
    where: { sageEmployeeId: sageId },
    select: { id: true, keycloakSubject: true },
  });
  const byEmail = bySage
    ? null
    : await prisma.portalUser.findMany({
        where: { email: { equals: payload.email, mode: "insensitive" } },
        select: { id: true, keycloakSubject: true },
        take: 2,
      });
  if (byEmail && byEmail.length > 1)
    return Response.json(
      { error: "E-mail SIRH associé à plusieurs comptes portail" },
      { status: 409 },
    );
  const existing = bySage ?? byEmail?.[0] ?? null;
  if (
    existing?.keycloakSubject &&
    payload.keycloakSubject &&
    existing.keycloakSubject !== payload.keycloakSubject
  ) {
    return Response.json(
      { error: "Le sujet Keycloak ne correspond pas au compte portail" },
      { status: 409 },
    );
  }

  const keycloakSubject =
    existing?.keycloakSubject ??
    payload.keycloakSubject ??
    (
      await provisionKeycloakUser({
        email: payload.email,
        displayName: payload.displayName,
        employeeId: sageId,
      })
    ).subject;

  const defaults = await prisma.applicationProfile.findMany({
    where: { isDefault: true, active: true, application: { active: true } },
    select: { id: true, applicationId: true },
  });
  const activeApplicationCount = await prisma.application.count({
    where: { active: true },
  });
  if (
    defaults.length !== activeApplicationCount ||
    new Set(defaults.map(({ applicationId }) => applicationId)).size !==
      defaults.length
  ) {
    return Response.json(
      { error: "Profils minimaux des applications non configurés" },
      { status: 503 },
    );
  }

  const result = await prisma.$transaction(async (transaction) => {
    const user = existing
      ? await transaction.portalUser.update({
          where: { id: existing.id },
          data: {
            keycloakSubject,
            sageEmployeeId: sageId,
            employeeId: sageId,
            email: payload.email.toLowerCase(),
            phone: payload.phone || null,
            displayName: payload.displayName,
            active: true,
          },
        })
      : await transaction.portalUser.create({
          data: {
            keycloakSubject,
            sageEmployeeId: sageId,
            employeeId: sageId,
            email: payload.email.toLowerCase(),
            phone: payload.phone || null,
            displayName: payload.displayName,
            active: true,
      },
    });
    for (const profile of defaults) {
      await transaction.userApplicationProfile.upsert({
        where: {
          userId_profileId: { userId: user.id, profileId: profile.id },
        },
        create: {
          userId: user.id,
          profileId: profile.id,
          assignedBy: "SIRH",
        },
        update: {},
      });
      await transaction.applicationProvisioningOutbox.upsert({
        where: {
          userId_applicationId: {
            userId: user.id,
            applicationId: profile.applicationId,
          },
        },
        create: {
          idempotencyKey: `${user.id}:${profile.applicationId}`,
          userId: user.id,
          applicationId: profile.applicationId,
          profileId: profile.id,
        },
        update: {
          profileId: profile.id,
          status: "PENDING",
          nextAttemptAt: new Date(),
          lastError: null,
        },
      });
    }
    await transaction.auditLog.create({
      data: {
        userId: "SIRH",
        eventType: existing
          ? "PORTAL_USER_UPDATED_FROM_SIRH"
          : "PORTAL_USER_CREATED_FROM_SIRH",
        entityType: "PortalUser",
        entityId: user.id,
        afterData: {
          sageEmployeeId: sageId,
          email: payload.email.toLowerCase(),
          displayName: payload.displayName,
          applicationAccess: "DEFAULT_PROFILES_ASSIGNED",
        },
      },
    });
    return user;
  });

  return Response.json(
    {
      id: result.id,
      sageId,
      keycloakSubject: result.keycloakSubject,
      applicationAccess: "DEFAULT_PROFILES_ASSIGNED",
    },
    { status: existing ? 200 : 201 },
  );
}

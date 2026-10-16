import { z } from "zod";
import {
  provisionKeycloakUser,
  syncKeycloakUsernameFromSirh,
} from "@/lib/keycloak-admin";
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
  enabled: z.boolean().optional(),
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
  const enabled = payload.enabled ?? true;

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

  if (existing) await syncKeycloakUsernameFromSirh(keycloakSubject, sageId);

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
            active: enabled,
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
            active: enabled,
          },
        });
    if (existing) {
      const assignments = await transaction.userApplicationProfile.findMany({
        where: { userId: user.id },
        select: {
          profileId: true,
          profile: { select: { applicationId: true } },
        },
      });
      for (const assignment of assignments) {
        await transaction.applicationProvisioningOutbox.upsert({
          where: {
            userId_applicationId: {
              userId: user.id,
              applicationId: assignment.profile.applicationId,
            },
          },
          create: {
            idempotencyKey: `${user.id}:${assignment.profile.applicationId}`,
            userId: user.id,
            applicationId: assignment.profile.applicationId,
            profileId: assignment.profileId,
          },
          update: {
            profileId: assignment.profileId,
            status: "PENDING",
            nextAttemptAt: new Date(),
            lastError: null,
          },
        });
      }
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
          active: enabled,
          applicationAccess: existing ? "UNCHANGED" : "NOT_ASSIGNED",
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
      applicationAccess: existing ? "UNCHANGED" : "NOT_ASSIGNED",
      active: enabled,
    },
    { status: existing ? 200 : 201 },
  );
}

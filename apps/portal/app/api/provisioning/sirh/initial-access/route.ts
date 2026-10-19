import { z } from "zod";
import { assignDefaultGlpiAccess } from "@/lib/default-glpi-access";
import { getPrisma } from "@/lib/prisma";
import { verifySirhSignature } from "@/lib/sirh-provisioning";
import { normalizeEmployeeId } from "@/lib/employee-id";
import {
  initializeSirhAccess,
  InitialAccessError,
} from "@/lib/sirh-initial-access";

export const runtime = "nodejs";
const schema = z
  .object({
    purpose: z.literal("initial-access-v1"),
    requestId: z.string().uuid(),
    operationId: z.string().uuid().optional(),
    generation: z.number().int().min(1).max(2147483647).optional(),
    allowPendingExisting: z.boolean().optional(),
    sageId: z.string().min(2).max(64),
    email: z.string().email().max(320).optional(),
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    temporaryPassword: z.string().min(20).max(128).optional(),
  })
  .strict();
const reply = (body: object, status = 200) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", Pragma: "no-cache" },
  });

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 4096) return reply({ error: "REQUEST_TOO_LARGE" }, 413);
  if (
    !verifySirhSignature(
      raw,
      request.headers.get("x-sirh-timestamp"),
      request.headers.get("x-sirh-signature"),
    )
  ) {
    return reply({ error: "INVALID_SIGNATURE" }, 401);
  }
  let parsed;
  try {
    parsed = schema.parse(JSON.parse(raw));
  } catch {
    return reply({ error: "INVALID_REQUEST" }, 400);
  }
  // Match the database employeeId constraint before any remote mutation.
  // Otherwise Keycloak creation could succeed and the local transaction fail,
  // leaving an account whose initial credential cannot safely be reissued.
  const sageId = normalizeEmployeeId(parsed.sageId);
  if (!sageId) return reply({ error: "INVALID_MATRICULE" }, 400);
  if (
    Boolean(parsed.operationId) !== Boolean(parsed.generation) ||
    (parsed.allowPendingExisting && !parsed.operationId)
  )
    return reply({ error: "INVALID_OPERATION" }, 400);
  let stage = "transaction";
  try {
    const result = await getPrisma().$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`sirh-initial:${sageId}`}, 0))::text`;
        stage = "replay_lookup";
        const id = `sirh-initial:${parsed.requestId}`;
        const replay = await tx.auditLog.findUnique({
          where: { id },
          select: { id: true },
        });
        if (replay) throw new InitialAccessError("REQUEST_ALREADY_USED");
        stage = "identity_lookup";
        const existing = await tx.portalUser.findUnique({
          where: { sageEmployeeId: sageId },
        });
        if (existing && !existing.active)
          throw new InitialAccessError("ACCOUNT_DISABLED");
        stage = "audit_reservation";
        await tx.auditLog.create({
          data: {
            id,
            userId: "SIRH",
            eventType: "SIRH_INITIAL_ACCESS",
            entityType: "PortalUser",
            entityId: existing?.id ?? sageId,
            afterData: { status: "IN_PROGRESS" },
          },
        });
        stage = "keycloak";
        const outcome = await initializeSirhAccess(
          {
            sageId,
            email: parsed.email,
            firstName: parsed.firstName,
            lastName: parsed.lastName,
          },
          parsed.temporaryPassword,
          existing?.keycloakSubject,
          parsed.operationId && parsed.generation
            ? {
                operationId: parsed.operationId,
                generation: parsed.generation,
                allowPendingExisting: parsed.allowPendingExisting ?? false,
              }
            : undefined,
        );
        if (
          outcome.subject &&
          existing?.keycloakSubject &&
          outcome.subject !== existing.keycloakSubject
        ) {
          throw new InitialAccessError("IDENTITY_CONFLICT");
        }
        if (outcome.status === "READY" && outcome.subject) {
          stage = "portal_account";
          const portalUser = await tx.portalUser.upsert({
            where: { sageEmployeeId: sageId },
            create: {
              sageEmployeeId: sageId,
              employeeId: sageId,
              keycloakSubject: outcome.subject,
              email: parsed.email,
              displayName: `${parsed.firstName} ${parsed.lastName}`,
              active: true,
            },
            update: {}, // Initial credentials never change roles, assignments or identity.
          });
          if (!existing) await assignDefaultGlpiAccess(tx, portalUser.id, true);
        }
        stage = "audit_completion";
        await tx.auditLog.update({
          where: { id },
          data: {
            afterData: {
              status: outcome.status,
              credentialRequested: Boolean(parsed.temporaryPassword),
              ...(parsed.operationId
                ? {
                    operationId: parsed.operationId,
                    generation: parsed.generation,
                  }
                : {}),
            },
          },
        });
        return { status: outcome.status };
      },
      { timeout: 60000, maxWait: 10000 },
    );
    return reply(result);
  } catch (error) {
    // Only a bounded machine code is safe here; exception messages may include inputs.
    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "UNKNOWN";
    if (!(error instanceof InitialAccessError))
      console.error(
        "SIRH_INITIAL_ACCESS_FAILURE",
        /^P\d{4}$/.test(code) ? code : "INTERNAL",
        stage,
      );
    return reply(
      {
        error:
          error instanceof InitialAccessError
            ? error.code
            : "INITIAL_ACCESS_UNAVAILABLE",
      },
      409,
    );
  }
}

ALTER TABLE "PortalUser" ADD COLUMN "glpiAccess" BOOLEAN NOT NULL DEFAULT true;

-- Queue the initial account creation for legacy users as well as future users.
-- This does not assign or change any GLPI business role.
INSERT INTO "ApplicationProfile" ("id", "applicationId", "key", "name", "updatedAt")
SELECT 'glpi-access-' || "id", "id", 'ACCESS', 'Accès à GLPI', CURRENT_TIMESTAMP
FROM "Application" WHERE "code" = 'GLPI'
ON CONFLICT ("applicationId", "key") DO NOTHING;

INSERT INTO "ApplicationProvisioningOutbox"
  ("id", "idempotencyKey", "userId", "applicationId", "profileId", "updatedAt")
SELECT 'glpi-initial-' || u."id", u."id" || ':' || a."id", u."id", a."id", p."id", CURRENT_TIMESTAMP
FROM "PortalUser" u CROSS JOIN "Application" a
JOIN "ApplicationProfile" p ON p."applicationId" = a."id" AND p."key" = 'ACCESS'
WHERE a."code" = 'GLPI' AND (
  u."sageEmployeeId" IS NOT NULL OR u."employeeId" IS NOT NULL
  OR (u."active" AND u."glpiAccess")
)
ON CONFLICT ("userId", "applicationId") DO UPDATE
SET "status" = 'PENDING', "attempts" = 0, "lastError" = NULL,
    "nextAttemptAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP;

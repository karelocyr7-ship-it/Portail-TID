INSERT INTO "ApplicationProfile" (
  "id", "applicationId", "key", "name", "description", "sourceSystem", "sourceReference", "active", "isDefault", "createdAt", "updatedAt"
)
SELECT
  'revue-pdv-auditeur', a."id", 'auditeur', 'Invité sans données',
  'Compte sans branche ni périmètre de données', 'REVUE-PDV',
  'api/src/lib/domainAccess.js:auditor', true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Application" a
WHERE a."code" = 'REVUE-PDV'
  AND NOT EXISTS (
    SELECT 1 FROM "ApplicationProfile" p
    WHERE p."applicationId" = a."id" AND p."key" = 'auditeur'
  );

UPDATE "ApplicationProfile" p
SET "isDefault" = false
FROM "Application" a
WHERE p."applicationId" = a."id" AND a."code" = 'REVUE-PDV';

UPDATE "ApplicationProfile" p
SET "isDefault" = true
FROM "Application" a
WHERE p."applicationId" = a."id"
  AND a."code" = 'REVUE-PDV'
  AND p."key" = 'auditeur';

ALTER TABLE "ApplicationProfile"
ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "ApplicationProvisioningOutbox" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApplicationProvisioningOutbox_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ApplicationProvisioningOutbox_idempotencyKey_key"
ON "ApplicationProvisioningOutbox"("idempotencyKey");
CREATE UNIQUE INDEX "ApplicationProvisioningOutbox_userId_applicationId_key"
ON "ApplicationProvisioningOutbox"("userId", "applicationId");
CREATE INDEX "ApplicationProvisioningOutbox_status_nextAttemptAt_idx"
ON "ApplicationProvisioningOutbox"("status", "nextAttemptAt");

ALTER TABLE "ApplicationProvisioningOutbox"
ADD CONSTRAINT "ApplicationProvisioningOutbox_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "PortalUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationProvisioningOutbox"
ADD CONSTRAINT "ApplicationProvisioningOutbox_applicationId_fkey"
FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationProvisioningOutbox"
ADD CONSTRAINT "ApplicationProvisioningOutbox_profileId_fkey"
FOREIGN KEY ("profileId") REFERENCES "ApplicationProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE "ApplicationProfile" p SET "isDefault" = true
FROM "Application" a
WHERE p."applicationId" = a."id"
  AND (
    (a."code" = 'TDB' AND p."key" = 'VIEWER') OR
    (a."code" = 'GPARC' AND p."key" = 'CHAUFFEUR') OR
    (a."code" = 'REVUE-PDV' AND p."key" = 'sup_orange') OR
    (a."code" = 'CASH-RECON' AND p."key" = 'VIEWER') OR
    (a."code" = 'MDM' AND p."key" = 'OBSERVER') OR
    (a."code" = 'ATF' AND p."key" = 'OBSERVER') OR
    (a."code" = 'SIRH' AND p."key" = 'RH') OR
    (a."code" = 'GED' AND p."key" = 'RH') OR
    (a."code" = 'RECRUTEMENT' AND p."key" = 'RECRUT_OCI_SUPERVISEUR')
  );

-- Phase 1: nullable addition keeps existing portal users and logins working.
ALTER TABLE "PortalUser" ADD COLUMN "employeeId" TEXT;

CREATE UNIQUE INDEX "PortalUser_employeeId_key"
ON "PortalUser"("employeeId");

ALTER TABLE "PortalUser"
ADD CONSTRAINT "PortalUser_employeeId_format_check"
CHECK (
  "employeeId" IS NULL
  OR "employeeId" ~ '^(TID|TIDP)[0-9]{3,}$'
);

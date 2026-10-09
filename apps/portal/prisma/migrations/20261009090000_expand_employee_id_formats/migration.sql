ALTER TABLE "PortalUser"
DROP CONSTRAINT IF EXISTS "PortalUser_employeeId_format_check";

ALTER TABLE "PortalUser"
ADD CONSTRAINT "PortalUser_employeeId_format_check"
CHECK (
  "employeeId" IS NULL
  OR "employeeId" ~ '^TID(P[SC]?|[SC])?[0-9]{3,}$'
);

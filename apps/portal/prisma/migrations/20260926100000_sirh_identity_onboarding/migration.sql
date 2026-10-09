ALTER TABLE "PortalUser"
ADD COLUMN "sageEmployeeId" TEXT;

CREATE UNIQUE INDEX "PortalUser_sageEmployeeId_key"
ON "PortalUser"("sageEmployeeId");

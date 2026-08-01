ALTER TABLE "PortalUser" ADD COLUMN "phone" TEXT;

CREATE INDEX "PortalUser_phone_idx" ON "PortalUser"("phone");

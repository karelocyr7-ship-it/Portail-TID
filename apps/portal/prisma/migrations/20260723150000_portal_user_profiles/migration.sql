CREATE TABLE "ApplicationProfile" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApplicationProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PortalUser" (
    "id" TEXT NOT NULL,
    "keycloakSubject" TEXT NOT NULL,
    "email" TEXT,
    "displayName" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PortalUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserApplicationProfile" (
    "userId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,
    CONSTRAINT "UserApplicationProfile_pkey" PRIMARY KEY ("userId", "profileId")
);

CREATE UNIQUE INDEX "ApplicationProfile_applicationId_key_key"
ON "ApplicationProfile"("applicationId", "key");
CREATE INDEX "ApplicationProfile_applicationId_active_displayOrder_idx"
ON "ApplicationProfile"("applicationId", "active", "displayOrder");
CREATE UNIQUE INDEX "PortalUser_keycloakSubject_key"
ON "PortalUser"("keycloakSubject");
CREATE INDEX "PortalUser_email_idx" ON "PortalUser"("email");
CREATE INDEX "UserApplicationProfile_profileId_idx"
ON "UserApplicationProfile"("profileId");

ALTER TABLE "ApplicationProfile"
ADD CONSTRAINT "ApplicationProfile_applicationId_fkey"
FOREIGN KEY ("applicationId") REFERENCES "Application"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserApplicationProfile"
ADD CONSTRAINT "UserApplicationProfile_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "PortalUser"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserApplicationProfile"
ADD CONSTRAINT "UserApplicationProfile_profileId_fkey"
FOREIGN KEY ("profileId") REFERENCES "ApplicationProfile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

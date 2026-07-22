-- Initialisation du schéma portail, générée hors connexion depuis schema.prisma.
CREATE SCHEMA IF NOT EXISTS "public";
CREATE TABLE "Application" (
    "id" TEXT NOT NULL, "code" TEXT NOT NULL, "name" TEXT NOT NULL,
    "description" TEXT NOT NULL, "categoryId" TEXT NOT NULL, "url" TEXT,
    "icon" TEXT NOT NULL, "integrationLevel" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT false, "maintenance" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage" TEXT, "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "healthcheckUrl" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Category" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0, "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ApplicationRole" (
    "applicationId" TEXT NOT NULL, "keycloakRole" TEXT NOT NULL,
    CONSTRAINT "ApplicationRole_pkey" PRIMARY KEY ("applicationId", "keycloakRole")
);
CREATE TABLE "Favorite" (
    "userId" TEXT NOT NULL, "applicationId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("userId", "applicationId")
);
CREATE TABLE "ApplicationAccessLog" (
    "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "applicationId" TEXT NOT NULL,
    "action" TEXT NOT NULL, "ipAddress" TEXT, "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApplicationAccessLog_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "eventType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL, "entityId" TEXT, "beforeData" JSONB, "afterData" JSONB,
    "ipAddress" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL, "title" TEXT NOT NULL, "content" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL, "endAt" TIMESTAMP(3), "targetRoles" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PortalSetting" (
    "key" TEXT NOT NULL, "value" JSONB NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PortalSetting_pkey" PRIMARY KEY ("key")
);
CREATE UNIQUE INDEX "Application_code_key" ON "Application"("code");
CREATE INDEX "Application_categoryId_active_displayOrder_idx" ON "Application"("categoryId", "active", "displayOrder");
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE INDEX "ApplicationAccessLog_userId_createdAt_idx" ON "ApplicationAccessLog"("userId", "createdAt");
CREATE INDEX "AuditLog_eventType_createdAt_idx" ON "AuditLog"("eventType", "createdAt");
ALTER TABLE "Application" ADD CONSTRAINT "Application_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ApplicationRole" ADD CONSTRAINT "ApplicationRole_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationAccessLog" ADD CONSTRAINT "ApplicationAccessLog_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

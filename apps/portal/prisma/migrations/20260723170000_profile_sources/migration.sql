ALTER TABLE "ApplicationProfile"
  ADD COLUMN "sourceSystem" TEXT NOT NULL DEFAULT 'portal-catalog',
  ADD COLUMN "sourceReference" TEXT,
  ADD COLUMN "syncedAt" TIMESTAMP(3);

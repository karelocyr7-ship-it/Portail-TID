-- Le code interne TDB est conservé pour préserver les rôles et intégrations.
UPDATE "Application"
SET
  "name" = 'Perf-TID',
  "url" = 'https://perf-tid.tadgroupe.com',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'TDB';

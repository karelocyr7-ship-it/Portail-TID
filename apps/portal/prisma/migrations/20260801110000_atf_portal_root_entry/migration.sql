-- The ATF root entrypoint performs the same OIDC redirect without exposing
-- the server-side OIDC path to the single-page application router.
UPDATE "Application"
SET
  "url" = 'https://atf.tadgroupe.com/',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'ATF';

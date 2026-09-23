-- Use an API route that is excluded by every ATF service-worker version.
-- This prevents stale workers from intercepting the portal SSO navigation.
UPDATE "Application"
SET
  "url" = 'https://atf.tadgroupe.com/api/session/openid/auth',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'ATF';

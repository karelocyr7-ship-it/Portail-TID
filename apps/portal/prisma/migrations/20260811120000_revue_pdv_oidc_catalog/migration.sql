-- Revue-PDV exposes an OIDC entrypoint for portal-launched SSO.
UPDATE "Application"
SET
  "url" = 'https://pdv.tadgroupe.com/api/auth/oidc/start',
  "integrationLevel" = 2,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'REVUE-PDV';

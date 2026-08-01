-- ATF keeps its historical atf.onl access while the portal opens the OIDC entrypoint.
UPDATE "Application"
SET
  "url" = 'https://atf.tadgroupe.com/rest/public/oidc',
  "integrationLevel" = 2,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'ATF';

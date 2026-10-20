// Run only with the dedicated disposable containers described in docs/GLPI-PROVISIONING.md.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import pg from "pg";
const containerPrefix = "portal-glpi-fixture-20261020";
function fixtureIp(suffix) {
  return execFileSync(
    "sudo",
    [
      "docker",
      "inspect",
      `${containerPrefix}-${suffix}`,
      "--format",
      "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}",
    ],
    { encoding: "utf8" },
  ).trim();
}
const runId = Date.now().toString();
const adminUrl = `postgresql://postgres@${fixtureIp("pg")}:5432/postgres`;
const admin = new pg.Client({ connectionString: adminUrl });
await admin.connect();
await admin.query(`CREATE DATABASE portal_glpi_fixture_${runId}`);
await admin.end();
const connectionString = `postgresql://postgres@${fixtureIp("pg")}:5432/portal_glpi_fixture_${runId}`;
const client = new pg.Client({ connectionString });
await client.connect();
try {
  const tables = await client.query(
    "SELECT to_regclass('public.\"PortalUser\"') AS present",
  );
  if (tables.rows[0].present)
    throw new Error(
      "Fresh isolated PostgreSQL database required; no data is deleted by this runner",
    );
  const directory = new URL("../prisma/migrations/", import.meta.url);
  for (const name of readdirSync(directory)
    .filter((n) => /^\d/.test(n))
    .sort()) {
    if (name === "20261020150000_persistent_glpi_access") {
      await client.query(`INSERT INTO "Category" (id, name, description) VALUES ('fixture-category', 'Synthetic', 'Synthetic fixture');
        INSERT INTO "Application" (id, code, name, description, "categoryId", icon, active, "updatedAt") VALUES ('fixture-glpi', 'GLPI', 'Synthetic GLPI', 'Synthetic', 'fixture-category', 'help', true, NOW());
        INSERT INTO "PortalUser" (id, "keycloakSubject", email, "displayName", "updatedAt") VALUES ('fixture-legacy-id', 'fixture-legacy', 'legacy-${runId}@example.invalid', 'Synthetic Legacy', NOW());`);
    }
    await client.query(
      readFileSync(new URL(`${name}/migration.sql`, directory), "utf8"),
    );
  }
} finally {
  await client.end();
}
execFileSync("pnpm", ["exec", "vitest", "run", "tests/glpi-isolated.test.ts"], {
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: connectionString,
    GLPI_ISOLATED_TEST: "1",
    GLPI_FIXTURE_HTTP_URL: `http://${fixtureIp("web")}`,
    GLPI_API_URL: "https://glpi.fixture.invalid/apirest.php",
    GLPI_LOGIN_ATTRIBUTE: "email",
    GLPI_API_APP_TOKEN: "synthetic-fixture-app-token",
    GLPI_API_USER_TOKEN: "synthetic-fixture-user-token",
  },
});

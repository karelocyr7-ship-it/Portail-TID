// Local cached images only; no production mounts or environment files.
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
const prefix = "portal-glpi-fixture-20261020";
const password = randomBytes(32).toString("hex");
function docker(args, input) {
  try {
    return execFileSync("sudo", ["docker", ...args], {
      input,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch {
    throw new Error(`Isolated fixture operation failed: ${args[0]}`);
  }
}
docker(["network", "create", "--internal", prefix]);
docker([
  "run",
  "--pull=never",
  "-d",
  "--name",
  `${prefix}-db`,
  "--network",
  prefix,
  "-e",
  `MARIADB_ROOT_PASSWORD=${password}`,
  "-e",
  "MARIADB_DATABASE=glpi_fixture",
  process.env.GLPI_FIXTURE_DB_IMAGE || "mariadb:11.4.13",
]);
docker([
  "run",
  "--pull=never",
  "-d",
  "--name",
  `${prefix}-web`,
  "--network",
  prefix,
  "-e",
  `GLPI_DB_HOST=${prefix}-db`,
  "-e",
  "GLPI_DB_PORT=3306",
  "-e",
  "GLPI_DB_NAME=glpi_fixture",
  "-e",
  "GLPI_DB_USER=root",
  "-e",
  `GLPI_DB_PASSWORD=${password}`,
  process.env.GLPI_FIXTURE_WEB_IMAGE || "glpi/glpi:11.0.11",
]);
docker([
  "run",
  "--pull=never",
  "-d",
  "--name",
  `${prefix}-pg`,
  "--network",
  prefix,
  "-e",
  "POSTGRES_HOST_AUTH_METHOD=trust",
  "-e",
  "POSTGRES_DB=portal_glpi_fixture",
  "postgres:16.10-alpine",
]);
let ready = false;
for (let attempt = 0; attempt < 90; attempt++) {
  try {
    docker([
      "exec",
      `${prefix}-web`,
      "php",
      "bin/console",
      "db:check",
      "--quiet",
    ]);
    ready = true;
    break;
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}
if (!ready) throw new Error("Isolated GLPI installation not ready");
docker(
  ["exec", "-i", `${prefix}-web`, "php"],
  readFileSync(new URL("./fixtures/glpi.php", import.meta.url)),
);
console.log(
  "Isolated GLPI and PostgreSQL fixtures ready; no production mount, no published port.",
);

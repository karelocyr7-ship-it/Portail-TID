// Lecture seule, cible confirmée, aucune donnée secrète affichée.
import { createRequire } from "node:module";
const require = createRequire("/app/apps/portal/package.json");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
try {
  const users = await db.portalUser.findMany({
    where: {
      OR: [
        { employeeId: { equals: "TIDC777", mode: "insensitive" } },
        { email: { equals: "c.navarre@atf.onl", mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      keycloakSubject: true,
      active: true,
      assignments: {
        select: {
          profile: {
            select: {
              application: { select: { code: true } },
              key: true,
              active: true,
            },
          },
        },
      },
    },
  });
  const app = await db.application.findUnique({
    where: { code: "GLPI" },
    select: {
      code: true,
      active: true,
      url: true,
      roles: { select: { keycloakRole: true } },
      profiles: { select: { key: true, active: true } },
      category: { select: { name: true, active: true } },
    },
  });
  const issuer = process.env.KEYCLOAK_ISSUER;
  const tokenResult = await fetch(issuer + "/protocol/openid-connect/token", {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.KEYCLOAK_ADMIN_CLIENT_ID,
      client_secret: process.env.KEYCLOAK_ADMIN_CLIENT_SECRET,
    }),
  });
  if (!tokenResult.ok) throw Error("Admin read unavailable");
  const token = (await tokenResult.json()).access_token;
  const base = issuer.replace("/realms/", "/admin/realms/");
  const roles = [];
  for (const user of users) {
    const response = await fetch(
      base +
        "/users/" +
        encodeURIComponent(user.keycloakSubject) +
        "/role-mappings/realm/composite",
      { headers: { authorization: "Bearer " + token } },
    );
    roles.push(
      response.ok
        ? (await response.json()).map((r) => r.name)
        : ["unavailable"],
    );
  }
  console.log(
    JSON.stringify({
      application: app,
      targetMatches: users.length,
      targets: users.map((u, i) => ({
        active: u.active,
        glpiAssignment: u.assignments.filter(
          (a) => a.profile.application.code === "GLPI",
        ),
        realmRoles: roles[i],
      })),
    }),
  );
} catch {
  console.error("Inspection indisponible, aucun secret affiché");
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}

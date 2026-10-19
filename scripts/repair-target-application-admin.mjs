// Targeted administrative operation; dry-run unless --apply. No secrets or PII output.
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
const require = createRequire("/app/apps/portal/package.json");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const [matricule, email, subject] = process.argv
  .slice(2)
  .filter((x) => !x.startsWith("--"));
const roles = {
  "CASH-RECON": "ADMIN",
  "REVUE-PDV": "super_admin",
  TDB: "ADMIN",
  ATF: "ADMIN",
  GPARC: "ADMIN",
  RECRUTEMENT: "RECRUT_OCI_ADMIN",
  SIRH: "PORTAL_ADMIN",
  GLPI: "ACCESS",
};
// SIRH email ambiguity requires separate reconciliation; GLPI has local roles.
const sync = new Set([
  "CASH-RECON",
  "REVUE-PDV",
  "TDB",
  "ATF",
  "GPARC",
  "RECRUTEMENT",
]);
try {
  if (!matricule || !email || !subject) throw Error();
  await db.$transaction(
    async (tx) => {
      const users = await tx.portalUser.findMany({
        where: {
          OR: [
            { keycloakSubject: subject },
            { employeeId: { equals: matricule, mode: "insensitive" } },
            { sageEmployeeId: { equals: matricule, mode: "insensitive" } },
            { email: { equals: email, mode: "insensitive" } },
          ],
        },
      });
      if (users.length !== 1) throw Error();
      const user = users[0];
      if (
        !user.active ||
        user.keycloakSubject !== subject ||
        user.email?.toLowerCase() !== email.toLowerCase() ||
        ![user.employeeId, user.sageEmployeeId].some(
          (x) => x?.toUpperCase() === matricule.toUpperCase(),
        )
      )
        throw Error();
      const snapshot = async () =>
        createHash("sha256")
          .update(
            JSON.stringify(
              await tx.userApplicationProfile.findMany({
                where: { userId: { not: user.id } },
                orderBy: [{ userId: "asc" }, { profileId: "asc" }],
              }),
            ),
          )
          .digest("hex");
      const beforeOthers = await snapshot();
      const apps = await tx.application.findMany({
        include: { profiles: true },
      });
      const result = [];
      for (const app of apps) {
        if (!app.active) {
          result.push({ application: app.code, status: "INACTIVE_UNCHANGED" });
          continue;
        }
        const key = roles[app.code];
        if (!key) throw Error();
        const profile = app.profiles.find((p) => p.key === key && p.active);
        if (!profile) throw Error();
        if (process.argv.includes("--apply")) {
          const previous = await tx.userApplicationProfile.findMany({
            where: { userId: user.id, profile: { applicationId: app.id } },
            select: { profileId: true },
          });
          await tx.userApplicationProfile.upsert({
            where: {
              userId_profileId: { userId: user.id, profileId: profile.id },
            },
            update: {},
            create: {
              userId: user.id,
              profileId: profile.id,
              assignedBy: "operator:admin-role-repair",
            },
          });
          await tx.userApplicationProfile.deleteMany({
            where: {
              userId: user.id,
              profileId: { not: profile.id },
              profile: { applicationId: app.id },
            },
          });
          if (sync.has(app.code))
            await tx.applicationProvisioningOutbox.upsert({
              where: {
                userId_applicationId: {
                  userId: user.id,
                  applicationId: app.id,
                },
              },
              update: {
                profileId: profile.id,
                status: "PENDING",
                lastError: null,
                nextAttemptAt: new Date(),
              },
              create: {
                userId: user.id,
                applicationId: app.id,
                profileId: profile.id,
                idempotencyKey: `${user.id}:${app.id}`,
              },
            });
          await tx.auditLog.create({
            data: {
              userId: "operator:admin-role-repair",
              eventType: "APPLICATION_ADMIN_PROFILE_REPAIRED",
              entityType: "PortalUser",
              entityId: user.id,
              beforeData: { application: app.code, profiles: previous },
              afterData: {
                application: app.code,
                profile: key,
                syncQueued: sync.has(app.code),
                identityUnchanged: true,
              },
            },
          });
        }
        result.push({
          application: app.code,
          profile: key,
          syncQueued: process.argv.includes("--apply") && sync.has(app.code),
        });
      }
      if (beforeOthers !== (await snapshot())) throw Error();
      console.log(
        JSON.stringify({
          applied: process.argv.includes("--apply"),
          otherAssignmentsUnchanged: true,
          applications: result,
        }),
      );
    },
    { timeout: 60000, isolationLevel: "Serializable" },
  );
} catch {
  console.error("Targeted role repair refused; no secrets displayed.");
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}

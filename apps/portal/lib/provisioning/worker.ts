import { randomUUID } from "node:crypto";
import { getPrisma } from "../prisma";

type ConnectorCode =
  | "TDB"
  | "CASH-RECON"
  | "REVUE-PDV"
  | "GPARC"
  | "ATF"
  | "MDM"
  | "SIRH"
  | "GED"
  | "RECRUTEMENT";

type Connector = { url: string; token: string };

const envKey = (code: ConnectorCode) => code.replace(/[^A-Z0-9]+/g, "_");

function connectorFor(code: string): Connector | null {
  if (!isConnectorCode(code)) return null;
  const prefix = envKey(code);
  const url =
    (code === "GED"
      ? process.env.DRIVE_PROVISIONING_URL
      : process.env[`${prefix}_PROVISIONING_URL`]
    )?.trim() ?? "";
  const token =
    (code === "GED"
      ? process.env.DRIVE_PROVISIONING_TOKEN
      : process.env[`${prefix}_PROVISIONING_TOKEN`]
    )?.trim() ?? "";
  return url && token ? { url, token } : null;
}

function isConnectorCode(code: string): code is ConnectorCode {
  return [
    "TDB",
    "CASH-RECON",
    "REVUE-PDV",
    "GPARC",
    "ATF",
    "MDM",
    "SIRH",
    "GED",
    "RECRUTEMENT",
  ].includes(code as ConnectorCode);
}

function splitDisplayName(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  return {
    first_name: parts.shift() ?? displayName,
    last_name: parts.join(" "),
  };
}

async function claimNextJob() {
  const prisma = getPrisma();
  const job = await prisma.applicationProvisioningOutbox.findFirst({
    where: {
      status: { in: ["PENDING", "RETRY", "REVOKE", "WAITING_CONFIG"] },
      nextAttemptAt: { lte: new Date() },
    },
    include: { user: true, application: true, profile: true },
    orderBy: { createdAt: "asc" },
  });
  if (!job) return null;
  const claimed = await prisma.applicationProvisioningOutbox.updateMany({
    where: {
      id: job.id,
      status: { in: ["PENDING", "RETRY", "REVOKE", "WAITING_CONFIG"] },
    },
    data: { status: "PROCESSING", attempts: { increment: 1 } },
  });
  return claimed.count === 1 ? job : null;
}

async function provisionApplication(
  job: Awaited<ReturnType<typeof claimNextJob>>,
) {
  if (!job) return;
  const connector = connectorFor(job.application.code);
  if (!connector) return "WAITING_CONFIG" as const;
  const { first_name, last_name } = splitDisplayName(job.user.displayName);
  const response = await fetch(connector.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      // Keep the existing GED header for backward compatibility. New
      // connectors should accept this same header and the application code in
      // the signed body to avoid per-application authentication schemes.
      "x-sirh-provisioning-token": connector.token,
    },
    body: JSON.stringify({
      application: job.application.code,
      profile: job.profile.key,
      sage_id: job.user.sageEmployeeId ?? job.user.employeeId,
      email: job.user.email,
      first_name,
      last_name,
      enabled: job.status !== "REVOKE",
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok)
    throw new Error(
      `${job.application.code} provisioning HTTP ${response.status}`,
    );
  return "COMPLETED" as const;
}

async function processOne() {
  const prisma = getPrisma();
  const job = await claimNextJob();
  if (!job) return false;
  try {
    const result = await provisionApplication(job);
    await prisma.applicationProvisioningOutbox.update({
      where: { id: job.id },
      data: {
        status: result,
        lastError:
          result === "WAITING_CONFIG"
            ? `Connector ${job.application.code} not configured`
            : null,
        nextAttemptAt:
          result === "WAITING_CONFIG"
            ? new Date(Date.now() + 5 * 60_000)
            : new Date(),
      },
    });
  } catch (error) {
    const retry = job.attempts + 1 < 5;
    await prisma.applicationProvisioningOutbox.update({
      where: { id: job.id },
      data: {
        status: retry ? "RETRY" : "FAILED",
        lastError:
          error instanceof Error
            ? error.message.slice(0, 500)
            : "Provisioning failed",
        nextAttemptAt: new Date(
          Date.now() + (retry ? 2 ** (job.attempts + 1) * 30_000 : 0),
        ),
      },
    });
  }
  return true;
}

export async function runProvisioningWorker() {
  console.info(
    JSON.stringify({
      event: "provisioning.worker_started",
      workerId: `provisioning-worker-${randomUUID()}`,
    }),
  );
  for (;;) {
    if (!(await processOne()))
      await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
}

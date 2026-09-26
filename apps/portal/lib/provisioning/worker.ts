import { randomUUID } from "node:crypto";
import { getPrisma } from "../prisma";

const driveUrl = () => process.env.DRIVE_PROVISIONING_URL?.trim();
const driveToken = () => process.env.DRIVE_PROVISIONING_TOKEN?.trim();

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
      status: { in: ["PENDING", "RETRY", "REVOKE"] },
      nextAttemptAt: { lte: new Date() },
      application: { code: "GED", active: true },
    },
    include: { user: true, application: true, profile: true },
    orderBy: { createdAt: "asc" },
  });
  if (!job) return null;
  const claimed = await prisma.applicationProvisioningOutbox.updateMany({
    where: { id: job.id, status: { in: ["PENDING", "RETRY", "REVOKE"] } },
    data: { status: "PROCESSING", attempts: { increment: 1 } },
  });
  return claimed.count === 1 ? job : null;
}

async function provisionDrive(job: Awaited<ReturnType<typeof claimNextJob>>) {
  if (!job) return;
  const url = driveUrl();
  const token = driveToken();
  if (!url || !token)
    throw new Error("Drive provisioning configuration is missing");
  const { first_name, last_name } = splitDisplayName(job.user.displayName);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-sirh-provisioning-token": token,
    },
    body: JSON.stringify({
      sage_id: job.user.sageEmployeeId ?? job.user.employeeId,
      email: job.user.email,
      first_name,
      last_name,
      enabled: job.status !== "REVOKE",
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok)
    throw new Error(`Drive provisioning HTTP ${response.status}`);
}

async function processOne() {
  const prisma = getPrisma();
  const job = await claimNextJob();
  if (!job) return false;
  try {
    await provisionDrive(job);
    await prisma.applicationProvisioningOutbox.update({
      where: { id: job.id },
      data: { status: "COMPLETED", lastError: null },
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

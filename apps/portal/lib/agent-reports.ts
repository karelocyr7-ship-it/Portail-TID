import {
  access,
  mkdir,
  readdir,
  readFile,
  rename,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { getPrisma } from "@/lib/prisma";

const applicationByAgent: Record<string, string> = {
  "tdb-agent": "tdb",
  "cash-recon-agent": "cash-recon",
  "revue-pdv-agent": "revue-pdv",
  "gparc-agent": "gparc",
  "mdm-agent": "mdm",
  "recrutement-om-telco-agent": "recrutement-om-telco",
};

const resultsRoot =
  process.env.AGENT_RESULTS_DIR ?? "/var/lib/tad-agent-results";
const queueRoot = process.env.AGENT_QUEUE_DIR ?? "/var/lib/tad-agent-queue";

function extractTaskId(body: string, fileName: string) {
  return (
    body.match(/^- Tâche : (.+)$/m)?.[1]?.trim() ??
    fileName.replace(/\.md$/, "")
  );
}

function extractSummary(body: string) {
  const state = body.match(/^- \*\*État\s*:\*\*\s*(.+)$/m)?.[1]?.trim();
  if (state) return state;
  return (
    body
      .split("\n")
      .map((line) => line.replace(/^[-#\s]+/, "").trim())
      .find((line) => line.length > 20) ??
    "Rapport reçu depuis le runtime des agents."
  );
}

export async function syncAgentReports() {
  let agentDirectories: string[];
  try {
    agentDirectories = await readdir(resultsRoot);
  } catch {
    return 0;
  }

  const prisma = getPrisma();
  let imported = 0;
  for (const agentId of agentDirectories) {
    const applicationId = applicationByAgent[agentId];
    if (!applicationId) continue;
    const agentDirectory = path.join(resultsRoot, agentId);
    let files: string[];
    try {
      files = await readdir(agentDirectory);
    } catch {
      continue;
    }
    for (const fileName of files.filter((file) => file.endsWith(".md"))) {
      const reportPath = path.join(agentDirectory, fileName);
      const reportBody = await readFile(reportPath, "utf8");
      const taskId = extractTaskId(reportBody, fileName);
      const title = `Rapport runtime — ${agentId}`;
      const summary = extractSummary(reportBody);
      await prisma.agentReport.upsert({
        where: { taskId },
        create: {
          taskId,
          applicationId,
          agentId,
          title,
          summary,
          reportBody,
          evidence: { source: "agent-runtime", fileName },
        },
        update: {
          applicationId,
          agentId,
          title,
          summary,
          reportBody,
          evidence: { source: "agent-runtime", fileName },
        },
      });
      imported += 1;
    }
  }
  return imported;
}

async function pathExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function dispatchQueuedAgentActions() {
  const actions = await getPrisma().agentAction.findMany({
    where: { status: "QUEUED" },
    include: { report: true },
    orderBy: { requestedAt: "asc" },
  });
  let dispatched = 0;
  for (const action of actions) {
    if (!applicationByAgent[action.report.agentId]) continue;
    const queueDirectory = path.join(queueRoot, action.report.agentId);
    const taskName = `PORTAL-${action.id}.task`;
    const queuePath = path.join(queueDirectory, taskName);
    const archivePath = path.join(
      resultsRoot,
      action.report.agentId,
      "tasks",
      taskName,
    );
    if ((await pathExists(queuePath)) || (await pathExists(archivePath)))
      continue;

    await mkdir(queueDirectory, { recursive: true });
    const temporaryPath = `${queuePath}.tmp`;
    const task = [
      `Action validée par un administrateur du Portail.`,
      `Application : ${action.report.applicationId}`,
      `Agent : ${action.report.agentId}`,
      `Rapport d’origine : ${action.report.taskId}`,
      `Décision : ${action.action}`,
      "",
      "Traite uniquement cette proposition dans le périmètre autorisé.",
      "Ne déploie rien, ne lis aucun secret, ne contacte aucune VM distante et ne modifie aucune base.",
      "Produis un rapport de résultat et indique explicitement les risques et la nécessité d’une validation humaine.",
    ].join("\n");
    await writeFile(temporaryPath, `${task}\n`, { mode: 0o640 });
    await rename(temporaryPath, queuePath);
    dispatched += 1;
  }
  return dispatched;
}

export async function syncAgentActionStatuses() {
  const prisma = getPrisma();
  const actions = await prisma.agentAction.findMany({
    where: { status: { in: ["QUEUED", "EXECUTING"] } },
    include: { report: true },
  });
  for (const action of actions) {
    const taskName = `PORTAL-${action.id}.task`;
    const archivePath = path.join(
      resultsRoot,
      action.report.agentId,
      "tasks",
      taskName,
    );
    const resultPath = path.join(
      resultsRoot,
      action.report.agentId,
      taskName.replace(/\.task$/, ".md"),
    );
    if (await pathExists(resultPath)) {
      const result = await readFile(resultPath, "utf8");
      const failed = /non exécuté|bloqué|échec|failed/i.test(result);
      await prisma.agentAction.update({
        where: { id: action.id },
        data: {
          status: failed ? "FAILED" : "COMPLETED",
          executedAt: new Date(),
          error: failed
            ? "Le rapport runtime signale un blocage technique."
            : null,
        },
      });
    } else if (await pathExists(archivePath)) {
      await prisma.agentAction.update({
        where: { id: action.id },
        data: { status: "EXECUTING" },
      });
    }
  }
}

export async function getAgentReports() {
  return getPrisma().agentReport.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      actions: {
        orderBy: { requestedAt: "desc" },
        take: 3,
      },
    },
  });
}

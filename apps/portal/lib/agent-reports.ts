import { readdir, readFile } from "node:fs/promises";
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

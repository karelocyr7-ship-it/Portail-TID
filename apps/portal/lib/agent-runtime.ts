import { access } from "node:fs/promises";
import path from "node:path";
import { agentCatalog } from "@/lib/agents/catalog";
import { getPrisma } from "@/lib/prisma";

const stateRoot = process.env.AGENT_STATE_DIR ?? "/var/lib/tad-agent-state";
const vmByAgent: Record<string, string> = {
  "portal-agent": "Portail · 54.37.11.202",
  "glpi-agent": "Portail · 54.37.11.202",
  "sirh-agent": "SIRH/GED · 152.228.138.54",
  "tdb-agent": "TDB/Perf-TID · 135.125.132.51",
  "cash-recon-agent": "CASH-RECON · 135.125.132.51",
  "revue-pdv-agent": "Revue-PDV · 135.125.132.51",
  "atf-agent": "ATF · 51.178.142.237",
  "gparc-agent": "GParc · 51.91.102.44",
  "mdm-agent": "MDM · 91.134.255.77",
  "recrutement-om-telco-agent": "Recrutement OM/Telco · 91.134.255.77",
};

export type AgentRuntimeStatus = {
  agentId: string;
  applicationId: string;
  vm: string;
  environment: string;
  status: "EXECUTING" | "QUEUED" | "IDLE" | "OFFLINE" | "UNREGISTERED";
  task: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  lastSeenAt: string | null;
};

export async function isAgentDispatchPaused(): Promise<boolean> {
  try {
    await access(path.join(stateRoot, "stop-new-tasks"));
    return true;
  } catch {
    return false;
  }
}

export async function getAgentRuntimeStatus(): Promise<AgentRuntimeStatus[]> {
  const prisma = getPrisma();
  const agentIds = Object.keys(agentCatalog);
  const [credentials, tasks] = await Promise.all([
    prisma.agentCredential.findMany({ where: { agentId: { in: agentIds } } }),
    prisma.agentTask.findMany({
      where: { agentId: { in: agentIds } },
      orderBy: { requestedAt: "desc" },
      take: agentIds.length * 3,
      select: {
        id: true,
        agentId: true,
        task: true,
        status: true,
        summary: true,
        startedAt: true,
        finishedAt: true,
      },
    }),
  ]);
  const credentialByAgent = new Map(
    credentials.map((credential) => [credential.agentId, credential]),
  );
  const tasksByAgent = new Map<string, (typeof tasks)[number][]>();
  for (const task of tasks) {
    const agentTasks = tasksByAgent.get(task.agentId) ?? [];
    agentTasks.push(task);
    tasksByAgent.set(task.agentId, agentTasks);
  }
  const now = Date.now();

  return agentIds.map((agentId) => {
    const app = agentCatalog[agentId as keyof typeof agentCatalog];
    const credential = credentialByAgent.get(agentId);
    const agentTasks = tasksByAgent.get(agentId) ?? [];
    const activeTask = agentTasks.find((task) => task.status === "EXECUTING");
    const queuedTask = agentTasks.find((task) => task.status === "QUEUED");
    const latest = agentTasks[0];
    const online =
      credential?.active === true &&
      credential.lastSeenAt !== null &&
      now - credential.lastSeenAt.getTime() < 60_000;
    let status: AgentRuntimeStatus["status"] = !credential?.active
      ? "UNREGISTERED"
      : online
        ? "IDLE"
        : "OFFLINE";
    if (activeTask) status = "EXECUTING";
    else if (queuedTask) status = "QUEUED";
    const currentTask = activeTask ?? queuedTask ?? latest;

    return {
      agentId,
      applicationId: app.applicationId,
      vm: vmByAgent[agentId] ?? "VM à confirmer",
      environment: "production",
      status,
      task: currentTask?.summary ?? currentTask?.task ?? null,
      startedAt: currentTask?.startedAt?.toISOString() ?? null,
      finishedAt: latest?.finishedAt?.toISOString() ?? null,
      lastSeenAt: credential?.lastSeenAt?.toISOString() ?? null,
    };
  });
}

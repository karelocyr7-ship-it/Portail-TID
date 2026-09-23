import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";

const stateRoot = process.env.AGENT_STATE_DIR ?? "/var/lib/tad-agent-state";
const queueRoot = process.env.AGENT_QUEUE_DIR ?? "/var/lib/tad-agent-queue";

const metadata: Record<
  string,
  { applicationId: string; vm: string; environment: string }
> = {
  "tdb-agent": {
    applicationId: "tdb",
    vm: "135.125.132.51",
    environment: "production",
  },
  "cash-recon-agent": {
    applicationId: "cash-recon",
    vm: "135.125.132.51",
    environment: "production",
  },
  "revue-pdv-agent": {
    applicationId: "revue-pdv",
    vm: "135.125.132.51",
    environment: "production",
  },
  "gparc-agent": {
    applicationId: "gparc",
    vm: "51.91.102.44",
    environment: "production",
  },
  "mdm-agent": {
    applicationId: "mdm",
    vm: "91.134.255.77",
    environment: "production",
  },
  "recrutement-om-telco-agent": {
    applicationId: "recrutement-om-telco",
    vm: "91.134.255.77",
    environment: "production",
  },
};

export type AgentRuntimeStatus = {
  agentId: string;
  applicationId: string;
  vm: string;
  environment: string;
  status: "EXECUTING" | "QUEUED" | "COMPLETED" | "IDLE";
  task: string | null;
  startedAt: string | null;
  finishedAt: string | null;
};

async function readJson(filePath: string) {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as Record<
      string,
      string
    >;
  } catch {
    return null;
  }
}

export async function isAgentDispatchPaused(): Promise<boolean> {
  try {
    await access(path.join(stateRoot, "stop-new-tasks"));
    return true;
  } catch {
    return false;
  }
}

export async function getAgentRuntimeStatus(): Promise<AgentRuntimeStatus[]> {
  return Promise.all(
    Object.entries(metadata).map(async ([agentId, app]) => {
      const current = await readJson(path.join(stateRoot, "current.json"));
      const last = await readJson(path.join(stateRoot, "last.json"));
      let queued = false;
      try {
        queued = (await readdir(path.join(queueRoot, agentId))).some((name) =>
          name.endsWith(".task"),
        );
      } catch {}
      const runtime =
        current?.agentId === agentId
          ? current
          : last?.agentId === agentId
            ? last
            : null;
      return {
        agentId,
        applicationId: runtime?.applicationId ?? app.applicationId,
        vm: runtime?.vm ?? app.vm,
        environment: runtime?.environment ?? app.environment,
        status:
          current?.agentId === agentId
            ? "EXECUTING"
            : queued
              ? "QUEUED"
              : runtime?.status === "COMPLETED"
                ? "COMPLETED"
                : "IDLE",
        task: runtime?.task ?? null,
        startedAt: runtime?.startedAt ?? null,
        finishedAt: runtime?.finishedAt ?? null,
      } satisfies AgentRuntimeStatus;
    }),
  );
}

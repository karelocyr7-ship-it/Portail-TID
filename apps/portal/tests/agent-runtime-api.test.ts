import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateAgent: vi.fn(),
  getPrisma: vi.fn(),
}));
vi.mock("@/lib/agents/auth", () => ({
  authenticateAgent: mocks.authenticateAgent,
}));
vi.mock("@/lib/prisma", () => ({ getPrisma: mocks.getPrisma }));

import { POST as claimTask } from "@/app/api/agent-runtime/tasks/claim/route";
import { POST as completeTask } from "@/app/api/agent-runtime/tasks/[taskId]/complete/route";

const task = {
  id: "synthetic-task-1",
  applicationId: "tdb",
  agentId: "tdb-agent",
  task: "Modifier la page de synthèse et exécuter les tests.",
};
const findFirst = vi.fn();
const updateMany = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mocks.authenticateAgent.mockResolvedValue("tdb-agent");
  mocks.getPrisma.mockReturnValue({
    agentTask: { findFirst, updateMany },
  });
});

it("claims only a queued task for the authenticated agent", async () => {
  findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(task);
  updateMany
    .mockResolvedValueOnce({ count: 0 })
    .mockResolvedValueOnce({ count: 1 });
  const response = await claimTask(
    new Request("https://portal.invalid/api/agent-runtime/tasks/claim", {
      method: "POST",
    }),
  );
  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toMatchObject({
    task: { id: task.id, applicationId: "tdb", task: task.task },
  });
  expect(updateMany).toHaveBeenLastCalledWith(
    expect.objectContaining({
      where: { id: task.id, status: "QUEUED", agentId: "tdb-agent" },
      data: expect.objectContaining({
        status: "EXECUTING",
        leaseExpiresAt: expect.any(Date),
      }),
    }),
  );
});

it("does not let a different agent complete a claimed task", async () => {
  updateMany.mockResolvedValueOnce({ count: 0 });
  const response = await completeTask(
    new Request("https://portal.invalid/api/agent-runtime/tasks/x/complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        status: "COMPLETED",
        summary: "Synthétique",
        report: "Tests réussis.",
      }),
    }),
    { params: Promise.resolve({ taskId: "synthetic-other-task" }) },
  );
  expect(response.status).toBe(404);
  expect(updateMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        id: "synthetic-other-task",
        agentId: "tdb-agent",
        status: "EXECUTING",
      },
    }),
  );
});

it("rejects an oversized report", async () => {
  const response = await completeTask(
    new Request("https://portal.invalid/api/agent-runtime/tasks/x/complete", {
      method: "POST",
      headers: { "content-length": "90000" },
      body: "{}",
    }),
    { params: Promise.resolve({ taskId: "synthetic-task-1" }) },
  );
  expect(response.status).toBe(413);
  expect(mocks.authenticateAgent).not.toHaveBeenCalled();
});

import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getPrisma: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ getPrisma: mocks.getPrisma }));

import { authenticateAgent, hashAgentToken } from "@/lib/agents/auth";

const token = "a".repeat(64);
let credential: { agentId: string; tokenHash: string; active: boolean } | null;
const update = vi.fn();

beforeEach(() => {
  credential = {
    agentId: "tdb-agent",
    tokenHash: hashAgentToken(token),
    active: true,
  };
  vi.clearAllMocks();
  mocks.getPrisma.mockReturnValue({
    agentCredential: {
      findUnique: async ({ where }: { where: { agentId: string } }) =>
        credential?.agentId === where.agentId ? credential : null,
      update,
    },
  });
});

it("authenticates a registered agent and records its heartbeat", async () => {
  const request = new Request(
    "https://portal.invalid/api/agent-runtime/tasks/claim",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "x-tad-agent-id": "tdb-agent",
      },
    },
  );
  await expect(authenticateAgent(request)).resolves.toBe("tdb-agent");
  expect(update).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { agentId: "tdb-agent" },
      data: { lastSeenAt: expect.any(Date) },
    }),
  );
});

it("rejects mismatched, inactive, malformed, and unknown agent credentials", async () => {
  const requestFor = (agentId: string, value: string) =>
    new Request("https://portal.invalid/api/agent-runtime/tasks/claim", {
      method: "POST",
      headers: {
        authorization: `Bearer ${value}`,
        "x-tad-agent-id": agentId,
      },
    });
  await expect(
    authenticateAgent(requestFor("gparc-agent", token)),
  ).resolves.toBeNull();
  credential = { ...credential!, active: false };
  await expect(
    authenticateAgent(requestFor("tdb-agent", token)),
  ).resolves.toBeNull();
  await expect(
    authenticateAgent(requestFor("tdb-agent", "short")),
  ).resolves.toBeNull();
  await expect(
    authenticateAgent(requestFor("unknown-agent", token)),
  ).resolves.toBeNull();
  expect(update).not.toHaveBeenCalled();
});

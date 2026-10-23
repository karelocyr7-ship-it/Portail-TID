import { NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/agents/auth";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const agentId = await authenticateAgent(request);
  if (!agentId)
    return NextResponse.json({ error: "Agent non autorisé" }, { status: 401 });

  const prisma = getPrisma();
  await prisma.agentTask.updateMany({
    where: {
      agentId,
      status: "EXECUTING",
      leaseExpiresAt: { lt: new Date() },
    },
    data: { status: "QUEUED", startedAt: null, leaseExpiresAt: null },
  });
  const current = await prisma.agentTask.findFirst({
    where: { agentId, status: "EXECUTING" },
    select: { id: true },
  });
  if (current) return NextResponse.json({ task: null, busy: true });

  const candidate = await prisma.agentTask.findFirst({
    where: { agentId, status: "QUEUED" },
    orderBy: { requestedAt: "asc" },
  });
  if (!candidate) return NextResponse.json({ task: null, busy: false });

  const claimed = await prisma.agentTask.updateMany({
    where: { id: candidate.id, status: "QUEUED", agentId },
    data: {
      status: "EXECUTING",
      startedAt: new Date(),
      leaseExpiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
    },
  });
  if (claimed.count !== 1) return NextResponse.json({ task: null, busy: true });

  return NextResponse.json({
    task: {
      id: candidate.id,
      applicationId: candidate.applicationId,
      task: candidate.task,
      productionOperation: candidate.productionOperation,
    },
  });
}

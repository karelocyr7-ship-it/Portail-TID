import { NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/agents/auth";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ taskId: string }> },
) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 70_000)
    return NextResponse.json(
      { error: "Rapport trop volumineux" },
      { status: 413 },
    );
  const agentId = await authenticateAgent(request);
  if (!agentId)
    return NextResponse.json({ error: "Agent non autorisé" }, { status: 401 });
  const { taskId } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    status?: string;
    summary?: string;
    report?: string;
    workspacePath?: string;
  } | null;
  if (
    !body ||
    !["COMPLETED", "FAILED"].includes(body.status ?? "") ||
    typeof body.summary !== "string" ||
    body.summary.length > 4000 ||
    typeof body.report !== "string" ||
    body.report.length > 64_000 ||
    (body.workspacePath !== undefined &&
      (typeof body.workspacePath !== "string" ||
        body.workspacePath.length > 500))
  ) {
    return NextResponse.json({ error: "Rapport invalide" }, { status: 400 });
  }

  const result = await getPrisma().agentTask.updateMany({
    where: { id: taskId, agentId, status: "EXECUTING" },
    data: {
      status: body.status,
      summary: body.summary,
      report: body.report,
      workspacePath: body.workspacePath,
      leaseExpiresAt: null,
      error: body.status === "FAILED" ? body.summary : null,
      finishedAt: new Date(),
    },
  });
  if (result.count !== 1)
    return NextResponse.json(
      { error: "Tâche introuvable ou déjà terminée" },
      { status: 404 },
    );
  return NextResponse.json({ ok: true });
}

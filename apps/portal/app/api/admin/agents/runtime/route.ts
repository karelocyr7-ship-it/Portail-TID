import { NextResponse } from "next/server";
import { getRoles, getSession } from "@/lib/oidc";
import {
  getAgentRuntimeStatus,
  isAgentDispatchPaused,
} from "@/lib/agent-runtime";

export async function GET() {
  const session = await getSession();
  if (!session || !getRoles(session).includes("PORTAL_ADMIN")) {
    return NextResponse.json(
      { error: "Accès administrateur requis" },
      { status: 403 },
    );
  }
  const [agents, paused] = await Promise.all([
    getAgentRuntimeStatus(),
    isAgentDispatchPaused(),
  ]);
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    paused,
    agents,
  });
}

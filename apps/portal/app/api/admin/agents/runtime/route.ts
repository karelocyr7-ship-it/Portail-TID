import { NextResponse } from "next/server";
import { getRoles, getSession } from "@/lib/oidc";
import { getAgentRuntimeStatus } from "@/lib/agent-runtime";

export async function GET() {
  const session = await getSession();
  if (!session || !getRoles(session).includes("PORTAL_ADMIN")) {
    return NextResponse.json(
      { error: "Accès administrateur requis" },
      { status: 403 },
    );
  }
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    agents: await getAgentRuntimeStatus(),
  });
}

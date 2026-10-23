import { createHash, timingSafeEqual } from "node:crypto";
import { getPrisma } from "@/lib/prisma";
import { isPortalAgentId, type PortalAgentId } from "./catalog";

export function hashAgentToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function tokenMatches(token: string, expectedHash: string) {
  if (!/^[a-f0-9]{64}$/i.test(expectedHash)) return false;
  const actual = Buffer.from(hashAgentToken(token), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function authenticateAgent(request: Request) {
  const agentId = request.headers.get("x-tad-agent-id") ?? "";
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.match(/^Bearer ([A-Za-z0-9_-]{40,})$/)?.[1];
  if (!token || !isPortalAgentId(agentId)) return null;

  const credential = await getPrisma().agentCredential.findUnique({
    where: { agentId },
  });
  if (!credential?.active || !tokenMatches(token, credential.tokenHash))
    return null;

  await getPrisma().agentCredential.update({
    where: { agentId },
    data: { lastSeenAt: new Date() },
  });
  return agentId as PortalAgentId;
}

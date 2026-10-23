import type { PortalAgentId } from "./catalog";

export const productionOperations = {
  "portal-agent": ["STATUS_APP", "RESTART_APP"],
  "monitoring-agent": ["STATUS_APP", "RESTART_APP"],
  "tdb-agent": ["STATUS_APP", "RESTART_APP"],
  "cash-recon-agent": ["STATUS_APP", "RESTART_APP"],
  "revue-pdv-agent": ["STATUS_APP", "RESTART_APP"],
} as const satisfies Partial<Record<PortalAgentId, readonly string[]>>;

export type ProductionOperation = "NONE" | "STATUS_APP" | "RESTART_APP";

export function supportsProductionOperation(
  agentId: string,
  operation: string,
) {
  if (operation === "NONE") return true;
  return Object.hasOwn(productionOperations, agentId)
    ? (
        productionOperations[
          agentId as keyof typeof productionOperations
        ] as readonly string[]
      ).includes(operation)
    : false;
}

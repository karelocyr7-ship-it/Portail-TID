import { expect, it } from "vitest";
import {
  agentCatalog,
  agentForApplication,
  isPortalAgentId,
} from "@/lib/agents/catalog";

it("routes monitoring tasks to the dedicated Supervision VM runner", () => {
  expect(isPortalAgentId("monitoring-agent")).toBe(true);
  expect(agentCatalog["monitoring-agent"]).toEqual({
    applicationId: "monitoring",
    name: "Supervision des VM",
  });
  expect(agentForApplication("monitoring")).toBe("monitoring-agent");
});

it("keeps SEPTNEX outside the Portal-managed application runners", () => {
  expect(isPortalAgentId("supervision-agent")).toBe(false);
  expect(agentForApplication("supervision")).toBeUndefined();
});

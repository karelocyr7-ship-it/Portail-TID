import { expect, it } from "vitest";
import { agentCatalog, isPortalAgentId } from "@/lib/agents/catalog";

it("routes supervision tasks to the dedicated SEPTNEX runner", () => {
  expect(isPortalAgentId("supervision-agent")).toBe(true);
  expect(agentCatalog["supervision-agent"]).toEqual({
    applicationId: "supervision",
    name: "Supervision / SEPTNEX",
  });
  expect(isPortalAgentId("unknown-supervision-agent")).toBe(false);
});

import { expect, it } from "vitest";
import {
  agentForApplication,
  isPortalAgentId,
} from "@/lib/agents/catalog";

it("keeps SEPTNEX outside the Portal-managed application runners", () => {
  expect(isPortalAgentId("supervision-agent")).toBe(false);
  expect(agentForApplication("supervision")).toBeUndefined();
});

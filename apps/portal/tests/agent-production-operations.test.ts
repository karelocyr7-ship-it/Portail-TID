import { expect, it } from "vitest";
import { supportsProductionOperation } from "@/lib/agents/production-operations";

it("allows only explicitly listed production operations for each runner", () => {
  expect(supportsProductionOperation("tdb-agent", "STATUS_APP")).toBe(true);
  expect(supportsProductionOperation("tdb-agent", "RESTART_APP")).toBe(true);
  expect(supportsProductionOperation("tdb-agent", "SHELL")).toBe(false);
  expect(supportsProductionOperation("sirh-agent", "RESTART_APP")).toBe(false);
  expect(supportsProductionOperation("unknown-agent", "RESTART_APP")).toBe(
    false,
  );
  expect(supportsProductionOperation("unknown-agent", "NONE")).toBe(true);
});

import { describe, expect, it } from "vitest";
import { isEmployeeId, normalizeEmployeeId } from "../lib/employee-id";

describe("matricules d’entreprise", () => {
  it.each([
    "TID000",
    "tid123",
    "TIDP000",
    "tidp12345",
    "TIDS001",
    "TIDC001",
    "TIDPS001",
    "TIDPC001",
  ])("accepte %s", (value) => {
    expect(isEmployeeId(value)).toBe(true);
    expect(normalizeEmployeeId(value)).toBe(value.toUpperCase());
  });

  it.each([
    "TID",
    "TID12",
    "TID+000",
    "TIDP",
    "TIDXS001",
    "TIDPCS001",
    "user@example.com",
  ])("refuse %s", (value) => {
    expect(normalizeEmployeeId(value)).toBeUndefined();
  });
});

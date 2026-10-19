import { describe, expect, it } from "vitest";
import { profilesForApplicationCheckboxes as select } from "@/lib/application-checkbox-profiles";
const admin = { id: "cash-admin", applicationId: "cash" };
const viewer = { id: "cash-viewer", applicationId: "cash" };
const glpi = { id: "glpi-access", applicationId: "glpi" };
describe("application checkbox role preservation", () => {
  it("never downgrades ADMIN to VIEWER when the application stays selected", () => {
    expect(select([admin], [viewer], ["cash"])).toEqual([admin]);
  });
  it("uses the minimal profile only for a newly selected application", () => {
    expect(select([], [viewer], ["cash"])).toEqual([viewer]);
  });
  it("allows an explicit access withdrawal", () => {
    expect(select([admin], [viewer], [])).toEqual([]);
  });
  it("preserves applications absent from the editor", () => {
    expect(select([admin, glpi], [viewer], ["cash"])).toEqual([admin, glpi]);
  });
  it("preserves assignments when the field is absent", () => {
    expect(select([admin, glpi], [viewer], null)).toEqual([admin, glpi]);
  });
  it("preserves several existing profiles in one application", () => {
    expect(select([admin, viewer], [viewer], ["cash"])).toEqual([
      admin,
      viewer,
    ]);
  });
  it("rejects unknown applications and ambiguous defaults", () => {
    expect(() => select([], [viewer], ["unknown"])).toThrow();
    expect(() => select([], [viewer, admin], ["cash"])).toThrow();
  });
});

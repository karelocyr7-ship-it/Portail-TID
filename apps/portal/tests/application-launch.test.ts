import { describe, expect, it } from "vitest";
import { getApplicationLaunchHref } from "@/lib/application-launch";

describe("getApplicationLaunchHref", () => {
  it("passes the portal identity hint to Revue-PDV only", () => {
    expect(
      getApplicationLaunchHref(
        {
          code: "REVUE-PDV",
          url: "https://pdv.example.test/api/auth/oidc/start",
        },
        "TID0328",
      ),
    ).toBe("https://pdv.example.test/api/auth/oidc/start?login_hint=TID0328");
  });

  it("does not change URLs of applications without identity-bound launch support", () => {
    expect(
      getApplicationLaunchHref(
        { code: "TDB", url: "https://tdb.example.test" },
        "TID0328",
      ),
    ).toBe("https://tdb.example.test");
  });
});

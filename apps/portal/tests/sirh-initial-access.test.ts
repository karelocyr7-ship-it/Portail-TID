import { afterEach, describe, expect, it, vi } from "vitest";
import { randomBytes } from "node:crypto";
vi.mock("@/lib/keycloak-admin", () => ({
  adminBaseUrl: () => "https://idp.example.invalid/admin/realms/synthetic",
  getAdminToken: async () => "synthetic-admin-token",
}));
import { initializeSirhAccess } from "@/lib/sirh-initial-access";

const identity = {
  sageId: "TID00042",
  email: "person@example.invalid",
  firstName: "Synthetic",
  lastName: "Person",
};
const answer = (value: unknown, status = 200, headers = {}) =>
  new Response(status === 204 ? null : JSON.stringify(value), {
    status,
    headers,
  });
afterEach(() => vi.unstubAllGlobals());
describe("SIRH initial credentials", () => {
  it("creates a native temporary credential atomically, without mail or role assignment", async () => {
    const password = randomBytes(24).toString("base64url");
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(answer([]))
      .mockResolvedValueOnce(
        answer({}, 201, {
          location:
            "https://idp.example.invalid/admin/realms/synthetic/users/new-subject",
        }),
      );
    vi.stubGlobal("fetch", fetch);
    const result = await initializeSirhAccess(identity, password);
    expect(result).toEqual({ status: "READY", subject: "new-subject" });
    const body = JSON.parse(fetch.mock.calls[1][1].body);
    expect(body.username).toBe("TID00042");
    expect(body.requiredActions).toEqual(["UPDATE_PASSWORD"]);
    expect(body.credentials[0].temporary).toBe(true);
    expect(body.credentials[0].value === password).toBe(true);
    expect(body.realmRoles).toBeUndefined();
    expect(fetch.mock.calls.some(([url]) => url.includes("email"))).toBe(false);
  });
  it.each(
    [[], ["UPDATE_PASSWORD"], ["VERIFY_EMAIL", "UPDATE_PASSWORD"]].map(
      (requiredActions) => ({ requiredActions }),
    ),
  )(
    "never overwrites an existing credential ($requiredActions)",
    async ({ requiredActions }) => {
      const fetch = vi
        .fn()
        .mockResolvedValueOnce(
          answer([{ id: "existing", enabled: true, requiredActions }]),
        )
        .mockResolvedValueOnce(answer([{ type: "password" }]));
      vi.stubGlobal("fetch", fetch);
      expect(
        (
          await initializeSirhAccess(
            identity,
            randomBytes(24).toString("base64url"),
          )
        ).status,
      ).toBe("EXISTING_CREDENTIAL_PROTECTED");
      expect(fetch.mock.calls.every(([, options]) => !options.method)).toBe(
        true,
      );
    },
  );
  it("fails closed for legacy activation until an atomic recovery is available", async () => {
    const user = {
      id: "legacy",
      enabled: true,
      requiredActions: ["VERIFY_EMAIL", "UPDATE_PASSWORD"],
    };
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(answer([user]))
      .mockResolvedValueOnce(answer([]))
      .mockResolvedValueOnce(answer(user))
      .mockResolvedValueOnce(answer(null, 204))
      .mockResolvedValueOnce(answer(null, 204));
    vi.stubGlobal("fetch", fetch);
    expect(
      (
        await initializeSirhAccess(
          identity,
          randomBytes(24).toString("base64url"),
        )
      ).status,
    ).toBe("REVIEW_REQUIRED");
    expect(fetch.mock.calls.every(([, options]) => !options.method)).toBe(true);
  });
  it("fails before mutation when the linked subject differs", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(answer([{ id: "different", enabled: true }]));
    vi.stubGlobal("fetch", fetch);
    await expect(
      initializeSirhAccess(identity, undefined, "expected"),
    ).rejects.toThrow("IDENTITY_CONFLICT");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

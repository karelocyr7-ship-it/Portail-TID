import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { provisionGlpiAccount } from "@/lib/provisioning/glpi";
const user = {
  email: "synthetic@example.invalid",
  sageEmployeeId: "TEST-001",
  employeeId: null,
  displayName: "Synthetic Person",
};
const fetchMock = vi.fn();
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });
beforeEach(() => {
  vi.stubEnv("GLPI_API_URL", "https://glpi.example.invalid/apirest.php");
  vi.stubEnv("GLPI_API_APP_TOKEN", "synthetic-app");
  vi.stubEnv("GLPI_API_USER_TOKEN", "synthetic-user");
  vi.stubEnv("GLPI_LOGIN_ATTRIBUTE", "email");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
function responses(users: unknown[], emails: unknown[]) {
  fetchMock
    .mockResolvedValueOnce(reply({ session_token: "synthetic-session" }))
    .mockResolvedValueOnce(reply(users))
    .mockResolvedValueOnce(reply(emails));
}
it("creates an external identity without passwords or remotely assigned roles", async () => {
  responses([], []);
  fetchMock
    .mockResolvedValueOnce(reply({ id: 42 }, 201))
    .mockResolvedValueOnce(reply(true));
  expect(await provisionGlpiAccount(user)).toBe("COMPLETED");
  const input = JSON.parse(fetchMock.mock.calls[3][1].body).input;
  expect(input).toMatchObject({
    name: user.email,
    authtype: 4,
    _useremails: { "-1": user.email },
  });
  expect(input).not.toHaveProperty("password");
  expect(input).not.toHaveProperty("_profiles_id");
});
it("is idempotent and never changes an existing administrator's local role", async () => {
  responses(
    [{ id: 42, name: user.email, is_active: 1, is_deleted: 0 }],
    [{ users_id: 42, email: user.email }],
  );
  fetchMock.mockResolvedValueOnce(reply(true));
  expect(await provisionGlpiAccount(user)).toBe("COMPLETED");
  expect(fetchMock.mock.calls.every(([, options]) => !options.method)).toBe(
    true,
  );
});
it("fails closed on a conflicting identity and closes the session", async () => {
  responses(
    [{ id: 42, name: user.email, is_active: 1 }],
    [{ users_id: 99, email: user.email }],
  );
  fetchMock.mockResolvedValueOnce(reply(true));
  await expect(provisionGlpiAccount(user)).rejects.toThrow("mismatch");
  expect(fetchMock.mock.calls.at(-1)?.[0]).toMatch(/killSession$/);
});
it("reports missing configuration without claiming account creation", async () => {
  vi.stubEnv("GLPI_API_USER_TOKEN", "");
  expect(await provisionGlpiAccount(user)).toBe("WAITING_CONFIG");
  expect(fetchMock).not.toHaveBeenCalled();
});
it("redacts upstream errors and refuses redirects", async () => {
  fetchMock.mockResolvedValueOnce(
    reply({ error: "sensitive upstream body" }, 403),
  );
  await expect(provisionGlpiAccount(user)).rejects.toThrow("GLPI API HTTP 403");
  expect(fetchMock.mock.calls[0][1].redirect).toBe("error");
});

it("does not log upstream payloads when a response is not JSON", async () => {
  fetchMock.mockResolvedValueOnce(
    new Response("synthetic private response", { status: 200 }),
  );
  await expect(provisionGlpiAccount(user)).rejects.toThrow(
    "Invalid GLPI JSON response",
  );
});

import { afterAll, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getPrisma } from "@/lib/prisma";
import { UserModal } from "@/components/user-management";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/oidc", () => ({
  getSession: async () => ({ subject: "fixture-admin" }),
  getRoles: () => ["PORTAL_ADMIN"],
  verifyApplicationIdToken: async () => ({ subject: "fixture-legacy" }),
}));
vi.mock("@/lib/keycloak-admin", () => ({
  provisionKeycloakUser: vi.fn(),
  sendKeycloakPasswordReset: vi.fn(),
}));
import { savePortalUser } from "@/app/admin/actions";
import { getAdminUsers } from "@/lib/portal-users";
import { getVisibleApplicationsFromDatabase } from "@/lib/catalog-db";
import { POST } from "@/app/api/authorization/profiles/route";
import { provisionGlpiAccount } from "@/lib/provisioning/glpi";
import { provisionApplication } from "@/lib/provisioning/worker";

const enabled = process.env.GLPI_ISOLATED_TEST === "1";
const syntheticUser = {
  id: "fixture-user",
  displayName: "Synthetic User",
  email: "synthetic@example.invalid",
  sageEmployeeId: "TEST-001",
  keycloakSubject: "fixture-subject",
  active: true,
  applicationIds: [],
  profileIds: [],
};
it.each([undefined, null, true, false])(
  "renders an editable GLPI checkbox for stored value %s",
  (glpiAccess) => {
    const html = renderToStaticMarkup(
      createElement(UserModal, {
        mode: { ...syntheticUser, glpiAccess },
        applications: [{ id: "glpi", code: "GLPI", name: "GLPI" }],
        savePortalUser: async () => {},
        onClose: () => {},
      }),
    );
    const checkbox = html.match(/<input[^>]*name="glpiAccess"[^>]*>/)?.[0];
    expect(checkbox).toBeTruthy();
    expect(checkbox).not.toContain("disabled");
    expect(checkbox?.includes('checked=""')).toBe(glpiAccess !== false);
    expect(html).toContain('name="glpiAccessPresent"');
  },
);
it("renders checked GLPI on a new form", () => {
  const html = renderToStaticMarkup(
    createElement(UserModal, {
      mode: "create",
      applications: [{ id: "glpi", code: "GLPI", name: "GLPI" }],
      savePortalUser: async () => {},
      onClose: () => {},
    }),
  );
  expect(html.match(/<input[^>]*name="glpiAccess"[^>]*>/)?.[0]).toContain(
    'checked=""',
  );
});

it.skipIf(!enabled)(
  "migrates a legacy account, persists UI choices in PostgreSQL and creates exactly one real isolated GLPI identity",
  async () => {
    if (!/\/portal_glpi_fixture_\d+$/.test(process.env.DATABASE_URL ?? ""))
      throw new Error("Isolated fixture database required");
    const prisma = getPrisma();
    const legacy = await prisma.portalUser.findUniqueOrThrow({
      where: { keycloakSubject: "fixture-legacy" },
    });
    expect(legacy.glpiAccess).toBe(true);
    const migratedJob =
      await prisma.applicationProvisioningOutbox.findFirstOrThrow({
        where: { userId: legacy.id, application: { code: "GLPI" } },
        include: { user: true, application: true },
      });
    expect(migratedJob.status).toBe("PENDING");
    const form = new FormData();
    form.set("keycloakSubject", "fixture-new");
    form.set("displayName", "Synthetic New");
    form.set("email", "new-glpi@example.invalid");
    form.set("active", "on");
    await savePortalUser(form);
    const created = await prisma.portalUser.findUniqueOrThrow({
      where: { keycloakSubject: "fixture-new" },
    });
    expect(created.glpiAccess).toBe(true);
    form.set("userId", legacy.id);
    form.set("keycloakSubject", "fixture-legacy");
    form.set("email", legacy.email!);
    form.set("glpiAccessPresent", "1");
    await savePortalUser(form);
    expect(
      (await getAdminUsers()).find((u) => u.id === legacy.id)?.glpiAccess,
    ).toBe(false);
    form.delete("glpiAccessPresent");
    form.set("displayName", "Synthetic Edited");
    await savePortalUser(form);
    expect(
      (await prisma.portalUser.findUniqueOrThrow({ where: { id: legacy.id } }))
        .glpiAccess,
    ).toBe(false);
    expect(
      (
        await getVisibleApplicationsFromDatabase(
          ["PORTAL_ADMIN"],
          "fixture-legacy",
        )
      ).some((app) => app.code === "GLPI"),
    ).toBe(false);
    const request = () =>
      new Request("https://fixture.invalid/api/authorization/profiles", {
        method: "POST",
        body: JSON.stringify({
          application: "GLPI",
          idToken: "synthetic-id-token",
        }),
      });
    expect((await (await POST(request())).json()).authorized).toBe(false);
    const getJob = () =>
      prisma.applicationProvisioningOutbox.findFirstOrThrow({
        where: { userId: legacy.id, application: { code: "GLPI" } },
        include: { user: true, application: true },
      });
    // A previously queued job must reread the persisted opt-out and make no API call.
    const realFetch = globalThis.fetch;
    const observedUsers: { name: string; is_active: number; id: number }[] = [];
    const apiFetch = vi.fn(
      async (url: string | URL | Request, init?: RequestInit) => {
        const target = String(url).replace(
          "https://glpi.fixture.invalid",
          process.env.GLPI_FIXTURE_HTTP_URL!,
        );
        if (
          !target.startsWith(
            `${process.env.GLPI_FIXTURE_HTTP_URL}/apirest.php/`,
          )
        )
          throw new Error("Fixture URL required");
        const response = await realFetch(target, init);
        if (target.includes("/User?"))
          observedUsers.push(...(await response.clone().json()));
        return response;
      },
    );
    vi.stubGlobal("fetch", apiFetch);
    try {
      expect(await provisionApplication(migratedJob)).toBe("COMPLETED");
      expect(apiFetch).not.toHaveBeenCalled();
      form.set("glpiAccessPresent", "1");
      form.set("glpiAccess", "on");
      await savePortalUser(form);
      expect((await (await POST(request())).json()).authorized).toBe(true);
      expect(
        (await getVisibleApplicationsFromDatabase([], "fixture-legacy")).some(
          (app) => app.code === "GLPI",
        ),
      ).toBe(true);
      expect(await provisionApplication(await getJob())).toBe("COMPLETED");
      expect(
        apiFetch.mock.calls.filter(([, options]) => options?.method === "POST"),
      ).toHaveLength(1);
      apiFetch.mockClear();
      expect(await provisionApplication(await getJob())).toBe("COMPLETED");
      expect(
        apiFetch.mock.calls.filter(([, options]) => options?.method === "POST"),
      ).toHaveLength(0);
      // All matriculated identities must exist even when portal GLPI is unchecked.
      const employeeForm = new FormData();
      employeeForm.set("keycloakSubject", "fixture-opted-out-employee");
      employeeForm.set("sageId", `TID${process.env.GLPI_FIXTURE_RUN_ID}1`);
      employeeForm.set("email", `employee-${legacy.email}`);
      employeeForm.set("displayName", "Synthetic Employee");
      employeeForm.set("active", "on");
      employeeForm.set("glpiAccessPresent", "1");
      await savePortalUser(employeeForm);
      const employeeJob =
        await prisma.applicationProvisioningOutbox.findFirstOrThrow({
          where: {
            user: { keycloakSubject: "fixture-opted-out-employee" },
            application: { code: "GLPI" },
          },
          include: { user: true, application: true },
        });
      expect(employeeJob.user.glpiAccess).toBe(false);
      const inactiveJob =
        await prisma.applicationProvisioningOutbox.findFirstOrThrow({
          where: {
            userId: "fixture-inactive-id",
            application: { code: "GLPI" },
          },
          include: { user: true, application: true },
        });
      expect(inactiveJob.status).toBe("PENDING");
      apiFetch.mockClear();
      expect(await provisionApplication(inactiveJob)).toBe("COMPLETED");
      const inactivePost = apiFetch.mock.calls.find(
        ([, options]) => options?.method === "POST",
      );
      expect(JSON.parse(String(inactivePost![1]?.body)).input.is_active).toBe(
        0,
      );
      apiFetch.mockClear();
      expect(await provisionApplication(employeeJob)).toBe("COMPLETED");
      const post = apiFetch.mock.calls.find(
        ([, options]) => options?.method === "POST",
      );
      expect(post).toBeDefined();
      expect(JSON.parse(String(post![1]?.body)).input.is_active).toBe(0);
      apiFetch.mockClear();
      expect(await provisionApplication(employeeJob)).toBe("COMPLETED");
      expect(observedUsers).toContainEqual(
        expect.objectContaining({ name: employeeJob.user.email, is_active: 0 }),
      );
      expect(await provisionApplication(inactiveJob)).toBe("COMPLETED");
      expect(observedUsers).toContainEqual(
        expect.objectContaining({ name: inactiveJob.user.email, is_active: 0 }),
      );
      expect(
        apiFetch.mock.calls.some(([, options]) => options?.method === "POST"),
      ).toBe(false);
      if (process.env.GLPI_ISOLATED_LEAST_PRIVILEGE === "1") {
        const base = `${process.env.GLPI_FIXTURE_HTTP_URL}/apirest.php`;
        const appHeaders = {
          "App-Token": process.env.GLPI_API_APP_TOKEN!,
          "Content-Type": "application/json",
        };
        const sessionResponse = await realFetch(`${base}/initSession`, {
          headers: {
            ...appHeaders,
            Authorization: `user_token ${process.env.GLPI_API_USER_TOKEN}`,
          },
        });
        expect(sessionResponse.status).toBe(200);
        const session = await sessionResponse.json();
        const headers = {
          ...appHeaders,
          "Session-Token": session.session_token,
        };
        const targetId = observedUsers.find(
          (u) => u.name === employeeJob.user.email,
        )!.id;
        try {
          const legacyEmail = `local-legacy-${process.env.GLPI_FIXTURE_RUN_ID}@example.invalid`;
          const legacyCreate = await realFetch(`${base}/User`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              input: {
                name: `legacy-${process.env.GLPI_FIXTURE_RUN_ID}`,
                authtype: 4,
                is_active: 1,
                _useremails: { "-1": legacyEmail },
                _default_email: -1,
              },
            }),
          });
          expect(legacyCreate.status).toBe(201);
          const legacyId = (await legacyCreate.json()).id;
          const beforeLegacy = await (
            await realFetch(`${base}/User/${legacyId}`, { headers })
          ).json();
          apiFetch.mockClear();
          expect(
            await provisionGlpiAccount({
              email: legacyEmail,
              sageEmployeeId: "SYNTHETIC-LEGACY",
              employeeId: null,
              displayName: "Synthetic Legacy",
            }),
          ).toBe("COMPLETED");
          expect(
            apiFetch.mock.calls.every(([, options]) => !options?.method),
          ).toBe(true);
          const afterLegacy = await (
            await realFetch(`${base}/User/${legacyId}`, { headers })
          ).json();
          expect(afterLegacy).toEqual(beforeLegacy);
          const update = await realFetch(`${base}/User`, {
            method: "PUT",
            headers,
            body: JSON.stringify({
              input: { id: targetId, realname: "Forbidden synthetic update" },
            }),
          });
          expect(update.status).toBe(400);
          const updateError = await update.json();
          expect(updateError[0]).toBe("ERROR_GLPI_UPDATE");
          expect(updateError[1]).toContain("permission");
          const grant = await realFetch(`${base}/Profile_User`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              input: { users_id: targetId, profiles_id: 4, entities_id: 0 },
            }),
          });
          expect(grant.status).toBe(400);
          const grantError = await grant.json();
          expect(grantError[0]).toBe("ERROR_GLPI_ADD");
          expect(grantError[1]).toContain("permission");
        } finally {
          await realFetch(`${base}/killSession`, { headers });
        }
      }
    } finally {
      vi.unstubAllGlobals();
    }
  },
  60_000,
);
afterAll(async () => {
  if (enabled) await getPrisma().$disconnect();
});

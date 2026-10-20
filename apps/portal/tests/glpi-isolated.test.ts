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
        return realFetch(target, init);
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
    } finally {
      vi.unstubAllGlobals();
    }
  },
  60_000,
);
afterAll(async () => {
  if (enabled) await getPrisma().$disconnect();
});

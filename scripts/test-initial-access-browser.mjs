// Run on the isolated browser host. Credentials arrive only on stdin, never argv/files.
import { chromium } from "/tmp/sirh-creation-playwright/node_modules/playwright/index.mjs";
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
let input = "";
for await (const chunk of process.stdin) input += chunk;
const config = JSON.parse(input);
if (
  config.base !== "http://localhost:18291" ||
  !(
    config.identity.email.endsWith("@example.invalid") ||
    (config.identity.email.endsWith("@sirh.invalid") &&
      /^TIDP000\d{1,10}$/.test(config.identity.sageId))
  )
)
  process.exit(2);
let step = "launch";
const browser = await chromium.launch({
  headless: true,
  executablePath:
    "/home/debian/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell",
  args: ["--no-sandbox", "--host-resolver-rules=MAP hrms.localhost 127.0.0.1"],
});
async function freshLogin(password) {
  const originalStep = step;
  const context = await browser.newContext();
  const page = await context.newPage();
  step = originalStep + "_navigation";
  await page.goto(config.base);
  step = originalStep + "_username";
  await page.locator("#username").fill(config.identity.sageId);
  step = originalStep + "_password";
  await page.locator("#password").fill(password);
  step = originalStep + "_submit";
  await page.locator("#kc-login").click();
  step = originalStep + "_result";
  return { context, page };
}
async function signed(path, body) {
  const raw = JSON.stringify(body),
    timestamp = String(Math.floor(Date.now() / 1000));
  return fetch(config.base + path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-sirh-timestamp": timestamp,
      "x-sirh-signature":
        "sha256=" +
        createHmac("sha256", config.hmac)
          .update(timestamp + "." + raw)
          .digest("hex"),
    },
    body: raw,
  });
}
try {
  step = "temporary_login";
  const first = await freshLogin(config.temporary);
  step = "required_password_change";
  await first.page.locator("#password-new").waitFor();
  assert.ok(!new URL(first.page.url()).pathname.endsWith("/api/auth/callback"));
  await first.page.locator("#password-new").fill(config.personal);
  await first.page.locator("#password-confirm").fill(config.personal);
  await first.page
    .locator("input[type=submit],button[type=submit]")
    .first()
    .click();
  step = "portal_after_change";
  await first.page
    .getByRole("heading", { name: "Vos applications", exact: true })
    .waitFor();
  assert.equal(await first.page.locator(".application-card").count(), 0);
  await first.context.close();
  step = "old_temporary_password_refused";
  const old = await freshLogin(config.temporary);
  await old.page
    .getByText(
      /Invalid username or password|Invalid credentials|Identifiant ou mot de passe invalide/i,
    )
    .first()
    .waitFor();
  assert.equal(await old.page.locator("#kc-login").count(), 1);
  await old.context.close();
  step = "identity_sync_preserves_password";
  const sync = await signed("/api/provisioning/sirh/users", {
    sageId: config.identity.sageId,
    email: config.identity.email,
    displayName: "Synthetic Person",
    enabled: true,
  });
  assert.ok(sync.ok);
  const repeated = await signed("/api/provisioning/sirh/initial-access", {
    ...config.identity,
    purpose: "initial-access-v1",
    requestId: randomUUID(),
    operationId: randomUUID(),
    generation: 2,
    temporaryPassword: config.temporary,
  });
  assert.equal((await repeated.json()).status, "EXISTING_CREDENTIAL_PROTECTED");
  step = "personal_password_login_after_sync";
  const last = await freshLogin(config.personal);
  await last.page
    .getByRole("heading", { name: "Vos applications", exact: true })
    .waitFor();
  await last.context.close();
  if (config.rh) {
    step = "rh_recovery_ui";
    assert.ok(config.rh.username.endsWith("@example.invalid"));
    const context = await browser.newContext();
    const page = await context.newPage();
    step = "rh_login_page";
    await page.goto("http://hrms.localhost:18189/login");
    step = "rh_login_request";
    const loginStatus = await page.evaluate(
      async (credentials) => {
        const response = await fetch("/api/method/login", {
          method: "POST",
          body: new URLSearchParams(credentials),
        });
        return response.status;
      },
      { usr: config.rh.username, pwd: config.rh.password },
    );
    assert.equal(loginStatus, 200);
    // Presentation test only: never let the clone web worker contact its configured
    // production connector. The real relay was already exercised over isolated TLS.
    let calls = 0;
    await page.route(
      "**/api/method/hrms_fr_ci.api.employees.resume_portal_access",
      async (route) => {
        calls++;
        const message =
          calls === 1
            ? { status: "EXISTING_CREDENTIAL_PROTECTED" }
            : {
                status: "READY",
                username: config.identity.sageId,
                employee_name: "Synthetic Onboarding",
                temporary_password: config.temporary,
              };
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message }),
        });
      },
    );
    page.on("dialog", (dialog) => dialog.accept());
    step = "rh_directory";
    await page.goto("http://hrms.localhost:18189/hr/employees");
    step = "rh_search";
    await page
      .getByRole("searchbox", { name: "Rechercher un salarié" })
      .fill(config.identity.sageId);
    const row = page
      .locator("tr")
      .filter({
        has: page.getByText("SAGE · " + config.identity.sageId, {
          exact: true,
        }),
      });
    step = "rh_protected_click";
    await row
      .getByRole("button", { name: "Accès portail", exact: true })
      .click();
    await page
      .getByText(
        "Un accès existe déjà : son mot de passe est protégé et n’a pas été remplacé.",
        { exact: true },
      )
      .waitFor();
    assert.equal(
      await page
        .getByRole("dialog", { name: "Accès portail initialisé" })
        .count(),
      0,
    );
    step = "rh_ready_click";
    await row
      .getByRole("button", { name: "Accès portail", exact: true })
      .click();
    const modal = page.getByRole("dialog", {
      name: "Accès portail initialisé",
    });
    await modal.waitFor();
    assert.ok((await modal.textContent()).includes(config.temporary));
    await modal
      .getByRole("button", { name: "J’ai remis les accès, fermer" })
      .click();
    assert.equal(
      await page
        .getByRole("dialog", { name: "Accès portail initialisé" })
        .count(),
      0,
    );
    assert.equal(calls, 2);
    await context.close();
    console.log("rh_recovery_ui_protected_and_one_time_display_passed");
  }
  console.log(
    JSON.stringify({
      status: "passed",
      checks: [
        "temporary_login",
        "required_change_without_email",
        "portal_session",
        "old_password_refused",
        "identity_sync",
        "repeat_protected",
        "personal_login_after_sync",
      ],
    }),
  );
} catch (error) {
  console.log(
    JSON.stringify({
      status: "failed",
      step,
      errorType: error.name,
      browserCode: String(error.message).match(/net::ERR_[A-Z_]+/)?.[0] ?? null,
    }),
  );
  process.exitCode = 1;
} finally {
  await browser.close();
}

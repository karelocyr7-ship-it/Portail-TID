// Run on the isolated browser host. Credentials arrive only on stdin, never argv/files.
import { chromium } from "/tmp/sirh-creation-playwright/node_modules/playwright/index.mjs";
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
let input = "";
for await (const chunk of process.stdin) input += chunk;
const config = JSON.parse(input);
if (
  config.base !== "http://localhost:18291" ||
  !config.identity.email.endsWith("@example.invalid")
)
  process.exit(2);
let step = "launch";
const browser = await chromium.launch({
  headless: true,
  executablePath:
    "/home/debian/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell",
  args: ["--no-sandbox"],
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
    temporaryPassword: config.temporary,
  });
  assert.equal((await repeated.json()).status, "EXISTING_CREDENTIAL_PROTECTED");
  step = "personal_password_login_after_sync";
  const last = await freshLogin(config.personal);
  await last.page
    .getByRole("heading", { name: "Vos applications", exact: true })
    .waitFor();
  await last.context.close();
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
    JSON.stringify({ status: "failed", step, errorType: error.name }),
  );
  process.exitCode = 1;
} finally {
  await browser.close();
}

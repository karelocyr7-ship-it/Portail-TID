// Isolated PostgreSQL + Keycloak only. No production credentials, mail or accounts.
import { execFileSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import assert from "node:assert/strict";

const secret = () => randomBytes(32).toString("base64url") + "!Aa9";
const bootstrap = secret(),
  clientSecret = secret();
const secrets = [bootstrap, clientSecret];
const realm = "synthetic-initial",
  base = "http://127.0.0.1:18290/auth";
const created = [];
let step = "start",
  adminToken,
  serviceToken;
const docker = (args, env = {}) =>
  execFileSync("docker", args, {
    encoding: "utf8",
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function api(path, body, method = body ? "POST" : "GET") {
  const r = await fetch(base + "/admin/" + path, {
    method,
    headers: {
      authorization: "Bearer " + adminToken,
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  assert.ok(r.ok, "admin_http_" + r.status);
  return r.status === 204 || r.status === 201 ? null : r.json();
}
async function token(form) {
  const r = await fetch(
    base + `/realms/${form.realm ?? realm}/protocol/openid-connect/token`,
    {
      method: "POST",
      body: new URLSearchParams(
        Object.fromEntries(Object.entries(form).filter(([k]) => k !== "realm")),
      ),
    },
  );
  const value = await r.json();
  return { http: r.status, value };
}
let serial = 81000;
function input() {
  const pw = secret();
  secrets.push(pw);
  return {
    operationId: randomUUID(),
    generation: 1,
    sageId: "TID000" + serial++,
    firstName: "Synthetic",
    lastName: "Person",
    email: `initial-${serial}@example.invalid`,
    temporaryPassword: pw,
  };
}
async function initialize(body, bearer = serviceToken) {
  const r = await fetch(base + `/realms/${realm}/tad-initial-access`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(bearer ? { authorization: "Bearer " + bearer } : {}),
    },
    body: JSON.stringify(body),
  });
  const raw = await r.text();
  assert.ok(!secrets.some((s) => raw.includes(s)), "response_secret_leak");
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    value = { status: "NON_JSON" };
  }
  return { http: r.status, ...value };
}
async function reset(subject, password) {
  return fetch(
    base + `/admin/realms/${realm}/users/${subject}/reset-password`,
    {
      method: "PUT",
      headers: {
        authorization: "Bearer " + adminToken,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        type: "password",
        value: password,
        temporary: false,
      }),
    },
  );
}
try {
  created.push(
    docker([
      "run",
      "-d",
      "--rm",
      "--name",
      "tad-initial-extension-db",
      "-p",
      "127.0.0.1:18290:8080",
      "--tmpfs",
      "/var/lib/postgresql/data",
      "-e",
      "POSTGRES_HOST_AUTH_METHOD=trust",
      "-e",
      "POSTGRES_USER=synthetic",
      "-e",
      "POSTGRES_DB=keycloaktest",
      "postgres:16.10-alpine",
    ]),
  );
  created.push(
    docker(
      [
        "run",
        "-d",
        "--name",
        "tad-initial-extension-keycloak",
        "--network",
        "container:tad-initial-extension-db",
        "--tmpfs",
        "/opt/keycloak/data:uid=1000,gid=0",
        "-e",
        "KC_BOOTSTRAP_ADMIN_USERNAME=synthetic-admin",
        "-e",
        "KC_BOOTSTRAP_ADMIN_PASSWORD",
        "-e",
        "TAD_INITIAL_ACCESS_REALM=" + realm,
        "-e",
        "TAD_INITIAL_ACCESS_CLIENT_ID=portal-test",
        "tad-keycloak:initial-access-candidate",
        "start",
        "--optimized",
        "--http-enabled=true",
        "--hostname-strict=false",
        "--http-relative-path=/auth",
        "--db-url=jdbc:postgresql://127.0.0.1:5432/keycloaktest",
        "--db-username=synthetic",
      ],
      { KC_BOOTSTRAP_ADMIN_PASSWORD: bootstrap },
    ),
  );
  step = "startup";
  let ready = false;
  for (let i = 0; i < 90; i++) {
    if (
      docker([
        "inspect",
        "--format",
        "{{.State.Running}}",
        "tad-initial-extension-keycloak",
      ]) !== "true"
    )
      throw Error("keycloak_exited");
    try {
      if (
        (await fetch(base + "/realms/master/.well-known/openid-configuration"))
          .ok
      ) {
        ready = true;
        break;
      }
    } catch {}
    await delay(1000);
  }
  assert.ok(ready, "startup_timeout");
  adminToken = (
    await token({
      realm: "master",
      grant_type: "password",
      client_id: "admin-cli",
      username: "synthetic-admin",
      password: bootstrap,
    })
  ).value.access_token;
  assert.ok(adminToken);
  step = "configure";
  await api("realms", {
    realm,
    enabled: true,
    verifyEmail: false,
    resetPasswordAllowed: true,
  });
  await api(`realms/${realm}/clients`, {
    clientId: "portal-test",
    enabled: true,
    secret: clientSecret,
    publicClient: false,
    serviceAccountsEnabled: true,
    directAccessGrantsEnabled: true,
    standardFlowEnabled: true,
    redirectUris: ["http://localhost:18291/api/auth/callback"],
  });
  const client = (await api(`realms/${realm}/clients?clientId=portal-test`))[0];
  const account = await api(
    `realms/${realm}/clients/${client.id}/service-account-user`,
  );
  const management = (
    await api(`realms/${realm}/clients?clientId=realm-management`)
  )[0];
  const roles = await api(`realms/${realm}/clients/${management.id}/roles`);
  await api(
    `realms/${realm}/users/${account.id}/role-mappings/clients/${management.id}`,
    roles.filter((r) =>
      ["manage-users", "view-users", "query-users"].includes(r.name),
    ),
  );
  serviceToken = (
    await token({
      grant_type: "client_credentials",
      client_id: "portal-test",
      client_secret: clientSecret,
    })
  ).value.access_token;
  assert.ok(serviceToken);
  step = "authentication_boundary";
  const anonymous = await initialize(input(), null);
  assert.ok(
    [401, 403].includes(anonymous.http),
    "anonymous_http_" + anonymous.http,
  );
  const wrongRealm = await initialize(input(), adminToken);
  assert.ok(
    [401, 403].includes(wrongRealm.http),
    "wrong_realm_http_" + wrongRealm.http,
  );
  console.log("extension_authentication_boundary_passed");
  step = "new_temporary_credential";
  const a = input();
  const result = await initialize(a);
  assert.equal(result.status, "READY", "initial_" + result.status);
  const subject = result.subject;
  assert.ok(subject);
  assert.equal((await initialize(a)).status, "READY");
  assert.equal(
    (await initialize({ ...a, temporaryPassword: secret() })).status,
    "OPERATION_CONFLICT",
  );
  let user = await api(`realms/${realm}/users/${subject}`);
  assert.deepEqual(user.requiredActions, ["UPDATE_PASSWORD"]);
  const tempLogin = await token({
    grant_type: "password",
    client_id: "portal-test",
    client_secret: clientSecret,
    username: a.sageId,
    password: a.temporaryPassword,
  });
  assert.equal(tempLogin.http, 400);
  assert.equal(
    tempLogin.value.error_description,
    "Account is not fully set up",
  );
  console.log("native_temporary_password_and_idempotence_passed");
  step = "lost_response_reissue";
  const b = {
    ...a,
    operationId: randomUUID(),
    generation: 2,
    temporaryPassword: secret(),
  };
  secrets.push(b.temporaryPassword);
  assert.equal((await initialize(b)).status, "READY");
  assert.equal((await initialize(a)).status, "OPERATION_CONFLICT");
  assert.equal((await initialize(b)).status, "READY");
  console.log("lost_response_rotation_and_stale_replay_passed");
  step = "personal_password_protection";
  const personal = secret();
  secrets.push(personal);
  assert.equal((await reset(subject, personal)).status, 204);
  step = "personal_reinitialization_protected";
  assert.equal(
    (await initialize({ ...b, operationId: randomUUID(), generation: 3 }))
      .status,
    "EXISTING_CREDENTIAL_PROTECTED",
  );
  step = "personal_login_valid";
  assert.equal(
    (
      await token({
        grant_type: "password",
        client_id: "portal-test",
        client_secret: clientSecret,
        username: a.sageId,
        password: personal,
      })
    ).http,
    200,
  );
  step = "old_temporary_login_rejected";
  const rejectedTemporary = await token({
    grant_type: "password",
    client_id: "portal-test",
    client_secret: clientSecret,
    username: a.sageId,
    password: b.temporaryPassword,
  });
  assert.ok(
    [400, 401].includes(rejectedTemporary.http),
    "old_temporary_http_" + rejectedTemporary.http,
  );
  assert.equal(rejectedTemporary.value.error, "invalid_grant");
  assert.equal(rejectedTemporary.value.access_token, undefined);
  step = "deleted_personal_credential_protected";
  const credential = (
    await api(`realms/${realm}/users/${subject}/credentials`)
  )[0];
  await api(
    `realms/${realm}/users/${subject}/credentials/${credential.id}`,
    undefined,
    "DELETE",
  );
  await api(
    `realms/${realm}/users/${subject}`,
    { requiredActions: ["UPDATE_PASSWORD"] },
    "PUT",
  );
  assert.equal(
    (
      await initialize({
        ...b,
        expectedSubject: subject,
        allowPendingExisting: true,
        operationId: randomUUID(),
        generation: 3,
      })
    ).status,
    "EXISTING_CREDENTIAL_PROTECTED",
  );
  console.log("personal_password_and_deleted_credential_protection_passed");
  step = "legacy_pending";
  const legacy = input();
  await api(`realms/${realm}/users`, {
    username: legacy.sageId,
    enabled: true,
    email: legacy.email,
    firstName: legacy.firstName,
    lastName: legacy.lastName,
    requiredActions: ["VERIFY_EMAIL", "UPDATE_PASSWORD"],
  });
  const legacyUser = (
    await api(`realms/${realm}/users?username=${legacy.sageId}&exact=true`)
  )[0];
  assert.equal((await initialize(legacy)).status, "REVIEW_REQUIRED");
  assert.equal(
    (
      await initialize({
        ...legacy,
        expectedSubject: legacyUser.id,
        allowPendingExisting: true,
      })
    ).status,
    "READY",
  );
  assert.deepEqual(
    (await api(`realms/${realm}/users/${legacyUser.id}`)).requiredActions,
    ["UPDATE_PASSWORD"],
  );
  console.log("legacy_pending_initialization_without_email_passed");
  step = "concurrent_native_password_changes";
  let nativeRetries = 0;
  for (let i = 0; i < 12; i++) {
    const initial = input();
    const first = await initialize(initial);
    assert.equal(first.status, "READY");
    const personalPassword = secret();
    secrets.push(personalPassword);
    const rotated = {
      ...initial,
      operationId: randomUUID(),
      generation: 2,
      temporaryPassword: secret(),
    };
    secrets.push(rotated.temporaryPassword);
    const [native, concurrent] = await Promise.all([
      reset(first.subject, personalPassword),
      initialize(rotated),
    ]);
    // A native optimistic conflict is explicit, never a silent overwritten password.
    if (native.status !== 204) {
      assert.ok(
        [409, 400].includes(native.status),
        "native_http_" + native.status,
      );
      nativeRetries++;
      assert.equal((await reset(first.subject, personalPassword)).status, 204);
    }
    assert.ok(
      [
        "READY",
        "EXISTING_CREDENTIAL_PROTECTED",
        "INITIAL_ACCESS_UNAVAILABLE",
      ].includes(concurrent.status),
      "race_" + concurrent.status,
    );
    assert.equal(
      (
        await token({
          grant_type: "password",
          client_id: "portal-test",
          client_secret: clientSecret,
          username: initial.sageId,
          password: personalPassword,
        })
      ).http,
      200,
    );
    assert.equal(
      (
        await initialize({
          ...rotated,
          operationId: randomUUID(),
          generation: 3,
        })
      ).status,
      "EXISTING_CREDENTIAL_PROTECTED",
    );
    assert.equal(
      (await api(`realms/${realm}/users/${first.subject}/credentials`)).filter(
        (c) => c.type === "password",
      ).length,
      1,
    );
  }
  console.log(
    JSON.stringify({
      concurrentNativeChanges: 12,
      nativeRetries,
      result: "passed",
    }),
  );
  step = "logs";
  const logs = docker(["logs", "tad-initial-extension-keycloak"]);
  assert.ok(!secrets.some((s) => logs.includes(s)), "log_secret_leak");
  console.log("extension_log_scan_passed");
} catch (error) {
  // Never print response bodies, tokens or arbitrary exception text.
  console.log(
    JSON.stringify({
      status: "failed",
      step,
      errorType: error.name,
      check:
        typeof error.message === "string" &&
        /^[A-Za-z_0-9]+$/.test(error.message)
          ? error.message
          : "ASSERTION",
    }),
  );
  // Bounded startup diagnostics, not raw logs.
  try {
    const logs = docker(["logs", "tad-initial-extension-keycloak"]);
    console.log(
      JSON.stringify({
        providerLoaded: logs.includes("onboarding.GuardedUserProviderFactory"),
        schemaMentioned: logs.includes("TAD_INITIAL_ACCESS"),
        startupError: logs.includes("ERROR"),
        errorTypes: [...new Set(logs.match(/[A-Za-z0-9_.]+Exception/g) ?? [])],
      }),
    );
  } catch {}
  process.exitCode = 1;
} finally {
  for (const id of created.reverse()) {
    try {
      docker(["stop", "-t", "5", id]);
    } catch {}
    try {
      docker(["rm", id]);
    } catch {}
  }
}

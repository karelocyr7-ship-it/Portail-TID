// Isolated Keycloak + PostgreSQL + real Portal. No production secrets/accounts.
import { spawn, execFileSync } from "node:child_process";
import { randomBytes, randomUUID, createHmac } from "node:crypto";
import assert from "node:assert/strict";
const root = "/srv/tad/portail-initial-credentials";
const issuerBase = "http://localhost:18290/auth",
  realm = "synthetic-initial";
const secret = () => randomBytes(32).toString("base64url");
const adminPassword = secret(),
  clientSecret = secret(),
  hmac = secret(),
  temporary = secret() + "!8aA",
  personal = secret() + "!9bB";
const identity = {
  sageId: "TID000000042",
  email: "initial-person@example.invalid",
  firstName: "Synthetic",
  lastName: "Person",
};
const created = [];
let portal,
  tunnel,
  step = "start",
  captured = "";
const docker = (args, env = {}) =>
  execFileSync("docker", args, {
    env: { ...process.env, ...env },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
async function ready(url) {
  for (let i = 0; i < 90; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw Error("not_ready");
}
async function child(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(command, args, {
      ...options,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let out = "";
    p.stdout.on("data", (b) => (out += b));
    p.stderr.on("data", (b) => (out += b));
    if (options.input) p.stdin.end(options.input);
    else p.stdin.end();
    p.on("exit", (code) => {
      if (code === 0) return resolve(out);
      for (const line of out.split("\n")) {
        try {
          const info = JSON.parse(line);
          if (
            info.status === "failed" &&
            /^[a-z_]+$/.test(info.step) &&
            /^[A-Za-z]+$/.test(info.errorType)
          )
            console.log(
              JSON.stringify({
                status: "failed",
                step: info.step,
                errorType: info.errorType,
              }),
            );
        } catch {}
      }
      reject(Error("child_failed"));
    });
  });
}
try {
  created.push(
    docker([
      "run",
      "-d",
      "--rm",
      "--name",
      "tad-initial-test-db",
      "-p",
      "127.0.0.1:18292:5432",
      "--tmpfs",
      "/var/lib/postgresql/data",
      "-e",
      "POSTGRES_HOST_AUTH_METHOD=trust",
      "-e",
      "POSTGRES_USER=portaltest",
      "-e",
      "POSTGRES_DB=portaltest",
      "postgres:16.10-alpine",
    ]),
  );
  created.push(
    docker(
      [
        "run",
        "-d",
        "--rm",
        "--name",
        "tad-initial-test-keycloak",
        "-p",
        "127.0.0.1:18290:8080",
        "--tmpfs",
        "/opt/keycloak/data:uid=1000,gid=0",
        "-e",
        "KC_BOOTSTRAP_ADMIN_USERNAME=synthetic-admin",
        "-e",
        "KC_BOOTSTRAP_ADMIN_PASSWORD",
        "quay.io/keycloak/keycloak:26.6.2",
        "start-dev",
        "--http-relative-path=/auth",
      ],
      { KC_BOOTSTRAP_ADMIN_PASSWORD: adminPassword },
    ),
  );
  console.log("isolated_services_starting");
  await ready(issuerBase + "/realms/master/.well-known/openid-configuration");
  step = "configure_synthetic_realm";
  const tr = await fetch(
    issuerBase + "/realms/master/protocol/openid-connect/token",
    {
      method: "POST",
      body: new URLSearchParams({
        grant_type: "password",
        client_id: "admin-cli",
        username: "synthetic-admin",
        password: adminPassword,
      }),
    },
  );
  const token = (await tr.json()).access_token;
  const api = async (path, body, method = body ? "POST" : "GET") => {
    const r = await fetch(issuerBase + "/admin/" + path, {
      method,
      headers: {
        authorization: "Bearer " + token,
        "content-type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!r.ok) throw Error("admin_refused");
    return r.status === 204 || r.status === 201 ? null : r.json();
  };
  await api("realms", {
    realm,
    enabled: true,
    verifyEmail: false,
    resetPasswordAllowed: true,
    registrationEmailAsUsername: false,
  });
  await api(`realms/${realm}/clients`, {
    clientId: "portal-test",
    enabled: true,
    secret: clientSecret,
    publicClient: false,
    standardFlowEnabled: true,
    serviceAccountsEnabled: true,
    redirectUris: ["http://localhost:18291/api/auth/callback"],
    webOrigins: ["http://localhost:18291"],
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
  const env = {
    ...process.env,
    DATABASE_URL: "postgresql://portaltest@127.0.0.1:18292/portaltest",
    SESSION_SECRET: secret(),
    KEYCLOAK_ISSUER: issuerBase + "/realms/" + realm,
    KEYCLOAK_CLIENT_ID: "portal-test",
    KEYCLOAK_CLIENT_SECRET: clientSecret,
    KEYCLOAK_ADMIN_CLIENT_ID: "portal-test",
    KEYCLOAK_ADMIN_CLIENT_SECRET: clientSecret,
    SIRH_PROVISIONING_SECRET: hmac,
    PORTAL_PUBLIC_URL: "http://localhost:18291",
    NODE_ENV: "production",
  };
  step = "migrations";
  await child(
    root + "/apps/portal/node_modules/.bin/prisma",
    ["migrate", "deploy"],
    { cwd: root + "/apps/portal", env },
  );
  step = "portal_start";
  portal = spawn(
    root + "/apps/portal/node_modules/.bin/next",
    ["start", "-H", "127.0.0.1", "-p", "18291"],
    { cwd: root + "/apps/portal", env, stdio: ["ignore", "pipe", "pipe"] },
  );
  portal.stdout.on("data", (b) => (captured += b));
  portal.stderr.on("data", (b) => (captured += b));
  await ready("http://localhost:18291/health");
  const signed = async (body) => {
    const raw = JSON.stringify(body),
      ts = String(Math.floor(Date.now() / 1000));
    return fetch(
      "http://localhost:18291/api/provisioning/sirh/initial-access",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-sirh-timestamp": ts,
          "x-sirh-signature":
            "sha256=" +
            createHmac("sha256", hmac)
              .update(ts + "." + raw)
              .digest("hex"),
        },
        body: raw,
      },
    );
  };
  step = "initialize_and_replay";
  const body = {
    ...identity,
    purpose: "initial-access-v1",
    requestId: randomUUID(),
    temporaryPassword: temporary,
  };
  const result = await signed(body);
  const initial = await result.json();
  console.log(
    JSON.stringify({
      httpStatus: result.status,
      resultCode: /^[A-Z_]+$/.test(initial.status ?? initial.error ?? "")
        ? (initial.status ?? initial.error)
        : "UNEXPECTED",
    }),
  );
  assert.equal(result.status, 200);
  assert.equal(initial.status, "READY");
  assert.equal((await signed(body)).status, 409);
  step = "invalid_identity_no_remote_account";
  const invalidIdentity = "INVALID-SYNTHETIC-000042";
  const invalid = await signed({
    ...body,
    requestId: randomUUID(),
    sageId: invalidIdentity,
  });
  assert.equal(invalid.status, 400);
  assert.equal(
    (await api(`realms/${realm}/users?username=${invalidIdentity}&exact=true`))
      .length,
    0,
  );
  console.log("invalid_identity_rejected_before_keycloak");

  step = "concurrent_initialization";
  const concurrentIdentity = {
    ...body,
    sageId: "TID000000043",
    email: "initial-concurrent@example.invalid",
  };
  const parallel = await Promise.all(
    [1, 2].map(async () => {
      const response = await signed({
        ...concurrentIdentity,
        requestId: randomUUID(),
      });
      assert.equal(response.status, 200);
      return (await response.json()).status;
    }),
  );
  assert.deepEqual(parallel.sort(), ["EXISTING_CREDENTIAL_PROTECTED", "READY"]);
  const concurrentUsers = await api(
    `realms/${realm}/users?username=${concurrentIdentity.sageId}&exact=true`,
  );
  assert.equal(concurrentUsers.length, 1);
  assert.equal(
    (await api(`realms/${realm}/users/${concurrentUsers[0].id}/credentials`))
      .length,
    1,
  );
  console.log("concurrent_initialization_single_account_single_credential");

  step = "disabled_account_protection";
  await api(
    `realms/${realm}/users/${concurrentUsers[0].id}`,
    { enabled: false },
    "PUT",
  );
  const disabled = await signed({
    ...concurrentIdentity,
    requestId: randomUUID(),
  });
  assert.equal((await disabled.json()).status, "DISABLED");
  assert.equal(
    (await api(`realms/${realm}/users/${concurrentUsers[0].id}`)).enabled,
    false,
  );
  console.log("disabled_account_not_reactivated");
  step = "browser_tunnel";
  tunnel = spawn(
    "ssh",
    [
      "-i",
      "/home/debian/.ssh/id_ed25519_tad_vm",
      "-o",
      "ExitOnForwardFailure=yes",
      "-N",
      "-R",
      "127.0.0.1:18290:127.0.0.1:18290",
      "-R",
      "127.0.0.1:18291:127.0.0.1:18291",
      "debian@152.228.138.54",
    ],
    { stdio: "ignore" },
  );
  await new Promise((r) => setTimeout(r, 1500));
  step = "browser_flow";
  const output = await child(
    "ssh",
    [
      "-i",
      "/home/debian/.ssh/id_ed25519_tad_vm",
      "debian@152.228.138.54",
      "node",
      "/tmp/test-initial-access-browser.mjs",
    ],
    {
      input: JSON.stringify({
        base: "http://localhost:18291",
        identity,
        temporary,
        personal,
        hmac,
      }),
    },
  );
  console.log(output.trim());
  step = "secret_scan";
  const kcLogs = docker(["logs", "tad-initial-test-keycloak"]);
  assert.ok(
    ![temporary, personal].some(
      (s) => captured.includes(s) || kcLogs.includes(s),
    ),
  );
  console.log("isolated_log_scan_passed");
} catch (error) {
  console.log(
    JSON.stringify({
      status: "failed",
      step,
      errorType: error.name,
      diagnostics:
        captured.match(
          /SIRH_INITIAL_ACCESS_FAILURE (?:P\d{4}|INTERNAL) [a-z_]+/g,
        ) ?? [],
    }),
  );
  process.exitCode = 1;
} finally {
  portal?.kill("SIGTERM");
  tunnel?.kill("SIGTERM");
  for (const id of created.reverse()) {
    try {
      docker(["stop", "-t", "5", id]);
    } catch {}
  }
}

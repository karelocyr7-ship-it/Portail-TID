// Read-only. Run inside portal with its existing runtime environment; no env file read.
const username = process.argv[2];
if (!/^TID(?:P[SC]?|[SC])?\d{3,}$/.test(username ?? "")) process.exit(2);
try {
  const issuer = process.env.KEYCLOAK_ISSUER;
  const tokenResponse = await fetch(issuer + "/protocol/openid-connect/token", {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.KEYCLOAK_ADMIN_CLIENT_ID,
      client_secret: process.env.KEYCLOAK_ADMIN_CLIENT_SECRET,
    }),
  });
  if (!tokenResponse.ok) throw Error("authentication_failed");
  const token = (await tokenResponse.json()).access_token;
  const base = issuer.replace("/realms/", "/admin/realms/");
  const headers = { authorization: "Bearer " + token };
  const lookup = await fetch(
    base + "/users?exact=true&username=" + encodeURIComponent(username),
    { headers },
  );
  if (!lookup.ok) throw Error("lookup_failed");
  const users = await lookup.json();
  if (users.length !== 1) throw Error("identity_not_unique");
  const user = users[0];
  const response = await fetch(
    base + "/users/" + encodeURIComponent(user.id) + "/credentials",
    { headers },
  );
  if (!response.ok) throw Error("credential_metadata_unavailable");
  const credentials = await response.json();
  console.log(
    JSON.stringify({
      username,
      enabled: user.enabled,
      requiredActions: user.requiredActions,
      credentialCount: credentials.length,
      pendingWithoutCredential:
        user.enabled &&
        credentials.length === 0 &&
        user.requiredActions.includes("UPDATE_PASSWORD"),
      mutation: "none",
    }),
  );
} catch {
  console.log(
    JSON.stringify({
      username,
      status: "inspection_unavailable",
      mutation: "none",
    }),
  );
  process.exitCode = 1;
}

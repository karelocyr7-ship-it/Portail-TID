type KeycloakUser = {
  id?: string;
};

type ProvisionedKeycloakUser = {
  subject: string;
  created: boolean;
};

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value)
    throw new Error(`${name} est requis pour créer un compte Keycloak`);
  return value;
}

function adminBaseUrl(): string {
  const issuer = required("KEYCLOAK_ISSUER").replace(/\/+$/, "");
  const parsed = new URL(issuer);
  const match = parsed.pathname.match(/^(.*)\/realms\/([^/]+)$/);
  if (!match) throw new Error("KEYCLOAK_ISSUER est invalide");
  parsed.pathname = `${match[1]}/admin/realms/${encodeURIComponent(match[2])}`;
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString().replace(/\/$/, "");
}

async function getAdminToken(): Promise<string> {
  const issuer = required("KEYCLOAK_ISSUER").replace(/\/+$/, "");
  const response = await fetch(`${issuer}/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: required("KEYCLOAK_ADMIN_CLIENT_ID"),
      client_secret: required("KEYCLOAK_ADMIN_CLIENT_SECRET"),
    }),
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error("Impossible d’obtenir le jeton d’administration Keycloak");
  const payload = (await response.json()) as { access_token?: unknown };
  if (typeof payload.access_token !== "string" || !payload.access_token) {
    throw new Error(
      "Réponse Keycloak invalide lors de l’authentification d’administration",
    );
  }
  return payload.access_token;
}

function subjectFromLocation(location: string | null): string | undefined {
  if (!location) return undefined;
  const path = new URL(location, adminBaseUrl()).pathname.replace(/\/+$/, "");
  const subject = path.split("/").pop();
  return subject || undefined;
}

export async function provisionKeycloakUser(input: {
  email: string;
  displayName: string;
  employeeId?: string | null;
}): Promise<ProvisionedKeycloakUser> {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@"))
    throw new Error("Un e-mail est requis pour créer le compte Keycloak");

  const token = await getAdminToken();
  const endpoint = `${adminBaseUrl()}/users`;
  const headers = {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
  };
  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      username: email,
      email,
      enabled: true,
      emailVerified: false,
      firstName: input.displayName.trim(),
      requiredActions: ["UPDATE_PASSWORD"],
      ...(input.employeeId
        ? {
            attributes: {
              sageId: [input.employeeId],
              employeeId: [input.employeeId],
            },
          }
        : {}),
    }),
    cache: "no-store",
  });

  if (response.status === 409) {
    const existing = await fetch(
      `${endpoint}?email=${encodeURIComponent(email)}&exact=true`,
      { headers: { authorization: `Bearer ${token}` }, cache: "no-store" },
    );
    if (!existing.ok) throw new Error("Le compte Keycloak existe déjà");
    const users = (await existing.json()) as KeycloakUser[];
    const subject = users.length === 1 ? users[0]?.id : undefined;
    if (!subject)
      throw new Error(
        "Le compte Keycloak existe déjà mais son identifiant est ambigu",
      );
    return { subject, created: false };
  }

  if (response.status !== 201) {
    throw new Error(
      `Création du compte Keycloak refusée (HTTP ${response.status})`,
    );
  }
  const subject = subjectFromLocation(response.headers.get("location"));
  if (!subject)
    throw new Error("Keycloak n’a pas retourné l’identifiant du compte créé");
  return { subject, created: true };
}

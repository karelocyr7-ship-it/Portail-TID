type KeycloakUser = {
  id?: string;
  username?: string;
  requiredActions?: string[];
  attributes?: Record<string, unknown>;
  [key: string]: unknown;
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

export function adminBaseUrl(): string {
  const issuer = required("KEYCLOAK_ISSUER").replace(/\/+$/, "");
  const parsed = new URL(issuer);
  const match = parsed.pathname.match(/^(.*)\/realms\/([^/]+)$/);
  if (!match) throw new Error("KEYCLOAK_ISSUER est invalide");
  parsed.pathname = `${match[1]}/admin/realms/${encodeURIComponent(match[2])}`;
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString().replace(/\/$/, "");
}

export async function getAdminToken(): Promise<string> {
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
  deferInitialCredentials?: boolean;
}): Promise<ProvisionedKeycloakUser> {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@"))
    throw new Error("Un e-mail est requis pour créer le compte Keycloak");
  const username = input.employeeId?.trim() || email;

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
      username,
      email,
      enabled: true,
      emailVerified: false,
      firstName: input.displayName.trim(),
      requiredActions: input.deferInitialCredentials
        ? ["UPDATE_PASSWORD"]
        : ["VERIFY_EMAIL", "UPDATE_PASSWORD"],
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
    const user = users.length === 1 ? users[0] : undefined;
    const subject = user?.id;
    if (!subject)
      throw new Error(
        "Le compte Keycloak existe déjà mais son identifiant est ambigu",
      );
    const detailsResponse = await fetch(
      `${endpoint}/${encodeURIComponent(subject)}`,
      {
        headers: { authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    if (!detailsResponse.ok)
      throw new Error("Impossible de vérifier l’activation du compte Keycloak");
    const details = (await detailsResponse.json()) as KeycloakUser;
    const pendingActions = (details.requiredActions ?? []).filter((action) =>
      ["VERIFY_EMAIL", "UPDATE_PASSWORD"].includes(action),
    );
    if (pendingActions.length > 0 && !input.deferInitialCredentials)
      await sendKeycloakActionsEmail(subject, pendingActions, token);
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
  if (!input.deferInitialCredentials) {
    await sendKeycloakActionsEmail(
      subject,
      ["VERIFY_EMAIL", "UPDATE_PASSWORD"],
      token,
    );
  }
  return { subject, created: true };
}

/** Keep an already-linked Keycloak account's login name aligned with the SIRH ID. */
export async function syncKeycloakUsernameFromSirh(
  subject: string,
  employeeId: string,
): Promise<void> {
  const username = employeeId.trim().toUpperCase();
  if (!username) throw new Error("Un matricule SIRH est requis");

  const token = await getAdminToken();
  const base = adminBaseUrl();
  const headers = { authorization: `Bearer ${token}` };
  const userUrl = `${base}/users/${encodeURIComponent(subject)}`;
  const userResponse = await fetch(userUrl, { headers, cache: "no-store" });
  if (!userResponse.ok)
    throw new Error(
      `Impossible de vérifier le compte Keycloak (HTTP ${userResponse.status})`,
    );
  const user = (await userResponse.json()) as KeycloakUser;
  if (user.username === username) return;

  const collisionUrl = new URL(`${base}/users`);
  collisionUrl.searchParams.set("username", username);
  collisionUrl.searchParams.set("exact", "true");
  const collisionResponse = await fetch(collisionUrl, {
    headers,
    cache: "no-store",
  });
  if (!collisionResponse.ok)
    throw new Error(
      `Impossible de vérifier la disponibilité du matricule Keycloak (HTTP ${collisionResponse.status})`,
    );
  const collisions = (await collisionResponse.json()) as KeycloakUser[];
  if (collisions.some((candidate) => candidate.id !== subject))
    throw new Error("Le matricule SIRH est déjà utilisé par un autre compte");

  const attributes =
    user.attributes && typeof user.attributes === "object"
      ? user.attributes
      : {};
  const updateResponse = await fetch(userUrl, {
    method: "PUT",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({
      ...user,
      username,
      attributes: {
        ...attributes,
        sageId: [username],
        employeeId: [username],
      },
    }),
    cache: "no-store",
  });
  if (!updateResponse.ok)
    throw new Error(
      `Mise à jour de l’identifiant Keycloak refusée (HTTP ${updateResponse.status})`,
    );
}

async function sendKeycloakActionsEmail(
  subject: string,
  actions: string[],
  token: string,
): Promise<void> {
  const endpoint = `${adminBaseUrl()}/users/${encodeURIComponent(subject)}/execute-actions-email`;
  const url = new URL(endpoint);
  url.searchParams.set("lifespan", "1800");
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(actions),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(
      `Envoi du lien d’activation Keycloak refusé (HTTP ${response.status})`,
    );
  }
}

export async function sendKeycloakPasswordReset(
  subject: string,
): Promise<void> {
  const normalizedSubject = subject.trim();
  if (!normalizedSubject || normalizedSubject.length > 200) {
    throw new Error("Identifiant Keycloak invalide");
  }

  await sendKeycloakActionsEmail(
    normalizedSubject,
    ["UPDATE_PASSWORD"],
    await getAdminToken(),
  );
}

/** End every active Keycloak session for a user and notify configured OIDC clients. */
export async function logoutKeycloakUser(subject: string): Promise<void> {
  const normalizedSubject = subject.trim();
  if (!normalizedSubject || normalizedSubject.length > 200) {
    throw new Error("Identifiant Keycloak invalide");
  }

  const token = await getAdminToken();
  const response = await fetch(
    `${adminBaseUrl()}/users/${encodeURIComponent(normalizedSubject)}/logout`,
    {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  if (!response.ok) {
    throw new Error(`Déconnexion Keycloak refusée (HTTP ${response.status})`);
  }
}

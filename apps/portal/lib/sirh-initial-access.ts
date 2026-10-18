import { adminBaseUrl, getAdminToken } from "./keycloak-admin";

export type InitialIdentity = {
  sageId: string;
  email?: string;
  firstName: string;
  lastName: string;
};
type User = {
  id: string;
  username: string;
  enabled: boolean;
  requiredActions?: string[];
};
type Credential = { type: string };
export type InitialOperation = {
  operationId: string;
  generation: number;
  allowPendingExisting: boolean;
};

export class InitialAccessError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

/** Never include a request/response body in a diagnostic: it may contain a credential. */
export async function initializeSirhAccess(
  identity: InitialIdentity,
  password: string | undefined,
  expectedSubject?: string,
  operation?: InitialOperation,
) {
  const token = await getAdminToken();
  const base = adminBaseUrl();
  const headers = {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
  };
  if (operation) {
    if (!password) throw new InitialAccessError("INITIAL_PASSWORD_REQUIRED");
    const issuer = process.env.KEYCLOAK_ISSUER?.replace(/\/+$/, "");
    if (!issuer)
      throw new InitialAccessError("IDENTITY_CONFIGURATION_UNAVAILABLE");
    const response = await fetch(`${issuer}/tad-initial-access`, {
      method: "POST",
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(45000),
      body: JSON.stringify({
        ...identity,
        ...operation,
        temporaryPassword: password,
        expectedSubject,
      }),
    });
    let outcome;
    try {
      outcome = await response.json();
    } catch {
      throw new InitialAccessError("ATOMIC_INITIAL_ACCESS_UNAVAILABLE");
    }
    const statuses = [
      "READY",
      "EXISTING_CREDENTIAL_PROTECTED",
      "DISABLED",
      "REVIEW_REQUIRED",
      "OPERATION_CONFLICT",
    ];
    if (
      !statuses.includes(outcome.status) ||
      ![200, 409].includes(response.status)
    )
      throw new InitialAccessError("ATOMIC_INITIAL_ACCESS_UNAVAILABLE");
    if (
      typeof outcome.subject !== "string" ||
      !/^[a-f0-9-]{36}$/i.test(outcome.subject)
    )
      throw new InitialAccessError("IDENTITY_CONFLICT");
    if (expectedSubject && outcome.subject !== expectedSubject)
      throw new InitialAccessError("IDENTITY_CONFLICT");
    return { status: String(outcome.status), subject: String(outcome.subject) };
  }
  const call = (path: string, options: RequestInit = {}) =>
    fetch(`${base}${path}`, {
      ...options,
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
  const lookup = await call(
    `/users?username=${encodeURIComponent(identity.sageId)}&exact=true`,
  );
  if (!lookup.ok) throw new InitialAccessError("IDENTITY_LOOKUP_UNAVAILABLE");
  const matches = (await lookup.json()) as User[];
  if (matches.length > 1) throw new InitialAccessError("IDENTITY_CONFLICT");
  const user = matches[0];
  if (expectedSubject && user?.id !== expectedSubject)
    throw new InitialAccessError("IDENTITY_CONFLICT");
  if (!user) {
    if (!password) return { status: "NOT_INITIALIZED", subject: null };
    const created = await call("/users", {
      method: "POST",
      body: JSON.stringify({
        username: identity.sageId,
        email: identity.email,
        firstName: identity.firstName,
        lastName: identity.lastName,
        enabled: true,
        emailVerified: false,
        requiredActions: ["UPDATE_PASSWORD"],
        attributes: {
          sageId: [identity.sageId],
          employeeId: [identity.sageId],
        },
        credentials: [{ type: "password", value: password, temporary: true }],
      }),
    });
    if (created.status !== 201)
      throw new InitialAccessError("IDENTITY_CREATION_REFUSED");
    const location = created.headers.get("location");
    const subject = location
      ? new URL(location, base).pathname.split("/").pop()
      : null;
    if (!subject) throw new InitialAccessError("INITIALIZATION_UNCERTAIN");
    return { status: "READY", subject };
  }
  const subject = user.id;
  const endpoint = `/users/${encodeURIComponent(subject)}`;
  const credentialsResponse = await call(`${endpoint}/credentials`);
  if (!credentialsResponse.ok)
    throw new InitialAccessError("CREDENTIAL_STATE_UNAVAILABLE");
  const credentials = (await credentialsResponse.json()) as Credential[];
  if (!user.enabled) return { status: "DISABLED", subject };
  if (credentials.length) {
    // UPDATE_PASSWORD alone is NOT proof that a personal password never existed.
    // Fail closed, including for an unknown outcome of a previous network request.
    return { status: "EXISTING_CREDENTIAL_PROTECTED", subject };
  }
  if (!user.requiredActions?.includes("UPDATE_PASSWORD")) {
    return { status: "REVIEW_REQUIRED", subject };
  }
  if (!password) return { status: "PENDING_NO_CREDENTIAL", subject };

  // Admin REST reset-password has no conditional-write precondition. A separate
  // credential check cannot exclude a concurrent native password activation.
  // Never overwrite a legacy account until an atomic recovery path is available.
  return { status: "REVIEW_REQUIRED", subject };
}

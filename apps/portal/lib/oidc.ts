import {
  createHmac,
  createPublicKey,
  randomUUID,
  timingSafeEqual,
  verify,
} from "node:crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "tad_portal_session";
const STATE_COOKIE = "tad_oidc_state";
const SESSION_MAX_AGE = 8 * 60 * 60;

type OidcConfiguration = {
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  issuer: string;
};

export type PortalSession = {
  subject: string;
  name?: string;
  username?: string;
  roles: string[];
  groups: string[];
  expiresAt: number;
};

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function base64url(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

function sign(value: string): string {
  return base64url(
    createHmac("sha256", required("SESSION_SECRET")).update(value).digest(),
  );
}

function pack(value: string): string {
  return `${base64url(value)}.${sign(value)}`;
}

function unpack(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) return undefined;
  const decoded = Buffer.from(encoded, "base64url").toString("utf8");
  const expected = sign(decoded);
  if (signature.length !== expected.length) return undefined;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected)))
    return undefined;
  return decoded;
}

export function publicUrl(): string {
  return required("PORTAL_PUBLIC_URL").replace(/\/$/, "");
}

function issuer(): string {
  return required("KEYCLOAK_ISSUER").replace(/\/$/, "");
}

async function configuration(): Promise<OidcConfiguration> {
  const response = await fetch(`${issuer()}/.well-known/openid-configuration`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("OIDC discovery failed");
  return (await response.json()) as OidcConfiguration;
}

export function callbackUrl(): string {
  return `${publicUrl()}/api/auth/callback`;
}

export async function authorizationUrl(): Promise<{
  url: string;
  state: string;
}> {
  const oidc = await configuration();
  const state = base64url(`${randomUUID()}:${Date.now()}`);
  const url = new URL(oidc.authorization_endpoint);
  url.searchParams.set("client_id", required("KEYCLOAK_CLIENT_ID"));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("redirect_uri", callbackUrl());
  url.searchParams.set("state", state);
  return { url: url.toString(), state };
}

export async function exchangeCode(code: string): Promise<PortalSession> {
  const oidc = await configuration();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: required("KEYCLOAK_CLIENT_ID"),
    client_secret: required("KEYCLOAK_CLIENT_SECRET"),
    code,
    redirect_uri: callbackUrl(),
  });
  const response = await fetch(oidc.token_endpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!response.ok) throw new Error("OIDC token exchange failed");
  const token = (await response.json()) as { id_token?: string };
  if (!token.id_token)
    throw new Error("OIDC response did not contain an ID token");
  return verifyIdToken(token.id_token, oidc);
}

async function verifyIdToken(
  token: string,
  oidc: OidcConfiguration,
): Promise<PortalSession> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid ID token");
  const header = JSON.parse(
    Buffer.from(parts[0], "base64url").toString("utf8"),
  ) as { alg?: string; kid?: string };
  if (header.alg !== "RS256" || !header.kid)
    throw new Error("Unsupported ID token");
  const jwksResponse = await fetch(oidc.jwks_uri, { cache: "no-store" });
  if (!jwksResponse.ok) throw new Error("OIDC JWKS request failed");
  const jwks = (await jwksResponse.json()) as {
    keys: Array<Record<string, unknown>>;
  };
  const jwk = jwks.keys.find(
    (key) => key.kid === header.kid && key.kty === "RSA",
  );
  if (!jwk) throw new Error("OIDC signing key not found");
  const valid = verify(
    "RSA-SHA256",
    Buffer.from(`${parts[0]}.${parts[1]}`),
    createPublicKey({ key: jwk as any, format: "jwk" }),
    Buffer.from(parts[2], "base64url"),
  );
  if (!valid) throw new Error("Invalid ID token signature");
  const claims = JSON.parse(
    Buffer.from(parts[1], "base64url").toString("utf8"),
  ) as Record<string, unknown>;
  if (
    claims.iss !== oidc.issuer ||
    claims.aud !== required("KEYCLOAK_CLIENT_ID")
  )
    throw new Error("Invalid ID token issuer or audience");
  const expiresAt = typeof claims.exp === "number" ? claims.exp : 0;
  if (expiresAt <= Math.floor(Date.now() / 1000))
    throw new Error("Expired ID token");
  const realmRoles = ((claims.realm_access as { roles?: unknown } | undefined)
    ?.roles ?? []) as unknown[];
  return {
    subject: String(claims.sub ?? ""),
    name: typeof claims.name === "string" ? claims.name : undefined,
    username:
      typeof claims.preferred_username === "string"
        ? claims.preferred_username
        : undefined,
    roles: realmRoles.filter(
      (role): role is string => typeof role === "string",
    ),
    groups: Array.isArray(claims.groups)
      ? claims.groups.filter(
          (group): group is string => typeof group === "string",
        )
      : [],
    expiresAt,
  };
}

export async function setStateCookie(state: string): Promise<void> {
  (await cookies()).set(STATE_COOKIE, pack(state), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
}

export async function consumeStateCookie(state: string): Promise<boolean> {
  const store = await cookies();
  const expected = unpack(store.get(STATE_COOKIE)?.value);
  store.delete(STATE_COOKIE);
  return Boolean(expected && expected === state);
}

export async function setSession(session: PortalSession): Promise<void> {
  const value = JSON.stringify({
    ...session,
    expiresAt: Math.min(
      session.expiresAt,
      Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
    ),
  });
  (await cookies()).set(SESSION_COOKIE, pack(value), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function getSession(): Promise<PortalSession | undefined> {
  const raw = unpack((await cookies()).get(SESSION_COOKIE)?.value);
  if (!raw) return undefined;
  try {
    const session = JSON.parse(raw) as PortalSession;
    return session.expiresAt > Math.floor(Date.now() / 1000) && session.subject
      ? session
      : undefined;
  } catch {
    return undefined;
  }
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export function getRoles(session: PortalSession | undefined): string[] {
  if (session) return session.roles;
  if (process.env.NODE_ENV !== "development") return [];
  return (process.env.PORTAL_DEMO_ROLES ?? "DIRECTION")
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);
}

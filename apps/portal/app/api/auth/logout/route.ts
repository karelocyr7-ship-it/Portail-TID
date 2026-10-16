import { logoutKeycloakUser } from "@/lib/keycloak-admin";
import { clearSession, getSession, logoutUrl, publicUrl } from "@/lib/oidc";
import { getPrisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const requestOrigin = request.headers.get("origin");
  if (!requestOrigin || requestOrigin !== new URL(publicUrl()).origin) {
    return new Response("Forbidden", { status: 403 });
  }

  const session = await getSession();
  await clearSession();

  let keycloakSessionsRevoked = false;
  if (session?.subject) {
    try {
      await logoutKeycloakUser(session.subject);
      keycloakSessionsRevoked = true;
    } catch {
      // Continue with browser-based OIDC logout if the admin API is unavailable.
    }

    try {
      await getPrisma().auditLog.create({
        data: {
          userId: session.subject,
          eventType: "GLOBAL_LOGOUT",
          entityType: "application_sessions",
          entityId: session.subject,
          afterData: { keycloakSessionsRevoked },
        },
      });
    } catch {
      // Logging must not prevent the user from ending the portal session.
    }
  }

  try {
    const providerLogoutUrl = await logoutUrl({
      userSessionsRevoked: keycloakSessionsRevoked,
    });
    if (providerLogoutUrl) return Response.redirect(providerLogoutUrl, 303);
  } catch {
    // La déconnexion locale reste valable si Keycloak est momentanément indisponible.
  }
  const completionUrl = new URL("/api/auth/logout/complete", publicUrl());
  completionUrl.searchParams.set(
    "state",
    keycloakSessionsRevoked ? "global-revoked" : "global-unconfirmed",
  );
  return Response.redirect(completionUrl, 303);
}

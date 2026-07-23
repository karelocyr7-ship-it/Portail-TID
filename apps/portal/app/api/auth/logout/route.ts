import { clearSession, logoutUrl, publicUrl } from "@/lib/oidc";

export async function GET() {
  await clearSession();
  try {
    const providerLogoutUrl = await logoutUrl();
    if (providerLogoutUrl) return Response.redirect(providerLogoutUrl);
  } catch {
    // La déconnexion locale reste valable si Keycloak est momentanément indisponible.
  }
  return Response.redirect(new URL("/api/auth/logout/complete", publicUrl()));
}

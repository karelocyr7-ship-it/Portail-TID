import { authorizationUrl, clearSession, setOidcCookies } from "@/lib/oidc";

export const runtime = "nodejs";

export async function GET() {
  await clearSession();
  const { url, state, nonce } = await authorizationUrl({ prompt: "login" });
  await setOidcCookies(state, nonce);
  return Response.redirect(url);
}

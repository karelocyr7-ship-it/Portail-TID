import { authorizationUrl, setOidcCookies } from "@/lib/oidc";

export const runtime = "nodejs";

export async function GET() {
  const { url, state, nonce } = await authorizationUrl();
  await setOidcCookies(state, nonce);
  return Response.redirect(url);
}

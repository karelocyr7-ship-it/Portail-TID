import { authorizationUrl, setStateCookie } from "@/lib/oidc";

export const runtime = "nodejs";

export async function GET() {
  const { url, state } = await authorizationUrl();
  await setStateCookie(state);
  return Response.redirect(url);
}

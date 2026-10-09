import {
  consumeStateCookie,
  exchangeCode,
  consumeNonceCookie,
  publicUrl,
  setSession,
} from "@/lib/oidc";
import { reconcilePortalUserSubject } from "@/lib/portal-users";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || !(await consumeStateCookie(state)))
    return Response.json(
      { error: "Échec de la validation OIDC" },
      { status: 400 },
    );
  const nonce = await consumeNonceCookie();
  if (!nonce)
    return Response.json(
      { error: "Échec de la validation OIDC" },
      { status: 400 },
    );
  try {
    const session = await exchangeCode(code, nonce);
    await reconcilePortalUserSubject(session);
    await setSession(session);
    return Response.redirect(new URL("/", publicUrl()));
  } catch {
    return Response.json(
      { error: "La connexion au portail a échoué" },
      { status: 502 },
    );
  }
}

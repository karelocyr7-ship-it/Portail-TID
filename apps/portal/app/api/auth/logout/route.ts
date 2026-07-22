import { clearSession } from "@/lib/oidc";

export async function GET(request: Request) {
  await clearSession();
  return Response.redirect(new URL("/", request.url));
}

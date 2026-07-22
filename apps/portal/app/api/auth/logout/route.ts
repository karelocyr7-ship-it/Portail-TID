import { clearSession, publicUrl } from "@/lib/oidc";

export async function GET() {
  await clearSession();
  return Response.redirect(new URL("/", publicUrl()));
}

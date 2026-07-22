import { getVisibleApplicationsFromDatabase } from "@/lib/catalog-db";
import { getRoles, getSession } from "@/lib/oidc";

export async function GET() {
  const roles = getRoles(await getSession());
  return Response.json(
    { data: await getVisibleApplicationsFromDatabase(roles) },
    { headers: { "cache-control": "no-store" } },
  );
}
